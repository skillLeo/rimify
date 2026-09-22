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
    'Stripe': 'no payment provider is live (#68)',
    'freier Lizenz': 'the free-licence photographs are retired (D1)',
    'Bestätigung ist unterwegs': 'no order mail is sent (#42)',
    'am selben Werktag': 'no reply time is promised (#13 #44)',
    'Serienbereifung': 'the prefill is not the factory size (map C3)',
    // A phone line that renders only when config names a phone ("Anrufen: …", "ruf uns an: …") is
    // allowed; tests/Feature/Content/ContactDetailsTest proves no tel: link renders by default.
    'ruf einfach an': 'there is no phone (client answers)',
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
            .filter(([, source]) => withoutComments(source).includes(phrase))
            .map(([file]) => file)

        expect(offenders).toEqual([])
    })
})
