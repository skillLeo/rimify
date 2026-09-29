<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\BuildFromName;

/*
 * QA „Letzte Runde (G)“, G-03 (S2) — docs/qa/BUGS.md.
 *
 * BuildFromName promises „Anything else is asked, never guessed“ and guards exactly one spelling of the four-door
 * BMW: „4er-GranCoupé“, glued. BMW writes „4er Gran Coupé“ with a space, and the Nachtrag this shop entered prints
 * it so („4er Gran Coupe (F36)“, page 9 — docs/gutachten/fahrzeuge.json) — a whole word „Coupé“, read as a Coupé.
 * And a qualifier typed into the variant the way „5L ohne Allradlenkung“ was („ohne Allrad“, „nicht 4x4“) is read
 * as the drive it rules out. Either one turns a row printed „nur Coupé“ or „nur mit Allradantrieb“ into PERMITTED
 * for a car it does not cover, before the owner is asked anything.
 */

it('G-03: derives nothing from a word the rest of the name contradicts', function (string $model, ?string $variant, string $fact): void {
    expect(BuildFromName::of($model, $variant)[$fact])->toBeNull();
})->with([
    'BMW 4er Gran Coupé, as BMW writes it' => ['4er Gran Coupé', '420i', 'bodyForm'],
    '4er Gran Coupe (F36), as the Nachtrag prints it' => ['4er Gran Coupe (F36)', '3C', 'bodyForm'],
    'ohne Allrad in the variant' => ['X1', 'sDrive18i ohne Allrad', 'driveAxle'],
    'nicht 4x4 in the variant' => ['5er-Reihe', '5L nicht 4x4', 'driveAxle'],
]);
