<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\OrderStatus;
use App\Exceptions\IllegalOrderTransition;
use App\Observers\OrderAlertObserver;
use App\Support\Money;
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
use Illuminate\Support\Str;

/**
 * An order. Guest checkout: `customer_id` points at a row with no password and no account.
 *
 * The vehicle is denormalised onto the order deliberately — an import may soft-delete the vehicle
 * later, and `vehicle_label`, `vehicle_hsn`, `vehicle_tsn` and `vehicle_vsn` must still read
 * correctly on an invoice two years from now.
 *
 * @property int $id
 * @property OrderStatus $status
 * @property string $order_number `2611-10487` — Berlin year and month, then a counter that never resets (D-354); older ones `RMF-2026-0006`
 * @property string|null $public_id a random UUID (v4), the key of the order's links in place of its number (D-354)
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
 * @property CarbonImmutable|null $delivered_at recorded by the team („Zugestellt“); only then can its lines be reviewed
 * @property CarbonImmutable|null $review_invited_at when the review invitation went out, once
 * @property string $origin `checkout` or `seeded` — how the order came about, fixed at insert (D-238)
 * @property-read Collection<int, OrderLine> $lines
 */
#[ObservedBy(OrderAlertObserver::class)]
class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory;

    /** A person placed it through the checkout: it opens only with its proof, never by its number. */
    public const ORIGIN_CHECKOUT = 'checkout';

    /** A seeder wrote it: nobody is behind it, and it opens by number. */
    public const ORIGIN_SEEDED = 'seeded';

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
            'delivered_at' => 'immutable_datetime',
            'review_invited_at' => 'immutable_datetime',
        ];
    }

    /**
     * The state machine, in the model (Block G): a status may only move where OrderStatus::next() allows, and an
     * order whose payment is flagged — an amount that did not match — never moves towards fulfilment. Checked on
     * every save, whatever wrote it: a page, the webhook, a command.
     *
     * And every order its public id on insert (his admin item 18, D-354): a random UUID, the key of its links.
     */
    protected static function booted(): void
    {
        static::creating(static function (Order $order): void {
            $order->public_id ??= (string) Str::uuid();
        });

        static::updating(static function (Order $order): void {
            if (! $order->isDirty('status')) {
                return;
            }

            $from = $order->getOriginal('status');
            $to = $order->status;

            if (! $from instanceof OrderStatus || $from === $to) {
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
     * The VAT rate the order was written at, in basis points — its lines', frozen with them: 0 for a Kleinunternehmer's
     * order (§ 19 UStG). Its invoice, its page and its mail read this, never today's seller flag.
     */
    public function vatRateBp(): int
    {
        $rate = $this->relationLoaded('lines') ? $this->lines->max('tax_rate_bp') : $this->lines()->max('tax_rate_bp');

        return is_numeric($rate) ? (int) $rate : Money::VAT_STANDARD_BP;
    }

    /**
     * Written by a seeder, with nobody behind it. Anything else — an order of unknown provenance included — came
     * through the checkout and is protected: the rule fails closed (EIGENE-FUNDE 131).
     */
    public function seeded(): bool
    {
        return $this->getAttribute('origin') === self::ORIGIN_SEEDED;
    }

    /**
     * Demonstration data: an order born demo (`is_demo`), or one with a wheel from a demo model. It
     * says what an order is — shown as Demodaten, kept out of every real figure — and never who may
     * open it: that is its provenance (`seeded()`, EIGENE-FUNDE 131).
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
