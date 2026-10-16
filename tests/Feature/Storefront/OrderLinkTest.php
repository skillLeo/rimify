<?php

declare(strict_types=1);

use App\Http\Controllers\Storefront\BestellungController;
use App\Http\Controllers\Storefront\BestellungLinkController;
use App\Mail\OrderConfirmationMail;
use App\Mail\OrderLinkMail;
use App\Models\Customer;
use App\Models\Order;
use App\Services\Commerce\OrderLinks;
use Database\Seeders\CommerceSeeder;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia;

/*
 * The order link (the operator's answer of 15.10.2026, D-240): twelve months, and expiry is not a dead end — an expired
 * link says so in one sentence and offers the order number plus the address it went to, and a fresh link goes to that
 * same address. Opened by its link alone, the page shows the least that is useful.
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
    $this->customer = Customer::factory()->create(['email' => 'erika@beispiel.de']);
    $this->order = Order::factory()->create(['customer_id' => $this->customer->id]);
});

it('signs the mail\'s link for twelve months', function (): void {
    parse_str((string) parse_url(OrderLinks::link($this->order), PHP_URL_QUERY), $query);
    $content = (new OrderConfirmationMail($this->order, null))->content();

    expect((int) $query['expires'])->toBeGreaterThanOrEqual(now()->addMonths(12)->subMinute()->timestamp)
        ->toBeLessThanOrEqual(now()->addMonths(12)->addMinute()->timestamp)
        ->and((string) $content->with['orderUrl'])->toContain('expires=');
});

it('opens the order through its link within twelve months, and shows the address the mail went to shortened', function (): void {
    $this->get(OrderLinks::link($this->order))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Bestellung/Index')->where('payment.email', 'e…@beispiel.de'));

    // The browser that placed it sees the address it typed.
    $this->withSession([BestellungController::SESSION_PLACED => [$this->order->order_number]])->get('/bestellung/'.$this->order->order_number)
        ->assertInertia(fn (AssertableInertia $page) => $page->where('payment.email', 'erika@beispiel.de'));
});

it('leads an expired link — and one from before links expired — to the way back, and a forged one nowhere', function (): void {
    $link = OrderLinks::link($this->order);
    $this->travel(12)->months();
    $this->travel(1)->days();

    $this->get($link)->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->component('Bestellung/Abgelaufen')->where('number', $this->order->order_number));
    $this->get(URL::signedRoute('bestellung.show', ['order' => $this->order->order_number]))
        ->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->component('Bestellung/Abgelaufen'));
    $this->get('/bestellung/'.$this->order->order_number.'?expires=1&signature='.str_repeat('0', 64))->assertNotFound();
});

it('sends a fresh link to the address the order went to, and answers the same whatever is typed', function (): void {
    Mail::fake();

    $this->from('/bestellung/'.$this->order->order_number)
        ->post('/bestellung/link', ['order_number' => ' '.mb_strtolower($this->order->order_number).' ', 'email' => 'Erika@Beispiel.de'])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', BestellungLinkController::SENT);

    Mail::assertSent(OrderLinkMail::class, function (OrderLinkMail $mail): bool {
        $this->get($mail->url)->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->component('Bestellung/Index'));

        return $mail->hasTo('erika@beispiel.de') && $mail->order->is($this->order);
    });

    // Another address, a number that does not exist, a seeded order: the same answer, and nothing sent.
    $seeded = Order::query()->where('origin', Order::ORIGIN_SEEDED)->firstOrFail();
    foreach ([
        ['order_number' => $this->order->order_number, 'email' => 'jemand@anders.de'],
        ['order_number' => 'RMF-2026-9999', 'email' => 'erika@beispiel.de'],
        ['order_number' => $seeded->order_number, 'email' => (string) $seeded->customer?->email],
    ] as $typed) {
        $this->post('/bestellung/link', $typed)->assertSessionHas('toast', BestellungLinkController::SENT);
    }

    Mail::assertSentCount(1);
});

it('asks for the number and a real address in sentences', function (): void {
    $this->from('/bestellung/x')->post('/bestellung/link', ['order_number' => '', 'email' => 'keine-adresse'])
        ->assertSessionHasErrors([
            'order_number' => 'Bitte gib die Bestellnummer an – sie steht in der Bestätigung, zum Beispiel RMF-2026-0012.',
            'email' => 'Bitte gib eine gültige E-Mail-Adresse an.',
        ]);
});
