<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals\Entry;

use App\Enums\TyreIndexSource;
use App\Enums\VehicleSource;
use App\Http\Controllers\Admin\GutachtenController;
use App\Models\ApprovalDocument;
use App\Models\DocumentCarEntry;
use App\Models\DocumentTyreLine;
use App\Models\DocumentWheelCombination;
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
            'combinations' => DocumentWheelCombination::query()->with(['front', 'rear'])->where('approval_document_id', $document->id)->orderBy('position')->orderBy('id')->get()
                ->map(fn (DocumentWheelCombination $combination): array => $this->combination($combination, $document))->values()->all(),
            'printed' => array_map(static fn (array $row): array => [
                'type' => $row['type'] ?? null,
                'size' => $row['unread']['size'] ?? (isset($row['width'], $row['diameter']) ? GermanFormat::trimmedDecimal($row['width']).' × '.GermanFormat::trimmedDecimal($row['diameter'], 1) : ''),
                'et' => $row['unread']['et'] ?? $row['et'] ?? null,
                'bolts' => $row['unread']['bolts'] ?? (isset($row['holes'], $row['circle']) ? $row['holes'].' × '.GermanFormat::trimmedDecimal($row['circle'], 1) : ''),
            ], $document->printed_wheels ?? []),
            'cars' => $model->entries->map(fn (DocumentCarEntry $entry): array => $this->car($entry, $check['conflicts']))->values()->all(),
            'conflicts' => $check['conflicts'],
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
        $entry->loadMissing(['lines.codes', 'codes', 'wheelConfig.wheelFinish', 'combination.front', 'combination.rear', 'vehicle']);
        $sharing = CarCodes::cellsSharing($entry);

        return [
            'id' => (int) $entry->id,
            'page' => $entry->source_page,
            'lines' => $entry->lines->map(static fn (DocumentTyreLine $line): array => self::line($line, $entry))->values()->all(),
            // The car's, not this cell's (D-452): every wheel combination of the car — and every car of its HSN/TSN — says them.
            'codes' => CarCodes::of($entry),
            'codesFor' => [
                'car' => CarCodes::keyOfEntry($entry),
                'cells' => count($sharing),
                'cars' => count(array_unique(array_map(static fn (DocumentCarEntry $cell): int => (int) $cell->vehicle_id, $sharing))),
            ],
            // This combination's own row's codes, carried from before the five steps where the car's rows said different ones.
            'cellCodes' => $entry->codes->map(static fn ($code): array => ['code' => (string) $code->code, 'note' => $code->note_de])->values()->all(),
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
            $combination = $entry->combination;
            $out[] = [
                'id' => (int) $entry->id,
                'car' => $car === null ? 'Fahrzeug #'.$entry->vehicle_id : GutachtenController::vehicleLabel($car),
                'k' => $car?->getAttribute('eg_nummer_raw'),
                'wheel' => $combination === null ? null : self::combinationLabel($combination),
                'crossed' => EntryModel::crossed($entry),
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
                'codes' => array_values(array_unique([...array_column(CarCodes::of($entry), 'code'), ...$entry->codes->pluck('code')->map(static fn (mixed $code): string => (string) $code)->all()])),
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
    public static function line(DocumentTyreLine $line, DocumentCarEntry $entry): array
    {
        return [
            'id' => (int) $line->id,
            'front' => $line->front_unread ?? self::sideText($line, 'front'),
            'rear' => $line->rear_unread ?? self::sideText($line, 'rear'),
            'oneSided' => ($line->front() === null && $line->front_unread === null) || ($line->rear() === null && $line->rear_unread === null),
            'kw' => $line->kw_min === null || $line->kw_max === null ? '' : $line->kw_min.'-'.$line->kw_max,
            'codes' => $line->codes->pluck('code')->map(static fn (mixed $code): string => (string) $code)->values()->all(),
            'outsideList' => $line->in_list === false && EntryModel::twoSided($line),
            'frontWhy' => $line->front_unread === null ? EntryModel::misfit($entry, $line, 'front') : EntryLineRules::whyNot($line->front_unread),
            'rearWhy' => $line->rear_unread === null ? EntryModel::misfit($entry, $line, 'rear') : EntryLineRules::whyNot($line->rear_unread),
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
            'li2' => $line->getAttribute("{$side}_load_index_dual"),
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
        ];
    }

    /** @return array<string, mixed> */
    private function combination(DocumentWheelCombination $combination, ApprovalDocument $document): array
    {
        /** @var DocumentWheelSize $front */
        $front = $combination->front;
        /** @var DocumentWheelSize $rear */
        $rear = $combination->rear;
        $printed = $document->printed_wheels ?? [];

        return [
            'id' => (int) $combination->id,
            'frontId' => (int) $front->id,
            'rearId' => (int) $rear->id,
            'frontKey' => DocumentWheelSize::keyOf($front->getAttributes()),
            'rearKey' => DocumentWheelSize::keyOf($rear->getAttributes()),
            'frontConfigId' => (int) ($front->configs()->orderBy('id')->value('id') ?? 0),
            'rearConfigId' => (int) ($rear->configs()->orderBy('id')->value('id') ?? 0),
            'same' => $combination->same(),
            'badge' => $combination->same() ? 'gleich vorne und hinten' : 'vorne und hinten verschieden',
            'label' => self::combinationLabel($combination),
            'frontLabel' => self::dimensionLabel($front),
            'rearLabel' => self::dimensionLabel($rear),
            'frontDiameter' => $front->diameter_in,
            'rearDiameter' => $rear->diameter_in,
            'warnings' => [...self::versionWarnings($combination->same() ? 'Die gewählte Felge' : 'Vorne', $front, $printed), ...($combination->same() ? [] : self::versionWarnings('Hinten', $rear, $printed)), ...self::boltWarning($front, $rear)],
        ];
    }

    /** `Vorne 8,5 × 18 ET 35 · Hinten 8,5 × 19 ET 35`; one version: `Vorne und hinten 8,5 × 18 ET 35`. */
    public static function combinationLabel(DocumentWheelCombination $combination): string
    {
        /** @var DocumentWheelSize $front */
        $front = $combination->front;
        /** @var DocumentWheelSize $rear */
        $rear = $combination->rear;

        return $combination->same()
            ? 'Vorne und hinten '.self::versionShort($front)
            : 'Vorne '.self::versionShort($front).' · Hinten '.self::versionShort($rear);
    }

    /** `8,5 × 18 ET 35` */
    public static function versionShort(DocumentWheelSize $size): string
    {
        return GermanFormat::trimmedDecimal($size->width_in).' × '.GermanFormat::trimmedDecimal($size->diameter_in, 1).' '.GermanFormat::offset($size->et_mm);
    }

    /**
     * A version none of the paper's printed rows names: what differs from the nearest of them. A warning, never a block (the operator's
     * note of 06.11.2026). Nothing typed, nothing to compare.
     *
     * @param  list<array<string, mixed>>  $printed
     * @return list<string>
     */
    private static function versionWarnings(string $who, DocumentWheelSize $size, array $printed): array
    {
        $nearest = null;

        foreach ($printed as $row) {
            $differs = self::mismatch($size, $row);

            if ($nearest === null || count($differs) < count($nearest)) {
                $nearest = $differs;
            }
        }

        // What was typed and does not read cannot be compared: said, once per combination, and it blocks nothing.
        $unread = array_merge(...array_map(static fn (array $row): array => array_values((array) ($row['unread'] ?? [])), [[], ...$printed]));
        $said = $unread === [] ? [] : ['Eingetragen, aber nicht lesbar: '.implode(', ', $unread).'. Das können wir nicht vergleichen.'];

        return $nearest === null || $nearest === [] ? $said : [$who.' passt nicht zu dem, was du aus dem Gutachten eingetragen hast. '.implode('; ', $nearest).'.', ...$said];
    }

    /**
     * @return list<string>
     */
    private static function boltWarning(DocumentWheelSize $front, DocumentWheelSize $rear): array
    {
        if ($front->bolt_holes === $rear->bolt_holes && abs($front->bolt_circle_mm - $rear->bolt_circle_mm) < 0.001) {
            return [];
        }

        return ['Vorne und hinten haben verschiedene Lochkreise: '.GermanFormat::boltPattern($front->bolt_holes, $front->bolt_circle_mm).' und '.GermanFormat::boltPattern($rear->bolt_holes, $rear->bolt_circle_mm).'.'];
    }

    /** `8,5J × 18 · ET 35 · 5 × 120 · 72,6 mm`, as the shop writes it (R-10). */
    public static function dimensionLabel(DocumentWheelSize $size): string
    {
        return GermanFormat::wheelLabel($size->width_in, $size->diameter_in, $size->et_mm, $size->bolt_holes, $size->bolt_circle_mm, $size->centre_bore_mm);
    }

    /**
     * Where a version and one row the paper prints differ, value by value.
     *
     * @param  array<string, mixed>  $printed
     * @return list<string>
     */
    public static function mismatch(DocumentWheelSize $size, array $printed): array
    {
        $out = [];
        $width = isset($printed['width']) ? (float) $printed['width'] : null;
        $diameter = isset($printed['diameter']) ? (float) $printed['diameter'] : null;
        $et = isset($printed['et']) ? (int) $printed['et'] : null;
        $holes = isset($printed['holes']) ? (int) $printed['holes'] : null;
        $circle = isset($printed['circle']) ? (float) $printed['circle'] : null;

        if ($width !== null && abs($width - $size->width_in) > 0.001) {
            $out[] = 'Breite: im Gutachten '.GermanFormat::rimWidth($width).', gewählt '.GermanFormat::rimWidth($size->width_in);
        }

        if ($diameter !== null && abs($diameter - $size->diameter_in) > 0.001) {
            $out[] = 'Durchmesser: im Gutachten '.GermanFormat::trimmedDecimal($diameter, 1).' Zoll, gewählt '.GermanFormat::trimmedDecimal($size->diameter_in, 1).' Zoll';
        }

        if ($et !== null && $et !== $size->et_mm) {
            $out[] = 'Einpresstiefe: im Gutachten '.GermanFormat::offset($et).', gewählt '.GermanFormat::offset($size->et_mm);
        }

        if (($holes !== null && $holes !== $size->bolt_holes) || ($circle !== null && abs($circle - $size->bolt_circle_mm) > 0.001)) {
            $out[] = 'Lochkreis: im Gutachten '.GermanFormat::boltPattern($holes ?? $size->bolt_holes, $circle ?? $size->bolt_circle_mm).', gewählt '.GermanFormat::boltPattern($size->bolt_holes, $size->bolt_circle_mm);
        }

        return $out;
    }

    /**
     * @param  list<array{entryId: int, vehicleId: int, car: string, pair: string, combination: string, enteredAt: list<string>}>  $conflicts
     * @return array<string, mixed>
     */
    private function car(DocumentCarEntry $entry, array $conflicts): array
    {
        /** @var Vehicle|null $car */
        $car = $entry->vehicle;
        $readable = $entry->lines->filter(static fn (DocumentTyreLine $line): bool => EntryModel::stands($entry, $line));
        $pairs = $readable->filter(static fn (DocumentTyreLine $line): bool => EntryModel::paired($line))->count();
        $source = $car?->getAttribute('source');
        $finish = $entry->wheelConfig?->wheelFinish?->name_de;

        return [
            'id' => (int) $entry->id,
            'combinationId' => (int) $entry->document_wheel_combination_id,
            'vehicleId' => (int) $entry->vehicle_id,
            'label' => $car === null ? 'Fahrzeug #'.$entry->vehicle_id : GutachtenController::vehicleLabel($car),
            'hsnTsn' => $car?->hsn === null ? null : $car->hsn.'/'.$car->tsn,
            'kw' => $car?->getAttribute('power_kw'),
            'k' => $car?->getAttribute('eg_nummer_raw'),
            'gone' => $car === null || $car->trashed(),
            'lines' => $readable->count(),
            'pairs' => $pairs,
            'unread' => $entry->lines->count() - $readable->count(),
            'codes' => count(CarCodes::unique([...CarCodes::of($entry), ...$entry->codes->map(static fn ($code): array => ['code' => (string) $code->code, 'note' => $code->note_de])->all()])),
            'done' => $readable->isNotEmpty(),
            'page' => $entry->source_page,
            'copiedFrom' => $entry->copied_from_id === null ? null : self::copiedName($entry),
            'unsourced' => ! in_array($source, VehicleSource::releasable(), true),
            'sourceLabel' => $source === VehicleSource::Entwicklung->value ? 'aus den Entwicklungsdaten' : null,
            'axle' => $entry->axle,
            'finish' => $finish,
            'conflict' => in_array((int) $entry->id, array_column($conflicts, 'entryId'), true),
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
     * from what was entered: both figures beside every size, the paper names the tyre itself (a table of load at speed is never
     * typed: the shop reads ETRTO's, D-459).
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

        return $full === $sides ? TyreIndexSource::Document->value : TyreIndexSource::Papers->value;
    }
}
