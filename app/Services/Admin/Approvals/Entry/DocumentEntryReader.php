<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals\Entry;

use App\Enums\FitmentStatus;
use App\Models\ApprovalDocument;
use App\Models\DocumentCarEntry;
use App\Models\DocumentCarEntryCode;
use App\Models\DocumentKeptCombination;
use App\Models\DocumentTyreCombination;
use App\Models\DocumentTyreLine;
use App\Models\DocumentTyreLineCode;
use App\Models\DocumentWheelCombination;
use App\Models\DocumentWheelSize;
use App\Models\Fitment;
use App\Models\FitmentCondition;
use App\Models\FitmentTyreSize;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Services\Admin\Approvals\CombinationCars;
use App\Support\EgNumber;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * A Gutachten entered before the five steps, carried into them (the Gutachten rework, Phase 2): the tables staff type in are
 * built from the rows the shop reads, and those rows are not touched — so no answer can change through this. What it must
 * prove is the way back: writing what it built must give exactly the rows it read (DocumentEntryProof), or the next Fassung
 * of that paper would change answers nobody meant to change.
 *
 * - Colours: a car's rows for every live colour of a dimension, all alike, become one entry. Where they differ, or a colour is
 *   missing, every row becomes an entry of its own for that one colour.
 * - A tyre size for both axles becomes a line with the same size on both sides; a size scoped to one axle, a line with one side.
 * - A row of the list of combinations becomes a line on each car it reaches and whose rows carry both sizes on their axles;
 *   a row no car carries is kept apart (`document_kept_combinations`).
 */
class DocumentEntryReader
{
    /**
     * Builds the entry of a document that has none yet, and proves it writes back. Nothing to do where one exists.
     *
     * @throws RuntimeException where the way back would change a row, with nothing built
     */
    public function ensure(ApprovalDocument $document): void
    {
        if (DocumentWheelSize::query()->where('approval_document_id', $document->id)->exists()
            || DocumentKeptCombination::query()->where('approval_document_id', $document->id)->exists()) {
            return;
        }

        DB::transaction(function () use ($document): void {
            // Its list per car first, as the shop reads it already (D-447): each row then goes back onto its car.
            if (CombinationCars::perCar()) {
                (new CombinationCars)->bind((int) $document->id);
            }

            $this->build($document);

            $differences = (new DocumentEntryProof(new DocumentEntryWriter))->differences($document);

            if ($differences !== []) {
                throw new RuntimeException(sprintf('%s lässt sich nicht verlustfrei in die Erfassung übernehmen: %s', $document->kind->labelDe().' '.($document->number() ?? '#'.$document->id), implode('; ', array_slice($differences, 0, 5))));
            }
        });
    }

    private function build(ApprovalDocument $document): void
    {
        $rows = Fitment::query()
            ->with(['tyreSizes.conditionCodes', 'conditionCodes'])
            ->where('approval_document_id', $document->id)
            ->where('status', '<>', FitmentStatus::Retired->value)
            ->orderBy('id')
            ->get();
        $configs = WheelConfig::withTrashed()->whereIn('id', $rows->pluck('wheel_config_id')->unique())->get()->keyBy('id');
        $vehicles = Vehicle::withTrashed()->whereIn('id', $rows->pluck('vehicle_id')->unique())->get()->keyBy('id');
        $byDimension = $rows->groupBy(static fn (Fitment $row): string => self::dimensionKey($configs[$row->wheel_config_id]));
        $entries = collect();
        $position = 0;

        foreach ($byDimension as $dimensionRows) {
            /** @var WheelConfig $first */
            $first = $configs[$dimensionRows->first()?->wheel_config_id];
            $size = DocumentWheelSize::query()->create(['approval_document_id' => $document->id, ...array_intersect_key($first->getAttributes(), array_flip(DocumentWheelSize::DIMENSION))]);
            $live = $size->configs()->pluck('id')->map(static fn (mixed $id): int => (int) $id)->sort()->values()->all();
            // A paper from before this flow: each dimension for itself, front and rear the same.
            $combination = DocumentWheelCombination::query()->create(['approval_document_id' => $document->id, 'front_wheel_size_id' => $size->id, 'rear_wheel_size_id' => $size->id, 'position' => $position]);

            foreach ($dimensionRows->groupBy(static fn (Fitment $row): string => self::signature($row)) as $alike) {
                $ids = $alike->map(static fn (Fitment $row): int => (int) $row->wheel_config_id)->sort()->values()->all();

                if ($ids === $live) {
                    $entries->push($this->entry($document, $combination, $alike->first(), null, $position++));

                    continue;
                }

                foreach ($alike as $row) {
                    $entries->push($this->entry($document, $combination, $row, (int) $row->wheel_config_id, $position++));
                }
            }
        }

        $this->combinations($document, $entries, $vehicles);
    }

    /** The columns of a row that make it one dimension of one wheel. */
    private static function dimensionKey(WheelConfig $config): string
    {
        return implode('|', array_map(static fn (string $column): string => number_format((float) $config->getAttribute($column), 2, '.', ''), DocumentWheelSize::DIMENSION));
    }

    /** What makes two rows of one car on one dimension alike: everything but their colour. */
    private static function signature(Fitment $row): string
    {
        return (string) json_encode([
            $row->vehicle_id,
            $row->axle->value,
            $row->only(['entry_note_de', 'source_page', 'entry_override', 'entry_override_reason', 'entry_override_by', 'requires_entry', 'centre_bore_mm', 'permitted_width_min', 'permitted_width_max', 'permitted_et_min', 'permitted_et_max']),
            $row->build_from?->toDateString(),
            $row->build_to?->toDateString(),
            // In their order: it is what the verdict lists them in.
            $row->tyreSizes->map(static fn (FitmentTyreSize $size): array => [EngineRows::sizeKey($size->only(['width_mm', 'aspect', 'diameter_in', 'axle', 'kw_min', 'kw_max', 'min_load_index', 'min_speed_symbol'])), $size->conditionCodes->pluck('code')->sort()->values()->all()])->values()->all(),
            $row->conditionCodes->map(static fn (FitmentCondition $code): array => [$code->code, $code->note_de])->sortBy(0)->values()->all(),
        ]);
    }

    private function entry(ApprovalDocument $document, DocumentWheelCombination $combination, Fitment $row, ?int $configId, int $position): DocumentCarEntry
    {
        $entry = DocumentCarEntry::query()->create([
            'approval_document_id' => $document->id,
            'document_wheel_combination_id' => $combination->id,
            'vehicle_id' => $row->vehicle_id,
            'wheel_config_id' => $configId,
            'axle' => $row->axle->value,
            'source_page' => $row->source_page,
            'build_from' => $row->build_from?->toDateString(),
            'build_to' => $row->build_to?->toDateString(),
            'permitted_width_min' => $row->permitted_width_min,
            'permitted_width_max' => $row->permitted_width_max,
            'permitted_et_min' => $row->permitted_et_min,
            'permitted_et_max' => $row->permitted_et_max,
            'centre_bore_mm' => $row->centre_bore_mm,
            'entry_note_de' => $row->entry_note_de,
            'entry_override' => $row->entry_override,
            'entry_override_reason' => $row->entry_override_reason,
            'entry_override_by' => $row->entry_override_by,
            'entry_override_at' => $row->entry_override_at,
            'position' => $position,
        ]);

        // The row's own codes stay this combination's (D-452): a row of before the five steps says them for its wheel, not the car's.
        foreach ($row->conditionCodes as $code) {
            DocumentCarEntryCode::query()->create(['document_car_entry_id' => $entry->id, 'code' => $code->code, 'note_de' => $code->note_de]);
        }

        foreach ($row->tyreSizes->sortBy('id')->values() as $i => $size) {
            $front = $size->axle->coversFront();
            $rear = $size->axle->coversRear();
            $side = static fn (bool $on, string $name): array => $on ? [
                "{$name}_width_mm" => $size->width_mm,
                "{$name}_aspect" => $size->aspect,
                "{$name}_diameter_in" => $size->diameter_in,
                "{$name}_load_index" => $size->min_load_index,
                "{$name}_speed_symbol" => $size->min_speed_symbol,
            ] : [];

            $line = DocumentTyreLine::query()->create([
                'document_car_entry_id' => $entry->id,
                'position' => $i,
                ...$side($front, 'front'),
                ...$side($rear, 'rear'),
                'kw_min' => $size->kw_min,
                'kw_max' => $size->kw_max,
                'from_rows' => true,
            ]);

            foreach ($size->conditionCodes as $code) {
                DocumentTyreLineCode::query()->create(['document_tyre_line_id' => $line->id, 'code' => $code->code]);
            }
        }

        return $entry;
    }

    /**
     * The document's list of combinations onto the cars it reaches. A list says for itself what it holds: on a paper with one,
     * a line it does not name stays out of it, and a line it names is marked with the row it carries.
     *
     * @param  Collection<int, DocumentCarEntry>  $entries
     * @param  Collection<int, Vehicle>  $vehicles
     */
    private function combinations(ApprovalDocument $document, Collection $entries, Collection $vehicles): void
    {
        $list = DocumentTyreCombination::query()->where('approval_document_id', $document->id)->orderBy('id')->get();

        if ($list->isEmpty()) {
            return;
        }

        DocumentTyreLine::query()->whereIn('document_car_entry_id', $entries->pluck('id'))->update(['in_list' => false]);

        foreach ($list as $row) {
            $number = EgNumber::parse($row->eg_number_norm);
            $carried = false;

            foreach ($entries as $entry) {
                // A row entered for a car goes back onto that car alone (D-447); one that names no car, onto the cars its entry takes in.
                if ($row->vehicle_id !== null) {
                    if ($row->vehicle_id !== (int) $entry->vehicle_id) {
                        continue;
                    }
                } else {
                    $car = $vehicles[$entry->vehicle_id] ?? null;
                    $k = EgNumber::parse($car === null ? null : (is_string($norm = $car->getAttribute('eg_nummer_norm')) ? $norm : null));

                    if ($number === null || $k === null || ! $number->covers($k)) {
                        continue;
                    }
                }

                $carried = $this->carry($entry, $row) || $carried;
            }

            if (! $carried) {
                DocumentKeptCombination::query()->create([
                    'approval_document_id' => $document->id,
                    ...$row->only([...(CombinationCars::perCar() ? ['vehicle_id'] : []), 'eg_number', 'eg_number_norm', 'number', 'front_width_mm', 'front_aspect', 'front_diameter_in', 'rear_width_mm', 'rear_aspect', 'rear_diameter_in', 'source_page', 'carried_over']),
                ]);
            }
        }
    }

    /**
     * Puts a row of the list on a car whose row carries both its sizes on their axles. Whether it could. Also for a list bound to
     * its cars (CombinationCars, D-447): a pair the shop gave a car under its field K, though only another car was entered with it.
     */
    public function carry(DocumentCarEntry $entry, DocumentTyreCombination $row): bool
    {
        $lines = DocumentTyreLine::query()->where('document_car_entry_id', $entry->id)->orderBy('position')->get();
        $on = static fn (DocumentTyreLine $line, string $side, int $width, int $aspect, float $diameter): bool => $line->getAttribute("{$side}_width_mm") === $width
            && $line->getAttribute("{$side}_aspect") === $aspect
            && (float) $line->getAttribute("{$side}_diameter_in") === $diameter;
        $front = static fn (DocumentTyreLine $line): bool => $on($line, 'front', $row->front_width_mm, $row->front_aspect, (float) $row->front_diameter_in);
        $rear = static fn (DocumentTyreLine $line): bool => $on($line, 'rear', $row->rear_width_mm, $row->rear_aspect, (float) $row->rear_diameter_in);

        if (! $lines->contains($front) || ! $lines->contains($rear)) {
            return false;
        }

        $marks = ['in_list' => true, 'list_entry' => $row->eg_number, 'list_number' => $row->number, 'list_page' => $row->source_page, 'list_carried_over' => $row->carried_over];
        // The same size on both axles: the size's own line, where it has one that does not carry a row yet.
        $own = $lines->first(static fn (DocumentTyreLine $line): bool => $front($line) && $rear($line) && $line->in_list === false);

        // The combination's own codes (D-451) come with it: the line is where they are typed, and where the next save reads them.
        $codes = DB::table('document_tyre_combination_conditions')->where('document_tyre_combination_id', $row->id)->distinct()->orderBy('code')->pluck('code')
            ->map(static fn (mixed $code): string => (string) $code)->all();
        $withCodes = static function (DocumentTyreLine $line) use ($codes): void {
            foreach ($codes as $code) {
                DocumentTyreLineCode::query()->firstOrCreate(['document_tyre_line_id' => $line->id, 'code' => $code]);
            }
        };

        if ($own !== null) {
            $own->forceFill($marks)->save();
            $withCodes($own);

            return true;
        }

        $line = DocumentTyreLine::query()->create([
            'document_car_entry_id' => $entry->id,
            'position' => (int) $lines->max('position') + 1,
            'front_width_mm' => $row->front_width_mm,
            'front_aspect' => $row->front_aspect,
            'front_diameter_in' => $row->front_diameter_in,
            'rear_width_mm' => $row->rear_width_mm,
            'rear_aspect' => $row->rear_aspect,
            'rear_diameter_in' => $row->rear_diameter_in,
            // Not a row's own size: both sides already stand on the car's lines, this adds the pair and nothing else.
            'from_rows' => false,
            ...$marks,
        ]);
        $withCodes($line);

        return true;
    }
}
