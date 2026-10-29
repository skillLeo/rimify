<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\OrderLineKind;
use App\Support\GermanFormat;
use Database\Factories\OrderLineFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * One line of an order. `label` freezes the description as shown at purchase rather than joining
 * to a catalogue row whose name, finish or price may since have changed. `components` freezes a Komplettrad's rows as sold —
 * Felge, Reifen, Montage und Auswuchten, Wuchtgewichte (his #15, D-355); null on a line from before, and on a rim alone.
 *
 * @property OrderLineKind $kind
 * @property string|null $axle `FRONT` or `REAR` on a Mischbereifung line (#20, D-105); null on every other
 * @property list<array{key: string, label: string, quantity: int, unitPriceCents: int|null, lineTotalCents: int|null}>|null $components
 */
class OrderLine extends Model
{
    /** @use HasFactory<OrderLineFactory> */
    use HasFactory;

    protected $fillable = [
        'order_id', 'kind', 'wheel_config_id', 'tyre_variant_id', 'package_group', 'axle',
        // Which Wuchtgewicht colour and which RDKS price the line was frozen from — for reporting,
        // never for re-reading a price: unit_price_cents and label are what was charged.
        'balance_weight_colour_id', 'tpms_sensor_price_id',
        'label', 'quantity', 'unit_price_cents', 'line_total_cents', 'tax_rate_bp', 'currency',
        'components',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'kind' => OrderLineKind::class,
            'quantity' => 'integer',
            'unit_price_cents' => 'integer',
            'line_total_cents' => 'integer',
            'tax_rate_bp' => 'integer',
            'package_group' => 'integer',
            'components' => 'array',
        ];
    }

    /**
     * The rows a Komplettrad line was sold with, as the pages print them: `Reifen`, 4, `189,00 €`, `756,00 €`. Empty on
     * a line that has none (D-355).
     *
     * @return list<array{label: string, quantity: int, unitPrice: string, lineTotal: string}>
     */
    public function componentRows(): array
    {
        $rows = [];

        foreach ($this->components ?? [] as $row) {
            // An open price is no row: such a set was never sold (Basket refuses it).
            if ($row['unitPriceCents'] === null || $row['lineTotalCents'] === null) {
                continue;
            }

            $rows[] = [
                'label' => $row['label'],
                'quantity' => $row['quantity'],
                'unitPrice' => GermanFormat::money($row['unitPriceCents']),
                'lineTotal' => GermanFormat::money($row['lineTotalCents']),
            ];
        }

        return $rows;
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return HasOne<OrderLineFitment, $this> */
    public function fitmentSnapshot(): HasOne
    {
        return $this->hasOne(OrderLineFitment::class, 'order_line_id');
    }
}
