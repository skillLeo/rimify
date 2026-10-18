<?php

declare(strict_types=1);

namespace App\Services\Commerce;

/**
 * What the checkout showed the customer, as one token the page sends back with „Zahlungspflichtig bestellen“
 * (Block G): the fitment half — each line's verdict, its Auflagen and the Gutachten revisions it rests on — and the
 * price half — each line's price and the totals. At payment time the server renders the basket afresh and compares:
 * a Gutachten or a verdict that changed since stops the payment with its own sentence, a price that moved with the
 * basket's. Nothing is charged at a figure, or for a wheel, the customer was not shown.
 *
 * @phpstan-type Summary array{lines: list<array<string, mixed>>, totals: array<string, mixed>}
 */
final class CheckoutShown
{
    public const FITMENT_CHANGED = 'Seit du die Kasse geöffnet hast, hat sich die Freigabe einer Felge für dein Fahrzeug geändert – zum Beispiel, weil ein Gutachten neu gefasst wurde. Sieh dir deine Bestellung bitte noch einmal an. Es wurde nichts abgebucht.';

    public const PRICE_CHANGED = 'Seit du die Kasse geöffnet hast, hat sich ein Preis in deiner Bestellung geändert. Sieh dir die Summe bitte noch einmal an. Es wurde nichts abgebucht.';

    /** @param  Summary  $summary */
    public static function token(array $summary): string
    {
        return self::fitment($summary).'.'.self::prices($summary);
    }

    /**
     * Why the payment must stop because the basket is no longer what the page showed, or null.
     *
     * @param  Summary  $summary
     */
    public static function refusal(string $shown, array $summary): ?string
    {
        [$fitment, $prices] = array_pad(explode('.', $shown, 2), 2, '');

        if (! hash_equals(self::fitment($summary), $fitment)) {
            return self::FITMENT_CHANGED;
        }

        return hash_equals(self::prices($summary), $prices) ? null : self::PRICE_CHANGED;
    }

    /** @param  Summary  $summary */
    private static function fitment(array $summary): string
    {
        $lines = array_map(static function (array $line): array {
            $verdict = is_array($line['verdict'] ?? null) ? $line['verdict'] : [];

            return [
                $line['key'] ?? null,
                $verdict['status'] ?? null,
                $verdict['requiresEntry'] ?? null,
                $verdict['conditions'] ?? [],
                $verdict['basis'] ?? [],
                // A rim sold alone: its own sentence is part of what was shown (D-289) — a line without one hashes as before.
                ...(is_string($verdict['rimAloneNote'] ?? null) ? [$verdict['rimAloneNote']] : []),
            ];
        }, $summary['lines']);

        return self::hash($lines);
    }

    /** @param  Summary  $summary */
    private static function prices(array $summary): string
    {
        $totals = $summary['totals'];
        $tpms = is_array($totals['tpms'] ?? null) ? $totals['tpms'] : [];

        return self::hash([
            array_map(static fn (array $line): array => [$line['key'] ?? null, $line['quantity'] ?? null, $line['unitPriceCents'] ?? null, $line['lineTotalCents'] ?? null], $summary['lines']),
            $totals['subtotalCents'] ?? null,
            $totals['shippingCents'] ?? null,
            $totals['totalCents'] ?? null,
            $tpms['choice'] ?? null,
            $tpms['totalCents'] ?? null,
        ]);
    }

    private static function hash(mixed $value): string
    {
        return substr(hash('sha256', (string) json_encode($value, JSON_UNESCAPED_UNICODE)), 0, 16);
    }
}
