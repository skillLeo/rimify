<?php

declare(strict_types=1);

namespace App\Services\Commerce;

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Storefront\VehicleContext;
use App\Enums\OrderLineKind;
use App\Enums\OrderStatus;
use App\Models\Address;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\OrderLineFitment;
use App\Models\Vehicle;
use App\Services\Storefront\Basket;
use App\Support\VehicleName;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Writes an order from the basket, in one transaction: the customer and their addresses, the order
 * as PENDING_PAYMENT, a line per basket line at the price the basket shows, and — on every wheel and
 * Komplettrad line — the verdict frozen as the customer is shown it now (order_line_fitments, R-12).
 *
 * The verdict is resolved again here, at the moment of purchase, by the same resolver the basket
 * uses; a line that is no longer sellable stops the whole order with the basket's own sentence. The
 * caller has already asked Basket::refusalOf; this is the last check before money is asked for.
 *
 * @phpstan-type CustomerData array{email: string, phone: string|null, name: string, street: string, houseNumber: string, zip: string, city: string, billingSame: bool, billingName?: string, billingStreet?: string, billingHouseNumber?: string, billingZip?: string, billingCity?: string}
 */
final class OrderWriter
{
    public function __construct(private readonly FitmentResolver $resolver) {}

    /**
     * @param  CustomerData  $customer
     * @param  array{lines: list<array<string, mixed>>, totals: array<string, mixed>}  $summary
     */
    public function write(Request $request, array $customer, array $summary, string $paymentMethod, ?string $note = null): Order
    {
        $vehicleId = VehicleContext::decode(is_string($raw = $request->cookie(VehicleContext::COOKIE)) ? $raw : null)?->vehicleId;
        $vehicle = $vehicleId === null ? null : Vehicle::query()->find($vehicleId);

        if ($vehicle === null) {
            throw new OrderRefused(Basket::BLOCKED_REFUSAL);
        }

        // Every wheel line's verdict, resolved now: the snapshot is what the customer is shown at the
        // moment of purchase, and a line that stopped being sellable stops the order.
        $verdicts = [];

        foreach ($summary['lines'] as $i => $line) {
            $verdict = $this->resolver->resolve((int) $vehicle->id, (int) $line['wheelConfigId']);

            if (! $verdict->isSellable()) {
                throw new OrderRefused(Basket::BLOCKED_REFUSAL);
            }

            $verdicts[$i] = $verdict;
        }

        return DB::transaction(function () use ($customer, $summary, $vehicle, $verdicts, $paymentMethod, $note, $request): Order {
            [$first, $last] = self::split($customer['name']);
            $person = Customer::query()->create(['email' => $customer['email'], 'firstname' => $first, 'lastname' => $last, 'phone' => $customer['phone']]);
            $delivery = Address::query()->create([
                'customer_id' => $person->id, 'full_name' => $customer['name'], 'street' => $customer['street'],
                'house_number' => $customer['houseNumber'], 'zip_code' => $customer['zip'], 'city' => $customer['city'], 'country' => 'DE',
            ]);
            $billing = $customer['billingSame'] ? $delivery : Address::query()->create([
                'customer_id' => $person->id, 'full_name' => (string) ($customer['billingName'] ?? $customer['name']), 'street' => (string) ($customer['billingStreet'] ?? ''),
                'house_number' => (string) ($customer['billingHouseNumber'] ?? ''), 'zip_code' => (string) ($customer['billingZip'] ?? ''), 'city' => (string) ($customer['billingCity'] ?? ''), 'country' => 'DE',
            ]);

            $totals = $summary['totals'];
            $order = Order::query()->create([
                'order_number' => self::nextNumber(),
                'customer_id' => $person->id,
                'delivery_address_id' => $delivery->id,
                'billing_address_id' => $billing->id,
                'status' => OrderStatus::PendingPayment->value,
                'vehicle_id' => $vehicle->id,
                'vehicle_label' => VehicleName::from($vehicle),
                'vehicle_make' => $vehicle->make,
                'vehicle_hsn' => $vehicle->hsn,
                'vehicle_tsn' => $vehicle->tsn,
                'vehicle_vsn' => $vehicle->vsn,
                'subtotal_cents' => (int) $totals['subtotalCents'],
                'shipping_cents' => (int) ($totals['shippingCents'] ?? 0),
                'tax_cents' => (int) $totals['taxCents'],
                'total_cents' => (int) $totals['totalCents'],
                'currency' => 'EUR',
                'payment_method' => $paymentMethod,
                'shipping_method' => 'standard',
                'note' => $note,
                'placed_at' => now(),
            ]);

            foreach ($summary['lines'] as $i => $line) {
                $isSet = ($line['isSet'] ?? false) === true;
                $orderLine = OrderLine::query()->create([
                    'order_id' => $order->id,
                    'kind' => ($isSet ? OrderLineKind::Package : OrderLineKind::Wheel)->value,
                    'wheel_config_id' => (int) $line['wheelConfigId'],
                    'tyre_variant_id' => $isSet ? ($line['tyre']['id'] ?? null) : null,
                    'package_group' => $isSet ? $i + 1 : null,
                    'label' => self::label($line),
                    'quantity' => (int) $line['quantity'],
                    'unit_price_cents' => (int) $line['unitPriceCents'],
                    'line_total_cents' => (int) $line['lineTotalCents'],
                    'tax_rate_bp' => 1900,
                    'currency' => 'EUR',
                ]);

                self::freeze($orderLine, $vehicle, (int) $line['wheelConfigId'], $verdicts[$i]);
            }

            $tpms = $totals['tpms'] ?? [];

            if (is_array($tpms) && ($tpms['choice'] ?? null) === 'ja' && is_int($tpms['unitPriceCents'] ?? null) && (int) ($tpms['quantity'] ?? 0) > 0) {
                $stored = $request->session()->get(Basket::SESSION_TPMS);
                OrderLine::query()->create([
                    'order_id' => $order->id,
                    'kind' => OrderLineKind::Accessory->value,
                    'tpms_sensor_price_id' => is_array($stored) && is_int($stored['priceId'] ?? null) ? $stored['priceId'] : null,
                    'label' => 'RDKS-Sensoren'.(is_string($tpms['makeLabel'] ?? null) ? ' für '.$tpms['makeLabel'] : ''),
                    'quantity' => (int) $tpms['quantity'],
                    'unit_price_cents' => (int) $tpms['unitPriceCents'],
                    'line_total_cents' => (int) $tpms['totalCents'],
                    'tax_rate_bp' => 1900,
                    'currency' => 'EUR',
                ]);
            }

            return $order;
        });
    }

    /** The verdict as the customer is shown it now, frozen onto the line (append-only, R-12). */
    private static function freeze(OrderLine $line, Vehicle $vehicle, int $configId, FitmentVerdict $verdict): void
    {
        (new OrderLineFitment)->forceFill([
            'order_line_id' => $line->id,
            'vehicle_id' => $vehicle->id,
            'wheel_config_id' => $configId,
            'fitment_id' => $verdict->snapshot->fitmentId,
            'approval_document_id' => $verdict->document?->id,
            'document_revision' => $verdict->snapshot->documentRevision ?? $verdict->document?->revision,
            'verdict' => $verdict->toArray(),
            'verdict_status' => $verdict->status->value,
            'requires_entry' => $verdict->requiresEntry,
            'pdf_sha256' => $verdict->document?->pdfSha256,
            'engine_version' => $verdict->snapshot->engineVersion,
            'computed_at' => $verdict->snapshot->computedAt,
        ])->save();
    }

    /** @param  array<string, mixed>  $line */
    private static function label(array $line): string
    {
        $wheel = trim($line['brandName'].' '.$line['title']).' · '.$line['subtitle'].' · '.$line['sizeLabel'];

        if (($line['isSet'] ?? false) !== true) {
            return $wheel;
        }

        $tyre = is_array($line['tyre'] ?? null) ? (string) ($line['tyre']['label'] ?? $line['tyre']['name'] ?? '') : '';

        return 'Komplettrad: '.$wheel.($tyre === '' ? '' : ' mit '.$tyre);
    }

    /**
     * `RMF-2026-1022`: the year's next number, read under a lock so two checkouts never share one.
     * Compared as a number, not as text: as text `RMF-2026-999` sorts above `RMF-2026-1000`, and
     * the same number would be issued twice.
     */
    private static function nextNumber(): string
    {
        $year = now()->year;
        $prefix = "RMF-{$year}-";
        $last = Order::query()
            ->where('order_number', 'like', $prefix.'%')
            ->lockForUpdate()
            ->selectRaw('MAX(CAST(SUBSTRING(order_number, ?) AS UNSIGNED)) AS n', [strlen($prefix) + 1])
            ->value('n');

        return $prefix.str_pad((string) ((int) $last + 1), 4, '0', STR_PAD_LEFT);
    }

    /** @return array{0: string|null, 1: string|null} first name(s) and last name */
    private static function split(string $name): array
    {
        $name = trim($name);
        $at = strrpos($name, ' ');

        return $at === false ? [null, $name] : [substr($name, 0, $at), substr($name, $at + 1)];
    }
}
