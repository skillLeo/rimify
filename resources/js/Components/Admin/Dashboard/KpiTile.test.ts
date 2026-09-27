import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { Kpi } from '../../../types/admin/uebersicht'

/*
 * A KPI tile (the density brief): the figure and its unit — money from minor units through num.ts — and
 * exactly one line under it; zero is `0`, a dash only where no figure can be computed, with why; the
 * whole tile the link to what it counts, with what it counts read to a screen reader.
 */

vi.mock('@inertiajs/vue3', () => ({
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
}))

vi.mock('reka-ui', () => {
    const pass = defineComponent({ setup: (_, { slots }) => () => slots.default?.() })

    return {
        TooltipProvider: pass,
        TooltipRoot: pass,
        TooltipTrigger: pass,
        TooltipPortal: defineComponent({ setup: () => () => null }),
        TooltipContent: pass,
    }
})

const { default: KpiTile } = await import('./KpiTile.vue')

const NNBSP = ' '

function kpi(overrides: Partial<Kpi> = {}): Kpi {
    return {
        key: 'umsatz',
        label: 'Umsatz',
        hint: 'Summe der bezahlten, nicht erstatteten Bestellungen, nach Bestelldatum.',
        value: 16_201_950,
        unit: 'EUR',
        sub: { text: '+15 % zum Vorzeitraum', kind: 'delta', direction: 'up' },
        series: [1, 2, 3],
        href: '/admin/bestellungen?status=bezahlt',
        ...overrides,
    }
}

describe('KpiTile', () => {
    it('is one link to its list, and says what it counts to a screen reader', () => {
        const tile = mount(KpiTile, { props: { kpi: kpi() } }).find('a.kpi')
        const describedBy = tile.attributes('aria-describedby') ?? ''

        expect(tile.attributes('href')).toBe('/admin/bestellungen?status=bezahlt')
        expect(tile.find(`[id="${describedBy}"]`).text()).toBe('Summe der bezahlten, nicht erstatteten Bestellungen, nach Bestelldatum.')
    })

    it('writes money from minor units with its cents, the unit beside the figure, and the change as words and an arrow', () => {
        const wrapper = mount(KpiTile, { props: { kpi: kpi() } })

        expect(wrapper.find('.kpi__value').text()).toBe(`162.019,50${NNBSP}€`)
        expect(wrapper.find('.kpi__unit').text()).toBe('€')
        expect(wrapper.find('.kpi__sub--up').text()).toBe('+15 % zum Vorzeitraum')
        expect(wrapper.find('.kpi__sub svg').exists()).toBe(true)
        expect(wrapper.find('.spark').exists()).toBe(true)
    })

    it('shows zero as a figure, never as a dash', () => {
        const wrapper = mount(KpiTile, { props: { kpi: kpi({ key: 'offen', value: 0, unit: null, sub: { text: 'alles versendet', kind: 'note', direction: null }, series: [] }) } })

        expect(wrapper.find('.kpi__value').text()).toBe('0')
        expect(wrapper.find('.kpi__value--none').exists()).toBe(false)
        expect(wrapper.find('.kpi__sub').text()).toBe('alles versendet')
    })

    it('draws a dash only where no figure can be computed, and says why in its line', () => {
        const wrapper = mount(KpiTile, { props: { kpi: kpi({ value: null, sub: { text: 'noch keine bezahlte Bestellung', kind: 'reason', direction: null }, series: [] }) } })
        const dash = wrapper.get('.kpi__value')

        expect(dash.classes()).toContain('kpi__value--none')
        // Heard as „keine Zahl“, never as „Gedankenstrich“.
        expect(dash.get('[aria-hidden="true"]').text()).toBe('—')
        expect(dash.get('.visually-hidden').text()).toBe('keine Zahl')
        expect(wrapper.find('.kpi__sub--reason').text()).toBe('noch keine bezahlte Bestellung')
        expect(wrapper.find('.spark').exists()).toBe(false)
    })

    it('has exactly one line under the figure', () => {
        for (const sub of [
            { text: '+15 % zum Vorzeitraum', kind: 'delta', direction: 'up' },
            { text: 'letzte vor 2 Std.', kind: 'note', direction: null },
            { text: 'Vorzeitraum ohne bezahlte Bestellung', kind: 'reason', direction: null },
        ] as Kpi['sub'][]) {
            const lines = mount(KpiTile, { props: { kpi: kpi({ sub }) } }).findAll('.kpi__sub')

            expect(lines).toHaveLength(1)
            expect(lines[0]?.text()).toBe(sub.text)
        }
    })

    it('is plain, not a link, where this role cannot open the list', () => {
        const wrapper = mount(KpiTile, { props: { kpi: kpi({ href: null }) } })

        expect(wrapper.find('a').exists()).toBe(false)
        expect(wrapper.find('.kpi__go').exists()).toBe(false)
    })
})
