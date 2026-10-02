<?php

declare(strict_types=1);

use App\Http\Controllers\Storefront\FelgenController;
use App\Models\AdminUser;
use App\Models\BalanceWeightColour;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\WheelConfig;
use App\Services\Commerce\Invoices;
use App\Services\Commerce\KomplettradSettings;
use App\Services\Storefront\Basket;
use App\Support\GermanFormat;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Illuminate\Support\Facades\View;
use Inertia\Testing\AssertableInertia;
use Tests\Support\Storefront\KomplettradFixture;

/**
 * The money sweep (the launch release §4, D-102): one rim at 229,00 €, asserted as the string each surface shows —
 * 229,00 € where one is meant, 916,00 € where four are, and no other number. Three price bugs lived here: a tile at a
 * quarter of the price, a one-rim price labelled as four, and the client's #14, a product page showing one rim while
 * its button put four in the basket. A stored price is one rim; LinePrice alone multiplies it (LinePriceTest guards
 * that no other place does).
 *
 * The nine surfaces: the tile, the product page at one and at four, the amount selector, the basket line, the basket
 * total, the checkout summary, the order line, the invoice and the CSV. Surfaces the server writes are asserted here
 * as the customer reads them. The two the browser writes from minor units — the tile and the admin's order lines — are
 * asserted here as the cents they receive and in `resources/js/MoneyDisplay.test.ts` as the text they render.
 */
const MONEY_RIM = 22_900;           // 229,00 € — the DB8GT2 18″'s placeholder price
const MONEY_RIM_TEXT = "229,00\u{202F}€";
const MONEY_RIM_VAT_TEXT = "36,56\u{202F}€";     // 19 % inside 229,00 € (3 656,3 cents, rounded)
const MONEY_FOUR = 91_600;          // 916,00 € — four rims, never a price divided by four, never four twice
const MONEY_FOUR_TEXT = "916,00\u{202F}€";
const MONEY_FOUR_VAT_TEXT = "146,25\u{202F}€";   // 19 % inside 916,00 € (14 625,2 cents, rounded)
const MONEY_OTHER = 999_999;        // the model's other sizes: dearer, so the „ab“ price is ours
const MONEY_OTHER_TEXT = "9.999,99\u{202F}€";

beforeEach(function (): void {
    $this->seed([CommerceSeeder::class, KomplettradOptionsSeeder::class, AccessSeeder::class]);
    config([
        'rimify.review.enabled' => true,
        'rimify.payments.driver' => 'sandbox',
        'rimify.shipping.cost_cents' => null,
        'rimify.shipping.free_from_cents' => null,
    ]);
});

it('shows 229,00 € for one rim and 916,00 € for four, on every surface, and no other number', function (): void {
    $fx = KomplettradFixture::permitted();
    $config = $fx->config;
    $config->forceFill(['price_cents' => MONEY_RIM, 'stock_qty' => 100, 'currency' => 'EUR'])->save();
    WheelConfig::query()->where('wheel_model_id', $config->wheel_model_id)->whereKeyNot($config->id)
        ->update(['price_cents' => MONEY_OTHER]);
    // A second size of the same finish, dearer: the selector must show each its own price.
    $other = WheelConfig::query()->where('wheel_model_id', $config->wheel_model_id)->whereKeyNot($config->id)
        ->where('wheel_finish_id', $config->wheel_finish_id)->orderBy('id')->first()
        ?? WheelConfig::factory()->create([
            'wheel_model_id' => $config->wheel_model_id, 'wheel_finish_id' => $config->wheel_finish_id,
            'width_in' => 6.0, 'price_cents' => MONEY_OTHER, 'stock_qty' => 8, 'currency' => 'EUR',
        ]);
    $slug = (string) $config->wheelModel?->slug;

    // Komplettrad: 150,00 € tyre + 25,00 € Montage und Auswuchten + the colour's surcharge per wheel.
    $tyre = $fx->tyre(['price_cents' => 15_000]);
    app(KomplettradSettings::class)->setMountingPerWheelCents(2_500);
    $colour = BalanceWeightColour::query()->where('is_default', true)->firstOrFail();
    $perWheel = MONEY_RIM + 15_000 + 2_500 + (int) $colour->surcharge_cents;

    // 1 · The tile: the cheapest size of the finish, one rim — the browser writes it from these cents.
    $this->withCookies($fx->cookies())->get('/felgen')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('cards', function ($cards) use ($config): bool {
            $card = collect($cards)->first(fn ($c): bool => $c['modelId'] === $config->wheel_model_id && $c['finishId'] === $config->wheel_finish_id);

            return $card !== null && $card['fromPriceCents'] === MONEY_RIM && $card['fromPrice'] === MONEY_RIM_TEXT;
        }));

    // 2 · The product page at one and at four: one rim, and the set of four beside it.
    $page = $this->withCookies($fx->cookies())->get('/felgen/'.$slug)->assertOk()->viewData('page');
    $ours = moneyPdpConfig($page, (int) $config->id);

    expect($ours['priceCents'])->toBe(MONEY_RIM)
        ->and($ours['price'])->toBe(MONEY_RIM_TEXT)
        ->and($ours['priceForFour'])->toBe(MONEY_FOUR_TEXT);

    // 3 · The amount selector (#17): every amount priced on the server, one rim times the amount, nothing else.
    $amounts = collect($ours['amounts'])->keyBy('quantity');

    expect($amounts->keys()->all())->toBe(FelgenController::AMOUNTS)
        ->and($amounts[1])->toBe(['quantity' => 1, 'cents' => MONEY_RIM, 'text' => MONEY_RIM_TEXT])
        ->and($amounts[4])->toBe(['quantity' => 4, 'cents' => MONEY_FOUR, 'text' => MONEY_FOUR_TEXT])
        ->and($amounts->every(static fn (array $a): bool => $a['cents'] === MONEY_RIM * $a['quantity']))->toBeTrue();

    // The variant selector: each size its own price, the „ab“ price the cheapest of the finish.
    $theirs = moneyPdpConfig($page, (int) $other->id);

    expect($theirs['price'])->toBe(MONEY_OTHER_TEXT)
        ->and($theirs['priceForFour'])->toBe("39.999,96\u{202F}€");

    // The Komplettrad bundle: per wheel, and for the set of four.
    $bundle = moneyOfferedTyre($ours['komplettrad'], (int) $tyre->id);

    expect($bundle['perWheelCents'])->toBe($perWheel)
        ->and($bundle['perWheel'])->toBe(moneyText($perWheel))
        ->and($bundle['forFourCents'])->toBe($perWheel * 4)
        ->and($bundle['forFour'])->toBe(moneyText($perWheel * 4))
        ->and($bundle['tyrePrice'])->toBe("150,00\u{202F}€");

    // 4 · 5 · The basket at one: the line and the total are one rim.
    $one = [Basket::SESSION_KEY => ['wheel:'.$config->id => ['kind' => 'WHEEL', 'wheelConfigId' => $config->id, 'tyreVariantId' => null, 'quantity' => 1]]];

    $this->withCookies($fx->cookies())->withSession($one)->get('/warenkorb')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('lines.0.quantity', 1)
            ->where('lines.0.unitPrice', MONEY_RIM_TEXT)
            ->where('lines.0.lineTotal', MONEY_RIM_TEXT)
            ->where('totals.subtotal', MONEY_RIM_TEXT)
            ->where('totals.total', MONEY_RIM_TEXT)
            ->where('totals.tax', MONEY_RIM_VAT_TEXT));

    // 4 · 5 · The basket at four: the line (4 × one rim) and the total with the VAT it contains.
    $basket = [Basket::SESSION_KEY => ['wheel:'.$config->id => ['kind' => 'WHEEL', 'wheelConfigId' => $config->id, 'tyreVariantId' => null, 'quantity' => 4]]];

    $this->withCookies($fx->cookies())->withSession($basket)->get('/warenkorb')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('lines.0.quantity', 4)
            ->where('lines.0.unitPrice', MONEY_RIM_TEXT)
            ->where('lines.0.lineTotal', MONEY_FOUR_TEXT)
            ->where('lines.0.components.0.lineTotal', MONEY_FOUR_TEXT)
            ->where('totals.subtotal', MONEY_FOUR_TEXT)
            ->where('totals.total', MONEY_FOUR_TEXT)
            ->where('totals.tax', MONEY_FOUR_VAT_TEXT));

    // 6 · The checkout summary: the same lines and totals, written by the same basket.
    $this->withCookies($fx->cookies())->withSession($basket)->get('/kasse')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('lines.0.unitPrice', MONEY_RIM_TEXT)
            ->where('lines.0.lineTotal', MONEY_FOUR_TEXT)
            ->where('totals.total', MONEY_FOUR_TEXT)
            ->where('totals.tax', MONEY_FOUR_VAT_TEXT));

    // 7 · The order line: frozen as cents, shown on the confirmation and in the admin.
    $this->withCookies($fx->cookies())->withSession($basket)->from('/kasse')->post('/kasse', [
        'email' => 'preis@beispiel.de', 'phone' => '', 'name' => 'Erika Mustermann', 'street' => 'Hauptstraße',
        'houseNumber' => '12', 'zip' => '50667', 'city' => 'Köln', 'billingSame' => true, 'shipping' => 'standard',
    ])->assertSessionHasNoErrors();

    $order = Order::query()->latest('id')->firstOrFail();
    $line = OrderLine::query()->where('order_id', $order->id)->sole();

    expect($line->unit_price_cents)->toBe(MONEY_RIM)
        ->and($line->line_total_cents)->toBe(MONEY_FOUR)
        ->and($order->total_cents)->toBe(MONEY_FOUR);

    $this->get('/bestellung/'.$order->order_number)->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('lines.0.unitPrice', MONEY_RIM_TEXT)
            ->where('lines.0.lineTotal', MONEY_FOUR_TEXT)
            ->where('order.total', MONEY_FOUR_TEXT)
            ->where('order.tax', MONEY_FOUR_VAT_TEXT));

    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();

    $this->actingAs($admin, 'admin')->get('/admin/bestellungen/'.$order->id)->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('lines.0.unit', MONEY_RIM)
            ->where('lines.0.total', MONEY_FOUR)
            ->where('order.total', MONEY_FOUR));

    // 8 · The invoice: built from the frozen line, 229,00 € a rim and 916,00 € for the four, on the PDF as stored.
    $template = null;
    View::composer('pdf.invoice', function (Illuminate\View\View $view) use (&$template): void {
        $template ??= $view->getData();
    });
    $invoice = app(Invoices::class)->issueFor($order);
    // The PDF sets the money with a plain no-break space (DejaVu has no narrow one).
    $pdfText = static fn (string $text): string => str_replace("\u{202F}", "\u{00A0}", $text);
    $html = view('pdf.invoice', (array) $template)->render();

    expect($invoice->gross_cents)->toBe(MONEY_FOUR)
        ->and($invoice->lines[0]['unitGrossCents'])->toBe(MONEY_RIM)
        ->and($invoice->lines[0]['grossCents'])->toBe(MONEY_FOUR)
        ->and($html)->toContain($pdfText(MONEY_RIM_TEXT))
        ->and($html)->toContain($pdfText(MONEY_FOUR_TEXT));

    // 9 · The CSV export: the amount a spreadsheet sums, both cents kept.
    $csv = $this->actingAs($admin, 'admin')->get('/admin/bestellungen/export?format=csv&q='.$order->order_number)
        ->assertOk()->streamedContent();

    expect($csv)->toContain(';916,00;');
});

function moneyText(int $cents): string
{
    return GermanFormat::money($cents);
}

/**
 * One configuration as the product page ships it, by id.
 *
 * @return array<string, mixed>
 */
function moneyPdpConfig(mixed $page, int $configId): array
{
    $configs = is_array($page) && is_array($page['props']['configs'] ?? null) ? $page['props']['configs'] : [];

    foreach ($configs as $config) {
        if (is_array($config) && ($config['id'] ?? null) === $configId) {
            return $config;
        }
    }

    throw new RuntimeException("Configuration {$configId} is not on the product page.");
}

/**
 * One tyre card of a Komplettrad offer, by tyre id.
 *
 * @param  array<string, mixed>  $offer
 * @return array<string, mixed>
 */
function moneyOfferedTyre(array $offer, int $tyreId): array
{
    foreach (is_array($offer['tyres'] ?? null) ? $offer['tyres'] : [] as $card) {
        if (is_array($card) && ($card['id'] ?? null) === $tyreId) {
            return $card;
        }
    }

    throw new RuntimeException("Tyre {$tyreId} is not offered.");
}
