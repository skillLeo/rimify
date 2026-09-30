import { describe, expect, it } from 'vitest'

/*
 * Claims the shop may not make until the client confirms them (docs/phase0/ACCURACY.md D5, D7,
 * and the client-answers audit). Each one was on the site and was taken out; this guard keeps it
 * out of every component, page and helper. It reads the sources with their comments removed,
 * because a comment explaining why a claim is gone is not a claim.
 */

const sources = import.meta.glob<string>(['./**/*.vue', './**/*.ts', '!./**/*.test.ts', '!./**/*.d.ts'], {
    query: '?raw',
    import: 'default',
    eager: true,
})

/** Phrase → why it may not render. */
const RETIRED: Record<string, string> = {
    'als PDF': 'no PDF is delivered to customers yet (#33 #34 #35)',
    'Werktage': 'no delivery time is confirmed (#30 #31 #38)',
    'Werktagen': 'no delivery time is confirmed (#30 #31 #38)',
    'DHL': 'no carrier is confirmed (#38)',
    // 'Stripe' retired from this list on 29.09.2026 (D-069): the provider is decided (BLOCKED 3) and the checkout
    // mounts it; the customer's pages still speak of „der Zahlungsdienst“, the admin names it.
    'freier Lizenz': 'the free-licence photographs are retired (D1)',
    'Bestätigung ist unterwegs': 'no order mail is sent (#42)',
    'am selben Werktag': 'no reply time is promised (#13 #44)',
    'Serienbereifung': 'the prefill is not the factory size (map C3)',
    // A phone line that renders only when config names a phone ("Anrufen: …", "ruf uns an: …") is
    // allowed; tests/Feature/Content/ContactDetailsTest proves no tel: link renders by default.
    'ruf einfach an': 'there is no phone (client answers)',
}

/*
 * Where a phrase may stand because it is no claim: the field in which the operator types the delivery time
 * (Einstellungen › Verkäufer & Versand, 01.10.2026). The shop's own words for it come from the server (Shipping).
 */
const ALLOWED: Record<string, string[]> = {
    Werktage: ['./Pages/Admin/Einstellungen/VerkaeuferVersand.vue'],
    Werktagen: ['./Pages/Admin/Einstellungen/VerkaeuferVersand.vue'],
}

function withoutComments(source: string): string {
    return source
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:"'`])\/\/[^\n]*/g, '$1')
}

describe('retired claims', () => {
    it('finds the sources to check', () => {
        expect(Object.keys(sources).length).toBeGreaterThan(100)
    })

    it.each(Object.entries(RETIRED))('never says "%s" (%s)', (phrase) => {
        const offenders = Object.entries(sources)
            .filter(([file, source]) => withoutComments(source).includes(phrase) && !(ALLOWED[phrase] ?? []).includes(file))
            .map(([file]) => file)

        expect(offenders).toEqual([])
    })
})
