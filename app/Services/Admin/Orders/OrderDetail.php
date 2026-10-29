<?php

declare(strict_types=1);

namespace App\Services\Admin\Orders;

use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\PapersWording;
use App\Domain\Fitment\Verdict\VerdictStatus;
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
use App\Support\OwnInvoices;
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
        // A Komplettrad's tyre size per line: each line then says its own size's Auflagen only — each axle of a set its own.
        $tyres = PackageTyreSizes::of($order->lines);

        return [
            'order' => $row + [
                'placedAt' => GermanFormat::dateTime($order->placed_at),
                'paidAt' => GermanFormat::dateTime($order->paid_at),
                'shippedAt' => GermanFormat::dateTime($order->shipped_at),
                // „Zugestellt“, as the team recorded it (D-103); the review invitation goes out some days after.
                'deliveredAt' => GermanFormat::dateTime($order->delivered_at),
                'reviewInvitedAt' => GermanFormat::dateTime($order->review_invited_at),
                // Which of the two steps the state machine allows now; whether this reader may take it is the page's `canFulfil`.
                'canShip' => OrderFulfilment::canShip($order),
                'canDeliver' => OrderFulfilment::canDeliver($order),
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
            'lines' => $order->lines->sortBy([['package_group', 'asc'], ['id', 'asc']])->values()->map(fn (OrderLine $line): array => $this->line($line, $current, PackageTyreSizes::for($line, $tyres), $documentsOpen, PackageTyreSizes::partner($line, $tyres)))->all(),
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
            // Whether the shop issues its own invoices and credit notes (D-348): off, a refund names no Gutschrift.
            // Papers issued before stay listed.
            'ownInvoices' => OwnInvoices::enabled(),
            'papers' => [
                ...$papers->map(static fn (Invoice $paper): array => [
                    'number' => $paper->number,
                    'kind' => $paper->kind === Invoice::INVOICE ? 'Rechnung' : 'Gutschrift',
                    'gross' => $paper->gross_cents,
                    'issuedAt' => GermanFormat::date($paper->issued_at),
                    'href' => URL::temporarySignedRoute('rechnung.show', now()->addMinutes(30), ['number' => $paper->number]),
                ])->all(),
                // Stripe's invoice (his admin item 17, D-361), once Stripe has issued it and reported it paid: its page there.
                ...($order->stripe_invoice_pdf === null || $order->stripe_invoice_number === null ? [] : [[
                    'number' => $order->stripe_invoice_number,
                    'kind' => 'Rechnung (Stripe)',
                    'gross' => (int) $order->total_cents,
                    'issuedAt' => GermanFormat::date($order->stripe_invoiced_at),
                    'href' => (string) ($order->stripe_invoice_url ?? $order->stripe_invoice_pdf),
                ]]),
            ],
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
    private function line(OrderLine $line, array $current, ?string $tyreSize = null, bool $documentsOpen = true, ?string $partner = null): array
    {
        $snapshot = $line->fitmentSnapshot;

        return [
            'id' => (int) $line->id,
            'kind' => $line->kind->value,
            'label' => (string) $line->getAttribute('label'),
            'quantity' => (int) $line->getAttribute('quantity'),
            'unit' => (int) $line->getAttribute('unit_price_cents'),
            'total' => (int) $line->getAttribute('line_total_cents'),
            // A Komplettrad's rows as sold, each its own line (his #15, D-355).
            'components' => $line->componentRows(),
            'package' => $line->getAttribute('package_group') === null ? null : (int) $line->getAttribute('package_group'),
            'snapshot' => $snapshot === null ? null : $this->snapshot($snapshot, $current, $tyreSize, $documentsOpen, PackageTyreSizes::axle($line), $partner),
        ];
    }

    /**
     * @param  array<int, string>  $current
     * @return array<string, mixed>
     */
    private function snapshot(OrderLineFitment $snapshot, array $current, ?string $tyreSize = null, bool $documentsOpen = true, ?string $axle = null, ?string $partner = null): array
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
        $groups = $verdict->conditionGroups()->toArray($tyreSize, $axle, $partner);

        return $base + [
            'readable' => true,
            'status' => $verdict->status->value,
            'statusLabel' => $verdict->displayLabelDe(),
            // Every Auflage a Hinweis (#23, D-104): the frozen answer's own Auflagen decide, as frozen.
            'notesOnly' => $verdict->notesOnly(),
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
            // A rim sold alone while its tyres waited for the papers (D-289): our own sentence as the customer read it.
            'rimAloneNote' => $verdict->rimAloneNoteDe,
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
            // The set sold as one of the Gutachten's combinations (D-335), as frozen: what went where.
            'combination' => self::combination($snapshot->verdict['combination'] ?? null),
        ];
    }

    /**
     * `Kombination Nr. 2 aus dem Gutachten (Seite 5)`, and per axle `Vorderachse: 2 × … — Freigegeben`, from the frozen
     * record — null on every line sold otherwise, and on one frozen before D-335.
     *
     * @return array{number: int, sourcePage: int|null, statusLabel: string, axles: list<array{axle: string, size: string, tyre: string, statusLabel: string, minimum: string|null}>}|null
     */
    private static function combination(mixed $frozen): ?array
    {
        if (! is_array($frozen) || ! is_numeric($frozen['number'] ?? null)) {
            return null;
        }

        $status = static fn (mixed $value): string => VerdictStatus::tryFrom(is_string($value) ? $value : '')?->labelDe() ?? VerdictStatus::Unknown->labelDe();
        $axles = [];

        foreach (['front', 'rear'] as $side) {
            $axle = is_array($frozen[$side] ?? null) ? $frozen[$side] : null;

            if ($axle === null) {
                continue;
            }

            $tyre = is_array($axle['tyre'] ?? null) ? $axle['tyre'] : [];
            $axles[] = [
                'axle' => (string) ($axle['axleLabel'] ?? ''),
                'size' => (string) ($axle['size'] ?? ''),
                'tyre' => trim(implode(' ', array_filter([$tyre['brandName'] ?? null, $tyre['name'] ?? null, $tyre['label'] ?? null], static fn (mixed $part): bool => is_string($part) && $part !== ''))),
                'statusLabel' => $status($axle['status'] ?? null),
                // The axle load beside the load index it decides — never beside the speed symbol.
                'minimum' => is_numeric($axle['minLoadIndex'] ?? null) && is_string($axle['minSpeedSymbol'] ?? null)
                    ? sprintf('mindestens Tragfähigkeitsindex %d%s, Geschwindigkeitsindex %s', (int) $axle['minLoadIndex'], is_numeric($axle['axleLoadKg'] ?? null) ? ' (bei '.GermanFormat::kilograms((int) $axle['axleLoadKg']).' Achslast)' : '', $axle['minSpeedSymbol'])
                    : null,
            ];
        }

        return [
            'number' => (int) $frozen['number'],
            'sourcePage' => is_numeric($frozen['sourcePage'] ?? null) ? (int) $frozen['sourcePage'] : null,
            'statusLabel' => $status($frozen['status'] ?? null),
            'axles' => $axles,
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
