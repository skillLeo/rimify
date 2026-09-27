<?php

declare(strict_types=1);

use App\Models\AuditLog;
use App\Models\Order;
use App\Models\OrderLine;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

/*
 * R-12 as amended: the snapshots and the audit log are never updated — demo rows included — and a
 * row may be deleted only if it was born demo (`is_demo = 1` and a `demo_ref`). Both marks are fixed
 * at insert on every table the demo seeder writes, so a real row can never become deletable.
 */

/** A snapshot row for the line, as the database holds it; demo when a ref is given. */
function demoRowsSnapshot(OrderLine $line, ?string $demoRef = null): void
{
    DB::table('order_line_fitments')->insert([
        'order_line_id' => $line->id,
        'vehicle_id' => 1,
        'wheel_config_id' => 1,
        'fitment_id' => 1,
        'approval_document_id' => 1,
        'document_revision' => 1,
        'verdict' => json_encode(['status' => 'PERMITTED']),
        'verdict_status' => 'PERMITTED',
        'requires_entry' => false,
        'engine_version' => '1',
        'computed_at' => now(),
        'is_demo' => $demoRef !== null,
        'demo_ref' => $demoRef,
    ]);
}

function demoRowsSqlState(Closure $write): ?string
{
    try {
        $write();
    } catch (QueryException $e) {
        return (string) $e->getCode();
    }

    return null;
}

describe('order_line_fitments', function (): void {
    it('refuses an UPDATE of a real snapshot and of a demo snapshot alike', function (): void {
        $real = OrderLine::factory()->create();
        $demo = OrderLine::factory()->create();
        demoRowsSnapshot($real);
        demoRowsSnapshot($demo, 'demo:olf:test-1');

        foreach ([$real, $demo] as $line) {
            expect(demoRowsSqlState(fn () => DB::update("UPDATE order_line_fitments SET verdict_status = 'UNKNOWN' WHERE order_line_id = ?", [$line->id])))->toBe('45000');
        }

        expect(DB::table('order_line_fitments')->pluck('verdict_status')->unique()->all())->toBe(['PERMITTED']);
    });

    it('refuses a DELETE of a real snapshot, and lets a demo snapshot go', function (): void {
        $real = OrderLine::factory()->create();
        $demo = OrderLine::factory()->create();
        demoRowsSnapshot($real);
        demoRowsSnapshot($demo, 'demo:olf:test-2');

        expect(demoRowsSqlState(fn () => DB::delete('DELETE FROM order_line_fitments WHERE order_line_id = ?', [$real->id])))->toBe('45000')
            ->and(demoRowsSqlState(fn () => DB::delete('DELETE FROM order_line_fitments WHERE order_line_id = ?', [$demo->id])))->toBeNull()
            ->and(DB::table('order_line_fitments')->pluck('order_line_id')->all())->toBe([$real->id]);
    });

    it('refuses to mark a real snapshot demo, or to change a demo snapshot\'s ref', function (): void {
        $real = OrderLine::factory()->create();
        $demo = OrderLine::factory()->create();
        demoRowsSnapshot($real);
        demoRowsSnapshot($demo, 'demo:olf:test-3');

        expect(demoRowsSqlState(fn () => DB::update("UPDATE order_line_fitments SET is_demo = 1, demo_ref = 'demo:olf:sneaky' WHERE order_line_id = ?", [$real->id])))->toBe('45000')
            ->and(demoRowsSqlState(fn () => DB::update("UPDATE order_line_fitments SET demo_ref = 'demo:olf:other' WHERE order_line_id = ?", [$demo->id])))->toBe('45000');
    });
});

describe('audit_logs', function (): void {
    it('refuses every UPDATE, and a DELETE of any entry not born demo', function (): void {
        $real = AuditLog::create(['log_name' => 'default', 'description' => 'faq.updated']);
        $demoId = DB::table('audit_logs')->insertGetId(['log_name' => 'default', 'description' => 'faq.updated', 'is_demo' => true, 'demo_ref' => 'demo:audit:test-1', 'created_at' => now(), 'updated_at' => now()]);

        expect(demoRowsSqlState(fn () => DB::update("UPDATE audit_logs SET description = 'x' WHERE id = ?", [$demoId])))->toBe('45000')
            ->and(demoRowsSqlState(fn () => DB::update('UPDATE audit_logs SET is_demo = 1, demo_ref = ? WHERE id = ?', ['demo:audit:sneaky', $real->id])))->toBe('45000')
            ->and(demoRowsSqlState(fn () => DB::delete('DELETE FROM audit_logs WHERE id = ?', [$real->id])))->toBe('45000')
            ->and(demoRowsSqlState(fn () => DB::delete('DELETE FROM audit_logs WHERE id = ?', [$demoId])))->toBeNull()
            ->and(DB::table('audit_logs')->pluck('id')->all())->toBe([$real->id]);
    });
});

describe('the marks on every table the demo seeder writes', function (): void {
    it('are fixed at insert — real never becomes demo, demo never becomes real or another demo', function (): void {
        $real = Order::factory()->create();
        $demo = Order::factory()->create();
        // The seeder's way in: the marks come with the insert.
        $row = collect($demo->getRawOriginal())->except(['id', 'is_demo', 'demo_ref'])->all();
        DB::table('orders')->where('id', $demo->id)->delete();
        $demoId = DB::table('orders')->insertGetId([...$row, 'order_number' => 'RMF-D-2026-00001', 'is_demo' => true, 'demo_ref' => 'demo:order:00001']);

        expect(demoRowsSqlState(fn () => DB::update("UPDATE orders SET is_demo = 1, demo_ref = 'demo:order:x' WHERE id = ?", [$real->id])))->toBe('45000')
            ->and(demoRowsSqlState(fn () => DB::update('UPDATE orders SET is_demo = 0, demo_ref = NULL WHERE id = ?', [$demoId])))->toBe('45000')
            ->and(demoRowsSqlState(fn () => DB::update("UPDATE orders SET demo_ref = 'demo:order:00002' WHERE id = ?", [$demoId])))->toBe('45000')
            // Everything else about a demo order changes as any order's does (the seeder never does).
            ->and(demoRowsSqlState(fn () => DB::update("UPDATE orders SET note = 'Hallo' WHERE id = ?", [$demoId])))->toBeNull();
    });

    it('go together: no demo row without its ref, no ref on a real row', function (): void {
        foreach (['customers', 'addresses', 'orders', 'order_lines', 'order_line_fitments', 'audit_logs', 'verdict_tallies', 'admin_users', 'catalogue_gap_events'] as $table) {
            $checks = collect(DB::select(
                'SELECT cc.CHECK_CLAUSE AS clause FROM information_schema.TABLE_CONSTRAINTS tc JOIN information_schema.CHECK_CONSTRAINTS cc ON cc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA AND cc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME WHERE tc.TABLE_SCHEMA = DATABASE() AND tc.TABLE_NAME = ? AND tc.CONSTRAINT_TYPE = ?',
                [$table, 'CHECK'],
            ))->pluck('clause')->implode(' ');

            expect(str_contains($checks, 'demo_ref'))->toBeTrue("{$table} has no demo CHECK");
        }

        $customer = ['email' => 'a@example.com', 'created_at' => now(), 'updated_at' => now()];

        expect(demoRowsSqlState(fn () => DB::table('customers')->insert([...$customer, 'is_demo' => true, 'demo_ref' => null])))->not->toBeNull()
            ->and(demoRowsSqlState(fn () => DB::table('customers')->insert([...$customer, 'is_demo' => false, 'demo_ref' => 'demo:customer:x'])))->not->toBeNull()
            ->and(DB::table('customers')->where('email', 'a@example.com')->exists())->toBeFalse();
    });

    it('stand guard on every flagged table that is not append-only anyway', function (): void {
        $triggers = collect(DB::select('SELECT TRIGGER_NAME AS name, EVENT_OBJECT_TABLE AS tbl FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE() AND EVENT_MANIPULATION = ?', ['UPDATE']))
            ->pluck('tbl')->unique()->sort()->values()->all();

        expect($triggers)->toContain('customers', 'addresses', 'orders', 'order_lines', 'verdict_tallies', 'admin_users', 'catalogue_gap_events', 'order_line_fitments', 'audit_logs');
    });
});
