<?php

declare(strict_types=1);

use App\Domain\Fitment\Infrastructure\EloquentTyreCatalogue;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Tyres\KomplettradRefusal;
use App\Domain\Fitment\Tyres\TyreEligibility;
use App\Enums\Axle;
use App\Models\Fitment;
use App\Models\FitmentTyreSize;
use App\Models\TyreVariant;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use Database\Seeders\ApprovalSeeder;
use Database\Seeders\ReferenceDataSeeder;

/*
 * `fitment_tyre_sizes.axle` has existed, been CHECK-constrained and sat inside the unique key
 * since the table was created — and the resolver discarded it (spec §3.3a). The normal shape of a
 * staggered Teilegutachten line is ONE fitment row with axle ALL carrying a FRONT size and a REAR
 * size; dropping the per-size axle put both sizes on both axles and offered a rear-only 275/35
 * as a legal four-wheel set. These tests hold the column and the engine together: if the axle
 * filter is ever reverted, the staggered data that arrives afterwards fails the build instead of
 * the customer.
 */

it('carries a size\'s own axle from the table into the verdict, so a rear-only size never lands on the front', function (): void {
    $this->seed(ReferenceDataSeeder::class);

    $vehicle = Vehicle::factory()->rs4AvantFirst()->create();
    $config = WheelConfig::factory()->havanna85x18()->create();
    $fitment = Fitment::factory()->create(['vehicle_id' => $vehicle->id, 'wheel_config_id' => $config->id]);

    FitmentTyreSize::factory()->for($fitment)->size(245, 40, 18.0)->forAxle(Axle::Front)->create();
    FitmentTyreSize::factory()->for($fitment)->size(275, 35, 18.0)->forAxle(Axle::Rear)->create();

    $verdict = app(FitmentResolver::class)->resolve($vehicle->id, $config->id);

    expect($verdict->isSellable())->toBeTrue()
        ->and($verdict->front->sizes)->toHaveCount(1)
        ->and($verdict->front->sizes[0]->widthMm)->toBe(245)
        ->and($verdict->front->sizes[0]->axle)->toBe('FRONT')
        ->and($verdict->rear->sizes)->toHaveCount(1)
        ->and($verdict->rear->sizes[0]->widthMm)->toBe(275)
        ->and($verdict->rear->sizes[0]->axle)->toBe('REAR')
        ->and($verdict->tyreLayout())->toBe('MIXED');

    // And the Komplettrad rule, through the container binding every surface uses, refuses the set.
    $rearTyre = EloquentTyreCatalogue::toRecord(
        TyreVariant::factory()->size(275, 35, 18.0)->withSpeedSymbol('Y')->make(['load_index' => 100, 'stock_qty' => 8]),
    );

    expect(app(TyreEligibility::class)->permits($verdict, $rearTyre))->toBe(KomplettradRefusal::StaggeredLayout);
});

it('lists an all-axle size on both axles, exactly as before', function (): void {
    $this->seed(ReferenceDataSeeder::class);

    $vehicle = Vehicle::factory()->rs4AvantFirst()->create();
    $config = WheelConfig::factory()->havanna85x18()->create();
    $fitment = Fitment::factory()->create(['vehicle_id' => $vehicle->id, 'wheel_config_id' => $config->id]);

    FitmentTyreSize::factory()->for($fitment)->size(245, 45, 18.0)->create();

    $verdict = app(FitmentResolver::class)->resolve($vehicle->id, $config->id);

    expect($verdict->front->sizes[0]->axle)->toBe('ALL')
        ->and($verdict->rear->sizes[0]->axle)->toBe('ALL')
        ->and($verdict->tyreLayout())->toBe('SAME');
});

it('holds no seeded size on an axle the resolver does not honour', function (): void {
    $this->seed(ReferenceDataSeeder::class);
    $this->seed(ApprovalSeeder::class);

    // No demo approval is staggered today (ApprovalSeeder writes Axle::All throughout), so this
    // loop is empty until real approval data is imported — which is exactly when it must hold.
    $scoped = FitmentTyreSize::query()
        ->where('axle', '!=', Axle::All->value)
        ->with('fitment')
        ->get();

    $resolver = app(FitmentResolver::class);

    foreach ($scoped as $size) {
        $fitment = $size->fitment;
        $verdict = $resolver->resolve($fitment->vehicle_id, $fitment->wheel_config_id);

        // A FRONT-scoped size can never be listed for the rear, nor a REAR-scoped one for the front.
        foreach ($verdict->rear->sizes as $listed) {
            expect($listed->axle)->not->toBe(Axle::Front->value);
        }

        foreach ($verdict->front->sizes as $listed) {
            expect($listed->axle)->not->toBe(Axle::Rear->value);
        }
    }

    // Whatever the seed holds, every row's axle is one the engine understands.
    expect(FitmentTyreSize::query()->whereNotIn('axle', Axle::values())->exists())->toBeFalse();
});
