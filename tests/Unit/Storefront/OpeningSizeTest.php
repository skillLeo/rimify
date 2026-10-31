<?php

declare(strict_types=1);

use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\VerdictReason;
use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Services\Storefront\OpeningSize;
use Tests\Support\Fitment\FitmentFixtures;

/*
 * The size a product page opens on and its card speaks for (M-6): one rule, so card and page give one answer.
 */

const OS_RS4 = 1;

function osVerdict(VerdictStatus $status): FitmentVerdict
{
    return match ($status) {
        VerdictStatus::Permitted => FitmentFixtures::resolver([FitmentFixtures::row()])->resolve(OS_RS4, FitmentFixtures::WHEEL_CONFIG_ID),
        VerdictStatus::Unknown => FitmentFixtures::resolver([FitmentFixtures::row(sizes: [])])->resolve(OS_RS4, FitmentFixtures::WHEEL_CONFIG_ID),
        default => FitmentFixtures::resolver([FitmentFixtures::row(widthMin: 9.0, widthMax: 10.0)])->resolve(OS_RS4, FitmentFixtures::WHEEL_CONFIG_ID),
    };
}

it('opens on a sold, available size before a cheaper one that is not available, and before any unsold one', function (): void {
    $sold = osVerdict(VerdictStatus::Permitted);
    $open = osVerdict(VerdictStatus::Unknown);
    $refused = osVerdict(VerdictStatus::NotPermitted);

    expect($sold->isSellable())->toBeTrue()
        ->and($open->reason?->code)->toBe(VerdictReason::TYRE_SIZES_NOT_RECORDED)
        ->and($refused->status)->toBe(VerdictStatus::NotPermitted);

    expect(OpeningSize::pick([
        ['id' => 1, 'verdict' => $refused, 'inStock' => true, 'priceCents' => 100],
        ['id' => 2, 'verdict' => $open, 'inStock' => true, 'priceCents' => 200],
        ['id' => 3, 'verdict' => $sold, 'inStock' => false, 'priceCents' => 300],
        ['id' => 4, 'verdict' => $sold, 'inStock' => true, 'priceCents' => 900],
    ]))->toBe(4);
});

it('of the unsold, opens on the one whose answer is still open before the refused, whatever they cost', function (): void {
    expect(OpeningSize::pick([
        ['id' => 1, 'verdict' => osVerdict(VerdictStatus::NotPermitted), 'inStock' => true, 'priceCents' => 100],
        ['id' => 2, 'verdict' => osVerdict(VerdictStatus::Unknown), 'inStock' => true, 'priceCents' => 500],
    ]))->toBe(2);
});

it('without a car, opens on the cheapest available size, the oldest on a tie', function (): void {
    expect(OpeningSize::pick([
        ['id' => 7, 'verdict' => null, 'inStock' => false, 'priceCents' => 100],
        ['id' => 9, 'verdict' => null, 'inStock' => true, 'priceCents' => 300],
        ['id' => 8, 'verdict' => null, 'inStock' => true, 'priceCents' => 300],
    ]))->toBe(8)
        ->and(OpeningSize::pick([]))->toBeNull();
});
