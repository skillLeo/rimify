import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import GutachtenStory from './GutachtenStory.vue'
import type { HomeStats } from '../../../types/pages'

const stats: HomeStats = { gutachten: 1234, variants: 56789, wheels: 412, brands: 6 }

let wrappers: VueWrapper[] = []

function mountStory(props: { stats?: HomeStats | null } = {}): VueWrapper {
    const wrapper = mount(GutachtenStory, { props: { stats: props.stats === undefined ? stats : props.stats } })
    wrappers.push(wrapper)

    return wrapper
}

afterEach(() => {
    wrappers.forEach((w) => w.unmount())
    wrappers = []
})

describe('GutachtenStory (phone)', () => {
    it('is three crops of the same document, rows 3–5 with one tyre size each and the marked row in the middle', () => {
        const wrapper = mountStory()

        const crops = wrapper.findAll('figure.doc.doc--crop')
        expect(crops).toHaveLength(3)

        for (const crop of crops) {
            expect(crop.attributes('role')).toBe('img')
            expect(crop.attributes('aria-label')).toBe('Beispiel eines Gutachten-Auszugs; die Zeile des gewählten Fahrzeugs ist markiert')
            expect(crop.findAll('th').map((th) => th.text())).toEqual(['Hersteller', 'Typ', 'Genehmigungsnr.', 'Reifengrößen', 'Auflagen'])

            const rows = crop.findAll('tbody tr').map((tr) => tr.findAll('td').map((td) => td.text()))
            expect(rows).toEqual([
                ['Mercedes-Benz', 'W205', 'e1*2007/46*0402*', '225/45 R17', 'A11'],
                ['BMW', '346C', 'e1*2001/116*0136*', '225/40 R18', '–'],
                ['Škoda', '5E', 'e11*2007/46*0122*', '225/45 R17', 'K1a'],
            ])
        }
    })

    it('marks more of the row with every step and stamps only the last crop', () => {
        const wrapper = mountStory()
        const crops = wrapper.findAll('figure.doc--crop')

        // Two paths per stroke: the stroke and its echo.
        expect(crops[0]?.findAll('svg.marker path')).toHaveLength(2)
        expect(crops[1]?.findAll('svg.marker path')).toHaveLength(4)
        expect(crops[2]?.findAll('svg.marker path')).toHaveLength(6)

        expect(crops[0]?.find('.doc__stamp').exists()).toBe(false)
        expect(crops[1]?.find('.doc__stamp').exists()).toBe(false)
        expect(crops[2]?.find('.doc__stamp .verdict--ok').text()).toBe('Freigegeben')

        for (const crop of crops) {
            for (const path of crop.findAll('svg.marker path')) {
                expect(path.attributes('stroke')).toMatch(/^url\(#marker-ink-\d\)$/)
            }
        }
    })

    it('writes the Auflagen out as sentences beside the document and keeps the codes inside it', () => {
        const wrapper = mountStory()

        const steps = wrapper.findAll('.story__text').map((p) => p.text()).join(' ')
        expect(steps).not.toMatch(/\bA11\b|\bK1a\b/)
        expect(wrapper.find('.story__example .verdict--warn').text()).toBe('Mit Auflagen')
        expect(wrapper.find('.story__conditions').text()).toContain('Die Verwendung ist nur mit Reifen der Größe 225/40 R18 zulässig.')
        expect(wrapper.findAll('h3').map((h) => h.text())).toEqual(['1 Fahrzeug eindeutig erkennen', '2 Gutachten abgleichen', '3 Klare Antwort'])
        expect(wrapper.findAll('a')).toHaveLength(0)
        expect(wrapper.findAll('.btn')).toHaveLength(0)
    })

    it('formats the facts line in German and hides it when any count is zero or the stats are missing', () => {
        expect(mountStory().find('.story__facts').text()).toBe('1.234 Gutachten · 56.789 Fahrzeugvarianten · 412 Felgen mit Gutachten')
        expect(mountStory({ stats: { gutachten: 12, variants: 0, wheels: 40, brands: 2 } }).find('.story__facts').exists()).toBe(false)
        expect(mountStory({ stats: null }).find('.story__facts').exists()).toBe(false)
    })
})
