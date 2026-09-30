<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Verdict;

/**
 * What a verdict says about the car's papers — two questions, two lines, one place for their words.
 *
 * - The Auflagen decide whether a Prüfer must look at the car: an Abnahme code (ABE 53841's „11A“: „… durch einen amtlich
 *   anerkannten Sachverständigen oder Prüfer … bescheinigen zu lassen“) sets `requiresEntry`. Point 11 of the ABE leaves
 *   exactly that to the Prüfbericht.
 * - The document decides whether the papers must be corrected: point 10 of ABE 53841 frees its combinations from the
 *   Berichtigung der Zulassungsbescheinigung Teil I (§ 15 FZV) — the Freistellung the Nachtrag's own „11B“ refers to.
 *
 * Where a document says nothing about § 15 FZV, the first line keeps the words it always had („Eintragung in die
 * Fahrzeugpapiere erforderlich.“): a Teilegutachten's Abnahme is followed by an Eintragung. Where it frees the papers,
 * the Abnahme is named as what it is, so the two lines never contradict each other. The TypeScript twin is
 * resources/js/fitment/papers.ts.
 */
final class PapersWording
{
    public const ENTRY_REQUIRED = 'Eintragung in die Fahrzeugpapiere erforderlich.';

    public const NO_ENTRY = 'Keine Eintragung erforderlich.';

    public const ABNAHME_REQUIRED = "Abnahme durch einen Prüfer erforderlich (§\u{00A0}19 Abs.\u{00A0}3 StVZO).";

    public const NO_ABNAHME = 'Keine Abnahme durch einen Prüfer erforderlich.';

    public const PAPERS_EXEMPT = "Keine Berichtigung der Fahrzeugpapiere nötig (§\u{00A0}15 FZV).";

    /** The Auflagen's line: said only where it is required — the product page adds the „keine“ form itself. */
    public static function entryLine(bool $requiresEntry, bool $papersExempt): ?string
    {
        if (! $requiresEntry) {
            return null;
        }

        return $papersExempt ? self::ABNAHME_REQUIRED : self::ENTRY_REQUIRED;
    }

    /** The document's line: only where it frees the papers. */
    public static function papersLine(bool $papersExempt): ?string
    {
        return $papersExempt ? self::PAPERS_EXEMPT : null;
    }
}
