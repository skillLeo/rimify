<?php

declare(strict_types=1);

use App\Domain\Fitment\Verdict\ConditionKind;

/*
 * The admin audit's F-07: the „Art“ of an Auflage decides where its sentence stands in the shop and what it does to the
 * answer, so the admin says what each kind does beside the choice. „Verbot“ entered for a car the document excludes
 * told that car's owner the wheel was approved: the sentence says a forbidden use excludes no car, and how to exclude one.
 */

it('says what every kind does, in one or two whole sentences', function (ConditionKind $kind): void {
    expect($kind->helpDe())->not->toBe('')->toEndWith('.');
})->with(ConditionKind::cases());

it('says that „Verbot“ excludes no car, and which kinds do', function (): void {
    expect(ConditionKind::Verbot->helpDe())
        ->toContain('es schließt kein Fahrzeug aus')
        ->toContain(ConditionKind::Karosserieform->labelDe())
        ->toContain(ConditionKind::Antrieb->labelDe());
});
