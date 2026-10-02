<?php

declare(strict_types=1);

use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Domain\Fitment\Verdict\ConditionLevel;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\VerdictStatus;
use Tests\Support\Fitment\FitmentFixtures;

/*
 * The client's #23, as the operator answered it (D-104): how loud an Auflage is — Hinweis, Auflage, nicht zulässig —
 * decides the words and the colour, never the verdict; an Abnahme or work on the body is never a Hinweis.
 */

function levelledVerdict(Condition ...$conditions): FitmentVerdict
{
    return FitmentFixtures::resolver([FitmentFixtures::row(conditions: array_values($conditions))])->resolve(1, FitmentFixtures::WHEEL_CONFIG_ID);
}

it('gives every Auflage the operator\'s default, never below its kind\'s floor', function (): void {
    $default = static fn (string $code, ConditionKind $kind, string $text = 'Ein Satz.'): ConditionLevel => ConditionLevel::defaultFor($code, $kind, $text);

    expect($default('A14', ConditionKind::Hinweis))->toBe(ConditionLevel::Hinweis)
        ->and($default('A18', ConditionKind::Hinweis))->toBe(ConditionLevel::Hinweis)
        ->and($default('R37', ConditionKind::ReifenKombination))->toBe(ConditionLevel::Hinweis)
        ->and($default('R70', ConditionKind::ReifenKombination))->toBe(ConditionLevel::Hinweis)
        ->and($default('S03', ConditionKind::Befestigung))->toBe(ConditionLevel::Hinweis)
        ->and($default('A12', ConditionKind::Verbot, 'Die Verwendung von Schneeketten ist nicht zulässig.'))->toBe(ConditionLevel::Hinweis)
        ->and($default('KMV', ConditionKind::Hinweis))->toBe(ConditionLevel::Hinweis)
        ->and($default('A01', ConditionKind::Abnahme))->toBe(ConditionLevel::Auflage)
        ->and($default('K1b', ConditionKind::Karosseriearbeit))->toBe(ConditionLevel::Auflage)
        ->and($default('R02', ConditionKind::ReifenAchse))->toBe(ConditionLevel::Auflage)
        ->and($default('A56', ConditionKind::Antrieb))->toBe(ConditionLevel::Auflage)
        ->and($default('Cpe', ConditionKind::Karosserieform))->toBe(ConditionLevel::Auflage)
        ->and($default('T95', ConditionKind::ReifenTragfaehigkeit))->toBe(ConditionLevel::Auflage)
        // Even where a code's own default would be quieter, the floor holds.
        ->and($default('A14', ConditionKind::Abnahme))->toBe(ConditionLevel::Auflage);
});

it('never lets an Abnahme or work on the body be a Hinweis, whatever is asked', function (): void {
    expect(ConditionLevel::Hinweis->allowedFor(ConditionKind::Abnahme))->toBeFalse()
        ->and(ConditionLevel::Hinweis->allowedFor(ConditionKind::Karosseriearbeit))->toBeFalse()
        ->and(ConditionLevel::Hinweis->allowedFor(ConditionKind::Befestigung))->toBeTrue()
        ->and(Condition::ofKind('A01', ConditionKind::Abnahme, 'Abnahme durch einen Prüfer.', level: ConditionLevel::Hinweis)->level())->toBe(ConditionLevel::Auflage)
        ->and(Condition::ofKind('K1b', ConditionKind::Karosseriearbeit, 'Bördeln der Radläufe erforderlich.', level: ConditionLevel::Hinweis)->level())->toBe(ConditionLevel::Auflage);
});

it('says „Freigegeben“ for an answer whose Auflagen are all Hinweise — and leaves the verdict as it is', function (): void {
    $verdict = levelledVerdict(Condition::ofKind('S03', ConditionKind::Befestigung, 'Nur mit den Radschrauben des Herstellers.'));

    expect($verdict->status)->toBe(VerdictStatus::Conditional)
        ->and($verdict->notesOnly())->toBeTrue()
        ->and($verdict->displayLabelDe())->toBe('Freigegeben');
});

it('keeps „Mit Auflagen“ where one Auflage is more than a Hinweis, or an Abnahme asks for a Prüfer', function (): void {
    $bolts = Condition::ofKind('S03', ConditionKind::Befestigung, 'Nur mit den Radschrauben des Herstellers.');

    $louder = levelledVerdict($bolts, Condition::ofKind('S04', ConditionKind::Befestigung, 'Radschrauben nach 50 km nachziehen.', level: ConditionLevel::Auflage));
    $arch = levelledVerdict($bolts, Condition::ofKind('K1b', ConditionKind::Karosseriearbeit, 'Bördeln der Radläufe erforderlich.', level: ConditionLevel::Hinweis));
    $abnahme = levelledVerdict($bolts, Condition::ofKind('A01', ConditionKind::Abnahme, 'Abnahme durch einen Prüfer.'));

    expect($louder->notesOnly())->toBeFalse()->and($louder->displayLabelDe())->toBe('Freigegeben mit Auflagen')
        ->and($arch->notesOnly())->toBeFalse()
        ->and($abnahme->notesOnly())->toBeFalse();
});

it('reads the level back from a frozen answer, and a snapshot from before levels gets the default', function (): void {
    $verdict = levelledVerdict(Condition::ofKind('S03', ConditionKind::Befestigung, 'Nur mit den Radschrauben des Herstellers.', level: ConditionLevel::Auflage));
    $frozen = $verdict->toArray();

    expect(FitmentVerdict::fromArray($frozen)->notesOnly())->toBeFalse();

    // Before levels: no `level` key — the default for S03 is a Hinweis.
    $frozen['conditions'] = array_map(static function (array $c): array {
        unset($c['level']);

        return $c;
    }, $frozen['conditions']);

    expect(FitmentVerdict::fromArray($frozen)->notesOnly())->toBeTrue();
});
