<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\BrandFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Brand extends Model
{
    /** @use HasFactory<BrandFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $fillable = ['name', 'slug', 'logo_path', 'is_wheel_brand', 'sort_order'];

    /** The GPSR fields (Katalog › Marken › Herstellerangaben), written only by MarkenController::manufacturer. */
    public const MANUFACTURER_FIELDS = ['manufacturer_name', 'manufacturer_address', 'manufacturer_contact', 'eu_responsible_name', 'eu_responsible_address', 'eu_responsible_contact', 'safety_note'];

    /** The generated columns that carry the unique keys among live brands (K2-01): never written, never shown. */
    protected $hidden = ['live_name', 'live_slug'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            // On the homepage brand wall whether or not a wheel is in stock; a tyre brand is not.
            'is_wheel_brand' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * What GPSR asks the offer to name, as the product page prints it — or null while the manufacturer's name,
     * address and contact are not all given. The responsible person in the EU only where one is entered.
     *
     * @return array{name: string, address: string, contact: string, euResponsible: array{name: string, address: string|null, contact: string|null}|null, safetyNote: string|null}|null
     */
    public function manufacturer(): ?array
    {
        $text = fn (string $column): ?string => is_string($v = $this->getAttribute($column)) && trim($v) !== '' ? trim($v) : null;
        [$name, $address, $contact] = [$text('manufacturer_name'), $text('manufacturer_address'), $text('manufacturer_contact')];

        if ($name === null || $address === null || $contact === null) {
            return null;
        }

        $responsible = $text('eu_responsible_name');

        return [
            'name' => $name,
            'address' => $address,
            'contact' => $contact,
            'euResponsible' => $responsible === null ? null : ['name' => $responsible, 'address' => $text('eu_responsible_address'), 'contact' => $text('eu_responsible_contact')],
            'safetyNote' => $text('safety_note'),
        ];
    }

    /** @return HasMany<WheelModel, $this> */
    public function wheelModels(): HasMany
    {
        return $this->hasMany(WheelModel::class);
    }

    /** @return HasMany<TyreVariant, $this> */
    public function tyreVariants(): HasMany
    {
        return $this->hasMany(TyreVariant::class);
    }
}
