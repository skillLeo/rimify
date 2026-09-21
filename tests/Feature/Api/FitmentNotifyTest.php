<?php

declare(strict_types=1);

use App\Mail\FitmentAvailableMail;
use App\Mail\SubscriptionConfirmationMail;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\FitmentSubscription;
use App\Models\Vehicle;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Illuminate\Support\Facades\Mail;

/**
 * F2 — "Sag mir Bescheid, wenn es passt": double opt-in, and a mail on publish to exactly the
 * confirmed addresses whose vehicle the document names.
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
    Mail::fake();
});

function bmw(): Vehicle
{
    return Vehicle::query()->where('hsn', '0005')->where('tsn', '582')->firstOrFail();
}

it('stores the request and sends one confirmation mail', function (): void {
    $this->postJson('/api/v1/fitment/notify', ['email' => ' Kunde@Example.de ', 'fahrzeug' => bmw()->id])
        ->assertStatus(202);

    $subscription = FitmentSubscription::query()->firstOrFail();

    expect($subscription->email)->toBe('kunde@example.de')
        ->and($subscription->confirmed_at)->toBeNull()
        ->and(strlen($subscription->confirm_token))->toBe(64);

    Mail::assertSent(SubscriptionConfirmationMail::class, fn (SubscriptionConfirmationMail $mail): bool => $mail->hasTo('kunde@example.de'));
});

it('answers the same whether the address is new or already waiting', function (): void {
    $payload = ['email' => 'kunde@example.de', 'fahrzeug' => bmw()->id];

    $this->postJson('/api/v1/fitment/notify', $payload)->assertStatus(202);
    $this->postJson('/api/v1/fitment/notify', $payload)->assertStatus(202);

    expect(FitmentSubscription::query()->count())->toBe(1);
    Mail::assertSent(SubscriptionConfirmationMail::class, 2);
});

it('explains a bad address or a missing vehicle in German', function (): void {
    $this->postJson('/api/v1/fitment/notify', ['email' => 'nope', 'fahrzeug' => bmw()->id])
        ->assertStatus(422)
        ->assertJsonPath('errors.email.0', 'Das sieht nicht nach einer E-Mail-Adresse aus.');

    $this->postJson('/api/v1/fitment/notify', ['email' => 'kunde@example.de', 'fahrzeug' => 999999])
        ->assertStatus(422)
        ->assertJsonPath('errors.fahrzeug.0', 'Dieses Fahrzeug kennen wir nicht.');
});

it('confirms through the mailed link and unsubscribes through the other', function (): void {
    $this->postJson('/api/v1/fitment/notify', ['email' => 'kunde@example.de', 'fahrzeug' => bmw()->id]);
    $subscription = FitmentSubscription::query()->firstOrFail();

    $this->get($subscription->confirmUrl())->assertRedirect('/');
    expect($subscription->fresh()?->isActive())->toBeTrue();

    $this->get($subscription->unsubscribeUrl())->assertRedirect('/');
    expect($subscription->fresh()?->isActive())->toBeFalse();

    $this->get('/benachrichtigung/bestaetigen/'.str_repeat('x', 64))->assertRedirect('/');
});

it('mails confirmed subscribers of the named vehicle on publish, and nobody else', function (): void {
    $vehicle = bmw();
    $other = Vehicle::query()->where('id', '!=', $vehicle->id)->whereDoesntHave('fitments')->firstOrFail();

    $confirmed = FitmentSubscription::query()->create(['email' => 'ja@example.de', 'vehicle_id' => $vehicle->id]);
    $confirmed->forceFill(['confirmed_at' => now()])->save();
    FitmentSubscription::query()->create(['email' => 'unbestaetigt@example.de', 'vehicle_id' => $vehicle->id]);
    $elsewhere = FitmentSubscription::query()->create(['email' => 'anderes-auto@example.de', 'vehicle_id' => $other->id]);
    $elsewhere->forceFill(['confirmed_at' => now()])->save();

    $document = ApprovalDocument::query()
        ->whereHas('fitments', fn ($q) => $q->where('vehicle_id', $vehicle->id))
        ->firstOrFail();

    $document->publish();

    Mail::assertSent(FitmentAvailableMail::class, 1);
    Mail::assertSent(FitmentAvailableMail::class, fn (FitmentAvailableMail $mail): bool => $mail->hasTo('ja@example.de') && $mail->wheelCount > 0);

    expect($confirmed->fresh()?->notified_document_id)->toBe($document->id);

    // A second publish of the same document is not a second mail.
    $document->publish();
    Mail::assertSent(FitmentAvailableMail::class, 1);
});

it('lists the requests and the demand for the admin', function (): void {
    $subscription = FitmentSubscription::query()->create(['email' => 'ja@example.de', 'vehicle_id' => bmw()->id]);
    $subscription->forceFill(['confirmed_at' => now()])->save();

    $this->seed(AccessSeeder::class);
    $admin = AdminUser::query()->firstOrFail();

    // A guest is sent to the sign-in; checked before signing in, because the session then persists.
    $this->get('/admin/benachrichtigungen')->assertRedirect('/admin/anmelden');

    $this->actingAs($admin, 'admin')
        ->get('/admin/benachrichtigungen')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Benachrichtigungen/Index')
            ->has('subscriptions', 1)
            ->where('subscriptions.0.status', 'Wartet')
            ->where('demand.0.waiting', 1)
        );
});
