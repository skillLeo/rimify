import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { AdminUebersichtProps, Kpi } from '../../../types/admin/uebersicht'

/*
 * DashboardEmptyState (the density brief): the Übersicht of a shop with nothing yet — the props
 * DashboardEmptyStateTest.php gets from a fresh database — renders every empty sentence, keeps
 * every figure a figure, and draws no chart box for data it does not have.
 */

const page = { props: { admin: { health: { state: 'ok', sentence: 'Alles in Ordnung.', label: 'Alles in Ordnung', count: null, href: null, banner: null } } } }

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => page,
    router: { on: () => () => undefined, reload: () => undefined },
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
}))

vi.mock('reka-ui', () => {
    const pass = defineComponent({ setup: (_, { slots }) => () => slots.default?.() })
    const none = defineComponent({ setup: () => () => null })

    return {
        TooltipProvider: pass,
        TooltipRoot: pass,
        TooltipTrigger: pass,
        TooltipPortal: none,
        TooltipContent: pass,
        DropdownMenuRoot: pass,
        DropdownMenuTrigger: pass,
        DropdownMenuPortal: none,
        DropdownMenuContent: pass,
        DropdownMenuItem: pass,
        DropdownMenuSeparator: none,
        DropdownMenuLabel: pass,
    }
})

vi.mock('../../../Layouts/AdminLayout.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => slots.default?.() }) }))
vi.mock('../../../Components/Admin/Dashboard/PeriodSwitcher.vue', () => ({ default: defineComponent({ setup: () => () => null }) }))

const { default: Page } = await import('./Index.vue')
const { NNBSP } = await import('../../../lib/num')

function tile(key: string, value: number | null, text: string, kind: Kpi['sub']['kind'] = 'reason'): Kpi {
    return { key, label: key, hint: key, value, unit: key === 'umsatz' || key === 'bestellwert' ? 'EUR' : null, sub: { text, kind, direction: null }, series: [], href: null }
}

const EMPTY: AdminUebersichtProps = {
    asOf: '27.09.2026, 10:00 Uhr',
    period: { key: '30', von: '2026-08-29', bis: '2026-09-27', label: 'Letzte 30 Tage', range: '29.08.–27.09.2026', previousRange: '30.07.–28.08.2026', days: 30, compare: true },
    variant: 'verkauf',
    kpis: [
        tile('umsatz', 0, 'Vorzeitraum ohne bezahlte Bestellung'),
        tile('bestellungen', 0, 'Vorzeitraum ohne bezahlte Bestellung'),
        tile('bestellwert', null, 'noch keine bezahlte Bestellung'),
        tile('offen', 0, 'alles versendet', 'note'),
    ],
    quality: null,
    demo: false,
    recentOrders: [],
    todo: [],
    today: [],
    activity: [],
    charts: {
        revenue: null,
        verdicts: null,
        topWheels: [],
        coverage: { sizes: [], rows: [], max: 0, summary: { fitments: '0', variants: '0', sentence: '' }, computedAt: '' },
        demand: { rows: [], counts: { offen: 0, beobachtet: 0, angefordert: 0, alle: 0 }, asks: 0, waiting: 0 },
        failed: [],
    },
    chartKeys: ['revenue', 'verdicts', 'topWheels', 'coverage', 'demand'],
    coverageRows: 0,
    can: { export: false },
}

describe('DashboardEmptyState', () => {
    const wrapper = mount(Page, { props: EMPTY })
    const text = wrapper.text()

    it('says in a sentence what each card will show', () => {
        for (const sentence of [
            'Noch kein Umsatz in diesem Zeitraum. Die Linie beginnt mit der ersten bezahlten Bestellung.',
            'Heute ist nichts offen.',
            'Der Shop zählt jede Prüfung einer Felge an einem Auto.',
            'Noch keine bezahlte Bestellung mit Felgen in diesem Zeitraum.',
            'Noch kein Fahrzeug im Katalog.',
            'Im Zeitraum hat niemand nach einem Auto gefragt, für das der Shop keine Felge zeigen kann.',
            'Hier erscheinen die neuesten Bestellungen, sobald jemand im Shop bestellt.',
            'Alles erledigt.',
            'Jede Änderung im Admin erscheint hier, sobald jemand aus dem Team sie speichert.',
        ]) {
            expect(text).toContain(sentence)
        }
    })

    it('keeps zero a figure, and a dash only for what cannot be computed — with its reason', () => {
        const values = wrapper.findAll('.kpi__value').map((v) => v.text())

        expect(values[0]).toBe(`0,00${NNBSP}€`)
        expect(values[1]).toBe('0')
        expect(wrapper.findAll('.kpi__value--none')).toHaveLength(1)
        expect(wrapper.findAll('.kpi__sub').every((line) => line.text() !== '')).toBe(true)
        expect(text).toContain('noch keine bezahlte Bestellung')
    })

    it('holds no plot for data it does not have: an empty card is its sentence', () => {
        expect(wrapper.find('.lc').exists()).toBe(false)
        expect(wrapper.find('.sb__plot').exists()).toBe(false)
        expect(wrapper.find('.bc').exists()).toBe(false)
        expect(wrapper.findAll('.widget__state[style]')).toHaveLength(0)
    })
})

/*
 * The bug that was on screen (the Katalog brief §0): the tiles printed `5974800` — minor units,
 * unformatted. An amount is minor units until the render edge, and there it goes through num.ts.
 */
describe('money on the Übersicht', () => {
    const filled: AdminUebersichtProps = {
        ...EMPTY,
        kpis: [
            { ...tile('umsatz', 5_974_800, '+15 % zum Vorzeitraum', 'delta'), sub: { text: '+15 % zum Vorzeitraum', kind: 'delta', direction: 'up' } },
            tile('bestellungen', 38, '+12 % zum Vorzeitraum', 'delta'),
            tile('bestellwert', 153_200, 'höchster Bestellwert 4.784,00 €', 'note'),
            tile('offen', 9, 'älteste seit 2 Tagen', 'note'),
        ],
        recentOrders: [
            { id: 1, number: 'RMF-D-2026-00417', customer: 'Petra Bauer', total: 5_974_800, payment: { label: 'Bezahlt', tone: 'plain' }, fulfilment: { label: 'In Bearbeitung', tone: 'neutral' }, ago: 'vor 2 Std.', iso: null, demo: true, href: '/admin/bestellungen?q=RMF-D-2026-00417', customerHref: null },
        ],
    }
    const text = mount(Page, { props: filled }).text()

    it('writes 5974800 minor units as 59.748,00 € — on the tile and in the table — and never the raw number', () => {
        expect(text).toContain(`59.748,00${NNBSP}€`)
        expect(text).toContain(`1.532,00${NNBSP}€`)
        expect(text).not.toContain('5974800')
        expect(text).not.toContain('153200')
    })
})
