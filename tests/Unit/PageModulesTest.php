<?php

declare(strict_types=1);

use App\Support\PageModules;

/*
 * The page's script chunks fetched beside the entry (D-279): its own chunk first, then every chunk it imports, once each —
 * never an entry, which `@vite` has already preloaded.
 */

/** @return array<string, array{file?: string, css?: list<string>, imports?: list<string>, isEntry?: bool}> */
function pageModulesManifest(): array
{
    return [
        'resources/js/app.ts' => ['file' => 'assets/app-A1.js', 'isEntry' => true, 'imports' => ['_vue-B2.js']],
        '_vue-B2.js' => ['file' => 'assets/vue-B2.js'],
        '_AdminLayout-C3.js' => ['file' => 'assets/AdminLayout-C3.js', 'imports' => ['resources/js/app.ts', '_vue-B2.js', '_Icon-D4.js'], 'css' => ['assets/AdminLayout-C3.css']],
        '_Icon-D4.js' => ['file' => 'assets/Icon-D4.js', 'imports' => ['_AdminLayout-C3.js']],
        'resources/js/Pages/Admin/Protokoll/Index.vue' => ['file' => 'assets/Index-E5.js', 'imports' => ['resources/js/app.ts', '_AdminLayout-C3.js', '_vue-B2.js'], 'css' => ['assets/Index-E5.css']],
    ];
}

it('names the page’s chunk first, then each chunk it imports once — never the entry, nor what the entry imports', function (): void {
    expect(PageModules::filesFrom(pageModulesManifest(), 'Admin/Protokoll/Index'))->toBe([
        'assets/Index-E5.js',
        'assets/AdminLayout-C3.js',
        'assets/Icon-D4.js',
    ]);
});

it('preloads on every page on the desk and on the admin’s on the phone — never on the shop’s on the phone', function (): void {
    expect(PageModules::wanted('Admin/Uebersicht/Index', phone: false))->toBeTrue()
        ->and(PageModules::wanted('Admin/Uebersicht/Index', phone: true))->toBeTrue()
        ->and(PageModules::wanted('Startseite/Desktop', phone: false))->toBeTrue()
        ->and(PageModules::wanted('Felgen/Index', phone: false))->toBeTrue()
        ->and(PageModules::wanted('Startseite/Mobile', phone: true))->toBeFalse()
        ->and(PageModules::wanted('Felgen/Index', phone: true))->toBeFalse()
        ->and(PageModules::for('Startseite/Mobile', phone: true))->toBe([]);
});

it('names nothing for a page the build does not hold', function (): void {
    expect(PageModules::filesFrom(pageModulesManifest(), 'Admin/Gibt/Es/Nicht'))->toBe([])
        ->and(PageModules::filesFrom([], 'Admin/Protokoll/Index'))->toBe([]);
});
