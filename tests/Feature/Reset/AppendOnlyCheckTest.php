<?php

declare(strict_types=1);

use App\Services\Reset\ResetProbe;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\Support\ResetFixture;

/*
 * rimify:append-only-check — ResetProbe on its own, the acceptance test after a database restore that is not a reset:
 * a move to another data centre (docs/ops/UMZUG-DE.md), a rollback. A trigger can come back from a dump by name and
 * refuse nothing (D-050); a count would pass it, this must not. The DDL below runs against a scratch database of its
 * own (ResetFixture), never the suite's.
 */

beforeEach(function (): void {
    Storage::fake('media_products');
    Storage::fake('docs_public');
    Storage::fake('public');

    $this->scratch = ResetFixture::scratch();
});

afterEach(function (): void {
    DB::setDefaultConnection('mysql');
    $this->scratch->drop();
});

it('passes on a database whose triggers refuse every change, and keeps nothing it tried', function (): void {
    $before = ['audit_logs' => DB::table('audit_logs')->count(), 'orders' => DB::table('orders')->count(), 'order_line_fitments' => DB::table('order_line_fitments')->count()];

    test()->artisan('rimify:append-only-check')
        ->expectsOutputToContain('Eine Änderung an einem Prüfnachweis wird abgelehnt (erwartet: SQLSTATE 45000)')
        ->expectsOutputToContain('Protokoll und Prüfnachweise lehnen jede Änderung ab.')
        ->assertSuccessful()
        ->run();

    expect(['audit_logs' => DB::table('audit_logs')->count(), 'orders' => DB::table('orders')->count(), 'order_line_fitments' => DB::table('order_line_fitments')->count()])
        ->toBe($before);
});

it('fails, naming the check, on a trigger that is there by name and refuses nothing', function (): void {
    DB::unprepared('DROP TRIGGER trg_olf_no_update');
    DB::unprepared('CREATE TRIGGER trg_olf_no_update BEFORE UPDATE ON order_line_fitments FOR EACH ROW SET @rimify_probe_noop = 1');

    test()->artisan('rimify:append-only-check')
        ->expectsOutputToContain('FEHLT · die Anweisung ging durch')
        ->expectsOutputToContain('1 von '.count(ResetProbe::CHECKS).' Prüfungen fehlgeschlagen')
        ->assertFailed()
        ->run();
});

it('fails on a trigger that is gone, naming what it guarded', function (): void {
    DB::unprepared('DROP TRIGGER trg_audit_no_delete');

    test()->artisan('rimify:append-only-check')
        ->expectsOutputToContain('FEHLT · es fehlt der Löschschutz des Protokolls')
        ->assertFailed()
        ->run();
});
