import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

/*
 * The legal pages render the Kanzlei's words as stored (D-024). Block G: the Datenschutz page adds the cookies
 * as a table of facts from the one list the cookie settings show — rmf_papiere and rmf_geraet as functional, each
 * with what it stores and how to clear it — and no other page carries it. D-319: a placeholder shows one notice and
 * nothing that reads like a clause; an Impressum field not given shows its marker.
 */

vi.mock('@inertiajs/vue3', () => ({
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
}))

const { default: Rechtliches } = await import('./Index.vue')

const NOTICE = 'PLATZHALTER: Dieser Text wird vor der Veröffentlichung durch den Rechtstext der Kanzlei ersetzt.'

const tabs = [
    { slug: 'impressum', title: 'Impressum' },
    { slug: 'datenschutz', title: 'Datenschutz' },
]

const text = { placeholder: false, notice: NOTICE }

describe('Rechtliches', () => {
    it('lists every cookie on the Datenschutz page, the two functional ones with how to clear them', () => {
        const wrapper = mount(Rechtliches, { props: { tabs, active: 'datenschutz', blocks: [], ...text } })
        const rows = wrapper.findAll('#cookies tbody tr').map((row) => row.findAll('th, td').map((cell) => cell.text()))
        const byName = Object.fromEntries(rows.map((cells) => [cells[0], cells]))

        expect(byName.rmf_papiere?.[1]).toBe('Funktional')
        expect(byName.rmf_papiere?.[4]).toContain('Werte löschen')
        expect(byName.rmf_geraet?.[1]).toBe('Funktional')
        expect(byName.rmf_geraet?.[2]).toContain('zufällige Kennung')
        expect(byName.rmf_geraet?.[4]).toContain('Lösch die Cookies für diese Seite in deinem Browser')
        expect(byName.rmf_vehicle?.[1]).toBe('Notwendig')
    })

    it('shows the table on the Datenschutz page only', () => {
        const wrapper = mount(Rechtliches, { props: { tabs, active: 'impressum', blocks: [], ...text } })

        expect(wrapper.find('#cookies').exists()).toBe(false)
    })

    it('prints the Impressum’s facts from the seller data, a field not given as its marker', () => {
        const provider = {
            complete: false,
            rows: [
                { label: 'Anbieter', value: '[FIRMENNAME]', missing: true },
                { label: 'Anschrift', value: 'Musterweg 1', missing: false },
            ],
        }
        const wrapper = mount(Rechtliches, { props: { tabs, active: 'impressum', blocks: [], provider, ...text } })
        const section = wrapper.get('.rec__provider')

        expect(section.text()).toContain('Angaben gemäß § 5 DDG')
        expect(section.text()).toContain('Vorläufig: Die Angaben zum Betreiber liegen noch nicht vollständig vor')
        expect(section.findAll('.rec__fact').map((row) => row.text())).toEqual(['Anbieter[FIRMENNAME]', 'AnschriftMusterweg 1'])
        // The marker is set apart from a value, so nobody takes it for one.
        expect(section.findAll('.rec__marker').map((dd) => dd.text())).toEqual(['[FIRMENNAME]'])
    })

    it('says „noch nicht angegeben“ where a row has no value and no marker — the test environment’s operator', () => {
        const provider = { complete: false, rows: [{ label: 'Anbieter', value: null }], notice: 'Diese Kopie des Shops ist nicht in Betrieb.' }
        const wrapper = mount(Rechtliches, { props: { tabs, active: 'impressum', blocks: [], provider, ...text } })

        expect(wrapper.get('.rec__fact').text()).toBe('Anbieternoch nicht angegeben')
        expect(wrapper.find('.rec__marker').exists()).toBe(false)
    })

    it('drops the „Vorläufig" note once every fact is given', () => {
        const provider = { complete: true, rows: [{ label: 'Anbieter', value: 'Beispiel Handels GmbH', missing: false }] }
        const wrapper = mount(Rechtliches, { props: { tabs, active: 'impressum', blocks: [], provider, ...text } })

        expect(wrapper.get('.rec__provider').text()).not.toContain('Vorläufig')
    })

    // The operator's brief of 23.10.2026: a placeholder page holds one clear notice, and nothing that reads like a clause.
    it('shows a placeholder’s one notice and not one word of the blocks', () => {
        const blocks = [{ id: 1, type: 'legal_body', data: { heading: 'Geltungsbereich', text: 'Diese AGB gelten für alle Bestellungen.' } }]
        const wrapper = mount(Rechtliches, { props: { tabs, active: 'datenschutz', blocks, placeholder: true, notice: NOTICE } })

        expect(wrapper.findAll('.rec__placeholder').map((p) => p.text())).toEqual([NOTICE])
        expect(wrapper.text()).not.toContain('Geltungsbereich')
        expect(wrapper.text()).not.toContain('Diese AGB gelten')
    })

    it('shows the text, and no notice, once the flag is off', () => {
        const blocks = [{ id: 1, type: 'legal_body', data: { heading: 'Geltungsbereich', text: 'Der Text der Kanzlei.' } }]
        const wrapper = mount(Rechtliches, { props: { tabs, active: 'datenschutz', blocks, ...text } })

        expect(wrapper.text()).toContain('Der Text der Kanzlei.')
        expect(wrapper.text()).not.toContain('PLATZHALTER')
    })

    it('marks placeholder values as placeholders, never as the operator’s own', () => {
        const provider = { complete: false, placeholder: true, rows: [{ label: 'Anbieter', value: 'Beispiel Handels GmbH', missing: false }] }
        const wrapper = mount(Rechtliches, { props: { tabs, active: 'impressum', blocks: [], provider, ...text } })
        const note = wrapper.get('.rec__provider .rec__placeholder')

        expect(note.text()).toBe('Platzhalter: Die folgenden Angaben sind Beispielwerte, nicht die des Betreibers. Sie werden vor dem Start ersetzt.')
        expect(wrapper.get('.rec__provider').text()).not.toContain('Vorläufig')
        // The note comes before the values it qualifies.
        expect(note.element.compareDocumentPosition(wrapper.get('.rec__facts').element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })
})
