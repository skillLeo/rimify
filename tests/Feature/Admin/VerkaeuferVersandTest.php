<?php

declare(strict_types=1);

use App\Http\Middleware\EnsureSudo;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\Setting;
use App\Support\GermanFormat;
use App\Support\Seller;
use App\Support\Shipping;
use App\Support\WithdrawalForm;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia;

/*
 * Einstellungen › Verkäufer & Versand: the seller as the law names it and what delivery costs and takes, typed in
 * by the Super-Admin behind the password once more — one place each, which the Impressum, the invoice, the order
 * mail, the product page, the basket and the checkout read (Seller, Shipping). `.env` answers only until the page is
 * saved; a placeholder is never said to a customer as if it were real.
 */

const VV_URL = '/admin/einstellungen/verkaeufer-versand';

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    config([
        'rimify.seller' => ['name' => null, 'street' => null, 'zip' => null, 'city' => null, 'email' => null, 'vat_id' => null, 'tax_number' => null, 'register' => null, 'small_business' => false],
        'rimify.shipping' => ['cost_cents' => null, 'free_from_cents' => null, 'delivery_time' => null],
        'rimify.contact.email' => 'kontakt@beispiel.de',
    ]);
});

function vvAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** @return array{seller: array<string, mixed>, shipping: array<string, mixed>} */
function vvForm(array $seller = [], array $shipping = []): array
{
    return [
        'seller' => [
            'name' => 'Beispiel Räder GmbH', 'street' => 'Werkstraße 4', 'zip' => '80331', 'city' => 'München',
            'managing_director' => 'Erika Beispiel', 'register_court' => 'Amtsgericht München', 'register_number' => 'HRB 204711',
            'vat_id' => 'DE 204 711 815', 'tax_number' => '', 'email' => 'rechnung@beispiel.de', 'phone' => '', 'placeholder' => false,
            ...$seller,
        ],
        'shipping' => ['cost' => '4,90', 'free_from' => '500,00', 'min_days' => '3', 'max_days' => '5', 'placeholder' => false, ...$shipping],
    ];
}

function vvSave(array $form): TestResponse
{
    return test()->actingAs(vvAdmin(), 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])->from(VV_URL)->put(VV_URL, $form);
}

it('refuses every role but the Super-Admin, and asks the Super-Admin for the password first', function (string $role): void {
    DB::table('role_permissions')->updateOrInsert(
        ['role_id' => DB::table('roles')->where('name', $role)->value('id'), 'module' => 'settings', 'action' => 'edit'],
        ['allowed' => true],
    );

    $this->actingAs(vvAdmin($role), 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])->get(VV_URL)->assertForbidden();
    $this->actingAs(vvAdmin($role), 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])->put(VV_URL, vvForm())->assertForbidden();
    $this->flushSession();
    $this->actingAs(vvAdmin(), 'admin')->get(VV_URL)->assertRedirect('/admin/bestaetigen?weiter='.rawurlencode(VV_URL));

    expect(Setting::query()->whereIn('key', [Seller::KEY, Shipping::KEY])->count())->toBe(0);
})->with(['catalogue-manager', 'accountant']);

it('shows the .env values until it is saved, then puts its own in force — a cleared field included — and records the change', function (): void {
    config(['rimify.seller.name' => 'Env GmbH', 'rimify.seller.register' => 'Amtsgericht Kiel, HRB 1', 'rimify.shipping.cost_cents' => 590, 'rimify.shipping.delivery_time' => '2–4 Werktage']);

    $this->actingAs(vvAdmin(), 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])->get(VV_URL)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/Einstellungen/VerkaeuferVersand')
            ->where('seller.name', 'Env GmbH')
            ->where('sellerSource', '.env')
            ->where('legacyRegister', 'Amtsgericht Kiel, HRB 1')
            ->where('shipping.cost', GermanFormat::money(590))
            ->where('legacyTime', '2–4 Werktage')
            ->where('shippingSource', '.env'));

    vvSave(vvForm(['phone' => '']))->assertSessionHasNoErrors()->assertRedirect(VV_URL);

    $seller = Seller::current();
    $shipping = Shipping::current();

    expect($seller->name)->toBe('Beispiel Räder GmbH')
        ->and($seller->vatId)->toBe('DE204711815')
        ->and($seller->register)->toBe('Amtsgericht München, HRB 204711')
        ->and($seller->managingDirector)->toBe('Erika Beispiel')
        ->and($seller->missing())->toBe([])
        ->and($shipping->costCents())->toBe(490)
        ->and($shipping->forSubtotal(49_999))->toBe(490)
        ->and($shipping->forSubtotal(50_000))->toBe(0)
        ->and($shipping->deliveryTime())->toBe('3–5 Werktage')
        ->and($shipping->summary())->toBe('Lieferzeit 3–5 Werktage · Versand '.GermanFormat::money(490).' · versandkostenfrei ab '.GermanFormat::money(50_000))
        ->and($shipping->missing())->toBe([]);

    // A cleared field is cleared: the page's word wins over .env, even when it says nothing.
    vvSave(vvForm(['name' => ''], ['cost' => '']))->assertSessionHasNoErrors();

    expect(Seller::current()->name)->toBeNull()
        ->and(Seller::current()->missing())->toBe(['Name des Unternehmens'])
        ->and(Shipping::current()->costCents())->toBeNull()
        ->and(Shipping::current()->missing())->toBe(['Versandkosten']);

    $entry = AuditLog::query()->where('description', 'settings.seller_shipping_updated')->latest('id')->firstOrFail();

    expect($entry->properties['changes'])->toHaveKeys(['seller.name', 'shipping.zones'])
        ->and($entry->properties['changes']['seller.name'])->toBe(['old' => 'Beispiel Räder GmbH', 'new' => null]);
});

it('checks every field for its form, and names the fix', function (): void {
    vvSave(vvForm(
        ['zip' => '8033', 'vat_id' => 'DE12', 'register_number' => '??', 'email' => 'keine-adresse', 'phone' => 'ruf an', 'tax_number' => 'abc'],
        ['cost' => 'vier Euro', 'free_from' => '1.2.3', 'min_days' => '5', 'max_days' => '3'],
    ))->assertSessionHasErrors([
        'seller.zip' => 'Die PLZ hat fünf Ziffern.',
        'seller.vat_id' => 'Eine deutsche USt-IdNr. besteht aus DE und neun Ziffern.',
        'seller.email' => 'Diese E-Mail-Adresse ist unvollständig – sie braucht ein @ und eine Domain.',
        'seller.phone',
        'seller.register_number',
        'seller.tax_number',
        'shipping.cost' => 'Schreib den Preis mit Komma, zum Beispiel 4,90 – oder lass das Feld leer.',
        'shipping.free_from',
        'shipping.max_days' => '„Bis“ darf nicht kleiner sein als „Von“.',
    ]);

    vvSave(vvForm([], ['min_days' => '3', 'max_days' => '']))->assertSessionHasErrors(['shipping.max_days' => 'Die Lieferzeit braucht beide Werte: von und bis.']);

    expect(Setting::query()->whereIn('key', [Seller::KEY, Shipping::KEY])->count())->toBe(0);
});

it('never says a placeholder to a customer as if it were real — only the Impressum shows it, marked', function (): void {
    vvSave(vvForm(['placeholder' => true], ['placeholder' => true]))->assertSessionHasNoErrors();

    // Stored as typed, marked: the admin page and the Impressum's preview.
    expect(Seller::stored()->name)->toBe('Beispiel Räder GmbH')->and(Seller::stored()->placeholder)->toBeTrue();

    // The shop's documents: not given. The invoice stays a test invoice; the Widerrufsformular names the e-mail alone.
    $seller = Seller::current();

    expect($seller->name)->toBeNull()
        ->and($seller->addressLines())->toBe([])
        ->and($seller->missing())->toBe(['Verkäuferangaben (noch Platzhalter)'])
        ->and(WithdrawalForm::addressee($seller))->not->toContain('Beispiel Räder')
        ->and(Shipping::current()->costCents())->toBeNull()
        ->and(Shipping::current()->deliveryTime())->toBeNull()
        ->and(Shipping::current()->summary())->toBeNull()
        ->and(Shipping::current()->missing())->toBe(['Versandangaben (noch Platzhalter)']);

    $this->get('/rechtliches/impressum')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('provider.placeholder', true)
        ->where('provider.complete', false)
        ->where('provider.rows.0.value', 'Beispiel Räder GmbH'));

    // The live shop does not start on placeholders.
    app()['env'] = 'production';

    try {
        $this->artisan('rimify:preflight')->expectsOutputToContain('noch Platzhalter')->assertFailed();
    } finally {
        app()['env'] = 'testing';
    }
});

it('prints the seller as the page holds it: the Impressum with its Geschäftsführung and register, the invoice footer', function (): void {
    vvSave(vvForm())->assertSessionHasNoErrors();

    $this->get('/rechtliches/impressum')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('provider.placeholder', false)
        ->where('provider.complete', true)
        ->where('provider.rows', fn ($rows): bool => collect($rows)->pluck('value', 'label')->only(['Anbieter', 'Vertreten durch', 'Registereintrag', 'Umsatzsteuer-Identifikationsnummer'])->all() === [
            'Anbieter' => 'Beispiel Räder GmbH',
            'Vertreten durch' => 'Erika Beispiel',
            'Registereintrag' => 'Amtsgericht München, HRB 204711',
            'Umsatzsteuer-Identifikationsnummer' => 'DE204711815',
        ]));

    // The line under every invoice and order mail (§ 14 UStG, § 35a GmbHG): one place, the page's values.
    expect(Seller::current()->documentLine())->toBe(
        'Beispiel Räder GmbH · Werkstraße 4 · 80331 München · rechnung@beispiel.de · Geschäftsführung: Erika Beispiel · Amtsgericht München, HRB 204711 · USt-IdNr. DE204711815'
    );
});
