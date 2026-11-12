<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals\Entry;

use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Domain\Fitment\Verdict\LoadIndexCode;
use App\Enums\Axle;
use App\Enums\DocumentStatus;
use App\Enums\FitmentStatus;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\DocumentCarEntry;
use App\Models\DocumentTyreCombination;
use App\Models\DocumentTyreCombinationCondition;
use App\Models\DocumentTyreLine;
use App\Models\DocumentWheelCombination;
use App\Models\DocumentWheelSize;
use App\Models\Fitment;
use App\Models\Vehicle;
use App\Services\Admin\Approvals\ConflictDetector;
use App\Services\Admin\Approvals\FitmentRows;
use App\Services\Admin\AuditTrail;
use App\Support\EgNumber;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use LogicException;

/**
 * From what staff entered to the tables the shop reads — the verdict logic never sees the difference (the Gutachten
 * rework §6: „this work changes where data is typed and how it is stored, not how a verdict is decided“).
 *
 * One car on one wheel combination becomes one row of `fitments` per colour of its versions: the same version front and rear, a
 * row for both axles; two versions, a row for the front axle on the one and for the rear axle on the other, joined by a set per
 * colour they share (`fitment_wheel_sets`). A car with a version in several combinations has one row for it per colour, saying what
 * they say together: the engine reads several rows of one paper toward caution, and would intersect them. Its lines become:
 *
 * - the same size in front and behind, on the same version: a tyre size for both axles;
 * - anything else: each size on its axle, and a row of `document_tyre_combinations` for the car (D-447; before, per field K, D-358). The engine
 *   offers a pair only where the car's rows list both sizes on their axles (TyreEligibility::listedPairs);
 * - a line with one side from before this flow: a tyre size for that axle. Typed in this flow, or with a tyre that cannot go on
 *   its axle's wheel, it writes nothing, and the release waits for it (EntryModel::stands).
 *
 * Once a paper has a list it is closed: the engine offers nothing else as a Komplettrad (D-256, D-335), so every line of
 * every car stands in it, the same size on both axles too. A paper with no different pair has no list and offers four of
 * a kind, as today.
 *
 * A line with a power band stands in the list only for a car whose power is known and inside the band: the list has no
 * band of its own, and a car whose power is unknown fails closed, the pair not offered.
 *
 * A code that caps a tyre by axle load and names no index (5MK: „nur zulässig … bis zu einer zulässigen Achslast von 1850 kg“)
 * limits that tyre, car by car, here: a car known to be above it does not get the size on that axle. Within the cap, or with the
 * load unknown, the size is written with its code, and the engine answers as it does for such a code (R-03).
 *
 * A code typed beside a combination belongs to that combination, on both its axles (the client's review of 11.11, A; D-451): a code
 * said as a sentence for the whole set (`FOR_THE_SET`) is written on the combination's row of the list
 * (`document_tyre_combination_conditions`), never on its sizes — on a size it would reach every other combination that shares the size
 * (E), and the shop would say it for one axle. A code about one tyre (a load or axle code) or one that narrows by body or drive stays
 * on both sizes, as before: the engine reads those per tyre. A line that does not stand in the car's list — no list on the paper, a
 * power band the car's power is not known for — has no row to carry them: its codes stay on its sizes, as before.
 *
 * Only a draft is ever written; a released paper stays what customers were told.
 *
 * @phpstan-import-type State from EngineRows
 */
final class DocumentEntryWriter
{
    /**
     * The kinds whose code says one thing for the whole set (D-437, D-451): an Abnahme, work on the car, the speedometer, a fastener,
     * a prohibition, a note. Typed beside a combination of the list, they are that combination's.
     */
    public const FOR_THE_SET = [
        ConditionKind::Abnahme,
        ConditionKind::Karosseriearbeit,
        ConditionKind::Nacharbeitsprofil,
        ConditionKind::Tacho,
        ConditionKind::Befestigung,
        ConditionKind::Verbot,
        ConditionKind::Hinweis,
    ];

    /** @var array<string, int> the paper's axle-load caps that name no index: code => kg */
    private array $caps = [];

    /** @var array<string, true> the paper's codes of a FOR_THE_SET kind */
    private array $forTheSet = [];

    /** Whether the paper of the last `desired()` has a list of combinations: then a line of it carries its set's codes there. */
    private bool $hasList = false;

    /**
     * The general codes of the last `desired()`'s cars (D-452), per car; empty before `document_vehicle_codes` exists (a migration
     * of the round before it).
     *
     * @var array<string, list<array{code: string, note: string|null}>>
     */
    private array $carCodes = [];

    /** @var array<int, list<array{code: string, note: string|null}>> per cell: its own row's codes, carried from the rows before the five steps */
    private array $cellCodes = [];

    /** @var array<string, array{entry: DocumentCarEntry, sizes: list<array<string, mixed>>, codes: list<array{code: string, note: string|null}>}> which entry each row of the last `desired()` came from, and its children in the order they were entered */
    private array $sources = [];

    private function readCarCodes(int $documentId): void
    {
        CarCodes::forget();
        $this->carCodes = Schema::hasTable('document_vehicle_codes') ? CarCodes::forDocument($documentId) : [];
        $this->cellCodes = [];

        foreach (DB::table('document_car_entry_codes')->join('document_car_entries', 'document_car_entries.id', '=', 'document_car_entry_codes.document_car_entry_id')
            ->where('document_car_entries.approval_document_id', $documentId)->orderBy('document_car_entry_codes.id')
            ->get(['document_car_entry_codes.document_car_entry_id', 'document_car_entry_codes.code', 'document_car_entry_codes.note_de']) as $row) {
            $this->cellCodes[(int) $row->document_car_entry_id][] = ['code' => (string) $row->code, 'note' => $row->note_de === null ? null : (string) $row->note_de];
        }
    }

    /**
     * What a cell's row says itself: its car's general codes (D-452), and the codes its own row carried from before the five steps.
     *
     * @return list<array{code: string, note: string|null}>
     */
    private function generalCodes(DocumentCarEntry $entry): array
    {
        return CarCodes::unique([...($this->carCodes[CarCodes::keyOfEntry($entry)] ?? []), ...($this->cellCodes[(int) $entry->id] ?? [])]);
    }

    /**
     * The paper's codes of a FOR_THE_SET kind.
     *
     * @return array<string, true>
     */
    public static function forTheSetOf(int $documentId): array
    {
        return array_fill_keys(DB::table('document_conditions')->where('approval_document_id', $documentId)
            ->whereIn('kind', array_map(static fn (ConditionKind $kind): string => $kind->value, self::FOR_THE_SET))
            ->pluck('code')->map(static fn (mixed $code): string => (string) $code)->all(), true);
    }

    /**
     * @return array<string, int>
     */
    public static function capsOf(int $documentId): array
    {
        $caps = [];

        foreach (DB::table('document_conditions')->where('approval_document_id', $documentId)
            ->where('kind', ConditionKind::ReifenTragfaehigkeit->value)->whereNotNull('max_axle_load_kg')->get(['code', 'max_axle_load_kg']) as $row) {
            if (LoadIndexCode::indexNamedBy((string) $row->code) === null) {
                $caps[(string) $row->code] = (int) $row->max_axle_load_kg;
            }
        }

        return $caps;
    }

    /**
     * What the shop's tables should hold for what is entered — the writer's whole logic, with nothing written. `$vehicleIds`
     * limits the rows to those cars; the list is always the whole paper's.
     *
     * @param  list<int>|null  $vehicleIds
     * @return State
     */
    public function desired(EntryModel $model, ?array $vehicleIds = null): array
    {
        $abnahme = DB::table('document_conditions')->where('approval_document_id', $model->document->id)
            ->where('kind', ConditionKind::Abnahme->value)->pluck('code')->map(static fn (mixed $code): string => (string) $code)->all();
        $this->caps = self::capsOf($model->document->id);
        $this->forTheSet = self::forTheSetOf($model->document->id);
        $this->hasList = $model->hasList();
        $this->readCarCodes($model->document->id);
        $this->sources = [];
        $colours = [];
        /** @var array<int, array<int, list<array{entry: DocumentCarEntry, axle: string, sizes: list<array<string, mixed>>, crossed: bool}>>> $parts */
        $parts = [];
        $sets = [];
        $crossedCars = [];

        foreach ($model->entries as $entry) {
            if ($vehicleIds !== null && ! in_array($entry->vehicle_id, $vehicleIds, true)) {
                continue;
            }

            /** @var DocumentWheelCombination $combination */
            $combination = $entry->combination;
            /** @var DocumentWheelSize $front */
            $front = $combination->front;
            /** @var DocumentWheelSize $rear */
            $rear = $combination->rear;
            $colours[$front->id] ??= self::coloursOf($front);
            $colours[$rear->id] ??= self::coloursOf($rear);
            $sizes = $this->sizesOf($entry);

            if ($combination->same()) {
                $ids = $entry->wheel_config_id !== null ? [$entry->wheel_config_id] : array_keys($colours[$front->id]);

                foreach ($ids as $id) {
                    $parts[$entry->vehicle_id][$id][] = ['entry' => $entry, 'axle' => $entry->axle, 'sizes' => $sizes, 'crossed' => false];
                }

                continue;
            }

            $crossedCars[$entry->vehicle_id] = true;
            $onFront = array_values(array_filter($sizes, static fn (array $size): bool => $size['axle'] !== Axle::Rear->value));
            $onRear = array_values(array_filter($sizes, static fn (array $size): bool => $size['axle'] !== Axle::Front->value));

            foreach (array_keys($colours[$front->id]) as $id) {
                $parts[$entry->vehicle_id][$id][] = ['entry' => $entry, 'axle' => Axle::Front->value, 'sizes' => $onFront, 'crossed' => true];
            }

            foreach (array_keys($colours[$rear->id]) as $id) {
                $parts[$entry->vehicle_id][$id][] = ['entry' => $entry, 'axle' => Axle::Rear->value, 'sizes' => $onRear, 'crossed' => true];
            }
        }

        $rows = [];
        /** @var array<string, string> $rowOf the key of the row a car and colour stand on, where a set needs it */
        $rowOf = [];

        foreach ($parts as $vehicleId => $byColour) {
            foreach ($byColour as $configId => $list) {
                // Only where a version stands in two combinations does a car's row say what several say: a paper from before this
                // flow can hold two rows of one colour, one per axle, and they stay two.
                if (array_filter($list, static fn (array $part): bool => $part['crossed']) === []) {
                    foreach ($list as $part) {
                        $key = EngineRows::key($vehicleId, $configId, $part['axle']);
                        $rows[$key] = $this->rowOf([$part], $abnahme);
                        $this->sources[$key] = $this->sourceOf([$part]);
                        $rowOf["{$vehicleId}:{$configId}"] = $key;
                    }

                    continue;
                }

                $axles = array_unique(array_column($list, 'axle'));
                $key = EngineRows::key($vehicleId, $configId, count($axles) === 1 ? $axles[0] : Axle::All->value);
                $rows[$key] = $this->rowOf($list, $abnahme);
                $this->sources[$key] = $this->sourceOf($list);
                $rowOf["{$vehicleId}:{$configId}"] = $key;
            }
        }

        ksort($rows);

        // Which versions go together, per colour they share — only on a car that has two different ones: every other paper says it
        // by its rows alone, and its answers stay what they are.
        foreach ($model->entries as $entry) {
            if (! isset($crossedCars[$entry->vehicle_id]) || $entry->wheel_config_id !== null) {
                continue;
            }

            /** @var DocumentWheelCombination $combination */
            $combination = $entry->combination;

            foreach ($colours[$combination->front_wheel_size_id] ?? [] as $frontId => $finish) {
                foreach ($colours[$combination->rear_wheel_size_id] ?? [] as $rearId => $rearFinish) {
                    if ($finish === $rearFinish && isset($rowOf["{$entry->vehicle_id}:{$frontId}"], $rowOf["{$entry->vehicle_id}:{$rearId}"])) {
                        $sets[] = EngineRows::setKey($rowOf["{$entry->vehicle_id}:{$frontId}"], $rowOf["{$entry->vehicle_id}:{$rearId}"]);
                    }
                }
            }
        }

        sort($sets);

        return ['rows' => $rows, 'sets' => array_values(array_unique($sets)), 'list' => $this->listOf($model)];
    }

    /**
     * Every live colour of a version: its id, and which finish it is.
     *
     * @return array<int, int>
     */
    private static function coloursOf(DocumentWheelSize $size): array
    {
        $out = [];

        foreach ($size->configs()->orderBy('id')->get(['id', 'wheel_finish_id']) as $config) {
            $out[(int) $config->id] = (int) $config->wheel_finish_id;
        }

        return $out;
    }

    /**
     * Writes a draft's rows and list. Rows whose content is already what it should be are left alone.
     *
     * @param  list<int>|null  $vehicleIds  only these cars' rows; the list is the whole paper's
     */
    public function write(ApprovalDocument $document, ?AdminUser $admin = null, ?array $vehicleIds = null): void
    {
        if ($document->status !== DocumentStatus::Draft) {
            throw new LogicException('Nur ein Entwurf wird aus der Erfassung geschrieben.');
        }

        DB::transaction(function () use ($document, $admin, $vehicleIds): void {
            $model = EntryModel::of($document);
            $desired = $this->desired($model, $vehicleIds);
            $existing = Fitment::query()->where('approval_document_id', $document->id)
                ->where('status', FitmentStatus::Draft->value)
                ->when($vehicleIds !== null, static fn ($q) => $q->whereIn('vehicle_id', (array) $vehicleIds))
                ->get()
                ->keyBy(static fn (Fitment $row): string => EngineRows::key((int) $row->vehicle_id, (int) $row->wheel_config_id, $row->axle->value));
            $current = EngineRows::actual($document)['rows'];

            foreach ($desired['rows'] as $key => $row) {
                [$vehicleId, $configId, $axle] = explode(':', $key);
                $source = $this->sources[$key];

                if (! $existing->has($key)) {
                    $this->createRow($document, (int) $vehicleId, (int) $configId, $axle, $row, $source, $admin);
                } elseif (($current[$key] ?? null) !== $row) {
                    $this->updateRow($existing->get($key), $row, $source);
                }
            }

            foreach ($existing as $key => $row) {
                if (! isset($desired['rows'][$key])) {
                    $row->delete();
                }
            }

            $this->writeList($document, $desired['list']);
            $this->writeSets($document, $desired['sets'], $vehicleIds);
        });
    }

    /**
     * A new colour of a size that released papers already cover (the client: „the colours … can be chosen for every wheel. It
     * doesn't matter, it's not written in the Gutachten“): every car entered for every colour of that dimension gets its
     * row for this one too, at once and on the record — the same row its sister colours have, added, nothing changed. A
     * step of its own in the Protokoll, not an edit of the paper (Phase 0 §9). Another paper that says something else about the
     * same car and size is recorded as a conflict, as a release would (ConflictDetector).
     *
     * @return int the rows added
     */
    public function colourAdded(int $configId, AdminUser $admin): int
    {
        $config = DB::table('wheel_configs')->where('id', $configId)->first();

        if ($config === null) {
            return 0;
        }

        $query = DocumentWheelSize::query();

        foreach (DocumentWheelSize::DIMENSION as $column) {
            $query->where($column, $config->{$column});
        }

        $added = 0;

        foreach ($query->with('document')->get()->unique('approval_document_id') as $size) {
            /** @var ApprovalDocument|null $document */
            $document = $size->document;

            if ($document === null || ! in_array($document->status, [DocumentStatus::Draft, DocumentStatus::Published], true)) {
                continue;
            }

            $status = $document->status === DocumentStatus::Published ? FitmentStatus::Published : FitmentStatus::Draft;
            // What the paper says as a whole, this colour now among it: the same row its sister colours have, and only that is added.
            $desired = $this->desired(EntryModel::of($document));
            $here = 0;

            foreach ($desired['rows'] as $key => $row) {
                [$vehicleId, $rowConfigId, $axle] = explode(':', $key);

                if ((int) $rowConfigId !== $configId) {
                    continue;
                }

                $exists = Fitment::query()->where('approval_document_id', $document->id)->where('vehicle_id', (int) $vehicleId)->where('wheel_config_id', $configId)->where('axle', $axle)->exists();

                if (! $exists) {
                    $this->createRow($document, (int) $vehicleId, $configId, $axle, $row, $this->sources[$key], $admin, $status);
                    $here++;
                }
            }

            if ($here > 0) {
                $this->writeSets($document, $desired['sets'], null);
                self::tagColour($document, $desired['list'], $configId);
                $added += $here;

                if ($document->status === DocumentStatus::Published) {
                    (new ConflictDetector)->detect($document, $admin);
                }

                AuditTrail::record($admin, 'approval.colour_added', [
                    'document' => FitmentRows::label($document),
                    'size' => EntryView::dimensionLabel($size),
                    'config' => $configId,
                    'rows' => $here,
                ], $document);
            }
        }

        return $added;
    }

    /**
     * One row as it should stand, from what one or more of a car's combinations say of this colour. Several are read together as
     * the engine reads several rows of one paper, toward caution: an Abnahme in any asks for it, the build window and the width and
     * offset are where they all agree, the sizes and codes are all of them.
     *
     * @param  list<array{entry: DocumentCarEntry, axle: string, sizes: list<array<string, mixed>>, crossed: bool}>  $parts
     * @param  list<string>  $abnahme  the paper's codes of kind Abnahme
     * @return array<string, mixed>
     */
    private function rowOf(array $parts, array $abnahme): array
    {
        $source = $this->sourceOf($parts);
        $sizes = $source['sizes'];
        $codes = $source['codes'];
        $used = [...array_column($codes, 'code'), ...array_merge([], ...array_column($sizes, 'codes'))];
        $entries = array_column($parts, 'entry');
        $first = static fn (callable $read): mixed => array_values(array_filter(array_map($read, $entries), static fn (mixed $value): bool => $value !== null))[0] ?? null;
        $highest = static function (callable $read) use ($entries): mixed {
            $values = array_filter(array_map($read, $entries), static fn (mixed $value): bool => $value !== null);

            return $values === [] ? null : max($values);
        };
        $lowest = static function (callable $read) use ($entries): mixed {
            $values = array_filter(array_map($read, $entries), static fn (mixed $value): bool => $value !== null);

            return $values === [] ? null : min($values);
        };
        $overrides = array_values(array_filter(array_map(static fn (DocumentCarEntry $entry): ?string => $entry->entry_override, $entries)));
        $override = in_array('required', $overrides, true) ? 'required' : ($overrides[0] ?? null);
        $reason = $first(static fn (DocumentCarEntry $entry): ?string => $entry->entry_override === $override ? $entry->entry_override_reason : null);

        return EngineRows::row([
            'build_from' => $highest(static fn (DocumentCarEntry $entry): ?string => $entry->build_from?->toDateString()),
            'build_to' => $lowest(static fn (DocumentCarEntry $entry): ?string => $entry->build_to?->toDateString()),
            'permitted_width_min' => $highest(static fn (DocumentCarEntry $entry): ?float => $entry->permitted_width_min),
            'permitted_width_max' => $lowest(static fn (DocumentCarEntry $entry): ?float => $entry->permitted_width_max),
            'permitted_et_min' => $highest(static fn (DocumentCarEntry $entry): ?int => $entry->permitted_et_min),
            'permitted_et_max' => $lowest(static fn (DocumentCarEntry $entry): ?int => $entry->permitted_et_max),
            'centre_bore_mm' => $first(static fn (DocumentCarEntry $entry): ?float => $entry->centre_bore_mm),
            // As FitmentRows::derive(): never typed — an Abnahme among the codes, or the override with its reason.
            'requires_entry' => match ($override) {
                'required' => true,
                'not_required' => false,
                default => array_intersect($used, $abnahme) !== [],
            },
            'entry_note_de' => $first(static fn (DocumentCarEntry $entry): ?string => $entry->entry_note_de),
            'entry_override' => $override,
            'entry_override_reason' => $reason,
            'source_page' => $first(static fn (DocumentCarEntry $entry): ?int => $entry->source_page),
            'sizes' => $sizes,
            'codes' => $codes,
        ]);
    }

    /**
     * What one row holds, in the order it was entered: each size once, with every code any combination gives it.
     *
     * @param  list<array{entry: DocumentCarEntry, axle: string, sizes: list<array<string, mixed>>, crossed: bool}>  $parts
     * @return array{entry: DocumentCarEntry, sizes: list<array<string, mixed>>, codes: list<array{code: string, note: string|null}>}
     */
    private function sourceOf(array $parts): array
    {
        $sizes = [];
        $codes = [];

        foreach ($parts as $part) {
            foreach ($part['sizes'] as $size) {
                $key = EngineRows::sizeKey($size);
                $size['codes'] = array_values(array_unique([...($sizes[$key]['codes'] ?? []), ...$size['codes']]));
                $sizes[$key] = $size;
            }

            foreach ($this->generalCodes($part['entry']) as $code) {
                $codes[$code['code']] ??= $code;
            }
        }

        return ['entry' => $parts[0]['entry'], 'sizes' => count($parts) > 1 ? self::withoutCarried(array_values($sizes)) : array_values($sizes), 'codes' => array_values($codes)];
    }

    /**
     * A size on both axles says what the same size on one axle says, where that adds nothing of its own: two entries of one size
     * would only be told apart by the axle.
     *
     * @param  list<array<string, mixed>>  $sizes
     * @return list<array<string, mixed>>
     */
    private static function withoutCarried(array $sizes): array
    {
        $both = [];

        foreach ($sizes as $size) {
            if ($size['axle'] === Axle::All->value) {
                $both[self::plainKey($size)] = true;
            }
        }

        return array_values(array_filter($sizes, static fn (array $size): bool => $size['axle'] === Axle::All->value
            || ! isset($both[self::plainKey($size)])
            || $size['codes'] !== [] || $size['kw_min'] !== null || $size['kw_max'] !== null));
    }

    /** @param array<string, mixed> $size */
    private static function plainKey(array $size): string
    {
        return implode('|', [$size['width_mm'], $size['aspect'], number_format((float) $size['diameter_in'], 1, '.', ''), $size['min_load_index'] ?? '', $size['min_speed_symbol'] ?? '']);
    }

    /**
     * A car's tyre sizes as `fitment_tyre_sizes` holds them, each once per axle, band and printed figures.
     *
     * @param  array<string, int>|null  $caps  the paper's axle-load caps (capsOf); null: those of the last `desired()`
     * @return list<array{width_mm: int, aspect: int, diameter_in: float, min_load_index: int|null, min_speed_symbol: string|null, axle: string, kw_min: int|null, kw_max: int|null, codes: list<string>}>
     */
    public function sizesOf(DocumentCarEntry $entry, ?array $caps = null): array
    {
        $caps ??= $this->caps;
        // A line of the list carries its set's codes on its row there (D-451); on its sizes, the codes about one tyre.
        $onSizes = fn (DocumentTyreLine $line, array $codes): array => $this->listed($entry, $line)
            ? array_values(array_filter($codes, fn (string $code): bool => ! isset($this->forTheSet[$code])))
            : $codes;
        /** @var Vehicle|null $car */
        $car = $entry->vehicle;
        $sizes = [];
        $pairs = [];

        $add = static function (TyreSize $size, ?int $loadIndex, ?string $symbol, string $axle, DocumentTyreLine $line, array $codes) use (&$sizes, $caps, $car): void {
            // The tyre's own cap, against the load of the axle it would go on: above it, not on that axle. Rows from before the
            // flow stand as they stood.
            if (! $line->from_rows) {
                $axle = self::withinCaps($axle, $codes, $caps, $car);

                if ($axle === null) {
                    return;
                }
            }

            $row = [
                'width_mm' => $size->widthMm,
                'aspect' => $size->aspect,
                'diameter_in' => $size->diameterIn,
                'min_load_index' => $loadIndex,
                'min_speed_symbol' => $symbol,
                'axle' => $axle,
                'kw_min' => $line->kw_min,
                'kw_max' => $line->kw_max,
                'codes' => $codes,
            ];
            $key = EngineRows::sizeKey($row);
            $row['codes'] = array_values(array_unique([...($sizes[$key]['codes'] ?? []), ...$codes]));
            $sizes[$key] = $row;
        };

        $crossed = EntryModel::crossed($entry);

        foreach ($entry->lines as $line) {
            // A side that does not read, a side missing, a tyre that does not fit its wheel: nothing written, the release waits for it.
            if (! EntryModel::stands($entry, $line)) {
                continue;
            }

            $typed = $line->codes->pluck('code')->map(static fn (mixed $code): string => (string) $code)->all();
            $codes = $onSizes($line, $typed);
            $front = $line->front();
            $rear = $line->rear();

            // Two sizes, two versions, or one size typed with nothing printed beside it: read after the sizes that say something of their
            // own. A line read from a row stands where it stood: the order of a row's sizes is what the verdict lists them in.
            if (EntryModel::paired($line) || $crossed || (! $line->from_rows && $front !== null && $rear !== null && $typed === [] && $line->kw_min === null && $line->kw_max === null
                && $line->front_load_index === null && $line->front_speed_symbol === null && $line->rear_load_index === null && $line->rear_speed_symbol === null)) {
                $pairs[] = $line;

                continue;
            }

            if ($front !== null && $rear !== null) {
                if ($line->front_load_index === $line->rear_load_index && $line->front_speed_symbol === $line->rear_speed_symbol) {
                    $add($front, $line->front_load_index, $line->front_speed_symbol, Axle::All->value, $line, $codes);
                } else {
                    $add($front, $line->front_load_index, $line->front_speed_symbol, Axle::Front->value, $line, $codes);
                    $add($rear, $line->rear_load_index, $line->rear_speed_symbol, Axle::Rear->value, $line, $codes);
                }
            } elseif ($front !== null) {
                $add($front, $line->front_load_index, $line->front_speed_symbol, Axle::Front->value, $line, $codes);
            } elseif ($rear !== null) {
                $add($rear, $line->rear_load_index, $line->rear_speed_symbol, Axle::Rear->value, $line, $codes);
            }
        }

        foreach ($pairs as $line) {
            $codes = $onSizes($line, $line->codes->pluck('code')->map(static fn (mixed $code): string => (string) $code)->all());

            // One size with nothing beside it, on one version, not yet on both axles: a size for both.
            if (! EntryModel::paired($line) && ! $crossed) {
                /** @var TyreSize $front */
                $front = $line->front();

                if (! self::carried($sizes, $front, Axle::Front->value) || ! self::carried($sizes, $front, Axle::Rear->value)) {
                    $add($front, null, null, Axle::All->value, $line, $codes);
                }

                continue;
            }

            foreach ([[$line->front(), $line->front_load_index, $line->front_speed_symbol, Axle::Front->value, $codes], [$line->rear(), $line->rear_load_index, $line->rear_speed_symbol, Axle::Rear->value, $codes]] as [$size, $loadIndex, $symbol, $axle, $own]) {
                /** @var TyreSize $size */
                $carrier = self::carried($sizes, $size, $axle);

                // Already on this axle, and this side adds nothing of its own: no second entry of the same size.
                if ($carrier !== null && $loadIndex === null && $symbol === null && $own === [] && $line->kw_min === null && $line->kw_max === null) {
                    continue;
                }

                // A pair the paper prints without figures takes them from the size's own line.
                $add($size, $loadIndex ?? $carrier['min_load_index'] ?? null, $symbol ?? $carrier['min_speed_symbol'] ?? null, $axle, $line, $own);
            }
        }

        return array_values($sizes);
    }

    /**
     * What is left of an axle under a line's caps, against the car's known loads: both, one, or none. An unknown load cuts
     * nothing here: the size is written with its code, and the engine asks for the load (R-03).
     *
     * @param  list<string>  $codes
     * @param  array<string, int>  $caps
     */
    private static function withinCaps(string $axle, array $codes, array $caps, ?Vehicle $car): ?string
    {
        $cap = null;

        foreach ($codes as $code) {
            if (isset($caps[$code])) {
                $cap = $cap === null ? $caps[$code] : min($cap, $caps[$code]);
            }
        }

        if ($cap === null) {
            return $axle;
        }

        $above = static fn (mixed $load): bool => is_numeric($load) && (int) $load > 0 && (int) $load > $cap;
        $front = $axle !== Axle::Rear->value && ! $above($car?->axle_load_front_kg);
        $rear = $axle !== Axle::Front->value && ! $above($car?->axle_load_rear_kg);

        return match (true) {
            $front && $rear => $axle,
            $front => Axle::Front->value,
            $rear => Axle::Rear->value,
            default => null,
        };
    }

    /**
     * Whether this line's pair stands in its car's list — the test listOf() makes: both sides read, it stands, the paper has a list
     * (or the line says it stands in one), and a power band takes in the car's known power.
     */
    private function listed(DocumentCarEntry $entry, DocumentTyreLine $line): bool
    {
        return self::carriesItsSet($entry, $line, $this->hasList);
    }

    private static function carriesItsSet(DocumentCarEntry $entry, DocumentTyreLine $line, bool $hasList): bool
    {
        if (! $hasList && $line->in_list === null) {
            return false;
        }

        /** @var Vehicle|null $car */
        $car = $entry->vehicle;

        return EntryModel::twoSided($line) && EntryModel::stands($entry, $line) && ($line->in_list ?? $hasList)
            && ! ($line->in_list === null && ! self::appliesTo($line, $car))
            // A line from before this flow writes back as it stood: there a code was typed beside a size, never a combination.
            && ! EntryModel::fromBefore($line);
    }

    /**
     * The entry that already puts this size on this axle.
     *
     * @param  array<string, array<string, mixed>>  $sizes
     * @return array<string, mixed>|null
     */
    private static function carried(array $sizes, TyreSize $size, string $axle): ?array
    {
        foreach ($sizes as $candidate) {
            if ($candidate['width_mm'] === $size->widthMm && $candidate['aspect'] === $size->aspect && $candidate['diameter_in'] === $size->diameterIn
                && ($candidate['axle'] === Axle::All->value || $candidate['axle'] === $axle)) {
                return $candidate;
            }
        }

        return null;
    }

    /**
     * The paper's list of combinations as `document_tyre_combinations` holds it: each pair once per car it was entered for
     * (his round of 08.11, §2; D-447), under the entry of the Verwendungsbereich the car stands in where it has one. A car
     * without a field K that reads as an EG number has its pairs all the same: the shop reads them by the car.
     *
     * @return list<array<string, mixed>>
     */
    public function listOf(EntryModel $model): array
    {
        $hasList = $model->hasList();
        $printed = $this->printedEntries($model);
        $forTheSet = self::forTheSetOf($model->document->id);
        $rows = [];
        /** @var array<int, array<int, int>> $colours version => its colours */
        $colours = [];

        foreach ($model->entries as $entry) {
            /** @var Vehicle|null $car */
            $car = $entry->vehicle;

            foreach ($entry->lines as $line) {
                if (! EntryModel::twoSided($line) || ! EntryModel::stands($entry, $line) || ! ($line->in_list ?? $hasList) || ($line->in_list === null && ! self::appliesTo($line, $car))) {
                    continue;
                }

                [$number, $norm] = $this->entryOf($line, $car, $printed);

                /** @var TyreSize $front */
                $front = $line->front();
                /** @var TyreSize $rear */
                $rear = $line->rear();
                $key = $entry->vehicle_id.'|'.$front->key().'|'.$rear->key();

                $rows[$key] ??= [
                    'vehicle_id' => (int) $entry->vehicle_id,
                    'eg_number' => $number,
                    'eg_number_norm' => $norm,
                    'number' => $line->list_number,
                    'front_width_mm' => $front->widthMm,
                    'front_aspect' => $front->aspect,
                    'front_diameter_in' => $front->diameterIn,
                    'rear_width_mm' => $rear->widthMm,
                    'rear_aspect' => $rear->aspect,
                    'rear_diameter_in' => $rear->diameterIn,
                    'source_page' => $line->list_page ?? $entry->source_page,
                    'carried_over' => $line->list_carried_over,
                    'codes' => [],
                ];

                // The set's codes typed beside it (D-451): the combination's, on both its axles — for the wheels of this cell, `config:code`.
                if (self::carriesItsSet($entry, $line, $hasList)) {
                    $codes = array_values(array_filter($line->codes->pluck('code')->map(static fn (mixed $code): string => (string) $code)->all(), static fn (string $code): bool => isset($forTheSet[$code])));

                    foreach (self::wheelsOf($entry, $colours) as $configId) {
                        foreach ($codes as $code) {
                            $rows[$key]['codes'][] = $configId.':'.$code;
                        }
                    }

                    $rows[$key]['codes'] = array_values(array_unique($rows[$key]['codes']));
                    sort($rows[$key]['codes']);
                }
            }
        }

        foreach ($model->kept as $kept) {
            $rows['kept|'.$kept->id] = [
                'vehicle_id' => $kept->vehicle_id,
                'eg_number' => $kept->eg_number,
                'eg_number_norm' => $kept->eg_number_norm,
                'number' => $kept->number,
                'front_width_mm' => $kept->front_width_mm,
                'front_aspect' => $kept->front_aspect,
                'front_diameter_in' => $kept->front_diameter_in,
                'rear_width_mm' => $kept->rear_width_mm,
                'rear_aspect' => $kept->rear_aspect,
                'rear_diameter_in' => $kept->rear_diameter_in,
                'source_page' => $kept->source_page,
                'carried_over' => $kept->carried_over,
                'codes' => [],
            ];
        }

        return EngineRows::list($this->numbered(array_values($rows)));
    }

    /**
     * The wheels a cell's rows stand on: the colours of its versions — of one, on the same version front and rear, unless the cell is
     * entered for one colour alone; of both, on two versions. As desired() writes the rows.
     *
     * @param  array<int, array<int, int>>  $colours  version => its colours, filled as it goes
     * @return list<int>
     */
    private static function wheelsOf(DocumentCarEntry $entry, array &$colours): array
    {
        /** @var DocumentWheelCombination|null $combination */
        $combination = $entry->combination;

        if ($combination === null || $combination->front === null || $combination->rear === null) {
            return [];
        }

        $colours[$combination->front->id] ??= self::coloursOf($combination->front);
        $colours[$combination->rear->id] ??= self::coloursOf($combination->rear);

        if ($combination->same()) {
            return $entry->wheel_config_id !== null ? [(int) $entry->wheel_config_id] : array_keys($colours[$combination->front->id]);
        }

        return array_values(array_unique([...array_keys($colours[$combination->front->id]), ...array_keys($colours[$combination->rear->id])]));
    }

    /**
     * Whether a line reaches this car's list: no band, or a band its known power lies in. Power unknown: not offered as a
     * pair — the list holds no band for a verdict to name, so it fails closed, a missed sale and no wrong answer.
     */
    public static function appliesTo(DocumentTyreLine $line, ?Vehicle $car): bool
    {
        if ($line->kw_min === null && $line->kw_max === null) {
            return true;
        }

        $power = $car?->getAttribute('power_kw');

        return $power !== null
            && ($line->kw_min === null || (int) $power >= $line->kw_min)
            && ($line->kw_max === null || (int) $power <= $line->kw_max);
    }

    /**
     * The EG numbers older rows print on this paper (`…*00-09`), so a new car one of them takes in joins that entry instead
     * of opening a second one the engine could not choose between.
     *
     * @return list<array{0: string, 1: string}> as printed, normalised
     */
    private function printedEntries(EntryModel $model): array
    {
        $printed = [];

        foreach ($model->entries as $entry) {
            foreach ($entry->lines as $line) {
                if ($line->list_entry !== null) {
                    $printed[$line->list_entry] = [$line->list_entry, (string) Vehicle::normaliseEcNumber($line->list_entry)];
                }
            }
        }

        foreach ($model->kept as $kept) {
            if ($kept->eg_number !== null) {
                $printed[$kept->eg_number] = [$kept->eg_number, (string) ($kept->eg_number_norm ?? Vehicle::normaliseEcNumber($kept->eg_number))];
            }
        }

        return array_values($printed);
    }

    /**
     * The entry a line's pair stands under: the one printed with it; else the printed one that takes in the car's K; else
     * the car's own K. None where the car has no K that reads as an EG number: the engine could never choose it.
     *
     * @param  list<array{0: string, 1: string}>  $printed
     * @return array{0: string|null, 1: string|null}
     */
    private function entryOf(DocumentTyreLine $line, ?Vehicle $car, array $printed): array
    {
        if ($line->list_entry !== null) {
            return [$line->list_entry, Vehicle::normaliseEcNumber($line->list_entry)];
        }

        $norm = $car?->getAttribute('eg_nummer_norm');
        $number = EgNumber::parse(is_string($norm) ? $norm : null);

        if ($number === null) {
            return [null, null];
        }

        foreach ($printed as [$raw, $normalised]) {
            if (EgNumber::parse($normalised)?->covers($number) === true) {
                return [$raw, $normalised];
            }
        }

        return [(string) $car?->getAttribute('eg_nummer_raw'), (string) $norm];
    }

    /**
     * Each car's rows numbered: a row that came with its number keeps it, a new one takes the next free one.
     *
     * @param  list<array<string, mixed>>  $rows
     * @return list<array<string, mixed>>
     */
    private function numbered(array $rows): array
    {
        $used = [];
        // A car's list counts for itself; a row kept from the list that names no car, per entry as before.
        $list = static fn (array $row): string => $row['vehicle_id'] !== null ? 'car:'.$row['vehicle_id'] : 'entry:'.$row['eg_number_norm'];

        foreach ($rows as $row) {
            if ($row['number'] !== null) {
                $used[$list($row)][(int) $row['number']] = true;
            }
        }

        foreach ($rows as &$row) {
            if ($row['number'] === null) {
                $entry = $list($row);
                $next = 1;

                while (isset($used[$entry][$next])) {
                    $next++;
                }

                $used[$entry][$next] = true;
                $row['number'] = $next;
            }
        }

        unset($row);

        return $rows;
    }

    /**
     * @param  array<string, mixed>  $row
     * @param  array{entry: DocumentCarEntry, sizes: list<array<string, mixed>>, codes: list<array{code: string, note: string|null}>}  $source
     */
    private function createRow(ApprovalDocument $document, int $vehicleId, int $configId, string $axle, array $row, array $source, ?AdminUser $admin, FitmentStatus $status = FitmentStatus::Draft): void
    {
        $stored = Fitment::query()->create([
            ...self::columns($row, $source['entry']),
            'approval_document_id' => $document->id,
            'vehicle_id' => $vehicleId,
            'wheel_config_id' => $configId,
            'axle' => $axle,
            'status' => $status->value,
            'created_by' => $admin?->id,
        ]);

        $this->children($stored, $source);
    }

    /**
     * @param  array<string, mixed>  $row
     * @param  array{entry: DocumentCarEntry, sizes: list<array<string, mixed>>, codes: list<array{code: string, note: string|null}>}  $source
     */
    private function updateRow(Fitment $stored, array $row, array $source): void
    {
        $stored->forceFill(self::columns($row, $source['entry']))->save();
        $stored->tyreSizes()->delete();
        $stored->conditionCodes()->delete();
        $this->children($stored, $source);
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private static function columns(array $row, DocumentCarEntry $entry): array
    {
        return [
            'build_from' => $row['build_from'],
            'build_to' => $row['build_to'],
            'permitted_width_min' => $row['permitted_width_min'],
            'permitted_width_max' => $row['permitted_width_max'],
            'permitted_et_min' => $row['permitted_et_min'],
            'permitted_et_max' => $row['permitted_et_max'],
            'centre_bore_mm' => $row['centre_bore_mm'],
            'requires_entry' => $row['requires_entry'],
            'entry_note_de' => $row['entry_note_de'],
            'entry_override' => $row['entry_override'],
            'entry_override_reason' => $row['entry_override_reason'],
            'entry_override_by' => $entry->entry_override_by,
            'entry_override_at' => $entry->entry_override_at,
            'source_page' => $row['source_page'],
        ];
    }

    /**
     * The row's sizes and codes in the order they were entered: the compared state holds them sorted, and the shop lists them in
     * the order they were written.
     *
     * @param  array{entry: DocumentCarEntry, sizes: list<array<string, mixed>>, codes: list<array{code: string, note: string|null}>}  $source
     */
    private function children(Fitment $stored, array $source): void
    {
        $now = now();

        foreach ($source['sizes'] as $size) {
            /** @var list<string> $codes */
            $codes = $size['codes'];
            unset($size['codes']);
            $saved = $stored->tyreSizes()->create($size);

            DB::table('fitment_tyre_size_conditions')->insert(array_map(static fn (string $code): array => [
                'fitment_tyre_size_id' => $saved->id,
                'code' => $code,
                'created_at' => $now,
                'updated_at' => $now,
            ], $codes));
        }

        DB::table('fitment_conditions')->insert(array_map(static fn (array $code): array => [
            'fitment_id' => $stored->id,
            'code' => $code['code'],
            'note_de' => $code['note'],
            'created_at' => $now,
            'updated_at' => $now,
        ], $source['codes']));
    }

    /**
     * The sets as they should stand, by the rows they join; those of the other cars stay as they are.
     *
     * @param  list<string>  $sets
     * @param  list<int>|null  $vehicleIds
     */
    private function writeSets(ApprovalDocument $document, array $sets, ?array $vehicleIds): void
    {
        $rows = DB::table('fitments')->where('approval_document_id', $document->id)->where('status', '<>', FitmentStatus::Retired->value)
            ->when($vehicleIds !== null, static fn ($q) => $q->whereIn('vehicle_id', (array) $vehicleIds))
            ->get(['id', 'vehicle_id', 'wheel_config_id', 'axle']);
        $idOf = [];

        foreach ($rows as $row) {
            $idOf[EngineRows::key((int) $row->vehicle_id, (int) $row->wheel_config_id, (string) $row->axle)] = (int) $row->id;
        }

        $there = DB::table('fitment_wheel_sets')->whereIn('front_fitment_id', array_values($idOf))->get();
        $wanted = [];
        $now = now();

        foreach ($sets as $set) {
            [$front, $rear] = explode('>', $set);

            if (isset($idOf[$front], $idOf[$rear])) {
                $wanted[$idOf[$front].':'.$idOf[$rear]] = [$idOf[$front], $idOf[$rear]];
            }
        }

        foreach ($there as $set) {
            $key = $set->front_fitment_id.':'.$set->rear_fitment_id;

            if (isset($wanted[$key])) {
                unset($wanted[$key]);
            } else {
                DB::table('fitment_wheel_sets')->where('id', $set->id)->delete();
            }
        }

        foreach ($wanted as [$front, $rear]) {
            DB::table('fitment_wheel_sets')->insert(['front_fitment_id' => $front, 'rear_fitment_id' => $rear, 'created_at' => $now, 'updated_at' => $now]);
        }
    }

    /**
     * A new colour's share of the combinations' codes (D-451): where its cell's lines carry codes, the combination now names it too.
     *
     * @param  list<array<string, mixed>>  $list
     */
    private static function tagColour(ApprovalDocument $document, array $list, int $configId): void
    {
        foreach ($list as $row) {
            foreach ($row['codes'] ?? [] as $tagged) {
                [$config, $code] = explode(':', (string) $tagged, 2);

                if ((int) $config !== $configId || $row['vehicle_id'] === null) {
                    continue;
                }

                $ids = DocumentTyreCombination::query()->where('approval_document_id', $document->id)->where('vehicle_id', $row['vehicle_id'])
                    ->where('front_width_mm', $row['front_width_mm'])->where('front_aspect', $row['front_aspect'])->where('front_diameter_in', $row['front_diameter_in'])
                    ->where('rear_width_mm', $row['rear_width_mm'])->where('rear_aspect', $row['rear_aspect'])->where('rear_diameter_in', $row['rear_diameter_in'])->pluck('id');

                foreach ($ids as $id) {
                    DocumentTyreCombinationCondition::query()->firstOrCreate(['document_tyre_combination_id' => (int) $id, 'wheel_config_id' => $configId, 'code' => $code]);
                }
            }
        }
    }

    /**
     * @param  list<array<string, mixed>>  $list
     */
    private function writeList(ApprovalDocument $document, array $list): void
    {
        DocumentTyreCombination::query()->where('approval_document_id', $document->id)->delete();

        foreach ($list as $row) {
            $codes = $row['codes'] ?? [];
            unset($row['codes']);
            $stored = DocumentTyreCombination::query()->create([...$row, 'approval_document_id' => $document->id]);

            foreach ($codes as $tagged) {
                [$configId, $code] = explode(':', (string) $tagged, 2);
                DocumentTyreCombinationCondition::query()->create(['document_tyre_combination_id' => $stored->id, 'wheel_config_id' => (int) $configId, 'code' => $code]);
            }
        }
    }
}
