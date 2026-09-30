<?php

declare(strict_types=1);

namespace App\Services\Commerce;

use App\Models\AdminUser;
use App\Services\Admin\AuditTrail;
use App\Support\GermanFormat;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

/**
 * The shop's real invoice numbers (§ 14 Abs. 4 Nr. 4 UStG: fortlaufend, einmalig) and their one-way opening.
 *
 * Until they are opened, every invoice is a test invoice (Invoices::testReason): the live shop never starts a real
 * series at 1 beside the client's existing accounting. Opening is one action in the admin, by a named person after
 * their password: RE (invoices) and GS (credit notes) each start at the number the client's accounting gives. The
 * database refuses a second opening, any later change of the start and any step of a counter but +1 (the migration's
 * triggers), and the audit log names who opened them. There is no way back, by design: a series that could be reset
 * could repeat a number.
 *
 * @phpstan-type Opened array{first: string, next: string, openedAt: string, openedBy: string}
 */
final class InvoiceSeries
{
    /** The real series, by kind; each has a test twin (Invoices::TEST_PREFIX). */
    public const REAL = ['invoice' => 'RE', 'credit_note' => 'GS'];

    /** The highest number a series can start at: the counter is an unsigned 32-bit integer, with room to count on. */
    public const MAX_START = 999_999_999;

    public const ALREADY_OPEN = 'Die Rechnungsnummern sind schon eröffnet, das geht nur einmal. Lade die Seite neu, um die Nummern zu sehen.';

    public static function opened(): bool
    {
        return DB::table('invoice_sequences')->whereIn('series', array_values(self::REAL))->whereNotNull('first_number')->count() === count(self::REAL);
    }

    /**
     * Each real series as the admin shows it: where it started, the next number, who opened it — null while closed.
     *
     * @return array{invoice: Opened|null, credit_note: Opened|null}
     */
    public static function state(): array
    {
        $rows = DB::table('invoice_sequences')->whereIn('series', array_values(self::REAL))->whereNotNull('first_number')->get()->keyBy('series');
        $state = ['invoice' => null, 'credit_note' => null];

        foreach (self::REAL as $kind => $series) {
            $row = $rows->get($series);

            if ($row !== null) {
                $state[$kind] = [
                    'first' => self::number($series, (int) $row->first_number),
                    'next' => self::number($series, (int) $row->last_number + 1),
                    'openedAt' => GermanFormat::dateTime(CarbonImmutable::parse((string) $row->opened_at)),
                    'openedBy' => (string) $row->opened_by_name,
                ];
            }
        }

        return $state;
    }

    /** `RE-001043`: the number as the invoice prints it (the database spells it the same way, chk_invoice_number). */
    public static function number(string $series, int $sequence): string
    {
        return $series.'-'.str_pad((string) $sequence, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Opens both real series, at the client's numbers, in one transaction — or refuses with a sentence.
     *
     * @throws InvoiceSeriesRefused
     */
    public function open(AdminUser $operator, int $firstInvoice, int $firstCreditNote): void
    {
        foreach ([$firstInvoice, $firstCreditNote] as $first) {
            if ($first < 1 || $first > self::MAX_START) {
                throw new InvoiceSeriesRefused('Eine Rechnungsnummer beginnt bei 1 oder höher, höchstens bei '.GermanFormat::integer(self::MAX_START).'.');
            }
        }

        try {
            DB::transaction(function () use ($operator, $firstInvoice, $firstCreditNote): void {
                if (DB::table('invoice_sequences')->whereIn('series', array_values(self::REAL))->lockForUpdate()->exists()) {
                    throw new InvoiceSeriesRefused(self::ALREADY_OPEN);
                }

                $now = now();

                foreach ([self::REAL['invoice'] => $firstInvoice, self::REAL['credit_note'] => $firstCreditNote] as $series => $first) {
                    DB::table('invoice_sequences')->insert([
                        'series' => $series,
                        'last_number' => $first - 1,
                        'first_number' => $first,
                        'opened_by_admin_id' => $operator->id,
                        'opened_by_name' => $operator->name,
                        'opened_at' => $now,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }

                AuditTrail::record($operator, 'invoice.series_opened', [
                    'invoice_first' => self::number(self::REAL['invoice'], $firstInvoice),
                    'credit_note_first' => self::number(self::REAL['credit_note'], $firstCreditNote),
                    'operator' => $operator->name,
                ]);
            });
        } catch (QueryException $e) {
            // Two openings at once: the second finds the first's row by its primary key.
            if (self::opened()) {
                throw new InvoiceSeriesRefused(self::ALREADY_OPEN);
            }

            throw $e;
        }
    }
}
