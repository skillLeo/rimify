<?php

declare(strict_types=1);

use App\Http\Controllers\Storefront\BestellungController;
use App\Http\Controllers\Storefront\KontoController;
use App\Http\Requests\Storefront\CustomerPasswordRequest;
use App\Mail\CustomerAccountMail;
use App\Models\Customer;
use App\Models\CustomerAccount;
use App\Models\Order;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\ViewErrorBag;
use Inertia\Testing\AssertableInertia;

/*
 * Block G §2: guest checkout stays the default; after a paid order the confirmation page offers an account in one
 * click — the order's own address, one mailed link to set the password, used once. The account lists every order of
 * its address and opens each; it never opens another's. „Passwort vergessen“ answers alike for every address.
 */

beforeEach(function (): void {
    // The order page reads the load-index tables (ReferenceDataMissing without them).
    $this->seed(ReferenceDataSeeder::class);
    Mail::fake();
    $customer = Customer::query()->create(['email' => 'kunde@beispiel.de', 'firstname' => 'Erika', 'lastname' => 'Mustermann']);
    $this->order = Order::factory()->create(['customer_id' => $customer->id, 'is_demo' => false]);
    $other = Customer::query()->create(['email' => 'jemand@anders.de', 'firstname' => 'Max', 'lastname' => 'Muster']);
    $this->foreign = Order::factory()->create(['customer_id' => $other->id, 'is_demo' => false]);
});

function placedSession(Order $order): array
{
    return [BestellungController::SESSION_PLACED => [$order->order_number]];
}

it('offers the account in one click on a paid order, and mails the link to set the password', function (): void {
    $this->withSession(placedSession($this->order))->get('/bestellung/'.$this->order->public_id)
        ->assertInertia(fn (AssertableInertia $page) => $page->where('demo', false)->where('order.status', 'PAID')->where('accountOffer', true));

    $this->withSession(placedSession($this->order))->from('/bestellung/'.$this->order->public_id)
        ->post('/bestellung/'.$this->order->public_id.'/konto')
        ->assertRedirect()->assertSessionHas('toast', sprintf(KontoController::LINK_SENT, 'kunde@beispiel.de'));

    $account = CustomerAccount::query()->sole();

    expect($account->email)->toBe('kunde@beispiel.de')->and($account->password)->toBeNull();
    Mail::assertSent(CustomerAccountMail::class, fn (CustomerAccountMail $mail): bool => $mail->hasTo('kunde@beispiel.de') && $mail->kind === 'opened');

    // Opened once, not offered again (PAY-10): a reload does not mail a second link.
    $this->withSession(placedSession($this->order))->get('/bestellung/'.$this->order->public_id)
        ->assertInertia(fn (AssertableInertia $page) => $page->where('accountOffer', false));
});

it('refuses the click from a browser that did not place the order', function (): void {
    $this->post('/bestellung/'.$this->order->public_id.'/konto')->assertForbidden();

    expect(CustomerAccount::query()->count())->toBe(0);
});

it('sets the password by the link once, signs in, and lists the address’s orders — never another’s', function (): void {
    $account = CustomerAccount::query()->create(['email' => 'kunde@beispiel.de']);
    $link = $account->passwordLink();

    $this->get($link)->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->component('Konto/Passwort')->where('email', 'kunde@beispiel.de')->where('refusal', null));
    $this->post($link, ['password' => 'ein-langes-passwort', 'password_confirmation' => 'ein-langes-passwort'])->assertRedirect('/konto');

    $this->get('/konto')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->where('email', 'kunde@beispiel.de')
        ->has('orders', 1)
        ->where('orders.0.number', $this->order->order_number));

    // Signed in, the account opens its own order from any browser — and not somebody else's.
    $this->get('/bestellung/'.$this->order->public_id)->assertOk();
    $this->get('/bestellung/'.$this->foreign->public_id)->assertNotFound();

    // The link was for the password it replaced: used once, it is dead.
    $this->post('/konto/abmelden');
    $this->get($link)->assertInertia(fn (AssertableInertia $page) => $page->where('refusal', CustomerPasswordRequest::USED));
    $this->post($link, ['password' => 'noch-ein-passwort', 'password_confirmation' => 'noch-ein-passwort'])->assertSessionHasErrors(['password' => CustomerPasswordRequest::USED]);
});

it('names the length first when a new password is too short and its repeat empty (the admin audit\'s F-29)', function (): void {
    $account = CustomerAccount::query()->create(['email' => 'kunde@beispiel.de']);

    $this->post($account->passwordLink(), ['password' => 'kurz', 'password_confirmation' => '']);

    // The form shows the first sentence; the session keeps the bag as an array here.
    $errors = session('errors');
    $first = $errors instanceof ViewErrorBag ? $errors->first('password') : ($errors['default']['messages']['password'][0] ?? null);

    expect($first)->toBe('Dein Passwort braucht mindestens 10 Zeichen.');
});

it('signs in with the password, says nothing about which half was wrong, and sends a stranger to the sign-in', function (): void {
    $account = CustomerAccount::query()->create(['email' => 'kunde@beispiel.de']);
    $account->forceFill(['password' => 'ein-langes-passwort'])->save();

    $this->get('/konto')->assertRedirect('/konto/anmelden');
    $this->from('/konto/anmelden')->post('/konto/anmelden', ['email' => 'kunde@beispiel.de', 'password' => 'falsch'])->assertSessionHasErrors(['email' => KontoController::WRONG]);
    $this->from('/konto/anmelden')->post('/konto/anmelden', ['email' => 'Kunde@Beispiel.de ', 'password' => 'ein-langes-passwort'])->assertRedirect('/konto');
    expect($account->fresh()->last_login_at)->not->toBeNull();
});

it('answers „Passwort vergessen“ alike for every address, and mails only an account', function (): void {
    CustomerAccount::query()->create(['email' => 'kunde@beispiel.de']);

    $this->from('/konto/passwort-vergessen')->post('/konto/passwort-vergessen', ['email' => 'niemand@nirgends.de'])->assertSessionHas('toast', KontoController::FORGOT_SENT);
    $this->from('/konto/passwort-vergessen')->post('/konto/passwort-vergessen', ['email' => 'kunde@beispiel.de'])->assertSessionHas('toast', KontoController::FORGOT_SENT);

    Mail::assertSent(CustomerAccountMail::class, 1);
    Mail::assertSent(CustomerAccountMail::class, fn (CustomerAccountMail $mail): bool => $mail->hasTo('kunde@beispiel.de') && $mail->kind === 'reset');
});

it('deletes the account and keeps the orders', function (): void {
    $account = CustomerAccount::query()->create(['email' => 'kunde@beispiel.de']);
    $account->forceFill(['password' => 'ein-langes-passwort'])->save();

    $this->actingAs($account, 'customer')->delete('/konto')->assertRedirect('/');

    expect(CustomerAccount::query()->count())->toBe(0)
        ->and(Order::query()->whereKey($this->order->id)->exists())->toBeTrue();
});
