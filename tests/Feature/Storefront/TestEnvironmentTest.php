<?php

declare(strict_types=1);

use App\Console\Commands\StorageHeaders;
use App\Support\Operator;
use App\Support\PreviewRibbon;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia;

/*
 * The test environment (staging), D-088: nothing stands between a visitor and the shop — no password, no entry page;
 * the admin has its own sign-in and that is the only one. It stays out of search instead (X-Robots-Tag on every
 * response, the files under /storage included; robots.txt saying „no"), names its operator in the Impressum and says
 * the shop is not in operation, and carries the slim ribbon until it is put away. The live shop has none of it.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
});

afterEach(function (): void {
    app()['env'] = 'testing';
});

function onStaging(): void
{
    app()['env'] = 'staging';
}

it('asks for no credentials anywhere: the shop opens, the admin shows its own sign-in', function (string $path): void {
    onStaging();

    $response = $this->get($path);

    expect($response->status())->not->toBe(401)
        ->and($response->headers->has('WWW-Authenticate'))->toBeFalse()
        ->and($response->headers->get('X-Robots-Tag'))->toBe('noindex, nofollow');
})->with(['/', '/felgen', '/rechtliches/impressum', '/admin/anmelden']);

it('sends /admin to the normal sign-in, and nowhere else', function (): void {
    onStaging();

    $this->get('/admin')->assertRedirect('/admin/anmelden');
    $this->get('/vorschau')->assertNotFound();
});

it('keeps the test environment out of search, and lets every crawler into the live shop', function (): void {
    onStaging();
    $this->get('/robots.txt')->assertOk()->assertSee("Disallow: /\n", false);

    app()['env'] = 'production';
    $live = $this->get('/robots.txt')->assertOk();

    expect($live->getContent())->toBe("User-agent: *\nDisallow:\n")
        ->and($live->headers->has('X-Robots-Tag'))->toBeFalse();
});

it('carries the ribbon on staging only, until it is put away', function (): void {
    $this->get('/rechtliches/impressum')->assertInertia(fn (AssertableInertia $page) => $page->where('previewRibbon', false));

    onStaging();
    $this->get('/rechtliches/impressum')->assertInertia(fn (AssertableInertia $page) => $page->where('previewRibbon', true));
    $this->withUnencryptedCookie(PreviewRibbon::COOKIE, 'aus')->get('/rechtliches/impressum')
        ->assertInertia(fn (AssertableInertia $page) => $page->where('previewRibbon', false));
});

it('names the operator of the test environment in the Impressum, and says the shop is not in operation', function (): void {
    config(['rimify.operator' => ['name' => 'SkillLeo SMC Pvt Ltd', 'street' => null, 'zip' => null, 'city' => null, 'country' => null, 'email' => null, 'phone' => null]]);
    onStaging();

    $this->get('/rechtliches/impressum')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('provider.notice', Operator::NOT_IN_OPERATION)
        ->where('provider.rows.0', ['label' => 'Betreiber der Testumgebung', 'value' => 'SkillLeo SMC Pvt Ltd'])
        // What is not given is said to be missing, never guessed.
        ->where('provider.rows.1', ['label' => 'Anschrift', 'value' => null])
        ->where('provider.complete', false));

    // On the client's domain the seller takes its place by itself.
    app()['env'] = 'production';
    $this->get('/rechtliches/impressum')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('provider.rows.0.label', 'Anbieter')
        ->missing('provider.notice'));
});

it('sends the smoke test without credentials of any kind', function (): void {
    $this->seed(ReferenceDataSeeder::class);
    Http::fake(['*' => Http::response('', 404)]);

    $this->artisan('rimify:smoke', ['--url' => 'https://test.example.test'])->run();

    Http::assertSent(fn ($request): bool => true);
    Http::assertNotSent(fn ($request): bool => $request->hasHeader('Authorization'));
});

describe('the files under /storage', function (): void {
    beforeEach(function (): void {
        $this->storage = sys_get_temp_dir().DIRECTORY_SEPARATOR.'rimify-headers-'.bin2hex(random_bytes(4));
        File::ensureDirectoryExists($this->storage.'/app/public');
        $this->app->useStoragePath($this->storage);
    });

    afterEach(fn () => File::deleteDirectory($this->storage));

    it('carry noindex outside the live shop, and ask for nothing', function (): void {
        onStaging();

        $this->artisan('rimify:storage-headers')->assertSuccessful();

        expect((string) file_get_contents(StorageHeaders::htaccessPath()))
            ->toStartWith(StorageHeaders::MARKER)
            ->toContain('Header set X-Robots-Tag "noindex, nofollow"')
            ->not->toContain('Auth');
    });

    it('take away what the old preview password left behind', function (): void {
        onStaging();
        file_put_contents(StorageHeaders::htaccessPath(), StorageHeaders::OLD_GATE_MARKER." — written by `php artisan rimify:preview-gate`\nAuthType Basic\nRequire valid-user\n");
        file_put_contents(StorageHeaders::oldPasswordPath(), "rimify:\$2y\$12\$hash\n");

        $this->artisan('rimify:storage-headers')->assertSuccessful();

        expect(is_file(StorageHeaders::oldPasswordPath()))->toBeFalse()
            ->and((string) file_get_contents(StorageHeaders::htaccessPath()))->not->toContain('Auth');
    });

    it('are open to search engines in the live shop', function (): void {
        onStaging();
        $this->artisan('rimify:storage-headers')->assertSuccessful();
        app()['env'] = 'production';

        $this->artisan('rimify:storage-headers')->assertSuccessful();

        expect(is_file(StorageHeaders::htaccessPath()))->toBeFalse();
    });

    it('never touch an .htaccess RIMIFY did not write', function (): void {
        file_put_contents(StorageHeaders::htaccessPath(), "Options -Indexes\n");

        $this->artisan('rimify:storage-headers')->assertFailed();

        expect(file_get_contents(StorageHeaders::htaccessPath()))->toBe("Options -Indexes\n");
    });
});
