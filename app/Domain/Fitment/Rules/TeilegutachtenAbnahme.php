<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Rules;

use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Enums\ApprovalKind;
use App\Support\Switches;

/**
 * A2 of the operator's brief of 22.11.2026 — option Q of the Task 4 analysis (resume r49/task4): for a paper of kind
 * Teilegutachten every combination states the Abnahme from the paper's type, unless a Prüfer set the row's exception with a
 * reason (`fitments.entry_override = not_required`, which the customer reads as „Laut Prüfer …“). Behind its switch, off.
 *
 * It only ever adds: an Abnahme the paper's own codes already state stays, and nothing the row says is taken away. With the
 * switch off this class adds nothing and the answer is the one before it (D-505).
 */
final class TeilegutachtenAbnahme
{
    /** Never shown (R-15): the customer reads the sentence below. */
    public const CODE = 'TEILEGUTACHTEN';

    /**
     * ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
     * │ PLATZHALTER — the customer's sentence is the client's to word (the operator's answer of 21.11.2026, item 4).  │
     * │ This is the ONE place it is kept: the shop, the basket, the Kasse, the mail, the Check page and every order    │
     * │ read it from here, and a new order freezes it as worded on the day. Replace the text before the switch goes on │
     * │ anywhere a customer reads it; `TeilegutachtenAbnahmeTest` names the marker, so the change is made knowingly.  │
     * └──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
     */
    public const SENTENCE_DE = '[Platzhalter] Teilegutachten: Abnahme durch einen Prüfer erforderlich.';

    /** Whether the sentence is still the placeholder, which the client has not worded yet. */
    public static function isPlaceholder(): bool
    {
        return str_starts_with(self::SENTENCE_DE, '[Platzhalter]');
    }

    /** The condition a row of this paper carries from its type, or null: switch off, another kind, or a Prüfer's exception. */
    public static function for(ApprovalKind $kind, ?string $entryOverride): ?Condition
    {
        if (! Switches::teilegutachtenAbnahme() || $kind !== ApprovalKind::Teilegutachten || $entryOverride === 'not_required') {
            return null;
        }

        return Condition::ofKind(self::CODE, ConditionKind::Abnahme, self::SENTENCE_DE);
    }
}
