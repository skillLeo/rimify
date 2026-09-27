<?php

declare(strict_types=1);

use App\Http\Middleware\EnsureSudo;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\StorageSetting;
use App\Services\Storage\StorageConfig;
use App\Services\Storage\StorageSettings;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;
use Tests\Support\FakeBucket;

/*
 * Einstellungen › Medien und Speicher: the Super-Admin alone, behind the password once more; the keys
 * write-only (their last four characters are all that ever comes back); every save tested before it
 * replaces what works; one Protokoll entry per save, with last fours only. AWS is FakeBucket.
 */

const SPEICHER_KEY = 'FAKEKEYFORTESTS0AB12';
const SPEICHER_SECRET = 'fake/secret/for/tests/only/0000X9Y8';
const SPEICHER_URL = '/admin/einstellungen/speicher';

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    config(['media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    app(StorageSettings::class)->flush();
    $this->bucket = FakeBucket::install();
});

function speicherAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** The session of someone who confirmed their password just now. */
function speicherSudo(): array
{
    return [EnsureSudo::SESSION_KEY => now()->getTimestamp()];
}

/** @return array<string, mixed> */
function speicherForm(array $over = []): array
{
    return [
        'provider' => 's3', 'region' => 'eu-north-1', 'bucket' => 'rimify-media-test', 'endpoint' => '', 'path_style' => false,
        'public_url' => '', 'access_key' => SPEICHER_KEY, 'secret' => SPEICHER_SECRET, ...$over,
    ];
}

/** @return array<string, mixed> */
function speicherProps(): array
{
    $props = [];

    test()->actingAs(speicherAdmin(), 'admin')->withSession(speicherSudo())->get(SPEICHER_URL)
        ->assertOk()
        ->assertInertia(function (AssertableInertia $page) use (&$props): void {
            $props = $page->toArray()['props'];
        });

    return $props;
}

describe('who may', function (): void {
    it('refuses every role but the Super-Admin — even one given the settings rights', function (string $role): void {
        DB::table('role_permissions')->updateOrInsert(
            ['role_id' => DB::table('roles')->where('name', $role)->value('id'), 'module' => 'settings', 'action' => 'view'],
            ['allowed' => true],
        );

        $this->actingAs(speicherAdmin($role), 'admin')->withSession(speicherSudo())->get(SPEICHER_URL)->assertForbidden();
        $this->actingAs(speicherAdmin($role), 'admin')->withSession(speicherSudo())->put(SPEICHER_URL, speicherForm())->assertForbidden();

        expect(StorageSetting::query()->count())->toBe(0)
            ->and($this->bucket->sent)->toBe([]);
    })->with(['catalogue-manager', 'accountant', 'content-editor']);

    it('asks for the password again before the page, then leads back to it', function (): void {
        $admin = speicherAdmin();
        $admin->forceFill(['password' => 'richtiges-Passwort-7'])->save();

        $this->actingAs($admin, 'admin')->get(SPEICHER_URL)->assertRedirect('/admin/bestaetigen');
        $this->actingAs($admin, 'admin')->post('/admin/bestaetigen', ['password' => 'falsch'])->assertSessionHasErrors('password');
        $this->actingAs($admin, 'admin')->post('/admin/bestaetigen', ['password' => 'richtiges-Passwort-7'])->assertRedirect(url(SPEICHER_URL));
        $this->actingAs($admin, 'admin')->get(SPEICHER_URL)->assertOk();
    });

    it('asks again after fifteen minutes, and a save sent then is not saved', function (): void {
        $this->actingAs(speicherAdmin(), 'admin')
            ->withSession([EnsureSudo::SESSION_KEY => now()->subMinutes(16)->getTimestamp()])
            ->put(SPEICHER_URL, speicherForm())
            ->assertRedirect('/admin/bestaetigen');

        expect(StorageSetting::query()->count())->toBe(0);
    });
});

describe('saving', function (): void {
    it('tests the set, puts it in force and shows the keys as their last four only', function (): void {
        $this->actingAs(speicherAdmin(), 'admin')->withSession(speicherSudo())->from(SPEICHER_URL)
            ->put(SPEICHER_URL, speicherForm())
            ->assertRedirect(SPEICHER_URL)
            ->assertSessionHas('toast', 'Gespeichert und geprüft. Die Dateien liegen ab jetzt in diesem Bucket.');

        $props = speicherProps();

        expect(StorageSetting::query()->where('state', StorageSetting::ACTIVE)->value('bucket'))->toBe('rimify-media-test')
            ->and(app(StorageSettings::class)->current()->source)->toBe(StorageConfig::DATABASE)
            ->and($props['keyMasked'])->toBe('••••••••••••AB12')
            ->and($props['secretMasked'])->toBe('••••••••••••X9Y8')
            ->and($props['source'])->toBe('database')
            ->and(json_encode($props))->not->toContain(SPEICHER_SECRET)->not->toContain(SPEICHER_KEY)
            // The save's round trip; the next page's health line then asks the new bucket once itself.
            ->and(array_slice($this->bucket->names(), 0, 3))->toBe(['PutObject', 'GetObject', 'DeleteObject']);
    });

    it('keeps the stored secret when the field is left empty', function (): void {
        $this->actingAs(speicherAdmin(), 'admin')->withSession(speicherSudo())->put(SPEICHER_URL, speicherForm());
        $this->actingAs(speicherAdmin(), 'admin')->withSession(speicherSudo())->put(SPEICHER_URL, speicherForm(['access_key' => '', 'secret' => '', 'public_url' => 'https://cdn.rimify.test']));

        $row = StorageSetting::query()->where('state', StorageSetting::ACTIVE)->firstOrFail();

        expect($row->secret)->toBe(SPEICHER_SECRET)
            ->and($row->access_key)->toBe(SPEICHER_KEY)
            ->and($row->public_url)->toBe('https://cdn.rimify.test');
    });

    it('keeps the working set in force when the new one fails its test', function (): void {
        $this->actingAs(speicherAdmin(), 'admin')->withSession(speicherSudo())->put(SPEICHER_URL, speicherForm());
        $this->bucket->failWith('NoSuchBucket');

        $this->actingAs(speicherAdmin(), 'admin')->withSession(speicherSudo())->from(SPEICHER_URL)
            ->put(SPEICHER_URL, speicherForm(['bucket' => 'falscher-name', 'secret' => '']))
            ->assertSessionHas('toast', 'Gespeichert, aber die Verbindung klappt nicht. Es gelten weiter die bisherigen Einstellungen.');

        $props = speicherProps();

        expect(StorageSetting::query()->where('state', StorageSetting::ACTIVE)->value('bucket'))->toBe('rimify-media-test')
            ->and(StorageSetting::query()->where('state', StorageSetting::PENDING)->value('bucket'))->toBe('falscher-name')
            ->and(app(StorageSettings::class)->current()->bucket)->toBe('rimify-media-test')
            ->and($props['pending'])->toBeTrue()
            ->and($props['form']['bucket'])->toBe('falscher-name')
            ->and($props['test']['ok'])->toBeFalse()
            ->and($props['test']['steps'][0]['detail'])->toStartWith('NoSuchBucket');
    });

    it('writes one Protokoll entry per save, with the last four characters and never a key', function (): void {
        $this->actingAs(speicherAdmin(), 'admin')->withSession(speicherSudo())->put(SPEICHER_URL, speicherForm());

        $entry = AuditLog::query()->where('description', 'storage.settings_updated')->sole();
        $stored = json_encode($entry->getAttributes());

        expect($entry->properties['signing_key_last4'])->toEqual(['old' => null, 'new' => 'X9Y8'])
            ->and($entry->properties['key_last4'])->toEqual(['old' => null, 'new' => 'AB12'])
            ->and($entry->properties['active'])->toBeTrue()
            ->and($stored)->not->toContain(SPEICHER_SECRET)->not->toContain(SPEICHER_KEY);
    });

    it('never flashes the keys back into the form after a refused save', function (): void {
        $this->actingAs(speicherAdmin(), 'admin')->withSession(speicherSudo())->from(SPEICHER_URL)
            ->put(SPEICHER_URL, speicherForm(['bucket' => 'Nicht Gültig']))
            ->assertSessionHasErrors('bucket');

        $old = session()->getOldInput();

        expect($old)->not->toHaveKey('secret')
            ->and($old)->not->toHaveKey('access_key')
            ->and(StorageSetting::query()->count())->toBe(0);
    });
});

describe('the bucket list and the test button', function (): void {
    it('fills the select with the names AWS lists for the key', function (): void {
        $this->bucket->buckets = ['rimify-media-eu', 'rimify-backup'];

        $this->actingAs(speicherAdmin(), 'admin')->withSession(speicherSudo())->from(SPEICHER_URL)
            ->post(SPEICHER_URL.'/buckets', speicherForm())
            ->assertSessionHas('storage_buckets', ['names' => ['rimify-backup', 'rimify-media-eu'], 'error' => null]);
    });

    it('says why when the key may not list buckets', function (): void {
        $this->bucket->failWith('AccessDenied');

        $this->actingAs(speicherAdmin(), 'admin')->withSession(speicherSudo())->from(SPEICHER_URL)
            ->post(SPEICHER_URL.'/buckets', speicherForm())
            ->assertSessionHas('storage_buckets', fn (array $result): bool => $result['names'] === [] && str_starts_with((string) $result['error'], 'AccessDenied'));
    });

    it('tests the values on the form and saves nothing', function (): void {
        $this->actingAs(speicherAdmin(), 'admin')->withSession(speicherSudo())->from(SPEICHER_URL)
            ->post(SPEICHER_URL.'/test', speicherForm())
            ->assertSessionHas('toast', 'Verbindung steht.');

        expect(StorageSetting::query()->count())->toBe(0)
            ->and(AuditLog::query()->where('description', 'storage.settings_updated')->count())->toBe(0);
    });
});
