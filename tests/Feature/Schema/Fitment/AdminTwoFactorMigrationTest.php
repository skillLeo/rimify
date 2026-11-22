<?php

declare(strict_types=1);

use App\Services\Reset\SchemaFingerprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\Support\ResetFixture;

/*
 * D-514: the recovery codes and the last code's step beside the secret that was there from the start. Down drops the two
 * columns and leaves every account and its secret; the round trip leaves the schema as it was. In a database of its own.
 */

function adminTwoFactorMigration(): Migration
{
    return require database_path('migrations/fitment/2026_11_22_000100_admin_two_factor_recovery.php');
}

beforeEach(function (): void {
    $this->scratch = ResetFixture::scratch();
});

afterEach(function (): void {
    DB::setDefaultConnection('mysql');
    $this->scratch->drop();
});

it('goes down and up again: the schema as before, the accounts and their secrets untouched', function (): void {
    $id = DB::table('admin_users')->insertGetId(['name' => 'Prüfkonto', 'email' => 'pruef@rimify.invalid', 'password' => 'x', 'status' => 'active', 'totp_secret' => 'verschluesselt', 'totp_confirmed_at' => now(), 'totp_recovery_codes' => '[]', 'totp_last_step' => 42, 'created_at' => now(), 'updated_at' => now()]);
    $before = SchemaFingerprint::of(DB::connection());
    $migration = adminTwoFactorMigration();

    $migration->down();

    expect(Schema::hasColumn('admin_users', 'totp_recovery_codes'))->toBeFalse()
        ->and(Schema::hasColumn('admin_users', 'totp_last_step'))->toBeFalse()
        ->and(DB::table('admin_users')->where('id', $id)->value('totp_secret'))->toBe('verschluesselt');

    $migration->up();

    expect(SchemaFingerprint::of(DB::connection()))->toBe($before)
        ->and(DB::table('admin_users')->where('id', $id)->value('totp_secret'))->toBe('verschluesselt');
});
