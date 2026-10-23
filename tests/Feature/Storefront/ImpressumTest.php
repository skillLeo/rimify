<?php

declare(strict_types=1);

use App\Services\Content\LegalTexts;
use App\Support\Seller;
use Inertia\Testing\AssertableInertia;
use Tests\Support\LegalFixture;

/*
 * The Impressum's facts (§ 5 DDG) come from the fields entered once in the admin — the one place the invoice and the
 * order mail read too, so the three can never disagree. A field not given shows its marker, „[FIRMENNAME]“ (D-319): the
 * page invents nothing, and the brand name never stands in for the legal one.
 */

it('prints the seller’s facts from the admin fields, in the order a reader looks for them, only on the Impressum', function (): void {
    LegalFixture::seller();

    $this->get('/rechtliches/impressum')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->where('provider.complete', true)
        ->where('provider.rows', [
            ['label' => 'Anbieter', 'value' => 'Beispiel Räder GmbH', 'missing' => false],
            ['label' => 'Rechtsform', 'value' => 'GmbH', 'missing' => false],
            ['label' => 'Anschrift', 'value' => "Werkstraße 4\n80331 München\nDeutschland", 'missing' => false],
            ['label' => 'Vertreten durch', 'value' => 'Erika Beispiel', 'missing' => false],
            ['label' => 'Registergericht', 'value' => 'Amtsgericht München', 'missing' => false],
            ['label' => 'Registernummer', 'value' => 'HRB 204711', 'missing' => false],
            ['label' => 'Umsatzsteuer-Identifikationsnummer', 'value' => 'DE204711815', 'missing' => false],
            ['label' => 'Telefon', 'value' => '+49 89 123456', 'missing' => false],
            ['label' => 'E-Mail', 'value' => 'rechnung@beispiel.de', 'missing' => false],
        ]));

    $this->get('/rechtliches/datenschutz')->assertInertia(fn (AssertableInertia $page) => $page->where('provider', null));
});

it('shows a marker for every field not given, and invents none', function (): void {
    config(['rimify.contact.email' => 'info@rimify.de']);
    LegalFixture::seller(array_fill_keys(['name', 'legal_form', 'street', 'zip', 'city', 'managing_director', 'register_court', 'register_number', 'vat_id', 'email', 'phone'], null));

    $this->get('/rechtliches/impressum')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('provider.complete', false)
        ->where('provider.rows', [
            ['label' => 'Anbieter', 'value' => '[FIRMENNAME]', 'missing' => true],
            ['label' => 'Rechtsform', 'value' => '[RECHTSFORM]', 'missing' => true],
            ['label' => 'Anschrift', 'value' => "[STRASSE UND HAUSNUMMER]\n[PLZ] [ORT]\nDeutschland", 'missing' => true],
            ['label' => 'Vertreten durch', 'value' => '[GESCHÄFTSFÜHRER]', 'missing' => true],
            ['label' => 'Registergericht', 'value' => '[REGISTERGERICHT]', 'missing' => true],
            ['label' => 'Registernummer', 'value' => '[REGISTERNUMMER]', 'missing' => true],
            ['label' => 'Umsatzsteuer-Identifikationsnummer', 'value' => '[UST-IDNR.]', 'missing' => true],
            ['label' => 'Telefon', 'value' => '[TELEFON]', 'missing' => true],
            // The shop's own contact address is the one fact that is never a guess.
            ['label' => 'E-Mail', 'value' => 'info@rimify.de', 'missing' => false],
        ]));

    // Named as the admin form names the fields, where they are filled in.
    expect(Seller::stored()->impressumMissing())->toBe(['Name des Unternehmens', 'Rechtsform', 'Straße und Hausnummer', 'PLZ', 'Ort', 'Geschäftsführung', 'Registergericht', 'Registernummer', 'USt-IdNr.', 'Telefon']);
});

it('leaves out a row declared „entfällt“, and counts it as given', function (): void {
    LegalFixture::seller(['managing_director' => null, 'register_court' => null, 'register_number' => null, 'phone' => null, 'not_applicable' => ['managing_director', 'register', 'phone']]);

    $this->get('/rechtliches/impressum')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('provider.complete', true)
        ->where('provider.rows', fn ($rows): bool => collect($rows)->pluck('label')->all() === ['Anbieter', 'Rechtsform', 'Anschrift', 'Umsatzsteuer-Identifikationsnummer', 'E-Mail']));

    expect(Seller::stored()->impressumMissing())->toBe([]);
});

it('keeps a seller marked as placeholder out of the count of given fields', function (): void {
    LegalFixture::seller(['placeholder' => true]);

    expect(Seller::stored()->impressumMissing())->toBe([Seller::PLACEHOLDER]);
});

// The operator's brief of 23.10.2026: a placeholder page holds one clear notice and nothing that reads like a clause —
// the words under the flag never reach the browser, whatever was pasted meanwhile.
it('sends a placeholder page’s one notice and not one of its words, and the text once the flag is off', function (): void {
    LegalFixture::page('agb', true, 'Diese AGB gelten für jede Bestellung bei RIMIFY.');

    $this->get('/rechtliches/agb')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('placeholder', true)
            ->where('notice', 'PLATZHALTER: Dieser Text wird vor der Veröffentlichung durch den Rechtstext der Kanzlei ersetzt.')
            ->where('blocks', []))
        ->assertDontSee('Diese AGB gelten', false);

    LegalFixture::page('agb', false, 'Diese AGB gelten für jede Bestellung bei RIMIFY.');

    $this->get('/rechtliches/agb')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('placeholder', false)
        ->where('blocks.0.data.text', 'Diese AGB gelten für jede Bestellung bei RIMIFY.'));
});

it('shows the notice on a legal page that is not there at all', function (): void {
    $this->get('/rechtliches/datenschutz')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->where('placeholder', true)
        ->where('notice', LegalTexts::NOTICE)
        ->where('blocks', []));
});

it('sends the Muster-Widerrufsformular’s notice and no line of the form while its flag is on', function (): void {
    $this->get('/rechtliches/widerrufsformular')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Rechtliches/Widerrufsformular')
            ->where('placeholder', true)
            ->where('notice', LegalTexts::NOTICE)
            ->where('intro', null)
            ->where('addressee', null)
            ->where('fields', [])
            ->where('footnote', null))
        ->assertDontSee('Hiermit widerrufe', false);
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
