<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Enums\OrderLineKind;
use App\Enums\OrderStatus;
use App\Models\Address;
use App\Models\Customer;
use App\Models\Fitment;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\OrderLineFitment;
use App\Models\TyreVariant;
use App\Models\WheelConfig;
use App\Support\GermanFormat;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Twenty orders, covering every state the order machine can be in.
 *
 * Every status is represented, including the ones nobody wants to look at — FAILED, EXPIRED,
 * CANCELLED, REFUNDED. A panel demonstrated on twenty paid orders hides exactly the rows whose
 * presentation is hardest to get right, and those are the rows support staff spend their day in.
 *
 * Each wheel line carries a real frozen verdict, computed here by the same resolver the storefront
 * calls. That matters: the admin order view's whole purpose is to answer, eleven months later,
 * what the customer was actually shown — and a snapshot invented by a seeder would teach the panel
 * to render a shape the engine never produces.
 */
class CommerceSeeder extends Seeder
{
    /** Twenty orders across ten statuses, two each. */
    private const STATUSES = [
        OrderStatus::Completed,
        OrderStatus::Completed,
        OrderStatus::Shipped,
        OrderStatus::Shipped,
        OrderStatus::InFulfilment,
        OrderStatus::InFulfilment,
        OrderStatus::Paid,
        OrderStatus::Paid,
        OrderStatus::PendingPayment,
        OrderStatus::PendingPayment,
        OrderStatus::Draft,
        OrderStatus::Draft,
        OrderStatus::Failed,
        OrderStatus::Failed,
        OrderStatus::Expired,
        OrderStatus::Expired,
        OrderStatus::Cancelled,
        OrderStatus::Cancelled,
        OrderStatus::Refunded,
        OrderStatus::Refunded,
    ];

    /** @var list<array{0: string, 1: string, 2: string, 3: string, 4: string}> */
    private const PEOPLE = [
        ['Jonas', 'Weber', 'Lindenstraße', '14', 'Köln'],
        ['Aylin', 'Demir', 'Am Hafen', '3a', 'Hamburg'],
        ['Markus', 'Schneider', 'Bahnhofstraße', '102', 'Stuttgart'],
        ['Petra', 'Bauer', 'Rosenweg', '7', 'Leipzig'],
        ['Sven', 'Krüger', 'Industriering', '28', 'Dortmund'],
        ['Nadine', 'Hoffmann', 'Gartenstraße', '55', 'Bremen'],
        ['Emre', 'Kaya', 'Marktplatz', '9', 'Nürnberg'],
        ['Julia', 'Wagner', 'Feldstraße', '41', 'Dresden'],
        ['Thomas', 'Böhm', 'Hauptstraße', '203', 'Hannover'],
        ['Sarah', 'Lindner', 'Eichenallee', '16', 'Freiburg'],
    ];

    /** @var array<string, string> city => postcode */
    private const ZIPS = [
        'Köln' => '50667', 'Hamburg' => '20457', 'Stuttgart' => '70173', 'Leipzig' => '04109',
        'Dortmund' => '44135', 'Bremen' => '28195', 'Nürnberg' => '90402', 'Dresden' => '01067',
        'Hannover' => '30159', 'Freiburg' => '79098',
    ];

    public function run(): void
    {
        // Guarded on the data rather than on `callOnce`: Laravel's callOnce register is static for
        // the whole process, so under RefreshDatabase it reports a seeder as already run after its
        // rows have been rolled back.
        if (Fitment::query()->doesntExist()) {
            $this->call(ApprovalSeeder::class);
        }

        // Only published fitments, because only those could ever have been sold.
        $fitments = Fitment::query()
            ->visibleToCustomers()
            ->with('wheelConfig')
            ->orderBy('id')
            ->limit(60)
            ->get();

        if ($fitments->isEmpty()) {
            return;
        }

        $tyres = TyreVariant::query()->orderBy('id')->get();
        $resolver = app(FitmentResolver::class);

        foreach (self::STATUSES as $index => $status) {
            $this->seedOrder($index, $status, $fitments, $tyres, $resolver);
        }
    }

    /**
     * @param  Collection<int, Fitment>  $fitments
     * @param  Collection<int, TyreVariant>  $tyres
     */
    private function seedOrder(
        int $index,
        OrderStatus $status,
        Collection $fitments,
        Collection $tyres,
        FitmentResolver $resolver,
    ): void {
        $fitment = $fitments[$index % $fitments->count()];
        $config = $fitment->wheelConfig;

        if (! $config instanceof WheelConfig) {
            return;
        }

        $vehicle = $fitment->vehicle()->first();

        if ($vehicle === null) {
            return;
        }

        [$firstname, $lastname, $street, $houseNumber, $city] = self::PEOPLE[$index % count(self::PEOPLE)];
        $orderNumber = sprintf('RMF-2026-%04d', 1001 + $index);

        DB::transaction(function () use (
            $index, $status, $fitment, $config, $vehicle, $tyres, $resolver,
            $firstname, $lastname, $street, $houseNumber, $city, $orderNumber
        ): void {
            $customer = Customer::updateOrCreate(
                ['email' => sprintf('%s.%s@example.de', mb_strtolower($firstname), mb_strtolower($this->asciiFold($lastname)))],
                ['firstname' => $firstname, 'lastname' => $lastname],
            );

            $address = Address::updateOrCreate(
                [
                    'customer_id' => $customer->id,
                    'street' => $street,
                    'house_number' => $houseNumber,
                ],
                [
                    'full_name' => $firstname.' '.$lastname,
                    'zip_code' => self::ZIPS[$city],
                    'city' => $city,
                    'country' => 'DE',
                ],
            );

            // A Komplettrad every third order, so the package-group behaviour — lines that move
            // together — is present in seeded data rather than only in a test.
            $withTyres = $index % 3 === 0 && $tyres->isNotEmpty();
            $quantity = 4;

            $wheelTotal = $config->price_cents * $quantity;
            $tyre = $withTyres ? $tyres[$index % $tyres->count()] : null;
            $tyreTotal = $tyre === null ? 0 : $tyre->price_cents * $quantity;
            $serviceTotal = $withTyres ? 4 * 1_900 : 0;

            $subtotal = $wheelTotal + $tyreTotal + $serviceTotal;
            // Free shipping over 500 €, which is the threshold the storefront advertises.
            $shipping = $subtotal >= 50_000 ? 0 : 990;
            $total = $subtotal + $shipping;
            // German VAT is included in the displayed price, so the tax figure is extracted from
            // the gross total rather than added to it.
            $tax = (int) round($total - ($total / 1.19));

            $placedAt = now()->subDays(90 - $index * 4);

            $order = Order::updateOrCreate(
                ['order_number' => $orderNumber],
                [
                    'customer_id' => $customer->id,
                    'delivery_address_id' => $address->id,
                    'billing_address_id' => $address->id,
                    'status' => $status->value,
                    // Denormalised so the order still reads correctly after an import
                    // soft-deletes the vehicle a year from now.
                    'vehicle_id' => $vehicle->id,
                    'vehicle_label' => trim($vehicle->make.' '.$vehicle->model.' '.$vehicle->variant),
                    'vehicle_hsn' => $vehicle->hsn,
                    'vehicle_tsn' => $vehicle->tsn,
                    'vehicle_vsn' => $vehicle->vsn,
                    'subtotal_cents' => $subtotal,
                    'shipping_cents' => $shipping,
                    'tax_cents' => $tax,
                    'total_cents' => $total,
                    'currency' => 'EUR',
                    'placed_at' => $status === OrderStatus::Draft ? null : $placedAt,
                    'paid_at' => $status->isPaid() ? $placedAt->copy()->addMinutes(3) : null,
                    'shipped_at' => in_array($status, [OrderStatus::Shipped, OrderStatus::Completed], true)
                        ? $placedAt->copy()->addDays(2)
                        : null,
                    'tracking_code' => in_array($status, [OrderStatus::Shipped, OrderStatus::Completed], true)
                        ? sprintf('00340434%010d', 1_000_000 + $index)
                        : null,
                ],
            );

            $group = $withTyres ? 1 : null;

            $wheelLine = OrderLine::updateOrCreate(
                ['order_id' => $order->id, 'kind' => OrderLineKind::Wheel->value, 'wheel_config_id' => $config->id],
                [
                    'package_group' => $group,
                    // Frozen at purchase: joining to the catalogue would answer what the product
                    // is called today, which is the wrong question on an invoice.
                    'label' => $this->wheelLabel($config),
                    'quantity' => $quantity,
                    'unit_price_cents' => $config->price_cents,
                    'line_total_cents' => $wheelTotal,
                    'tax_rate_bp' => 1900,
                    'currency' => 'EUR',
                ],
            );

            $this->freezeVerdict($wheelLine, $fitment, $resolver);

            if ($tyre !== null) {
                OrderLine::updateOrCreate(
                    ['order_id' => $order->id, 'kind' => OrderLineKind::Tyre->value, 'tyre_variant_id' => $tyre->id],
                    [
                        'package_group' => $group,
                        'label' => $this->tyreLabel($tyre),
                        'quantity' => $quantity,
                        'unit_price_cents' => $tyre->price_cents,
                        'line_total_cents' => $tyreTotal,
                        'tax_rate_bp' => 1900,
                        'currency' => 'EUR',
                    ],
                );

                OrderLine::updateOrCreate(
                    ['order_id' => $order->id, 'kind' => OrderLineKind::Service->value, 'wheel_config_id' => null, 'tyre_variant_id' => null],
                    [
                        'package_group' => $group,
                        'label' => 'Montage und Auswuchten',
                        'quantity' => $quantity,
                        'unit_price_cents' => 1_900,
                        'line_total_cents' => $serviceTotal,
                        'tax_rate_bp' => 1900,
                        'currency' => 'EUR',
                    ],
                );
            }
        });
    }

    /**
     * The snapshot, from the same resolver the storefront calls.
     *
     * Append-only: if a snapshot already exists for this line the seeder leaves it exactly as it
     * is. Re-running a seeder is not a reason to rewrite evidence, and both the model and a
     * database trigger would refuse anyway.
     */
    private function freezeVerdict(OrderLine $line, Fitment $fitment, FitmentResolver $resolver): void
    {
        if (OrderLineFitment::query()->whereKey($line->id)->exists()) {
            return;
        }

        $verdict = $resolver->resolve($fitment->vehicle_id, $fitment->wheel_config_id);
        // The FK is NOT NULL, so a fitment always has its document — the revision it names is the
        // one this line was sold against, and it may since have been superseded.
        $document = $fitment->approvalDocument;

        OrderLineFitment::create([
            'order_line_id' => $line->id,
            'vehicle_id' => $fitment->vehicle_id,
            'wheel_config_id' => $fitment->wheel_config_id,
            'fitment_id' => $fitment->id,
            'approval_document_id' => $fitment->approval_document_id,
            'document_revision' => $document->revision,
            'verdict' => $verdict->toArray(),
            'verdict_status' => $verdict->status->value,
            'requires_entry' => $verdict->requiresEntry,
            'pdf_sha256' => $document->pdf_sha256,
            'engine_version' => $verdict->snapshot->engineVersion,
            'computed_at' => $verdict->snapshot->computedAt,
        ]);
    }

    /** `8,5J × 18 · ET 35 · 5/112` — the description as the customer read it. */
    private function wheelLabel(WheelConfig $config): string
    {
        $model = $config->wheelModel;
        $finish = $config->wheelFinish;

        return trim(sprintf(
            '%s %s · %s · %s',
            $model->brand->name,
            $model->name,
            $finish->name_de,
            GermanFormat::wheelLabel(
                (float) $config->width_in,
                (float) $config->diameter_in,
                (int) $config->et_mm,
                (int) $config->bolt_holes,
                (float) $config->bolt_circle_mm,
                (float) $config->centre_bore_mm,
            ),
        ));
    }

    private function tyreLabel(TyreVariant $tyre): string
    {
        return trim(sprintf(
            '%s %s · %s · %s',
            $tyre->brand->name,
            $tyre->name,
            ucfirst($tyre->season),
            GermanFormat::tyreSize(
                (int) $tyre->width_mm,
                (int) $tyre->aspect,
                (float) $tyre->diameter_in,
                (int) $tyre->load_index,
                $tyre->speed_symbol,
            ),
        ));
    }

    /** Email-safe local parts: `Krüger` must not become an invalid address. */
    private function asciiFold(string $name): string
    {
        return strtr($name, [
            'ä' => 'ae', 'ö' => 'oe', 'ü' => 'ue', 'ß' => 'ss',
            'Ä' => 'Ae', 'Ö' => 'Oe', 'Ü' => 'Ue',
        ]);
    }
}
