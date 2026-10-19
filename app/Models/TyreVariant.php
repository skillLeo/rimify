<?php

declare(strict_types=1);

namespace App\Models;

use App\Services\Demo\AcceptanceSet;
use App\Support\GermanFormat;
use Database\Factories\TyreVariantFactory;
use Illuminate\Contracts\Database\Query\Builder as QueryBuilder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

/**
 * A sellable tyre.
 *
 * `speed_rank` is what every comparison uses; `speed_symbol` is for display only. H sits between
 * U and V, so ordering the letters is code that reads correct and is wrong — in the permissive
 * direction, which is the direction this system must never fail in.
 *
 * @property int $width_mm
 * @property int $aspect
 * @property float $diameter_in
 * @property int $load_index
 * @property int $speed_rank
 * @property string $speed_symbol
 * @property string|null $eu_fuel_class
 * @property string|null $eu_wet_grip_class
 * @property int|null $eu_noise_db
 * @property string|null $eu_noise_class
 * @property bool|null $eu_snow_grip null: not on record — never read as „no“
 * @property bool|null $eu_ice_grip null: not on record — never read as „no“
 * @property string|null $eprel_id
 * @property bool $available verfügbar / nicht verfügbar (D-301)
 * @property int $stock_qty kept from before D-301 and no longer read
 * @property bool $is_demo
 * @property string|null $demo_ref `abnahme:…` for the acceptance set's rows (AcceptanceSet), else null
 */
class TyreVariant extends Model
{
    /** @use HasFactory<TyreVariantFactory> */
    use HasFactory;

    use SoftDeletes;

    /**
     * The EU tyre label's entries (Regulation (EU) 2020/740) by column, as the admin names them. A tyre the shop offers
     * has every one of them on record (D-303).
     */
    public const LABEL_FIELDS = [
        'eu_fuel_class' => 'Kraftstoffeffizienz',
        'eu_wet_grip_class' => 'Nasshaftung',
        'eu_noise_db' => 'Externes Rollgeräusch in dB',
        'eu_noise_class' => 'Rollgeräuschklasse',
        'eu_snow_grip' => 'Schneegriffigkeit',
        'eu_ice_grip' => 'Eisgriffigkeit',
        'eprel_id' => 'EPREL-Nummer',
    ];

    protected $fillable = [
        'brand_id', 'name', 'season', 'width_mm', 'aspect', 'diameter_in',
        'load_index', 'speed_symbol', 'speed_rank',
        'eu_fuel_class', 'eu_wet_grip_class', 'eu_noise_db', 'eu_noise_class', 'eu_snow_grip', 'eu_ice_grip', 'eprel_id',
        'price_cents', 'currency', 'stock_qty', 'available', 'is_demo', 'demo_ref',
    ];

    /** A tyre made in the admin can be bought until someone says otherwise, as a rim's size (D-301). */
    protected $attributes = ['available' => true];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'width_mm' => 'integer',
            'aspect' => 'integer',
            'diameter_in' => 'float',
            'load_index' => 'integer',
            'speed_rank' => 'integer',
            'eu_noise_db' => 'integer',
            'eu_snow_grip' => 'boolean',
            'eu_ice_grip' => 'boolean',
            'price_cents' => 'integer',
            'stock_qty' => 'integer',
            'available' => 'boolean',
            // A seeded demonstration row. Never real stock, and the demo gate refuses to sell it.
            'is_demo' => 'boolean',
        ];
    }

    /**
     * The label entries not on record, by their admin names — empty when the label is complete. NULL is never „no“: a
     * pictogram nobody answered for is missing, not absent (R-17).
     *
     * @return list<string>
     */
    public function missingLabel(): array
    {
        $missing = [];

        foreach (self::LABEL_FIELDS as $column => $name) {
            $value = $this->getAttribute($column);

            if ($value === null || (is_string($value) && trim($value) === '')) {
                $missing[] = $name;
            }
        }

        return $missing;
    }

    /**
     * Whether the shop may offer this tyre (D-303): it can be bought, and its EU label is complete on record — sold at a
     * distance, a tyre is shown with its label beside the price, and without one it is not shown at all. A seeded
     * demonstration tyre carries no label by design (label values travel only with a verified EPREL entry, ACCURACY D7)
     * and is never sold for real (the demo gate), so it is offered as the demonstration it is.
     */
    public function offered(): bool
    {
        return $this->available && ($this->is_demo || $this->missingLabel() === []);
    }

    /** On an order line: its size is then the size sold, and stays (TyreVariantRequest::SOLD). */
    public function wasOrdered(): bool
    {
        return DB::table('order_lines')->where('tyre_variant_id', $this->id)->exists();
    }

    /**
     * The same rule as a query (D-303), for the lists that offer tyres: available, and a demonstration row or a complete
     * label. `$table` is the name or alias the query reads `tyre_variants` under.
     */
    public static function whereOffered(QueryBuilder $query, string $table = 'tyre_variants'): void
    {
        $query->where($table.'.available', true)
            ->where(static function (QueryBuilder $offered) use ($table): void {
                $offered->where($table.'.is_demo', true)->orWhere(static function (QueryBuilder $labelled) use ($table): void {
                    foreach (array_keys(self::LABEL_FIELDS) as $column) {
                        $labelled->whereNotNull($table.'.'.$column);
                    }

                    $labelled->where($table.'.eprel_id', '<>', '');
                });
            });
    }

    /** Demo data the shop must not sell: every demo tyre but the acceptance set's off production. */
    public function refusedAsDemo(): bool
    {
        return AcceptanceSet::refused((bool) $this->is_demo, $this->demo_ref);
    }

    /** `245/45 R18 92Y` */
    public function label(): string
    {
        return GermanFormat::tyreSize(
            $this->width_mm,
            $this->aspect,
            $this->diameter_in,
            $this->load_index,
            $this->speed_symbol,
        );
    }

    /** @return BelongsTo<Brand, $this> */
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }
}
