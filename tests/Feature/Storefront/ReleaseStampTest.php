<?php

declare(strict_types=1);

use App\Support\ReleaseStamp;
use Illuminate\Support\Facades\File;
use Inertia\Testing\AssertableInertia;

/*
 * The staging footer names the build it serves („Testumgebung · Stand 56fc810c vom …“), read from the file the Deploy
 * workflow writes into every release. The live shop never shows it; a checkout without the file shows nothing.
 */
beforeEach(function (): void {
    ReleaseStamp::forget();
});

afterEach(function (): void {
    File::delete(public_path(ReleaseStamp::FILE));
    ReleaseStamp::forget();
    app()->detectEnvironment(fn (): string => 'testing');
});

function writeReleaseStamp(string $json): void
{
    File::ensureDirectoryExists(dirname(public_path(ReleaseStamp::FILE)));
    File::put(public_path(ReleaseStamp::FILE), $json);
}

it('names the build on staging, in Berlin time', function (): void {
    writeReleaseStamp('{"commit":"56fc810c","built":"2026-10-01T14:25:00Z"}');
    app()->detectEnvironment(fn (): string => 'staging');

    expect(ReleaseStamp::label())->toBe("Testumgebung · Stand 56fc810c vom 01.10.2026, 16:25\u{00A0}Uhr");

    $this->get('/faq')->assertInertia(fn (AssertableInertia $page) => $page->where('release', "Testumgebung · Stand 56fc810c vom 01.10.2026, 16:25\u{00A0}Uhr"));
});

// The operator's brief of 28.10.2026 (§10.3): the release number and its date, in the shop's foot and the admin's, so
// it is always known which build the client tested. Production never shows it.
it('names the release by its number where the stamp carries one, in the shop and in the admin', function (): void {
    // The accounts first: their seeder writes them only where tests run.
    $this->seed(Database\Seeders\AccessSeeder::class);
    $admin = App\Models\AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
    writeReleaseStamp('{"release":21,"commit":"56fc810c","built":"2026-10-28T13:05:00Z"}');
    app()->detectEnvironment(fn (): string => 'staging');
    $line = "Testumgebung · Release 21 vom 28.10.2026, 14:05\u{00A0}Uhr · Stand 56fc810c";

    expect(ReleaseStamp::label())->toBe($line);
    $this->get('/faq')->assertInertia(fn (AssertableInertia $page) => $page->where('release', $line));
    $this->actingAs($admin, 'admin')->get('/admin')->assertInertia(fn (AssertableInertia $page) => $page->where('release', $line));

    // A number that is no release number is not printed.
    writeReleaseStamp('{"release":"<b>21</b>","commit":"56fc810c","built":"2026-10-28T13:05:00Z"}');
    ReleaseStamp::forget();
    expect(ReleaseStamp::label())->toBe("Testumgebung · Stand 56fc810c vom 28.10.2026, 14:05\u{00A0}Uhr");

    app()->detectEnvironment(fn (): string => 'production');
    expect(ReleaseStamp::label())->toBeNull();
});

it('says nothing in the live shop, or where no release file was written', function (): void {
    writeReleaseStamp('{"commit":"56fc810c","built":"2026-10-01T14:25:00Z"}');
    app()->detectEnvironment(fn (): string => 'production');

    expect(ReleaseStamp::label())->toBeNull();

    File::delete(public_path(ReleaseStamp::FILE));
    ReleaseStamp::forget();
    app()->detectEnvironment(fn (): string => 'staging');

    expect(ReleaseStamp::label())->toBeNull();
});

it('reads only a well-formed stamp, and never prints more than a short commit', function (): void {
    $path = tempnam(sys_get_temp_dir(), 'stamp');

    file_put_contents($path, '{"commit":"56FC810C9ABCDEF","built":"2026-10-01T14:25:00Z"}');
    expect(ReleaseStamp::fromFile($path)['commit'] ?? null)->toBe('56fc810c');

    file_put_contents($path, '{"commit":"<script>","built":"2026-10-01T14:25:00Z"}');
    expect(ReleaseStamp::fromFile($path))->toBeNull();

    file_put_contents($path, 'not json');
    expect(ReleaseStamp::fromFile($path))->toBeNull();

    unlink($path);
});
