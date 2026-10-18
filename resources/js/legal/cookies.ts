/**
 * Every cookie the shop sets, in the customer's words — one list for the cookie settings (CookieConsent) and the
 * facts table on the Datenschutz page, so the two can never say different things. The same facts, with their flags,
 * are in docs/launch/COOKIES.md for the Kanzlei, whose text around them this list does not replace (D-024).
 *
 * Block G: `rmf_papiere` and `rmf_geraet` are listed as functional, each with what it stores and how to clear it.
 */

export interface CookieEntry {
    name: string
    category: 'Notwendig' | 'Funktional'
    /** What it stores, as one sentence. */
    stores: string
    lifetime: string
    /** How the customer removes it, as one sentence. */
    clear: string
}

const BROWSER = 'Du kannst die Cookies dieser Seite auch in deinem Browser löschen.'

export const COOKIES: CookieEntry[] = [
    {
        name: 'rmf_vehicle',
        category: 'Notwendig',
        stores: 'Welches Fahrzeug du gewählt hast – nur seine Nummer in unserer Liste.',
        lifetime: '90 Tage',
        clear: `Es wird ersetzt, sobald du ein anderes Fahrzeug wählst. ${BROWSER}`,
    },
    {
        name: 'rmf_garage',
        category: 'Notwendig',
        stores: 'Die letzten fünf Fahrzeuge, die du gewählt hast, damit du schnell zurückwechseln kannst.',
        lifetime: '90 Tage',
        clear: BROWSER,
    },
    {
        name: 'rmf_consent',
        category: 'Notwendig',
        stores: 'Dass du diesen Hinweis gelesen hast, und wann.',
        lifetime: '12 Monate',
        clear: BROWSER,
    },
    {
        name: 'Sitzung und XSRF-TOKEN',
        category: 'Notwendig',
        stores: 'Deinen Warenkorb und den Schutz deiner Eingaben vor fremden Seiten.',
        lifetime: '120 Minuten',
        clear: `Sie verfallen von selbst. ${BROWSER}`,
    },
    {
        name: 'rmf_papiere',
        category: 'Funktional',
        stores:
            'Die Werte, die du aus deiner Zulassungsbescheinigung einträgst – Achslasten (8.1, 8.2), Höchstgeschwindigkeit (T) und, wenn du sie angibst, Leistung (P.2) sowie Tragfähigkeits- und Geschwindigkeitsindex der Reifen (15.1, 15.2) –, dazu Karosserieform und Antriebsart, wenn wir danach fragen; für bis zu fünf Fahrzeuge, ohne Namen, Kennzeichen oder Fahrgestellnummer.',
        lifetime: '1 Jahr',
        clear: `Beim Fahrzeug auf „Werte löschen“ tippen. ${BROWSER}`,
    },
    {
        name: 'rmf_geraet',
        category: 'Funktional',
        stores:
            'Eine zufällige Kennung für diesen Browser und sonst nichts. Unser Schutz vor zu vielen Anfragen zählt nach ihr statt nach deiner IP-Adresse – so wirst du nicht mit anderen im selben Mobilfunknetz verwechselt.',
        lifetime: '1 Jahr',
        clear: `Lösch die Cookies für diese Seite in deinem Browser; beim nächsten Besuch entsteht eine neue, ebenso zufällige Kennung.`,
    },
]
