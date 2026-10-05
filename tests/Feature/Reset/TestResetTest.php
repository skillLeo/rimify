<?php

declare(strict_types=1);

use App\Models\AuditLog;
use App\Models\OrderLine;
use App\Models\Setting;
use App\Services\Demo\DemoPlaceholders;
use App\Services\Demo\DemoTables;
use App\Services\Reset\ResetLevel;
use App\Services\Reset\ResetMaintenance;
use App\Services\Reset\ResetTables;
use App\Services\Reset\SqlSnapshot;
use App\Services\Reset\TestEnvironment;
use App\Services\Reset\TestReset;
use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\ParallelTesting;
use Illuminate\Support\Facades\Storage;
use Tests\Support\FakeResetMaintenance;
use Tests\Support\ResetFixture;

/*
 * Testumgebung zurücksetzen (TestReset), driven the one way a test may drive it (CLAUDE.md R-04.1): through
 * `rimify:reset`, as an operator runs it, with the server's yes set for this test alone — against a database of its
 * own (ResetFixture). The guards that refuse it — production, the flag, the live database, any other caller, a lost
 * trigger, a full disk — are ResetGuardsTest's.
 */

beforeEach(function (): void {
    $this->resetDir = storage_path('framework/testing/resets-'.(ParallelTesting::token() ?: '0').'-'.bin2hex(random_bytes(4)));
    config(['rimify.reset.dir' => $this->resetDir, 'rimify.reset.allowed' => true]);

    Storage::fake('media_products');
    Storage::fake('docs_public');
    Storage::fake('public');

    $this->maintenance = new FakeResetMaintenance;
    $this->app->instance(ResetMaintenance::class, $this->maintenance);

    $this->scratch = ResetFixture::scratch();

    // The example catalogue's drawings: only what a test puts there, so the files a reset moves can be counted.
    File::deleteDirectory(DemoPlaceholders::dir());
});

afterEach(function (): void {
    DB::setDefaultConnection('mysql');
    $this->scratch->drop();
    File::deleteDirectory($this->resetDir);
});

/** `rimify:reset` with these options, as an operator runs it, answered yes. */
function rsRun(array $options): void
{
    test()->artisan('rimify:reset', $options + ['--force' => true])->assertSuccessful()->run();
}

/** Every Protokoll row as it is now, for the proof that none changed. */
function rsEntries(): array
{
    return DB::table('audit_logs')->orderBy('id')->get()->map(static fn (object $row): array => (array) $row)->all();
}

it('empties the shop and keeps the team, the roles, the settings, the content and every Protokoll row as it was', function (): void {
    $real = ResetFixture::realShop();
    Setting::set('shop_note', 'bleibt');
    $kept = ['admin_users', 'model_has_roles', 'roles', 'role_permissions', 'pages', 'faq_entries', 'nav_items', 'load_index_table'];
    $before = ResetFixture::counts($kept);
    $entries = rsEntries();
    $triggers = ResetFixture::triggers();
    $brandCounter = (int) DB::table('brands')->max('id');

    Storage::disk('media_products')->put('wheels/r1/r1-1080.avif', 'bild');
    Storage::disk('docs_public')->put('test123.pdf', '%PDF-1.4');
    Storage::disk('public')->put('brands/rimify-1.svg', '<svg/>');

    rsRun(['--level' => 'shop']);

    foreach (ResetTables::SHOP as $table) {
        expect(DB::table($table)->count())->toBe(0, "{$table} is not empty");
    }

    $after = rsEntries();

    expect(ResetFixture::counts($kept))->toBe($before)
        ->and(Setting::get('shop_note'))->toBe('bleibt')
        ->and(Setting::get('hero_product_id'))->toBe($real['model'])
        // R-12.3: no Protokoll row was updated or deleted — the demo team's included — and the reset's own entry is one
        // more, written once the database was what it now is (R-04.1).
        ->and(array_slice($after, 0, count($entries)))->toBe($entries)
        ->and(count($after))->toBe(count($entries) + 1)
        ->and(end($after)['description'])->toBe('system.reset')
        ->and(AuditLog::query()->where('description', 'system.reset')->sole()->properties)->toMatchArray(['level' => 'shop', 'via' => 'rimify:reset'])
        ->and(ResetFixture::triggers())->toBe($triggers)
        ->and(DemoTables::removed())->toBeTrue()
        ->and(TestEnvironment::shopEmptied())->toBeTrue()
        ->and($this->maintenance->ons)->toBe(1)
        ->and($this->maintenance->down)->toBeFalse();

    // What went, counted the way the page said it: the real wheel among the example ones, the files.
    $manifest = ResetFixture::manifest($this->resetDir);
    $labels = array_column($manifest['counts'], 'count', 'label');
    expect($labels)->toHaveKeys(['Felgen', 'Gutachten', 'Bestellungen', 'Nachricht'])
        ->and($labels)->not->toHaveKey('Konten des Demo-Teams')
        ->and($manifest['files'])->toMatchArray(['images' => 2, 'pdfs' => 1, 'failed' => 0])
        ->and($manifest['status'])->toBe('done')
        ->and(Storage::disk('media_products')->allFiles())->toBe([])
        ->and(Storage::disk('docs_public')->allFiles())->toBe([])
        ->and(Storage::disk('public')->allFiles('brands'))->toBe([]);

    // No id is ever given twice: a new brand comes after the old ones, so the Protokoll's old entries keep pointing nowhere.
    $next = DB::table('brands')->insertGetId(['name' => 'Neu', 'slug' => 'neu', 'created_at' => now(), 'updated_at' => now()]);
    expect($next)->toBeGreaterThan($brandCounter);

    // The demo team and its Protokoll entries are what is left of the demo set: „Demodaten“ takes them, through R-12's
    // exemption for rows born demo.
    expect(app(TestReset::class)->counts(ResetLevel::Demo))->toContain(['label' => 'Konten des Demo-Teams', 'count' => 5]);

    rsRun(['--level' => 'demo']);

    expect(DemoTables::total())->toBe(0)
        ->and(DB::table('admin_users')->where('is_demo', true)->count())->toBe(0);
});

it('undoes the reset exactly: the shop, its frozen proof, the demo rows and the files come back', function (): void {
    $real = ResetFixture::realShop();
    Storage::disk('media_products')->put('wheels/r1/r1-1080.avif', 'bild');
    Storage::disk('docs_public')->put('test123.pdf', '%PDF-1.4');

    $shop = ResetFixture::counts([...ResetTables::SHOP, 'admin_users']);
    $proof = (array) DB::table('order_line_fitments')->where('order_line_id', $real['line'])->first();
    $demoEntries = DB::table('audit_logs')->where('is_demo', true)->count();

    rsRun(['--level' => 'shop']);

    expect(app(TestReset::class)->last())->toMatchArray(['level' => 'shop', 'undoable' => true, 'undone' => false]);

    rsRun(['--undo' => true]);

    expect(ResetFixture::counts([...ResetTables::SHOP, 'admin_users']))->toBe($shop)
        ->and((array) DB::table('order_line_fitments')->where('order_line_id', $real['line'])->first())->toBe($proof)
        ->and(DB::table('audit_logs')->where('is_demo', true)->count())->toBe($demoEntries)
        ->and(DB::table('wheel_models')->where('id', $real['model'])->value('name'))->toBe('R1')
        ->and(ResetFixture::manifest($this->resetDir, 'undo')['files'])->toBe(['restored' => 2, 'failed' => 0])
        ->and(Storage::disk('media_products')->get('wheels/r1/r1-1080.avif'))->toBe('bild')
        ->and(Storage::disk('docs_public')->exists('test123.pdf'))->toBeTrue()
        ->and(TestEnvironment::shopEmptied())->toBeFalse()
        ->and(DemoTables::removed())->toBeFalse()
        ->and(app(TestReset::class)->last())->toMatchArray(['undone' => true, 'undoable' => false])
        // The Protokoll lost nothing on the way: the reset's entry and the undo's are both there.
        ->and(AuditLog::query()->whereIn('description', ['system.reset', 'system.reset_undone'])->count())->toBe(2);

    // Once is enough.
    test()->artisan('rimify:reset', ['--undo' => true, '--force' => true])->expectsOutputToContain('schon rückgängig')->assertFailed()->run();
});

it('puts pages, FAQ and menus back to the delivered state on „Alles“, and an undo brings the edited ones back', function (): void {
    $pages = DB::table('pages')->count();
    $faq = DB::table('faq_entries')->count();
    DB::table('pages')->where('slug', 'impressum')->update(['title' => 'Mein Impressum']);
    DB::table('faq_entries')->insert(['group_key' => 'BESTELLUNG & VERSAND', 'question_de' => 'Eigene Frage?', 'answer_de' => 'Ja.', 'sort_order' => 99, 'published' => true, 'created_at' => now(), 'updated_at' => now()]);

    rsRun(['--level' => 'all']);

    expect(DB::table('pages')->count())->toBe($pages)
        ->and(DB::table('faq_entries')->count())->toBe($faq)
        ->and(DB::table('pages')->where('slug', 'impressum')->value('title'))->not->toBe('Mein Impressum')
        ->and(DB::table('faq_entries')->where('question_de', 'Eigene Frage?')->exists())->toBeFalse();

    // The baseline is the delivered content: the content seeder finds nothing to add to it.
    test()->seed(ContentSeeder::class);
    expect(DB::table('pages')->count())->toBe($pages)
        ->and(DB::table('faq_entries')->count())->toBe($faq);

    rsRun(['--undo' => true]);

    expect(DB::table('pages')->where('slug', 'impressum')->value('title'))->toBe('Mein Impressum')
        ->and(DB::table('faq_entries')->where('question_de', 'Eigene Frage?')->exists())->toBeTrue();
});

it('takes only the demo rows on „Demodaten“, keeps everything real, and undoes that too', function (): void {
    $real = ResetFixture::realShop();
    // The real order line names a real wheel: nothing holds the example catalogue.
    $demo = DemoTables::total();
    $realOrders = DB::table('orders')->where('is_demo', false)->count();

    rsRun(['--level' => 'demo']);

    expect(DemoTables::total())->toBe(0)
        ->and(DB::table('orders')->where('is_demo', false)->count())->toBe($realOrders)
        ->and(DB::table('wheel_models')->where('id', $real['model'])->exists())->toBeTrue()
        ->and(DB::table('order_line_fitments')->where('order_line_id', $real['line'])->exists())->toBeTrue()
        ->and(AuditLog::query()->where('description', 'demo.purged')->exists())->toBeTrue()
        ->and(ResetFixture::manifest($this->resetDir)['counts'])->not->toBe([]);

    rsRun(['--undo' => true]);

    expect(DemoTables::total())->toBe($demo)
        ->and(DB::table('wheel_models')->where('id', $real['model'])->exists())->toBeTrue();
});

it('refuses „Demodaten“ as a whole while a real order line names an example wheel, and says so in words', function (): void {
    OrderLine::factory()->create(['wheel_config_id' => DB::table('wheel_configs')->orderBy('id')->value('id'), 'is_demo' => false]);
    $demo = DemoTables::total();

    expect(app(TestReset::class)->blocked(ResetLevel::Demo))->toContain('nicht als Demodaten angelegt')
        ->and(app(TestReset::class)->blocked(ResetLevel::Demo))->not->toContain('artisan');

    test()->artisan('rimify:reset', ['--level' => 'demo', '--force' => true])->expectsOutputToContain('Shopdaten')->assertFailed()->run();

    expect(DemoTables::total())->toBe($demo)
        ->and(AuditLog::query()->where('description', 'system.reset')->exists())->toBeFalse();
});

it('comes back unchanged when the reset fails half-way, and records that it failed', function (): void {
    ResetFixture::realShop();
    $shop = ResetFixture::counts([...ResetTables::SHOP, ...ResetTables::CONTENT]);
    $triggers = ResetFixture::triggers();

    // A baseline whose rows cannot be loaded: the brands' INSERT names a column that does not exist.
    $broken = $this->resetDir.'/broken-baseline.sql';
    File::ensureDirectoryExists($this->resetDir);
    File::copy(TestEnvironment::baseline(), $broken);
    File::append($broken, "--@rows brands\nINSERT INTO `brands` (`no_such_column`) VALUES (1);\n");
    config(['rimify.reset.baseline' => $broken]);

    test()->artisan('rimify:reset', ['--level' => 'shop', '--force' => true])->expectsOutputToContain('wieder genau wie vorher')->assertFailed()->run();

    expect(ResetFixture::counts([...ResetTables::SHOP, ...ResetTables::CONTENT]))->toBe($shop)
        ->and(ResetFixture::triggers())->toBe($triggers)
        ->and(AuditLog::query()->where('description', 'system.reset_failed')->exists())->toBeTrue()
        ->and(AuditLog::query()->where('description', 'system.reset')->exists())->toBeFalse()
        ->and(TestEnvironment::shopEmptied())->toBeFalse()
        ->and($this->maintenance->down)->toBeFalse();
});

it('puts an interrupted reset back from its safety copy on the next look, and touches nothing when none was', function (): void {
    ResetFixture::realShop();
    $shop = ResetFixture::counts(ResetTables::SHOP);

    test()->artisan('rimify:reset', ['--recover' => true])->expectsOutputToContain('Nichts unterbrochen.')->assertSuccessful()->run();
    expect(is_dir($this->resetDir))->toBeFalse();

    // A reset that died after its copy and half its work: the marker is still there, the lock is free.
    $id = '20261004-120000-shop';
    (new SqlSnapshot(DB::connection()))->write($this->resetDir.'/'.$id.'/snapshot.sql.gz', ResetFixture::tables());
    File::put($this->resetDir.'/running.json', json_encode(['op' => 'reset', 'id' => $id, 'level' => 'shop', 'tables' => ResetTables::SHOP]));
    DB::statement('SET FOREIGN_KEY_CHECKS = 0');
    DB::statement('TRUNCATE TABLE orders');
    DB::statement('TRUNCATE TABLE wheel_models');
    DB::statement('SET FOREIGN_KEY_CHECKS = 1');

    test()->artisan('rimify:reset', ['--recover' => true])->expectsOutputToContain('aus der Sicherung zurückgeholt')->assertSuccessful()->run();

    expect(ResetFixture::counts(ResetTables::SHOP))->toBe($shop)
        ->and(is_file($this->resetDir.'/running.json'))->toBeFalse()
        ->and(AuditLog::query()->where('description', 'system.reset_recovered')->exists())->toBeTrue();
});

it('refuses a database it cannot vouch for: a table nobody classified, a lost trigger, real money', function (): void {
    $triggers = ResetFixture::triggers();

    // A table nobody said should stay or go.
    DB::statement('CREATE TABLE extra_things (id INT PRIMARY KEY)');
    test()->artisan('rimify:reset', ['--level' => 'shop', '--force' => true])->expectsOutputToContain('extra_things')->assertFailed()->run();
    DB::statement('DROP TABLE extra_things');

    // A trigger lost: nothing is reset on top of the loss — the check before the reset names it, and says so in the Protokoll.
    DB::unprepared('DROP TRIGGER trg_olf_no_delete');
    test()->artisan('rimify:reset', ['--level' => 'shop', '--force' => true])->expectsOutputToContain('Trigger')->assertFailed()->run();
    expect(ResetFixture::triggers())->toBe($triggers - 1)
        ->and(AuditLog::query()->where('description', 'system.reset_refused')->sole()->properties['failures'][0]['check'])->toBe('triggers');

    // Real money: never a test environment.
    DB::table('payment_events')->insert(['provider' => 'stripe', 'event_id' => 'evt_live_1', 'type' => 'payment_intent.succeeded', 'livemode' => true, 'payload' => '{}', 'received_at' => now(), 'created_at' => now()]);
    test()->artisan('rimify:reset', ['--level' => 'shop', '--force' => true])->expectsOutputToContain('echte Zahlungen')->assertFailed()->run();

    expect($this->maintenance->ons)->toBe(0);
});

it('says how long the reset can still be undone, closes the window with one sentence, and records the copy going', function (): void {
    $this->freezeTime();
    rsRun(['--level' => 'shop']);
    $reset = app(TestReset::class);
    $id = $reset->last()['id'];

    expect($reset->last())->toMatchArray(['undoable' => true, 'remaining' => "noch 7\u{00A0}Tage", 'reason' => null]);

    $this->travel(1)->minutes();
    expect($reset->last()['remaining'])->toBe("noch 6\u{00A0}Tage und 23\u{00A0}Stunden");

    $this->travel(TestEnvironment::KEEP_DAYS)->days();

    expect($reset->last())->toMatchArray([
        'undoable' => false,
        'remaining' => null,
        'reason' => 'Die 7 Tage sind vorbei: Dieses Zurücksetzen lässt sich nicht mehr rückgängig machen.',
    ]);

    test()->artisan('rimify:reset', ['--prune' => true])->expectsOutputToContain('1 alte Sicherung(en) entfernt.')->assertSuccessful()->run();

    $entry = AuditLog::query()->where('description', 'system.reset_backup_removed')->sole();

    expect(is_dir($this->resetDir.'/'.$id))->toBeFalse()
        ->and($entry->properties)->toMatchArray(['id' => $id, 'op' => 'reset', 'level' => 'shop'])
        ->and($entry->properties['bytes'])->toBeGreaterThan(0);

    test()->artisan('rimify:reset', ['--undo' => true, '--force' => true])->expectsOutputToContain('vorbei')->assertFailed()->run();
});

it('steps back through resets in order, so a second reset never strands the first', function (): void {
    ResetFixture::realShop();
    $before = ResetFixture::counts([...ResetTables::SHOP, 'admin_users']);

    rsRun(['--level' => 'shop']);
    $first = app(TestReset::class)->last()['id'];
    // Nothing left to take: a second reset still keeps the first one's way back.
    rsRun(['--level' => 'shop']);

    expect(app(TestReset::class)->last()['id'])->not->toBe($first);

    rsRun(['--undo' => true]);

    expect(app(TestReset::class)->last())->toMatchArray(['id' => $first, 'undoable' => true, 'undone' => false])
        ->and(TestEnvironment::shopEmptied())->toBeTrue()
        ->and(DB::table('wheel_models')->count())->toBe(0);

    rsRun(['--undo' => true]);

    expect(ResetFixture::counts([...ResetTables::SHOP, 'admin_users']))->toBe($before)
        ->and(app(TestReset::class)->last())->toMatchArray(['id' => $first, 'undone' => true])
        ->and(TestEnvironment::shopEmptied())->toBeFalse();
});

it('refuses to undo once the database has been migrated since', function (): void {
    rsRun(['--level' => 'shop']);
    DB::table('migrations')->insert(['migration' => '2099_01_01_000000_later', 'batch' => 99]);

    test()->artisan('rimify:reset', ['--undo' => true, '--force' => true])->assertFailed()->run();

    DB::table('migrations')->where('migration', '2099_01_01_000000_later')->delete();
});
