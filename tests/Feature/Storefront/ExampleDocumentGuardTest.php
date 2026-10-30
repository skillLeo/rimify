<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Storefront\VehicleContext;
use App\Http\Controllers\Admin\GutachtenController;
use App\Mail\OrderConfirmationMail;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\OrderLineFitment;
use App\Services\Commerce\OrderLinks;
use App\Services\Commerce\OrderPaid;
use App\Services\Commerce\OrderRefused;
use App\Services\Commerce\OrderWriter;
use App\Services\Demo\DemoPurge;
use App\Services\Storefront\Basket;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;
use Tests\Support\Storefront\ExampleDocument;
use Tests\Support\Storefront\KomplettradFixture;

/*
 * Decision 6, the third-wheel guard (the operator's briefs of 15.10.2026, D-239): a demo document never produces a
 * verdict that lands on a real order. On production the checkout refuses such a line — in the basket and again at the
 * order. Elsewhere — the preview, where every order is a test — it is bought, and the order is born demo with every row
 * it writes: opened only by its proof, in no real figure, no invoice, taken away by the reset. The document is marked
 * wherever it is shown or opened.
 */
beforeEach(function (): void {
    $this->seed([CommerceSeeder::class, AccessSeeder::class]);
    config([
        // The test payment exists only with the review on (TestzahlungTest): off production, the purchase goes through.
        'rimify.review.enabled' => true,
        'rimify.payments.driver' => 'sandbox',
        'rimify.shipping.cost_cents' => 0,
        'rimify.shipping.free_from_cents' => null,
        'rimify.shipping.delivery_time' => '3–5 Werktage',
    ]);
    $this->fx = KomplettradFixture::permitted();
    $this->fx->config->forceFill(['stock_qty' => 20])->save();
    $this->example = ExampleDocument::takeOver($this->fx);
});

/** @return array<string, mixed> */
function exampleBasket(object $test): array
{
    return [Basket::SESSION_KEY => ['wheel:'.$test->fx->config->id => ['kind' => 'WHEEL', 'wheelConfigId' => $test->fx->config->id, 'tyreVariantId' => null, 'quantity' => 4]]];
}

/** @return array<string, mixed> */
function exampleForm(): array
{
    return ['email' => 'test@beispiel.de', 'phone' => '', 'name' => 'Erika Mustermann', 'street' => 'Hauptstraße', 'houseNumber' => '12', 'zip' => '50667', 'city' => 'Köln', 'billingSame' => true, 'shipping' => 'standard'];
}

function examplePurchase(object $test): Order
{
    $test->withCookies($test->fx->cookies())->withSession(exampleBasket($test))->from('/kasse')->post('/kasse', exampleForm())->assertSessionHasNoErrors();

    return Order::query()->latest('id')->firstOrFail();
}

it('rests the very same answer on the example document now', function (): void {
    $verdict = app(FitmentResolver::class)->resolve((int) $this->fx->vehicle->id, (int) $this->fx->config->id);

    expect($verdict->isSellable())->toBeTrue()
        ->and($verdict->document?->id)->toBe($this->example->id)
        ->and($verdict->document?->isDemo)->toBeTrue()
        ->and($verdict->toArray()['document']['isDemo'] ?? null)->toBeTrue();
});

it('refuses on production a line whose answer rests on an example document — in the basket and again at the order — and writes nothing', function (): void {
    app()->detectEnvironment(static fn (): string => 'production');

    $request = Request::create('/kasse', 'POST', [], [VehicleContext::COOKIE => (new VehicleContext((int) $this->fx->vehicle->id, true))->encode()]);
    $request->setLaravelSession($session = app('session.store'));

    foreach (exampleBasket($this) as $key => $value) {
        $session->put($key, $value);
    }

    $basket = app(Basket::class);
    $summary = $basket->summary($request);
    $before = Order::query()->count();
    $customer = ['email' => 'test@beispiel.de', 'phone' => null, 'name' => 'Erika Mustermann', 'street' => 'Hauptstraße', 'houseNumber' => '12', 'zip' => '50667', 'city' => 'Köln', 'billingSame' => true];

    expect($basket->refusalOf($summary))->toBe(Basket::DEMO_DOCUMENT_REFUSAL)
        ->and(fn () => app(OrderWriter::class)->write($request, $customer, $summary, 'sandbox'))->toThrow(OrderRefused::class, Basket::DEMO_DOCUMENT_REFUSAL)
        ->and(Order::query()->count())->toBe($before);
});

it('lets the purchase through off production, born demo with every row it writes, and opened only by its proof', function (): void {
    $order = examplePurchase($this);
    $lines = OrderLine::query()->where('order_id', $order->id)->get();
    $snapshots = OrderLineFitment::query()->whereIn('order_line_id', $lines->pluck('id'))->get();

    expect((bool) $order->getAttribute('is_demo'))->toBeTrue()
        ->and((string) $order->getAttribute('demo_ref'))->toStartWith(OrderWriter::DEMO_PREFIX)
        ->and($order->origin)->toBe(Order::ORIGIN_CHECKOUT)
        ->and((bool) DB::table('customers')->where('id', $order->customer_id)->value('is_demo'))->toBeTrue()
        ->and((bool) DB::table('addresses')->where('id', $order->delivery_address_id)->value('is_demo'))->toBeTrue()
        ->and($lines->every(static fn (OrderLine $line): bool => (bool) $line->getAttribute('is_demo')))->toBeTrue()
        ->and($snapshots)->not->toBeEmpty()
        ->and($snapshots->every(static fn (OrderLineFitment $f): bool => (bool) $f->getAttribute('is_demo')))->toBeTrue()
        ->and(((array) $snapshots->first()?->verdict)['document']['isDemo'] ?? null)->toBeTrue();

    // A person placed it: its number alone opens nothing (EIGENE-FUNDE 131); its signed link does, and the page says what it is.
    $this->flushSession();
    $this->get('/bestellung/'.$order->public_id)->assertNotFound();
    $this->get(OrderLinks::link($order))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('demo', true)
            ->where('testPurchase', true)
            ->where('invoice', null)
            ->where('payment.state', fn (string $state): bool => $state !== ''));
});

it('issues no invoice for a test purchase, and its confirmation says why', function (): void {
    Mail::fake();
    $order = examplePurchase($this);

    app(OrderPaid::class)->handle($order);

    expect(Invoice::query()->where('order_id', $order->id)->exists())->toBeFalse();
    Mail::assertSent(OrderConfirmationMail::class, static fn (OrderConfirmationMail $mail): bool => $mail->invoice === null
        && str_contains($mail->render(), 'Testkauf mit Beispieldaten')
        && $mail->attachments() === array_values(array_filter($mail->attachments())));
});

it('goes with the demo data, and its link answers 404 afterwards', function (): void {
    $order = examplePurchase($this);
    $signed = OrderLinks::link($order);

    app(DemoPurge::class)->run('Test', null, catalogue: false);

    expect(Order::query()->whereKey($order->id)->exists())->toBeFalse()
        ->and(DB::table('order_lines')->where('order_id', $order->id)->exists())->toBeFalse();

    $this->flushSession();
    $this->get($signed)->assertNotFound();
});

it('marks the example document on the product page and opens it through its marked page', function (): void {
    Storage::fake(GutachtenController::DISK)->put((string) $this->example->pdf_key, "%PDF-1.4\n");

    $this->withCookies($this->fx->cookies())->get('/felgen/'.$this->fx->config->wheelModel->slug)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('configs', function ($configs): bool {
            $row = collect($configs)->firstWhere('id', $this->fx->config->id);

            return ($row['verdict']['document']['example'] ?? null) === true
                && str_starts_with((string) ($row['verdict']['document']['pdf']['url'] ?? ''), route('gutachten.beispiel', ['document' => $this->example->id]));
        }));

    $this->get(route('gutachten.beispiel', ['document' => $this->example->id]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Gutachten/Beispiel')->where('pdf.url', fn (string $url): bool => $url !== ''));

    // A real document has no such page: the address does not exist for it.
    $this->get(route('gutachten.beispiel', ['document' => $this->fx->document->id]))->assertNotFound();
});
