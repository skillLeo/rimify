<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\WheelModel;
use App\Support\GermanNumber;
use App\Support\Money;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Creating or changing one Felge in Katalog › Felgen: its master data, its finishes and its sizes, in
 * one save (WheelEditor). Authorised by WheelModelPolicy — create or edit, never publish: a save
 * never puts anything into the shop.
 *
 * Measurements are typed the German way (`8,5`, `66,6`) and read by GermanNumber, prices by
 * Money::fromGerman; a figure either cannot read is refused with a sentence under its own field,
 * never guessed. Every key an error carries is the field's path (`configs.3.price`), so the page puts
 * the sentence under the cell it is about.
 *
 * @phpstan-type FinishInput array{key: string, id: int|null, name: string, hex: string|null, art_finish: string}
 * @phpstan-type ConfigInput array{id: int|null, finish: string, diameter_in: string, width_in: string, et_mm: int, bolt_holes: int, bolt_circle_mm: string, centre_bore_mm: string, sku: string, ean: string|null, kba_number: string|null, price_cents: int, stock_qty: int, weight_g: int|null}
 */
class WheelModelRequest extends FormRequest
{
    public const SPOKES = [5, 7, 10, 20];

    public const BOLT_HOLES = [3, 4, 5, 6, 8, 10];

    public const ART_FINISHES = ['graphite' => 'Graphit', 'silver' => 'Silber', 'black' => 'Schwarz', 'bronze' => 'Bronze', 'polished' => 'Poliert'];

    /** What real wheels measure: a figure outside is a typo, not a product. */
    private const RANGES = [
        'diameter' => [12, 26, 1, 'Zoll'],
        'width' => [4, 14, 2, 'Zoll'],
        'bolt_circle' => [90, 210, 1, 'mm'],
        'bore' => [50, 90, 2, 'mm'],
    ];

    public function authorize(): bool
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            return false;
        }

        $model = $this->wheelModel();

        return $model === null ? $user->can('create', WheelModel::class) : $user->can('update', $model);
    }

    protected function prepareForValidation(): void
    {
        $trim = static fn (mixed $v): mixed => is_string($v) ? trim($v) : $v;

        $this->merge([
            'name' => $trim($this->input('name')),
            'brand_new' => $trim($this->input('brand_new')),
            'type_designation' => $trim($this->input('type_designation')),
            'description' => is_string($this->input('description')) ? trim(str_replace(["\r\n", "\r"], "\n", (string) $this->input('description'))) : $this->input('description'),
            'seo_title' => $trim($this->input('seo_title')),
            'seo_description' => $trim($this->input('seo_description')),
        ]);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'brand_id' => ['nullable', 'integer', 'required_without:brand_new', Rule::exists('brands', 'id')->whereNull('deleted_at')],
            // Missing both is said once, under the brand select (brand_id), not twice.
            'brand_new' => ['nullable', 'string', 'max:60'],
            'name' => ['required', 'string', 'max:80'],
            'type_designation' => ['nullable', 'string', 'max:80'],
            'spoke_count' => ['required', 'integer', Rule::in(self::SPOKES)],
            'description' => ['nullable', 'string', 'max:4000'],
            'seo_title' => ['nullable', 'string', 'max:70'],
            'seo_description' => ['nullable', 'string', 'max:170'],

            'finishes' => ['required', 'array', 'min:1', 'max:20'],
            'finishes.*.key' => ['required', 'string', 'max:40', 'distinct'],
            'finishes.*.id' => ['nullable', 'integer'],
            'finishes.*.name' => ['required', 'string', 'max:60', 'distinct:ignore_case'],
            'finishes.*.hex' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'finishes.*.art_finish' => ['required', 'string', Rule::in(array_keys(self::ART_FINISHES))],

            'configs' => ['present', 'array', 'max:300'],
            'configs.*.id' => ['nullable', 'integer'],
            'configs.*.finish' => ['required', 'string', 'max:40'],
            'configs.*.diameter' => ['required', 'string', 'max:10'],
            'configs.*.width' => ['required', 'string', 'max:10'],
            'configs.*.et' => ['required', 'string', 'max:6'],
            'configs.*.bolt_holes' => ['required', 'integer', Rule::in(self::BOLT_HOLES)],
            'configs.*.bolt_circle' => ['required', 'string', 'max:10'],
            'configs.*.bore' => ['required', 'string', 'max:10'],
            'configs.*.sku' => ['required', 'string', 'max:64', 'regex:/^[A-Za-z0-9._\-\/]+$/', 'distinct:ignore_case'],
            'configs.*.ean' => ['nullable', 'string', 'regex:/^\d{8,14}$/'],
            'configs.*.kba' => ['nullable', 'string', 'max:32'],
            'configs.*.price' => ['required', 'string', 'max:24'],
            'configs.*.stock' => ['required', 'integer', 'min:0', 'max:100000'],
            'configs.*.weight_g' => ['nullable', 'integer', 'min:1000', 'max:40000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'brand_id.required_without' => 'Bitte wähl die Marke oder leg eine neue an.',
            'brand_id.*' => 'Diese Marke gibt es nicht mehr. Wähl bitte eine aus der Liste.',
            'brand_new.required_without' => 'Bitte wähl die Marke oder leg eine neue an.',
            'brand_new.max' => 'Der Markenname darf höchstens 60 Zeichen lang sein.',
            'name.required' => 'Bitte gib den Namen des Modells ein.',
            'name.max' => 'Der Name darf höchstens 80 Zeichen lang sein.',
            'type_designation.max' => 'Die Typbezeichnung darf höchstens 80 Zeichen lang sein.',
            'spoke_count.*' => 'Bitte wähl die Zahl der Speichen: 5, 7, 10 oder 20.',
            'description.max' => 'Die Beschreibung darf höchstens 4.000 Zeichen lang sein.',
            'seo_title.max' => 'Der Titel für Suchmaschinen darf höchstens 70 Zeichen lang sein.',
            'seo_description.max' => 'Die Beschreibung für Suchmaschinen darf höchstens 170 Zeichen lang sein.',

            'finishes.required' => 'Eine Felge braucht mindestens eine Ausführung.',
            'finishes.min' => 'Eine Felge braucht mindestens eine Ausführung.',
            'finishes.max' => 'Mehr als 20 Ausführungen sind für ein Modell nicht vorgesehen.',
            'finishes.*.name.required' => 'Bitte gib der Ausführung einen Namen, zum Beispiel „Graphit matt“.',
            'finishes.*.name.max' => 'Der Name der Ausführung darf höchstens 60 Zeichen lang sein.',
            'finishes.*.name.distinct' => 'Zwei Ausführungen heißen gleich. Gib jeder einen eigenen Namen.',
            'finishes.*.hex.regex' => 'Den Farbwert können wir nicht lesen. Schreib ihn bitte so: #3F454D.',
            'finishes.*.art_finish.*' => 'Bitte wähl die Grundfarbe der Zeichnung.',
            'finishes.*.key.*' => 'Die Ausführung ist unvollständig angekommen. Lad die Seite bitte neu.',
            'finishes.*.id.*' => 'Die Ausführung ist unvollständig angekommen. Lad die Seite bitte neu.',

            'configs.max' => 'Mehr als 300 Größen sind für ein Modell nicht vorgesehen.',
            'configs.*.finish.*' => 'Bitte wähl die Ausführung dieser Größe.',
            'configs.*.diameter.required' => 'Bitte gib den Durchmesser an.',
            'configs.*.width.required' => 'Bitte gib die Breite an.',
            'configs.*.et.required' => 'Bitte gib die Einpresstiefe an.',
            'configs.*.bolt_holes.*' => 'Bitte wähl die Lochzahl.',
            'configs.*.bolt_circle.required' => 'Bitte gib den Lochkreis an.',
            'configs.*.bore.required' => 'Bitte gib die Mittenlochbohrung an.',
            'configs.*.sku.required' => 'Bitte gib die SKU an.',
            'configs.*.sku.max' => 'Die SKU darf höchstens 64 Zeichen lang sein.',
            'configs.*.sku.regex' => 'Die SKU darf nur Buchstaben, Ziffern und . _ - / enthalten.',
            'configs.*.sku.distinct' => 'Diese SKU steht zweimal in der Liste.',
            'configs.*.ean.regex' => 'Die EAN besteht aus 8 bis 14 Ziffern.',
            'configs.*.kba.max' => 'Die KBA-Nummer darf höchstens 32 Zeichen lang sein.',
            'configs.*.price.required' => 'Bitte gib den Preis je Felge an.',
            'configs.*.stock.*' => 'Den Bestand bitte als ganze Zahl ab 0.',
            'configs.*.weight_g.*' => 'Das Gewicht bitte in Gramm, zwischen 1.000 und 40.000.',
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $configs = $this->input('configs');
                $finishKeys = array_map(static fn (mixed $f): string => is_array($f) ? (string) ($f['key'] ?? '') : '', (array) $this->input('finishes'));
                $seen = [];

                foreach (is_array($configs) ? $configs : [] as $i => $config) {
                    if (! is_array($config)) {
                        continue;
                    }

                    foreach (['diameter', 'width', 'bolt_circle', 'bore'] as $field) {
                        [$min, $max, $places, $unit] = self::RANGES[$field];
                        $key = "configs.{$i}.{$field}";

                        if ($validator->errors()->has($key) || ! is_string($config[$field] ?? null)) {
                            continue;
                        }

                        $value = GermanNumber::parse($config[$field], $places);

                        if ($value === null || (float) $value < $min || (float) $value > $max) {
                            $validator->errors()->add($key, self::rangeMessage($field, $min, $max, $unit));
                        }
                    }

                    $et = is_string($config['et'] ?? null) ? GermanNumber::integer($config['et'], true) : null;

                    if (! $validator->errors()->has("configs.{$i}.et") && ($et === null || $et < -99 || $et > 99)) {
                        $validator->errors()->add("configs.{$i}.et", 'Die Einpresstiefe bitte in ganzen Millimetern, zwischen −99 und 99.');
                    }

                    $price = is_string($config['price'] ?? null) ? Money::fromGerman($config['price']) : null;

                    if (! $validator->errors()->has("configs.{$i}.price") && ($price === null || $price <= 0)) {
                        $validator->errors()->add("configs.{$i}.price", 'Den Preis können wir nicht lesen. Schreib ihn bitte so: 189 oder 1.425,50.');
                    }

                    if (! in_array((string) ($config['finish'] ?? ''), $finishKeys, true) && ! $validator->errors()->has("configs.{$i}.finish")) {
                        $validator->errors()->add("configs.{$i}.finish", 'Bitte wähl die Ausführung dieser Größe.');
                    }

                    // The same size twice in one finish: the table's own unique key would refuse it
                    // with a database error — said here, under the second one, in words.
                    $size = implode('|', [
                        $config['finish'] ?? '',
                        GermanNumber::parse((string) ($config['diameter'] ?? ''), 1),
                        GermanNumber::parse((string) ($config['width'] ?? ''), 2),
                        $et,
                        GermanNumber::parse((string) ($config['bolt_circle'] ?? ''), 1),
                    ]);

                    if (isset($seen[$size]) && ! $validator->errors()->has("configs.{$i}.width")) {
                        $validator->errors()->add("configs.{$i}.width", 'Diese Größe gibt es in dieser Ausführung schon (Zeile '.($seen[$size] + 1).').');
                    }

                    $seen[$size] ??= (int) $i;
                }

                $this->skusTakenElsewhere($validator);
            },
        ];
    }

    /** An SKU is the whole catalogue's: one another model already carries is refused under its row. */
    private function skusTakenElsewhere(Validator $validator): void
    {
        $configs = $this->input('configs');

        if (! is_array($configs) || $configs === []) {
            return;
        }

        $skus = [];

        foreach ($configs as $i => $config) {
            if (is_array($config) && is_string($config['sku'] ?? null) && ! $validator->errors()->has("configs.{$i}.sku")) {
                $skus[mb_strtolower(trim($config['sku']))] = (int) $i;
            }
        }

        if ($skus === []) {
            return;
        }

        $model = $this->wheelModel();
        $taken = DB::table('wheel_configs')
            ->whereIn(DB::raw('LOWER(sku)'), array_map('strval', array_keys($skus)))
            ->when($model !== null, static fn ($q) => $q->where('wheel_model_id', '<>', $model?->id))
            ->pluck('sku');

        foreach ($taken as $sku) {
            $i = $skus[mb_strtolower((string) $sku)] ?? null;

            if ($i !== null) {
                $validator->errors()->add("configs.{$i}.sku", 'Diese SKU gehört schon zu einer anderen Felge.');
            }
        }
    }

    private static function rangeMessage(string $field, int $min, int $max, string $unit): string
    {
        return match ($field) {
            'diameter' => "Den Durchmesser bitte in Zoll, zwischen {$min} und {$max}, zum Beispiel 18.",
            'width' => "Die Breite bitte in Zoll, zwischen {$min} und {$max}, zum Beispiel 8,5.",
            'bolt_circle' => "Den Lochkreis bitte in Millimetern, zwischen {$min} und {$max}, zum Beispiel 112.",
            default => "Die Mittenlochbohrung bitte in Millimetern, zwischen {$min} und {$max}, zum Beispiel 66,6.",
        };
    }

    /**
     * The model's own fields, ready for the table.
     *
     * @return array{brand_id: int|null, brand_new: string|null, name: string, type_designation: string|null, spoke_count: int, description_de: string|null, seo_title: string|null, seo_description: string|null}
     */
    public function modelAttributes(): array
    {
        $text = fn (string $key): ?string => is_string($this->validated($key)) && $this->validated($key) !== '' ? (string) $this->validated($key) : null;

        return [
            'brand_id' => $this->validated('brand_id') === null ? null : (int) $this->validated('brand_id'),
            'brand_new' => $text('brand_new'),
            'name' => (string) $this->validated('name'),
            'type_designation' => $text('type_designation'),
            'spoke_count' => (int) $this->validated('spoke_count'),
            'description_de' => $text('description'),
            'seo_title' => $text('seo_title'),
            'seo_description' => $text('seo_description'),
        ];
    }

    /** @return list<FinishInput> */
    public function finishes(): array
    {
        $out = [];

        foreach ((array) $this->validated('finishes') as $finish) {
            $out[] = [
                'key' => (string) $finish['key'],
                'id' => isset($finish['id']) ? (int) $finish['id'] : null,
                'name' => trim((string) $finish['name']),
                'hex' => isset($finish['hex']) && $finish['hex'] !== '' ? strtoupper((string) $finish['hex']) : null,
                'art_finish' => (string) $finish['art_finish'],
            ];
        }

        return $out;
    }

    /** @return list<ConfigInput> */
    public function configs(): array
    {
        $out = [];

        foreach ((array) $this->validated('configs') as $config) {
            $out[] = [
                'id' => isset($config['id']) ? (int) $config['id'] : null,
                'finish' => (string) $config['finish'],
                'diameter_in' => (string) GermanNumber::parse((string) $config['diameter'], 1),
                'width_in' => (string) GermanNumber::parse((string) $config['width'], 2),
                'et_mm' => (int) GermanNumber::integer((string) $config['et'], true),
                'bolt_holes' => (int) $config['bolt_holes'],
                'bolt_circle_mm' => (string) GermanNumber::parse((string) $config['bolt_circle'], 1),
                'centre_bore_mm' => (string) GermanNumber::parse((string) $config['bore'], 2),
                'sku' => trim((string) $config['sku']),
                'ean' => isset($config['ean']) && $config['ean'] !== '' ? (string) $config['ean'] : null,
                'kba_number' => isset($config['kba']) && trim((string) $config['kba']) !== '' ? trim((string) $config['kba']) : null,
                'price_cents' => (int) Money::fromGerman((string) $config['price']),
                'stock_qty' => (int) $config['stock'],
                'weight_g' => isset($config['weight_g']) ? (int) $config['weight_g'] : null,
            ];
        }

        return $out;
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }

    public function wheelModel(): ?WheelModel
    {
        $model = $this->route('model');

        return $model instanceof WheelModel ? $model : null;
    }
}
