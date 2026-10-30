<?php

declare(strict_types=1);

use App\Domain\Storefront\VehicleContext;
use App\Domain\Storefront\VisitorKey;
use App\Http\RateLimits\ShopRateLimits;
use App\Http\Requests\Storefront\ContactRequest;
use App\Mail\ContactConfirmationMail;
use App\Mail\ContactMessageMail;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\ContactMessage;
use App\Models\CustomerAccount;
use App\Models\Vehicle;
use App\Support\ContactRecipient;
use App\Support\VehicleName;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia;

/*
 * The client's #12 (D-123): a contact form instead of a mail program. A message is kept (Verkauf › Nachrichten),
 * mailed to the shop with the sender as reply-to, and a copy goes to the sender only where the address is a signed-in
 * customer's own, confirmed (finding 102, D-218) — to any other the shop would be mailing a stranger's words on a
 * stranger's say-so. A filled honeypot is answered like a person and keeps nothing; the car goes with a message only
 * where the visitor left it ticked, and only the car their own cookie names; a visitor gets five messages a minute, an
 * address of the network thirty an hour, an e-mail address three an hour and ten a day.
 */

beforeEach(function (): void {
    // A shop whose mail leaves (D-347): Mail::fake() catches what it sends. The preview's log mailer is its own test.
    config(['rimify.contact.email' => 'service@example.com', 'mail.default' => 'smtp']);
});

/** @return array<string, mixed> */
function kontaktForm(array $overrides = []): array
{
    return array_merge([
        'name' => 'Jana Beispiel',
        'email' => 'jana@example.com',
        'subject' => 'Frage zu einer Felge',
        'message' => 'Passt die Felge auch mit Winterreifen auf mein Auto?',
        'withVehicle' => true,
        'from' => '/felgen/beispiel',
        'rmf_leer' => '',
        // Handed out half a minute ago: a person had time to write.
        'ticket' => ContactRequest::ticket(now()->subSeconds(30)->getTimestampMs()),
    ], $overrides);
}

it('opens with the subject and the page the visitor came from, both taken only as plain text and a shop path', function (): void {
    $this->get('/kontakt?betreff=Frage%20zu%20Bestellung%20R-1001&von=/felgen/beispiel')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Kontakt/Index')
            ->where('prefill.subject', 'Frage zu Bestellung R-1001')
            ->where('prefill.from', '/felgen/beispiel'));

    // Another host is not a path of this shop.
    $this->get('/kontakt?von=//example.org/x')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('prefill.from', null)->where('prefill.subject', ''));
});

it('keeps the message and mails it to the shop with the sender as reply-to — and writes to no address a guest typed @kunde-12', function (): void {
    Mail::fake();

    $this->from('/kontakt')->post('/kontakt', kontaktForm())->assertRedirect('/kontakt')->assertSessionHasNoErrors();

    $message = ContactMessage::query()->sole();
    expect($message->name)->toBe('Jana Beispiel')
        ->and($message->email)->toBe('jana@example.com')
        ->and($message->subject)->toBe('Frage zu einer Felge')
        ->and($message->from_path)->toBe('/felgen/beispiel')
        // No car chosen: nothing to send with it, whatever the box said.
        ->and($message->vehicle_label)->toBeNull()
        ->and($message->read_at)->toBeNull();

    Mail::assertSent(ContactMessageMail::class, fn (ContactMessageMail $mail): bool => $mail->hasTo('service@example.com')
        && $mail->hasReplyTo('jana@example.com')
        && $mail->contactMessage->is($message));
    // The address is whatever the visitor typed: the shop mails nothing to it (finding 102, D-218).
    Mail::assertNotSent(ContactConfirmationMail::class);
    Mail::assertSentCount(1);
});

it('mails to the address set in the admin, and tells the page the message left — never a copy that did not @kunde-12', function (): void {
    Mail::fake();
    $this->seed(AccessSeeder::class);
    $team = AdminUser::query()->where('email', 'order-manager@rimify.test')->firstOrFail();

    $this->actingAs($team, 'admin')->put('/admin/nachrichten/empfaenger', ['address' => ' Info@Beispiel.de '])->assertSessionHasNoErrors()->assertSessionHas('toast');
    $this->actingAs($team, 'admin')->get('/admin/nachrichten')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('recipient', ['address' => 'info@beispiel.de', 'mailing' => true, 'canChange' => true]));

    $this->from('/kontakt')->post('/kontakt', kontaktForm())->assertSessionHasNoErrors()->assertSessionHas('kontakt', ['mailed' => true, 'copied' => false]);
    Mail::assertSent(ContactMessageMail::class, fn (ContactMessageMail $mail): bool => $mail->hasTo('info@beispiel.de'));
    Mail::assertSentCount(1);
    expect(AuditLog::query()->where('description', 'contact.recipient_changed')->sole()->properties['after'] ?? null)->toBe('info@beispiel.de');
});

it('keeps the message and says so — never that it was mailed — while the shop sends no mail, as on the preview @kunde-12', function (): void {
    Mail::fake();
    // The preview's mailer: everything goes to the log, nothing reaches an inbox.
    config(['mail.default' => 'log']);

    $this->from('/kontakt')->post('/kontakt', kontaktForm())->assertSessionHasNoErrors()->assertSessionHas('kontakt', ['mailed' => false, 'copied' => false]);

    expect(ContactMessage::query()->count())->toBe(1);
    Mail::assertNothingSent();
});

it('lets only who may change orders say where the messages go, and refuses an address that is none', function (): void {
    $this->seed(AccessSeeder::class);
    $support = AdminUser::query()->where('email', 'support-agent@rimify.test')->firstOrFail();
    $team = AdminUser::query()->where('email', 'order-manager@rimify.test')->firstOrFail();

    // Kundenbetreuung reads the messages; where they go is not theirs to change.
    $this->actingAs($support, 'admin')->put('/admin/nachrichten/empfaenger', ['address' => 'fremd@example.org'])->assertForbidden();
    $this->actingAs($support, 'admin')->get('/admin/nachrichten')->assertInertia(fn (AssertableInertia $page) => $page->where('recipient.canChange', false));

    $this->actingAs($team, 'admin')->put('/admin/nachrichten/empfaenger', ['address' => 'kein-at-zeichen'])
        ->assertSessionHasErrors(['address' => 'Diese E-Mail-Adresse sieht nicht vollständig aus. Bitte prüf sie noch einmal.']);
    $this->actingAs($team, 'admin')->put('/admin/nachrichten/empfaenger', ['address' => ''])
        ->assertSessionHasErrors(['address' => 'Trag die Adresse ein, an die neue Nachrichten gehen sollen.']);

    // Unset, the configured contact address stands.
    expect(ContactRecipient::address())->toBe('service@example.com')
        ->and(AuditLog::query()->where('description', 'contact.recipient_changed')->exists())->toBeFalse();
});

it('sends the copy to a signed-in customer\'s own confirmed address, and to no other @kunde-12', function (): void {
    Mail::fake();
    $account = CustomerAccount::query()->create(['email' => 'jana@example.com']);
    $account->forceFill(['password' => 'ein-langes-passwort', 'email_verified_at' => now()])->save();

    // The form opens with the one address a copy goes to.
    $this->actingAs($account, 'customer')->get('/kontakt')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('copyTo', 'jana@example.com'));

    // Their own address, however it is typed: the copy goes to it.
    $this->actingAs($account, 'customer')->post('/kontakt', kontaktForm(['email' => ' Jana@Example.com ']))->assertSessionHasNoErrors();
    Mail::assertSent(ContactConfirmationMail::class, fn (ContactConfirmationMail $mail): bool => $mail->hasTo('jana@example.com'));
    Mail::assertSent(ContactConfirmationMail::class, 1);

    // Somebody else's address typed by the same signed-in customer: the shop is written to, that address is not.
    $this->actingAs($account, 'customer')->post('/kontakt', kontaktForm(['email' => 'opfer@example.org', 'subject' => 'An eine fremde Adresse']))->assertSessionHasNoErrors();
    Mail::assertSent(ContactConfirmationMail::class, 1);
    Mail::assertNotSent(ContactConfirmationMail::class, fn (ContactConfirmationMail $mail): bool => $mail->hasTo('opfer@example.org'));
    Mail::assertSent(ContactMessageMail::class, 2);
});

it('sends no copy to an account whose address was never confirmed, and hands a guest no address', function (): void {
    Mail::fake();
    $account = CustomerAccount::query()->create(['email' => 'jana@example.com']);
    $account->forceFill(['password' => 'ein-langes-passwort'])->save();

    $this->get('/kontakt')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->where('copyTo', null));
    $this->actingAs($account, 'customer')->get('/kontakt')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->where('copyTo', null));
    $this->actingAs($account, 'customer')->post('/kontakt', kontaktForm())->assertSessionHasNoErrors();

    Mail::assertNotSent(ContactConfirmationMail::class);
});

it('takes a name and a subject of one line only: both end in a mail\'s headers', function (): void {
    Mail::fake();

    $this->from('/kontakt')->post('/kontakt', kontaktForm(['name' => "Jana\r\nBcc: opfer@example.org", 'subject' => "Frage\nX-Injected: 1"]))
        ->assertRedirect('/kontakt')
        ->assertSessionHasErrors([
            'name' => 'Der Name passt in eine Zeile – bitte ohne Zeilenumbruch.',
            'subject' => 'Der Betreff passt in eine Zeile – bitte ohne Zeilenumbruch.',
        ]);

    expect(ContactMessage::query()->count())->toBe(0);
    Mail::assertNothingSent();
});

it('lets one e-mail address name three messages an hour, whoever types it — and another address is not held up by it', function (): void {
    Mail::fake();
    $this->travelTo(now()->startOfHour());

    foreach (range(1, ContactRequest::PER_ADDRESS_HOUR) as $n) {
        // Each from another visitor: the limit is the address's, not the sender's.
        $this->withCookies([VisitorKey::COOKIE => str_pad('adresse'.$n, 40, 'x')])->post('/kontakt', kontaktForm(['subject' => 'Nachricht '.$n]))->assertSessionHasNoErrors();
    }

    $this->from('/kontakt')->withCookies([VisitorKey::COOKIE => str_pad('adresse-vier', 40, 'x')])->post('/kontakt', kontaktForm(['email' => 'JANA@example.com', 'subject' => 'Die vierte']))
        ->assertRedirect('/kontakt')
        ->assertSessionHasErrors(['email' => ContactRequest::TOO_MANY]);
    $this->post('/kontakt', kontaktForm(['email' => 'emil@example.com', 'subject' => 'Eine andere Adresse']))->assertSessionHasNoErrors();

    expect(ContactMessage::query()->where('email', 'like', '%jana%')->count())->toBe(3)
        ->and(ContactMessage::query()->where('email', 'emil@example.com')->count())->toBe(1);

    // A filled honeypot keeps nothing and counts against no address.
    expect(ContactRequest::addressLimited('ruth@example.com'))->toBeFalse();
    foreach (range(1, 5) as $n) {
        $this->post('/kontakt', kontaktForm(['email' => 'ruth@example.com', 'rmf_leer' => 'x']));
    }
    expect(ContactRequest::addressLimited('ruth@example.com'))->toBeFalse();

    // An hour on, the address writes again.
    $this->travel(61)->minutes();
    $this->post('/kontakt', kontaktForm(['subject' => 'Eine Stunde später', 'ticket' => ContactRequest::ticket(now()->subSeconds(30)->getTimestampMs())]))->assertSessionHasNoErrors();
    expect(ContactMessage::query()->where('email', 'like', '%jana%')->count())->toBe(4);
});

it('lets one address of the network send thirty messages an hour, however many visitors it claims to be', function (): void {
    Mail::fake();
    $this->travelTo(now()->startOfHour());
    $limit = ShopRateLimits::HOURLY_PER_ADDRESS['shop-kontakt'];

    foreach (range(1, $limit) as $n) {
        // A new visitor key and a new e-mail address every time, a minute apart: only the hour's count is left to stop it.
        $this->travel(1)->minutes();
        $this->withCookies([VisitorKey::COOKIE => str_pad('netz'.$n, 40, 'x')])
            ->post('/kontakt', kontaktForm(['email' => "absender{$n}@example.com", 'ticket' => ContactRequest::ticket(now()->subSeconds(30)->getTimestampMs())]))
            ->assertRedirect();
    }

    $this->travel(1)->minutes();
    $this->withCookies([VisitorKey::COOKIE => str_pad('netz-mehr', 40, 'x')])
        ->post('/kontakt', kontaktForm(['email' => 'noch-einer@example.com', 'ticket' => ContactRequest::ticket(now()->subSeconds(30)->getTimestampMs())]))
        ->assertStatus(429);

    expect(ContactMessage::query()->count())->toBe($limit);
});

it('writes the mails in German, with the message word for word', function (): void {
    $message = ContactMessage::query()->create([
        'name' => 'Jana Beispiel', 'email' => 'jana@example.com', 'subject' => 'Frage zu einer Felge',
        'message' => 'Passt die Felge auch mit Winterreifen?', 'vehicle_label' => 'BMW 3er (HSN 0005 · TSN 582)', 'from_path' => '/felgen/x',
    ]);

    $toShop = (new ContactMessageMail($message))->render();
    $toSender = (new ContactConfirmationMail($message))->render();

    expect($toShop)->toContain('Passt die Felge auch mit Winterreifen?')->toContain('BMW 3er (HSN 0005 · TSN 582)')->toContain('Verkauf › Nachrichten')
        ->and($toSender)->toContain('Danke, Jana Beispiel')->toContain('Passt die Felge auch mit Winterreifen?')->toContain((string) config('rimify.contact.hours'));
});

it('sends the car the box showed along — named by the server as the shop names it, and only while the box is ticked @kunde-12', function (): void {
    Mail::fake();
    $car = Vehicle::factory()->create(['hsn' => '0005', 'tsn' => '582']);
    $other = Vehicle::factory()->create(['hsn' => '0603', 'tsn' => 'BGN']);
    $label = VehicleName::forShop($car->make, $car->model, $car->variant, $car->type_designation).' (HSN 0005 · TSN 582)';
    // Another tab chose another car since the form was opened: what the box showed is what goes (KON-05).
    $cookie = [VehicleContext::COOKIE => (new VehicleContext((int) $other->id, true))->encode()];

    $this->withCookies($cookie)->post('/kontakt', kontaktForm(['vehicleId' => $car->id]))->assertSessionHasNoErrors();
    $this->withCookies($cookie)->post('/kontakt', kontaktForm(['vehicleId' => $car->id, 'withVehicle' => false, 'subject' => 'Ohne Auto']))->assertSessionHasNoErrors();

    expect(ContactMessage::query()->where('subject', 'Frage zu einer Felge')->value('vehicle_label'))->toBe($label)
        ->and(ContactMessage::query()->where('subject', 'Ohne Auto')->value('vehicle_label'))->toBeNull();
});

it('names the car from the visitor\'s cookie for a page that sent no id', function (): void {
    Mail::fake();
    $car = Vehicle::factory()->create(['hsn' => '0005', 'tsn' => '582']);
    $cookie = [VehicleContext::COOKIE => (new VehicleContext((int) $car->id, true))->encode()];

    $this->withCookies($cookie)->post('/kontakt', kontaktForm())->assertSessionHasNoErrors();

    expect(ContactMessage::query()->value('vehicle_label'))->toEndWith('(HSN 0005 · TSN 582)');
});

it('takes as the page a visitor came from only a plain path of this shop', function (string $path, ?string $kept): void {
    expect(ContactRequest::shopPath($path))->toBe($kept);
})->with([
    'a product page' => ['/felgen/borbet-db8gt2', '/felgen/borbet-db8gt2'],
    'with its query' => ['/felgen?zoll=19.0&fahrzeug=3', '/felgen?zoll=19.0&fahrzeug=3'],
    'another host' => ['//example.org/x', null],
    'a dot segment' => ['/.//example.org', null],
    'a parent segment' => ['/felgen/../admin', null],
    'a trailing line break' => ["/felgen\n", null],
    'not a path' => ['https://example.org/', null],
]);

it('answers a filled honeypot like a person, and keeps and sends nothing @kunde-12', function (): void {
    Mail::fake();

    $this->from('/kontakt')->post('/kontakt', kontaktForm(['rmf_leer' => 'https://spam.example']))->assertRedirect('/kontakt')->assertSessionHasNoErrors();

    expect(ContactMessage::query()->count())->toBe(0);
    Mail::assertNothingSent();
});

it('keeps nothing sent sooner than a person writes, and says so — a second send later goes through @kunde-12', function (): void {
    Mail::fake();
    $this->travelTo(now()->startOfMinute());
    $ticket = ContactRequest::ticket();

    // One second after the form was handed out: no person wrote four fields in that.
    $this->travel(1)->seconds();
    $this->from('/kontakt')->post('/kontakt', kontaktForm(['ticket' => $ticket]))
        ->assertRedirect('/kontakt')
        ->assertSessionHasErrors(['ticket' => ContactRequest::TOO_FAST]);

    expect(ContactMessage::query()->count())->toBe(0);
    Mail::assertNothingSent();

    // The same form, sent again a little later: kept, as any message.
    $this->travel(ContactRequest::MIN_SECONDS)->seconds();
    $this->from('/kontakt')->post('/kontakt', kontaktForm(['ticket' => $ticket]))->assertRedirect('/kontakt')->assertSessionHasNoErrors();

    expect(ContactMessage::query()->count())->toBe(1);
});

it('counts the three seconds to the millisecond: handed out late in one second and sent early in another is still too quick @kunde-12', function (): void {
    Mail::fake();
    // Handed out at …,9 s. In whole seconds the send 2,1 s later, at …3,0 s, counted as three seconds old.
    $this->travelTo(now()->startOfMinute()->addMilliseconds(900));
    $ticket = ContactRequest::ticket();

    $this->travelTo(now()->addMilliseconds(2_100));
    $this->from('/kontakt')->post('/kontakt', kontaktForm(['ticket' => $ticket]))
        ->assertRedirect('/kontakt')
        ->assertSessionHasErrors(['ticket' => ContactRequest::TOO_FAST]);

    expect(ContactMessage::query()->count())->toBe(0);

    // At three seconds it is kept.
    $this->travelTo(now()->addMilliseconds(900));
    $this->from('/kontakt')->post('/kontakt', kontaktForm(['ticket' => $ticket]))->assertRedirect('/kontakt')->assertSessionHasNoErrors();

    expect(ContactMessage::query()->count())->toBe(1);
});

it('keeps nothing from a form without a ticket of ours, and asks for the page again @kunde-12', function (?string $ticket): void {
    Mail::fake();

    $this->from('/kontakt')->post('/kontakt', kontaktForm(['ticket' => $ticket]))
        ->assertRedirect('/kontakt')
        ->assertSessionHasErrors(['ticket' => ContactRequest::NO_TICKET]);

    expect(ContactMessage::query()->count())->toBe(0);
})->with([
    'none' => [null],
    'empty' => [''],
    'made up' => ['eyJpdiI6ImFiYyJ9'],
    'sealed, but no time' => [fn (): string => Crypt::encryptString('gestern')],
]);

it('hands the form out with its ticket, and takes no captcha from anyone else @kunde-12', function (): void {
    $this->get('/kontakt')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('ticket', fn (string $ticket): bool => $ticket !== ''))
        ->assertDontSee('recaptcha')
        ->assertDontSee('hcaptcha')
        ->assertDontSee('turnstile');
});

it('names in German what is missing, and keeps nothing incomplete', function (): void {
    Mail::fake();

    $this->from('/kontakt')->post('/kontakt', kontaktForm(['name' => '', 'email' => 'jana@', 'subject' => '', 'message' => 'Hallo']))
        ->assertRedirect('/kontakt')
        ->assertSessionHasErrors([
            'name' => 'Bitte sag uns deinen Namen.',
            'email' => 'Diese E-Mail-Adresse sieht nicht vollständig aus. Bitte prüf sie noch einmal.',
            'subject' => 'Worum geht es? Ein paar Worte als Betreff reichen.',
            'message' => 'Ein, zwei Sätze mehr, damit wir dir gleich richtig antworten können.',
        ]);

    expect(ContactMessage::query()->count())->toBe(0);
    Mail::assertNothingSent();
});

it('keeps the message when the mail cannot be sent', function (): void {
    Mail::shouldReceive('to')->andThrow(new RuntimeException('SMTP down'));

    $this->post('/kontakt', kontaktForm())->assertRedirect()->assertSessionHasNoErrors();

    expect(ContactMessage::query()->count())->toBe(1);
});

it('lets a visitor send five messages a minute @kunde-12', function (): void {
    Mail::fake();
    $visitor = [VisitorKey::COOKIE => str_pad('kontakt', 40, 'x')];

    foreach (range(1, 5) as $n) {
        $this->withCookies($visitor)->post('/kontakt', kontaktForm(['subject' => 'Nachricht '.$n, 'email' => "jana{$n}@example.com"]))->assertRedirect();
    }

    $this->withCookies($visitor)->post('/kontakt', kontaktForm(['subject' => 'Nachricht 6', 'email' => 'jana6@example.com']))->assertStatus(429);
    expect(ContactMessage::query()->count())->toBe(5);
});

it('keeps a message twelve months, then prunes it', function (): void {
    $old = ContactMessage::query()->create(['name' => 'A', 'email' => 'a@example.com', 'subject' => 'Alt', 'message' => 'Alt und beantwortet.']);
    $old->forceFill(['created_at' => now()->subMonths(ContactMessage::KEEP_MONTHS)->subDay()])->save();
    ContactMessage::query()->create(['name' => 'B', 'email' => 'b@example.com', 'subject' => 'Neu', 'message' => 'Passt die Felge auch mit Winterreifen auf mein Auto?']);

    $this->artisan('model:prune', ['--model' => [ContactMessage::class]])->assertSuccessful();

    expect(ContactMessage::query()->pluck('message')->all())->toBe(['Passt die Felge auch mit Winterreifen auf mein Auto?']);
});

describe('Verkauf › Nachrichten', function (): void {
    beforeEach(function (): void {
        $this->seed(AccessSeeder::class);
    });

    function nachrichtenAdmin(string $role): AdminUser
    {
        return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
    }

    it('lists the unread messages first, with the car and an answer addressed to the sender @kunde-12', function (): void {
        $read = ContactMessage::query()->create(['name' => 'A', 'email' => 'a@example.com', 'subject' => 'Gelesen', 'message' => 'Schon beantwortet.']);
        $read->forceFill(['read_at' => now()])->save();
        ContactMessage::query()->create(['name' => 'Jana Beispiel', 'email' => 'jana@example.com', 'subject' => 'Neu', 'message' => 'Passt das?', 'vehicle_label' => 'BMW 3er (HSN 0005 · TSN 582)']);

        $this->actingAs(nachrichtenAdmin('support-agent'), 'admin')->get('/admin/nachrichten')->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Nachrichten/Index')
                ->where('filter', 'ungelesen')
                ->where('count', 1)
                ->where('total', 2)
                ->has('items', 1)
                ->where('items.0.subject', 'Neu')
                ->where('items.0.vehicle', 'BMW 3er (HSN 0005 · TSN 582)')
                ->where('items.0.replyHref', 'mailto:jana@example.com?subject=Re%3A%20Neu')
                ->where('canMarkRead', true));

        $this->actingAs(nachrichtenAdmin('support-agent'), 'admin')->get('/admin/nachrichten?status=alle')->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->has('items', 2));
    });

    it('marks a message read, once, with who read it', function (): void {
        $message = ContactMessage::query()->create(['name' => 'A', 'email' => 'a@example.com', 'subject' => 'Neu', 'message' => 'Passt das?']);
        $agent = nachrichtenAdmin('support-agent');

        $this->actingAs($agent, 'admin')->post("/admin/nachrichten/{$message->id}/gelesen")->assertRedirect()->assertSessionHas('toast');

        $message->refresh();
        expect($message->read_at)->not->toBeNull()->and($message->read_by)->toBe($agent->id);
    });

    it('shows the messages to no one who may not read orders, and lets no one else mark them', function (): void {
        $message = ContactMessage::query()->create(['name' => 'A', 'email' => 'a@example.com', 'subject' => 'Neu', 'message' => 'Passt das?']);

        $this->actingAs(nachrichtenAdmin('content-editor'), 'admin')->get('/admin/nachrichten')->assertForbidden();
        $this->actingAs(nachrichtenAdmin('content-editor'), 'admin')->post("/admin/nachrichten/{$message->id}/gelesen")->assertForbidden();

        expect($message->refresh()->read_at)->toBeNull();
    });
});
