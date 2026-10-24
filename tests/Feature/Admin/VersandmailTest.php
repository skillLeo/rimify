<?php

declare(strict_types=1);

use App\Enums\OrderStatus;
use App\Mail\OrderShippedMail;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\Order;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\Mail;

/*
 * „Als versendet markieren“ tells the customer (the admin audit's F-14): one mail with the order's number, the tracking
 * number the team typed and the order's page — before, the number reached nobody. No carrier is named: none is on
 * record. A mail that cannot go out never undoes the step; the toast and the Protokoll say so.
 */

beforeEach(fn () => $this->seed(AccessSeeder::class));

function shippingAdmin(): AdminUser
{
    return AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
}

it('mails the customer the tracking number when the order is marked sent, and says so', function (): void {
    Mail::fake();
    $order = Order::factory()->status(OrderStatus::Paid)->create();

    $this->actingAs(shippingAdmin(), 'admin')->post("/admin/bestellungen/{$order->id}/versendet", ['tracking' => '00340434 1234'])
        ->assertSessionHas('toast', "Bestellung {$order->order_number} als versendet markiert. Die Versandmail ist verschickt.");

    Mail::assertSent(OrderShippedMail::class, 1);
    Mail::assertSent(OrderShippedMail::class, function (OrderShippedMail $mail) use ($order): bool {
        $html = $mail->render();
        $text = (string) preg_replace('/\s+/u', ' ', strip_tags($html));

        return $mail->hasTo((string) $order->customer?->email)
            && $mail->envelope()->subject === "Deine Bestellung {$order->order_number} ist unterwegs"
            && str_contains($text, "Wir haben deine Bestellung {$order->order_number} verschickt. Die Sendungsnummer lautet 00340434 1234")
            && str_contains($html, '/bestellung/'.$order->order_number.'?expires=')
            && ! str_contains($text, 'DHL');
    });

    expect($order->refresh()->status)->toBe(OrderStatus::Shipped)
        ->and(AuditLog::query()->where('description', 'order.shipping_mail_sent')->sole()->properties['tracking'])->toBe('00340434 1234');
});

it('sends the mail without a tracking sentence when none was typed', function (): void {
    Mail::fake();
    $order = Order::factory()->status(OrderStatus::Paid)->create();

    $this->actingAs(shippingAdmin(), 'admin')->post("/admin/bestellungen/{$order->id}/versendet")->assertSessionHasNoErrors();

    Mail::assertSent(OrderShippedMail::class, fn (OrderShippedMail $mail): bool => ! str_contains($mail->render(), 'Sendungsnummer'));
});

it('keeps the order sent when the mail cannot go out, and says where the reason is', function (): void {
    $order = Order::factory()->status(OrderStatus::Paid)->create();
    Mail::shouldReceive('to')->andThrow(new RuntimeException('554 Message rejected'));

    $this->actingAs(shippingAdmin(), 'admin')->post("/admin/bestellungen/{$order->id}/versendet", ['tracking' => '00340434 5678'])
        ->assertSessionHas('toast', "Bestellung {$order->order_number} als versendet markiert. Die Versandmail ließ sich nicht verschicken – den Grund findest du unter Team › Protokoll.");

    expect($order->refresh()->status)->toBe(OrderStatus::Shipped)
        ->and($order->tracking_code)->toBe('00340434 5678')
        ->and(AuditLog::query()->where('description', 'order.shipping_mail_failed')->sole()->properties['error'])->toBe('554 Message rejected');
});
