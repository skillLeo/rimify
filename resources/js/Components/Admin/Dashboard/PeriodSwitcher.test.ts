import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { DashboardPeriod } from '../../../types/admin/uebersicht'

/*
 * The Zeitraum: a preset visits the Übersicht with it, an own range is checked the German way before
 * it is sent, the comparison switch sends its state, and the export is a plain download link.
 */

const get = vi.fn()

vi.mock('@inertiajs/vue3', () => ({ router: { get: (...a: unknown[]) => get(...a) } }))

vi.mock('reka-ui', () => {
    const pass = defineComponent({ setup: (_, { slots, attrs }) => () => h('div', attrs, slots.default?.()) })

    return {
        DropdownMenuRoot: pass,
        DropdownMenuTrigger: defineComponent({ setup: (_, { slots, attrs }) => () => h('button', attrs, slots.default?.()) }),
        DropdownMenuPortal: pass,
        DropdownMenuContent: pass,
        DropdownMenuItem: defineComponent({ props: { asChild: Boolean }, setup: (_, { slots }) => () => slots.default?.() }),
        PopoverRoot: pass,
        PopoverTrigger: defineComponent({ setup: (_, { slots, attrs }) => () => h('button', attrs, slots.default?.()) }),
        PopoverPortal: pass,
        PopoverContent: pass,
        SwitchRoot: defineComponent({
            props: { modelValue: Boolean },
            emits: ['update:modelValue'],
            setup: (props, { emit }) => () => h('button', { class: 'switch', onClick: () => emit('update:modelValue', !props.modelValue) }),
        }),
        SwitchThumb: defineComponent({ setup: () => () => null }),
        ToggleGroupRoot: defineComponent({
            name: 'ToggleGroupRoot',
            props: { modelValue: String },
            emits: ['update:modelValue'],
            setup: (_, { slots, emit }) => () => h('div', { onChoose: (v: string) => emit('update:modelValue', v) }, slots.default?.()),
        }),
        ToggleGroupItem: defineComponent({
            props: { value: { type: String, required: true } },
            setup: (props, { slots }) => () => h('button', { class: 'seg', 'data-value': props.value }, slots.default?.()),
        }),
    }
})

const { default: PeriodSwitcher } = await import('./PeriodSwitcher.vue')

const PERIOD: DashboardPeriod = {
    key: '30', von: '2026-08-28', bis: '2026-09-26', label: 'Letzte 30 Tage', range: '28.08.–26.09.2026', previousRange: '29.07.–27.08.2026', days: 30, compare: true,
}

beforeEach(() => get.mockReset())

describe('PeriodSwitcher', () => {
    it('offers 7, 30 and 90 days, and visits the Übersicht with the one chosen', async () => {
        const wrapper = mount(PeriodSwitcher, { props: { period: PERIOD, exportUrl: null } })

        expect(wrapper.findAll('.seg').map((s) => s.text())).toEqual(['7 Tage', '30 Tage', '90 Tage'])

        wrapper.findComponent({ name: 'ToggleGroupRoot' }).vm.$emit('update:modelValue', '7')
        await wrapper.vm.$nextTick()

        expect(get).toHaveBeenCalledWith('/admin', { zeitraum: '7' }, expect.objectContaining({ preserveScroll: true }))
    })

    it('checks an own range the German way before sending it', async () => {
        const wrapper = mount(PeriodSwitcher, { props: { period: PERIOD, exportUrl: null } })

        await wrapper.find('#period-von').setValue('31.02.2026')
        await wrapper.find('form').trigger('submit')
        expect(wrapper.find('#period-error').text()).toBe('Bitte schreib das Datum als TT.MM.JJJJ, zum Beispiel 01.09.2026.')
        expect(get).not.toHaveBeenCalled()

        await wrapper.find('#period-von').setValue('01.09.2026')
        await wrapper.find('#period-bis').setValue('10.09.2026')
        await wrapper.find('form').trigger('submit')
        expect(get).toHaveBeenCalledWith('/admin', { zeitraum: 'eigen', von: '2026-09-01', bis: '2026-09-10' }, expect.anything())
    })

    it('sends the comparison switch as it now stands', async () => {
        await mount(PeriodSwitcher, { props: { period: PERIOD, exportUrl: null } }).find('.switch').trigger('click')

        expect(get).toHaveBeenCalledWith('/admin', { vergleich: '0' }, expect.anything())
    })

    it('steers a page beneath the Übersicht with the same Zeitraum, keeping that page’s own filter', async () => {
        const wrapper = mount(PeriodSwitcher, { props: { period: PERIOD, exportUrl: null, base: '/admin/nachfrage', comparable: false, keep: { stand: 'beobachtet' } } })

        // Nothing to compare on a list: no switch that would do nothing.
        expect(wrapper.find('.switch').exists()).toBe(false)

        wrapper.findComponent({ name: 'ToggleGroupRoot' }).vm.$emit('update:modelValue', '90')
        await wrapper.vm.$nextTick()

        expect(get).toHaveBeenCalledWith('/admin/nachfrage', { stand: 'beobachtet', zeitraum: '90' }, expect.anything())
    })

    it('names the own range in full, and as the fourth segment „Eigen“ where the four share a phone’s width', () => {
        const trigger = mount(PeriodSwitcher, { props: { period: PERIOD, exportUrl: null } }).find('.period__custom')

        expect(trigger.find('.period__custom-label').text()).toBe('Eigener Zeitraum')
        expect(trigger.find('.period__custom-short').attributes('aria-hidden')).toBe('true')
    })

    it('offers the CSV only with an address to download it from', () => {
        expect(mount(PeriodSwitcher, { props: { period: PERIOD, exportUrl: null } }).find('a[download]').exists()).toBe(false)
        expect(mount(PeriodSwitcher, { props: { period: PERIOD, exportUrl: '/admin/uebersicht/export?zeitraum=30' } }).find('a[download]').attributes('href')).toBe('/admin/uebersicht/export?zeitraum=30')
    })
})
