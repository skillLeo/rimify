<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals\Entry;

use App\Enums\Axle;
use App\Enums\VehicleSource;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\DocumentCarEntry;
use App\Models\DocumentCarEntryCode;
use App\Models\DocumentTyreLine;
use App\Models\DocumentTyreLineCode;
use App\Models\DocumentWheelCombination;
use App\Models\DocumentWheelSize;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Services\Admin\Approvals\FitmentRows;
use App\Services\Admin\AuditTrail;
use App\Support\VehicleName;
use Illuminate\Support\Facades\DB;

/**
 * What staff do in the five steps, each step saved as it happens (the Gutachten rework §7: „draft autosave on every
 * change“), in a transaction with the rows it changes: build the paper's wheel combinations, tick cars, enter a car's lines per
 * combination, copy them to other cars of the same combination. Each leaves its entry in the Protokoll, as the row form did.
 *
 * @phpstan-type LineInput array{id: int|null, front: string, rear: string, kw_min: int|null, kw_max: int|null, codes: list<string>}
 * @phpstan-type CodeInput array{code: string, note: string|null}
 */
final readonly class EntryEditor
{
    public function __construct(private DocumentEntryWriter $writer) {}

    /**
     * What the paper itself prints for its wheel: only ever compared with the versions chosen, for a warning. Said once per person and
     * quarter of an hour in the Protokoll, as a car's lines are.
     *
     * @param  list<array{type: string|null, width: float|null, diameter: float|null, et: int|null, holes: int|null, circle: float|null, unread: array<string, string>}>  $printed
     */
    public function savePrinted(ApprovalDocument $document, array $printed, AdminUser $admin): void
    {
        DB::transaction(function () use ($document, $printed, $admin): void {
            $document->forceFill(['printed_wheels' => $printed === [] ? null : $printed])->save();

            $said = AuditLog::query()->where('description', 'approval.printed_wheels')->where('causer_id', $admin->id)->where('subject_id', $document->id)
                ->where('created_at', '>=', now()->subMinutes(15))->exists();

            if (! $said) {
                AuditTrail::record($admin, 'approval.printed_wheels', ['document' => FitmentRows::label($document), 'rows' => count($printed)], $document);
            }
        });
    }

    /**
     * A wheel combination: a front and a rear version, each found by its dimension, colour playing no part. Every car on the paper gets
     * its cell in it, empty.
     */
    public function addCombination(ApprovalDocument $document, WheelConfig $front, WheelConfig $rear, AdminUser $admin): DocumentWheelCombination
    {
        return DB::transaction(function () use ($document, $front, $rear, $admin): DocumentWheelCombination {
            $combination = DocumentWheelCombination::query()->create([
                'approval_document_id' => $document->id,
                'front_wheel_size_id' => self::versionOf($document, $front)->id,
                'rear_wheel_size_id' => self::versionOf($document, $rear)->id,
                'position' => (int) DocumentWheelCombination::query()->where('approval_document_id', $document->id)->max('position') + 1,
            ]);
            $cars = DocumentCarEntry::query()->where('approval_document_id', $document->id)->distinct()->pluck('vehicle_id')->map(static fn (mixed $id): int => (int) $id)->all();
            $position = (int) DocumentCarEntry::query()->where('approval_document_id', $document->id)->max('position');

            foreach ($cars as $vehicleId) {
                self::cell($document, $combination, $vehicleId, ++$position);
            }

            $this->writer->write($document, $admin);

            AuditTrail::record($admin, 'approval.combination_added', ['document' => FitmentRows::label($document), 'combination' => EntryView::combinationLabel($combination)], $document);

            return $combination;
        });
    }

    /**
     * Other versions in a combination: its cars' lines go with it. The same two versions with the axles exchanged take the tyres with
     * them, or every line would stand on the wrong wheel. Other versions leave the lines as they are: a tyre that no longer fits is said
     * at its line, and the release waits for it.
     */
    public function changeCombination(ApprovalDocument $document, DocumentWheelCombination $combination, WheelConfig $front, WheelConfig $rear, AdminUser $admin): void
    {
        DB::transaction(function () use ($document, $combination, $front, $rear, $admin): void {
            $before = EntryView::combinationLabel($combination);
            $newFront = (int) self::versionOf($document, $front)->id;
            $newRear = (int) self::versionOf($document, $rear)->id;
            $swapped = $newFront !== $newRear && $newFront === (int) $combination->rear_wheel_size_id && $newRear === (int) $combination->front_wheel_size_id;

            $combination->forceFill(['front_wheel_size_id' => $newFront, 'rear_wheel_size_id' => $newRear])->save();

            if ($swapped) {
                self::swapSides($combination);
            }
            $combination->unsetRelations();
            self::dropUnused($document);
            $this->writer->write($document, $admin);

            AuditTrail::record($admin, 'approval.combination_changed', ['document' => FitmentRows::label($document), 'from' => $before, 'combination' => EntryView::combinationLabel($combination)], $document);
        });
    }

    /** A combination taken off the paper, its cells with it. A car left with no cell is off the paper. */
    public function removeCombination(ApprovalDocument $document, DocumentWheelCombination $combination, AdminUser $admin): void
    {
        DB::transaction(function () use ($document, $combination, $admin): void {
            $label = EntryView::combinationLabel($combination);
            $combination->delete();
            self::dropUnused($document);
            $this->writer->write($document, $admin);

            AuditTrail::record($admin, 'approval.combination_removed', ['document' => FitmentRows::label($document), 'combination' => $label], $document);
        });
    }

    /**
     * Ticks cars onto the paper: each gets a cell in every wheel combination. A car already there stays as it is: nothing it has is
     * lost. Nothing stands for a group, and nothing joins by itself later: every car here was chosen.
     *
     * @param  list<int>  $vehicleIds
     * @return int the cars added
     */
    public function addCars(ApprovalDocument $document, array $vehicleIds, AdminUser $admin): int
    {
        return DB::transaction(function () use ($document, $vehicleIds, $admin): int {
            $there = DocumentCarEntry::query()->where('approval_document_id', $document->id)->whereIn('vehicle_id', $vehicleIds)->pluck('vehicle_id')->map(static fn (mixed $id): int => (int) $id)->all();
            $new = array_values(array_diff($vehicleIds, $there));
            $position = (int) DocumentCarEntry::query()->where('approval_document_id', $document->id)->max('position');
            $combinations = DocumentWheelCombination::query()->where('approval_document_id', $document->id)->orderBy('position')->orderBy('id')->get();

            foreach ($new as $vehicleId) {
                foreach ($combinations as $combination) {
                    self::cell($document, $combination, $vehicleId, ++$position);
                }
            }

            if ($new !== []) {
                $this->writer->write($document, $admin, $new);

                AuditTrail::record($admin, 'approval.cars_added', ['document' => FitmentRows::label($document), 'cars' => count($new)], $document);
            }

            return count($new);
        });
    }

    /** A car's cell in a combination, back or for the first time. */
    public function addCell(ApprovalDocument $document, DocumentWheelCombination $combination, int $vehicleId, AdminUser $admin): void
    {
        DB::transaction(function () use ($document, $combination, $vehicleId, $admin): void {
            $position = (int) DocumentCarEntry::query()->where('approval_document_id', $document->id)->max('position') + 1;
            $entry = self::cell($document, $combination, $vehicleId, $position);
            $this->writer->write($document, $admin, [$vehicleId]);

            AuditTrail::record($admin, 'approval.cell_added', ['document' => FitmentRows::label($document), 'car' => self::carName($entry), 'combination' => EntryView::combinationLabel($combination)], $document);
        });
    }

    /** „Gilt nicht für dieses Fahrzeug“: one car out of one combination; its other cells stay. */
    public function removeCell(ApprovalDocument $document, DocumentCarEntry $entry, AdminUser $admin): void
    {
        DB::transaction(function () use ($document, $entry, $admin): void {
            /** @var DocumentWheelCombination $combination */
            $combination = $entry->combination;
            $vehicleId = $entry->vehicle_id;
            $name = self::carName($entry);
            $label = EntryView::combinationLabel($combination);
            $entry->delete();
            $this->writer->write($document, $admin, [$vehicleId]);

            AuditTrail::record($admin, 'approval.cell_removed', ['document' => FitmentRows::label($document), 'car' => $name, 'combination' => $label], $document);
        });
    }

    private static function cell(ApprovalDocument $document, DocumentWheelCombination $combination, int $vehicleId, int $position): DocumentCarEntry
    {
        return DocumentCarEntry::query()->create([
            'approval_document_id' => $document->id,
            'document_wheel_combination_id' => $combination->id,
            'vehicle_id' => $vehicleId,
            'axle' => Axle::All->value,
            'position' => $position,
        ]);
    }

    /** Every line of a combination, front and rear exchanged, whatever is typed on each side. */
    private static function swapSides(DocumentWheelCombination $combination): void
    {
        $lines = DocumentTyreLine::query()->whereIn('document_car_entry_id', DocumentCarEntry::query()->where('document_wheel_combination_id', $combination->id)->select('id'))->get();

        foreach ($lines as $line) {
            $attributes = [];

            foreach (['width_mm', 'aspect', 'diameter_in', 'load_index', 'load_index_dual', 'speed_symbol', 'marker', 'unread'] as $column) {
                $attributes["front_{$column}"] = $line->getRawOriginal("rear_{$column}");
                $attributes["rear_{$column}"] = $line->getRawOriginal("front_{$column}");
            }

            $line->forceFill($attributes)->save();
        }
    }

    /** The paper's version of this dimension, made the first time a combination names it. */
    private static function versionOf(ApprovalDocument $document, WheelConfig $config): DocumentWheelSize
    {
        $dimension = array_intersect_key($config->getAttributes(), array_flip(DocumentWheelSize::DIMENSION));
        $query = DocumentWheelSize::query()->where('approval_document_id', $document->id);

        foreach ($dimension as $column => $value) {
            $query->where($column, $value);
        }

        return $query->first() ?? DocumentWheelSize::query()->create(['approval_document_id' => $document->id, ...$dimension]);
    }

    private static function dropUnused(ApprovalDocument $document): void
    {
        $used = DB::table('document_wheel_combinations')->where('approval_document_id', $document->id)->get(['front_wheel_size_id', 'rear_wheel_size_id'])
            ->flatMap(static fn (object $row): array => [(int) $row->front_wheel_size_id, (int) $row->rear_wheel_size_id])->unique()->all();

        DocumentWheelSize::query()->where('approval_document_id', $document->id)->whereNotIn('id', $used)->delete();
    }

    /** Takes a car off the paper, every cell of it, its lines and rows with it. */
    public function removeCar(ApprovalDocument $document, DocumentCarEntry $entry, AdminUser $admin): void
    {
        DB::transaction(function () use ($document, $entry, $admin): void {
            $vehicleId = $entry->vehicle_id;
            $name = self::carName($entry);
            DocumentCarEntry::query()->where('approval_document_id', $document->id)->where('vehicle_id', $vehicleId)->delete();
            $this->writer->write($document, $admin, [$vehicleId]);

            AuditTrail::record($admin, 'approval.car_removed', ['document' => FitmentRows::label($document), 'car' => $name], $document);
        });
    }

    /**
     * One car's lines, its general codes, its page and what its row says beside them. The general codes are the car's (D-452):
     * changed here, every wheel combination of the car and every car of its HSN/TSN says them — and only where this form changed
     * them, so a save of the lines alone never puts back what another combination's form changed meanwhile.
     *
     * @param  list<LineInput>  $lines
     * @param  list<CodeInput>  $codes
     * @param  array<string, mixed>  $columns  only the columns the form sent
     * @param  list<CodeInput>|null  $cellCodes  this combination's own codes from before the five steps; null where the form shows none
     */
    public function saveCar(DocumentCarEntry $entry, array $lines, array $codes, array $columns, AdminUser $admin, bool $codesChanged = true, ?array $cellCodes = null): void
    {
        DB::transaction(function () use ($entry, $lines, $codes, $columns, $admin, $codesChanged, $cellCodes): void {
            $this->applyColumns($entry, $columns, $admin);
            $entry->forceFill(['copied_from_id' => null])->save();
            $cars = [(int) $entry->vehicle_id];

            if ($codesChanged && CarCodes::unique($codes) !== CarCodes::of($entry)) {
                CarCodes::put($entry, $codes);
                $cars = CarCodes::vehiclesSharing($entry);
            }

            // This combination's own codes from before the five steps, where the form sends them (D-452).
            if ($cellCodes !== null) {
                $entry->codes()->delete();

                foreach (CarCodes::unique($cellCodes) as $code) {
                    DocumentCarEntryCode::query()->create(['document_car_entry_id' => $entry->id, 'code' => $code['code'], 'note_de' => $code['note']]);
                }
            }

            $this->replaceLines($entry, $lines);

            /** @var ApprovalDocument $document */
            $document = $entry->document;
            $this->writer->write($document, $admin, $cars);

            // Saved at every pause in the typing: the Protokoll says it once per car, person and quarter of an hour, or a paper of a
            // hundred cars would bury everything else there.
            $said = AuditLog::query()->where('description', 'approval.car_entered')
                ->where('causer_id', $admin->id)
                ->where('subject_id', $document->id)
                ->where('properties->entry', $entry->id)
                ->where('created_at', '>=', now()->subMinutes(15))
                ->exists();

            if (! $said) {
                AuditTrail::record($admin, 'approval.car_entered', [
                    'document' => FitmentRows::label($document),
                    'car' => self::carName($entry),
                    'entry' => $entry->id,
                ], $document);
            }
        });
    }

    /**
     * „Kopieren nach …“: one car's lines and general codes onto other cars, replacing theirs or added to them. Each target
     * keeps its own page, and says where its lines came from until someone edits them.
     *
     * @param  list<int>  $targetIds
     * @return array{cars: int, lines: int}
     */
    public function copy(DocumentCarEntry $source, array $targetIds, bool $replace, AdminUser $admin, bool $dryRun = false): array
    {
        $result = ['cars' => 0, 'lines' => 0];

        DB::transaction(function () use ($source, $targetIds, $replace, $admin, $dryRun, &$result): void {
            $source->loadMissing(['lines.codes', 'codes', 'vehicle']);
            /** @var ApprovalDocument $document */
            $document = $source->document;
            // Only the same wheel combination: another's tyres may not fit its wheels.
            $targets = DocumentCarEntry::query()->with(['lines', 'codes', 'vehicle'])->where('approval_document_id', $document->id)->where('document_wheel_combination_id', $source->document_wheel_combination_id)
                ->whereIn('id', $targetIds)->whereKeyNot($source->id)->get();

            foreach ($targets as $target) {
                $there = $replace ? [] : $target->lines->mapWithKeys(static fn (DocumentTyreLine $line): array => [self::lineIdentity($line) => $line])->all();
                $position = $replace ? 0 : ((int) $target->lines->max('position')) + 1;
                $new = 0;

                if ($replace && ! $dryRun) {
                    $target->lines()->delete();
                }

                foreach ($source->lines as $line) {
                    if ($line->unread()) {
                        continue;
                    }

                    // The same combination already there: it keeps its own codes and takes the copied ones too (D-451) — a code is
                    // the combination's, and „hinzufügen“ never drops one.
                    if (isset($there[self::lineIdentity($line)])) {
                        if (! $dryRun) {
                            foreach ($line->codes as $code) {
                                DocumentTyreLineCode::query()->firstOrCreate(['document_tyre_line_id' => $there[self::lineIdentity($line)]->id, 'code' => $code->code]);
                            }
                        }

                        continue;
                    }

                    $new++;

                    if (! $dryRun) {
                        $copy = DocumentTyreLine::query()->create([
                            ...$line->only(array_values(array_filter((new DocumentTyreLine)->getFillable(), static fn (string $f): bool => ! str_starts_with($f, 'list_') && $f !== 'in_list' && $f !== 'position' && $f !== 'document_car_entry_id'))),
                            'document_car_entry_id' => $target->id,
                            'position' => $position++,
                            // Typed for this car now, whatever it was on the other: an axle-load cap on it is read against this car.
                            'from_rows' => false,
                        ]);

                        foreach ($line->codes as $code) {
                            DocumentTyreLineCode::query()->create(['document_tyre_line_id' => $copy->id, 'code' => $code->code]);
                        }
                    }
                }

                if (! $dryRun) {
                    // The car's general codes (D-452): the source car's, in place of the target car's or beside them.
                    if (CarCodes::keyOfEntry($target) !== CarCodes::keyOfEntry($source)) {
                        CarCodes::put($target, $replace ? CarCodes::of($source) : CarCodes::unique([...CarCodes::of($target), ...CarCodes::of($source)]));
                    }

                    // A combination's own codes from before the five steps go with its lines, as before.
                    if ($replace) {
                        $target->codes()->delete();
                    }

                    $have = $replace ? [] : $target->codes->pluck('code')->all();

                    foreach ($source->codes as $code) {
                        if (! in_array($code->code, $have, true)) {
                            DocumentCarEntryCode::query()->create(['document_car_entry_id' => $target->id, 'code' => $code->code, 'note_de' => $code->note_de]);
                        }
                    }

                    $target->forceFill(['copied_from_id' => $source->id])->save();
                }

                $result['cars']++;
                $result['lines'] += $new;
            }

            if (! $dryRun && $targets->isNotEmpty()) {
                // Each target car's rows, and those of every car that shares its general codes by HSN/TSN (D-452).
                $cars = $targets->flatMap(static fn (DocumentCarEntry $target): array => CarCodes::vehiclesSharing($target))->unique()->values()->all();
                $this->writer->write($document, $admin, $cars);

                AuditTrail::record($admin, 'approval.lines_copied', [
                    'document' => FitmentRows::label($document),
                    'from' => self::carName($source),
                    'cars' => $result['cars'],
                    'lines' => $result['lines'],
                    'replace' => $replace,
                ], $document);
            }
        });

        return $result;
    }

    /**
     * „Daten geprüft“ (the Gutachten rework §7, step 5): a person says a car's data is right, by name and on the record. From
     * then on the car has an authoritative source (VehicleSource), which a release asks of every car it names.
     */
    public function confirmCar(ApprovalDocument $document, Vehicle $car, AdminUser $admin): void
    {
        DB::transaction(function () use ($document, $car, $admin): void {
            $before = $car->getAttribute('source');
            $car->forceFill(['source' => VehicleSource::ManuellGeprueft->value])->save();

            AuditTrail::record($admin, 'vehicle.confirmed_by_hand', [
                'vehicle' => VehicleName::from($car),
                'document' => FitmentRows::label($document),
                'from' => $before,
            ], $car);
        });
    }

    /** What makes two lines the same line for „hinzufügen“: their sizes, figures and band. */
    private static function lineIdentity(DocumentTyreLine $line): string
    {
        $side = static fn (string $name): string => implode('/', [
            $line->getAttribute("{$name}_width_mm"), $line->getAttribute("{$name}_aspect"), number_format((float) $line->getAttribute("{$name}_diameter_in"), 1, '.', ''),
            $line->getAttribute("{$name}_load_index"), $line->getAttribute("{$name}_speed_symbol"),
        ]);

        return $side('front').'|'.$side('rear').'|'.$line->kw_min.'|'.$line->kw_max;
    }

    /** @param array<string, mixed> $columns */
    private function applyColumns(DocumentCarEntry $entry, array $columns, AdminUser $admin): void
    {
        if (array_key_exists('entry_override', $columns)) {
            $override = $columns['entry_override'];
            $reason = $columns['entry_override_reason'] ?? null;
            $changed = $entry->entry_override !== $override || $entry->entry_override_reason !== $reason;

            if ($override === null) {
                $columns += ['entry_override_by' => null, 'entry_override_at' => null];
                $columns['entry_override_reason'] = null;
            } elseif ($changed) {
                $columns['entry_override_by'] = $admin->id;
                $columns['entry_override_at'] = now();
            }

            // Who said otherwise than the codes, and why, is its own entry in the Protokoll.
            if ($changed) {
                /** @var ApprovalDocument $document */
                $document = $entry->document;

                AuditTrail::record($admin, 'approval.entry_overridden', [
                    'document' => FitmentRows::label($document),
                    'car' => self::carName($entry),
                    'override' => $override,
                    'reason' => $columns['entry_override_reason'] ?? null,
                ], $document);
            }
        }

        if ($columns !== []) {
            $entry->forceFill($columns)->save();
        }
    }

    /**
     * The lines as sent: a line that came with its id stays that line. What it remembers of an older list goes the moment its
     * sizes change: it is a new pair then. A side that does not read is kept as typed — nothing typed is lost — and writes
     * nothing until it reads.
     *
     * @param  list<LineInput>  $lines
     */
    private function replaceLines(DocumentCarEntry $entry, array $lines): void
    {
        $existing = $entry->lines()->get()->keyBy('id');
        $kept = [];

        foreach ($lines as $position => $input) {
            $line = $input['id'] !== null ? $existing->get($input['id']) : null;
            $values = ['position' => $position, 'kw_min' => $input['kw_min'], 'kw_max' => $input['kw_max']];

            foreach (['front', 'rear'] as $side) {
                $values = [...$values, ...self::side($side, $input[$side])];
            }

            if ($line === null) {
                $line = new DocumentTyreLine(['document_car_entry_id' => $entry->id]);
            } elseif (! self::sameSizes($line, $values)) {
                $values = [...$values, 'from_rows' => false, 'in_list' => null, 'list_entry' => null, 'list_number' => null, 'list_page' => null, 'list_carried_over' => false];
            } elseif ($line->codes()->pluck('code')->sort()->values()->all() !== collect($input['codes'])->unique()->sort()->values()->all()) {
                $values['from_rows'] = false;
            }

            $line->forceFill($values)->save();
            $kept[] = $line->id;
            $line->codes()->delete();

            foreach (array_values(array_unique($input['codes'])) as $code) {
                DocumentTyreLineCode::query()->create(['document_tyre_line_id' => $line->id, 'code' => $code]);
            }
        }

        $entry->lines()->whereNotIn('id', $kept)->delete();
        $entry->unsetRelation('lines');
    }

    /** @param array<string, mixed> $values */
    private static function sameSizes(DocumentTyreLine $line, array $values): bool
    {
        foreach (['front', 'rear'] as $side) {
            foreach (['width_mm', 'aspect'] as $column) {
                if ($line->getAttribute("{$side}_{$column}") !== $values["{$side}_{$column}"]) {
                    return false;
                }
            }

            if ((float) $line->getAttribute("{$side}_diameter_in") !== (float) $values["{$side}_diameter_in"]) {
                return false;
            }
        }

        return true;
    }

    /**
     * One side of a line as its columns: read, or kept as typed. Empty: no side at all (only a line entered before this flow).
     *
     * @return array<string, mixed>
     */
    private static function side(string $name, string $text): array
    {
        $blank = [
            "{$name}_width_mm" => null, "{$name}_aspect" => null, "{$name}_diameter_in" => null, "{$name}_load_index" => null, "{$name}_load_index_dual" => null,
            "{$name}_speed_symbol" => null, "{$name}_marker" => null, "{$name}_unread" => null,
        ];

        if (trim($text) === '') {
            return $blank;
        }

        $tyre = EntryLineRules::readable($text);

        if ($tyre === null) {
            return [...$blank, "{$name}_unread" => mb_substr(trim($text), 0, 64)];
        }

        return [
            ...$blank,
            "{$name}_width_mm" => $tyre['width'],
            "{$name}_aspect" => $tyre['aspect'],
            "{$name}_diameter_in" => (float) $tyre['diameter'],
            "{$name}_load_index" => $tyre['li'],
            "{$name}_load_index_dual" => $tyre['li2'],
            "{$name}_speed_symbol" => $tyre['si'],
            "{$name}_marker" => $tyre['marker'],
        ];
    }

    private static function carName(DocumentCarEntry $entry): string
    {
        /** @var Vehicle|null $car */
        $car = $entry->vehicle;

        return $car === null ? '#'.$entry->vehicle_id : VehicleName::from($car);
    }
}
