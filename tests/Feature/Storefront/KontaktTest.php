<?php

declare(strict_types=1);

use App\Domain\Storefront\VehicleContext;
use App\Domain\Storefront\VisitorKey;
use App\Mail\ContactConfirmationMail;
use App\Mail\ContactMessageMail;
use App\Models\AdminUser;
use App\Models\ContactMessage;
use App\Models\Vehicle;
use App\Support\VehicleName;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia;

/*
 * The client's #12 (D-123): a contact form instead of a mail program. A message is kept (Verkauf › Nachrichten),
 * mailed to the shop with the sender as reply-to, and confirmed to the sender. A filled honeypot is answered like a
 * person and keeps nothing; the car goes with a message only where the visitor left it ticked, and only the car
 * their own cookie names; a visitor gets five messages a minute.
 */

beforeEach(function (): void {
    config(['rimify.contact.email' => 'service@example.com']);
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

it('keeps the message, mails it to the shop with the sender as reply-to, and confirms it to the sender', function (): void {
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
    Mail::assertSent(ContactConfirmationMail::class, fn (ContactConfirmationMail $mail): bool => $mail->hasTo('jana@example.com'));
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

it('sends the car the visitor chose along — named by the server from their cookie, and only while the box is ticked', function (): void {
    Mail::fake();
    $car = Vehicle::factory()->create(['hsn' => '0005', 'tsn' => '582']);
    $cookie = [VehicleContext::COOKIE => (new VehicleContext((int) $car->id, true))->encode()];

    $this->withCookies($cookie)->post('/kontakt', kontaktForm())->assertSessionHasNoErrors();
    $this->withCookies($cookie)->post('/kontakt', kontaktForm(['withVehicle' => false, 'subject' => 'Ohne Auto']))->assertSessionHasNoErrors();

    expect(ContactMessage::query()->where('subject', 'Frage zu einer Felge')->value('vehicle_label'))->toBe(VehicleName::from($car).' (HSN 0005 · TSN 582)')
        ->and(ContactMessage::query()->where('subject', 'Ohne Auto')->value('vehicle_label'))->toBeNull();
});

it('answers a filled honeypot like a person, and keeps and sends nothing', function (): void {
    Mail::fake();

    $this->from('/kontakt')->post('/kontakt', kontaktForm(['rmf_leer' => 'https://spam.example']))->assertRedirect('/kontakt')->assertSessionHasNoErrors();

    expect(ContactMessage::query()->count())->toBe(0);
    Mail::assertNothingSent();
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

it('lets a visitor send five messages a minute', function (): void {
    Mail::fake();
    $visitor = [VisitorKey::COOKIE => str_pad('kontakt', 40, 'x')];

    foreach (range(1, 5) as $n) {
        $this->withCookies($visitor)->post('/kontakt', kontaktForm(['subject' => 'Nachricht '.$n]))->assertRedirect();
    }

    $this->withCookies($visitor)->post('/kontakt', kontaktForm(['subject' => 'Nachricht 6']))->assertStatus(429);
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

    it('lists the unread messages first, with the car and an answer addressed to the sender', function (): void {
        $read = ContactMessage::query()->create(['name' => 'A', 'email' => 'a@example.com', 'subject' => 'Gelesen', 'message' => 'Schon beantwortet.']);
        $read->forceFill(['read_at' => now()])->save();
        ContactMessage::query()->create(['name' => 'Jana Beispiel', 'email' => 'jana@example.com', 'subject' => 'Neu', 'message' => 'Passt das?', 'vehicle_label' => 'BMW 3er (HSN 0005 · TSN 582)']);

        $this->actingAs(nachrichtenAdmin('support-agent'), 'admin')->get('/admin/nachrichten')->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Nachrichten/Index')
                ->where('filter', 'ungelesen')
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
