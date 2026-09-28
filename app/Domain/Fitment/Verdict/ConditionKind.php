<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Verdict;

/**
 * What an Auflage is, as a person classified it when entering the document (the Borbet brief §2.3).
 *
 * The two real documents mix very different things in one column of codes: an Abnahme, work on the car,
 * a filter on body style or drive, the bolts, tyre limits, notes. The kind decides where a sentence is
 * shown, how loud it is, and what it does to the verdict — so it is chosen by a person, never guessed
 * from the code or the text.
 */
enum ConditionKind: string
{
    /** The car must be presented to a Prüfer after fitting (A01). Derives the Eintragung. */
    case Abnahme = 'abnahme';

    /** Work on the car's body before the wheel fits: the arch rolled, trimmed, flared (K1c, K42). */
    case Karosseriearbeit = 'karosseriearbeit';

    /** A filter: only these body styles (Cpe, Cbo, Lim …). Narrows the match, is not a sentence. */
    case Karosserieform = 'karosserieform';

    /** A filter: only with, or not with, a drive (all-wheel drive, four-wheel steering). */
    case Antrieb = 'antrieb';

    /** Which bolts or nuts, which torque (S01–S06). */
    case Befestigung = 'befestigung';

    /** A load-index limit tied to the permitted axle load (T84 … T00, 140). */
    case ReifenTragfaehigkeit = 'reifen_tragfaehigkeit';

    /** This tyre size only on one axle (R02, R03). */
    case ReifenAchse = 'reifen_achse';

    /** Which front and rear sizes may be combined (V19, GA3, YDM). */
    case ReifenKombination = 'reifen_kombination';

    /** The speedometer must be checked or adjusted (G01, G73). */
    case Tacho = 'tacho';

    /** Something is forbidden with this wheel — snow chains (A12). */
    case Verbot = 'verbot';

    /** A note that changes nothing the customer must do (A14, A18, KMV). */
    case Hinweis = 'hinweis';

    /** Numeric rework of the arch, per vehicle type and axle, in millimetres (26B, 27F). */
    case Nacharbeitsprofil = 'nacharbeitsprofil';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(static fn (self $kind): string => $kind->value, self::cases());
    }

    /**
     * How the Auflage weighs on the verdict. Never lighter than what it asks of the customer: an Abnahme,
     * the bolts and the speedometer are things to do; work on the body is a workshop; tyre limits and a
     * prohibition narrow what may be bought; only a note leaves the verdict as it is.
     */
    public function severity(): Severity
    {
        return match ($this) {
            self::Abnahme, self::Befestigung, self::Tacho => Severity::Action,
            self::Karosseriearbeit, self::Nacharbeitsprofil => Severity::Workshop,
            self::ReifenTragfaehigkeit, self::ReifenAchse, self::ReifenKombination, self::Verbot,
            self::Karosserieform, self::Antrieb => Severity::Restriction,
            self::Hinweis => Severity::Info,
        };
    }

    /** A filter narrows which cars a row covers; it is not shown to the customer as a sentence. */
    public function isFilter(): bool
    {
        return $this === self::Karosserieform || $this === self::Antrieb;
    }

    /** Whether it decides which tyres may be bought. */
    public function affectsTyreChoice(): bool
    {
        return in_array($this, [self::ReifenTragfaehigkeit, self::ReifenAchse, self::ReifenKombination], true);
    }

    /** Where the customer reads it, in the order the Borbet brief §5 sets. */
    public function sectionDe(): string
    {
        return match ($this) {
            self::Abnahme => 'Abnahme',
            self::Karosseriearbeit, self::Nacharbeitsprofil => 'Arbeiten am Fahrzeug',
            self::Befestigung => 'Befestigung',
            self::ReifenTragfaehigkeit, self::ReifenAchse, self::ReifenKombination => 'Reifen',
            self::Tacho, self::Verbot, self::Hinweis => 'Hinweise',
            self::Karosserieform, self::Antrieb => 'Fahrzeug',
        };
    }

    /** The kind as the admin chooses it. */
    public function labelDe(): string
    {
        return match ($this) {
            self::Abnahme => 'Abnahme durch einen Prüfer',
            self::Karosseriearbeit => 'Arbeit an der Karosserie',
            self::Karosserieform => 'Nur für bestimmte Karosserieformen',
            self::Antrieb => 'Nur mit / ohne bestimmten Antrieb',
            self::Befestigung => 'Befestigungsmittel',
            self::ReifenTragfaehigkeit => 'Reifen: Tragfähigkeit',
            self::ReifenAchse => 'Reifen: nur auf einer Achse',
            self::ReifenKombination => 'Reifen: erlaubte Kombinationen',
            self::Tacho => 'Tachometer prüfen',
            self::Verbot => 'Verbot',
            self::Hinweis => 'Hinweis',
            self::Nacharbeitsprofil => 'Nacharbeit mit Maßen',
        };
    }
}
