<?php

declare(strict_types=1);

use App\Services\Content\LegalTexts;
use Inertia\Testing\AssertableInertia;

/*
 * The Impressum's facts (§ 5 DDG) come from the seller data — the one place the invoice and the order mail read too, so
 * the three can never disagree. What is not given yet says so on the page; nothing is guessed, and the brand name never
 * stands in for the legal one.
 */

it('prints the seller’s facts beside the Kanzlei’s text, only on the Impressum', function (): void {
    config(['rimify.seller' => [
        'name' => 'Beispiel Handels GmbH', 'street' => 'Musterweg 1', 'zip' => '50667', 'city' => 'Köln',
        'email' => 'kontakt@beispiel.test', 'vat_id' => 'DE000000000', 'tax_number' => null, 'register' => 'Amtsgericht Köln, HRB 00000',
        'small_business' => false,
    ]]);

    $this->get('/rechtliches/impressum')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->where('provider.complete', true)
        ->where('provider.rows.0', ['label' => 'Anbieter', 'value' => 'Beispiel Handels GmbH'])
        ->where('provider.rows.1', ['label' => 'Anschrift', 'value' => "Musterweg 1\n50667 Köln\nDeutschland"])
        ->where('provider.rows.3', ['label' => 'Registereintrag', 'value' => 'Amtsgericht Köln, HRB 00000']));

    $this->get('/rechtliches/datenschutz')->assertInertia(fn (AssertableInertia $page) => $page->where('provider', null));
});

it('says what is missing instead of inventing it', function (): void {
    config(['rimify.seller' => [
        'name' => null, 'street' => null, 'zip' => null, 'city' => null, 'email' => null,
        'vat_id' => null, 'tax_number' => null, 'register' => null, 'small_business' => false,
    ], 'rimify.contact.email' => 'info@rimify.de']);

    $this->get('/rechtliches/impressum')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('provider.complete', false)
        ->where('provider.rows.0.value', null)
        ->where('provider.rows.1.value', null)
        // The shop's own contact address is the one fact that is never a guess.
        ->where('provider.rows.2.value', 'info@rimify.de'));
});

// The operator's brief of 05.10.2026, §8: while the Kanzlei's text is outstanding, the page says who prepares it, in
// one sentence — the same the order mail says in its place.
it('says who prepares a legal text that is outstanding', function (): void {
    $this->get('/rechtliches/agb')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->where('preparing', LegalTexts::PREPARING)
        ->where('preparing', fn (string $sentence): bool => str_contains($sentence, 'Kanzlei') && str_ends_with($sentence, '.')));
});

// The live sweep of 01.10.2026: /rechtliches/gibt-es-nicht answered 200 with the Impressum under an address naming
// another page. A mistyped address is the designed 404; /rechtliches alone still opens the Impressum.
it('answers a legal address it does not know with a 404, and /rechtliches alone with the Impressum', function (): void {
    $this->get('/rechtliches/gibt-es-nicht')->assertNotFound();
    $this->get('/rechtliches/Impressum')->assertNotFound();

    $this->get('/rechtliches')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->component('Rechtliches/Index')
        ->where('active', 'impressum'));
});
