<?php

declare(strict_types=1);

namespace App\Services\Admin\Review;

use Illuminate\Support\Facades\DB;

/**
 * The review board (the review release §3): every screen of the admin, in the order the client works
 * through them, each with its state in one word — fertig, in Arbeit, noch nicht gebaut — a link where
 * there is something to open, and one German line on what it does or what is missing.
 *
 * Written down here rather than guessed from the routes: „fertig“ is a promise to the reviewer, and a
 * route that exists is not yet a screen worth his time.
 *
 * @phpstan-type Screen array{label: string, href: string|null, state: string, line: string}
 * @phpstan-type Area array{key: string, label: string, screens: list<Screen>}
 */
final class ReviewBoard
{
    public const DONE = 'fertig';

    public const WORKING = 'in Arbeit';

    public const MISSING = 'noch nicht gebaut';

    /** @var list<Area> */
    private const AREAS = [
        ['key' => 'uebersicht', 'label' => 'Übersicht', 'screens' => [
            ['label' => 'Übersicht', 'href' => '/admin', 'state' => self::DONE, 'line' => 'Umsatz, Bestellungen und die Aufgaben des Tages – je Rolle andere Kacheln, mit Zeitraum und Vergleich.'],
            ['label' => 'Nachfrage', 'href' => '/admin/nachfrage', 'state' => self::DONE, 'line' => 'Fahrzeuge, nach denen gesucht wurde, ohne freigegebene Felge – markierbar als erledigt.'],
        ]],
        ['key' => 'verkauf', 'label' => 'Verkauf', 'screens' => [
            ['label' => 'Bestellungen', 'href' => '/admin/bestellungen', 'state' => self::DONE, 'line' => 'Liste mit Suche, Filtern, gespeicherten Ansichten und Export; jede Bestellung mit ihrem Prüfnachweis je Position.'],
            ['label' => 'Anfragen', 'href' => '/admin/anfragen', 'state' => self::DONE, 'line' => 'Kundinnen und Kunden, die benachrichtigt werden wollen, sobald ein Gutachten ihr Fahrzeug nennt.'],
            ['label' => 'Bestellen mit Testzahlung', 'href' => null, 'state' => self::DONE, 'line' => 'Im Shop bestellen und die Testzahlung bezahlt, abgelehnt oder abgebrochen enden lassen – mit eingefrorenem Prüfnachweis, ohne dass Geld fließt. Die echte Zahlung (Stripe) folgt.'],
            ['label' => 'Status, Versand, Rechnung, Erstattung', 'href' => null, 'state' => self::MISSING, 'line' => 'Eine Bestellung bearbeiten: versenden, Rechnung, Rücksendung und Gutschrift.'],
            ['label' => 'Kunden', 'href' => null, 'state' => self::MISSING, 'line' => 'Kundenkonten mit ihren Bestellungen und Fahrzeugen.'],
        ]],
        ['key' => 'katalog', 'label' => 'Katalog', 'screens' => [
            ['label' => 'Felgen', 'href' => '/admin/felgen', 'state' => self::DONE, 'line' => 'Liste mit Freigaben je Größe; Anlegen mit Ausführungen, Fotos und Größen-Matrix; Veröffentlichen nach Freigabe-Check.'],
            ['label' => 'Import', 'href' => '/admin/katalog/import', 'state' => self::DONE, 'line' => 'Lieferantendatei (CSV oder Excel) zuordnen, im Probelauf prüfen, importieren und zurücknehmen.'],
            ['label' => 'Marken', 'href' => '/admin/marken', 'state' => self::DONE, 'line' => 'Jede Marke mit Namen, Platz auf der Markenwand und Logo – hochgeladen als SVG, PNG oder WebP, geprüft vor dem Speichern.'],
            ['label' => 'Reifen, Bestände', 'href' => null, 'state' => self::MISSING, 'line' => 'Reifen pflegen, Bestände über alle Felgen.'],
        ]],
        ['key' => 'gutachten', 'label' => 'Gutachten', 'screens' => [
            ['label' => 'Dokumente', 'href' => '/admin/gutachten', 'state' => self::DONE, 'line' => 'PDF hochladen, Verwendungsbereich für Fahrzeuge × Größen eintragen, Vorschau im Shop, Freigeben.'],
            ['label' => 'Auflagen-Katalog', 'href' => '/admin/auflagen', 'state' => self::DONE, 'line' => 'Jede Auflage einmal als ganzer Satz, so wie Kundinnen und Kunden sie lesen.'],
            ['label' => 'Abdeckung', 'href' => '/admin/abdeckung', 'state' => self::DONE, 'line' => 'Welche Marken und Größen Freigaben haben – gezählt aus den Zeilen der Gutachten.'],
            ['label' => 'Konflikte', 'href' => null, 'state' => self::WORKING, 'line' => 'Widersprüche zwischen Gutachten werden beim Freigeben erkannt und gemeldet; die Seite zum Klären folgt.'],
        ]],
        ['key' => 'fahrzeuge', 'label' => 'Fahrzeuge', 'screens' => [
            ['label' => 'Fahrzeuge', 'href' => '/admin/fahrzeuge', 'state' => self::DONE, 'line' => 'Alle Fahrzeugvarianten, suchbar nach Name und HSN/TSN, mit den Gutachten, die sie nennen.'],
            ['label' => 'Zur Prüfung', 'href' => '/admin/fahrzeuge/pruefung', 'state' => self::DONE, 'line' => 'Fahrzeuge ohne Achslasten oder Höchstgeschwindigkeit: hier eintragen, dann gelten sie wieder.'],
            ['label' => 'Fahrzeugdaten einspielen', 'href' => null, 'state' => self::MISSING, 'line' => 'Neue Fahrzeuge aus der KBA-Liste übernehmen, mit Verlauf und Dubletten-Prüfung.'],
        ]],
        ['key' => 'inhalte', 'label' => 'Inhalte', 'screens' => [
            ['label' => 'Seiten', 'href' => '/admin/seiten', 'state' => self::DONE, 'line' => 'Texte der Seiten als Entwurf, Vorschau im Shop, Veröffentlichen und frühere Fassungen.'],
            ['label' => 'FAQ', 'href' => '/admin/faq', 'state' => self::DONE, 'line' => 'Fragen und Antworten, Reihenfolge und Sichtbarkeit.'],
            ['label' => 'Navigation', 'href' => '/admin/navigation', 'state' => self::DONE, 'line' => 'Die Menüs des Shops.'],
            ['label' => 'Medien', 'href' => null, 'state' => self::MISSING, 'line' => 'Bilder für Seiten und Artikel verwalten.'],
        ]],
        ['key' => 'einstellungen', 'label' => 'Einstellungen', 'screens' => [
            ['label' => 'Medien und Speicher', 'href' => '/admin/einstellungen/speicher', 'state' => self::DONE, 'line' => 'Der Speicher für Fotos und PDFs: Zugang eintragen, Verbindung testen.'],
            ['label' => 'Rollen & Rechte', 'href' => '/admin/rollen', 'state' => self::DONE, 'line' => 'Was jede Rolle darf, als Raster – mit Ansicht als Rolle.'],
            ['label' => 'Benutzer', 'href' => '/admin/benutzer', 'state' => self::DONE, 'line' => 'Das Team: einladen, Rolle ändern, sperren, abmelden.'],
            ['label' => 'Protokoll', 'href' => '/admin/protokoll', 'state' => self::DONE, 'line' => 'Jede Änderung im Admin, in Worten.'],
            ['label' => 'Zubehörpreise', 'href' => '/admin/zubehoerpreise', 'state' => self::DONE, 'line' => 'Wuchtgewichte und RDKS-Sensoren für Kompletträder.'],
            ['label' => 'Allgemein, Versand, Zahlung, Rechtstexte', 'href' => null, 'state' => self::MISSING, 'line' => 'Die Einstellungen des Shops selbst.'],
        ]],
        ['key' => 'system', 'label' => 'System', 'screens' => [
            ['label' => 'Zustand', 'href' => '/admin/system', 'state' => self::DONE, 'line' => 'Ob Datenbank, Speicher, Warteschlange und Mail laufen.'],
            ['label' => 'Warteschlange', 'href' => null, 'state' => self::MISSING, 'line' => 'Hängengebliebene Aufgaben einsehen und neu starten.'],
        ]],
        ['key' => 'auswertungen', 'label' => 'Auswertungen', 'screens' => [
            ['label' => 'Verkäufe, Suchen ohne Treffer, Fahrzeuge ohne Felgen, Gutachten-Lücken', 'href' => null, 'state' => self::MISSING, 'line' => 'Berichte über Zeiträume, mit Export.'],
        ]],
    ];

    /**
     * The board, with how many points of the review are still open on each screen.
     *
     * @return list<array{key: string, label: string, screens: list<array{label: string, href: string|null, state: string, line: string, open: int}>}>
     */
    public function areas(): array
    {
        $open = DB::table('review_feedback')->whereIn('status', ['neu', 'angenommen'])->select('screen')->selectRaw('COUNT(*) as n')->groupBy('screen')->pluck('n', 'screen');
        $out = [];

        foreach (self::AREAS as $area) {
            $screens = [];

            foreach ($area['screens'] as $screen) {
                $screens[] = $screen + ['open' => (int) ($open[$screen['label']] ?? 0)];
            }

            $out[] = ['key' => $area['key'], 'label' => $area['label'], 'screens' => $screens];
        }

        return $out;
    }

    /**
     * The screen a URL belongs to, by the board's longest matching link: `/admin/felgen/12` is Felgen.
     * A URL no screen owns is „Sonstiges“.
     */
    public static function screenFor(string $url): string
    {
        $path = rtrim((string) (parse_url($url, PHP_URL_PATH) ?: ''), '/');
        $best = null;
        $length = -1;

        foreach (self::AREAS as $area) {
            foreach ($area['screens'] as $screen) {
                $href = $screen['href'];

                if ($href === null) {
                    continue;
                }

                $matches = $path === $href || ($href !== '/admin' && str_starts_with($path, $href.'/'));

                if ($matches && strlen($href) > $length) {
                    $best = $screen['label'];
                    $length = strlen($href);
                }
            }
        }

        return $best ?? ($path === '/admin' ? 'Übersicht' : 'Sonstiges');
    }

    /** @return list<string> every screen label, in the board's order */
    public static function screens(): array
    {
        $labels = [];

        foreach (self::AREAS as $area) {
            foreach ($area['screens'] as $screen) {
                if ($screen['href'] !== null) {
                    $labels[] = $screen['label'];
                }
            }
        }

        return [...$labels, 'Sonstiges'];
    }
}
