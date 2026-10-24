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

    /**
     * What the kind does, said beside the choice (the admin audit's F-07): „Verbot“ entered for „nicht zulässig für den
     * Kombi“ told that car's owner the wheel was approved with Auflagen — a forbidden use excludes no car. Only what the
     * code does with the kind, nothing about any document.
     */
    public function helpDe(): string
    {
        return match ($this) {
            self::Abnahme => 'Nach der Montage muss das Fahrzeug einem Prüfer vorgeführt werden. Der Shop sagt dazu „Eintragung erforderlich“.',
            self::Karosseriearbeit => 'Vor der Montage sind Arbeiten am Fahrzeug nötig, etwa das Bördeln der Radläufe. Der Shop nennt sie unter „Arbeiten am Fahrzeug“.',
            self::Karosserieform => 'Die Zeilen mit diesem Code gelten nur für die angekreuzten Karosserieformen. Ein Fahrzeug mit einer anderen bekommt daraus keine Freigabe.',
            self::Antrieb => 'Die Zeilen mit diesem Code gelten nur mit oder nur ohne diesen Antrieb. Ein anderes Fahrzeug bekommt daraus keine Freigabe.',
            self::Befestigung => 'Welche Schrauben oder Muttern, mit welchem Anzugsmoment. Der Shop nennt es unter „Befestigung“.',
            self::ReifenTragfaehigkeit => 'Eine Grenze für den Lastindex der Reifen, abhängig von der zulässigen Achslast. Der Shop vergleicht sie mit den Achslasten aus Feld 8.1 und 8.2.',
            self::ReifenAchse => 'Diese Reifengröße nur auf einer Achse. Der Shop bietet sie nur dort an.',
            self::ReifenKombination => 'Welche Größen vorn und hinten zusammen gefahren werden dürfen.',
            self::Tacho => 'Der Tachometer muss geprüft oder angeglichen werden. Der Shop nennt es unter „Hinweise“.',
            self::Verbot => 'Etwas ist mit dieser Felge verboten, etwa Schneeketten. Der Shop nennt es unter „Hinweise“; es schließt kein Fahrzeug aus. Für ein Fahrzeug, das keine Freigabe bekommen soll, legst du keine Zeile an; schränkt der Code die Freigabe auf bestimmte Karosserieformen oder Antriebe ein, wähl die Art „Nur für bestimmte Karosserieformen“ oder „Nur mit / ohne bestimmten Antrieb“.',
            self::Hinweis => 'Eine Angabe, die am Kauf nichts ändert. Der Shop nennt sie unter „Hinweise“.',
            self::Nacharbeitsprofil => 'Nacharbeit am Radlauf mit Maßen in Millimetern, je Fahrzeugtyp und Achse.',
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
