<?php

declare(strict_types=1);

namespace App\Services\Legal;

/**
 * Everything the shop stores in a visitor's browser, cookie or browser storage alike — § 25 TDDDG covers both — each
 * with its purpose, its lifetime and the answer to one question: is it strictly necessary for a service the visitor
 * explicitly asked for (§ 25 Abs. 2 Nr. 2)? The operator's brief of 14.10.2026 §7 and of 15.10.2026 §2.2 (D-241).
 *
 * The answers are ours, made conservatively, and the Kanzlei's to confirm: where an entry only makes the shop more
 * convenient — a list of the last cars, recent searches, a draft kept across a reload, a year's memory of figures typed
 * for one visit — it is marked not necessary. While any entry is, the go-live check „Cookies“ fails: such storage needs
 * consent with an equally weighted „Ablehnen“, or it goes. The notice stays as it is until that is decided (FINISH §1).
 *
 * `resources/js/legal/cookies.ts` — the notice's and the Datenschutz page's list — names a part of this; every name it
 * has stands here too (CookieInventoryTest).
 */
final class CookieInventory
{
    public const COOKIE = 'Cookie';

    public const LOCAL = 'Browser-Speicher (bleibt)';

    public const SESSION = 'Browser-Speicher (bis der Tab schließt)';

    /**
     * @var list<array{name: string, kind: string, purpose: string, lifetime: string, necessary: bool, why: string, where?: string}>
     */
    public const ENTRIES = [
        [
            'name' => 'Sitzung und XSRF-TOKEN', 'kind' => self::COOKIE, 'lifetime' => '120 Minuten', 'necessary' => true,
            'purpose' => 'Der Warenkorb und der Schutz jeder Eingabe vor fremden Seiten.',
            'why' => 'Ohne sie gibt es keinen Warenkorb und keine sichere Bestellung.',
        ],
        [
            'name' => 'rmf_vehicle', 'kind' => self::COOKIE, 'lifetime' => '90 Tage', 'necessary' => true,
            'purpose' => 'Das Fahrzeug, das der Besucher gewählt hat – nur seine Nummer in unserer Liste.',
            'why' => 'Jede Antwort des Shops wird für dieses Fahrzeug berechnet; dafür hat der Besucher es gewählt. Ob es 90 Tage über den Besuch hinaus bleiben darf, entscheidet die Kanzlei.',
        ],
        [
            'name' => 'rmf_garage', 'kind' => self::COOKIE, 'lifetime' => '90 Tage', 'necessary' => false,
            'purpose' => 'Die letzten fünf gewählten Fahrzeuge, um schnell zurückzuwechseln.',
            'why' => 'Bequemlichkeit: gewählt wird ein Fahrzeug, nicht eine Liste der letzten.',
        ],
        [
            'name' => 'rmf_papiere', 'kind' => self::COOKIE, 'lifetime' => '1 Jahr', 'necessary' => false,
            'purpose' => 'Achslasten (8.1, 8.2), Höchstgeschwindigkeit (T), wo gefragt die Leistung (P.2) und die Reifen (15.1, 15.2), Karosserieform und Antrieb, die der Besucher aus seiner Zulassungsbescheinigung eingetragen hat – für bis zu fünf Fahrzeuge.',
            'why' => 'Während des Besuchs braucht die Antwort die eingetragenen Werte; ein Jahr lang und für fünf Fahrzeuge ist mehr, als die Antwort braucht.',
        ],
        [
            'name' => 'rmf_consent', 'kind' => self::COOKIE, 'lifetime' => '12 Monate', 'necessary' => true,
            'purpose' => 'Dass der Hinweis zu Cookies gelesen wurde, und wann.',
            'why' => 'Sonst stünde der Hinweis auf jeder Seite.',
        ],
        [
            'name' => 'rmf_geraet', 'kind' => self::COOKIE, 'lifetime' => '1 Jahr', 'necessary' => true,
            'purpose' => 'Eine zufällige Kennung dieses Browsers, nach der der Schutz vor zu vielen Anfragen zählt.',
            'why' => 'Schutz des Shops vor Missbrauch, ohne Besucher im selben Mobilfunknetz auszusperren. Ob ein Jahr nötig ist oder die Sitzung genügt, entscheidet die Kanzlei.',
        ],
        [
            'name' => 'rmf_view', 'kind' => self::COOKIE, 'lifetime' => '7 Tage', 'necessary' => true,
            'purpose' => 'Die Ansicht (Telefon oder Desktop), die der Besucher selbst gewählt hat.',
            'why' => 'Gesetzt nur, wenn er eine Ansicht ausdrücklich wählt.',
        ],
        [
            'name' => 'rmf_vorschau', 'kind' => self::COOKIE, 'lifetime' => '30 Tage', 'necessary' => true,
            'purpose' => 'Dass das Band „Vorschau“ ausgeblendet wurde.',
            'why' => 'Gesetzt nur auf der Vorschau und nur, wenn jemand das Band schließt; der Live-Shop hat es nicht.',
            'where' => 'nur Vorschau',
        ],
        [
            'name' => '__stripe_mid, __stripe_sid', 'kind' => self::COOKIE, 'lifetime' => '1 Jahr, 30 Minuten', 'necessary' => true,
            'purpose' => 'Betrugsschutz des Zahlungsdienstes Stripe auf der Kasse.',
            'why' => 'Gesetzt von Stripe.js, nur auf der Kasse und nur, wenn mit Stripe bezahlt wird – für die Zahlung, die der Besucher anstößt. Stripe ist im Datenschutz zu nennen.',
            'where' => 'nur Kasse, nur mit Stripe',
        ],
        [
            'name' => 'rmf_compare', 'kind' => self::LOCAL, 'lifetime' => 'bis der Besucher sie leert', 'necessary' => true,
            'purpose' => 'Die Felgen, die der Besucher zum Vergleich gelegt hat.',
            'why' => 'Er legt sie ausdrücklich dorthin, um sie zu vergleichen.',
        ],
        [
            'name' => 'rmf.recent-searches', 'kind' => self::LOCAL, 'lifetime' => 'bis der Besucher sie leert', 'necessary' => false,
            'purpose' => 'Die letzten Suchen, unter dem Suchfeld angeboten.',
            'why' => 'Bequemlichkeit: gesucht wird jetzt, nicht nach früheren Suchen.',
        ],
        [
            'name' => 'rmf.kasse.v1', 'kind' => self::SESSION, 'lifetime' => 'bis der Tab schließt', 'necessary' => false,
            'purpose' => 'Was an der Kasse schon eingetippt ist, falls die Seite neu lädt.',
            'why' => 'Bequemlichkeit: die Bestellung geht auch ohne.',
        ],
        [
            'name' => 'rmf-kontakt-entwurf', 'kind' => self::SESSION, 'lifetime' => 'bis der Tab schließt', 'necessary' => false,
            'purpose' => 'Eine begonnene Nachricht im Kontaktformular, falls die Seite neu lädt.',
            'why' => 'Bequemlichkeit: die Nachricht geht auch ohne.',
        ],
        [
            'name' => 'rmf.nav.depth', 'kind' => self::SESSION, 'lifetime' => 'bis der Tab schließt', 'necessary' => false,
            'purpose' => 'In welche Richtung die Telefon-Ansicht beim Zurückgehen gleitet.',
            'why' => 'Eine Animation, kein Dienst.',
        ],
    ];

    /** @return list<string> the entries stored without being strictly necessary */
    public static function notNecessary(): array
    {
        return array_values(array_map(
            static fn (array $entry): string => $entry['name'],
            array_filter(self::ENTRIES, static fn (array $entry): bool => ! $entry['necessary']),
        ));
    }
}
