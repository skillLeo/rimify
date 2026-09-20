<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminLoginController;
use App\Http\Controllers\Admin\GutachtenController;
use App\Http\Controllers\Admin\RollenController;
use App\Http\Controllers\DesignLinkController;
use App\Http\Controllers\Dev\FixtureController;
use App\Http\Controllers\Storefront\BestellungController;
use App\Http\Controllers\Storefront\CheckController;
use App\Http\Controllers\Storefront\FahrzeugController;
use App\Http\Controllers\Storefront\FaqController;
use App\Http\Controllers\Storefront\FelgenController;
use App\Http\Controllers\Storefront\KasseController;
use App\Http\Controllers\Storefront\KontaktController;
use App\Http\Controllers\Storefront\RechtlichesController;
use App\Http\Controllers\Storefront\StartseiteController;
use App\Http\Controllers\Storefront\WarenkorbController;
use Illuminate\Support\Facades\Route;

/*
 * Paths are German because the audience is German and a URL is read (CONTRIBUTING.md §6). Route NAMES
 * are the stable identifier — the header state machine, the nav table and every test match on the
 * name, so a path can be changed without touching anything else.
 */

// ── Storefront ───────────────────────────────────────────────────────────────────────────────

/*
 * The design's own link targets, registered FIRST.
 *
 * Its runtime draws RELATIVE hrefs (`produkt.html`, `felgen.html`) because in the prototype every
 * page is a sibling in one folder. Our routes have depth, so from /felgen the browser asks for
 * /felgen/produkt.html. Registered after the storefront routes that is swallowed by /felgen/{model}
 * with the model set to "produkt.html", which 404s - which is exactly what made every card button
 * appear to do nothing. Nothing real ends in .html, so matching it first cannot shadow a page.
 */
Route::get('/{path}.html', DesignLinkController::class)
    ->where('path', '.*')
    ->name('design.link');

Route::get('/', [StartseiteController::class, 'index'])->name('startseite');

Route::get('/felgen-suchen', [FelgenController::class, 'suchen'])->name('felgen.suchen');
Route::get('/felgen', [FelgenController::class, 'index'])->name('felgen.index');
Route::get('/felgen/{model}', [FelgenController::class, 'show'])->name('felgen.show');

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

Route::get('/faq', FaqController::class)->name('faq');
Route::get('/kontakt', [KontaktController::class, 'index'])->name('kontakt');
Route::get('/rechtliches/{slug?}', RechtlichesController::class)->name('rechtliches');

// ── Visual fidelity fixtures ─────────────────────────────────────────────────────────────────
//
// Used by the visual fidelity suite (tests/visual). Puts a page into the exact state its
// design-reference counterpart was captured in, so a visual case measures the screen rather than
// the route that leads to it.
//
// The guard is the whole point: this sets vehicle state from an unauthenticated GET, which is
// correct for a fixture and would be a hole in production. Registering it inside the condition
// rather than adding middleware means the route does not exist at all when APP_ENV is anything
// else — `php artisan route:list` on production shows nothing to find.
if (app()->environment('local', 'testing')) {
    Route::get('/__fixture/{case}', FixtureController::class)
        ->where('case', '[A-Za-z0-9@_-]+')
        ->name('fixture');
}

// ── Admin ────────────────────────────────────────────────────────────────────────────────────
//
// Guests are redirected here by bootstrap/app.php, so the path is fixed by that setting too.

Route::prefix('admin')->name('admin.')->group(function (): void {
    Route::get('/anmelden', [AdminLoginController::class, 'create'])
        ->middleware('guest:admin')
        ->name('anmelden');

    Route::middleware('auth:admin')->group(function (): void {
        Route::get('/', AdminDashboardController::class)->name('dashboard');
        Route::get('/gutachten', [GutachtenController::class, 'index'])->name('gutachten.index');
        Route::get('/rollen', [RollenController::class, 'index'])->name('rollen.index');
    });
});
