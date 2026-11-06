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
use App\Models\DocumentTyreLine;
use App\Models\DocumentWheelSize;
use App\Models\Fitment;
use App\Models\Vehicle;
use App\Services\Admin\Approvals\ConflictDetector;
use App\Services\Admin\Approvals\FitmentRows;
use App\Services\Admin\AuditTrail;
use App\Support\EgNumber;
use Illuminate\Support\Facades\DB;
use LogicException;

/**
 * From what staff entered to the tables the shop reads — the verdict logic never sees the difference (the Gutachten
 * rework §6: „this work changes where data is typed and how it is stored, not how a verdict is decided“).
 *
 * One car entry becomes one row of `fitments` per colour of the paper's wheel size. Its lines become:
 *
 * - the same size in front and behind: a tyre size for both axles;
 * - two different sizes: a row of `document_tyre_combinations`, under the car's field K (D-358). The engine offers a pair only
 *   where the car's row lists both sizes on their axles (TyreEligibility::listedPairs), and a size the paper does not list for
 *   this wheel is „nur auf einer anderen Felgengröße zulässig“ (68B). So a side reaches the axle through the size's own line,
 *   or where staff say the paper lists it only in this combination (`front_on_rim`, `rear_on_rim`) — never by itself: a pair
 *   with a size on another wheel is not offered on this one, which is a missed sale and no wrong answer;
 * - a line with one side (only rows entered before this flow): a tyre size for that axle.
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
 * Only a draft is ever written; a released paper stays what customers were told.
 *
 * @phpstan-import-type State from EngineRows
 */
final class DocumentEntryWriter
{
    /** @var array<string, int> the paper's axle-load caps that name no index: code => kg */
    private array $caps = [];

    /** @var array<string, DocumentCarEntry> which entry each row of the last `desired()` came from: a car has one per wheel size */
    private array $sources = [];

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
        $this->sources = [];
        $configs = [];
        $rows = [];

        foreach ($model->entries as $entry) {
            if ($vehicleIds !== null && ! in_array($entry->vehicle_id, $vehicleIds, true)) {
                continue;
            }

            $row = $this->rowOf($entry, $abnahme);
            /** @var DocumentWheelSize $size */
            $size = $entry->wheelSize;
            $ids = $entry->wheel_config_id !== null
                ? [$entry->wheel_config_id]
                : ($configs[$size->id] ??= $size->configs()->pluck('id')->map(static fn (mixed $id): int => (int) $id)->all());

            foreach ($ids as $id) {
                $key = EngineRows::key($entry->vehicle_id, $id, $entry->axle);
                $rows[$key] = $row;
                $this->sources[$key] = $entry;
            }
        }

        ksort($rows);

        return ['rows' => $rows, 'list' => $this->listOf($model)];
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
                $entry = $this->sources[$key];

                if (! $existing->has($key)) {
                    $this->createRow($document, (int) $vehicleId, (int) $configId, $axle, $row, $entry, $admin);
                } elseif (($current[$key] ?? null) !== $row) {
                    $this->updateRow($existing->get($key), $row, $entry);
                }
            }

            foreach ($existing as $key => $row) {
                if (! isset($desired['rows'][$key])) {
                    $row->delete();
                }
            }

            $this->writeList($document, $desired['list']);
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

        foreach ($query->with('document')->get() as $size) {
            /** @var ApprovalDocument|null $document */
            $document = $size->document;

            if ($document === null || ! in_array($document->status, [DocumentStatus::Draft, DocumentStatus::Published], true)) {
                continue;
            }

            $abnahme = DB::table('document_conditions')->where('approval_document_id', $document->id)
                ->where('kind', ConditionKind::Abnahme->value)->pluck('code')->map(static fn (mixed $code): string => (string) $code)->all();
            $this->caps = self::capsOf($document->id);
            $status = $document->status === DocumentStatus::Published ? FitmentStatus::Published : FitmentStatus::Draft;

            $here = 0;

            foreach (DocumentCarEntry::query()->with(['lines.codes', 'codes', 'vehicle'])->where('document_wheel_size_id', $size->id)->whereNull('wheel_config_id')->get() as $entry) {
                $exists = Fitment::query()->where('approval_document_id', $document->id)->where('vehicle_id', $entry->vehicle_id)
                    ->where('wheel_config_id', $configId)->where('axle', $entry->axle)->exists();

                if (! $exists) {
                    $this->createRow($document, $entry->vehicle_id, $configId, $entry->axle, $this->rowOf($entry, $abnahme), $entry, $admin, $status);
                    $here++;
                }
            }

            if ($here > 0) {
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
     * One row as it should stand.
     *
     * @param  list<string>  $abnahme  the paper's codes of kind Abnahme
     * @return array<string, mixed>
     */
    private function rowOf(DocumentCarEntry $entry, array $abnahme): array
    {
        $sizes = $this->sizesOf($entry);
        $codes = $entry->codes->map(static fn ($code): array => ['code' => $code->code, 'note' => $code->note_de])->values()->all();
        $used = [...array_column($codes, 'code'), ...array_merge([], ...array_column($sizes, 'codes'))];

        return EngineRows::row([
            'build_from' => $entry->build_from?->toDateString(),
            'build_to' => $entry->build_to?->toDateString(),
            'permitted_width_min' => $entry->permitted_width_min,
            'permitted_width_max' => $entry->permitted_width_max,
            'permitted_et_min' => $entry->permitted_et_min,
            'permitted_et_max' => $entry->permitted_et_max,
            'centre_bore_mm' => $entry->centre_bore_mm,
            // As FitmentRows::derive(): never typed — an Abnahme among the codes, or the override with its reason.
            'requires_entry' => match ($entry->entry_override) {
                'required' => true,
                'not_required' => false,
                default => array_intersect($used, $abnahme) !== [],
            },
            'entry_note_de' => $entry->entry_note_de,
            'entry_override' => $entry->entry_override,
            'entry_override_reason' => $entry->entry_override_reason,
            'source_page' => $entry->source_page,
            'sizes' => $sizes,
            'codes' => $codes,
        ]);
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

        foreach ($entry->lines as $line) {
            // A side that does not read writes nothing: the release waits for it.
            if ($line->unread()) {
                continue;
            }

            $codes = $line->codes->pluck('code')->map(static fn (mixed $code): string => (string) $code)->all();
            $front = $line->front();
            $rear = $line->rear();

            // Two sizes, or one size typed with nothing printed beside it: read after the sizes that say something of their own. A
            // line read from a row stands where it stood: the order of a row's sizes is what the verdict lists them in.
            if (EntryModel::paired($line) || (! $line->from_rows && $front !== null && $rear !== null && $codes === [] && $line->kw_min === null && $line->kw_max === null
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
            $codes = $line->codes->pluck('code')->map(static fn (mixed $code): string => (string) $code)->all();

            // One size with nothing beside it, not yet on both axles: a size for both.
            if (! EntryModel::paired($line)) {
                /** @var TyreSize $front */
                $front = $line->front();

                if (! self::carried($sizes, $front, Axle::Front->value) || ! self::carried($sizes, $front, Axle::Rear->value)) {
                    $add($front, null, null, Axle::All->value, $line, $codes);
                }

                continue;
            }

            foreach ([[$line->front(), $line->front_load_index, $line->front_speed_symbol, Axle::Front->value, $line->front_on_rim], [$line->rear(), $line->rear_load_index, $line->rear_speed_symbol, Axle::Rear->value, $line->rear_on_rim]] as [$size, $loadIndex, $symbol, $axle, $onRim]) {
                /** @var TyreSize $size */
                $carrier = self::carried($sizes, $size, $axle);

                // Not on this car's own lines, and nobody said the paper lists it for this wheel: the paper's own rule is that
                // such a size is only permitted on another wheel size (68B). So not on this axle, and the pair is not offered.
                if ($carrier === null && ! $onRim) {
                    continue;
                }

                // Already on this axle, and this side adds nothing of its own: no second entry of the same size.
                if ($carrier !== null && $loadIndex === null && $symbol === null && $codes === [] && $line->kw_min === null && $line->kw_max === null) {
                    continue;
                }

                // A pair the paper prints without figures takes them from the size's own line.
                $add($size, $loadIndex ?? $carrier['min_load_index'] ?? null, $symbol ?? $carrier['min_speed_symbol'] ?? null, $axle, $line, $codes);
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
     * The paper's list of combinations as `document_tyre_combinations` holds it: each pair once per field K.
     *
     * @return list<array<string, mixed>>
     */
    public function listOf(EntryModel $model): array
    {
        $hasList = $model->hasList();
        $printed = $this->printedEntries($model);
        $rows = [];

        foreach ($model->entries as $entry) {
            /** @var Vehicle|null $car */
            $car = $entry->vehicle;

            foreach ($entry->lines as $line) {
                if (! EntryModel::twoSided($line) || ! ($line->in_list ?? $hasList) || ($line->in_list === null && ! self::appliesTo($line, $car))) {
                    continue;
                }

                [$number, $norm] = $this->entryOf($line, $car, $printed);

                if ($norm === null) {
                    continue;
                }

                /** @var TyreSize $front */
                $front = $line->front();
                /** @var TyreSize $rear */
                $rear = $line->rear();
                $key = $norm.'|'.$front->key().'|'.$rear->key();

                $rows[$key] ??= [
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
                ];
            }
        }

        foreach ($model->kept as $kept) {
            $rows['kept|'.$kept->id] = [
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
            ];
        }

        return EngineRows::list($this->numbered(array_values($rows)));
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
     * Each entry's rows numbered: a row that came with its number keeps it, a new one takes the next free one.
     *
     * @param  list<array<string, mixed>>  $rows
     * @return list<array<string, mixed>>
     */
    private function numbered(array $rows): array
    {
        $used = [];

        foreach ($rows as $row) {
            if ($row['number'] !== null) {
                $used[(string) $row['eg_number_norm']][(int) $row['number']] = true;
            }
        }

        foreach ($rows as &$row) {
            if ($row['number'] === null) {
                $entry = (string) $row['eg_number_norm'];
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
     */
    private function createRow(ApprovalDocument $document, int $vehicleId, int $configId, string $axle, array $row, ?DocumentCarEntry $entry, ?AdminUser $admin, FitmentStatus $status = FitmentStatus::Draft): void
    {
        $stored = Fitment::query()->create([
            ...self::columns($row, $entry),
            'approval_document_id' => $document->id,
            'vehicle_id' => $vehicleId,
            'wheel_config_id' => $configId,
            'axle' => $axle,
            'status' => $status->value,
            'created_by' => $admin?->id,
        ]);

        $this->children($stored, $row, $entry);
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function updateRow(Fitment $stored, array $row, ?DocumentCarEntry $entry): void
    {
        $stored->forceFill(self::columns($row, $entry))->save();
        $stored->tyreSizes()->delete();
        $stored->conditionCodes()->delete();
        $this->children($stored, $row, $entry);
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private static function columns(array $row, ?DocumentCarEntry $entry): array
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
            'entry_override_by' => $entry?->entry_override_by,
            'entry_override_at' => $entry?->entry_override_at,
            'source_page' => $row['source_page'],
        ];
    }

    /**
     * The row's sizes and codes in the order they were entered: the compared state holds them sorted, and the shop lists them in
     * the order they were written.
     *
     * @param  array<string, mixed>  $row
     */
    private function children(Fitment $stored, array $row, ?DocumentCarEntry $entry): void
    {
        $now = now();

        /** @var list<array<string, mixed>> $sizes */
        $sizes = $entry === null ? $row['sizes'] : $this->sizesOf($entry);

        foreach ($sizes as $size) {
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

        /** @var list<array{code: string, note: string|null}> $codes */
        $codes = $entry === null ? $row['codes'] : $entry->codes->map(static fn ($code): array => ['code' => $code->code, 'note' => $code->note_de])->values()->all();

        DB::table('fitment_conditions')->insert(array_map(static fn (array $code): array => [
            'fitment_id' => $stored->id,
            'code' => $code['code'],
            'note_de' => $code['note'],
            'created_at' => $now,
            'updated_at' => $now,
        ], $codes));
    }

    /**
     * @param  list<array<string, mixed>>  $list
     */
    private function writeList(ApprovalDocument $document, array $list): void
    {
        DocumentTyreCombination::query()->where('approval_document_id', $document->id)->delete();

        foreach ($list as $row) {
            DocumentTyreCombination::query()->create([...$row, 'approval_document_id' => $document->id]);
        }
    }
}
