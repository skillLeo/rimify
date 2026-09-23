<?php

declare(strict_types=1);

use App\Domain\Fitment\Tyres\KomplettradRefusal;

/*
 * Every refusal reaches the customer as a full German sentence (R-15), addressed as du, naming
 * no contact detail — the e-mail address is rendered from config('rimify.contact') at the edge,
 * and ContactDetailsTest fails the build on a hard-coded one.
 */

$everyCase = static fn (): array => array_combine(
    array_map(static fn (KomplettradRefusal $r): string => $r->name, KomplettradRefusal::cases()),
    KomplettradRefusal::cases(),
);

it('carries a full German sentence for every refusal, naming no code and no contact detail', function (KomplettradRefusal $refusal): void {
    $sentence = $refusal->sentenceDe();

    expect($sentence)->not->toBe('')
        ->and(mb_substr($sentence, -1))->toBe('.')
        ->and($sentence)->toContain(' ')
        ->and($sentence)->not->toContain($refusal->value)
        ->and($sentence)->not->toContain($refusal->name)
        // No phone number and no e-mail address can be written without a digit or an @.
        ->and($sentence)->not->toMatch('/[0-9@]/')
        ->and(mb_strtolower($sentence))->not->toContain('rimify.de')
        ->and(mb_strtolower($sentence))->not->toContain('whatsapp')
        // du-form, never Sie.
        ->and($sentence)->not->toMatch('/\b(Sie|Ihr|Ihre|Ihrem|Ihren|Ihnen)\b/u');
})->with($everyCase);

it('has exactly the thirteen cases the specification names, in its order', function (): void {
    expect(KomplettradRefusal::values())->toBe([
        'NO_VEHICLE',
        'VERDICT_NOT_PERMITTED',
        'VERDICT_UNKNOWN',
        'VERDICT_RESTORED',
        'NO_PERMITTED_SIZES',
        'NO_USABLE_MINIMUM',
        'STAGGERED_LAYOUT',
        'TYRE_CHOICE_RESTRICTED',
        'DIAMETER_MISMATCH',
        'SIZE_NOT_PERMITTED',
        'BELOW_MINIMUM',
        'OUT_OF_STOCK',
        'NO_TYRE_AVAILABLE',
    ])->and(KomplettradRefusal::cases())->toHaveCount(13);
});

it('keeps UNKNOWN apart from NOT_PERMITTED — R-07', function (): void {
    // Neither sells, but only one of them means "we checked and your car may not have this".
    expect(KomplettradRefusal::VerdictUnknown->sentenceDe())->not->toBe(KomplettradRefusal::VerdictNotPermitted->sentenceDe())
        ->and(KomplettradRefusal::VerdictUnknown->sentenceDe())->toContain('kein Gutachten')
        ->and(KomplettradRefusal::VerdictUnknown->sentenceDe())->not->toContain('nicht freigegeben')
        ->and(KomplettradRefusal::VerdictNotPermitted->sentenceDe())->toContain('nicht freigegeben')
        ->and(KomplettradRefusal::VerdictNotPermitted->sentenceDe())->not->toContain('kein Gutachten');
});

it('names a route forward on every refusal a customer can act on', function (): void {
    foreach ([
        KomplettradRefusal::NoPermittedSizes,
        KomplettradRefusal::NoUsableMinimum,
        KomplettradRefusal::TyreChoiceRestricted,
        KomplettradRefusal::NoTyreAvailable,
    ] as $felgeAllein) {
        expect($felgeAllein->sentenceDe())->toContain('Felge allein kannst du');
    }

    expect(KomplettradRefusal::StaggeredLayout->sentenceDe())->toContain('persönlich')
        ->and(KomplettradRefusal::VerdictUnknown->sentenceDe())->toContain('schreib uns')
        ->and(KomplettradRefusal::NoVehicle->sentenceDe())->toContain('dein Fahrzeug')
        ->and(KomplettradRefusal::VerdictRestored->sentenceDe())->toContain('noch einmal aus');
});
