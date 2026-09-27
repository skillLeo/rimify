import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { Kpi } from '../../../types/admin/uebersicht'

/*
 * A KPI tile: the server's German figure as it is, the change as words and an arrow, a sentence in
 * place of a zero, and the whole tile as the link to what it counts — with what it counts read to a
 * screen reader.
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

function kpi(overrides: Partial<Kpi> = {}): Kpi {
    return {
        key: 'umsatz',
        label: 'Umsatz',
        hint: 'Summe der bezahlten, nicht erstatteten Bestellungen, nach Bestelldatum.',
        value: '6.132,00 €',
        empty: null,
        delta: { value: 12.4, direction: 'up', label: '+12,4 % zum Vorzeitraum' },
        deltaNote: null,
        series: [1, 2, 3],
        note: null,
        href: '/admin/bestellungen?status=bezahlt',
        ...overrides,
    }
}

describe('KpiTile', () => {
    it('is one link to its list, and says what it counts to a screen reader', () => {
        const tile = mount(KpiTile, { props: { kpi: kpi(), compare: true } }).find('a.kpi')
        const describedBy = tile.attributes('aria-describedby') ?? ''

        expect(tile.attributes('href')).toBe('/admin/bestellungen?status=bezahlt')
        expect(tile.find(`[id="${describedBy}"]`).text()).toBe('Summe der bezahlten, nicht erstatteten Bestellungen, nach Bestelldatum.')
    })

    it('shows the figure as the server formatted it, and the change in words with its direction', () => {
        const wrapper = mount(KpiTile, { props: { kpi: kpi(), compare: true } })

        expect(wrapper.find('.kpi__value').text()).toBe('6.132,00 €')
        expect(wrapper.find('.kpi__delta--up').text()).toBe('+12,4 % zum Vorzeitraum')
        expect(wrapper.find('.spark').exists()).toBe(true)
    })

    it('drops the change when comparing is off', () => {
        expect(mount(KpiTile, { props: { kpi: kpi(), compare: false } }).find('.kpi__delta').exists()).toBe(false)
    })

    it('says why there is no change rather than leaving a gap', () => {
        const wrapper = mount(KpiTile, { props: { kpi: kpi({ delta: null, deltaNote: 'Im Vorzeitraum keine Bestellung' }), compare: true } })

        expect(wrapper.find('.kpi__meta').text()).toBe('Im Vorzeitraum keine Bestellung')
    })

    it('keeps the tile’s shape with nothing to count: a quiet dash, never a zero, the sentence beneath, no curve', () => {
        const wrapper = mount(KpiTile, { props: { kpi: kpi({ value: null, empty: 'Keine bezahlte Bestellung in diesem Zeitraum.', delta: null, series: [] }), compare: true } })
        const dash = wrapper.get('.kpi__value')

        expect(dash.text()).toBe('—')
        expect(dash.classes()).toContain('kpi__value--none')
        // Said by the sentence, not as „Gedankenstrich“.
        expect(dash.attributes('aria-hidden')).toBe('true')
        expect(wrapper.find('.kpi__empty').text()).toBe('Keine bezahlte Bestellung in diesem Zeitraum.')
        expect(wrapper.find('.spark').exists()).toBe(false)
    })

    it('gives a figure its second line — one fact — above the change', () => {
        const wrapper = mount(KpiTile, { props: { kpi: kpi({ note: 'letzte vor 2 Std.' }), compare: true } })
        const lines = wrapper.findAll('.kpi__meta, .kpi__delta').map((line) => line.text())

        expect(lines[0]).toBe('letzte vor 2 Std.')
        expect(lines[1]).toContain('zum Vorzeitraum')
    })

    it('is plain, not a link, where this role cannot open the list', () => {
        const wrapper = mount(KpiTile, { props: { kpi: kpi({ href: null }), compare: true } })

        expect(wrapper.find('a').exists()).toBe(false)
        expect(wrapper.find('.kpi__go').exists()).toBe(false)
    })
})
