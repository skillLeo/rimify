<?php

declare(strict_types=1);

namespace App\Services\Reset;

/**
 * How far Einstellungen › System › Testumgebung zurücksetzen goes (docs/review/ZURUECKSETZEN.md). None of them ever
 * takes the team, its roles, the settings or the Protokoll. „Shopdaten“ and „Alles“ replace tables and delete no row
 * (CLAUDE.md R-12.3), so the demo team and its Protokoll entries — rows of kept tables — stay with them; only
 * „Demodaten“ takes those, through R-12's exemption for rows born demo.
 */
enum ResetLevel: string
{
    /** Only the rows born demo (R-12) and the example catalogue they are drawn on — DemoPurge, as the rail's strip. */
    case Demo = 'demo';

    /** The shop's data: catalogue, Gutachten, cars, orders and everything that hangs off them, and their files. */
    case Shop = 'shop';

    /** The shop's data, and the pages, FAQ and menus back to how the shop was delivered. */
    case All = 'all';

    public function label(): string
    {
        return match ($this) {
            self::Demo => 'Demodaten',
            self::Shop => 'Shopdaten',
            self::All => 'Alles',
        };
    }

    /** What goes, in one sentence for the screen. */
    public function removes(): string
    {
        return match ($this) {
            self::Demo => 'Nur die Beispieldaten – die Demo-Bestellungen, das Demo-Team und den Beispielkatalog mit seinen Gutachten.',
            self::Shop => 'Felgen, Reifen, Marken, Gutachten, Fahrzeuge, Bestellungen, Kunden, Bewertungen, Nachrichten, Rückmeldungen, Anfragen sowie die Bilder und PDFs dazu – auch die Beispieldaten darunter.',
            self::All => 'Alles aus „Shopdaten“. Dazu gehen Seiten, FAQ und Menüs auf den Auslieferungszustand zurück.',
        };
    }

    /** What stays, in one sentence for the screen. */
    public function keeps(): string
    {
        return match ($this) {
            self::Demo => 'Alles andere, auch deine eigenen Felgen, Gutachten und Bestellungen.',
            self::Shop => 'Benutzer, Rollen, Einstellungen, das Protokoll sowie Seiten, FAQ und Menüs. Auch die Konten des Demo-Teams und ihre Protokolleinträge bleiben. Die entfernst du danach mit der Stufe „Demodaten“.',
            self::All => 'Benutzer, Rollen, Einstellungen und das Protokoll. Auch die Konten des Demo-Teams und ihre Protokolleinträge bleiben. Die entfernst du danach mit der Stufe „Demodaten“.',
        };
    }

    /** Whether the shop's own tables are replaced (not only their demo rows taken out). */
    public function replacesShop(): bool
    {
        return $this !== self::Demo;
    }

    /** Whether the pages, FAQ and menus go back to the delivered state. */
    public function replacesContent(): bool
    {
        return $this === self::All;
    }
}
