import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { CoverageMatrix as Matrix } from '../../../types/admin/uebersicht'

/*
 * The Abdeckungs-Matrix: the shade follows the count on one ramp, an empty cell stays empty, every
 * count is printed in German, and pointing at a cell says it in a sentence and leads to its list.
 */

vi.mock('@inertiajs/vue3', () => ({
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
}))

const { default: CoverageMatrix } = await import('./CoverageMatrix.vue')

function cell(make: string, size: string, count: number, level: number, total: number) {
    return {
        size,
        count,
        level,
        sentence: `${make}, ${size} Zoll: ${count} von ${total} Varianten`,
        href: `/admin/abdeckung?marke=${make}&zoll=${size}`,
    }
}

const matrix: Matrix = {
    sizes: [{ key: '18', label: '18″' }, { key: '19', label: '19″' }],
    rows: [
        { make: 'BMW', variants: 1680, covered: 1420, cells: [cell('BMW', '18', 1420, 7, 1680), cell('BMW', '19', 210, 2, 1680)] },
        { make: 'Audi', variants: 13, covered: 0, cells: [cell('Audi', '18', 0, 0, 13), cell('Audi', '19', 0, 0, 13)] },
    ],
    max: 1420,
    summary: { fitments: '2.224', variants: '73', sentence: 'Abdeckung insgesamt: 2.224 Freigaben über 73 Varianten' },
    computedAt: '27.09.2026, 10:00',
}

describe('CoverageMatrix', () => {
    it('reads as a table: makes as row headers, sizes as column headers', () => {
        const wrapper = mount(CoverageMatrix, { props: { matrix } })

        expect(wrapper.findAll('thead th[scope="col"]').map((th) => th.find('.visually-hidden').exists() ? th.find('.visually-hidden').text() : th.text())).toEqual(['Marke', '18 Zoll', '19 Zoll'])
        expect(wrapper.findAll('tbody th[scope="row"]').map((th) => th.find('.cm__make-name').text())).toEqual(['BMW', 'Audi'])
        expect(wrapper.find('.cm__make-count').text()).toBe('1.420 von 1.680')
    })

    it('shades a cell by its level on the sequential ramp, and prints its count in German', () => {
        const cells = mount(CoverageMatrix, { props: { matrix } }).findAll('.cm__cell')

        expect(cells[0]!.attributes('style')).toContain('var(--chart-seq-7)')
        expect(cells[0]!.classes()).toContain('cm__cell--dark')
        expect(cells[0]!.text()).toBe('1.420')
        expect(cells[1]!.attributes('style')).toContain('var(--chart-seq-2)')
        expect(cells[1]!.classes()).not.toContain('cm__cell--dark')
    })

    it('leaves a cell without an approved variant unshaded', () => {
        const empty = mount(CoverageMatrix, { props: { matrix } }).findAll('.cm__cell')[2]!

        expect(empty.attributes('style')).toBeUndefined()
        expect(empty.classes()).toContain('cm__cell--none')
        expect(empty.text()).toBe('0')
    })

    it('says the whole in a sentence, and the pointed cell instead while it is pointed at', async () => {
        const wrapper = mount(CoverageMatrix, { props: { matrix } })
        const caption = wrapper.find('.cm__caption')

        expect(caption.text()).toBe('Abdeckung insgesamt: 2.224 Freigaben über 73 Varianten')
        expect(caption.attributes('aria-live')).toBe('polite')

        await wrapper.findAll('.cm__cell')[1]!.trigger('mouseenter')
        expect(caption.text()).toBe('BMW, 19 Zoll: 210 von 1680 Varianten')

        await wrapper.findAll('.cm__cell')[1]!.trigger('mouseleave')
        expect(caption.text()).toContain('Abdeckung insgesamt')

        await wrapper.findAll('.cm__cell')[0]!.trigger('focus')
        expect(caption.text()).toBe('BMW, 18 Zoll: 1420 von 1680 Varianten')
    })

    it('opens the list of the variants a cell counts', () => {
        const first = mount(CoverageMatrix, { props: { matrix } }).find('a.cm__cell')

        expect(first.attributes('href')).toBe('/admin/abdeckung?marke=BMW&zoll=18')
        expect(first.attributes('aria-label')).toBe('BMW, 18 Zoll: 1420 von 1680 Varianten')
    })

    it('draws the legend from the first step to the last, ending at the largest count', () => {
        const legend = mount(CoverageMatrix, { props: { matrix } }).find('.cm__legend')

        expect(legend.findAll('.cm__swatch')).toHaveLength(7)
        expect(legend.findAll('.cm__swatch')[6]!.attributes('style')).toContain('var(--chart-seq-7)')
        expect(legend.text()).toContain('1.420')
    })
})
