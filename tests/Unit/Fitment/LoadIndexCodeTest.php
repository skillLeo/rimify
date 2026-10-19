<?php

declare(strict_types=1);

use App\Domain\Fitment\Derivation\LoadIndexDeriver;
use App\Domain\Fitment\Verdict\LoadIndexCode;
use App\Services\Admin\Approvals\LoadLimitCheck;
use App\Support\GermanFormat;
use Tests\Support\Fitment\FitmentFixtures;

/*
 * The load-index table up to 120 (D-310, the operator's brief of 19.10.2026 §1): a document's code names the index by
 * its last two digits, the release check holds a limit at a new index to twice its capacity as it does at the old ones,
 * and the derivation reaches 120 — and stops there, open rather than guessed.
 */

it('reads a load-index code by its last two digits: T88 is 88, T00 is 100, T12 is 112', function (string $code, ?int $index): void {
    expect(LoadIndexCode::indexNamedBy($code))->toBe($index);
})->with([
    'T70' => ['T70', 70],
    'T88' => ['T88', 88],
    'T99' => ['T99', 99],
    'T00' => ['T00', 100],
    'T05 — read as 5 before, binding no tyre' => ['T05', 105],
    'T12' => ['T12', 112],
    'T20' => ['T20', 120],
    'T21 — above the table, no tyre meets it' => ['T21', 121],
    'lower case and spaces as typed' => [' t09 ', 109],
    'an axle-load note' => ['140', null],
    'three digits' => ['T112', null],
]);

it('holds a limit at a new index to twice its capacity, as at the old ones', function (): void {
    $check = new LoadLimitCheck(new LoadIndexDeriver(FitmentFixtures::tables()));

    // T12 → 2 × 1.120 kg; T20 → 2 × 1.400 kg — as Annex IV of Regulation No 30 prints them.
    expect($check->problem('T12', 2240))->toBeNull()
        ->and($check->problem('T20', 2800))->toBeNull()
        ->and($check->problem('T12', 2250))->toBe(sprintf(
            'T12 steht für Tragfähigkeitsindex 112: das wären 2 × %s = %s, eingetragen sind %s. Stimmt die Zahl mit dem Gutachten überein, bestätige sie mit einem Satz.',
            GermanFormat::kilograms(1120),
            GermanFormat::kilograms(2240),
            GermanFormat::kilograms(2250),
        ))
        // Above the table there is no capacity to compare: never passed as read, the limit binds no tyre (T21 = 121).
        ->and($check->problem('T21', 2900))->toBeNull();
});

it('derives an index up to 120 for a heavy axle, and leaves an axle beyond it open', function (): void {
    $deriver = new LoadIndexDeriver(FitmentFixtures::tables());

    // 2.240 kg ÷ 2 = 1.120 kg a tyre: index 112. Before D-310 the table stopped at 1.030 kg and this car got no answer.
    expect($deriver->forAxle(2240)?->index)->toBe(112)
        ->and($deriver->forAxle(2241)?->index)->toBe(113)
        ->and($deriver->forAxle(2800)?->index)->toBe(120)
        // 2.801 kg needs more than 1.400 kg a tyre: no index the table prints — null, never a guess (UNKNOWN downstream).
        ->and($deriver->forAxle(2801))->toBeNull();
});
