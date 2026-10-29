<?php

declare(strict_types=1);

namespace App\Payments\Stripe;

use App\Models\Order;

/**
 * An order's rows as Stripe is given them (his #15, D-355; his admin item 17, D-361): a Komplettrad's rim, tyre, mounting
 * and weights apart, a rim sold alone, the RDKS sensors, the shipping — each with its quantity, its price per piece and
 * its total, gross, in cents. The payment's metadata and the invoice's line items are both drawn from here, so the
 * invoice says what was paid, row for row; the rows sum to the order's total.
 */
final class InvoiceRows
{
    /** @return list<array{label: string, quantity: int, unitCents: int, totalCents: int, shipping: bool}> */
    public static function of(Order $order): array
    {
        $rows = [];

        foreach ($order->lines()->orderBy('id')->get() as $line) {
            $parts = array_values(array_filter(
                $line->components ?? [],
                // An open price is no row: such a set was never sold (Basket refuses it).
                static fn (array $row): bool => $row['unitPriceCents'] !== null && $row['lineTotalCents'] !== null,
            ));

            if ($parts === []) {
                $rows[] = ['label' => (string) $line->label, 'quantity' => (int) $line->quantity, 'unitCents' => (int) $line->unit_price_cents, 'totalCents' => (int) $line->line_total_cents, 'shipping' => false];

                continue;
            }

            foreach ($parts as $part) {
                $rows[] = ['label' => (string) $part['label'], 'quantity' => (int) $part['quantity'], 'unitCents' => (int) $part['unitPriceCents'], 'totalCents' => (int) $part['lineTotalCents'], 'shipping' => false];
            }
        }

        if ($order->shipping_cents > 0) {
            $rows[] = ['label' => 'Versand', 'quantity' => 1, 'unitCents' => (int) $order->shipping_cents, 'totalCents' => (int) $order->shipping_cents, 'shipping' => true];
        }

        return $rows;
    }
}
