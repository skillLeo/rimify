<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * How a Gutachten gives the load index and speed symbol its tyres need (the operator's brief of 17.10.2026, D-277) —
 * read off the document and asked before it is released. The document decides whether a car's top speed (field T of
 * its papers) is needed to answer for the tyres, not the dataset and not a setting.
 */
enum TyreIndexSource: string
{
    /** It prints the index beside every tyre size of its Verwendungsbereich: „245/35 R19 93Y“. */
    case Document = 'document';

    /** It sends the reader to the papers — the BBS Teilegutachten: „Der erforderliche Geschwindigkeits-/Lastindex ist den Fahrzeugpapieren zu entnehmen.“ */
    case Papers = 'papers';

    /** It prints a table of tyre load at speed — ABE 55255, 210 to 300 km/h against V, W and Y. */
    case Table = 'table';

    /** As the record shows it, after „Lastindex und Geschwindigkeitssymbol“. */
    public function labelDe(): string
    {
        return match ($this) {
            self::Document => 'bei jeder Reifengröße im Gutachten',
            self::Papers => 'laut Gutachten aus den Fahrzeugpapieren',
            self::Table => 'aus der Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit',
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
