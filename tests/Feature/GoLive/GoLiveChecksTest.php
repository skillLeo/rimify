<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\Page;
use App\Models\Setting;
use App\Services\Commerce\InvoiceSeries;
use App\Services\GoLive\GoLiveCheck;
use App\Services\GoLive\GoLiveChecks;
use App\Support\Seller;

/*
 * rimify:go-live-check's checks (the operator's brief of 05.10.2026, §7): each reads the state the shop is in — the
 * seller's data, the pages' texts, the Gutachten, the payment keys — never a value written down for it; and while a
 * check of „Recht und Pflichtangaben" fails, the shop takes no real payment.
 */

/** A legal page as the Kanzlei delivers it — or, with `$placeholder`, as ContentSeeder writes it. */
function goLivePage(string $slug, string $title, bool $placeholder = false): void
{
    $page = Page::query()->firstOrCreate(['slug' => $slug], ['locale' => 'de', 'kind' => Page::KIND_LEGAL, 'title' => $title, 'status' => Page::STATUS_PUBLISHED, 'published_at' => now()]);
    $page->blocks()->delete();
    $page->blocks()->create(['type' => 'legal_body', 'sort_order' => 10, 'data' => ['heading' => $title, 'text' => $placeholder ? '[Rechtstext folgt]' : "Der Text der Kanzlei: {$title}.", ...($placeholder ? ['placeholder' => true] : [])]]);
}

/** A seller as Einstellungen › Verkäufer & Versand stores it. */
function goLiveSeller(array $over = []): void
{
    Setting::set(Seller::KEY, [
        'name' => 'Beispiel Felgen GmbH', 'street' => 'Musterweg 1', 'zip' => '50667', 'city' => 'Köln', 'email' => 'shop@beispiel.test',
        'vat_id' => 'DE000000000', 'tax_number' => null, 'register_court' => 'Amtsgericht Köln', 'register_number' => 'HRB 00000',
        'managing_director' => 'Erika Mustermann', 'phone' => null, 'placeholder' => false, ...$over,
    ]);
}

/** Everything „Recht und Pflichtangaben" asks for, given. */
function goLiveLegalComplete(): void
{
    goLiveSeller();

    foreach (['impressum' => 'Impressum', 'agb' => 'AGB', 'widerrufsbelehrung' => 'Widerrufsbelehrung', 'datenschutz' => 'Datenschutz', 'barrierefreiheit' => 'Erklärung zur Barrierefreiheit'] as $slug => $title) {
        goLivePage($slug, $title);
    }

    config([
        'mail.default' => 'smtp',
        'rimify.seller.small_business' => false,
        'rimify.shipping.cost_cents' => 990,
        'rimify.shipping.free_from_cents' => null,
        'rimify.shipping.delivery_time' => '3–5 Werktage',
    ]);
    app(InvoiceSeries::class)->open(AdminUser::factory()->create(), 1, 1);
}

/** @return array<string, GoLiveCheck> */
function goLiveById(): array
{
    $byId = [];

    foreach (app(GoLiveChecks::class)->all(network: false) as $check) {
        $byId[$check->id] = $check;
    }

    return $byId;
}

it('counts what is met, and what is open at whose side', function (): void {
    $line = GoLiveChecks::countLine([
        new GoLiveCheck('a', GoLiveChecks::LEGAL, 'A', GoLiveCheck::US, GoLiveCheck::OK, '.', 'X'),
        new GoLiveCheck('b', GoLiveChecks::LEGAL, 'B', GoLiveCheck::US, GoLiveCheck::MISSING, '.', 'X'),
        new GoLiveCheck('c', GoLiveChecks::LEGAL, 'C', GoLiveCheck::CLIENT, GoLiveCheck::MISSING, '.', 'X'),
        new GoLiveCheck('d', GoLiveChecks::LEGAL, 'D', GoLiveCheck::CLIENT, GoLiveCheck::MISSING, '.', 'X'),
        new GoLiveCheck('e', GoLiveChecks::PAYMENT, 'E', GoLiveCheck::CLIENT, GoLiveCheck::UNCHECKABLE, '.', 'X'),
    ]);

    expect($line)->toBe('1 von 5 erfüllt · 1 bei uns · 2 beim Kunden · 1 nicht prüfbar');
});

it('counts the Anlagen a gap names', function (string $gap, int $count): void {
    expect(GoLiveChecks::annexCount($gap))->toBe($count);
})->with([
    'ABE 53841' => ['1–15', 15],
    'a list with a range' => ['3, 5–7', 4],
    'one Anlage' => ['2', 1],
    'a hyphen for the dash' => ['1-3', 3],
]);

it('names every check once, in four groups, each with an owner, a state and a place', function (): void {
    $checks = app(GoLiveChecks::class)->all(network: false);
    $ids = array_map(static fn (GoLiveCheck $c): string => $c->id, $checks);

    expect($ids)->toBe(array_values(array_unique($ids)))
        ->and(array_values(array_unique(array_map(static fn (GoLiveCheck $c): string => $c->group, $checks))))->toBe(GoLiveChecks::GROUPS);

    foreach ($checks as $check) {
        expect($check->owner)->toBeIn([GoLiveCheck::US, GoLiveCheck::CLIENT, GoLiveCheck::HOST])
            ->and($check->state)->toBeIn([GoLiveCheck::OK, GoLiveCheck::MISSING, GoLiveCheck::UNCHECKABLE])
            // A full sentence: a statement, or the question the check cannot answer from here.
            ->and($check->sentence)->toMatch('/[.?]$/')
            ->and($check->place)->not->toBe('');
    }
});

it('reads the Impressum from the seller: a GmbH needs its register and its representative, a sole trader neither', function (): void {
    goLivePage('impressum', 'Impressum');

    goLiveSeller(['register_court' => null, 'register_number' => null, 'managing_director' => null]);
    expect(goLiveById()['impressum']->sentence)->toBe('Im Impressum fehlen: Vertretungsberechtigte, Registergericht und -nummer.');

    goLiveSeller(['name' => 'Erika Mustermann Felgenhandel', 'register_court' => null, 'register_number' => null, 'managing_director' => null]);
    expect(goLiveById()['impressum']->state)->toBe(GoLiveCheck::OK)
        // No telephone is no gap: the contact form is the second fast way (§ 5 Abs. 1 Nr. 2 DDG).
        ->and(goLiveById()['impressum']->sentence)->toContain('der zweite schnelle Kontaktweg ist das Kontaktformular');

    goLiveSeller(['placeholder' => true]);
    expect(goLiveById()['impressum']->state)->toBe(GoLiveCheck::MISSING)
        ->and(goLiveById()['impressum']->owner)->toBe(GoLiveCheck::CLIENT)
        ->and(goLiveById()['impressum']->place)->toBe('/admin/einstellungen/verkaeufer-versand');
});

it('says a legal page is missing while it holds the placeholder, and points at the page to fill', function (): void {
    goLivePage('agb', 'AGB', placeholder: true);
    $agb = goLiveById()['agb'];

    expect($agb->state)->toBe(GoLiveCheck::MISSING)
        ->and($agb->sentence)->toBe('Die AGB sind noch ein Platzhalter: Der Text der Kanzlei fehlt.')
        ->and($agb->place)->toBe('/admin/seiten/'.Page::query()->where('slug', 'agb')->value('id'));

    goLivePage('agb', 'AGB');

    expect(goLiveById()['agb']->state)->toBe(GoLiveCheck::OK);
});

it('names each released Gutachten whose Anlagen are missing, with how many', function (): void {
    ApprovalDocument::factory()->create(['kind' => 'ABE', 'kba_number' => '53841', 'status' => 'published', 'missing_annexes' => '1–15', 'valid_from' => null, 'valid_to' => null]);

    $anlagen = goLiveById()['anlagen'];

    expect($anlagen->state)->toBe(GoLiveCheck::MISSING)
        ->and($anlagen->sentence)->toStartWith('ABE 53841: 15 Anlagen fehlen (1–15).')
        ->and($anlagen->sentence)->toContain('„noch nicht gelesen“, nie ein Nein');
});

it('takes no real payment while a legal check fails — and says nothing of it in test mode', function (): void {
    goLiveLegalComplete();
    config(['rimify.payments.driver' => 'stripe', 'services.stripe.mode' => 'test', 'services.stripe.key' => 'pk_test_fakeKey', 'services.stripe.secret' => 'sk_test_fakeKey', 'services.stripe.webhook_secret' => 'whsec_test_x']);

    // Test mode: no money moves, nothing to refuse.
    goLivePage('agb', 'AGB', placeholder: true);
    expect(app(GoLiveChecks::class)->liveRefusal())->toBeNull();

    app()['env'] = 'production';

    try {
        config(['rimify.review.enabled' => false, 'services.stripe.mode' => 'live', 'services.stripe.key' => 'pk_live_fakeKey', 'services.stripe.secret' => 'sk_live_fakeKey', 'services.stripe.webhook_secret' => 'whsec_live_x']);

        $refused = app(GoLiveChecks::class)->liveRefusal();
        expect($refused)->not->toBeNull()
            ->and(array_map(static fn (GoLiveCheck $c): string => $c->id, $refused ?? []))->toBe(['agb']);

        goLivePage('agb', 'AGB');
        expect(app(GoLiveChecks::class)->liveRefusal())->toBeNull();
    } finally {
        app()['env'] = 'testing';
    }
});
