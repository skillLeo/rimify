<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals\Entry;

use App\Enums\TyreIndexSource;
use App\Enums\VehicleSource;
use App\Http\Controllers\Admin\GutachtenController;
use App\Models\ApprovalDocument;
use App\Models\DocumentCarEntry;
use App\Models\DocumentTyreLine;
use App\Models\DocumentWheelSize;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Services\Admin\Approvals\DocumentConditions;
use App\Support\GermanFormat;
use App\Support\TyreText;
use App\Support\VehicleName;
use Illuminate\Support\Facades\DB;

/**
 * The five steps' state as the page reads it, sent whole with the page and again after every save: the paper's wheel size,
 * the cars with how far each is entered, and what the release will say.
 */
final readonly class EntryView
{
    public function __construct(private DocumentEntryWriter $writer) {}

    /** @return array<string, mixed> */
    public function of(ApprovalDocument $document): array
    {
        $model = EntryModel::of($document);
        $check = (new PairListCheck($this->writer))->of($model);

        return [
            'wheelSizes' => DocumentWheelSize::query()->with('wheelModel.brand')->where('approval_document_id', $document->id)->orderBy('id')->get()
                ->map(fn (DocumentWheelSize $size): array => $this->size($size))->values()->all(),
            'cars' => $model->entries->map(fn (DocumentCarEntry $entry): array => $this->car($entry, $check['conflicts']))->values()->all(),
            'conflicts' => $check['conflicts'],
            'unreachable' => $check['unreachable'],
            'hasList' => $model->hasList(),
            'keptCombinations' => $model->kept->count(),
            'unread' => $this->unread($model),
            'undescribed' => self::undescribed($document, $model),
            'suggestion' => self::suggestion($model),
        ];
    }

    /**
     * One car's lines and codes, for the editor.
     *
     * @return array<string, mixed>
     */
    public function lines(DocumentCarEntry $entry): array
    {
        $entry->loadMissing(['lines.codes', 'codes', 'wheelConfig.wheelFinish']);

        return [
            'id' => (int) $entry->id,
            'page' => $entry->source_page,
            'lines' => $entry->lines->map(static fn (DocumentTyreLine $line): array => self::line($line))->values()->all(),
            'codes' => $entry->codes->map(static fn ($code): array => ['code' => $code->code, 'note' => $code->note_de])->values()->all(),
            'columns' => [
                'entry_note' => $entry->entry_note_de,
                'entry_override' => $entry->entry_override,
                'entry_override_reason' => $entry->entry_override_reason,
                'build_from' => $entry->build_from?->toDateString(),
                'build_to' => $entry->build_to?->toDateString(),
                'width_min' => $entry->permitted_width_min === null ? null : GermanFormat::trimmedDecimal($entry->permitted_width_min),
                'width_max' => $entry->permitted_width_max === null ? null : GermanFormat::trimmedDecimal($entry->permitted_width_max),
                'et_min' => $entry->permitted_et_min,
                'et_max' => $entry->permitted_et_max,
                'centre_bore' => $entry->centre_bore_mm === null ? null : GermanFormat::trimmedDecimal($entry->centre_bore_mm),
            ],
        ];
    }

    /**
     * A paper's read view, car by car: lines and codes as short tags, the text of a code on hover and in the Auflagenverzeichnis —
     * never the wall of repeated text the rows printed (screen 11).
     *
     * @return list<array<string, mixed>>
     */
    public function readView(ApprovalDocument $document): array
    {
        $out = [];

        foreach (EntryModel::of($document)->entries as $entry) {
            /** @var Vehicle|null $car */
            $car = $entry->vehicle;
            $size = $entry->wheelSize;
            $out[] = [
                'id' => (int) $entry->id,
                'car' => $car === null ? 'Fahrzeug #'.$entry->vehicle_id : GutachtenController::vehicleLabel($car),
                'k' => $car?->getAttribute('eg_nummer_raw'),
                'wheel' => $size === null ? null : self::dimensionLabel($size),
                'finish' => $entry->wheelConfig?->wheelFinish?->name_de,
                'axle' => $entry->axle,
                'page' => $entry->source_page,
                'lines' => $entry->lines->map(static fn (DocumentTyreLine $line): array => [
                    'id' => (int) $line->id,
                    'front' => $line->front_unread ?? self::sideText($line, 'front'),
                    'rear' => $line->rear_unread ?? self::sideText($line, 'rear'),
                    'kw' => $line->kw_min === null || $line->kw_max === null ? null : $line->kw_min.'–'.$line->kw_max,
                    'codes' => $line->codes->pluck('code')->map(static fn (mixed $code): string => (string) $code)->values()->all(),
                ])->values()->all(),
                'codes' => $entry->codes->pluck('code')->map(static fn (mixed $code): string => (string) $code)->values()->all(),
            ];
        }

        return $out;
    }

    /**
     * The codes used and not described: what the rows carry (the door's own list), and what stands beside a tyre that does not
     * read yet, which no row carries so far and which the door will name the moment it reads.
     *
     * @return list<string>
     */
    private static function undescribed(ApprovalDocument $document, EntryModel $model): array
    {
        $open = array_column(DocumentConditions::unresolvedIn($document), 'code');
        $defined = DB::table('document_conditions')->where('approval_document_id', $document->id)->pluck('code')->map(static fn (mixed $code): string => (string) $code)->all();

        foreach ($model->entries as $entry) {
            foreach ($entry->lines as $line) {
                foreach ($line->codes as $code) {
                    if (! in_array($code->code, $defined, true) && ! in_array($code->code, $open, true)) {
                        $open[] = $code->code;
                    }
                }
            }
        }

        return $open;
    }

    /** @return array<string, mixed> */
    public static function line(DocumentTyreLine $line): array
    {
        return [
            'id' => (int) $line->id,
            'front' => $line->front_unread ?? self::sideText($line, 'front'),
            'rear' => $line->rear_unread ?? self::sideText($line, 'rear'),
            'oneSided' => ($line->front() === null && $line->front_unread === null) || ($line->rear() === null && $line->rear_unread === null),
            'kw' => $line->kw_min === null || $line->kw_max === null ? '' : $line->kw_min.'-'.$line->kw_max,
            'codes' => $line->codes->pluck('code')->map(static fn (mixed $code): string => (string) $code)->values()->all(),
            'frontOnRim' => $line->front_on_rim,
            'rearOnRim' => $line->rear_on_rim,
            'outsideList' => $line->in_list === false && EntryModel::twoSided($line),
            'frontWhy' => $line->front_unread === null ? null : EntryLineRules::whyNot($line->front_unread),
            'rearWhy' => $line->rear_unread === null ? null : EntryLineRules::whyNot($line->rear_unread),
        ];
    }

    /** A size as its field holds it: `HL 255/35 R20 100`; empty for no side. */
    public static function sideText(DocumentTyreLine $line, string $side): string
    {
        $width = $line->getAttribute("{$side}_width_mm");

        return $width === null ? '' : TyreText::label([
            'width' => (int) $width,
            'aspect' => (int) $line->getAttribute("{$side}_aspect"),
            'diameter' => (float) $line->getAttribute("{$side}_diameter_in"),
            'li' => $line->getAttribute("{$side}_load_index"),
            'si' => $line->getAttribute("{$side}_speed_symbol"),
            'marker' => $line->getAttribute("{$side}_marker"),
        ]);
    }

    /** @return array<string, mixed> */
    private function size(DocumentWheelSize $size): array
    {
        $model = $size->wheelModel;
        $configs = $size->configs()->with('wheelFinish')->get();

        return [
            'id' => (int) $size->id,
            'wheelModelId' => (int) $size->wheel_model_id,
            'configId' => $configs->first()?->id,
            'wheel' => GutachtenController::modelName($model),
            // As the catalogue holds the wheel's Radtypenbezeichnung: staff compare it with the Radtyp the paper prints.
            'wheelType' => $model?->getAttribute('type_designation'),
            'label' => self::dimensionLabel($size),
            'colours' => $configs->map(static fn (WheelConfig $config): array => ['name' => $config->wheelFinish?->name_de, 'hex' => $config->wheelFinish?->hex])->unique('name')->values()->all(),
            'printed' => [
                'type' => $size->printed_type,
                'width' => $size->printed_width_in,
                'diameter' => $size->printed_diameter_in,
                'et' => $size->printed_et_mm,
                'holes' => $size->printed_bolt_holes,
                'circle' => $size->printed_bolt_circle_mm,
            ],
            'mismatch' => self::mismatch($size),
        ];
    }

    /** `8,5J × 18 · ET 35 · 5 × 120 · 72,6 mm`, as the shop writes it (R-10). */
    public static function dimensionLabel(DocumentWheelSize $size): string
    {
        return GermanFormat::wheelLabel($size->width_in, $size->diameter_in, $size->et_mm, $size->bolt_holes, $size->bolt_circle_mm, $size->centre_bore_mm);
    }

    /**
     * Where the chosen size and what the paper prints differ, value by value: a warning, never a block (the operator's note of
     * 06.11.2026: 8 × 18 ET 40 5 × 112 picked while the paper says 8½ × 18 ET 35 120/5). Nothing typed, nothing to compare.
     *
     * @return list<string>
     */
    public static function mismatch(DocumentWheelSize $size): array
    {
        $out = [];

        if ($size->printed_width_in !== null && abs($size->printed_width_in - $size->width_in) > 0.001) {
            $out[] = 'Breite: im Gutachten '.GermanFormat::rimWidth($size->printed_width_in).', gewählt '.GermanFormat::rimWidth($size->width_in);
        }

        if ($size->printed_diameter_in !== null && abs($size->printed_diameter_in - $size->diameter_in) > 0.001) {
            $out[] = 'Durchmesser: im Gutachten '.GermanFormat::trimmedDecimal($size->printed_diameter_in, 1).' Zoll, gewählt '.GermanFormat::trimmedDecimal($size->diameter_in, 1).' Zoll';
        }

        if ($size->printed_et_mm !== null && $size->printed_et_mm !== $size->et_mm) {
            $out[] = 'Einpresstiefe: im Gutachten '.GermanFormat::offset($size->printed_et_mm).', gewählt '.GermanFormat::offset($size->et_mm);
        }

        if (($size->printed_bolt_holes !== null && $size->printed_bolt_holes !== $size->bolt_holes)
            || ($size->printed_bolt_circle_mm !== null && abs($size->printed_bolt_circle_mm - $size->bolt_circle_mm) > 0.001)) {
            $out[] = 'Lochkreis: im Gutachten '.GermanFormat::boltPattern($size->printed_bolt_holes ?? $size->bolt_holes, $size->printed_bolt_circle_mm ?? $size->bolt_circle_mm).', gewählt '.GermanFormat::boltPattern($size->bolt_holes, $size->bolt_circle_mm);
        }

        return $out;
    }

    /**
     * @param  list<array{vehicleId: int, car: string, k: string, pair: string, others: list<string>}>  $conflicts
     * @return array<string, mixed>
     */
    private function car(DocumentCarEntry $entry, array $conflicts): array
    {
        /** @var Vehicle|null $car */
        $car = $entry->vehicle;
        $readable = $entry->lines->reject(static fn (DocumentTyreLine $line): bool => $line->unread());
        $pairs = $readable->filter(static fn (DocumentTyreLine $line): bool => EntryModel::paired($line))->count();
        $source = $car?->getAttribute('source');
        $finish = $entry->wheelConfig?->wheelFinish?->name_de;

        return [
            'id' => (int) $entry->id,
            'sizeId' => (int) $entry->document_wheel_size_id,
            'vehicleId' => (int) $entry->vehicle_id,
            'label' => $car === null ? 'Fahrzeug #'.$entry->vehicle_id : GutachtenController::vehicleLabel($car),
            'hsnTsn' => $car?->hsn === null ? null : $car->hsn.'/'.$car->tsn,
            'kw' => $car?->getAttribute('power_kw'),
            'k' => $car?->getAttribute('eg_nummer_raw'),
            'gone' => $car === null || $car->trashed(),
            'lines' => $readable->count(),
            'pairs' => $pairs,
            'unread' => $entry->lines->filter(static fn (DocumentTyreLine $line): bool => $line->unread())->count(),
            'codes' => $entry->codes->count(),
            'done' => $readable->isNotEmpty(),
            'page' => $entry->source_page,
            'copiedFrom' => $entry->copied_from_id === null ? null : self::copiedName($entry),
            'unsourced' => ! in_array($source, VehicleSource::releasable(), true),
            'sourceLabel' => $source === VehicleSource::Entwicklung->value ? 'aus den Entwicklungsdaten' : null,
            'axle' => $entry->axle,
            'finish' => $finish,
            'conflict' => in_array((int) $entry->vehicle_id, array_column($conflicts, 'vehicleId'), true),
        ];
    }

    private static function copiedName(DocumentCarEntry $entry): ?string
    {
        /** @var DocumentCarEntry|null $from */
        $from = $entry->copiedFrom;
        /** @var Vehicle|null $car */
        $car = $from?->vehicle;

        // „kopiert von BMW M3“: the name alone, the list beside it says the rest.
        return $car === null ? null : VehicleName::from($car);
    }

    /** @return list<array{car: string, entryId: int, text: string}> */
    private function unread(EntryModel $model): array
    {
        $out = [];

        foreach ($model->entries as $entry) {
            foreach ($entry->lines as $line) {
                if ($line->unread()) {
                    /** @var Vehicle|null $car */
                    $car = $entry->vehicle;
                    $out[] = ['car' => $car === null ? '#'.$entry->vehicle_id : GutachtenController::vehicleLabel($car), 'entryId' => (int) $entry->id, 'text' => (string) ($line->front_unread ?? $line->rear_unread)];
                }
            }
        }

        return $out;
    }

    /**
     * What step 5 suggests for how the paper gives its tyres' load index and speed symbol — never a silent default (D-382). Read
     * from what was entered: both figures beside every size, the paper names the tyre itself. A table entered: the table.
     * Otherwise the speeds come from the car's papers — also where it prints the load index alone (the second real paper:
     * „255/35R20 105“ and its 10B): the printed index then stands as the stricter floor (R-06).
     */
    public static function suggestion(EntryModel $model): ?string
    {
        $sides = 0;
        $full = 0;

        foreach ($model->entries as $entry) {
            foreach ($entry->lines as $line) {
                foreach (['front', 'rear'] as $side) {
                    if ($line->getAttribute("{$side}_width_mm") === null) {
                        continue;
                    }

                    $sides++;
                    $full += $line->getAttribute("{$side}_load_index") !== null && $line->getAttribute("{$side}_speed_symbol") !== null ? 1 : 0;
                }
            }
        }

        if ($sides === 0) {
            return null;
        }

        if ($model->document->speedDeratings()->whereNull('seeded_from')->exists()) {
            return TyreIndexSource::Table->value;
        }

        return $full === $sides ? TyreIndexSource::Document->value : TyreIndexSource::Papers->value;
    }
}
