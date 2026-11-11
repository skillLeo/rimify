<?php

declare(strict_types=1);

namespace App\Models;

use App\Support\Shipping;
use Database\Factories\ShippingMethodFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * One way an order goes to the customer (his round of 08.11, §7B; D-449), as Einstellungen › Versand holds it: „Standard“,
 * „Express“. Its price includes VAT; from `free_from_cents` on the subtotal it is free. It ships to the countries it names
 * and — where it names any — only the products it names: a basket of rims alone, or with a Komplettrad.
 *
 * @property int $id
 * @property string $name
 * @property string|null $description_de
 * @property int $price_cents
 * @property string $currency
 * @property int|null $free_from_cents
 * @property int $delivery_min_days
 * @property int $delivery_max_days
 * @property list<string> $countries
 * @property list<string>|null $product_types
 * @property int $position
 * @property bool $active
 * @property bool $is_demo
 * @property string|null $demo_ref
 */
class ShippingMethod extends Model
{
    /** @use HasFactory<ShippingMethodFactory> */
    use HasFactory;

    protected $fillable = [
        'name', 'description_de', 'price_cents', 'currency', 'free_from_cents', 'delivery_min_days', 'delivery_max_days',
        'countries', 'product_types', 'position', 'active', 'is_demo', 'demo_ref',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'price_cents' => 'integer',
            'free_from_cents' => 'integer',
            'delivery_min_days' => 'integer',
            'delivery_max_days' => 'integer',
            'countries' => 'array',
            'product_types' => 'array',
            'position' => 'integer',
            'active' => 'boolean',
            'is_demo' => 'boolean',
        ];
    }

    /**
     * Whether it ships this basket: to the country, and every kind of product in it among the ones it names (none named:
     * every product). A basket of rims and a Komplettrad needs a method for both.
     *
     * @param  list<string>  $types  what the basket holds: `felgen`, `komplettrad`
     */
    public function ships(array $types, string $country = Shipping::DOMESTIC): bool
    {
        if (! in_array($country, $this->countries ?? [], true)) {
            return false;
        }

        $own = $this->product_types;

        return $own === null || $own === [] || array_diff($types, $own) === [];
    }
}
