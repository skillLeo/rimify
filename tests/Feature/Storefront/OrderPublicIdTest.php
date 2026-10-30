<?php

declare(strict_types=1);

use App\Http\Controllers\Storefront\BestellungController;
use App\Models\AdminUser;
use App\Models\Customer;
use App\Models\Order;
use App\Services\Commerce\OrderLinks;
use App\Services\Commerce\OrderNumbers;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia;

/*
 * His admin item 18, answered (29.10.2026, D-354): „Please use a UUID for the URL and for the order number use a randomly
 * increased number i.e. YYMM-<Randomly incremented number>“. The order's address carries a random UUID in place of its
 * number — the signature stays the protection —, and the number is `YYMM-n` everywhere it is shown.
 */

beforeEach(function (): void {
    $this->seed([CommerceSeeder::class, AccessSeeder::class]);
    $customer = Customer::factory()->create(['email' => 'erika@beispiel.de']);
    // Through the checkout: it opens only with its proof, never by an address alone.
    $this->order = Order::factory()->create([
        'customer_id' => $customer->id,
        'order_number' => DB::transaction(static fn (): string => OrderNumbers::next()),
        'origin' => Order::ORIGIN_CHECKOUT,
        'is_demo' => false,
    ]);
});

it('gives every order a random UUID (v4) and a number of the form YYMM-n', function (): void {
    expect($this->order->public_id)->toMatch('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/')
        ->and($this->order->order_number)->toMatch('/^\d{4}-\d{5,}$/')
        ->and(Order::factory()->create()->public_id)->not->toBe($this->order->public_id);
});

it('links the order by its UUID, signed — and the number is no part of the address', function (): void {
    $link = OrderLinks::link($this->order);

    expect($link)->toContain('/bestellung/'.$this->order->public_id.'?')
        ->toContain('signature=')
        ->not->toContain($this->order->order_number);

    $this->get($link)->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->component('Bestellung/Index')
        ->where('order.number', $this->order->order_number)
        ->where('order.publicId', $this->order->public_id));
});

it('answers the UUID without a valid signature with the 404 — the id is no key on its own', function (): void {
    $this->get('/bestellung/'.$this->order->public_id)->assertNotFound();
    $this->get('/bestellung/'.$this->order->public_id.'?expires='.now()->addDay()->timestamp.'&signature='.str_repeat('0', 64))->assertNotFound();
    $this->getJson('/bestellung/'.$this->order->public_id.'/status')->assertNotFound();
});

it('answers an old link with the number with the 404, signed or not', function (): void {
    $old = Order::factory()->create(['order_number' => 'RMF-2026-0006', 'origin' => Order::ORIGIN_CHECKOUT, 'is_demo' => false]);

    $this->get('/bestellung/RMF-2026-0006')->assertNotFound();
    $this->get('/bestellung/'.$this->order->order_number)->assertNotFound();
    // Signed as the old links were: the address no route takes.
    $this->get(URL::temporarySignedRoute('bestellung.show', now()->addDay(), ['order' => $old->public_id]))->assertOk();
    $this->get(str_replace($old->public_id, 'RMF-2026-0006', URL::temporarySignedRoute('bestellung.show', now()->addDay(), ['order' => $old->public_id])))->assertNotFound();
});

it('opens for the browser that placed it, by its UUID', function (): void {
    $this->withSession([BestellungController::SESSION_PLACED => [$this->order->order_number]])
        ->get('/bestellung/'.$this->order->public_id)
        ->assertOk();
});

it('finds an order in the admin with or without the dash, an old RMF number too', function (): void {
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
    $old = Order::factory()->create(['order_number' => 'RMF-2026-0006', 'is_demo' => false]);
    $find = fn (string $q): array => array_column($this->actingAs($admin, 'admin')->get('/admin/bestellungen?q='.urlencode($q))->assertOk()->viewData('page')['props']['orders'], 'number');

    expect($find($this->order->order_number))->toContain($this->order->order_number)
        ->and($find(str_replace('-', '', $this->order->order_number)))->toContain($this->order->order_number)
        ->and($find('RMF-2026-0006'))->toContain($old->order_number)
        ->and($find('RMF20260006'))->toContain($old->order_number);
});
