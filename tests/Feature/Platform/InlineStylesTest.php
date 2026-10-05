<?php

declare(strict_types=1);

use App\Support\InlineStyles;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

/*
 * The operator's brief of 05.10.2026, §5: a storefront document carries its own stylesheets, so the phone's first paint
 * waits for the HTML alone (InlineStyles). Against a build of its own, in a public folder of its own.
 */

beforeEach(function (): void {
    $this->original = public_path();
    $this->public = storage_path('framework/testing/inline-styles-'.Str::random(10));
    File::ensureDirectoryExists($this->public.'/build/assets');
    app()->usePublicPath($this->public);

    // Vite's shape: the CSS entry, the JS entry importing it, a page with a shared chunk, an admin page.
    File::put($this->public.'/build/manifest.json', (string) json_encode([
        'resources/css/app.css' => ['file' => 'assets/app.css', 'src' => 'resources/css/app.css', 'isEntry' => true],
        'resources/js/app.ts' => ['file' => 'assets/app.js', 'isEntry' => true, 'css' => ['assets/app.css'], 'imports' => ['_vendor.js']],
        '_vendor.js' => ['file' => 'assets/vendor.js'],
        '_Icon.js' => ['file' => 'assets/Icon.js', 'css' => ['assets/Icon.css']],
        'resources/js/Pages/Startseite/Mobile.vue' => ['file' => 'assets/Mobile.js', 'imports' => ['_Icon.js', 'resources/js/app.ts'], 'css' => ['assets/Mobile.css']],
        'resources/js/Pages/Admin/Dashboard.vue' => ['file' => 'assets/Dashboard.js', 'imports' => ['_Icon.js'], 'css' => ['assets/Dashboard.css']],
    ]));

    foreach (['app' => ':root{--a:1}', 'Icon' => '.icon{width:1em}', 'Mobile' => '.home{color:red}', 'Dashboard' => '.adm{color:blue}'] as $name => $css) {
        File::put($this->public."/build/assets/{$name}.css", $css);
    }
});

afterEach(function (): void {
    app()->usePublicPath($this->original);
    File::deleteDirectory($this->public);
});

it('writes the entry\'s stylesheet first, then the page\'s in the order Vite loads them, each once', function (): void {
    $sheets = InlineStyles::for('Startseite/Mobile');

    expect(array_column($sheets, 'href'))->toBe([
        asset('build/assets/app.css'),
        asset('build/assets/Icon.css'),
        asset('build/assets/Mobile.css'),
    ])
        ->and(array_column($sheets, 'css'))->toBe([':root{--a:1}', '.icon{width:1em}', '.home{color:red}'])
        // What the document holds, `@vite` and the page links write disabled, and preload nothing for.
        ->and(InlineStyles::has(asset('build/assets/Mobile.css')))->toBeTrue()
        ->and(InlineStyles::has(asset('build/assets/Dashboard.css')))->toBeFalse();
});

it('leaves the admin its links, cached from one session to the next', function (): void {
    InlineStyles::for('Startseite/Mobile');

    expect(InlineStyles::for('Admin/Dashboard'))->toBe([])
        // Nothing of the page before stays marked for the next document.
        ->and(InlineStyles::has(asset('build/assets/app.css')))->toBeFalse();
});

it('keeps every link when a sheet is missing or could close the element it is written into', function (): void {
    File::put($this->public.'/build/assets/Icon.css', '.icon::after{content:"</style>"}');
    expect(InlineStyles::for('Startseite/Mobile'))->toBe([]);

    File::put($this->public.'/build/assets/Icon.css', '.icon{width:1em}');
    File::delete($this->public.'/build/assets/Mobile.css');
    expect(InlineStyles::for('Startseite/Mobile'))->toBe([]);
});

it('keeps the links for a page whose stylesheets have outgrown the document', function (): void {
    File::put($this->public.'/build/assets/app.css', ':root{--a:1}'.str_repeat('/* padding */', 20_000));

    expect(InlineStyles::for('Startseite/Mobile'))->toBe([])
        ->and(InlineStyles::has(asset('build/assets/app.css')))->toBeFalse();
});

it('inlines nothing while the dev server runs, or for a page the build does not know', function (): void {
    expect(InlineStyles::for('Gibt/EsNicht'))->toBe([]);

    File::put($this->public.'/hot', 'http://localhost:5173');
    expect(InlineStyles::for('Startseite/Mobile'))->toBe([]);
});
