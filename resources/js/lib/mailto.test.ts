import { describe, expect, it } from 'vitest'
import { mailtoHref } from './mailto'

// A reserved example domain: the shop's own address lives in config/rimify.php only.
const EMAIL = 'service@example.com'

describe('mailtoHref', () => {
    it('is the bare address without fields', () => {
        expect(mailtoHref(EMAIL)).toBe('mailto:service@example.com')
        expect(mailtoHref(` ${EMAIL} `, { subject: '', body: '' })).toBe('mailto:service@example.com')
    })

    it('encodes the subject and the body, with CRLF line breaks', () => {
        const href = mailtoHref(EMAIL, { subject: 'Fahrzeug nicht gefunden', body: 'HSN: 0005\nTSN: 582 & mehr' })

        expect(href).toBe('mailto:service@example.com?subject=Fahrzeug%20nicht%20gefunden&body=HSN%3A%200005%0D%0ATSN%3A%20582%20%26%20mehr')

        const query = new URLSearchParams(href.split('?')[1])
        expect(query.get('subject')).toBe('Fahrzeug nicht gefunden')
        expect(query.get('body')).toBe('HSN: 0005\r\nTSN: 582 & mehr')
    })

    it('keeps umlauts and dashes intact through the encoding', () => {
        const href = mailtoHref(EMAIL, { body: 'Fahrzeug: BMW 3er Coupé – HSN 0005 · TSN 582' })

        expect(new URLSearchParams(href.split('?')[1]).get('body')).toBe('Fahrzeug: BMW 3er Coupé – HSN 0005 · TSN 582')
    })
})
