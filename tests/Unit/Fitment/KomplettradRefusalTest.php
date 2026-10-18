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

it('has exactly the twenty-two cases — the specification’s thirteen, the two halves of R-03, the papers of D-286, the four of D-105 and the two of D-256 — in its order', function (): void {
    expect(KomplettradRefusal::values())->toBe([
        'NO_VEHICLE',
        'VERDICT_NOT_PERMITTED',
        'VERDICT_UNKNOWN',
        'TYRES_UNKNOWN',
        'TYRES_AWAIT_PAPERS',
        'TYRES_NOT_PERMITTED',
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
        'AXLE_LOAD_ABOVE_LIMIT',
        'NO_MIXED_PAIRING',
        'MIXED_PAIR_NOT_LISTED',
        'MIXED_NOT_ONE_MAKER',
        'NO_SAME_SIZE_COMBINATION',
        'SIZE_NOT_A_COMBINATION',
    ])->and(KomplettradRefusal::cases())->toHaveCount(22);
});

it('never says „kein Gutachten“ when the wheel is approved and only the tyres are open (R-03 split)', function (): void {
    foreach ([KomplettradRefusal::TyresUnknown, KomplettradRefusal::TyresAwaitPapers, KomplettradRefusal::TyresNotPermitted] as $tyres) {
        expect($tyres->sentenceDe())->toContain('Die Felge ist für dein Fahrzeug freigegeben')
            ->and($tyres->sentenceDe())->not->toContain('kein Gutachten');
    }

    expect(KomplettradRefusal::TyresUnknown->sentenceDe())->toContain('nicht bestätigen')
        ->and(KomplettradRefusal::TyresUnknown->sentenceDe())->toContain('schreib uns')
        // Waiting only for the car's papers (D-286): the way on is the customer's own — what is missing, where it stands.
        ->and(KomplettradRefusal::TyresAwaitPapers->sentenceDe())->toContain('Zulassungsbescheinigung Teil I')
        ->and(KomplettradRefusal::TyresAwaitPapers->sentenceDe())->not->toContain('schreib uns');
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
        KomplettradRefusal::StaggeredLayout,
        KomplettradRefusal::NoSameSizeCombination,
    ] as $felgeAllein) {
        expect($felgeAllein->sentenceDe())->toContain('Felge allein kannst du');
    }

    // Never „stellen wir persönlich zusammen“ beside the Mischbereifung the page offers (D-105).
    expect(KomplettradRefusal::StaggeredLayout->sentenceDe())->not->toContain('persönlich')
        ->and(KomplettradRefusal::VerdictUnknown->sentenceDe())->toContain('schreib uns')
        ->and(KomplettradRefusal::NoVehicle->sentenceDe())->toContain('dein Fahrzeug')
        ->and(KomplettradRefusal::VerdictRestored->sentenceDe())->toContain('noch einmal aus');
});
