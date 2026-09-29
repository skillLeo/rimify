<?php

declare(strict_types=1);

use App\Models\AuditLog;
use App\Models\OrderLine;
use App\Models\OrderLineFitment;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

/*
 * R-12 and the audit trail. These two tables exist precisely because they cannot change: a record
 * that can be edited has no evidential value in a dispute. Every path that could rewrite one is
 * asserted closed here — Eloquent, the query builder and raw SQL.
 */

function snapshotFor(OrderLine $line): OrderLineFitment
{
    return OrderLineFitment::create([
        'order_line_id' => $line->id,
        'vehicle_id' => 1,
        'wheel_config_id' => 1,
        'fitment_id' => 1,
        'approval_document_id' => 1,
        'document_revision' => 2,
        'verdict' => ['status' => 'CONDITIONAL', 'requiresEntry' => true],
        'verdict_status' => 'CONDITIONAL',
        'requires_entry' => true,
        'pdf_sha256' => str_repeat('a', 64),
        'engine_version' => '1',
        'computed_at' => now(),
    ]);
}

it('writes a snapshot once and reads it back intact', function (): void {
    $snapshot = snapshotFor(OrderLine::factory()->create());

    expect($snapshot->fresh()->verdict)->toBe(['status' => 'CONDITIONAL', 'requiresEntry' => true])
        ->and($snapshot->fresh()->document_revision)->toBe(2)
        ->and($snapshot->fresh()->requires_entry)->toBeTrue();
});

it('refuses an Eloquent update of a snapshot', function (): void {
    $snapshot = snapshotFor(OrderLine::factory()->create());

    expect(fn () => $snapshot->update(['verdict_status' => 'PERMITTED']))
        ->toThrow(LogicException::class, 'append-only');
});

it('refuses an Eloquent delete of a snapshot', function (): void {
    $snapshot = snapshotFor(OrderLine::factory()->create());

    expect(fn () => $snapshot->delete())->toThrow(LogicException::class, 'append-only');
});

it('refuses a raw UPDATE of a snapshot, and leaves the row untouched', function (): void {
    // The path the model cannot see — a future migration, a console one-liner, a DBA.
    $line = OrderLine::factory()->create();
    snapshotFor($line);

    expect(fn () => DB::statement(
        "UPDATE order_line_fitments SET verdict_status = 'PERMITTED' WHERE order_line_id = ?",
        [$line->id],
    ))->toThrow(QueryException::class, 'append-only');

    expect(DB::table('order_line_fitments')->where('order_line_id', $line->id)->value('verdict_status'))
        ->toBe('CONDITIONAL');
});

it('refuses a raw DELETE of a snapshot', function (): void {
    $line = OrderLine::factory()->create();
    snapshotFor($line);

    expect(fn () => DB::statement(
        'DELETE FROM order_line_fitments WHERE order_line_id = ?',
        [$line->id],
    ))->toThrow(QueryException::class, 'append-only');

    expect(DB::table('order_line_fitments')->where('order_line_id', $line->id)->exists())->toBeTrue();
});

it('reports SQLSTATE 45000 for a blocked snapshot write', function (): void {
    $line = OrderLine::factory()->create();
    snapshotFor($line);

    try {
        DB::statement('DELETE FROM order_line_fitments WHERE order_line_id = ?', [$line->id]);
        $this->fail('The append-only trigger did not fire.');
    } catch (QueryException $e) {
        expect($e->getCode())->toBe('45000');
    }
});

it('closes the cascade path: deleting the order line cannot take the snapshot with it', function (): void {
    // A CASCADE here would be a delete path that walks straight around the trigger.
    $line = OrderLine::factory()->create();
    snapshotFor($line);

    expect(fn () => DB::statement('DELETE FROM order_lines WHERE id = ?', [$line->id]))
        ->toThrow(QueryException::class);

    expect(DB::table('order_line_fitments')->where('order_line_id', $line->id)->exists())->toBeTrue();
});

it('closes it one level up too: deleting the order cascades to its lines and stops at the snapshot', function (): void {
    // orders → order_lines is CASCADE; order_lines ← order_line_fitments is RESTRICT, so the whole
    // statement fails and the order, its line and the snapshot all stay (COMPLIANCE.md row 13).
    $line = OrderLine::factory()->create();
    snapshotFor($line);

    expect(fn () => DB::statement('DELETE FROM orders WHERE id = ?', [$line->order_id]))
        ->toThrow(QueryException::class);

    expect(DB::table('orders')->where('id', $line->order_id)->exists())->toBeTrue()
        ->and(DB::table('order_lines')->where('id', $line->id)->exists())->toBeTrue()
        ->and(DB::table('order_line_fitments')->where('order_line_id', $line->id)->exists())->toBeTrue();
});

it('has exactly one foreign key on the two immutable tables, and it is RESTRICT', function (): void {
    // Nothing references order_line_fitments or audit_logs; audit_logs references nothing. The one
    // key is the snapshot's own line — and it may never cascade (R-12: MySQL fires no trigger on a cascade).
    $keys = DB::select("
        SELECT rc.TABLE_NAME AS t, rc.REFERENCED_TABLE_NAME AS r, rc.DELETE_RULE AS d
        FROM information_schema.REFERENTIAL_CONSTRAINTS rc
        WHERE rc.CONSTRAINT_SCHEMA = DATABASE()
          AND (rc.TABLE_NAME IN ('order_line_fitments', 'audit_logs') OR rc.REFERENCED_TABLE_NAME IN ('order_line_fitments', 'audit_logs'))
    ");

    expect(array_map(static fn (object $k): string => "{$k->t}->{$k->r}:{$k->d}", $keys))
        ->toBe(['order_line_fitments->order_lines:RESTRICT']);
});

it('refuses an update or delete of an audit entry, at both layers', function (): void {
    $entry = AuditLog::create([
        'log_name' => 'default',
        'description' => 'Gutachten veröffentlicht',
        'event' => 'published',
        'actor_email' => 'compliance@rimify.de',
        'ip_address' => '203.0.113.9',
    ]);

    expect(fn () => $entry->update(['description' => 'nichts passiert']))
        ->toThrow(LogicException::class, 'append-only');

    expect(fn () => $entry->delete())->toThrow(LogicException::class, 'append-only');

    expect(fn () => DB::statement(
        "UPDATE audit_logs SET description = 'nichts passiert' WHERE id = ?",
        [$entry->id],
    ))->toThrow(QueryException::class, 'append-only');

    expect(fn () => DB::statement('DELETE FROM audit_logs WHERE id = ?', [$entry->id]))
        ->toThrow(QueryException::class, 'append-only');

    expect(DB::table('audit_logs')->where('id', $entry->id)->value('description'))
        ->toBe('Gutachten veröffentlicht');
});

it('writes the audit trail to audit_logs, not to the package default table', function (): void {
    AuditLog::create(['log_name' => 'default', 'description' => 'test']);

    expect((new AuditLog)->getTable())->toBe('audit_logs')
        ->and(config('activitylog.activity_model'))->toBe(AuditLog::class)
        ->and(DB::table('audit_logs')->count())->toBe(1);
});
