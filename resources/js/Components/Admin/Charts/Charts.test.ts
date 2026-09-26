import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import BarChart from './BarChart.vue'
import LineChart from './LineChart.vue'
import StackedBar from './StackedBar.vue'
import type { ChartPoint, VerdictChart } from '../../../types/admin/uebersicht'

/*
 * Chart geometry (BRIEF §4 tests): bar lengths proportional to the values, stacked segments summing
 * to the column's total, a single point and an all-zero series drawn without NaN, the axis in German.
 */

/** The narrow no-break space format.ts puts between a figure and its unit. */
const NNBSP = String.fromCharCode(0x202f)

function point(value: number, i: number): ChartPoint {
    return { key: `d${i}`, label: `0${i + 1}.09.2026`, value, text: `${value} €` }
}

/** The vertical extent of a column path drawn by StackedBar: `M x,bottom V top ...`. */
function extent(d: string): { top: number; bottom: number } {
    const bottom = Number(/^M[\d.]+,([\d.]+)/.exec(d)?.[1])
    const top = Math.min(...[...d.matchAll(/[\d.]+,([\d.]+)/g)].map((m) => Number(m[1])), ...[...d.matchAll(/V([\d.]+)/g)].map((m) => Number(m[1])))

    return { top, bottom }
}

describe('BarChart', () => {
    it('draws each bar in proportion to the largest, the first in the accent', () => {
        const bars = mount(BarChart, { props: { label: 'Top', bars: [point(8, 0), point(4, 1), point(2, 2)] } }).findAll('.bc__bar')

        expect(bars.map((b) => b.attributes('style'))).toEqual([
            expect.stringContaining('width: 100%'),
            expect.stringContaining('width: 50%'),
            expect.stringContaining('width: 25%'),
        ])
        expect(bars[0]?.classes()).toContain('bc__bar--lead')
        expect(bars[1]?.classes()).not.toContain('bc__bar--lead')
    })

    it('says each value at its tip, in words', () => {
        const values = mount(BarChart, { props: { label: 'Top', bars: [{ key: 'a', label: 'BORBET Y', value: 2, text: '2 Bestellungen' }] } }).findAll('.bc__value')

        expect(values.map((v) => v.text())).toEqual(['2 Bestellungen'])
    })
})

describe('StackedBar', () => {
    const chart: VerdictChart = {
        series: [
            { key: 'PERMITTED', label: 'Freigegeben' },
            { key: 'CONDITIONAL', label: 'Mit Auflagen' },
            { key: 'NOT_PERMITTED', label: 'Nicht freigegeben' },
            { key: 'UNKNOWN', label: 'Unbekannt' },
        ],
        weeks: [
            { key: 'w1', label: 'KW 38', range: '14.09.–20.09.2026', values: { PERMITTED: 6, CONDITIONAL: 2, NOT_PERMITTED: 0, UNKNOWN: 2 }, total: 10 },
            { key: 'w2', label: 'KW 39', range: '21.09.–26.09.2026', values: { PERMITTED: 5, CONDITIONAL: 0, NOT_PERMITTED: 0, UNKNOWN: 0 }, total: 5 },
        ],
        since: '14.09.2026',
    }

    it('names every series in the legend, in words', () => {
        expect(mount(StackedBar, { props: { chart, label: 'Verdikte' } }).findAll('.sb__key').map((k) => k.text())).toEqual(['Freigegeben', 'Mit Auflagen', 'Nicht freigegeben', 'Unbekannt'])
    })

    it('stacks only the series a week has, in their fixed colours', () => {
        const columns = mount(StackedBar, { props: { chart, label: 'Verdikte' } }).findAll('.sb__column')
        const first = columns[0]!.findAll('path')

        expect(first.map((p) => p.attributes('fill'))).toEqual(['var(--chart-cat-1)', 'var(--chart-cat-2)', 'var(--chart-cat-4)'])
        expect(columns[1]!.findAll('path')).toHaveLength(1)
    })

    it('makes a column of twice the total twice as tall, the gaps included', () => {
        const columns = mount(StackedBar, { props: { chart, label: 'Verdikte' } }).findAll('.sb__column')
        const span = (col: (typeof columns)[number]) => {
            const parts = col.findAll('path').map((p) => extent(p.attributes('d') ?? ''))

            return Math.max(...parts.map((p) => p.bottom)) - Math.min(...parts.map((p) => p.top))
        }

        // The first column's segments are parted by two 2 px gaps; its height still stands for 10.
        expect(span(columns[0]!) + 0).toBeCloseTo(span(columns[1]!) * 2, 0)
    })
})

describe('LineChart', () => {
    it('draws a single day and an all-zero period without a single NaN', () => {
        const one = mount(LineChart, { props: { label: 'Umsatz', points: [point(100, 0)] } })
        const zero = mount(LineChart, { props: { label: 'Umsatz', points: [point(0, 0), point(0, 1), point(0, 2)] } })

        expect(one.html()).not.toContain('NaN')
        expect(zero.html()).not.toContain('NaN')
    })

    it('labels its last point with its value, and writes the axis in German', () => {
        const wrapper = mount(LineChart, { props: { label: 'Umsatz', points: [point(0, 0), point(250_000, 1), point(142_550, 2)].map((p, i) => ({ ...p, text: ['0,00 €', '2.500,00 €', '1.425,50 €'][i]! })) } })
        const ticks = wrapper.findAll('.lc__grid .lc__tick').map((t) => t.text())

        expect(wrapper.find('.lc__value').text()).toBe('1.425,50 €')
        // Whole euros, a thousands point, and a narrow no-break space before the sign (format.ts).
        expect(ticks).toContain(`0${NNBSP}€`)
        expect(ticks.some((t) => new RegExp(`^\\d{1,3}(\\.\\d{3})*${NNBSP}€$`).test(t) && t !== `0${NNBSP}€`)).toBe(true)
    })

    it('draws the previous period beside it on the same axis, never a second one', () => {
        const wrapper = mount(LineChart, { props: { label: 'Umsatz', points: [point(10, 0), point(20, 1)], previous: [point(40, 0), point(5, 1)] } })

        expect(wrapper.find('.lc__previous').exists()).toBe(true)
        // One set of y-axis labels, however many lines.
        expect(wrapper.findAll('.lc__grid text[text-anchor="end"]').length).toBeGreaterThan(0)
        expect(wrapper.findAll('g.lc__grid')).toHaveLength(1)
    })
})
