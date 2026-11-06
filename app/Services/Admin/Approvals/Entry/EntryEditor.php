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
use App\Models\DocumentWheelSize;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Services\Admin\Approvals\FitmentRows;
use App\Services\Admin\AuditTrail;
use App\Support\VehicleName;
use Illuminate\Support\Facades\DB;

/**
 * What staff do in the five steps, each step saved as it happens (the Gutachten rework §7: „draft autosave on every
 * change“), in a transaction with the rows it changes: choose the paper's wheel size, tick cars, enter a car's lines, copy
 * them to other cars. Each leaves its entry in the Protokoll, as the row form did.
 *
 * @phpstan-type LineInput array{id: int|null, front: string, rear: string, kw_min: int|null, kw_max: int|null, front_on_rim: bool, rear_on_rim: bool, codes: list<string>}
 * @phpstan-type CodeInput array{code: string, note: string|null}
 */
final readonly class EntryEditor
{
    public function __construct(private DocumentEntryWriter $writer) {}

    /**
     * The paper's wheel size: the dimension of the chosen row of the catalogue, with what the paper prints for it. The cars
     * already ticked stay, and move with it.
     *
     * @param  array{printed_type: string|null, printed_width_in: float|null, printed_diameter_in: float|null, printed_et_mm: int|null, printed_bolt_holes: int|null, printed_bolt_circle_mm: float|null}  $printed
     */
    public function chooseWheel(ApprovalDocument $document, WheelConfig $config, array $printed, AdminUser $admin): DocumentWheelSize
    {
        return DB::transaction(function () use ($document, $config, $printed, $admin): DocumentWheelSize {
            $dimension = array_intersect_key($config->getAttributes(), array_flip(DocumentWheelSize::DIMENSION));
            /** @var DocumentWheelSize|null $size */
            $size = DocumentWheelSize::query()->where('approval_document_id', $document->id)->first();

            if ($size === null) {
                $size = DocumentWheelSize::query()->create(['approval_document_id' => $document->id, ...$dimension, ...$printed]);
            } else {
                $size->forceFill([...$dimension, ...$printed])->save();
            }

            $this->writer->write($document, $admin);

            AuditTrail::record($admin, 'approval.wheel_chosen', [
                'document' => FitmentRows::label($document),
                'size' => $config->label(),
                'printed_type' => $printed['printed_type'],
            ], $document);

            return $size;
        });
    }

    /**
     * Ticks cars onto the paper's wheel size. A car already there stays as it is: nothing it has is lost. Nothing stands for
     * a group, and nothing joins by itself later: every car here was chosen.
     *
     * @param  list<int>  $vehicleIds
     * @return int the cars added
     */
    public function addCars(ApprovalDocument $document, DocumentWheelSize $size, array $vehicleIds, AdminUser $admin): int
    {
        return DB::transaction(function () use ($document, $size, $vehicleIds, $admin): int {
            $there = DocumentCarEntry::query()->where('approval_document_id', $document->id)->whereIn('vehicle_id', $vehicleIds)->pluck('vehicle_id')->map(static fn (mixed $id): int => (int) $id)->all();
            $new = array_values(array_diff($vehicleIds, $there));
            $position = (int) DocumentCarEntry::query()->where('approval_document_id', $document->id)->max('position');

            foreach ($new as $vehicleId) {
                DocumentCarEntry::query()->create([
                    'approval_document_id' => $document->id,
                    'document_wheel_size_id' => $size->id,
                    'vehicle_id' => $vehicleId,
                    'axle' => Axle::All->value,
                    'position' => ++$position,
                ]);
            }

            if ($new !== []) {
                $this->writer->write($document, $admin, $new);

                AuditTrail::record($admin, 'approval.cars_added', ['document' => FitmentRows::label($document), 'cars' => count($new)], $document);
            }

            return count($new);
        });
    }

    /** Takes a car off the paper, its lines and rows with it. */
    public function removeCar(ApprovalDocument $document, DocumentCarEntry $entry, AdminUser $admin): void
    {
        DB::transaction(function () use ($document, $entry, $admin): void {
            $vehicleId = $entry->vehicle_id;
            $name = self::carName($entry);
            $entry->delete();
            $this->writer->write($document, $admin, [$vehicleId]);

            AuditTrail::record($admin, 'approval.car_removed', ['document' => FitmentRows::label($document), 'car' => $name], $document);
        });
    }

    /**
     * One car's lines, its general codes, its page and what its row says beside them.
     *
     * @param  list<LineInput>  $lines
     * @param  list<CodeInput>  $codes
     * @param  array<string, mixed>  $columns  only the columns the form sent
     */
    public function saveCar(DocumentCarEntry $entry, array $lines, array $codes, array $columns, AdminUser $admin): void
    {
        DB::transaction(function () use ($entry, $lines, $codes, $columns, $admin): void {
            $this->applyColumns($entry, $columns, $admin);
            $entry->forceFill(['copied_from_id' => null])->save();
            $this->replaceCodes($entry, $codes);
            $this->replaceLines($entry, $lines);

            /** @var ApprovalDocument $document */
            $document = $entry->document;
            $this->writer->write($document, $admin, [$entry->vehicle_id]);

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
            $source->loadMissing(['lines.codes', 'codes']);
            /** @var ApprovalDocument $document */
            $document = $source->document;
            $targets = DocumentCarEntry::query()->with(['lines', 'codes'])->where('approval_document_id', $document->id)->whereIn('id', $targetIds)->whereKeyNot($source->id)->get();

            foreach ($targets as $target) {
                $there = $replace ? [] : $target->lines->mapWithKeys(static fn (DocumentTyreLine $line): array => [self::lineIdentity($line) => true])->all();
                $position = $replace ? 0 : ((int) $target->lines->max('position')) + 1;
                $new = 0;

                if ($replace && ! $dryRun) {
                    $target->lines()->delete();
                }

                foreach ($source->lines as $line) {
                    if ($line->unread() || isset($there[self::lineIdentity($line)])) {
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
                $this->writer->write($document, $admin, $targets->pluck('vehicle_id')->map(static fn (mixed $id): int => (int) $id)->all());

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

    /** @param list<CodeInput> $codes */
    private function replaceCodes(DocumentCarEntry $entry, array $codes): void
    {
        $entry->codes()->delete();

        foreach ($codes as $code) {
            DocumentCarEntryCode::query()->create(['document_car_entry_id' => $entry->id, 'code' => $code['code'], 'note_de' => $code['note']]);
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
            $values = ['position' => $position, 'kw_min' => $input['kw_min'], 'kw_max' => $input['kw_max'], 'front_on_rim' => $input['front_on_rim'], 'rear_on_rim' => $input['rear_on_rim']];

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
            "{$name}_width_mm" => null, "{$name}_aspect" => null, "{$name}_diameter_in" => null, "{$name}_load_index" => null,
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
