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
        abort_unless(OrderAccess::allows($request, $record), 404);

        $demo = $record->isDemo();
        $placed = $request->session()->get(self::SESSION_PLACED);

        // Stripe sends the customer back here with `redirect_status`; the address alone pays nothing — only the
        // signed webhook does (ProcessPaymentEvent). The basket empties once the order IS paid.
        KasseZahlungController::settle($request, $basket);
        $lines = [];
        // A Komplettrad's tyre size per package: its wheel line says that size's Auflagen only.
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
                    // The Auflagen as the customer read them: the combination's once, each tyre size's with that size.
                    'conditionGroups' => self::conditionGroups($snapshot->verdict, PackageTyreSizes::for($line, $tyres)),
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
            // Where the payment stands, in the page's words — and whether the page should keep asking.
            'payment' => $demo ? null : self::payment($record, $request->query('redirect_status')),
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
     * @return array{state: string, poll: bool, email: string|null, mailed: bool}
     */
    private static function payment(Order $order, mixed $redirectStatus): array
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
            'email' => $order->customer?->email,
            'mailed' => $mailed,
        ];
    }

    /**
     * @param  array<string, mixed>  $verdict
     * @return array<string, mixed>|null
     */
    private static function conditionGroups(array $verdict, ?string $tyreSize): ?array
    {
        try {
            return FitmentVerdict::fromArray($verdict)->conditionGroups()->toArray($tyreSize);
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
