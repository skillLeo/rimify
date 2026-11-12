<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\VersandartenController;
use App\Http\Middleware\EnsureSudo;
use App\Http\Requests\Admin\ShippingMethodOrderRequest;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\Order;
use App\Models\ShippingMethod;
use App\Services\Admin\AuditDescriber;
use App\Support\GermanFormat;
use Database\Seeders\AccessSeeder;
use Inertia\Testing\AssertableInertia;

/*
 * Einstellungen › Versand (his round of 08.11, §7B; D-449): create, edit, sort, activate and deactivate the shipping methods
 * the checkout offers. The Super-Admin alone, after the password once more (R-11, EnsureSudo); every write one Protokoll entry.
 */

const VS_URL = '/admin/einstellungen/versand';

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
});

function vsAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

function vsAs(string $role = 'super-admin'): mixed
{
    return test()->actingAs(vsAdmin($role), 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])->from(VS_URL);
}

/** @return array<string, mixed> the form as the page posts it */
function vsForm(array $over = []): array
{
    return [
        'name' => 'Express', 'description' => '  Versichert,   mit Sendungsverfolgung ', 'price' => '59,90', 'free_from' => '',
        'min_days' => 1, 'max_days' => 2, 'countries' => ['DE'], 'product_types' => [], 'active' => true, ...$over,
    ];
}

function vsSentence(string $event): string
{
    return app(AuditDescriber::class)->describe(AuditLog::query()->where('description', $event)->latest('id')->firstOrFail())['sentence'];
}

it('is the Super-Admin\'s alone, on every route, whatever the page shows (R-11)', function (string $role): void {
    $method = ShippingMethod::factory()->create();

    vsAs($role)->get(VS_URL)->assertForbidden();
    vsAs($role)->post(VS_URL, vsForm())->assertForbidden();
    vsAs($role)->put(VS_URL.'/'.$method->id, vsForm())->assertForbidden();
    vsAs($role)->put(VS_URL.'/reihenfolge', ['ids' => [$method->id]])->assertForbidden();
    vsAs($role)->delete(VS_URL.'/'.$method->id)->assertForbidden();

    expect(ShippingMethod::query()->count())->toBe(1)
        ->and(AuditLog::query()->where('description', 'like', 'shipping_method.%')->count())->toBe(0);
})->with(['content-editor', 'support-agent']);

it('lists the methods in their order, with what the product page says, and the .env while none was saved', function (): void {
    vsAs()->get(VS_URL)->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->component('Admin/Einstellungen/Versand')
        ->has('methods', 0)
        ->where('canEdit', true)
        ->where('countries', ['DE' => 'Deutschland']));

    ShippingMethod::factory()->create(['name' => 'Express', 'price_cents' => 5_990, 'position' => 2]);
    ShippingMethod::factory()->create(['name' => 'Standard', 'price_cents' => 3_000, 'delivery_min_days' => 3, 'delivery_max_days' => 10, 'position' => 1]);

    vsAs()->get(VS_URL)->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->where('methods.0.name', 'Standard')
        ->where('methods.0.deliveryTime', '3–10 Werktage')
        ->where('methods.0.priceTyped', '30,00')
        ->where('methods.1.name', 'Express')
        ->where('productLine', fn (string $line): bool => str_starts_with($line, 'Lieferzeit 3–10 Werktage · Versand 30,00'))
        ->where('fromEnv', null));
});

it('creates a method from the German form, at the end of the list, with one Protokoll entry', function (): void {
    ShippingMethod::factory()->create(['position' => 4]);

    vsAs()->post(VS_URL, vsForm(['free_from' => '1.500,00', 'product_types' => ['komplettrad']]))->assertRedirect(VS_URL)->assertSessionHasNoErrors()
        ->assertSessionHas('toast', VersandartenController::SAVED);

    $method = ShippingMethod::query()->where('name', 'Express')->sole();

    expect($method->only(['description_de', 'price_cents', 'free_from_cents', 'delivery_min_days', 'delivery_max_days', 'countries', 'product_types', 'position', 'active', 'is_demo']))->toBe([
        'description_de' => 'Versichert, mit Sendungsverfolgung', 'price_cents' => 5_990, 'free_from_cents' => 150_000, 'delivery_min_days' => 1, 'delivery_max_days' => 2,
        'countries' => ['DE'], 'product_types' => ['komplettrad'], 'position' => 5, 'active' => true, 'is_demo' => false,
    ])
        ->and(vsSentence('shipping_method.created'))->toBe('Die Versandart „Express“ wurde angelegt.');

    // Both kinds of product ticked is every product: stored as none named.
    vsAs()->post(VS_URL, vsForm(['name' => 'Alles', 'product_types' => ['felgen', 'komplettrad']]))->assertSessionHasNoErrors();

    expect(ShippingMethod::query()->where('name', 'Alles')->sole()->product_types)->toBeNull();
});

it('says in German what a field needs, and writes nothing', function (array $over, string $field, string $sentence): void {
    vsAs()->post(VS_URL, vsForm($over))->assertSessionHasErrors([$field => $sentence]);

    expect(ShippingMethod::query()->count())->toBe(0);
})->with([
    'no name' => [['name' => ''], 'name', 'Gib der Versandart einen Namen, zum Beispiel „Standard“ oder „Express“.'],
    'a price with a point' => [['price' => '5.90'], 'price', 'Schreib den Preis mit Komma, zum Beispiel 4,90.'],
    'no price' => [['price' => ''], 'price', 'Gib den Preis an, mit Mehrwertsteuer, zum Beispiel 4,90. Kostenlos ist 0,00.'],
    'until before from' => [['min_days' => 5, 'max_days' => 3], 'max_days', '„Bis“ darf nicht kleiner sein als „Von“.'],
    'more than 60 days' => [['max_days' => 61], 'max_days', 'Die Lieferzeit bitte in ganzen Werktagen, zwischen 1 und 60.'],
    'no country' => [['countries' => []], 'countries', 'Wähl mindestens ein Land, in das diese Versandart liefert.'],
    'a country the checkout does not know' => [['countries' => ['AT']], 'countries.0', 'Wähl mindestens ein Land, in das diese Versandart liefert.'],
    'an unknown product' => [['product_types' => ['reifen']], 'product_types.0', 'Wähl, wofür die Versandart gilt.'],
]);

it('edits and switches a method off and on, naming in the Protokoll only what changed', function (): void {
    $method = ShippingMethod::factory()->create(['name' => 'Standard', 'price_cents' => 3_000, 'delivery_min_days' => 3, 'delivery_max_days' => 10]);
    $form = vsForm(['name' => 'Standard', 'description' => '', 'price' => '30,00', 'min_days' => 3, 'max_days' => 10]);

    // Saved as it is: nothing to record.
    vsAs()->put(VS_URL.'/'.$method->id, $form)->assertSessionHasNoErrors();

    expect(AuditLog::query()->where('description', 'shipping_method.updated')->count())->toBe(0);

    vsAs()->put(VS_URL.'/'.$method->id, [...$form, 'price' => '32,50', 'active' => false])->assertSessionHasNoErrors()
        ->assertSessionHas('toast', VersandartenController::NONE_ACTIVE);

    $entry = app(AuditDescriber::class)->describe(AuditLog::query()->where('description', 'shipping_method.updated')->sole());

    expect($method->fresh()->only(['price_cents', 'active']))->toBe(['price_cents' => 3_250, 'active' => false])
        ->and($entry['sentence'])->toBe('Die Versandart „Standard“ wurde geändert: Preis, Im Shop.')
        ->and(array_map(static fn (array $c): string => $c['label'].': '.$c['before'].' → '.$c['after'], $entry['changes']))->toBe([
            'Preis: '.GermanFormat::money(3_000).' → '.GermanFormat::money(3_250),
            'Im Shop: aktiv → nicht aktiv',
        ]);

    vsAs()->put(VS_URL.'/'.$method->id, [...$form, 'price' => '32,50', 'active' => true])->assertSessionHasNoErrors()
        ->assertSessionHas('toast', VersandartenController::SAVED);

    expect($method->fresh()->active)->toBeTrue();
});

it('sorts the methods as one list, every method once, and records the new order', function (): void {
    $a = ShippingMethod::factory()->create(['name' => 'Standard', 'position' => 1]);
    $b = ShippingMethod::factory()->create(['name' => 'Express', 'position' => 2]);
    $c = ShippingMethod::factory()->inactive()->create(['name' => 'Alt', 'position' => 3]);

    vsAs()->put(VS_URL.'/reihenfolge', ['ids' => [$b->id, $c->id, $a->id]])->assertSessionHasNoErrors();

    expect(ShippingMethod::query()->orderBy('position')->pluck('name')->all())->toBe(['Express', 'Alt', 'Standard'])
        ->and(vsSentence('shipping_method.sorted'))->toBe('Die Reihenfolge der Versandarten wurde geändert: Express, Alt, Standard.');

    // A list from an older page, one method missing or twice: refused, nothing moved.
    vsAs()->put(VS_URL.'/reihenfolge', ['ids' => [$a->id, $b->id]])->assertSessionHasErrors(['ids' => ShippingMethodOrderRequest::INCOMPLETE]);
    vsAs()->put(VS_URL.'/reihenfolge', ['ids' => [$a->id, $a->id, $b->id]])->assertSessionHasErrors('ids.1');

    expect(ShippingMethod::query()->orderBy('position')->pluck('name')->all())->toBe(['Express', 'Alt', 'Standard']);
});

it('asks for the password again before the page, as the other settings that touch the checkout do', function (): void {
    $this->actingAs(vsAdmin(), 'admin')->get(VS_URL)->assertRedirectContains('/admin/bestaetigen');
    $this->actingAs(vsAdmin(), 'admin')->post(VS_URL, vsForm())->assertRedirectContains('/admin/bestaetigen');

    expect(ShippingMethod::query()->count())->toBe(0);
});

// The client's review of 11.11, F (D-454): „create, edit, deactivate, delete“. An order keeps what it was sent by.
it('deletes a method after the dialog: gone from the list and the checkout, every order keeping what it was sent by, said in the Protokoll', function (): void {
    $express = ShippingMethod::factory()->create(['name' => 'Express', 'price_cents' => 5_990, 'delivery_min_days' => 1, 'delivery_max_days' => 2, 'position' => 1]);
    ShippingMethod::factory()->create(['name' => 'Standard', 'price_cents' => 3_000, 'position' => 2]);
    $order = Order::factory()->create(['shipping_method_id' => $express->id, 'shipping_method_name' => 'Express', 'shipping_delivery_time' => '1–2 Werktage', 'shipping_cents' => 5_990]);

    vsAs()->delete(VS_URL.'/'.$express->id)->assertRedirect(VS_URL)->assertSessionHas('toast', 'Gelöscht. Bestellungen behalten, womit sie verschickt werden.');

    $order->refresh();

    expect(ShippingMethod::query()->pluck('name')->all())->toBe(['Standard'])
        ->and($order->shipping_method_id)->toBeNull()
        ->and($order->shipping_method_name)->toBe('Express')
        ->and($order->shipping_delivery_time)->toBe('1–2 Werktage')
        ->and($order->shipping_cents)->toBe(5_990)
        ->and(vsSentence('shipping_method.deleted'))->toBe('Die Versandart „Express“ wurde gelöscht ('.GermanFormat::money(5_990).', 1–2 Werktage). Bestellungen behalten, womit sie verschickt werden.');
});

it('says so where the last active method was deleted: no real order until one is', function (): void {
    $only = ShippingMethod::factory()->create(['name' => 'Standard']);

    vsAs()->delete(VS_URL.'/'.$only->id)->assertSessionHas('toast', 'Gelöscht. Keine Versandart ist aktiv: Solange nimmt der Shop keine echte Bestellung an.');

    expect(ShippingMethod::query()->count())->toBe(0);
});
