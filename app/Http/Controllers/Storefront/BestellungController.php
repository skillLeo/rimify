<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\OrderStatusRequest;
use App\Models\AuditLog;
use App\Models\CustomerAccount;
use App\Models\Invoice;
use App\Models\Order;
use App\Services\Commerce\Invoices;
use App\Services\Commerce\OrderAccess;
use App\Services\Commerce\OrderLinks;
use App\Services\Commerce\PackageTyreSizes;
use App\Services\Storefront\Basket;
use App\Services\Storefront\Chrome;
use App\Support\GermanFormat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/**
 * The order confirmation.
 *
 * It shows the frozen verdict per line, not a freshly computed one: this page is the customer's
 * receipt for what they were told, and re-deriving it would mean the page could one day disagree
 * with the email they were sent.
 *
 * An order number counts up, so it is no secret: an order that came through the checkout is shown
 * only through its signed link, to the browser that placed it, or to the account it was placed
 * under — whatever it contains (OrderAccess). Anyone else gets the same 404 as an order that does
 * not exist. Only an order a seeder wrote opens by number.
 */
class BestellungController extends Controller
{
    /** The session key holding the order numbers this browser placed. */
    public const SESSION_PLACED = 'orders.placed';

    /** Remembers that this browser placed the order, so its confirmation page opens for it. */
    public static function remember(Request $request, string $number): void
    {
        $placed = $request->session()->get(self::SESSION_PLACED);
        $placed = is_array($placed) ? array_values(array_filter($placed, 'is_string')) : [];

        $request->session()->put(self::SESSION_PLACED, array_slice(array_values(array_unique([...$placed, $number])), -10));
    }

    public function show(Request $request, string $order, Basket $basket): Response
    {
        $record = Order::query()
            ->with(['lines.fitmentSnapshot', 'deliveryAddress', 'customer'])
            ->where('order_number', $order)
            ->firstOrFail();

        // Provenance, never content, decides who sees it (OrderAccess, EIGENE-FUNDE 131).
        $proof = OrderAccess::proof($request, $record);

        if ($proof === null) {
            // A link of ours whose twelve months are up: the way back, not a dead end (D-240). Anything else: 404.
            abort_unless(OrderLinks::expired($request), 404);

            return Inertia::render('Bestellung/Abgelaufen', ['number' => $record->order_number]);
        }

        $demo = $record->isDemo();
        $placed = $request->session()->get(self::SESSION_PLACED);

        // Stripe sends the customer back here with `redirect_status`; the address alone pays nothing — only the
        // signed webhook does (ProcessPaymentEvent). The basket empties once the order IS paid.
        KasseZahlungController::settle($request, $basket);
        $lines = [];
        // A Komplettrad's tyre size per line: each line says its own size's Auflagen only — each axle of a set per axle its own.
        $tyres = PackageTyreSizes::of($record->lines);

        foreach ($record->lines as $line) {
            $snapshot = $line->fitmentSnapshot;

            $lines[] = [
                'id' => $line->id,
                'kind' => $line->kind->value,
                'kindLabel' => $line->kind->labelDe(),
                'label' => $line->label,
                'quantity' => (int) $line->quantity,
                'unitPrice' => GermanFormat::money((int) $line->unit_price_cents),
                'lineTotal' => GermanFormat::money((int) $line->line_total_cents),
                'verdict' => $snapshot === null ? null : [
                    'status' => $snapshot->verdict_status,
                    // Every Auflage a Hinweis (#23, D-104): „Freigegeben“, as the product page said it.
                    'notesOnly' => self::notesOnly((array) $snapshot->verdict),
                    'requiresEntry' => (bool) $snapshot->requires_entry,
                    'papersExempt' => $snapshot->papersExempt(),
                    'documentRevision' => (int) $snapshot->document_revision,
                    'detail' => $snapshot->verdict,
                    // The Auflagen as the customer read them: the combination's once, each tyre size's with that size — on
                    // a set per axle under that axle's name (D-335).
                    'conditionGroups' => self::conditionGroups($snapshot->verdict, PackageTyreSizes::for($line, $tyres), PackageTyreSizes::axle($line), PackageTyreSizes::partner($line, $tyres)),
                    // A rim sold alone (D-289): our own sentence as it was shown, never among the Auflagen (R-17).
                    'rimAloneNote' => is_string($snapshot->verdict['rimAloneNote'] ?? null) ? $snapshot->verdict['rimAloneNote'] : null,
                ],
            ];
        }

        return Inertia::render('Bestellung/Index', [
            'order' => [
                'number' => $record->order_number,
                'status' => $record->status->value,
                'statusLabel' => $record->status->labelDe(),
                'placedAt' => GermanFormat::dateTime($record->placed_at),
                'vehicleLabel' => $record->vehicle_label,
                'keyNumbers' => $record->vehicle_hsn === null || $record->vehicle_tsn === null
                    ? null
                    : GermanFormat::keyNumbers($record->vehicle_hsn, $record->vehicle_tsn),
                'subtotal' => GermanFormat::money((int) $record->subtotal_cents),
                'shipping' => GermanFormat::money((int) $record->shipping_cents),
                'tax' => GermanFormat::money((int) $record->tax_cents),
                // The order's own rate, frozen with its lines: a Kleinunternehmer's order (§ 19 UStG) has no VAT line.
                'smallBusiness' => $record->vatRateBp() === 0,
                'total' => GermanFormat::money((int) $record->total_cents),
                // A seeded order was never shipped: its tracking number is invented.
                'trackingCode' => $demo ? null : $record->tracking_code,
            ],
            'lines' => $lines,
            // Where the payment stands, in the page's words — and whether the page should keep asking. A seeded order
            // was never paid; a test purchase was (the test payment), and walks the whole path.
            'payment' => $demo && $record->seeded() ? null : self::payment($record, $request->query('redirect_status'), $proof === OrderAccess::LINK),
            // The §14 invoice as issued, by a signed link — never to a seeded order.
            'invoice' => $demo ? null : self::invoice($record),
            // „Konto anlegen“ in one click, once paid, for the browser that placed it and no account yet (Block G §2).
            'accountOffer' => ! $demo && $record->status->isPaid() && is_array($placed) && in_array($record->order_number, $placed, true)
                && $request->user('customer') === null
                // Once opened, not offered again — its link is on its way, and „Passwort vergessen“ sends another (PAY-10).
                && ! CustomerAccount::query()->where('email', mb_strtolower((string) $record->customer?->email))->exists(),
            // Seeded demonstration data (CommerceSeeder): nobody placed this order, and the frozen
            // verdicts on it say nothing about the car (ACCURACY.md §3.1 F3). The snapshots stay
            // exactly as written (R-12); the page says what they are.
            'demo' => $demo,
            // Demonstration data that a person placed through the checkout — the acceptance set, off production
            // (D-239): no invoice, in no real figure, taken away by the test environment's reset; the page says so.
            'testPurchase' => $demo && ! $record->seeded(),
            // The shared shape, whole: a page prop named `contact` replaces the shared one for the
            // header and the footer too. The phone is null until the client gives one, and the page
            // then offers the e-mail.
            'contact' => Chrome::contact(),
        ]);
    }

    /** @return array{number: string, href: string}|null */
    private static function invoice(Order $order): ?array
    {
        $invoice = Invoice::query()->where('order_id', $order->id)->where('kind', Invoice::INVOICE)->first();

        return $invoice === null ? null : ['number' => $invoice->number, 'href' => Invoices::link($invoice)];
    }

    /**
     * „Is it paid yet?“ — asked by the confirmation page every few seconds while the payment is being confirmed. It
     * reads the order; it never writes a payment.
     */
    public function status(OrderStatusRequest $request, Basket $basket): JsonResponse
    {
        KasseZahlungController::settle($request, $basket);
        $order = $request->order();

        return response()->json(self::payment($order, null) + ['statusLabel' => $order->status->labelDe()]);
    }

    /**
     * The payment's state for the confirmation page: `paid`, `confirming` (written, not yet confirmed by the
     * provider), `processing` (confirmed as on its way — a Lastschrift takes days), `failed`, `closed` (storniert,
     * abgelaufen, erstattet). Stripe's `redirect_status=failed` shows a failure a moment before its webhook arrives;
     * it can never show a payment.
     *
     * `mailed` says whether the confirmation mail actually went out (OrderPaid audits it), so the page never claims
     * one that failed or that an order older than it never got.
     *
     * Opened by its link alone — a forwarded mail, a shared inbox — the page shows the least that is useful (D-240): the
     * address the mail went to, shortened to what its owner recognises.
     *
     * @return array{state: string, poll: bool, email: string|null, mailed: bool}
     */
    private static function payment(Order $order, mixed $redirectStatus, bool $byLink = false): array
    {
        $mailed = AuditLog::query()
            ->where('description', 'order.confirmation_sent')
            ->where('subject_type', $order->getMorphClass())
            ->where('subject_id', $order->id)
            ->exists();

        $state = match (true) {
            $order->status->isPaid() => 'paid',
            $order->status === OrderStatus::Processing => 'processing',
            $order->status === OrderStatus::Failed => 'failed',
            $order->status === OrderStatus::PendingPayment => $redirectStatus === 'failed' ? 'failed' : 'confirming',
            default => 'closed',
        };

        return [
            'state' => $state,
            'poll' => in_array($state, ['confirming', 'processing'], true),
            'email' => $byLink ? self::shortened($order->customer?->email) : $order->customer?->email,
            'mailed' => $mailed,
        ];
    }

    /** `e…@beispiel.de`: the first letter and the domain, enough for its owner and little for anyone else. */
    private static function shortened(?string $email): ?string
    {
        if ($email === null || ! str_contains($email, '@')) {
            return $email;
        }

        [$name, $domain] = explode('@', $email, 2);

        return mb_substr($name, 0, 1).'…@'.$domain;
    }

    /**
     * @param  array<string, mixed>  $verdict
     * @return array<string, mixed>|null
     */
    private static function conditionGroups(array $verdict, ?string $tyreSize, ?string $axle = null, ?string $partner = null): ?array
    {
        try {
            return FitmentVerdict::fromArray($verdict)->conditionGroups()->toArray($tyreSize, $axle, $partner);
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * Whether the frozen answer's Auflagen were all Hinweise (#23, D-104), as its own Auflagen say. A snapshot that
     * cannot be read claims nothing: false, the louder reading.
     *
     * @param  array<string, mixed>  $verdict
     */
    public static function notesOnly(array $verdict): bool
    {
        try {
            return FitmentVerdict::fromArray($verdict)->notesOnly();
        } catch (Throwable) {
            return false;
        }
    }
}
