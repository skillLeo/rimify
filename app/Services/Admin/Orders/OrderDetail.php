<?php

declare(strict_types=1);

namespace App\Services\Admin\Orders;

use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Enums\ApprovalKind;
use App\Enums\DocumentStatus;
use App\Models\Address;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\OrderLineFitment;
use App\Support\GermanFormat;
use Illuminate\Support\Facades\DB;
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
    public function for(Order $order): array
    {
        $order->loadMissing(['customer', 'deliveryAddress', 'billingAddress', 'lines.fitmentSnapshot']);
        $list = app(OrderList::class);
        $row = $list->row(Order::query()->withDemoFlag()->whereKey($order->id)->with('customer')->firstOrFail());
        $current = $this->currentStatuses($order);

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
            ],
            'customer' => [
                'name' => $row['customer'],
                'email' => $order->customer?->email,
                'phone' => $order->customer?->getAttribute('phone'),
            ],
            'delivery' => self::address($order->deliveryAddress),
            'billing' => self::address($order->billingAddress),
            'sameAddress' => $order->getAttribute('delivery_address_id') === $order->getAttribute('billing_address_id'),
            'lines' => $order->lines->sortBy([['package_group', 'asc'], ['id', 'asc']])->values()->map(fn (OrderLine $line): array => $this->line($line, $current))->all(),
        ];
    }

    /**
     * @param  array<int, string>  $current  document id => its status today
     * @return array<string, mixed>
     */
    private function line(OrderLine $line, array $current): array
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
            'snapshot' => $snapshot === null ? null : $this->snapshot($snapshot, $current),
        ];
    }

    /**
     * @param  array<int, string>  $current
     * @return array<string, mixed>
     */
    private function snapshot(OrderLineFitment $snapshot, array $current): array
    {
        $documentId = (int) $snapshot->getAttribute('approval_document_id');
        $today = $current[$documentId] ?? null;
        $base = [
            'statusCode' => (string) $snapshot->getAttribute('verdict_status'),
            'computedAt' => GermanFormat::dateTime($snapshot->getAttribute('computed_at')),
            'engine' => (string) $snapshot->getAttribute('engine_version'),
            'revision' => (int) $snapshot->getAttribute('document_revision'),
            'pdfSha' => $snapshot->getAttribute('pdf_sha256') === null ? null : substr((string) $snapshot->getAttribute('pdf_sha256'), 0, 12),
            'documentHref' => '/admin/gutachten/'.$documentId,
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
            'entryNote' => $verdict->entryNoteDe,
            'conditions' => array_map(static fn (Condition $c): string => $c->sentenceDe(), $verdict->conditions),
            'front' => array_map(static fn (TyreSize $s): string => $s->labelDe(), $verdict->front->sizes),
            'rear' => array_map(static fn (TyreSize $s): string => $s->labelDe(), $verdict->rear->sizes),
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
