<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Models\OrderLine;
use App\Models\Setting;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Demo\DemoDashboard;
use App\Services\Reset\ScratchDatabase;
use App\Services\Reset\SqlSnapshot;
use App\Services\Reset\TestEnvironment;
use Carbon\CarbonImmutable;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ApprovalSeeder;
use Database\Seeders\ContentSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Database\Connection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\ParallelTesting;

/**
 * Testumgebung zurücksetzen does real DDL — tables dropped and made again — so its tests run against a database of
 * their own per test process (ScratchDatabase), filled from one fixture: the reference tables, the team, the delivered
 * content, the example catalogue and the demo set, and the row in which the database names itself a test database.
 * The suite's own database, and the transaction every other test runs in, are never touched.
 */
final class ResetFixture
{
    private static bool $built = false;

    /** The fixture this process builds once and every reset test loads: a delivered shop with its demo data. */
    public static function path(): string
    {
        return storage_path('framework/testing/reset-fixture-'.(ParallelTesting::token() ?: '0').'.sql.gz');
    }

    /** The scratch database, loaded from the fixture, as the default connection. */
    public static function scratch(): ScratchDatabase
    {
        // One database per test process, under the prefix the development account may make and use on both local engines
        // (rimify_wf…, as the browser suite's); CI's account may make any.
        $suite = DB::connection('mysql');
        $scratch = ScratchDatabase::create('rimify_wf_reset_'.(ParallelTesting::token() ?: '0'), 'reset_scratch', 'mysql');
        $fixture = self::path();

        // Built once per run of this process, never taken over from an earlier run: the schema may have moved on since.
        if (self::$built && is_file($fixture) && SqlSnapshot::summary($fixture) !== null) {
            $tables = array_values(array_filter((array) SqlSnapshot::meta($fixture)['tables'], 'is_string'));
            (new SqlSnapshot($scratch->db()))->replace($tables, $fixture, $fixture);
            DB::setDefaultConnection('reset_scratch');

            return $scratch;
        }

        // The suite's schema, through the snapshot itself: structure of every table, and the migrations it was made with.
        $tables = self::tables($suite);
        $schema = storage_path('framework/testing/reset-schema-'.(ParallelTesting::token() ?: '0').'.sql.gz');
        (new SqlSnapshot($suite))->write($schema, $tables, [], array_values(array_diff($tables, ['migrations'])));
        (new SqlSnapshot($scratch->db()))->replace($tables, $schema, $schema);
        File::delete($schema);

        DB::setDefaultConnection('reset_scratch');
        config(['demo.enabled' => true]);

        foreach ([ReferenceDataSeeder::class, AccessSeeder::class, ContentSeeder::class, ApprovalSeeder::class] as $seeder) {
            test()->seed($seeder);
        }

        app(DemoDashboard::class)->seed(CarbonImmutable::parse('2026-09-27', 'Europe/Berlin'), 0.25);

        // As the migration writes it on a test server (record_database_environment): structure alone did not carry it.
        DB::table('settings')->insertOrIgnore(['key' => TestEnvironment::MARKER, 'value' => json_encode('testing'), 'created_at' => now(), 'updated_at' => now()]);

        (new SqlSnapshot($scratch->db()))->write($fixture, self::tables($scratch->db()));
        self::$built = true;

        return $scratch;
    }

    /** @return list<string> */
    public static function tables(?Connection $db = null): array
    {
        return array_map(
            static fn (object $r): string => (string) $r->t,
            ($db ?? DB::connection())->select("SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME"),
        );
    }

    /**
     * A real shop beside the demo set: a brand, a wheel with a photo, a car, a Gutachten with a row, an order with its
     * frozen proof, a message.
     *
     * @return array{brand: int, model: int, line: int, order: int, document: int}
     */
    public static function realShop(): array
    {
        $now = now();
        $brand = DB::table('brands')->insertGetId(['name' => 'Rimify', 'slug' => 'rimify', 'created_at' => $now, 'updated_at' => $now]);
        $model = WheelModel::factory()->draft()->create(['brand_id' => $brand, 'is_demo' => false, 'name' => 'R1']);
        $finish = WheelFinish::factory()->create(['wheel_model_id' => $model->id]);
        $config = WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id]);
        $document = ApprovalDocument::factory()->create(['issuer' => 'Prüfstelle (Test)', 'report_number' => 'TEST123']);
        $vehicle = Vehicle::factory()->create();
        $fitment = Fitment::factory()->create(['approval_document_id' => $document->id, 'wheel_config_id' => $config->id, 'vehicle_id' => $vehicle->id]);
        $line = OrderLine::factory()->create(['wheel_config_id' => $config->id, 'is_demo' => false]);

        DB::table('order_line_fitments')->insert([
            'order_line_id' => $line->id,
            'vehicle_id' => $vehicle->id,
            'wheel_config_id' => $config->id,
            'fitment_id' => $fitment->id,
            'approval_document_id' => $document->id,
            'document_revision' => 1,
            'verdict' => json_encode(['status' => 'PERMITTED']),
            'verdict_status' => 'PERMITTED',
            'requires_entry' => false,
            'engine_version' => 'test',
            'computed_at' => $now,
        ]);

        DB::table('contact_messages')->insert(['name' => 'Kunde', 'email' => 'kunde@example.com', 'subject' => 'Frage', 'message' => 'Passt die Felge?', 'created_at' => $now, 'updated_at' => $now]);
        Setting::set('hero_product_id', $model->id);

        return ['brand' => $brand, 'model' => (int) $model->id, 'line' => (int) $line->id, 'order' => (int) $line->order_id, 'document' => (int) $document->id];
    }

    /**
     * @param  list<string>  $tables
     * @return array<string, int>
     */
    public static function counts(array $tables): array
    {
        $counts = [];

        foreach ($tables as $table) {
            $counts[$table] = DB::table($table)->count();
        }

        return $counts;
    }

    /** Every table's checksum: the database as a whole, for a test that proves nothing was written. */
    public static function checksums(): array
    {
        $out = [];

        foreach (DB::select('CHECKSUM TABLE '.implode(', ', array_map(SqlSnapshot::id(...), self::tables()))) as $row) {
            $out[(string) $row->Table] = (string) $row->Checksum;
        }

        return $out;
    }

    public static function triggers(): int
    {
        return (int) DB::selectOne('SELECT COUNT(*) AS n FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE()')->n;
    }

    public static function admin(): AdminUser
    {
        return AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
    }

    /**
     * The newest folder's manifest for an operation (`reset` or `undo`): what a run counted, moved and how it ended.
     *
     * @return array<string, mixed>
     */
    public static function manifest(string $dir, string $op = 'reset'): array
    {
        $found = [];

        foreach (File::directories($dir) as $folder) {
            $manifest = json_decode((string) @file_get_contents($folder.'/manifest.json'), true);

            if (is_array($manifest) && ($manifest['op'] ?? null) === $op) {
                $found[basename($folder)] = $manifest;
            }
        }

        ksort($found);

        return $found === [] ? [] : end($found);
    }
}
