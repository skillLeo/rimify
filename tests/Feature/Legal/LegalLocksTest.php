<?php

declare(strict_types=1);

use App\Console\Commands\GoLiveCheckCommand;
use App\Http\Controllers\Admin\SeitenController;
use App\Http\Middleware\EnsureSudo;
use App\Http\Requests\Admin\LegalPlaceholderRequest;
use App\Http\Requests\Admin\PaymentSettingsRequest;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\Page;
use App\Models\PaymentSetting;
use App\Models\Setting;
use App\Payments\Payments;
use App\Payments\Stripe\StripeGateway;
use App\Services\Admin\AuditDescriber;
use App\Services\Content\LegalReadiness;
use App\Services\Content\LegalTexts;
use App\Services\Content\PageContent;
use App\Services\Content\PageSchema;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia;
use Tests\Support\FakeStripe;
use Tests\Support\LegalFixture;

/*
 * Placeholder legal texts, and the three locks that hold while one is in (D-319, the operator's brief of 23.10.2026):
 * the shop keeps search engines out, rimify:go-live-check fails, and Einstellungen › Zahlung refuses Livemodus, naming
 * what is missing. Test keys keep working. Every lock is proven both ways — held with a placeholder in, open once every
 * text is the Kanzlei's and every Impressum field is given — so a lock that never opens cannot pass.
 */

const LEGAL_ZAHLUNG = '/admin/einstellungen/zahlung';

/** Livemodus with no key entered and none stored: nothing is left to refuse but the legal texts. */
const LEGAL_LIVE_NO_KEYS = ['mode' => 'live', 'publishable_key' => '', 'secret_key' => '', 'webhook_secret' => ''];

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    config(['services.stripe.key' => null, 'services.stripe.secret' => null, 'services.stripe.webhook_secret' => null, 'rimify.payments.driver' => 'stripe']);
    $this->stripe = FakeStripe::install();
});

afterEach(function (): void {
    FakeStripe::uninstall();
    app()['env'] = 'testing';
});

function legalAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** @param  array<string, string>  $form */
function legalPayment(array $form): TestResponse
{
    return test()->actingAs(legalAdmin(), 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])->from(LEGAL_ZAHLUNG)->put(LEGAL_ZAHLUNG, $form);
}

function legalSwitch(Page $page, bool $on, string $part = LegalPlaceholderRequest::TEXT, string $role = 'super-admin'): TestResponse
{
    return test()->actingAs(legalAdmin($role), 'admin')->from('/admin/seiten/'.$page->id)
        ->post('/admin/seiten/'.$page->id.'/platzhalter', ['part' => $part, 'placeholder' => $on]);
}

// ── Lock 3: Livemodus ────────────────────────────────────────────────────────────────────────────────────────────

// The brief's one test: with a placeholder in, Livemodus is refused, in German, naming what is missing — and the very
// same request goes through once that text is the Kanzlei's.
it('refuses Livemodus while a legal text is a placeholder, naming it, and takes the same request once it is real', function (): void {
    LegalFixture::ready();
    LegalFixture::page('agb', true);

    legalPayment(LEGAL_LIVE_NO_KEYS)->assertSessionHasErrors(['mode' => PaymentSettingsRequest::liveRefused(['AGB (Platzhalter)'])]);

    expect(PaymentSettingsRequest::liveRefused(['AGB (Platzhalter)']))
        ->toBe('Den Livemodus kannst du erst einschalten, wenn kein Rechtstext mehr ein Platzhalter ist und das Impressum vollständig ist. Noch offen: AGB (Platzhalter). Den Testmodus kannst du weiter nutzen.')
        ->and(PaymentSetting::query()->count())->toBe(0);

    LegalFixture::page('agb', false);

    legalPayment(LEGAL_LIVE_NO_KEYS)->assertSessionHasNoErrors();

    expect(PaymentSetting::current()?->mode)->toBe('live');
});

it('names every text that is a placeholder and every Impressum field not given', function (): void {
    LegalFixture::ready();
    Setting::set(LegalTexts::FORM_SETTING, true);
    LegalFixture::seller(['legal_form' => null, 'phone' => null]);

    legalPayment(LEGAL_LIVE_NO_KEYS)->assertSessionHasErrors(['mode' => PaymentSettingsRequest::liveRefused([
        'Muster-Widerrufsformular (Platzhalter)', 'Impressum: Rechtsform', 'Impressum: Telefon',
    ])]);
});

it('keeps Testmodus and its test keys working while every text is a placeholder', function (): void {
    // A fresh shop: every text a placeholder, the form's flag never set.
    expect(array_slice(app(LegalReadiness::class)->missing(), 0, 6))->toBe([
        'Impressum (Platzhalter)', 'Datenschutzerklärung (Platzhalter)', 'AGB (Platzhalter)', 'Widerrufsbelehrung (Platzhalter)',
        'Muster-Widerrufsformular (Platzhalter)', 'Versand (Platzhalter)',
    ]);

    legalPayment(['mode' => 'test', 'publishable_key' => 'pk_test_fakeKeyA1b2', 'secret_key' => 'sk_test_fakeKeyC3d4', 'webhook_secret' => 'whsec_test_fakeE5f6'])
        ->assertSessionHasNoErrors();

    expect(PaymentSetting::current()?->mode)->toBe('test')
        ->and(Payments::gateway())->toBeInstanceOf(StripeGateway::class);
});

// ── Lock 1: search engines ───────────────────────────────────────────────────────────────────────────────────────

it('keeps the live shop out of search while a text is a placeholder or the Impressum lacks a field, and lets it in after', function (): void {
    app()['env'] = 'production';

    // A fresh shop: placeholders everywhere.
    expect($this->get('/robots.txt')->assertOk()->getContent())->toBe("User-agent: *\nDisallow: /\n");
    $this->get('/rechtliches/impressum')->assertHeader('X-Robots-Tag', 'noindex, nofollow');

    LegalFixture::ready();

    $live = $this->get('/robots.txt')->assertOk();
    expect($live->getContent())->toBe("User-agent: *\nDisallow:\n\nSitemap: ".rtrim((string) config('app.url'), '/')."/sitemap.xml\n")
        ->and($this->get('/rechtliches/impressum')->headers->has('X-Robots-Tag'))->toBeFalse();

    // One Impressum field taken away: out again.
    LegalFixture::seller(['vat_id' => null]);

    expect($this->get('/robots.txt')->getContent())->toBe("User-agent: *\nDisallow: /\n");
    $this->get('/')->assertHeader('X-Robots-Tag', 'noindex, nofollow');
});

// ── Lock 2: rimify:go-live-check ─────────────────────────────────────────────────────────────────────────────────

it('fails rimify:go-live-check while a text is a placeholder, naming it, whatever else is met', function (): void {
    LegalFixture::ready();
    LegalFixture::page('datenschutz', true);

    Artisan::call('rimify:go-live-check');
    $output = Artisan::output();

    expect($output)->toContain(GoLiveCheckCommand::legalLine(['Datenschutzerklärung (Platzhalter)']));
    expect(Artisan::call('rimify:go-live-check', ['--json' => true]))->toBe(1);

    $json = json_decode(Artisan::output(), true);
    expect($json['legalMissing'])->toBe(['Datenschutzerklärung (Platzhalter)'])
        ->and(collect($json['checks'])->firstWhere('id', 'datenschutz')['state'])->toBe('fehlt');
});

// ── The switch ───────────────────────────────────────────────────────────────────────────────────────────────────

it('switches a text’s flag for who may publish the page, refuses everyone else, and records each switch', function (): void {
    $agb = LegalFixture::page('agb', true, 'Diese AGB gelten für jede Bestellung bei RIMIFY.');

    legalSwitch($agb, false, role: 'support-agent')->assertForbidden();
    expect($agb->refresh()->is_placeholder)->toBeTrue();

    legalSwitch($agb, false)->assertSessionHasNoErrors()->assertSessionHas('toast', SeitenController::PLACEHOLDER_OFF);
    expect($agb->refresh()->is_placeholder)->toBeFalse()
        ->and($agb->team_edited_at)->not->toBeNull();

    legalSwitch($agb, true)->assertSessionHas('toast', SeitenController::PLACEHOLDER_ON);
    expect($agb->refresh()->is_placeholder)->toBeTrue();

    $entries = AuditLog::query()->where('description', 'page.placeholder_switched')->orderBy('id')->get();

    expect($entries)->toHaveCount(2)
        ->and($entries[0]->properties['placeholder']['old'])->toBeTrue()
        ->and($entries[0]->properties['placeholder']['new'])->toBeFalse()
        ->and(app(AuditDescriber::class)->describe($entries[0])['sentence'])->toBe('Bei der Seite „AGB“ wurde der Platzhalter ausgeschaltet: Besucher sehen den Text statt des Hinweises.');
});

it('never switches a flag off over the seeded marker, and says what to do instead', function (): void {
    $agb = LegalFixture::page('agb', true);

    legalSwitch($agb, false)->assertSessionHasErrors(['placeholder' => LegalPlaceholderRequest::MARKER_LEFT]);

    expect($agb->refresh()->is_placeholder)->toBeTrue()
        ->and(AuditLog::query()->where('description', 'page.placeholder_switched')->count())->toBe(0);
});

it('switches the Muster-Widerrufsformular from the Widerrufsbelehrung only', function (): void {
    $belehrung = LegalFixture::page('widerrufsbelehrung', true);
    $agb = LegalFixture::page('agb', true);

    legalSwitch($agb, false, LegalPlaceholderRequest::FORM)->assertSessionHasErrors(['part' => LegalPlaceholderRequest::FORM_ELSEWHERE]);
    expect(app(LegalTexts::class)->placeholder(LegalTexts::FORM))->toBeTrue();

    // The form's words are the statute's: no marker to wait for, and the Belehrung's own flag stays as it is.
    legalSwitch($belehrung, false, LegalPlaceholderRequest::FORM)->assertSessionHasNoErrors();

    expect(app(LegalTexts::class)->placeholder(LegalTexts::FORM))->toBeFalse()
        ->and($belehrung->refresh()->is_placeholder)->toBeTrue();

    $this->actingAs(legalAdmin(), 'admin')->get('/admin/seiten/'.$belehrung->id)->assertInertia(fn (AssertableInertia $page) => $page
        ->where('page.placeholder', true)
        ->where('page.markerLeft', true)
        ->where('page.formPlaceholder', false));
});

it('answers 404 for the switch on a page that is not a legal text', function (): void {
    $this->seed(ContentSeeder::class);
    $home = Page::query()->where('slug', 'startseite')->sole();

    legalSwitch($home, false)->assertNotFound();
});

// ── The flag's own rules ─────────────────────────────────────────────────────────────────────────────────────────

it('starts every legal page as a placeholder, however it was made', function (): void {
    $made = Page::query()->create(['slug' => 'agb', 'locale' => 'de', 'kind' => Page::KIND_LEGAL, 'title' => 'AGB', 'status' => Page::STATUS_PUBLISHED, 'published_at' => now()]);

    expect($made->refresh()->is_placeholder)->toBeTrue()
        ->and(app(LegalTexts::class)->placeholder('agb'))->toBeTrue();
});

it('turns a flag back on when the seeded marker is published again, and never off by publishing', function (): void {
    $this->seed(ContentSeeder::class);
    $agb = Page::query()->where('slug', 'agb')->sole();
    $publish = function (Page $page, array $content): TestResponse {
        return $this->actingAs(legalAdmin(), 'admin')->from('/admin/seiten/'.$page->id)->post('/admin/seiten/'.$page->id.'/veroeffentlichen', $content + [
            'note' => '', 'lawyerReviewed' => false, 'baseVersion' => (int) Page::query()->whereKey($page->id)->value('content_version'),
        ]);
    };
    $live = PageContent::live($agb);
    $content = PageSchema::normalise(PageSchema::for($agb) ?? [], $live, $live);

    // The Kanzlei's words published: the flag stays on until someone switches it off.
    $kanzlei = $content;
    $kanzlei['blocks'][0]['data']['text'] = 'Diese AGB gelten für jede Bestellung bei RIMIFY.';
    $publish($agb, $kanzlei)->assertSessionHasNoErrors();
    expect($agb->refresh()->is_placeholder)->toBeTrue();

    legalSwitch($agb, false)->assertSessionHasNoErrors();
    expect($agb->refresh()->is_placeholder)->toBeFalse();

    // The seeded marker published again: a placeholder again, at once.
    $publish($agb, $content)->assertSessionHasNoErrors();
    expect($agb->refresh()->is_placeholder)->toBeTrue();
});
