<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\Fitment;
use App\Models\OrderLine;
use App\Models\Setting;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Demo\DemoDashboard;
use App\Services\Demo\DemoPlaceholders;
use App\Services\Demo\DemoTables;
use App\Services\Reset\ResetLevel;
use App\Services\Reset\ResetMaintenance;
use App\Services\Reset\ResetRefused;
use App\Services\Reset\ResetTables;
use App\Services\Reset\ScratchDatabase;
use App\Services\Reset\SqlSnapshot;
use App\Services\Reset\TestReset;
use Carbon\CarbonImmutable;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ApprovalSeeder;
use Database\Seeders\ContentSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Database\Connection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\ParallelTesting;
use Illuminate\Support\Facades\Storage;

/*
 * Testumgebung zurücksetzen (TestReset) does real DDL — tables dropped and made again — so it runs here against a
 * database of its own per test process (ScratchDatabase), filled from one fixture: the reference tables, the team, the
 * delivered content, the example catalogue and the demo set. The suite's own database, and the transaction every other
 * test runs in, are never touched.
 */

/** The fixture this process builds once and every test here loads: a delivered shop with its demo data. */
function rsFixture(): string
{
    $token = ParallelTesting::token() ?: '0';

    return storage_path("framework/testing/reset-fixture-{$token}.sql.gz");
}

function rsTables(Connection $db): array
{
    return array_map(
        static fn (object $r): string => (string) $r->t,
        $db->select("SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME"),
    );
}

function rsScratch(): ScratchDatabase
{
    // Built once per run of this process, never taken over from an earlier run: the schema may have moved on since.
    static $built = false;

    // One database per test process, under the prefix the development account may make and use on both local engines
    // (rimify_wf…, as the browser suite's); CI's account may make any.
    $suite = DB::connection('mysql');
    $scratch = ScratchDatabase::create('rimify_wf_reset_'.(ParallelTesting::token() ?: '0'), 'reset_scratch', 'mysql');
    $fixture = rsFixture();

    if ($built && is_file($fixture) && SqlSnapshot::summary($fixture) !== null) {
        $tables = array_values(array_filter((array) SqlSnapshot::meta($fixture)['tables'], 'is_string'));
        (new SqlSnapshot($scratch->db()))->replace($tables, $fixture, $fixture);
        DB::setDefaultConnection('reset_scratch');

        return $scratch;
    }

    // The suite's schema, through the snapshot itself: structure of every table, and the migrations it was made with.
    $tables = rsTables($suite);
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

    (new SqlSnapshot($scratch->db()))->write($fixture, rsTables($scratch->db()));
    $built = true;

    return $scratch;
}

/** A real shop beside the demo set: a brand, a wheel with a photo, a car, a Gutachten with a row, an order with its frozen proof. */
function rsRealShop(): array
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

    return ['brand' => $brand, 'model' => $model->id, 'line' => $line->id, 'order' => $line->order_id, 'document' => $document->id];
}

/** @param  list<string>  $tables */
function rsCounts(array $tables): array
{
    $counts = [];

    foreach ($tables as $table) {
        $counts[$table] = DB::table($table)->count();
    }

    return $counts;
}

function rsTriggers(): int
{
    return (int) DB::selectOne('SELECT COUNT(*) AS n FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE()')->n;
}

function rsAdmin(): AdminUser
{
    return AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
}

beforeEach(function (): void {
    $this->resetDir = storage_path('framework/testing/resets-'.(ParallelTesting::token() ?: '0').'-'.bin2hex(random_bytes(4)));
    config(['rimify.reset.dir' => $this->resetDir]);

    Storage::fake('media_products');
    Storage::fake('docs_public');
    Storage::fake('public');

    $this->maintenance = new class extends ResetMaintenance
    {
        public int $ons = 0;

        public bool $down = false;

        public function on(): void
        {
            $this->ons++;
            $this->down = true;
        }

        public function off(): void
        {
            $this->down = false;
        }

        public function active(): bool
        {
            return $this->down;
        }
    };
    $this->app->instance(ResetMaintenance::class, $this->maintenance);

    $this->scratch = rsScratch();

    // The example catalogue's drawings: only what a test puts there, so the files a reset moves can be counted.
    File::deleteDirectory(DemoPlaceholders::dir());
});

afterEach(function (): void {
    DB::setDefaultConnection('mysql');
    $this->scratch->drop();
    File::deleteDirectory($this->resetDir);
});

it('empties the shop and keeps the team, the roles, the settings, the content and the Protokoll', function (): void {
    $real = rsRealShop();
    Setting::set('shop_note', 'bleibt');
    $before = rsCounts(['admin_users', 'roles', 'role_permissions', 'pages', 'faq_entries', 'nav_items', 'load_index_table']);
    $realUsers = DB::table('admin_users')->where('is_demo', false)->count();
    $realEntries = DB::table('audit_logs')->where('is_demo', false)->count();
    $triggers = rsTriggers();
    $brandCounter = (int) DB::table('brands')->max('id');

    Storage::disk('media_products')->put('wheels/r1/r1-1080.avif', 'bild');
    Storage::disk('docs_public')->put('test123.pdf', '%PDF-1.4');
    Storage::disk('public')->put('brands/rimify-1.svg', '<svg/>');

    expect(DemoTables::total())->toBeGreaterThan(0);

    $result = app(TestReset::class)->reset(ResetLevel::Shop, rsAdmin());

    foreach (ResetTables::SHOP as $table) {
        expect(DB::table($table)->count())->toBe(0, "{$table} is not empty");
    }

    expect(DB::table('admin_users')->count())->toBe($realUsers)
        ->and(DB::table('admin_users')->where('is_demo', true)->count())->toBe(0)
        ->and(rsCounts(['roles', 'role_permissions', 'pages', 'faq_entries', 'nav_items', 'load_index_table']))
        ->toBe(array_diff_key($before, ['admin_users' => 0]))
        ->and(Setting::get('shop_note'))->toBe('bleibt')
        ->and(Setting::get('hero_product_id'))->toBe($real['model'])
        ->and(DB::table('audit_logs')->where('is_demo', true)->count())->toBe(0)
        // Every real entry stays, and the reset's own is one more.
        ->and(DB::table('audit_logs')->where('is_demo', false)->count())->toBe($realEntries + 1)
        ->and(AuditLog::query()->where('description', 'system.reset')->sole()->properties['level'])->toBe('shop')
        ->and(rsTriggers())->toBe($triggers)
        ->and(DemoTables::total())->toBe(0)
        ->and(DemoTables::removed())->toBeTrue()
        ->and(TestReset::shopEmptied())->toBeTrue()
        ->and($this->maintenance->ons)->toBe(1)
        ->and($this->maintenance->down)->toBeFalse();

    // What went, counted the way the page said it: the real wheel among the example ones, the files.
    $labels = array_column($result['counts'], 'count', 'label');
    expect($labels)->toHaveKeys(['Felgen', 'Gutachten', 'Bestellungen', 'Nachricht'])
        ->and($result['files'])->toMatchArray(['images' => 2, 'pdfs' => 1, 'failed' => 0])
        ->and(Storage::disk('media_products')->allFiles())->toBe([])
        ->and(Storage::disk('docs_public')->allFiles())->toBe([])
        ->and(Storage::disk('public')->allFiles('brands'))->toBe([]);

    // No id is ever given twice: a new brand comes after the old ones, so the Protokoll's old entries keep pointing nowhere.
    $next = DB::table('brands')->insertGetId(['name' => 'Neu', 'slug' => 'neu', 'created_at' => now(), 'updated_at' => now()]);
    expect($next)->toBeGreaterThan($brandCounter);
});

it('undoes the reset exactly: the shop, its frozen proof, the demo rows and the files come back', function (): void {
    $real = rsRealShop();
    Storage::disk('media_products')->put('wheels/r1/r1-1080.avif', 'bild');
    Storage::disk('docs_public')->put('test123.pdf', '%PDF-1.4');

    $shop = rsCounts([...ResetTables::SHOP, 'admin_users']);
    $proof = (array) DB::table('order_line_fitments')->where('order_line_id', $real['line'])->first();
    $demoEntries = DB::table('audit_logs')->where('is_demo', true)->count();

    $reset = app(TestReset::class);
    $reset->reset(ResetLevel::Shop, rsAdmin());

    expect($reset->last())->toMatchArray(['level' => 'shop', 'undoable' => true, 'undone' => false]);

    $result = $reset->undo(rsAdmin());

    expect(rsCounts([...ResetTables::SHOP, 'admin_users']))->toBe($shop)
        ->and((array) DB::table('order_line_fitments')->where('order_line_id', $real['line'])->first())->toBe($proof)
        ->and(DB::table('audit_logs')->where('is_demo', true)->count())->toBe($demoEntries)
        ->and(DB::table('wheel_models')->where('id', $real['model'])->value('name'))->toBe('R1')
        ->and($result['files'])->toBe(['restored' => 2, 'failed' => 0])
        ->and(Storage::disk('media_products')->get('wheels/r1/r1-1080.avif'))->toBe('bild')
        ->and(Storage::disk('docs_public')->exists('test123.pdf'))->toBeTrue()
        ->and(TestReset::shopEmptied())->toBeFalse()
        ->and(DemoTables::removed())->toBeFalse()
        ->and($reset->last())->toMatchArray(['undone' => true, 'undoable' => false])
        // The Protokoll lost nothing on the way: the reset's entry and the undo's are both there.
        ->and(AuditLog::query()->whereIn('description', ['system.reset', 'system.reset_undone'])->count())->toBe(2);

    // Once is enough.
    expect(fn () => $reset->undo(rsAdmin()))->toThrow(ResetRefused::class, 'schon rückgängig');
});

it('puts pages, FAQ and menus back to the delivered state on „Alles“, and an undo brings the edited ones back', function (): void {
    $pages = DB::table('pages')->count();
    $faq = DB::table('faq_entries')->count();
    DB::table('pages')->where('slug', 'impressum')->update(['title' => 'Mein Impressum']);
    DB::table('faq_entries')->insert(['group_key' => 'BESTELLUNG & VERSAND', 'question_de' => 'Eigene Frage?', 'answer_de' => 'Ja.', 'sort_order' => 99, 'published' => true, 'created_at' => now(), 'updated_at' => now()]);

    $reset = app(TestReset::class);
    $reset->reset(ResetLevel::All, rsAdmin());

    expect(DB::table('pages')->count())->toBe($pages)
        ->and(DB::table('faq_entries')->count())->toBe($faq)
        ->and(DB::table('pages')->where('slug', 'impressum')->value('title'))->not->toBe('Mein Impressum')
        ->and(DB::table('faq_entries')->where('question_de', 'Eigene Frage?')->exists())->toBeFalse();

    // The baseline is the delivered content: the content seeder finds nothing to add to it.
    test()->seed(ContentSeeder::class);
    expect(DB::table('pages')->count())->toBe($pages)
        ->and(DB::table('faq_entries')->count())->toBe($faq);

    $reset->undo(rsAdmin());

    expect(DB::table('pages')->where('slug', 'impressum')->value('title'))->toBe('Mein Impressum')
        ->and(DB::table('faq_entries')->where('question_de', 'Eigene Frage?')->exists())->toBeTrue();
});

it('takes only the demo rows on „Demodaten“, keeps everything real, and undoes that too', function (): void {
    $real = rsRealShop();
    // The real order line names a real wheel: nothing holds the example catalogue.
    $demo = DemoTables::total();
    $realOrders = DB::table('orders')->where('is_demo', false)->count();

    $reset = app(TestReset::class);
    $result = $reset->reset(ResetLevel::Demo, rsAdmin());

    expect(DemoTables::total())->toBe(0)
        ->and(DB::table('orders')->where('is_demo', false)->count())->toBe($realOrders)
        ->and(DB::table('wheel_models')->where('id', $real['model'])->exists())->toBeTrue()
        ->and(DB::table('order_line_fitments')->where('order_line_id', $real['line'])->exists())->toBeTrue()
        ->and(AuditLog::query()->where('description', 'demo.purged')->exists())->toBeTrue()
        ->and($result['counts'])->not->toBe([]);

    $reset->undo(rsAdmin());

    expect(DemoTables::total())->toBe($demo)
        ->and(DB::table('wheel_models')->where('id', $real['model'])->exists())->toBeTrue();
});

it('refuses „Demodaten“ as a whole while a real order line names an example wheel, and says so in words', function (): void {
    OrderLine::factory()->create(['wheel_config_id' => DB::table('wheel_configs')->orderBy('id')->value('id'), 'is_demo' => false]);
    $demo = DemoTables::total();

    $reset = app(TestReset::class);

    expect($reset->blocked(ResetLevel::Demo))->toContain('nicht als Demodaten angelegt')
        ->and($reset->blocked(ResetLevel::Demo))->not->toContain('artisan')
        ->and(fn () => $reset->reset(ResetLevel::Demo, rsAdmin()))->toThrow(ResetRefused::class, 'Shopdaten');

    expect(DemoTables::total())->toBe($demo)
        ->and(AuditLog::query()->where('description', 'system.reset')->exists())->toBeFalse();
});

it('comes back unchanged when the reset fails half-way, and records that it failed', function (): void {
    rsRealShop();
    $shop = rsCounts([...ResetTables::SHOP, ...ResetTables::CONTENT]);
    $triggers = rsTriggers();

    // A baseline whose rows cannot be loaded: the brands' INSERT names a column that does not exist.
    $broken = $this->resetDir.'/broken-baseline.sql';
    File::ensureDirectoryExists($this->resetDir);
    File::copy(TestReset::baseline(), $broken);
    File::append($broken, "--@rows brands\nINSERT INTO `brands` (`no_such_column`) VALUES (1);\n");
    config(['rimify.reset.baseline' => $broken]);

    expect(fn () => app(TestReset::class)->reset(ResetLevel::Shop, rsAdmin()))
        ->toThrow(ResetRefused::class, 'wieder genau wie vorher');

    expect(rsCounts([...ResetTables::SHOP, ...ResetTables::CONTENT]))->toBe($shop)
        ->and(rsTriggers())->toBe($triggers)
        ->and(AuditLog::query()->where('description', 'system.reset_failed')->exists())->toBeTrue()
        ->and(TestReset::shopEmptied())->toBeFalse()
        ->and($this->maintenance->down)->toBeFalse();
});

it('puts an interrupted reset back from its safety copy on the next look', function (): void {
    rsRealShop();
    $shop = rsCounts(ResetTables::SHOP);

    // A reset that died after its copy and half its work: the marker is still there, the lock is free.
    $id = '20261004-120000-shop';
    (new SqlSnapshot(DB::connection()))->write($this->resetDir.'/'.$id.'/snapshot.sql.gz', rsTables(DB::connection()));
    File::put($this->resetDir.'/running.json', json_encode(['op' => 'reset', 'id' => $id, 'level' => 'shop', 'tables' => ResetTables::SHOP]));
    DB::statement('SET FOREIGN_KEY_CHECKS = 0');
    DB::statement('TRUNCATE TABLE orders');
    DB::statement('TRUNCATE TABLE wheel_models');
    DB::statement('SET FOREIGN_KEY_CHECKS = 1');

    expect(app(TestReset::class)->recover())->toBe('aus der Sicherung zurückgeholt')
        ->and(rsCounts(ResetTables::SHOP))->toBe($shop)
        ->and(is_file($this->resetDir.'/running.json'))->toBeFalse()
        ->and(AuditLog::query()->where('description', 'system.reset_recovered')->exists())->toBeTrue();
});

it('refuses outright where it does not belong, and on a database it cannot vouch for', function (): void {
    $reset = app(TestReset::class);
    $triggers = rsTriggers();

    // A table nobody said should stay or go.
    DB::statement('CREATE TABLE extra_things (id INT PRIMARY KEY)');
    expect(fn () => $reset->reset(ResetLevel::Shop, rsAdmin()))->toThrow(ResetRefused::class, 'extra_things');
    DB::statement('DROP TABLE extra_things');

    // A trigger lost: nothing is reset on top of the loss.
    DB::unprepared('DROP TRIGGER trg_olf_no_delete');
    expect(fn () => $reset->reset(ResetLevel::Shop, rsAdmin()))->toThrow(ResetRefused::class, 'Trigger');
    expect(rsTriggers())->toBe($triggers - 1);

    // Real money: never a test environment.
    DB::table('payment_events')->insert(['provider' => 'stripe', 'event_id' => 'evt_live_1', 'type' => 'payment_intent.succeeded', 'livemode' => true, 'payload' => '{}', 'received_at' => now(), 'created_at' => now()]);
    expect(fn () => $reset->reset(ResetLevel::Shop, rsAdmin()))->toThrow(ResetRefused::class, 'echte Zahlungen');

    // Production: never, whatever the database holds.
    app()->detectEnvironment(static fn (): string => 'production');
    expect(TestReset::available())->toBeFalse()
        ->and(fn () => $reset->reset(ResetLevel::Shop, rsAdmin()))->toThrow(ResetRefused::class, 'nie im Live-Shop');
    app()->detectEnvironment(static fn (): string => 'testing');
});

it('keeps a reset undoable for seven days, then lets its copy go', function (): void {
    $reset = app(TestReset::class);
    $reset->reset(ResetLevel::Shop, rsAdmin());
    $id = $reset->last()['id'];

    $this->travel(TestReset::KEEP_DAYS)->days();
    $this->travel(1)->minutes();

    expect($reset->last())->toMatchArray(['undoable' => false])
        ->and($reset->prune())->toBe(1)
        ->and(is_dir($this->resetDir.'/'.$id))->toBeFalse()
        ->and(fn () => $reset->undo(rsAdmin()))->toThrow(ResetRefused::class);
});

it('steps back through resets in order, so a second reset never strands the first', function (): void {
    rsRealShop();
    $before = rsCounts([...ResetTables::SHOP, 'admin_users']);

    $reset = app(TestReset::class);
    $reset->reset(ResetLevel::Shop, rsAdmin());
    $first = $reset->last()['id'];
    // Nothing left to take: a second reset still keeps the first one's way back.
    $reset->reset(ResetLevel::Shop, rsAdmin());

    expect($reset->last()['id'])->not->toBe($first);

    $reset->undo(rsAdmin());

    expect($reset->last())->toMatchArray(['id' => $first, 'undoable' => true, 'undone' => false])
        ->and(TestReset::shopEmptied())->toBeTrue()
        ->and(DB::table('wheel_models')->count())->toBe(0);

    $reset->undo(rsAdmin());

    expect(rsCounts([...ResetTables::SHOP, 'admin_users']))->toBe($before)
        ->and($reset->last())->toMatchArray(['id' => $first, 'undone' => true])
        ->and(TestReset::shopEmptied())->toBeFalse();
});

it('refuses to undo once the database has been migrated since', function (): void {
    $reset = app(TestReset::class);
    $reset->reset(ResetLevel::Shop, rsAdmin());
    DB::table('migrations')->insert(['migration' => '2099_01_01_000000_later', 'batch' => 99]);

    expect(fn () => $reset->undo(rsAdmin()))->toThrow(ResetRefused::class);

    DB::table('migrations')->where('migration', '2099_01_01_000000_later')->delete();
});
