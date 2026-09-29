<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\OrderStatus;
use App\Exceptions\IllegalOrderTransition;
use App\Observers\OrderAlertObserver;
use Carbon\CarbonImmutable;
use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Facades\DB;

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
 * @property string|null $vehicle_make
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
#[ObservedBy(OrderAlertObserver::class)]
class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory;

    protected $fillable = [
        'order_number', 'customer_id', 'delivery_address_id', 'billing_address_id', 'status',
        'vehicle_id', 'vehicle_label', 'vehicle_make', 'vehicle_hsn', 'vehicle_tsn', 'vehicle_vsn',
        'subtotal_cents', 'shipping_cents', 'tax_cents', 'total_cents', 'currency',
        'payment_method', 'shipping_method',
        'stripe_session_id', 'stripe_payment_intent_id',
        'note', 'placed_at', 'paid_at', 'shipped_at', 'tracking_code',
        'refunded_cents', 'payment_flag', 'payment_error', 'stock_reserved', 'expires_at',
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
            'refunded_cents' => 'integer',
            'stock_reserved' => 'boolean',
            'expires_at' => 'immutable_datetime',
            'placed_at' => 'immutable_datetime',
            'paid_at' => 'immutable_datetime',
            'shipped_at' => 'immutable_datetime',
        ];
    }

    /**
     * The state machine, in the model (Block G): a status may only move where OrderStatus::next() allows, and an
     * order whose payment is flagged — an amount that did not match — never moves towards fulfilment. Checked on
     * every save, whatever wrote it: a page, the webhook, a command.
     */
    protected static function booted(): void
    {
        static::updating(static function (Order $order): void {
            if (! $order->isDirty('status')) {
                return;
            }

            $from = $order->getOriginal('status');
            $to = $order->status;

            if (! $from instanceof OrderStatus || ! $to instanceof OrderStatus || $from === $to) {
                return;
            }

            if (! $from->canBecome($to)) {
                throw IllegalOrderTransition::between($order->order_number, $from, $to);
            }

            $flag = $order->getAttribute('payment_flag');

            if (is_string($flag) && $flag !== '' && in_array($to, [OrderStatus::InFulfilment, OrderStatus::Shipped, OrderStatus::Completed], true)) {
                throw IllegalOrderTransition::flagged($order->order_number, $flag);
            }
        });
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

    /**
     * Seeded demonstration data: an order born demo (`is_demo`, DemoDashboardSeeder), or one with a
     * wheel from a demo model (CommerceSeeder). A demo model can never be ordered (KasseController
     * refuses it) and a real order can never be marked demo (R-12), so a real order never matches.
     * The one rule, for the storefront's receipt and the admin alike.
     */
    public function isDemo(): bool
    {
        return (bool) $this->getAttribute('is_demo') || self::demoQuery()->where('ol.order_id', $this->id)->exists();
    }

    /**
     * Adds `shows_demo` (1 or null) to every row of a list, in the same query rather than one per row.
     *
     * @param  Builder<Order>  $query
     * @return Builder<Order>
     */
    public function scopeWithDemoFlag(Builder $query): Builder
    {
        return $query->addSelect(['shows_demo' => self::demoQuery()->whereColumn('ol.order_id', 'orders.id')->selectRaw('1')->limit(1)]);
    }

    /**
     * Only seeded demonstration orders.
     *
     * @param  Builder<Order>  $query
     * @return Builder<Order>
     */
    public function scopeWhereDemo(Builder $query): Builder
    {
        return $query->where(static fn (Builder $q) => $q
            ->where('orders.is_demo', true)
            ->orWhereExists(self::demoQuery()->whereColumn('ol.order_id', 'orders.id')->selectRaw('1')));
    }

    private static function demoQuery(): QueryBuilder
    {
        return DB::table('order_lines as ol')
            ->join('wheel_configs as wc', 'wc.id', '=', 'ol.wheel_config_id')
            ->join('wheel_models as wm', 'wm.id', '=', 'wc.wheel_model_id')
            ->where('wm.is_demo', true);
    }
}
