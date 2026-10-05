<?php

declare(strict_types=1);

namespace App\Services\Reset;

use Closure;
use Illuminate\Database\Connection;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Proof that the append-only guarantee is still in force (CLAUDE.md R-12.3; the risk D-050 named): a dump loaded with
 * its DEFINERs stripped can come back without its triggers, or with a trigger that no longer refuses, and then nothing
 * stops a change to the Protokoll or to a Prüfnachweis — and nothing says so. Counting triggers does not see the
 * second case. So this asks the database itself, each check in a transaction of its own that is always rolled back:
 *
 *  - the four triggers R-12 rests on are there, by name;
 *  - an UPDATE and a DELETE of a real Protokoll entry are refused with SQLSTATE 45000;
 *  - an UPDATE and a DELETE of a real Prüfnachweis (order_line_fitments) are refused with SQLSTATE 45000;
 *  - deleting the order line a Prüfnachweis hangs on is refused with error 1451: the foreign key is still ON DELETE
 *    RESTRICT, so no cascade can walk around the triggers.
 *
 * It works on rows that are there, and where the shop is empty on a throwaway order of its own, made inside the check's
 * own transaction — nothing it does is kept. Run before every reset (a database that has lost its guard is not reset on
 * top of the loss) and after it (TestReset): a check that does not hold fails the reset, by its name.
 */
class ResetProbe
{
    /**
     * The triggers R-12 rests on (create_order_line_fitments_table, mark_demo_rows), each with what it guards as the
     * Protokoll names it — never by its code name.
     */
    public const TRIGGERS = [
        'trg_audit_no_update' => 'der Änderungsschutz des Protokolls',
        'trg_audit_no_delete' => 'der Löschschutz des Protokolls',
        'trg_olf_no_update' => 'der Änderungsschutz der Prüfnachweise',
        'trg_olf_no_delete' => 'der Löschschutz der Prüfnachweise',
    ];

    /** What each check proves, as the Protokoll says it when it does not hold. */
    public const CHECKS = [
        'triggers' => 'Nicht alle Trigger, die das Protokoll und die Prüfnachweise schützen, sind vorhanden',
        'audit_update' => 'Eine Änderung an einem Protokolleintrag wurde nicht abgelehnt (erwartet: SQLSTATE 45000)',
        'audit_delete' => 'Das Löschen eines Protokolleintrags wurde nicht abgelehnt (erwartet: SQLSTATE 45000)',
        'snapshot_update' => 'Eine Änderung an einem Prüfnachweis wurde nicht abgelehnt (erwartet: SQLSTATE 45000)',
        'snapshot_delete' => 'Das Löschen eines Prüfnachweises wurde nicht abgelehnt (erwartet: SQLSTATE 45000)',
        'snapshot_restrict' => 'Das Löschen einer Bestellposition mit Prüfnachweis wurde nicht abgelehnt (erwartet: Fehler 1451, ON DELETE RESTRICT)',
    ];

    /**
     * Every check that did not hold, in the order above: its key, its sentence, and what the database answered.
     *
     * @return list<array{check: string, text: string, detail: string}>
     */
    public function failures(): array
    {
        $db = DB::connection();
        $failures = [];

        $present = array_map(
            static fn (object $row): string => (string) $row->name,
            $db->select('SELECT TRIGGER_NAME AS name FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE()'),
        );
        $missing = array_diff_key(self::TRIGGERS, array_flip($present));

        if ($missing !== []) {
            $failures[] = self::failure('triggers', 'es fehlt '.implode(', ', $missing));
        }

        // Each check in a transaction of its own: a statement one check let through is gone again before the next,
        // so one missing guard is never reported as two.
        $entry = fn (): int => (int) ($db->table('audit_logs')->where('is_demo', false)->orderByDesc('id')->value('id')
            ?? $db->table('audit_logs')->insertGetId(['log_name' => 'system', 'description' => 'reset.probe', 'created_at' => now(), 'updated_at' => now()]));
        $line = fn (): int => (int) ($db->table('order_line_fitments')->where('is_demo', false)->value('order_line_id') ?? $this->throwawayOrder($db));

        $failures[] = $this->isolated($db, fn () => self::refused('audit_update', '45000', null, fn () => $db->table('audit_logs')->where('id', $entry())->update(['description' => 'reset.probe'])));
        $failures[] = $this->isolated($db, fn () => self::refused('audit_delete', '45000', null, fn () => $db->table('audit_logs')->where('id', $entry())->delete()));
        $failures[] = $this->isolated($db, fn () => self::refused('snapshot_update', '45000', null, fn () => $db->table('order_line_fitments')->where('order_line_id', $line())->update(['engine_version' => 'reset.probe'])));
        $failures[] = $this->isolated($db, fn () => self::refused('snapshot_delete', '45000', null, fn () => $db->table('order_line_fitments')->where('order_line_id', $line())->delete()));
        $failures[] = $this->isolated($db, fn () => self::refused('snapshot_restrict', '23000', 1451, fn () => $db->table('order_lines')->where('id', $line())->delete()));

        return array_values(array_filter($failures));
    }

    /**
     * One check inside a transaction that is always rolled back.
     *
     * @param  Closure(): (array{check: string, text: string, detail: string}|null)  $check
     * @return array{check: string, text: string, detail: string}|null
     */
    private function isolated(Connection $db, Closure $check): ?array
    {
        $db->beginTransaction();

        try {
            return $check();
        } finally {
            $db->rollBack();
        }
    }

    /**
     * An order with one line and its Prüfnachweis, inside the check's transaction, for a shop without one. The order
     * names no customer and no address — the foreign keys are off for the three inserts, and on again before anything
     * is asked of them.
     */
    private function throwawayOrder(Connection $db): int
    {
        $now = now();
        $db->statement('SET FOREIGN_KEY_CHECKS = 0');

        try {
            $order = (int) $db->table('orders')->insertGetId([
                'order_number' => 'PRUEFUNG-'.bin2hex(random_bytes(6)),
                'customer_id' => 0,
                'delivery_address_id' => 0,
                'billing_address_id' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $line = (int) $db->table('order_lines')->insertGetId([
                'order_id' => $order,
                'kind' => 'WHEEL',
                'label' => 'Prüfung',
                'quantity' => 1,
                'unit_price_cents' => 0,
                'line_total_cents' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $db->table('order_line_fitments')->insert([
                'order_line_id' => $line,
                'vehicle_id' => 0,
                'wheel_config_id' => 0,
                'fitment_id' => 0,
                'approval_document_id' => 0,
                'document_revision' => 1,
                'verdict' => '{}',
                'verdict_status' => 'UNKNOWN',
                'requires_entry' => false,
                'engine_version' => 'reset.probe',
                'computed_at' => $now,
            ]);
        } finally {
            $db->statement('SET FOREIGN_KEY_CHECKS = 1');
        }

        return $line;
    }

    /**
     * Null when the statement is refused with the expected SQLSTATE (and driver code); the failure otherwise. What the
     * database answered instead goes into the Protokoll as its codes — its own message names tables and columns — and
     * whole into the error log.
     *
     * @param  Closure(): mixed  $statement
     * @return array{check: string, text: string, detail: string}|null
     */
    private static function refused(string $check, string $sqlstate, ?int $code, Closure $statement): ?array
    {
        try {
            $statement();
        } catch (QueryException $e) {
            $info = $e->errorInfo ?? [];

            if (($info[0] ?? null) === $sqlstate && ($code === null || (int) ($info[1] ?? 0) === $code)) {
                return null;
            }

            report($e);

            return self::failure($check, 'abgelehnt mit SQLSTATE '.($info[0] ?? '?').(isset($info[1]) ? ', Fehler '.$info[1] : ''));
        } catch (Throwable $e) {
            report($e);

            return self::failure($check, 'stattdessen ein anderer Fehler');
        }

        return self::failure($check, 'die Anweisung ging durch');
    }

    /** @return array{check: string, text: string, detail: string} */
    private static function failure(string $check, string $detail): array
    {
        return ['check' => $check, 'text' => self::CHECKS[$check], 'detail' => $detail];
    }
}
