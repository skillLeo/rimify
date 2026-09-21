<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\OrderStatus;
use Carbon\CarbonImmutable;
use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * An order. Guest checkout: `customer_id` points at a row with no password and no account.
 *
 * The vehicle is denormalised onto the order deliberately — an import may soft-delete the vehicle
 * later, and `vehicle_label`, `vehicle_hsn`, `vehicle_tsn` and `vehicle_vsn` must still read
 * correctly on an invoice two years from now.
 *
 * @property int $id
 * @property OrderStatus $status
 * @property string $order_number
 * @property string|null $vehicle_label
 * @property string|null $vehicle_hsn
 * @property string|null $vehicle_tsn
 * @property string|null $vehicle_vsn
 * @property string|null $tracking_code
 * @property int $subtotal_cents
 * @property int $shipping_cents
 * @property int $tax_cents
 * @property int $total_cents
 * @property CarbonImmutable|null $placed_at
 * @property CarbonImmutable|null $paid_at
 * @property CarbonImmutable|null $shipped_at
 * @property-read Collection<int, OrderLine> $lines
 */
class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory;

    protected $fillable = [
        'order_number', 'customer_id', 'delivery_address_id', 'billing_address_id', 'status',
        'vehicle_id', 'vehicle_label', 'vehicle_hsn', 'vehicle_tsn', 'vehicle_vsn',
        'subtotal_cents', 'shipping_cents', 'tax_cents', 'total_cents', 'currency',
        'stripe_session_id', 'stripe_payment_intent_id',
        'note', 'placed_at', 'paid_at', 'shipped_at', 'tracking_code',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'subtotal_cents' => 'integer',
            'shipping_cents' => 'integer',
            'tax_cents' => 'integer',
            'total_cents' => 'integer',
            'placed_at' => 'immutable_datetime',
            'paid_at' => 'immutable_datetime',
            'shipped_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<Customer, $this> */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /** @return BelongsTo<Address, $this> */
    public function deliveryAddress(): BelongsTo
    {
        return $this->belongsTo(Address::class, 'delivery_address_id');
    }

    /** @return BelongsTo<Address, $this> */
    public function billingAddress(): BelongsTo
    {
        return $this->belongsTo(Address::class, 'billing_address_id');
    }

    /** @return HasMany<OrderLine, $this> */
    public function lines(): HasMany
    {
        return $this->hasMany(OrderLine::class);
    }
}
