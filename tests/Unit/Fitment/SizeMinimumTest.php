<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\TyreRecord;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\Tyres\KomplettradRefusal;
use App\Domain\Fitment\Tyres\TyreEligibility;
use App\Domain\Fitment\Verdict\AxleRequirement;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\MinSource;
use Tests\Support\Fitment\FitmentFixtures;
use Tests\Support\Fitment\InMemoryTyreCatalogue;
use Tests\Support\Fitment\Rebuild;

/*
 * D-431, the operator's decision of 08.11.2026: a size is checked against its own minimum, never against a neighbour's —
 * the Gutachten prints the load index and the symbol beside each size, and that is what it approves the size with. Before,
 * the axle took the strictest figure any of its sizes printed, and a tyre the paper approves for its own size was refused.
 *
 * The demo RS 4's axles derive 93Y; the two sizes print more than that, so the papers' figures are what bind.
 */

function smEligibility(TyreRecord ...$tyres): TyreEligibility
{
    return new TyreEligibility(new InMemoryTyreCatalogue(array_values($tyres)), new SpeedSymbolDeriver(FitmentFixtures::tables()));
}

function smTyre(int $id = 1, int $widthMm = 245, int $aspect = 45, int $loadIndex = 95, string $speedSymbol = 'Y'): TyreRecord
{
    return new TyreRecord(
        id: $id, widthMm: $widthMm, aspect: $aspect, diameterIn: 18.0, loadIndex: $loadIndex, speedSymbol: $speedSymbol,
        speedRank: FitmentFixtures::tables()->speedSymbol($speedSymbol)?->rank ?? 0, priceCents: 18_900, sellable: true,
        brandName: 'Demo', name: 'Sport', season: 'sommer',
    );
}

/** @param list<TyreSize> $sizes */
function smResolve(array $sizes): FitmentVerdict
{
    return FitmentFixtures::resolver([FitmentFixtures::row(sizes: $sizes)])->resolve(1, FitmentFixtures::WHEEL_CONFIG_ID);
}

function smVerdict(): FitmentVerdict
{
    return smResolve([
        new TyreSize(245, 45, 18.0, documentMinLoadIndex: 95, documentMinSpeedSymbol: 'Y'),
        new TyreSize(255, 40, 18.0, documentMinLoadIndex: 98, documentMinSpeedSymbol: 'Y'),
    ]);
}

it('sells a tyre of one size on what the paper prints beside that size, not beside its neighbour', function (): void {
    $verdict = smVerdict();
    $own = smTyre(id: 1, loadIndex: 95);

    expect(smEligibility($own)->permits($verdict, $own))->toBeNull()
        ->and(array_map(static fn ($t): int => $t->id, smEligibility($own)->offerFor($verdict)->tyres))->toBe([1]);
});

it('still refuses a tyre below its own size\'s printed minimum — the change never sells below the paper', function (): void {
    $verdict = smVerdict();

    expect(smEligibility()->permits($verdict, smTyre(loadIndex: 94)))->toBe(KomplettradRefusal::BelowMinimum)
        ->and(smEligibility()->permits($verdict, smTyre(widthMm: 255, aspect: 40, loadIndex: 97)))->toBe(KomplettradRefusal::BelowMinimum)
        ->and(smEligibility()->permits($verdict, smTyre(widthMm: 255, aspect: 40, loadIndex: 98)))->toBeNull()
        ->and(smEligibility()->permits($verdict, smTyre(speedSymbol: 'W')))->toBe(KomplettradRefusal::BelowMinimum);
});

it('keeps the axle\'s strictest figure for the verdict, and each size\'s own beside it', function (): void {
    $front = smVerdict()->front;

    expect($front->minLoadIndex)->toBe(98)
        ->and($front->minimumFor(new TyreSize(245, 45, 18.0)))->toBe(['loadIndex' => 95, 'speedSymbol' => 'Y'])
        ->and($front->minimumFor(new TyreSize(255, 40, 18.0)))->toBe(['loadIndex' => 98, 'speedSymbol' => 'Y'])
        // A size the axle does not list has no minimum of its own: the axle's strictest stands.
        ->and($front->minimumFor(new TyreSize(225, 40, 18.0)))->toBe(['loadIndex' => 98, 'speedSymbol' => 'Y']);
});

it('freezes each size\'s minimum with the answer, and an answer frozen without them falls back to the strictest', function (): void {
    $front = smVerdict()->front;
    $old = $front->toArray();
    unset($old['bySize']);

    expect(AxleRequirement::fromArray($front->toArray())->minimumFor(new TyreSize(245, 45, 18.0)))->toBe(['loadIndex' => 95, 'speedSymbol' => 'Y'])
        ->and(AxleRequirement::fromArray($old)->minimumFor(new TyreSize(245, 45, 18.0)))->toBe(['loadIndex' => 98, 'speedSymbol' => 'Y']);
});

it('raises a size’s minimum to the symbol printed beside it where its own minimum asks for less', function (): void {
    // A backstop (D-433): the live axle already folds the printed symbol in, so only a verdict built otherwise reaches it.
    $sizes = [new TyreSize(245, 45, 18.0, documentMinSpeedSymbol: 'Y')];
    $live = smResolve($sizes);
    $axle = new AxleRequirement($sizes, 93, 'W', MinSource::Derived);
    $verdict = Rebuild::of($live, ['front' => $axle, 'rear' => $axle]);

    expect(smEligibility()->permits($verdict, smTyre(loadIndex: 95, speedSymbol: 'W')))->toBe(KomplettradRefusal::BelowMinimum)
        ->and(smEligibility()->permits($verdict, smTyre(loadIndex: 95, speedSymbol: 'Y')))->toBeNull();
});
