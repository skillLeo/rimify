<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\TyreRecord;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Infrastructure\EloquentTyreCatalogue;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Tyres\KomplettradRefusal;
use App\Domain\Fitment\Tyres\TyreEligibility;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Enums\OrderLineKind;
use App\Enums\OrderStatus;
use App\Models\Fitment;
use App\Models\FitmentTyreSize;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\OrderLineFitment;
use App\Models\SpeedSymbolEntry;
use App\Models\TyreVariant;
use App\Models\WheelConfig;
use App\Models\WheelModel;
use Database\Seeders\CommerceSeeder;
use Inertia\Testing\AssertableInertia;

/**
 * Findings #19, #42, #43 and ACCURACY.md §3.1 F3: seeded orders are demonstration data. The order
 * page says so, hides their invented tracking numbers and names no carrier; a seeded Komplettrad
 * only ever pairs a wheel with a tyre its fitment permits; and demo orders are seeded in the local
 * and testing environments only. The frozen snapshots are never rewritten (R-12).
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
});

it('marks a seeded order as demonstration data and hides its tracking number', function (): void {
    $order = Order::query()->where('status', OrderStatus::Shipped->value)->orderBy('id')->firstOrFail();

    expect($order->tracking_code)->not->toBeNull();

    $this->get('/bestellung/'.$order->order_number)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Bestellung/Index')
            ->where('demo', true)
            ->where('order.trackingCode', null)
            // The frozen verdict is still there, exactly as written.
            ->has('lines.0.verdict.status')
        );
});

it('shows a real order as it is', function (): void {
    WheelModel::query()->update(['is_demo' => false]);
    $order = Order::query()->where('status', OrderStatus::Shipped->value)->orderBy('id')->firstOrFail();

    $this->get('/bestellung/'.$order->order_number)
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('demo', false)
            ->where('order.trackingCode', $order->tracking_code)
        );
});

it('pairs a seeded Komplettrad only with a tyre its fitment permits', function (): void {
    // Every seeded order has its wheel; a tyre line exists only where a permitted tyre does.
    expect(OrderLine::query()->where('kind', OrderLineKind::Wheel->value)->count())->toBeGreaterThan(0);

    $tyreLines = OrderLine::query()->where('kind', OrderLineKind::Tyre->value)->get();

    foreach ($tyreLines as $tyreLine) {
        $wheelLine = OrderLine::query()
            ->where('order_id', $tyreLine->order_id)
            ->where('kind', OrderLineKind::Wheel->value)
            ->firstOrFail();

        $config = WheelConfig::query()->findOrFail($wheelLine->wheel_config_id);
        $tyre = TyreVariant::query()->withTrashed()->findOrFail($tyreLine->tyre_variant_id);
        $snapshot = OrderLineFitment::query()->findOrFail($wheelLine->id);
        $fitment = Fitment::query()->findOrFail($snapshot->fitment_id);

        expect((float) $tyre->diameter_in)->toBe((float) $config->diameter_in)
            ->and($tyreLine->package_group)->toBe($wheelLine->package_group);

        $listed = FitmentTyreSize::query()
            ->where('fitment_id', $fitment->id)
            ->where('width_mm', $tyre->width_mm)
            ->where('aspect', $tyre->aspect)
            ->where('diameter_in', $tyre->diameter_in)
            ->exists();

        expect($listed)->toBeTrue("order line {$tyreLine->id} pairs a tyre size the fitment does not list");
    }
});

it('pairs a seeded Komplettrad through TyreEligibility, the rule every surface applies', function (): void {
    $resolver = app(FitmentResolver::class);
    $eligibility = app(TyreEligibility::class);

    // A sellable verdict with a size both axles share, a usable minimum on each, and nothing
    // that refuses a Komplettrad before a tyre is even looked at.
    $found = Fitment::query()->visibleToCustomers()->with('wheelConfig')->lazyById(50)
        ->map(fn (Fitment $f): array => [$f, $resolver->resolve($f->vehicle_id, $f->wheel_config_id)])
        ->first(function (array $pair): bool {
            [, $verdict] = $pair;

            return $verdict->isSellable()
                && $verdict->tyreLayout() === 'SAME'
                && $verdict->front->hasPermittedSizes()
                && $verdict->front->hasUsableMinimum() && $verdict->rear->hasUsableMinimum()
                && collect($verdict->conditions)->doesntContain(fn ($condition): bool => $condition->affectsTyreChoice);
        });

    expect($found)->not->toBeNull('the demo approvals must permit at least one wheel with tyre sizes');

    /** @var FitmentVerdict $verdict */
    [, $verdict] = $found;
    $size = $verdict->front->sizes[0];
    $ranks = SpeedSymbolEntry::query()->pluck('speed_rank', 'symbol')->map(fn (mixed $r): int => (int) $r)->all();

    // The minimum four identical tyres must meet: the stricter axle, raised by anything the
    // listed size itself states (R-06, spec §3.3 rule 8).
    $rankOf = fn (?string $symbol): int => $symbol === null ? 0 : ($ranks[$symbol] ?? 0);
    $listed = [$size, collect($verdict->rear->sizes)->first(fn (TyreSize $r): bool => $r->matches($size))];
    $minLoad = max(
        (int) $verdict->front->minLoadIndex,
        (int) $verdict->rear->minLoadIndex,
        ...array_map(fn (?TyreSize $s): int => $s?->documentMinLoadIndex ?? 0, $listed),
    );
    $minRank = max(
        $rankOf($verdict->front->minSpeedSymbol),
        $rankOf($verdict->rear->minSpeedSymbol),
        ...array_map(fn (?TyreSize $s): int => $rankOf($s?->documentMinSpeedSymbol), $listed),
    );
    $minSymbol = (string) array_search($minRank, $ranks, true);
    $slower = collect($ranks)->filter(fn (int $rank): bool => $rank < $minRank)->sortDesc()->keys()->first();

    $tyre = fn (array $attributes): TyreRecord => EloquentTyreCatalogue::toRecord(
        TyreVariant::factory()
            ->size($size->widthMm, $size->aspect, $size->diameterIn)
            ->withSpeedSymbol($minSymbol)
            ->make(['load_index' => $minLoad, 'stock_qty' => 4, ...$attributes]),
    );

    expect($eligibility->permits($verdict, $tyre([]), 4))->toBeNull()
        ->and($eligibility->permits($verdict, $tyre(['diameter_in' => $size->diameterIn + 1])))->toBe(KomplettradRefusal::DiameterMismatch)
        ->and($eligibility->permits($verdict, $tyre(['width_mm' => $size->widthMm + 100])))->toBe(KomplettradRefusal::SizeNotPermitted)
        ->and($eligibility->permits($verdict, $tyre(['load_index' => $minLoad - 1])))->toBe(KomplettradRefusal::BelowMinimum)
        ->and($eligibility->permits($verdict, $tyre(['stock_qty' => 3]), 4))->toBe(KomplettradRefusal::OutOfStock);

    if ($slower !== null) {
        expect($eligibility->permits($verdict, $tyre(['speed_symbol' => $slower, 'speed_rank' => $ranks[$slower]])))
            ->toBe(KomplettradRefusal::BelowMinimum);
    }

    // A verdict restored from a frozen snapshot is evidence of what was decided, never the input
    // to a fresh decision: it is refused outright, whatever it says.
    expect($eligibility->permits(FitmentVerdict::fromArray($verdict->toArray()), $tyre([])))
        ->toBe(KomplettradRefusal::VerdictRestored);
});

it('leaves every frozen snapshot untouched when it runs again', function (): void {
    $before = OrderLineFitment::query()->orderBy('order_line_id')->get()->map->getAttributes()->all();

    $this->seed(CommerceSeeder::class);

    expect(OrderLineFitment::query()->orderBy('order_line_id')->get()->map->getAttributes()->all())->toBe($before);
});
