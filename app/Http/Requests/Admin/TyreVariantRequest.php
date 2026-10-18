<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Domain\Fitment\Derivation\ReferenceTables;
use App\Enums\TyreSeason;
use App\Models\AdminUser;
use App\Models\Brand;
use App\Models\TyreVariant;
use App\Support\Money;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Creating or changing one tyre in Katalog › Reifen (his admin item 10, D-302) — one size of one profile: its brand, its
 * profile and season, its size with load index and speed symbol, its EU tyre label and how it is sold. Authorised by
 * TyreVariantPolicy: create or edit, never a demonstration tyre.
 *
 * The label may be saved incomplete: such a tyre is kept, and the shop does not offer it until every entry is on record
 * (D-303). What is given must read — a class the regulation does not know, a noise figure no tyre makes, an EPREL number
 * that is not one — or it is refused under its own field, never guessed. The speed symbol's rank is the shop's, read from
 * its table, never typed (H sits between U and V).
 */
class TyreVariantRequest extends FormRequest
{
    /** Fuel efficiency and wet grip, A to E (Regulation (EU) 2020/740, Annex I). */
    public const CLASSES = ['A', 'B', 'C', 'D', 'E'];

    public const NOISE_CLASSES = ['A', 'B', 'C'];

    public const DUPLICATE = 'Diesen Reifen gibt es schon: gleiche Marke, gleiches Profil, gleiche Größe, gleicher Lastindex, gleiches Geschwindigkeitssymbol.';

    /** `%s` is the other tyre, as the list names it: the search finds it by the same number. */
    public const EPREL_TAKEN = 'Diese EPREL-Nummer ist schon beim Reifen „%s“ eingetragen. Prüf auf der EPREL-Seite, zu welchem der beiden Reifen sie gehört.';

    /** A tyre that was ordered keeps the size it was sold in: the order names its Auflagen by that size (PackageTyreSizes). */
    public const SOLD = 'Dieser Reifen wurde schon bestellt. Größe, Lastindex und Geschwindigkeitssymbol lassen sich deshalb nicht mehr ändern. Für andere Werte leg über „Weitere Größe anlegen“ im Menü einen neuen Reifen an.';

    /** What a sold tyre keeps, by the form's names. */
    public const SOLD_FIELDS = ['width_mm', 'aspect', 'diameter_in', 'load_index', 'speed_symbol'];

    public function authorize(): bool
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            return false;
        }

        $tyre = $this->tyre();

        return $tyre === null ? $user->can('create', TyreVariant::class) : $user->can('update', $tyre);
    }

    protected function prepareForValidation(): void
    {
        $trim = static fn (mixed $v): mixed => is_string($v) ? trim($v) : $v;
        $upper = static fn (mixed $v): mixed => is_string($v) ? mb_strtoupper(trim($v)) : $v;

        $this->merge([
            'name' => $trim($this->input('name')),
            'brand_new' => $trim($this->input('brand_new')),
            'speed_symbol' => $upper($this->input('speed_symbol')),
            'eu_fuel_class' => $upper($this->input('eu_fuel_class')),
            'eu_wet_grip_class' => $upper($this->input('eu_wet_grip_class')),
            'eu_noise_class' => $upper($this->input('eu_noise_class')),
            // The number as EPREL prints it; spaces a copy brought along are not part of it.
            'eprel_id' => is_string($this->input('eprel_id')) ? (string) preg_replace('/\s+/', '', $this->input('eprel_id')) : $this->input('eprel_id'),
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
            'season' => ['required', Rule::in(TyreSeason::values())],

            // What passenger tyres measure: a figure outside is a typo, not a product.
            'width_mm' => ['required', 'integer', 'between:125,355'],
            'aspect' => ['required', 'integer', 'between:25,85', 'multiple_of:5'],
            'diameter_in' => ['required', 'integer', 'between:13,24'],
            // The load index from the shop's own table (70 to 109): a tyre beyond it could never be compared.
            'load_index' => ['required', 'integer', Rule::in(array_keys(ReferenceTables::LOAD_INDEX_CAPACITY_KG))],
            'speed_symbol' => ['required', 'string', Rule::in(array_column(ReferenceTables::SPEED_SYMBOLS, 'symbol'))],

            'eu_fuel_class' => ['nullable', Rule::in(self::CLASSES)],
            'eu_wet_grip_class' => ['nullable', Rule::in(self::CLASSES)],
            'eu_noise_db' => ['nullable', 'integer', 'between:50,90'],
            'eu_noise_class' => ['nullable', Rule::in(self::NOISE_CLASSES)],
            'eu_snow_grip' => ['nullable', 'boolean'],
            'eu_ice_grip' => ['nullable', 'boolean'],
            'eprel_id' => ['nullable', 'string', 'regex:/^\d{1,10}$/'],

            'price' => ['required', 'string', 'max:24'],
            'available' => ['required', 'boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'brand_id.required_without' => 'Bitte wähl die Marke oder leg eine neue an.',
            'brand_id.*' => 'Diese Marke gibt es nicht mehr. Wähl bitte eine aus der Liste.',
            'brand_new.max' => 'Der Markenname darf höchstens 60 Zeichen lang sein.',
            'name.required' => 'Bitte gib das Profil ein, zum Beispiel „PremiumContact 7“.',
            'name.max' => 'Das Profil darf höchstens 80 Zeichen lang sein.',
            'season.*' => 'Bitte wähl die Saison.',
            'width_mm.required' => 'Bitte gib die Breite in Millimetern an, zum Beispiel 225.',
            'width_mm.*' => 'Die Breite bitte in Millimetern, zwischen 125 und 355.',
            'aspect.required' => 'Bitte gib den Querschnitt an, zum Beispiel 45.',
            'aspect.*' => 'Den Querschnitt bitte in Prozent, in Fünferschritten zwischen 25 und 85.',
            'diameter_in.required' => 'Bitte gib den Durchmesser in Zoll an, zum Beispiel 18.',
            'diameter_in.*' => 'Den Durchmesser bitte in ganzen Zoll, zwischen 13 und 24.',
            'load_index.required' => 'Bitte gib den Lastindex an, zum Beispiel 95.',
            'load_index.*' => 'Der Shop kennt bisher die Lastindizes 70 bis 109. Prüf die Zahl auf der Reifenflanke. Reifen mit höherem Lastindex lassen sich erst anlegen, wenn die Tragfähigkeiten über 109 freigegeben sind.',
            'speed_symbol.*' => 'Bitte wähl das Geschwindigkeitssymbol aus der Liste.',
            'eu_fuel_class.*' => 'Die Kraftstoffeffizienz hat eine Klasse von A bis E.',
            'eu_wet_grip_class.*' => 'Die Nasshaftung hat eine Klasse von A bis E.',
            'eu_noise_db.*' => 'Das externe Rollgeräusch bitte in Dezibel, als ganze Zahl zwischen 50 und 90.',
            'eu_noise_class.*' => 'Die Rollgeräuschklasse ist A, B oder C.',
            'eu_snow_grip.*' => 'Bitte wähl „Ja“ oder „Nein“.',
            'eu_ice_grip.*' => 'Bitte wähl „Ja“ oder „Nein“.',
            'eprel_id.*' => 'Gib die EPREL-Nummer nur mit Ziffern ein, höchstens zehn.',
            'price.required' => 'Bitte gib den Preis je Reifen an.',
            'available.*' => 'Bitte wähl, ob der Reifen verfügbar ist.',
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [
            // Every check whose own fields read, in one round: a wrong width does not hide a price of 0,00.
            function (Validator $validator): void {
                $errors = $validator->errors();

                if (! $errors->has('price')) {
                    $price = Money::fromGerman((string) $this->input('price'));

                    if ($price === null || $price <= 0) {
                        $errors->add('price', 'Den Preis können wir nicht lesen, oder er ist 0,00. Schreib ihn bitte so: 129,00.');
                    }
                }

                $sold = $this->soldSizeChanged();

                if ($sold !== null && ! $errors->has($sold)) {
                    $errors->add($sold, self::SOLD);
                }

                if (! $errors->hasAny(['brand_id', 'brand_new', 'name', ...self::SOLD_FIELDS]) && $this->tyreTwice()) {
                    $errors->add('name', self::DUPLICATE);
                }

                $eprel = $this->input('eprel_id');

                if (! $errors->has('eprel_id') && is_string($eprel) && $eprel !== '') {
                    $other = TyreVariant::query()->with('brand')->where('eprel_id', $eprel)->whereKeyNot($this->tyre()->id ?? 0)->first();

                    if ($other !== null) {
                        $errors->add('eprel_id', sprintf(self::EPREL_TAKEN, trim(($other->brand->name ?? '').' '.$other->name.' '.$other->label())));
                    }
                }
            },
        ];
    }

    /**
     * The first of a sold tyre's size fields this save would change, or null. Compared as the columns store them, so a
     * form that sends `18` for a diameter kept as 18.0 changes nothing.
     */
    private function soldSizeChanged(): ?string
    {
        $tyre = $this->tyre();

        if ($tyre === null || ! $tyre->wasOrdered()) {
            return null;
        }

        $stored = [
            'width_mm' => (string) (int) $tyre->width_mm,
            'aspect' => (string) (int) $tyre->aspect,
            'diameter_in' => (string) (int) $tyre->diameter_in,
            'load_index' => (string) (int) $tyre->load_index,
            'speed_symbol' => (string) $tyre->speed_symbol,
        ];

        foreach (self::SOLD_FIELDS as $field) {
            $given = $this->input($field);

            if (! is_scalar($given) || trim((string) $given) !== $stored[$field]) {
                return $field;
            }
        }

        return null;
    }

    /** The same brand, profile, size, load index and symbol as another live tyre: one tyre twice in the shop. */
    private function tyreTwice(): bool
    {
        $brand = $this->input('brand_id');

        // A brand typed in is matched by its name, as CatalogueBrands finds it.
        $brandId = $brand !== null && $brand !== ''
            ? (int) $brand
            : Brand::query()->whereRaw('LOWER(name) = ?', [mb_strtolower(trim((string) $this->input('brand_new')))])->value('id');

        if ($brandId === null) {
            return false;
        }

        return TyreVariant::query()
            ->where('brand_id', $brandId)
            ->whereRaw('LOWER(name) = ?', [mb_strtolower((string) $this->input('name'))])
            ->where('width_mm', (int) $this->input('width_mm'))
            ->where('aspect', (int) $this->input('aspect'))
            ->where('diameter_in', (int) $this->input('diameter_in'))
            ->where('load_index', (int) $this->input('load_index'))
            ->where('speed_symbol', (string) $this->input('speed_symbol'))
            ->whereKeyNot($this->tyre()->id ?? 0)
            ->exists();
    }

    /**
     * The tyre's columns as the form gave them. The speed symbol's rank is read from the shop's table, never typed.
     *
     * @return array{brand_id: int|null, brand_new: string|null, name: string, season: string, width_mm: int, aspect: int, diameter_in: float, load_index: int, speed_symbol: string, speed_rank: int, eu_fuel_class: string|null, eu_wet_grip_class: string|null, eu_noise_db: int|null, eu_noise_class: string|null, eu_snow_grip: bool|null, eu_ice_grip: bool|null, eprel_id: string|null, price_cents: int, available: bool}
     */
    public function tyreAttributes(): array
    {
        $text = fn (string $key): ?string => is_string($this->validated($key)) && $this->validated($key) !== '' ? (string) $this->validated($key) : null;
        $flag = fn (string $key): ?bool => $this->validated($key) === null || $this->validated($key) === '' ? null : $this->boolean($key);
        $symbol = (string) $this->validated('speed_symbol');
        $rank = 0;

        foreach (ReferenceTables::SPEED_SYMBOLS as $row) {
            if ($row['symbol'] === $symbol) {
                $rank = $row['rank'];
            }
        }

        return [
            'brand_id' => $this->validated('brand_id') === null ? null : (int) $this->validated('brand_id'),
            'brand_new' => $text('brand_new'),
            'name' => (string) $this->validated('name'),
            'season' => (string) $this->validated('season'),
            'width_mm' => (int) $this->validated('width_mm'),
            'aspect' => (int) $this->validated('aspect'),
            'diameter_in' => (float) $this->validated('diameter_in'),
            'load_index' => (int) $this->validated('load_index'),
            'speed_symbol' => $symbol,
            'speed_rank' => $rank,
            'eu_fuel_class' => $text('eu_fuel_class'),
            'eu_wet_grip_class' => $text('eu_wet_grip_class'),
            'eu_noise_db' => $this->validated('eu_noise_db') === null ? null : (int) $this->validated('eu_noise_db'),
            'eu_noise_class' => $text('eu_noise_class'),
            'eu_snow_grip' => $flag('eu_snow_grip'),
            'eu_ice_grip' => $flag('eu_ice_grip'),
            'eprel_id' => $text('eprel_id'),
            'price_cents' => (int) Money::fromGerman((string) $this->validated('price')),
            'available' => $this->boolean('available'),
        ];
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }

    public function tyre(): ?TyreVariant
    {
        $tyre = $this->route('tyre');

        return $tyre instanceof TyreVariant ? $tyre : null;
    }
}
