<?php

declare(strict_types=1);

use App\Services\Commerce\CheckoutShown;

/*
 * What the checkout showed, as one token (Block G): the rim alone's own sentence is part of it (D-289, the interaction
 * review) — the papers entered in another tab after the Kasse opened change it, and the payment stops with the sentence
 * for a changed verdict rather than freeze a note the customer never saw. A line without one hashes as it always did.
 */

/** @return array{lines: list<array<string, mixed>>, totals: array<string, mixed>} */
function shownSummary(?string $note): array
{
    $verdict = ['status' => 'CONDITIONAL', 'requiresEntry' => false, 'conditions' => [], 'basis' => ['7@1'], ...($note === null ? [] : ['rimAloneNote' => $note])];

    return [
        'lines' => [['key' => 'wheel:11', 'quantity' => 4, 'unitPriceCents' => 26_900, 'lineTotalCents' => 107_600, 'verdict' => $verdict]],
        'totals' => ['subtotalCents' => 107_600, 'shippingCents' => 0, 'totalCents' => 107_600],
    ];
}

it('stops the payment when the rim alone\'s own sentence changed since the Kasse opened', function (): void {
    $shown = CheckoutShown::token(shownSummary('Die Felge ist für dein Fahrzeug nur … Bei der Prüfung fehlten uns die Felder 8.1, 8.2 und T …'));

    expect(CheckoutShown::refusal($shown, shownSummary('Die Felge ist für dein Fahrzeug nur … Bei der Prüfung fehlte uns Feld T …')))->toBe(CheckoutShown::FITMENT_CHANGED)
        ->and(CheckoutShown::refusal($shown, shownSummary('Die Felge ist für dein Fahrzeug nur … Bei der Prüfung fehlten uns die Felder 8.1, 8.2 und T …')))->toBeNull()
        // A line without one: the token it always had.
        ->and(CheckoutShown::refusal(CheckoutShown::token(shownSummary(null)), shownSummary(null)))->toBeNull();
});
