<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\Storefront\Chrome;
use App\Support\GermanFormat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The order confirmation.
 *
 * It shows the frozen verdict per line, not a freshly computed one: this page is the customer's
 * receipt for what they were told, and re-deriving it would mean the page could one day disagree
 * with the email they were sent.
 */
class BestellungController extends Controller
{
    public function show(Request $request, string $order): Response
    {
        $record = Order::query()
            ->with(['lines.fitmentSnapshot', 'deliveryAddress'])
            ->where('order_number', $order)
            ->firstOrFail();

        $demo = $this->isDemo($record);
        $lines = [];

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
                    'requiresEntry' => (bool) $snapshot->requires_entry,
                    'documentRevision' => (int) $snapshot->document_revision,
                    'detail' => $snapshot->verdict,
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
                'total' => GermanFormat::money((int) $record->total_cents),
                // A seeded order was never shipped: its tracking number is invented.
                'trackingCode' => $demo ? null : $record->tracking_code,
            ],
            'lines' => $lines,
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

    /**
     * Whether an order is seeded demonstration data: any of its lines is a wheel from a demo
     * model. Every order CommerceSeeder writes has such a line, and a demo model can never be
     * ordered (KasseController refuses it), so a real order never matches.
     */
    private function isDemo(Order $order): bool
    {
        return DB::table('order_lines as ol')
            ->join('wheel_configs as wc', 'wc.id', '=', 'ol.wheel_config_id')
            ->join('wheel_models as wm', 'wm.id', '=', 'wc.wheel_model_id')
            ->where('ol.order_id', $order->id)
            ->where('wm.is_demo', true)
            ->exists();
    }
}
