<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Storefront\VehicleContext;
use App\Http\Controllers\Admin\GutachtenController;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Support\GermanFormat;
use Database\Seeders\CommerceSeeder;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;

/**
 * The product page states the price of ONE rim, as the basket charges it, with the set of four
 * formatted beside it (docs/specs/komplettrad.md §9) — and opens the Gutachten the verdict rests on
 * at the page its row cites.
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
});

it('prices one rim, shows the set of four, and links the Gutachten at the row’s page', function (): void {
    $vehicle = Vehicle::query()->where('hsn', '0005')->where('tsn', 'CKT')->firstOrFail();
    $resolver = app(FitmentResolver::class);
    $config = WheelConfig::query()->orderBy('id')->get()
        ->first(fn (WheelConfig $c): bool => $resolver->resolve((int) $vehicle->id, (int) $c->id)->isSellable());
    expect($config)->not->toBeNull();

    $verdict = $resolver->resolve((int) $vehicle->id, (int) $config->id);
    $page = $verdict->document?->sourcePage;
    // A link is only built to where the file is (D-229), so the file is there.
    Storage::fake(GutachtenController::DISK)->put((string) $verdict->document?->pdfKey, "%PDF-1.4\n");

    $this->withCookies([VehicleContext::COOKIE => (new VehicleContext((int) $vehicle->id, true))->encode()])
        ->get('/felgen/'.$config->wheelModel->slug)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $p) => $p
            ->where('configs', function ($configs) use ($config, $page): bool {
                $row = collect($configs)->firstWhere('id', $config->id);

                return $row['price'] === GermanFormat::money((int) $config->price_cents)
                    && $row['priceForFour'] === GermanFormat::money((int) $config->price_cents * 4)
                    && is_string($row['verdict']['document']['pdf']['url'] ?? null)
                    && ($page === null || str_ends_with($row['verdict']['document']['pdf']['url'], '#page='.$page));
            })
        );
});
