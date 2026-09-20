<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\OrderLineKind;
use Database\Factories\OrderLineFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * One line of an order. `label` freezes the description as shown at purchase rather than joining
 * to a catalogue row whose name, finish or price may since have changed.
 *
 * @property OrderLineKind $kind
 */
class OrderLine extends Model
{
    /** @use HasFactory<OrderLineFactory> */
    use HasFactory;

    protected $fillable = [
        'order_id', 'kind', 'wheel_config_id', 'tyre_variant_id', 'package_group',
        'label', 'quantity', 'unit_price_cents', 'line_total_cents', 'tax_rate_bp', 'currency',
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
        ];
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
