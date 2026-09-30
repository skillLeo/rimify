<?php

declare(strict_types=1);

use App\Console\Commands\PreviewGateFiles;
use App\Support\PreviewGate;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia;

/*
 * The preview gate: a publicly reachable German shop front owes an Impressum, and the preview's legal texts are
 * placeholders — so it is shown to the client behind one shared password, kept out of search, and says what it is.
 * The password is asked before anything else (pages, admin, the maintenance page), and the files under /storage are
 * behind the same one through a basic-auth .htaccess the deploy writes. Stripe's webhook, the health check and
 * robots.txt stay open.
 */

const GATE_USER = 'vorschau';
const GATE_PASSWORD = 'probe-passwort-123';

function gateOn(): void
{
    config(['rimify.preview.user' => GATE_USER, 'rimify.preview.password' => GATE_PASSWORD]);
}

function basic(string $user, string $password): array
{
    return ['Authorization' => 'Basic '.base64_encode("{$user}:{$password}")];
}

afterEach(function (): void {
    app()['env'] = 'testing';
});

describe('off — the live shop, a developer’s machine', function (): void {
    it('asks for nothing, but keeps every copy but the live shop out of search', function (): void {
        expect(PreviewGate::enabled())->toBeFalse();

        $this->get('/rechtliches/impressum')->assertOk()->assertHeader('X-Robots-Tag', 'noindex, nofollow');
        $this->get('/robots.txt')->assertOk()->assertSee("Disallow: /\n", false);
    });

    it('lets every crawler into the live shop, as the static robots.txt did, and adds no noindex there', function (): void {
        app()['env'] = 'production';

        $response = $this->get('/robots.txt')->assertOk();

        expect($response->getContent())->toBe("User-agent: *\nDisallow:\n")
            ->and($response->headers->has('X-Robots-Tag'))->toBeFalse();
    });
});

describe('on — the preview', function (): void {
    beforeEach(fn () => gateOn());

    it('asks for the password before any page or the admin, and never says what is behind it', function (string $path): void {
        $response = $this->get($path)->assertUnauthorized();

        expect($response->headers->get('WWW-Authenticate'))->toBe('Basic realm="RIMIFY Vorschau", charset="UTF-8"')
            ->and($response->headers->get('X-Robots-Tag'))->toBe('noindex, nofollow')
            ->and($response->getContent())->toBe("Diese Vorschau von RIMIFY ist durch ein Passwort geschützt.\n");
    })->with(['/', '/felgen', '/admin', '/admin/anmelden', '/rechtliches/impressum', '/gibt-es-nicht']);

    it('refuses a wrong password or a wrong user, and lets the right pair in', function (): void {
        $this->get('/rechtliches/impressum', basic(GATE_USER, 'falsch'))->assertUnauthorized();
        $this->get('/rechtliches/impressum', basic('jemand', GATE_PASSWORD))->assertUnauthorized();
        $this->get('/rechtliches/impressum', basic(GATE_USER, GATE_PASSWORD))->assertOk()->assertHeader('X-Robots-Tag', 'noindex, nofollow');
        $this->get('/admin/anmelden', basic(GATE_USER, GATE_PASSWORD))->assertOk();
    });

    it('keeps Stripe’s signed webhook, the health check and robots.txt open', function (): void {
        // Stripe cannot type a password: the webhook is reached, and refuses on its own signature check.
        expect($this->postJson('/webhooks/stripe', [])->status())->not->toBe(401);

        $this->get('/up')->assertOk();
        $this->get('/robots.txt')->assertOk()->assertSee("Disallow: /\n", false);
    });

    it('gives the ribbon to the first frame until it is put away', function (): void {
        $this->get('/rechtliches/impressum', basic(GATE_USER, GATE_PASSWORD))
            ->assertInertia(fn (AssertableInertia $page) => $page->where('previewRibbon', true));

        $this->withUnencryptedCookie(PreviewGate::RIBBON_COOKIE, 'aus')
            ->get('/rechtliches/impressum', basic(GATE_USER, GATE_PASSWORD))
            ->assertInertia(fn (AssertableInertia $page) => $page->where('previewRibbon', false));
    });

    it('sends the smoke test through the gate with the password on every request', function (): void {
        $this->seed(ReferenceDataSeeder::class);
        Http::fake(['*' => Http::response('', 404)]);

        $this->artisan('rimify:smoke', ['--url' => 'https://vorschau.example.test'])->run();

        Http::assertSent(fn ($request): bool => $request->hasHeader('Authorization', 'Basic '.base64_encode(GATE_USER.':'.GATE_PASSWORD)));
        Http::assertNotSent(fn ($request): bool => ! $request->hasHeader('Authorization'));
    });
});

it('shows no ribbon where there is no preview password', function (): void {
    $this->get('/rechtliches/impressum')->assertInertia(fn (AssertableInertia $page) => $page->where('previewRibbon', false));
});

describe('the files under /storage', function (): void {
    beforeEach(function (): void {
        $this->storage = sys_get_temp_dir().DIRECTORY_SEPARATOR.'rimify-gate-'.bin2hex(random_bytes(4));
        File::ensureDirectoryExists($this->storage.'/app/public');
        $this->app->useStoragePath($this->storage);
    });

    afterEach(fn () => File::deleteDirectory($this->storage));

    it('puts the same password in front of them, hashed, in a file outside the public folder', function (): void {
        gateOn();

        $this->artisan('rimify:preview-gate')->assertSuccessful();

        $htaccess = (string) file_get_contents(PreviewGateFiles::htaccessPath());
        [$user, $hash] = explode(':', trim((string) file_get_contents(PreviewGateFiles::passwordPath())), 2);

        expect($htaccess)->toStartWith(PreviewGateFiles::MARKER)
            ->toContain('AuthName "RIMIFY Vorschau"')
            ->toContain('AuthUserFile '.PreviewGateFiles::passwordPath())
            ->toContain('Require valid-user')
            ->and($user)->toBe(GATE_USER)
            ->and(password_verify(GATE_PASSWORD, $hash))->toBeTrue()
            ->and($hash)->not->toContain(GATE_PASSWORD)
            ->and(str_starts_with(PreviewGateFiles::passwordPath(), storage_path('app/public')))->toBeFalse();
    });

    it('takes its files away where there is no preview password', function (): void {
        gateOn();
        $this->artisan('rimify:preview-gate')->assertSuccessful();
        config(['rimify.preview.user' => null, 'rimify.preview.password' => null]);

        $this->artisan('rimify:preview-gate')->assertSuccessful();

        expect(is_file(PreviewGateFiles::htaccessPath()))->toBeFalse()
            ->and(is_file(PreviewGateFiles::passwordPath()))->toBeFalse();
    });

    it('never touches an .htaccess it did not write', function (): void {
        file_put_contents(PreviewGateFiles::htaccessPath(), "Options -Indexes\n");
        gateOn();

        $this->artisan('rimify:preview-gate')->assertFailed();

        expect(file_get_contents(PreviewGateFiles::htaccessPath()))->toBe("Options -Indexes\n");
    });
});
