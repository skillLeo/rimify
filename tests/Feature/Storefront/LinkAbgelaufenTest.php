<?php

declare(strict_types=1);

use App\Models\CustomerAccount;
use Inertia\Testing\AssertableInertia;

/*
 * The admin audit's F-27: a link from one of our mails that expired or lost a part on the way — a review's, an invoice's,
 * a password's, the Testzahlung's — answered „Dafür fehlt dir die Berechtigung. Am Link liegt es nicht …“ and offered a
 * customer the admin's sign-in. The page now knows it is the link: `reason` is `link`, and it says so.
 */

it('answers a damaged or expired signed link as a link that no longer holds', function (string $url): void {
    $this->get($url)
        ->assertForbidden()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Fehler/Index')->where('status', 403)->where('reason', 'link'));
})->with([
    // By the order's public id since his admin item 18 (D-354).
    'a review link cut short' => ['/bewertung/0b8f6c2e-4d1a-4f7e-9c3b-5a2d8e1f7a90?expires=4102444800&signature=0000'],
    'an expired invoice link' => ['/rechnung/TEST-RE-000001?expires=1&signature=abc'],
]);

it('answers a password link that lost its signature the same way', function (): void {
    // The account is looked up before the signature is: it has to exist for the link to fail on its signature.
    $account = CustomerAccount::query()->create(['email' => 'kunde@beispiel.de']);

    $this->get('/konto/passwort/'.$account->id)
        ->assertForbidden()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Fehler/Index')->where('reason', 'link'));
});

it('keeps every other failure as it was — a page that is not there is no expired link', function (): void {
    $this->get('/gibt-es-nicht')
        ->assertNotFound()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Fehler/Index')->where('status', 404)->where('reason', null));
});
