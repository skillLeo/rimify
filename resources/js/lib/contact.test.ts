import { describe, expect, it } from 'vitest'
import { contactHref } from './contact'

describe('contactHref (#26)', () => {
    it('is the bare form without anything to carry', () => {
        expect(contactHref()).toBe('/kontakt')
        expect(contactHref({ subject: '', from: null })).toBe('/kontakt')
    })

    it('carries the subject and the shop path, encoded', () => {
        expect(contactHref({ subject: 'Fahrzeug nicht gefunden: HSN 0005 · TSN 582', from: '/felgen?zoll=19' })).toBe(
            '/kontakt?betreff=Fahrzeug+nicht+gefunden%3A+HSN+0005+%C2%B7+TSN+582&von=%2Ffelgen%3Fzoll%3D19'
        )
    })

    it('takes only a path of this shop, and never the form itself, as the way back', () => {
        expect(contactHref({ from: '//example.org/x' })).toBe('/kontakt')
        expect(contactHref({ from: 'https://example.org/' })).toBe('/kontakt')
        expect(contactHref({ from: '/kontakt?betreff=x' })).toBe('/kontakt')
        expect(contactHref({ from: '/kontakt' })).toBe('/kontakt')
        expect(contactHref({ from: '/kontaktlinsen' })).toBe('/kontakt?von=%2Fkontaktlinsen')
    })

    it('keeps the subject within the 150 characters the form takes', () => {
        const href = contactHref({ subject: 'x'.repeat(200) })

        expect(new URLSearchParams(href.split('?')[1]).get('betreff')).toHaveLength(150)
    })
})
