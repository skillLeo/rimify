<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\AbdeckungController;
use App\Http\Controllers\Admin\AdminLoginController;
use App\Http\Controllers\Admin\AdminPreferencesController;
use App\Http\Controllers\Admin\AdminProfileController;
use App\Http\Controllers\Admin\AnfragenController;
use App\Http\Controllers\Admin\AuflagenController;
use App\Http\Controllers\Admin\BenachrichtigungenController;
use App\Http\Controllers\Admin\BenutzerController;
use App\Http\Controllers\Admin\BestellungenController;
use App\Http\Controllers\Admin\DemoDataController;
use App\Http\Controllers\Admin\EinladungController;
use App\Http\Controllers\Admin\ErstattungController;
use App\Http\Controllers\Admin\FahrzeugeController;
use App\Http\Controllers\Admin\FelgenController as AdminFelgenController;
use App\Http\Controllers\Admin\FragenController;
use App\Http\Controllers\Admin\GutachtenAngabenController;
use App\Http\Controllers\Admin\GutachtenAuflagenController;
use App\Http\Controllers\Admin\GutachtenController;
use App\Http\Controllers\Admin\GutachtenFahrzeugController;
use App\Http\Controllers\Admin\GutachtenTabelleController;
use App\Http\Controllers\Admin\GutachtenZeilenController;
use App\Http\Controllers\Admin\KatalogImportController;
use App\Http\Controllers\Admin\KonflikteController;
use App\Http\Controllers\Admin\MarkenController;
use App\Http\Controllers\Admin\NachfrageController;
use App\Http\Controllers\Admin\NavigationController;
use App\Http\Controllers\Admin\ProtokollController;
use App\Http\Controllers\Admin\RdksPreiseController;
use App\Http\Controllers\Admin\RechnungsnummernController;
use App\Http\Controllers\Admin\ReviewController;
use App\Http\Controllers\Admin\RollenController;
use App\Http\Controllers\Admin\RueckbuchungenController;
use App\Http\Controllers\Admin\SavedViewsController;
use App\Http\Controllers\Admin\SeitenController;
use App\Http\Controllers\Admin\SpeicherController;
use App\Http\Controllers\Admin\SudoController;
use App\Http\Controllers\Admin\SystemController;
use App\Http\Controllers\Admin\UebersichtController;
use App\Http\Controllers\Admin\UploadController;
use App\Http\Controllers\Admin\WuchtgewichteController;
use App\Http\Controllers\Admin\ZahlungController;
use App\Http\Controllers\Api\FitmentCountController;
use App\Http\Controllers\Api\FitmentNotifyController;
use App\Http\Controllers\Api\PlzController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\VehicleTreeController;
use App\Http\Controllers\DesignController;
use App\Http\Controllers\Storefront\BenachrichtigungController;
use App\Http\Controllers\Storefront\BestellungController;
use App\Http\Controllers\Storefront\CheckController;
use App\Http\Controllers\Storefront\FahrzeugAufbauController;
use App\Http\Controllers\Storefront\FahrzeugController;
use App\Http\Controllers\Storefront\FahrzeugPapiereController;
use App\Http\Controllers\Storefront\FaqController;
use App\Http\Controllers\Storefront\FelgenController;
use App\Http\Controllers\Storefront\FelgenrechnerController;
use App\Http\Controllers\Storefront\KasseController;
use App\Http\Controllers\Storefront\KasseZahlungController;
use App\Http\Controllers\Storefront\KontaktController;
use App\Http\Controllers\Storefront\KontoController;
use App\Http\Controllers\Storefront\PaymentWebhookController;
use App\Http\Controllers\Storefront\RatgeberController;
use App\Http\Controllers\Storefront\RechnungController;
use App\Http\Controllers\Storefront\RechtlichesController;
use App\Http\Controllers\Storefront\StartseiteController;
use App\Http\Controllers\Storefront\TestzahlungController;
use App\Http\Controllers\Storefront\VergleichController;
use App\Http\Controllers\Storefront\VorschauController;
use App\Http\Controllers\Storefront\WarenkorbController;
use App\Http\Controllers\Storefront\WiderrufsformularController;
use App\Http\Middleware\EnsureAdminMay;
use App\Http\Middleware\EnsureSudo;
use App\Http\Requests\Admin\WheelStatusRequest;
use App\Models\PaymentSetting;
use App\Models\StorageSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
 * Paths are German because the audience is German and a URL is read (CONTRIBUTING.md §6). Route NAMES
 * are the stable identifier — the header state machine, the nav table and every test match on the
 * name, so a path can be changed without touching anything else.
 */

// ── Storefront ───────────────────────────────────────────────────────────────────────────────

Route::get('/', [StartseiteController::class, 'index'])->name('startseite');
Route::get('/ratgeber/{slug}', RatgeberController::class)->name('ratgeber.show');
Route::get('/felgenrechner', [FelgenrechnerController::class, 'index'])->name('felgenrechner.index');

Route::get('/felgen-suchen', [FelgenController::class, 'suchen'])->name('felgen.suchen');
Route::get('/felgen', [FelgenController::class, 'index'])->name('felgen.index');
Route::get('/felgen/{model}', [FelgenController::class, 'show'])->name('felgen.show');
// Up to four wheels side by side; the keys travel in `?f=` so a comparison is a link.
Route::get('/vergleich', [VergleichController::class, 'index'])->name('vergleich.index');

Route::get('/rimify-check', [CheckController::class, 'index'])->name('check.index');
Route::get('/rimify-check/ergebnis/{token}', [CheckController::class, 'ergebnis'])->name('check.ergebnis');
// „RIMIFY-Check drucken“: the answer for the chosen car and one wheel, frozen under a token (29.09.2026).
Route::post('/rimify-check/ergebnis', [CheckController::class, 'store'])->middleware('throttle:shop-check')->name('check.ergebnis.store');

/*
 * Choosing the vehicle. A POST because it writes state, and rate-limited because the key-number
 * lookup is the one unauthenticated endpoint that reads the vehicle table by arbitrary input.
 */
Route::middleware('throttle:shop-fahrzeug')->group(function (): void {
    Route::post('/fahrzeug', [FahrzeugController::class, 'store'])->name('fahrzeug.store');
    Route::post('/fahrzeug/schluesselnummern', [FahrzeugController::class, 'resolve'])
        ->name('fahrzeug.resolve');
    // 8.1, 8.2 and T from the customer's own papers, kept per car in one cookie (Block C, item 10).
    Route::post('/fahrzeug/{vehicle}/papiere', [FahrzeugPapiereController::class, 'store'])->whereNumber('vehicle')->name('fahrzeug.papiere.store');
    Route::delete('/fahrzeug/{vehicle}/papiere', [FahrzeugPapiereController::class, 'destroy'])->whereNumber('vehicle')->name('fahrzeug.papiere.destroy');
    // Karosserieform and Antrieb from the owner, where the vehicle data has neither (the operator's last prompt §1.1).
    Route::post('/fahrzeug/{vehicle}/aufbau', [FahrzeugAufbauController::class, 'store'])->whereNumber('vehicle')->name('fahrzeug.aufbau.store');
    Route::delete('/fahrzeug/{vehicle}/aufbau', [FahrzeugAufbauController::class, 'destroy'])->whereNumber('vehicle')->name('fahrzeug.aufbau.destroy');
});

Route::delete('/fahrzeug', [FahrzeugController::class, 'destroy'])->name('fahrzeug.destroy');

Route::get('/warenkorb', [WarenkorbController::class, 'index'])->name('warenkorb.index');
Route::post('/warenkorb', [WarenkorbController::class, 'store'])->name('warenkorb.store');
Route::patch('/warenkorb/{line}', [WarenkorbController::class, 'update'])->name('warenkorb.update');
Route::delete('/warenkorb/{line}', [WarenkorbController::class, 'destroy'])->name('warenkorb.destroy');
// A Komplettrad line: its Wuchtgewichte colour, and the way back to Felgen only (docs/specs/komplettrad.md §4.10).
Route::patch('/warenkorb/{line}/gewichte', [WarenkorbController::class, 'weights'])->name('warenkorb.gewichte');
Route::delete('/warenkorb/{line}/reifen', [WarenkorbController::class, 'destroyTyre'])->name('warenkorb.reifen.destroy');
Route::get('/kasse', [KasseController::class, 'index'])->name('kasse.index');
// The RDKS answer (§5.3): the server stores it with the quote and re-renders the totals itself.
Route::patch('/kasse/rdks', [KasseController::class, 'rdks'])->middleware('throttle:shop-kasse-rdks')->name('kasse.rdks');
// Refuses every order while nothing binding can happen (ACCURACY.md D4); it never writes a row.
Route::post('/kasse', [KasseController::class, 'store'])->middleware('throttle:shop-kasse')->name('kasse.store');
// „Zahlungspflichtig bestellen“ with Stripe: the basket decided again, the order written, its PaymentIntent (JSON).
Route::post('/kasse/zahlung', [KasseZahlungController::class, 'store'])->middleware('throttle:shop-kasse')->name('kasse.zahlung');
// The sandbox's payment page (App\Payments\SandboxGateway): by its signed link only, and only where
// the review is on (TestPaymentRequest). The POST carries the same signature in its query string.
Route::get('/kasse/testzahlung/{order}', [TestzahlungController::class, 'show'])->middleware('signed')->name('kasse.testzahlung');
Route::post('/kasse/testzahlung/{order}', [TestzahlungController::class, 'store'])->middleware(['signed', 'throttle:shop-testzahlung'])->name('kasse.testzahlung.store');
Route::get('/bestellung/{order}', [BestellungController::class, 'show'])->name('bestellung.show');
// Mein Konto (Block G §2): offered after a paid order with one click; guest checkout stays the default.
Route::post('/bestellung/{order}/konto', [KontoController::class, 'offer'])->middleware('throttle:shop-konto')->name('bestellung.konto');
Route::middleware('guest:customer')->group(function (): void {
    Route::get('/konto/anmelden', [KontoController::class, 'create'])->name('konto.anmelden');
    Route::post('/konto/anmelden', [KontoController::class, 'login'])->middleware('throttle:shop-konto')->name('konto.login');
    Route::get('/konto/passwort-vergessen', [KontoController::class, 'forgot'])->name('konto.vergessen');
    Route::post('/konto/passwort-vergessen', [KontoController::class, 'sendLink'])->middleware('throttle:shop-konto')->name('konto.vergessen.senden');
});
Route::get('/konto/passwort/{account}', [KontoController::class, 'editPassword'])->whereNumber('account')->middleware('signed')->name('konto.passwort');
Route::post('/konto/passwort/{account}', [KontoController::class, 'updatePassword'])->whereNumber('account')->middleware(['signed', 'throttle:shop-konto'])->name('konto.passwort.setzen');
Route::middleware('auth:customer')->group(function (): void {
    Route::get('/konto', [KontoController::class, 'show'])->name('konto');
    Route::post('/konto/abmelden', [KontoController::class, 'logout'])->name('konto.abmelden');
    Route::delete('/konto', [KontoController::class, 'destroy'])->name('konto.loeschen');
});
// An invoice's PDF from the private disk, by its signed link only (Invoices::link).
Route::get('/rechnung/{number}', RechnungController::class)->where('number', '[A-Z-]+[0-9]+')->middleware(['signed', 'throttle:shop-api'])->name('rechnung.show');
// The confirmation page asks while the payment is being confirmed; it reads the order, it never pays it.
Route::get('/bestellung/{order}/status', [BestellungController::class, 'status'])->middleware('throttle:shop-api')->name('bestellung.status');
// The payment provider's signed webhook (outside the CSRF check, bootstrap/app.php): stored raw, 200, work queued.
Route::post('/webhooks/{provider}', PaymentWebhookController::class)->whereIn('provider', ['stripe'])->name('webhooks.payment');

/*
 * The JSON endpoints the shell calls. They sit in the web group on purpose: the session and the
 * vehicle cookie are what most of them answer about, and a GET carries no CSRF token to check.
 */
Route::prefix('api/v1')->name('api.')->group(function (): void {
    // Asked as the customer types: its own counter, so a long query never costs them the vehicle picker.
    Route::get('/search', SearchController::class)->middleware('throttle:shop-suche')->name('search');

    Route::middleware('throttle:shop-api')->group(function (): void {
        Route::get('/vehicles/models', [VehicleTreeController::class, 'models'])->name('vehicles.models');
        Route::get('/vehicles/variants', [VehicleTreeController::class, 'variants'])->name('vehicles.variants');
        Route::get('/fitment/count', FitmentCountController::class)->name('fitment.count');
        // The checkout's Ort for a PLZ (GeoNames, CC BY 4.0): places only, never a guess.
        Route::get('/plz/{plz}', PlzController::class)->where('plz', '[0-9]{5}')->name('plz');
        // Writes a row and sends a mail: a tighter limit than the read endpoints.
        Route::post('/fitment/notify', FitmentNotifyController::class)->middleware('throttle:shop-benachrichtigung')->name('fitment.notify');
    });
});

// The two links a subscription mail carries (F2); tokens, no session.
Route::get('/benachrichtigung/bestaetigen/{token}', [BenachrichtigungController::class, 'bestaetigen'])
    ->name('benachrichtigung.bestaetigen');
Route::get('/benachrichtigung/abmelden/{token}', [BenachrichtigungController::class, 'abmelden'])
    ->name('benachrichtigung.abmelden');

Route::get('/faq', FaqController::class)->name('faq');
Route::get('/kontakt', [KontaktController::class, 'index'])->name('kontakt');
// The statute's model form (Art. 246a § 1 Abs. 2 EGBGB), before the CMS pages' catch-all.
Route::get('/rechtliches/widerrufsformular', WiderrufsformularController::class)->name('rechtliches.widerrufsformular');
Route::get('/rechtliches/{slug?}', RechtlichesController::class)->name('rechtliches');

// A page's draft in the real shop, for the Inhalte editor and whoever it shares the link with. The
// signature is the permission (it expires); no login, never indexed, framable by our own origin only.
Route::get('/vorschau/seite/{page}', VorschauController::class)
    ->whereNumber('page')
    ->middleware(['signed', 'throttle:60,1,vorschau-seite'])
    ->name('vorschau.seite');

/*
 * The design specimen: every token and every component in every state, on one page. It exists so
 * a component is reviewed once, in isolation, before a page is built on it. Local and test
 * environments only — it is not part of the shop.
 */
if (app()->environment(['local', 'testing'])) {
    Route::get('/__design', DesignController::class)->name('design');
}

// ── Admin ────────────────────────────────────────────────────────────────────────────────────
//
// Guests are redirected here by bootstrap/app.php, so the path is fixed by that setting too.

/*
 * Unmatched paths land here rather than in the router's own 404, so the request still passes
 * through the web middleware: the session, the device split and the shared Inertia props all
 * exist when the error page renders, and the 404 keeps the header, the basket and the vehicle.
 */
Route::fallback(static fn () => abort(404));

// The whole panel answers 404 where `rimify.admin.enabled` is false — the preview server while it
// is being built. Enforced by EnsureAdminPanelEnabled at the front of the web group, not here:
// as route middleware it was sorted after `Authenticate` and lost to the sign-in redirect.
Route::prefix('admin')->name('admin.')->group(function (): void {
    Route::get('/anmelden', [AdminLoginController::class, 'create'])
        ->middleware('guest:admin')
        ->name('anmelden');

    // The attempt itself. Throttled inside the Form Request per address AND per IP, so one person
    // guessing at one account cannot lock every other admin out by using their address.
    Route::post('/anmelden', [AdminLoginController::class, 'store'])
        ->middleware('guest:admin')
        ->name('anmelden.store');

    // Accepting an invitation: the link in the e-mail. Not behind `auth:admin` — the person has no
    // account until they accept — and throttled, because the token is the only thing they present.
    Route::get('/einladung/{token}', [EinladungController::class, 'show'])
        ->middleware('guest:admin')
        ->where('token', '[A-Za-z0-9_-]{20,128}')
        ->name('einladung');
    Route::post('/einladung/{token}', [EinladungController::class, 'accept'])
        ->middleware(['guest:admin', 'throttle:6,1,einladung-annehmen'])
        ->where('token', '[A-Za-z0-9_-]{20,128}')
        ->name('einladung.annehmen');

    Route::middleware('auth:admin')->group(function (): void {
        Route::post('/abmelden', [AdminLoginController::class, 'destroy'])->name('abmelden');

        // The signed-in person's own account and panel layout. Every admin may reach their own and
        // nobody else's: nothing here takes an id, so there is nothing to point at another row.
        Route::get('/profil', [AdminProfileController::class, 'show'])->name('profil');
        Route::put('/profil/passwort', [AdminProfileController::class, 'updatePassword'])
            ->middleware('throttle:6,1,profil-passwort')
            ->name('profil.passwort');
        Route::patch('/ansicht', [AdminPreferencesController::class, 'update'])->name('ansicht');

        // Every page names the permission it needs (EnsureAdminMay): the rail hides what a role may
        // not open, but a pasted URL must still be refused on the server (R-11). Übersicht is every
        // admin's and filters its own figures by permission.
        Route::get('/', UebersichtController::class)->name('uebersicht');
        Route::get('/uebersicht/export', [UebersichtController::class, 'export'])
            ->middleware(EnsureAdminMay::class.':reports,export')
            ->name('uebersicht.export');
        Route::get('/gutachten', [GutachtenController::class, 'index'])
            ->middleware(EnsureAdminMay::class.':approvals,view')
            ->name('gutachten.index');
        // Gutachten-Erfassung (the review release §4.3): the PDF and the document's facts, the
        // Verwendungsbereich rows, the preview, the Freigabe — each asked of ApprovalDocumentPolicy
        // through its Form Request. `/neu` and `/suche` are fixed segments, never a `{document}`.
        Route::get('/gutachten/neu', [GutachtenController::class, 'create'])->name('gutachten.create');
        Route::post('/gutachten', [GutachtenController::class, 'store'])->middleware('throttle:30,1,gutachten-store')->name('gutachten.store');
        Route::get('/gutachten/suche/fahrzeuge', [GutachtenZeilenController::class, 'vehicles'])->middleware('throttle:120,1,gutachten-suche-fahrzeuge')->name('gutachten.suche.fahrzeuge');
        Route::get('/gutachten/suche/felgen', [GutachtenZeilenController::class, 'wheels'])->middleware('throttle:120,1,gutachten-suche-felgen')->name('gutachten.suche.felgen');
        Route::get('/gutachten/{document}', [GutachtenController::class, 'show'])->whereNumber('document')->name('gutachten.show');
        Route::put('/gutachten/{document}', [GutachtenController::class, 'update'])->whereNumber('document')->name('gutachten.update');
        Route::post('/gutachten/{document}/freigeben', [GutachtenController::class, 'release'])->whereNumber('document')->name('gutachten.freigeben');
        Route::post('/gutachten/{document}/zeilen', [GutachtenZeilenController::class, 'store'])->whereNumber('document')->name('gutachten.zeilen.store');
        // A car exactly as the document names it — no HSN or TSN, none made up (Block C, item 7).
        Route::post('/gutachten/{document}/fahrzeuge', [GutachtenFahrzeugController::class, 'store'])->whereNumber('document')->middleware('throttle:30,1,gutachten-fahrzeuge-store')->name('gutachten.fahrzeuge.store');
        Route::put('/gutachten/{document}/zeilen/{fitment}', [GutachtenZeilenController::class, 'update'])->whereNumber(['document', 'fitment'])->name('gutachten.zeile.update');
        Route::delete('/gutachten/{document}/zeilen/{fitment}', [GutachtenZeilenController::class, 'destroy'])->whereNumber(['document', 'fitment'])->name('gutachten.zeile.entfernen');
        // A Gutachten's own Auflagenverzeichnis (the corrections memo §1): its codes, written while it is a draft.
        Route::post('/gutachten/{document}/auflagen', [GutachtenAuflagenController::class, 'store'])->whereNumber('document')->name('gutachten.auflagen.store');
        Route::post('/gutachten/{document}/auflagen/stapel', [GutachtenAuflagenController::class, 'batch'])->whereNumber('document')->name('gutachten.auflagen.stapel');
        Route::put('/gutachten/{document}/auflagen/{condition}', [GutachtenAuflagenController::class, 'update'])->whereNumber(['document', 'condition'])->name('gutachten.auflage.update');
        Route::delete('/gutachten/{document}/auflagen/{condition}', [GutachtenAuflagenController::class, 'destroy'])->whereNumber(['document', 'condition'])->name('gutachten.auflage.entfernen');
        // A load-index limit that differs from the table, confirmed as printed with a reason.
        Route::post('/gutachten/{document}/auflagen/{condition}/grenze', [GutachtenAuflagenController::class, 'confirmLimit'])->whereNumber(['document', 'condition'])->name('gutachten.auflage.grenze');
        // What it states beside its codes (the corrections memo §4): Befestigungsmittel, Pflichthinweise, Nacharbeit mit Maßen.
        Route::post('/gutachten/{document}/befestigungsmittel', [GutachtenAngabenController::class, 'store'])->whereNumber('document')->name('gutachten.befestigungsmittel.store');
        Route::delete('/gutachten/{document}/befestigungsmittel/{fastener}', [GutachtenAngabenController::class, 'destroyFastener'])->whereNumber(['document', 'fastener'])->name('gutachten.befestigungsmittel.entfernen');
        Route::post('/gutachten/{document}/hinweise', [GutachtenAngabenController::class, 'store'])->whereNumber('document')->name('gutachten.hinweis.store');
        Route::delete('/gutachten/{document}/hinweise/{notice}', [GutachtenAngabenController::class, 'destroyNotice'])->whereNumber(['document', 'notice'])->name('gutachten.hinweis.entfernen');
        Route::post('/gutachten/{document}/nacharbeit', [GutachtenAngabenController::class, 'store'])->whereNumber('document')->name('gutachten.nacharbeit.store');
        Route::delete('/gutachten/{document}/nacharbeit/{rework}', [GutachtenAngabenController::class, 'destroyRework'])->whereNumber(['document', 'rework'])->name('gutachten.nacharbeit.entfernen');
        // Its own table of tyre load at speed (ABE 55255, p. 6), saved whole.
        Route::put('/gutachten/{document}/tragfaehigkeitstabelle', [GutachtenTabelleController::class, 'update'])->whereNumber('document')->name('gutachten.tabelle.update');

        // The review kit (the review release §3): the board, the point sent from the feedback button, the
        // list the team answers from and a point's screenshot — only where the review is on
        // (ReviewFeedbackPolicy, asked by ReviewRequest).
        Route::get('/review', [ReviewController::class, 'board'])->name('review.board');
        Route::get('/review/rueckmeldungen', [ReviewController::class, 'feedback'])->name('review.rueckmeldungen');
        Route::post('/review/rueckmeldungen', [ReviewController::class, 'store'])->middleware('throttle:30,1,review-store')->name('review.store');
        Route::patch('/review/rueckmeldungen/{feedback}', [ReviewController::class, 'update'])->whereNumber('feedback')->name('review.update');
        Route::get('/review/rueckmeldungen/{feedback}/bild', [ReviewController::class, 'image'])->whereNumber('feedback')->name('review.bild');

        // Gutachten › Auflagen: every document's own list, read-only; each is written on its Gutachten.
        Route::get('/auflagen', [AuflagenController::class, 'index'])->middleware(EnsureAdminMay::class.':approvals,view')->name('auflagen.index');

        // Gutachten › Konflikte: where documents disagree, the shop says UNKNOWN until a person decides here.
        Route::get('/konflikte', [KonflikteController::class, 'index'])->middleware(EnsureAdminMay::class.':approvals,view')->name('konflikte.index');
        Route::get('/konflikte/{conflict}', [KonflikteController::class, 'show'])->whereNumber('conflict')->middleware(EnsureAdminMay::class.':approvals,view')->name('konflikte.show');
        Route::post('/konflikte/entscheiden', [KonflikteController::class, 'decide'])->middleware('throttle:60,1,konflikte-entscheiden')->name('konflikte.entscheiden');

        // Fahrzeuge: the variants, the ones waiting for their legal data, and one vehicle's page —
        // never deleted here (R-04).
        Route::get('/fahrzeuge', [FahrzeugeController::class, 'index'])->middleware(EnsureAdminMay::class.':vehicles,view')->name('fahrzeuge.index');
        Route::get('/fahrzeuge/pruefung', [FahrzeugeController::class, 'review'])->middleware(EnsureAdminMay::class.':vehicles,view')->name('fahrzeuge.pruefung');
        Route::get('/fahrzeuge/{vehicle}', [FahrzeugeController::class, 'show'])->whereNumber('vehicle')->middleware(EnsureAdminMay::class.':vehicles,view')->name('fahrzeuge.show');
        Route::put('/fahrzeuge/{vehicle}', [FahrzeugeController::class, 'update'])->whereNumber('vehicle')->name('fahrzeuge.update');
        // Team: roles and their rights, the accounts that hold them, and the record of every change
        // (docs/admin/team-build-plan.md). Each write is refused on the server by its Form Request.
        Route::get('/rollen', [RollenController::class, 'index'])
            ->middleware(EnsureAdminMay::class.':roles,view')
            ->name('rollen.index');
        Route::post('/rollen', [RollenController::class, 'store'])->name('rollen.store');
        Route::patch('/rollen/{role}', [RollenController::class, 'update'])->whereNumber('role')->name('rollen.update');
        Route::post('/rollen/{role}/duplizieren', [RollenController::class, 'duplicate'])->whereNumber('role')->name('rollen.duplicate');
        Route::delete('/rollen/{role}', [RollenController::class, 'destroy'])->whereNumber('role')->name('rollen.destroy');
        // One cell of the matrix at a time: posting the whole grid would let two admins editing
        // different corners of it silently undo each other.
        Route::patch('/rollen/{role}/rechte', [RollenController::class, 'updatePermission'])
            ->whereNumber('role')
            ->name('rollen.rechte');
        // A whole role's rights at once — only from "von Rolle kopieren" and the module toggles,
        // after the page has shown the difference and the person has confirmed it.
        Route::put('/rollen/{role}/rechte', [RollenController::class, 'replacePermissions'])
            ->whereNumber('role')
            ->name('rollen.rechte.ersetzen');

        Route::get('/benutzer', [BenutzerController::class, 'index'])
            ->middleware(EnsureAdminMay::class.':roles,view')
            ->name('benutzer.index');
        Route::post('/benutzer/einladungen', [BenutzerController::class, 'invite'])->middleware('throttle:20,1,benutzer-einladen')->name('benutzer.einladen');
        Route::post('/benutzer/einladungen/{invitation}/erneut', [BenutzerController::class, 'resend'])
            ->whereNumber('invitation')
            ->middleware('throttle:20,1,benutzer-einladung-erneut')
            ->name('benutzer.einladung.erneut');
        Route::delete('/benutzer/einladungen/{invitation}', [BenutzerController::class, 'revoke'])
            ->whereNumber('invitation')
            ->name('benutzer.einladung.widerrufen');
        Route::patch('/benutzer/{user}/rolle', [BenutzerController::class, 'changeRole'])->whereNumber('user')->name('benutzer.rolle');
        Route::post('/benutzer/{user}/sperren', [BenutzerController::class, 'suspend'])->whereNumber('user')->name('benutzer.sperren');
        Route::post('/benutzer/{user}/entsperren', [BenutzerController::class, 'reactivate'])->whereNumber('user')->name('benutzer.entsperren');
        Route::post('/benutzer/{user}/abmelden', [BenutzerController::class, 'revokeSessions'])->whereNumber('user')->name('benutzer.abmelden');

        Route::get('/protokoll', [ProtokollController::class, 'index'])
            ->middleware(EnsureAdminMay::class.':audit_log,view')
            ->name('protokoll.index');
        Route::get('/protokoll/export', [ProtokollController::class, 'export'])
            ->middleware(EnsureAdminMay::class.':audit_log,export')
            ->name('protokoll.export');
        // Gutachten › Abdeckung: the coverage matrix and the variants behind each of its cells.
        Route::get('/abdeckung', [AbdeckungController::class, 'index'])
            ->middleware(EnsureAdminMay::class.':approvals,view')
            ->name('abdeckung.index');
        // Übersicht › Nachfrage: cars asked for without an approved wheel, and the team's answer to
        // each. Marking is refused on the server without the Gutachten edit right (its Form Request).
        Route::get('/nachfrage', [NachfrageController::class, 'index'])
            ->middleware(EnsureAdminMay::class.':approvals,view')
            ->name('nachfrage.index');
        Route::post('/nachfrage/markierung', [NachfrageController::class, 'mark'])->name('nachfrage.markieren');
        Route::delete('/nachfrage/markierung', [NachfrageController::class, 'unmark'])->name('nachfrage.entmarkieren');

        // Katalog › Felgen (the review release §4.2): the list, one model's form, its step into the
        // shop and the photographs of its finishes. Each write asks WheelModelPolicy through its Form
        // Request; `/neu` and `/sammelaktion` are fixed segments, never read as a `{model}`.
        Route::get('/felgen', [AdminFelgenController::class, 'index'])
            ->middleware(EnsureAdminMay::class.':catalogue,view')
            ->name('felgen.index');
        Route::get('/felgen/neu', [AdminFelgenController::class, 'create'])->name('felgen.create');
        Route::post('/felgen', [AdminFelgenController::class, 'store'])->name('felgen.store');
        Route::post('/felgen/sammelaktion', [AdminFelgenController::class, 'bulk'])->name('felgen.bulk');
        Route::get('/felgen/{model}', [AdminFelgenController::class, 'edit'])->whereNumber('model')->name('felgen.edit');
        Route::put('/felgen/{model}', [AdminFelgenController::class, 'update'])->whereNumber('model')->name('felgen.update');

        foreach (array_keys(WheelStatusRequest::STEPS) as $step) {
            Route::post('/felgen/{model}/'.$step, [AdminFelgenController::class, 'status'])->whereNumber('model')->name('felgen.'.$step);
        }

        // A finish's photographs (COMPLIANCE row 23): one more after the others, one taken off, all in a
        // new order, one described anew. FinishImages composes the cover the shop reads from them.
        Route::post('/felgen/{model}/ausfuehrungen/{finish}/foto', [AdminFelgenController::class, 'image'])
            ->whereNumber(['model', 'finish'])
            ->middleware('throttle:30,1,felgen-foto')
            ->name('felgen.foto');
        Route::put('/felgen/{model}/ausfuehrungen/{finish}/fotos/reihenfolge', [AdminFelgenController::class, 'reorderImages'])
            ->whereNumber(['model', 'finish'])
            ->name('felgen.fotos.reihenfolge');
        Route::put('/felgen/{model}/ausfuehrungen/{finish}/fotos/{image}', [AdminFelgenController::class, 'relabelImage'])
            ->whereNumber(['model', 'finish', 'image'])
            ->name('felgen.foto.beschreibung');
        Route::delete('/felgen/{model}/ausfuehrungen/{finish}/fotos/{image}', [AdminFelgenController::class, 'removeImage'])
            ->whereNumber(['model', 'finish', 'image'])
            ->name('felgen.foto.entfernen');

        // Katalog › Marken: every brand, its place on the brand wall and its logo (BrandPolicy through the
        // Form Requests; the logo read from its bytes, an SVG reduced to drawing — BrandLogoStore).
        Route::get('/marken', [MarkenController::class, 'index'])
            ->middleware(EnsureAdminMay::class.':catalogue,view')
            ->name('marken.index');
        Route::post('/marken', [MarkenController::class, 'store'])->name('marken.store');
        Route::put('/marken/{brand}', [MarkenController::class, 'update'])->whereNumber('brand')->name('marken.update');
        // GPSR: the manufacturer and, outside the EU, the responsible person — printed on the product page.
        Route::put('/marken/{brand}/hersteller', [MarkenController::class, 'manufacturer'])->whereNumber('brand')->name('marken.hersteller');
        Route::delete('/marken/{brand}', [MarkenController::class, 'destroy'])->whereNumber('brand')->name('marken.destroy');
        Route::post('/marken/{brand}/logo', [MarkenController::class, 'logo'])->whereNumber('brand')->middleware('throttle:30,1,marken-logo')->name('marken.logo');
        Route::delete('/marken/{brand}/logo', [MarkenController::class, 'removeLogo'])->whereNumber('brand')->name('marken.logo.entfernen');

        // Katalog › Import: a supplier feed, mapped, checked in a Probelauf, then imported — and taken
        // back whole if it was wrong (CatalogueImportPolicy).
        Route::get('/katalog/import', [KatalogImportController::class, 'index'])
            ->middleware(EnsureAdminMay::class.':imports,view')
            ->name('import.index');
        Route::get('/katalog/import/beispiel.csv', [KatalogImportController::class, 'sample'])
            ->middleware(EnsureAdminMay::class.':imports,view')
            ->name('import.beispiel');
        Route::post('/katalog/import/probelauf', [KatalogImportController::class, 'preview'])->middleware('throttle:20,1,import-probelauf')->name('import.probelauf');
        Route::get('/katalog/import/{import}', [KatalogImportController::class, 'show'])
            ->whereNumber('import')
            ->middleware(EnsureAdminMay::class.':imports,view')
            ->name('import.show');
        // The refused lines of a run, with why, as the file had them — to fix and upload again.
        Route::get('/katalog/import/{import}/abgelehnt.csv', [KatalogImportController::class, 'refused'])
            ->whereNumber('import')
            ->middleware(EnsureAdminMay::class.':imports,view')
            ->name('import.abgelehnt');
        Route::post('/katalog/import/{import}/zuordnung', [KatalogImportController::class, 'remap'])->whereNumber('import')->middleware('throttle:30,1,import-zuordnung')->name('import.zuordnung');
        Route::post('/katalog/import/{import}/importieren', [KatalogImportController::class, 'apply'])->whereNumber('import')->name('import.importieren');
        Route::post('/katalog/import/{import}/zuruecknehmen', [KatalogImportController::class, 'rollback'])->whereNumber('import')->name('import.zuruecknehmen');

        // Verkauf › Bestellungen (docs/admin/rest-build-plan.md, step 2): the filters ride in the URL;
        // the export needs the right to take customer data away as well as to read it.
        Route::get('/bestellungen', [BestellungenController::class, 'index'])
            ->middleware(EnsureAdminMay::class.':orders,view')
            ->name('bestellungen.index');
        Route::get('/bestellungen/{order}', [BestellungenController::class, 'show'])
            ->whereNumber('order')
            ->name('bestellungen.show');
        // Verkauf › Rückbuchungen: chargebacks from the webhook, answered with evidence through the provider's API.
        Route::get('/rueckbuchungen', [RueckbuchungenController::class, 'index'])
            ->middleware(EnsureAdminMay::class.':orders,view')
            ->name('rueckbuchungen.index');
        Route::post('/rueckbuchungen/{dispute}/nachweise', [RueckbuchungenController::class, 'evidence'])
            ->whereNumber('dispute')
            ->middleware('throttle:10,1,rueckbuchung-nachweise')
            ->name('rueckbuchungen.nachweise');
        // „Erstatten“: money leaves the account, so the password once more (sudo); through the provider's API only.
        Route::post('/bestellungen/{order}/erstattung', [ErstattungController::class, 'store'])
            ->whereNumber('order')
            ->middleware([EnsureSudo::class, 'throttle:10,1,erstattung'])
            ->name('bestellungen.erstattung');
        Route::get('/bestellungen/export', [BestellungenController::class, 'export'])
            ->middleware(EnsureAdminMay::class.':orders,export')
            ->name('bestellungen.export');

        // Gespeicherte Ansichten (step 2.2), for every list in AdminLists: a list's filters under a
        // name, kept per person and optionally shared with a role. Each write asks SavedViewPolicy
        // through its Form Request; a deleted view can be restored („Rückgängig“).
        Route::post('/ansichten', [SavedViewsController::class, 'store'])->middleware('throttle:60,1,ansichten-store')->name('ansichten.store');
        // Sudo mode: the password once more before the screens that hold the shop's keys (EnsureSudo).
        Route::get('/bestaetigen', [SudoController::class, 'show'])->name('bestaetigen');
        Route::post('/bestaetigen', [SudoController::class, 'store'])->middleware('throttle:6,1,bestaetigen-store')->name('bestaetigen.store');

        // Einstellungen › Medien und Speicher: the Super-Admin alone (StorageSettingPolicy, checked before
        // the password is asked — nobody is asked only to be refused), then sudo mode.
        Route::prefix('/einstellungen/speicher')->middleware(['can:view,'.StorageSetting::class, EnsureSudo::class])->group(function (): void {
            Route::get('/', [SpeicherController::class, 'edit'])->name('speicher.edit');
            Route::put('/', [SpeicherController::class, 'update'])->middleware('throttle:10,1,speicher-update')->name('speicher.update');
            Route::post('/test', [SpeicherController::class, 'test'])->middleware('throttle:10,1,speicher-test')->name('speicher.test');
            Route::post('/buckets', [SpeicherController::class, 'buckets'])->middleware('throttle:10,1,speicher-buckets')->name('speicher.buckets');
        });

        // Einstellungen › Zahlung: the Stripe keys, as the bucket's — the Super-Admin alone, then sudo mode.
        Route::prefix('/einstellungen/zahlung')->middleware(['can:view,'.PaymentSetting::class, EnsureSudo::class])->group(function (): void {
            Route::get('/', [ZahlungController::class, 'edit'])->name('zahlung.edit');
            Route::put('/', [ZahlungController::class, 'update'])->middleware('throttle:10,1,zahlung-update')->name('zahlung.update');
            Route::post('/test', [ZahlungController::class, 'test'])->middleware('throttle:10,1,zahlung-test')->name('zahlung.test');
            // The real invoice numbers, opened once at the client's own (InvoiceSeries) — there is no route back.
            Route::post('/rechnungsnummern', [RechnungsnummernController::class, 'store'])->middleware('throttle:5,1,rechnungsnummern')->name('zahlung.rechnungsnummern');
        });

        // Large PDFs straight into the bucket (PdfUpload): the form, and the app's stand-in for the
        // bucket on a machine without one — signed, expiring like the bucket's own form.
        Route::post('/uploads/pdf', [UploadController::class, 'presign'])->middleware('throttle:30,1,uploads-pdf-presign')->name('uploads.pdf.presign');
        Route::post('/uploads/pdf/lokal/{name}', [UploadController::class, 'local'])->middleware(['signed', 'throttle:30,1,uploads-pdf-local'])->name('uploads.pdf.local');

        // The rail's demo strip: the demo set taken away, recorded (DemoDataPolicy, DemoPurge).
        Route::post('/demodaten/entfernen', [DemoDataController::class, 'destroy'])->middleware('throttle:6,1,demodaten-purge')->name('demodaten.purge');

        // A view deleted in another tab is still found, so the stale tab is told so in a sentence.
        Route::patch('/ansichten/{view}', [SavedViewsController::class, 'update'])->whereNumber('view')->withTrashed()->name('ansichten.update');
        Route::delete('/ansichten/{view}', [SavedViewsController::class, 'destroy'])->whereNumber('view')->withTrashed()->name('ansichten.destroy');
        Route::post('/ansichten/{view}/wiederherstellen', [SavedViewsController::class, 'restore'])
            ->whereNumber('view')
            ->withTrashed()
            ->name('ansichten.restore');

        // Verkauf › Anfragen — the „Sag mir Bescheid“ subscriptions. Customer e-mail addresses: the
        // Gutachten area's to read, nobody else's (the team that answers them with a document).
        Route::get('/anfragen', [AnfragenController::class, 'index'])
            ->middleware(EnsureAdminMay::class.':approvals,view')
            ->name('anfragen.index');

        // The team's own notifications: every admin's, about their own account only.
        Route::get('/benachrichtigungen', [BenachrichtigungenController::class, 'index'])->name('benachrichtigungen.index');
        Route::get('/benachrichtigungen/neueste', [BenachrichtigungenController::class, 'latest'])->name('benachrichtigungen.neueste');
        Route::post('/benachrichtigungen/gelesen', [BenachrichtigungenController::class, 'readAll'])->name('benachrichtigungen.alle-gelesen');
        Route::post('/benachrichtigungen/{notification}/gelesen', [BenachrichtigungenController::class, 'read'])
            ->whereUuid('notification')
            ->name('benachrichtigungen.gelesen');
        Route::put('/benachrichtigungen/einstellungen', [BenachrichtigungenController::class, 'preferences'])->name('benachrichtigungen.einstellungen');

        // System › Zustand, and the one line of it the rail polls — the line is every admin's, the
        // page with the checks behind it is the settings role's.
        Route::get('/system', [SystemController::class, 'index'])
            ->middleware(EnsureAdminMay::class.':settings,view')
            ->name('system.index');
        Route::get('/system/puls', [SystemController::class, 'pulse'])->name('system.puls');

        // Einstellungen › Zubehörpreise: the Komplettrad options (docs/specs/komplettrad.md §6.2),
        // two tabs under one rail item. Every write is authorised by a Policy on the server; the
        // page only hides what a role may not do (R-11). The old addresses lead to the new ones.
        Route::redirect('/zubehoerpreise', '/admin/zubehoerpreise/wuchtgewichte')->name('zubehoerpreise');
        // A bookmark keeps what it carried: the rest of its path and its query.
        foreach (['/wuchtgewichte' => '/admin/zubehoerpreise/wuchtgewichte', '/rdks-preise' => '/admin/zubehoerpreise/rdks'] as $old => $new) {
            Route::get($old.'/{rest?}', static function (Request $request, ?string $rest = null) use ($new): RedirectResponse {
                $query = $request->getQueryString();

                return redirect()->to($new.($rest !== null ? '/'.$rest : '').($query !== null ? '?'.$query : ''), 301);
            })->where('rest', '.*');
        }

        Route::prefix('/zubehoerpreise')->group(function (): void {
            Route::get('/wuchtgewichte', [WuchtgewichteController::class, 'index'])
                ->middleware(EnsureAdminMay::class.':catalogue,view')
                ->name('wuchtgewichte.index');
            Route::post('/wuchtgewichte', [WuchtgewichteController::class, 'store'])->name('wuchtgewichte.store');
            Route::patch('/wuchtgewichte/{colour}', [WuchtgewichteController::class, 'update'])->name('wuchtgewichte.update');
            Route::delete('/wuchtgewichte/{colour}', [WuchtgewichteController::class, 'destroy'])->name('wuchtgewichte.destroy');

            // Shop-wide money, edited beside the rows it applies to (§13). `/montage` and `/standard`
            // are fixed segments, so neither can ever be read as a `{colour}` or a `{price}`.
            Route::put('/wuchtgewichte/montage', [WuchtgewichteController::class, 'updateMountingFee'])->name('wuchtgewichte.montage');

            Route::get('/rdks', [RdksPreiseController::class, 'index'])
                ->middleware(EnsureAdminMay::class.':catalogue,view')
                ->name('rdks.index');
            Route::post('/rdks', [RdksPreiseController::class, 'store'])->name('rdks.store');
            Route::put('/rdks/standard', [RdksPreiseController::class, 'updateDefaultPrice'])->name('rdks.standard');
            Route::patch('/rdks/{price}', [RdksPreiseController::class, 'update'])->name('rdks.update');
            Route::delete('/rdks/{price}', [RdksPreiseController::class, 'destroy'])->name('rdks.destroy');
        });

        // Inhalte › Seiten (docs/admin/inhalte-build-plan.md): a draft visitors never see, the
        // publish check, and every published state kept. Each write is refused by its Policy.
        Route::get('/seiten', [SeitenController::class, 'index'])
            ->middleware(EnsureAdminMay::class.':content,view')
            ->name('seiten.index');
        Route::post('/seiten', [SeitenController::class, 'store'])->name('seiten.store');
        Route::get('/seiten/{page}', [SeitenController::class, 'show'])
            ->whereNumber('page')
            ->middleware(EnsureAdminMay::class.':content,view')
            ->name('seiten.show');
        Route::put('/seiten/{page}/entwurf', [SeitenController::class, 'saveDraft'])->whereNumber('page')->name('seiten.entwurf');
        Route::delete('/seiten/{page}/entwurf', [SeitenController::class, 'discardDraft'])->whereNumber('page')->name('seiten.entwurf.verwerfen');
        Route::post('/seiten/{page}/veroeffentlichen', [SeitenController::class, 'publish'])->whereNumber('page')->name('seiten.veroeffentlichen');
        Route::post('/seiten/{page}/zurueckziehen', [SeitenController::class, 'withdraw'])->whereNumber('page')->name('seiten.zurueckziehen');
        Route::post('/seiten/{page}/versionen/{revision}', [SeitenController::class, 'restore'])
            ->whereNumber(['page', 'revision'])
            ->name('seiten.wiederherstellen');
        Route::get('/seiten/{page}/versionen/{revision}/vergleich', [SeitenController::class, 'compare'])
            ->whereNumber(['page', 'revision'])
            ->middleware(EnsureAdminMay::class.':content,view')
            ->name('seiten.vergleich');

        // Inhalte › FAQ: no draft — a visible entry changes on the shop when saved, so changing
        // one takes the right to publish (FaqEntryPolicy). `/reihenfolge` is a fixed segment.
        Route::get('/faq', [FragenController::class, 'index'])
            ->middleware(EnsureAdminMay::class.':content,view')
            ->name('faq.index');
        Route::post('/faq', [FragenController::class, 'store'])->name('faq.store');
        Route::put('/faq/reihenfolge', [FragenController::class, 'reorder'])->name('faq.reihenfolge');
        Route::put('/faq/{entry}', [FragenController::class, 'update'])->whereNumber('entry')->name('faq.update');
        Route::delete('/faq/{entry}', [FragenController::class, 'destroy'])->whereNumber('entry')->name('faq.destroy');
        Route::patch('/faq/{entry}/sichtbarkeit', [FragenController::class, 'visibility'])->whereNumber('entry')->name('faq.sichtbarkeit');

        // Inhalte › Navigation: the shop's menus, live on every page, so every change also needs
        // the right to publish (NavItemPolicy). `/reihenfolge` is a fixed segment.
        Route::get('/navigation', [NavigationController::class, 'index'])
            ->middleware(EnsureAdminMay::class.':content,view')
            ->name('navigation.index');
        Route::post('/navigation', [NavigationController::class, 'store'])->name('navigation.store');
        Route::put('/navigation/reihenfolge', [NavigationController::class, 'reorder'])->name('navigation.reihenfolge');
        Route::put('/navigation/{item}', [NavigationController::class, 'update'])->whereNumber('item')->name('navigation.update');
        Route::delete('/navigation/{item}', [NavigationController::class, 'destroy'])->whereNumber('item')->name('navigation.destroy');
        Route::patch('/navigation/{item}/sichtbarkeit', [NavigationController::class, 'visibility'])->whereNumber('item')->name('navigation.sichtbarkeit');
    });
});
