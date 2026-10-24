<?php

declare(strict_types=1);

use App\Enums\OrderLineKind;
use App\Enums\OrderStatus;
use App\Mail\ReviewInvitationMail;
use App\Models\AdminUser;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\WheelConfig;
use App\Services\Admin\Orders\OrderList;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\Mail;

/*
 * The admin audit's F-15 (ADMIN-AUDIT.md): a partial refund is the money half of an order's status, and „Versendet“ and
 * „Zugestellt“ are the goods half — dates the team records. Shipping the rest of a partly refunded order records its
 * date and keeps „Teilweise erstattet“; a delivered one is never offered „Als versendet markieren“ again. Before, the
 * second press made it „Versendet“ and „Bezahlt“, overwrote „Versandt am“ and counted the order as revenue again.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    config(['rimify.reviews.invite_after_days' => 7]);
});

function refundedAdmin(): AdminUser
{
    return AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
}

/** A real order with one rim line, refunded in part, with the goods dates given. */
function partlyRefunded(array $attributes = []): Order
{
    $order = Order::factory()->status(OrderStatus::PartiallyRefunded)->create(['refunded_cents' => 1000] + $attributes);

    OrderLine::factory()->create([
        'order_id' => $order->id,
        'kind' => OrderLineKind::Wheel->value,
        'wheel_config_id' => WheelConfig::factory()->create()->id,
        'label' => 'Testfelge 8,5J × 18 · ET 35',
        'quantity' => 4,
    ]);

    return $order->fresh() ?? $order;
}

/** The order as Verkauf › Bestellungen lists it. */
function refundedRow(Order $order): array
{
    return app(OrderList::class)->row(Order::query()->withDemoFlag()->whereKey($order->id)->with('customer')->firstOrFail());
}

it('never offers a delivered, partly refunded order „Als versendet markieren“ again — and refuses the press', function (): void {
    $shipped = now()->subDays(6)->startOfSecond();
    $order = partlyRefunded(['shipped_at' => $shipped, 'delivered_at' => now()->subDays(4)]);

    $this->actingAs(refundedAdmin(), 'admin')->post("/admin/bestellungen/{$order->id}/versendet", ['tracking' => '00340434 9999'])->assertForbidden();

    $order->refresh();
    expect($order->status)->toBe(OrderStatus::PartiallyRefunded)
        ->and($order->shipped_at?->equalTo($shipped))->toBeTrue()
        ->and(refundedRow($order)['payment']['label'])->toBe('Teilweise erstattet')
        ->and(refundedRow($order)['fulfilment']['label'])->toBe('Abgeschlossen');
});

it('ships and delivers the rest of a partly refunded order and keeps the refund in its status', function (): void {
    $order = partlyRefunded();
    expect(refundedRow($order)['fulfilment']['label'])->toBe('Zu versenden');

    $this->actingAs(refundedAdmin(), 'admin')->post("/admin/bestellungen/{$order->id}/versendet", ['tracking' => '00340434 1234'])
        ->assertSessionHasNoErrors()->assertSessionHas('toast');

    $order->refresh();
    expect($order->status)->toBe(OrderStatus::PartiallyRefunded)
        ->and($order->shipped_at)->not->toBeNull()
        ->and($order->tracking_code)->toBe('00340434 1234')
        ->and(refundedRow($order)['payment']['label'])->toBe('Teilweise erstattet')
        ->and(refundedRow($order)['fulfilment']['label'])->toBe('Versendet');

    // Shipped once is shipped: the second press is refused.
    $this->actingAs(refundedAdmin(), 'admin')->post("/admin/bestellungen/{$order->id}/versendet")->assertForbidden();

    $this->actingAs(refundedAdmin(), 'admin')->post("/admin/bestellungen/{$order->id}/zugestellt")->assertSessionHas('toast');

    $order->refresh();
    expect($order->status)->toBe(OrderStatus::PartiallyRefunded)
        ->and($order->delivered_at)->not->toBeNull()
        ->and(refundedRow($order)['fulfilment']['label'])->toBe('Abgeschlossen');

    $this->actingAs(refundedAdmin(), 'admin')->post("/admin/bestellungen/{$order->id}/zugestellt")->assertForbidden();
});

it('lets the money half stay: a partly refunded order never becomes „Versendet“ or „Abgeschlossen“ in the model', function (OrderStatus $to): void {
    expect(OrderStatus::PartiallyRefunded->canBecome($to))->toBeFalse();
})->with([OrderStatus::InFulfilment, OrderStatus::Shipped, OrderStatus::Completed]);

it('invites a delivered order that was refunded in part, as every order marked „Zugestellt“', function (): void {
    Mail::fake();

    $order = partlyRefunded(['shipped_at' => now()->subDays(10), 'delivered_at' => now()->subDays(8)]);

    $this->artisan('rimify:bewertungen-einladen')->assertSuccessful();

    Mail::assertSent(ReviewInvitationMail::class, fn (ReviewInvitationMail $mail): bool => $mail->order->is($order));
    expect($order->refresh()->review_invited_at)->not->toBeNull();
});
