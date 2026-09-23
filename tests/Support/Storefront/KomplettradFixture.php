<?php

declare(strict_types=1);

namespace Tests\Support\Storefront;

use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Storefront\VehicleContext;
use App\Enums\DocumentStatus;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Models\TyreVariant;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use RuntimeException;

/**
 * A vehicle and an in-stock wheel configuration the seeded approvals permit as a four-wheel set,
 * plus the tyres to go with it — found through the resolver, never written by hand, so the
 * fixture can only ever describe a combination the engine really permits (R-13).
 */
final class KomplettradFixture
{
    /** What the product page sells: a set of four. */
    public const SET = 4;

    private function __construct(
        public readonly Vehicle $vehicle,
        public readonly WheelConfig $config,
        public readonly ApprovalDocument $document,
        public readonly FitmentVerdict $verdict,
        /** The permitted size both axles share. */
        public readonly TyreSize $size,
    ) {}

    public static function permitted(): self
    {
        $resolver = app(FitmentResolver::class);

        // A sellable verdict with a size both axles share, a usable minimum on each, and nothing
        // that refuses a Komplettrad before a tyre is even looked at — on a rim with stock for four.
        $found = Fitment::query()
            ->visibleToCustomers()
            ->with('wheelConfig')
            ->lazyById(50)
            ->map(static fn (Fitment $fitment): array => [
                $fitment,
                $resolver->resolve((int) $fitment->vehicle_id, (int) $fitment->wheel_config_id),
            ])
            ->first(static function (array $pair): bool {
                /** @var Fitment $fitment */
                /** @var FitmentVerdict $verdict */
                [$fitment, $verdict] = $pair;
                $config = $fitment->wheelConfig;

                return $config instanceof WheelConfig
                    && $config->stock_qty >= self::SET
                    && $verdict->isSellable()
                    && $verdict->tyreLayout() === 'SAME'
                    && $verdict->front->hasPermittedSizes()
                    && $verdict->front->hasUsableMinimum()
                    && $verdict->rear->hasUsableMinimum()
                    && ! collect($verdict->conditions)->contains(
                        static fn (Condition $condition): bool => $condition->affectsTyreChoice,
                    );
            });

        if ($found === null) {
            throw new RuntimeException('The demo approvals must permit at least one in-stock wheel with tyre sizes.');
        }

        /** @var Fitment $fitment */
        /** @var FitmentVerdict $verdict */
        [$fitment, $verdict] = $found;

        return new self(
            vehicle: Vehicle::query()->findOrFail((int) $fitment->vehicle_id),
            config: WheelConfig::query()->findOrFail((int) $fitment->wheel_config_id),
            document: ApprovalDocument::query()->findOrFail((int) $fitment->approval_document_id),
            verdict: $verdict,
            size: $verdict->front->sizes[0],
        );
    }

    /**
     * The cookie the storefront reads the vehicle from — passed through `withCookies()`, which
     * encrypts it the way the middleware expects.
     *
     * @return array<string, string>
     */
    public function cookies(?Vehicle $vehicle = null): array
    {
        return [VehicleContext::COOKIE => (new VehicleContext(($vehicle ?? $this->vehicle)->id, true))->encode()];
    }

    /**
     * A tyre the verdict permits as a set of four: the permitted size, the top speed symbol and a
     * load index above any minimum the demo cars derive. Overrides make it fail one rule at a time.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function tyre(array $attributes = []): TyreVariant
    {
        return TyreVariant::factory()
            ->size($this->size->widthMm, $this->size->aspect, $this->size->diameterIn)
            ->withSpeedSymbol('(Y)')
            ->create([
                'load_index' => 120,
                'stock_qty' => 8,
                'price_cents' => 15_000,
                'currency' => 'EUR',
                'is_demo' => false,
                ...$attributes,
            ]);
    }

    /**
     * A configuration of the same model that no document mentions for any car. The engine holds
     * no evidence either way about it and answers UNKNOWN; NOT_PERMITTED it reserves for a wheel
     * a document knows and does not cover (R-07, `FitmentResolver::negativeWithoutCoverage()`).
     * Taken from the demo catalogue where one exists, else made in a width no document lists.
     */
    public function undocumentedConfig(): WheelConfig
    {
        $existing = WheelConfig::query()
            ->where('wheel_model_id', $this->config->wheel_model_id)
            ->whereDoesntHave('fitments')
            ->where('stock_qty', '>=', self::SET)
            ->orderBy('id')
            ->first();

        return $existing ?? WheelConfig::factory()->create([
            'wheel_model_id' => $this->config->wheel_model_id,
            'wheel_finish_id' => $this->config->wheel_finish_id,
            'width_in' => 6.0,
            'stock_qty' => self::SET * 2,
        ]);
    }

    /** The document behind this verdict is superseded: the fitment stops being visible to customers. */
    public function supersedeDocument(): void
    {
        $this->document->forceFill(['status' => DocumentStatus::Superseded])->save();
    }

    /**
     * The same car under another make: a copy of the vehicle and of every fitment row that
     * permits this configuration on it — tyre sizes and conditions included — so the engine
     * answers exactly as it does for the original and only the make, and with it the RDKS price,
     * differs (docs/specs/komplettrad.md §4.2).
     */
    public function vehicleOfMake(string $make): Vehicle
    {
        $vehicle = $this->vehicle->replicate();
        $vehicle->make = $make;
        $vehicle->source_vehicle_id = (int) Vehicle::withTrashed()->max('source_vehicle_id') + 1;
        $vehicle->save();

        $rows = Fitment::query()
            ->where('vehicle_id', $this->vehicle->id)
            ->where('wheel_config_id', $this->config->id)
            ->with(['tyreSizes', 'conditions'])
            ->get();

        foreach ($rows as $row) {
            $copy = $row->replicate();
            $copy->vehicle_id = $vehicle->id;
            $copy->save();

            foreach ($row->tyreSizes as $size) {
                $sizeCopy = $size->replicate();
                $sizeCopy->fitment_id = $copy->id;
                $sizeCopy->save();
            }

            foreach ($row->conditions as $condition) {
                $copy->conditions()->attach($condition->getKey(), [
                    'note_de' => $condition->getRelationValue('pivot')?->getAttribute('note_de'),
                ]);
            }
        }

        return $vehicle;
    }

    /**
     * One Komplettrad line as the session holds it (docs/specs/komplettrad.md §4.2).
     *
     * @return array<string, array<string, mixed>>
     */
    public function sessionLine(TyreVariant $tyre, ?int $weightColourId, int $quantity = self::SET): array
    {
        return [
            'wheel:'.$this->config->id.':tyre:'.$tyre->id => [
                'kind' => 'WHEEL',
                'wheelConfigId' => $this->config->id,
                'tyreVariantId' => $tyre->id,
                'weightColourId' => $weightColourId,
                'quantity' => $quantity,
            ],
        ];
    }
}
