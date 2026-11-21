<?php

declare(strict_types=1);

use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Domain\Fitment\Verdict\ConditionLevel;
use App\Domain\Fitment\Verdict\HintColour;

/*
 * D-488 (the client's review of 19.11.2026): what one chosen size or combination asks, for the Komplettrad's tyre step — its
 * standing and the colour its codes carry in the admin (D-439), loudest first. Presentation only, as the verdict's own hint.
 */

it('reads nothing as „keine“, only Hinweise as „hinweise“, and an Auflage in its loudest colour, yellow where it has none', function (): void {
    $red = Condition::ofKind('A1', ConditionKind::Karosseriearbeit, 'Radlauf bördeln.', hintColour: HintColour::Red);
    $green = Condition::ofKind('A3', ConditionKind::Karosseriearbeit, 'Kotflügelkante umlegen.', hintColour: HintColour::Green);
    $plain = Condition::ofKind('A2', ConditionKind::Karosseriearbeit, 'Distanzscheiben montieren.');
    // A kind whose floor lets it be a Hinweis; work on the car never can be (ConditionLevel::atLeastFloorOf()).
    $note = Condition::ofKind('H1', ConditionKind::Hinweis, 'Nur ein Hinweis.', level: ConditionLevel::Hinweis, hintColour: HintColour::Red);

    expect(HintColour::standingOf([], false))->toBe(['standing' => 'keine', 'hint' => null])
        ->and(HintColour::standingOf([$note], false))->toBe(['standing' => 'hinweise', 'hint' => null])
        ->and(HintColour::standingOf([$plain], false))->toBe(['standing' => 'auflagen', 'hint' => 'yellow'])
        ->and(HintColour::standingOf([$green], false))->toBe(['standing' => 'auflagen', 'hint' => 'green'])
        ->and(HintColour::standingOf([$green, $plain, $red, $note], false))->toBe(['standing' => 'auflagen', 'hint' => 'red']);
});

it('reads an Eintragung alone as an Auflage: the yellow caution, never „keine“', function (): void {
    expect(HintColour::standingOf([], true))->toBe(['standing' => 'auflagen', 'hint' => 'yellow']);
});
