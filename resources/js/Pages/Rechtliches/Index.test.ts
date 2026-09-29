import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

/*
 * The legal pages render the Kanzlei's words as stored (D-024). Block G: the Datenschutz page adds the cookies
 * as a table of facts from the one list the cookie settings show — rmf_papiere and rmf_geraet as functional, each
 * with what it stores and how to clear it — and no other page carries it.
 */

vi.mock('@inertiajs/vue3', () => ({
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
}))

const { default: Rechtliches } = await import('./Index.vue')

const tabs = [
    { slug: 'impressum', title: 'Impressum' },
    { slug: 'datenschutz', title: 'Datenschutz' },
]

describe('Rechtliches', () => {
    it('lists every cookie on the Datenschutz page, the two functional ones with how to clear them', () => {
        const wrapper = mount(Rechtliches, { props: { tabs, active: 'datenschutz', blocks: [] } })
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
        const wrapper = mount(Rechtliches, { props: { tabs, active: 'impressum', blocks: [] } })

        expect(wrapper.find('#cookies').exists()).toBe(false)
    })
})
