<?php

declare(strict_types=1);

namespace App\Services\Admin\Orders;

use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\PapersWording;
use App\Enums\ApprovalKind;
use App\Enums\DocumentStatus;
use App\Models\Address;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\OrderLineFitment;
use App\Models\Refund;
use App\Payments\Payments;
use App\Services\Commerce\PackageTyreSizes;
use App\Services\Commerce\RefundOrder;
use App\Support\GermanFormat;
use App\Support\Money;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Throwable;

/**
 * Verkauf › Bestellungen › one order (the review release §4.4): what was bought, by whom, where it
 * goes — and, per wheel line, the verdict as the customer was shown it at the moment of purchase,
 * restored from its frozen snapshot (order_line_fitments, R-12), never computed again. What a
 * Gutachten says today is beside the point: the order is explained by what it said then, and the
 * page says when that revision has since been replaced.
 *
 * A snapshot that cannot be read is said to be unreadable; nothing is filled in around it.
 */
final class OrderDetail
{
    /** @return array<string, mixed> */
    public function for(Order $order, bool $documentsOpen = true): array
    {
        $order->loadMissing(['customer', 'deliveryAddress', 'billingAddress', 'lines.fitmentSnapshot']);
        $list = app(OrderList::class);
        $row = $list->row(Order::query()->withDemoFlag()->whereKey($order->id)->with('customer')->firstOrFail());
        $current = $this->currentStatuses($order);
        // A Komplettrad's tyre size per package: its wheel line then says that size's Auflagen only.
        $tyres = PackageTyreSizes::of($order->lines);

        return [
            'order' => $row + [
                'placedAt' => GermanFormat::dateTime($order->placed_at),
                'paidAt' => GermanFormat::dateTime($order->paid_at),
                'shippedAt' => GermanFormat::dateTime($order->shipped_at),
                'tracking' => $order->tracking_code,
                'note' => $order->getAttribute('note'),
                'keys' => $order->vehicle_hsn !== null && $order->vehicle_tsn !== null ? GermanFormat::keyNumbers($order->vehicle_hsn, $order->vehicle_tsn) : null,
                'subtotal' => $order->subtotal_cents,
                'shipping' => $order->shipping_cents,
                'tax' => $order->tax_cents,
                // Written at a VAT rate of 0: a Kleinunternehmer's order (§ 19 UStG) shows the sentence, not a VAT line.
                'smallBusiness' => $order->vatRateBp() === 0,
            ],
            'customer' => [
                'name' => $row['customer'],
                'email' => $order->customer?->email,
                'phone' => $order->customer?->getAttribute('phone'),
            ],
            'delivery' => self::address($order->deliveryAddress),
            'billing' => self::address($order->billingAddress),
            'sameAddress' => $order->getAttribute('delivery_address_id') === $order->getAttribute('billing_address_id'),
            'lines' => $order->lines->sortBy([['package_group', 'asc'], ['id', 'asc']])->values()->map(fn (OrderLine $line): array => $this->line($line, $current, PackageTyreSizes::for($line, $tyres), $documentsOpen))->all(),
            'money' => self::money($order),
        ];
    }

    /**
     * Block G: the money on the order — what was paid, what went back and how much still can, a flag the webhook
     * raised, the invoice and credit notes (by short-lived signed links) and every refund with who asked.
     *
     * @return array<string, mixed>
     */
    private static function money(Order $order): array
    {
        $refunds = Refund::query()->where('order_id', $order->id)->with('requester')->orderBy('id')->get();
        $papers = Invoice::query()->where('order_id', $order->id)->orderBy('id')->get();

        return [
            'paid' => $order->status->isPaid() ? $order->total_cents : 0,
            'refunded' => $order->refunded_cents,
            'refundable' => RefundOrder::refundable($order),
            // The same figure as the form's field shows it and the server reads it back (Money::fromGerman).
            'refundableInput' => Money::fromMinor(RefundOrder::refundable($order))->toGerman(),
            // Only where the order's own payment way is in force: a refund is never recorded by hand.
            'canRefund' => RefundOrder::refundable($order) > 0 && ! $order->isDemo() && Payments::for((string) $order->getAttribute('payment_method')) !== null,
            'flag' => $order->payment_flag,
            'error' => $order->payment_error,
            'papers' => $papers->map(static fn (Invoice $paper): array => [
                'number' => $paper->number,
                'kind' => $paper->kind === Invoice::INVOICE ? 'Rechnung' : 'Gutschrift',
                'gross' => $paper->gross_cents,
                'issuedAt' => GermanFormat::date($paper->issued_at),
                'href' => URL::temporarySignedRoute('rechnung.show', now()->addMinutes(30), ['number' => $paper->number]),
            ])->all(),
            'refunds' => $refunds->map(static fn (Refund $refund): array => [
                'amount' => $refund->amount_cents,
                'reason' => $refund->reason,
                'status' => $refund->status === 'succeeded' ? 'Erstattet' : ($refund->status === 'pending' ? 'Beauftragt' : 'Abgelehnt'),
                'at' => GermanFormat::dateTime($refund->created_at),
                'by' => $refund->requester?->email,
            ])->all(),
        ];
    }

    /**
     * @param  array<int, string>  $current  document id => its status today
     * @return array<string, mixed>
     */
    private function line(OrderLine $line, array $current, ?string $tyreSize = null, bool $documentsOpen = true): array
    {
        $snapshot = $line->fitmentSnapshot;

        return [
            'id' => (int) $line->id,
            'kind' => $line->kind->value,
            'label' => (string) $line->getAttribute('label'),
            'quantity' => (int) $line->getAttribute('quantity'),
            'unit' => (int) $line->getAttribute('unit_price_cents'),
            'total' => (int) $line->getAttribute('line_total_cents'),
            'package' => $line->getAttribute('package_group') === null ? null : (int) $line->getAttribute('package_group'),
            'snapshot' => $snapshot === null ? null : $this->snapshot($snapshot, $current, $tyreSize, $documentsOpen),
        ];
    }

    /**
     * @param  array<int, string>  $current
     * @return array<string, mixed>
     */
    private function snapshot(OrderLineFitment $snapshot, array $current, ?string $tyreSize = null, bool $documentsOpen = true): array
    {
        $documentId = (int) $snapshot->getAttribute('approval_document_id');
        $today = $current[$documentId] ?? null;
        $base = [
            'statusCode' => (string) $snapshot->getAttribute('verdict_status'),
            'computedAt' => GermanFormat::dateTime($snapshot->getAttribute('computed_at')),
            'engine' => (string) $snapshot->getAttribute('engine_version'),
            'revision' => (int) $snapshot->getAttribute('document_revision'),
            'pdfSha' => $snapshot->getAttribute('pdf_sha256') === null ? null : substr((string) $snapshot->getAttribute('pdf_sha256'), 0, 12),
            // Linked only for a reader who may open Gutachten: Verkauf would land on a refusal.
            'documentHref' => $documentsOpen ? '/admin/gutachten/'.$documentId : null,
            // What the document is today, only when it is no longer what the order was sold against.
            'documentToday' => match ($today) {
                DocumentStatus::Superseded->value => 'Diese Fassung wurde inzwischen durch eine neuere ersetzt.',
                DocumentStatus::Withdrawn->value => 'Dieses Dokument wurde inzwischen zurückgezogen.',
                null => 'Das Dokument ist nicht mehr auffindbar.',
                default => null,
            },
        ];

        try {
            $verdict = FitmentVerdict::fromArray($snapshot->verdict);
        } catch (Throwable) {
            return $base + ['readable' => false];
        }

        $document = $verdict->document;
        $kind = $document === null ? null : (ApprovalKind::tryFrom($document->kind)?->labelDe() ?? $document->kind);
        $groups = $verdict->conditionGroups()->toArray($tyreSize);

        return $base + [
            'readable' => true,
            'status' => $verdict->status->value,
            'statusLabel' => $verdict->status->labelDe(),
            'vehicle' => $verdict->vehicleLabel,
            'wheel' => $verdict->wheelLabel,
            'document' => $document === null ? null : trim($kind.' '.($document->number ?? '')),
            'issuer' => $document?->issuer,
            'sourcePage' => $document?->sourcePage,
            'requiresEntry' => $verdict->requiresEntry,
            // The papers in the words the customer read (PapersWording): the Auflagen's line, the document's.
            // Per size where the sizes differ; for a Komplettrad, its tyre's.
            'entryLine' => PapersWording::entryBySize($groups['sizes'], $verdict->papersExempt()) ?? PapersWording::entryLine($groups['entry'] ?? $verdict->requiresEntry, $verdict->papersExempt()),
            'papersLine' => PapersWording::papersLine($verdict->papersExempt()),
            'entryNote' => $verdict->entryNoteDe,
            'conditions' => array_map(static fn (Condition $c): string => $c->sentenceDe(), $verdict->conditions),
            // As the customer read them: the combination's once, each tyre size's with that size — for a Komplettrad,
            // its tyre's (ConditionGroups).
            'conditionGroups' => $groups,
            'front' => array_map(static fn (TyreSize $s): string => $s->labelDe(), $verdict->front->sizes),
            'rear' => array_map(static fn (TyreSize $s): string => $s->labelDe(), $verdict->rear->sizes),
            // The tyre answer as the customer was shown it, and the whole sum behind it — whatever the shop
            // folded away at the time, it is all here (the operator's decision of 29.09.2026).
            'tyre' => $verdict->tyre === null ? null : [
                'statusLabel' => $verdict->tyre->status->labelDe(),
                'summary' => $verdict->tyre->summary,
                'basis' => $verdict->tyre->basis,
                'lines' => $verdict->tyre->lines,
                'fromPapers' => $verdict->tyre->stricterByPapers,
            ],
        ];
    }

    /** @return array<int, string> */
    private function currentStatuses(Order $order): array
    {
        $ids = $order->lines->map(static fn (OrderLine $l): ?int => $l->fitmentSnapshot === null ? null : (int) $l->fitmentSnapshot->getAttribute('approval_document_id'))->filter()->unique()->values()->all();

        return $ids === [] ? [] : DB::table('approval_documents')->whereIn('id', $ids)->pluck('status', 'id')->map(static fn (mixed $s): string => (string) $s)->all();
    }

    /** @return array<string, string|null>|null */
    private static function address(?Address $address): ?array
    {
        if ($address === null) {
            return null;
        }

        return [
            'name' => (string) $address->getAttribute('full_name'),
            'company' => $address->getAttribute('company'),
            'street' => trim($address->getAttribute('street').' '.$address->getAttribute('house_number')),
            'extra' => $address->getAttribute('address_extra'),
            'city' => trim($address->getAttribute('zip_code').' '.$address->getAttribute('city')),
            'country' => $address->getAttribute('country') === 'DE' ? null : (string) $address->getAttribute('country'),
        ];
    }
}
