import { describe, expect, it } from 'vitest'
import { docSVG, papersSVG } from './doc'

describe('papersSVG', () => {
    it('rings the four fields the tyre check reads on the certificate issued since 2005', () => {
        const svg = papersSVG('neu')

        for (const label of ['8.1', '8.2', 'T', 'P.2']) {
            expect(svg).toContain(`>${label}</text>`)
        }

        expect(svg).toContain('Zulassungsbescheinigung Teil I')
        expect(svg).toContain('Achslast vorn')
        expect(svg).toContain('Achslast hinten')
        expect(svg.match(/<rect x="40"[^>]*stroke="#1A44D4"/g)).toHaveLength(4)
    })

    it('rings Ziffer 6, 7 and 16 on the older Fahrzeugschein, where both axle loads share one field', () => {
        const svg = papersSVG('alt')

        expect(svg).toContain('Fahrzeugschein')
        expect(svg).toContain('>16</text>')
        expect(svg).toContain('Achslasten')
        expect(svg.match(/<rect x="40"[^>]*stroke="#1A44D4"/g)).toHaveLength(3)
    })

    it('is a picture with a name when titled, and hidden from assistive technology otherwise', () => {
        expect(papersSVG('neu', { title: 'Wo die Achslasten stehen' })).toContain('role="img" aria-label="Wo die Achslasten stehen"')
        expect(papersSVG('neu')).toContain('aria-hidden="true"')
    })

    it('keeps the key-number drawing as it was', () => {
        const svg = docSVG('neu')

        expect(svg).toContain('>2.1<')
        expect(svg).toContain('HSN')
        expect(svg).toContain('TSN')
    })
})
