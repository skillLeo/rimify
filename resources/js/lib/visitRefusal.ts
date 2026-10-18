/*
 * What a form says when its visit never reaches an answer (G-05): offline, an expired page, too many tries, a fault —
 * said at the form, the page and what was typed kept. One wording for the body-style form and the papers form.
 */

export const OFFLINE = 'Keine Verbindung zum Server. Deine Änderung ist nicht gespeichert – prüf die Verbindung und versuch es noch einmal.'

export function refusal(status: number): string {
    switch (status) {
        case 404:
            return 'Dieses Fahrzeug gibt es bei uns nicht mehr. Wähle dein Fahrzeug bitte neu.'
        case 419:
            return 'Die Seite war zu lange offen, deshalb ist nichts gespeichert. Lade sie neu und versuch es noch einmal.'
        case 429:
            return 'Zu viele Versuche in kurzer Zeit. Bitte warte eine Minute und versuch es dann noch einmal.'
        default:
            return 'Deine Änderung ließ sich gerade nicht speichern. Versuch es gleich noch einmal.'
    }
}
