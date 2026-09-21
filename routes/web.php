<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminLoginController;
use App\Http\Controllers\Admin\BenachrichtigungenController;
use App\Http\Controllers\Admin\GutachtenController;
use App\Http\Controllers\Admin\RollenController;
use App\Http\Controllers\Api\FitmentCountController;
use App\Http\Controllers\Api\FitmentNotifyController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\VehicleTreeController;
use App\Http\Controllers\DesignController;
use App\Http\Controllers\Storefront\BenachrichtigungController;
use App\Http\Controllers\Storefront\BestellungController;
use App\Http\Controllers\Storefront\CheckController;
use App\Http\Controllers\Storefront\FahrzeugController;
use App\Http\Controllers\Storefront\FaqController;
use App\Http\Controllers\Storefront\FelgenController;
use App\Http\Controllers\Storefront\FelgenrechnerController;
use App\Http\Controllers\Storefront\KasseController;
use App\Http\Controllers\Storefront\KontaktController;
use App\Http\Controllers\Storefront\RatgeberController;
use App\Http\Controllers\Storefront\RechtlichesController;
use App\Http\Controllers\Storefront\StartseiteController;
use App\Http\Controllers\Storefront\VergleichController;
use App\Http\Controllers\Storefront\WarenkorbController;
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

/*
 * Choosing the vehicle. A POST because it writes state, and rate-limited because the key-number
 * lookup is the one unauthenticated endpoint that reads the vehicle table by arbitrary input.
 */
Route::middleware('throttle:60,1')->group(function (): void {
    Route::post('/fahrzeug', [FahrzeugController::class, 'store'])->name('fahrzeug.store');
    Route::post('/fahrzeug/schluesselnummern', [FahrzeugController::class, 'resolve'])
        ->name('fahrzeug.resolve');
});

Route::delete('/fahrzeug', [FahrzeugController::class, 'destroy'])->name('fahrzeug.destroy');

Route::get('/warenkorb', [WarenkorbController::class, 'index'])->name('warenkorb.index');
Route::post('/warenkorb', [WarenkorbController::class, 'store'])->name('warenkorb.store');
Route::patch('/warenkorb/{line}', [WarenkorbController::class, 'update'])->name('warenkorb.update');
Route::delete('/warenkorb/{line}', [WarenkorbController::class, 'destroy'])->name('warenkorb.destroy');
Route::get('/kasse', [KasseController::class, 'index'])->name('kasse.index');
Route::get('/bestellung/{order}', [BestellungController::class, 'show'])->name('bestellung.show');

/*
 * The JSON endpoints the shell calls. They sit in the web group on purpose: the session and the
 * vehicle cookie are what most of them answer about, and a GET carries no CSRF token to check.
 */
Route::prefix('api/v1')->name('api.')->middleware('throttle:60,1')->group(function (): void {
    Route::get('/search', SearchController::class)->name('search');
    Route::get('/vehicles/models', [VehicleTreeController::class, 'models'])->name('vehicles.models');
    Route::get('/vehicles/variants', [VehicleTreeController::class, 'variants'])->name('vehicles.variants');
    Route::get('/fitment/count', FitmentCountController::class)->name('fitment.count');
    // Writes a row and sends a mail: a tighter limit than the read endpoints.
    Route::post('/fitment/notify', FitmentNotifyController::class)->middleware('throttle:10,1')->name('fitment.notify');
});

// The two links a subscription mail carries (F2); tokens, no session.
Route::get('/benachrichtigung/bestaetigen/{token}', [BenachrichtigungController::class, 'bestaetigen'])
    ->name('benachrichtigung.bestaetigen');
Route::get('/benachrichtigung/abmelden/{token}', [BenachrichtigungController::class, 'abmelden'])
    ->name('benachrichtigung.abmelden');

Route::get('/faq', FaqController::class)->name('faq');
Route::get('/kontakt', [KontaktController::class, 'index'])->name('kontakt');
Route::get('/rechtliches/{slug?}', RechtlichesController::class)->name('rechtliches');

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

Route::prefix('admin')->name('admin.')->group(function (): void {
    Route::get('/anmelden', [AdminLoginController::class, 'create'])
        ->middleware('guest:admin')
        ->name('anmelden');

    Route::middleware('auth:admin')->group(function (): void {
        Route::get('/', AdminDashboardController::class)->name('dashboard');
        Route::get('/gutachten', [GutachtenController::class, 'index'])->name('gutachten.index');
        Route::get('/rollen', [RollenController::class, 'index'])->name('rollen.index');
        Route::get('/benachrichtigungen', [BenachrichtigungenController::class, 'index'])->name('benachrichtigungen.index');
    });
});
