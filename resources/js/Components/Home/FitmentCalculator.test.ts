import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { cloneState, DEFAULT_STATE, type RechnerState } from '../../lib/rechner'
import FitmentCalculator from './FitmentCalculator.vue'

type Side = 'current' | 'next'

interface Column {
    width: HTMLSelectElement
    diameter: HTMLSelectElement
    et: HTMLInputElement
    tyreWidth: HTMLSelectElement
    aspect: HTMLSelectElement
}

/** One control, found by the id the component gives it — the same in every layout. */
function control<T extends HTMLElement>(wrapper: VueWrapper, side: Side, field: string): T {
    const found = wrapper.find<T>(`[id$="-${side}-${field}"]`)

    if (!found.exists()) {
        throw new Error(`No control ${side}/${field}`)
    }

    return found.element
}

function column(wrapper: VueWrapper, side: Side): Column {
    return {
        width: control<HTMLSelectElement>(wrapper, side, 'widthIn'),
        diameter: control<HTMLSelectElement>(wrapper, side, 'diameterIn'),
        et: control<HTMLInputElement>(wrapper, side, 'etMm'),
        tyreWidth: control<HTMLSelectElement>(wrapper, side, 'tyreWidthMm'),
        aspect: control<HTMLSelectElement>(wrapper, side, 'aspect'),
    }
}

function setupOf(col: Column): number[] {
    return [col.width, col.diameter, col.et, col.tyreWidth, col.aspect].map((el) => Number(el.value))
}

/** The accessible name of a control: its `<label for>`, or the elements its `aria-labelledby` points at. */
function nameOf(wrapper: VueWrapper, el: HTMLElement): string {
    const ids = el.getAttribute('aria-labelledby')

    if (ids !== null) {
        return ids
            .split(/\s+/)
            .map((id) => wrapper.find(`#${CSS.escape(id)}`).text())
            .join(' ')
    }

    return wrapper.find(`label[for="${CSS.escape(el.id)}"]`).text()
}

function change(el: HTMLElement, value: string): void {
    ;(el as HTMLInputElement).value = value
    el.dispatchEvent(new Event('change'))
}

let mounted: VueWrapper[] = []

function mountForm(props: Record<string, unknown> = {}): VueWrapper {
    const wrapper = mount(FitmentCalculator, {
        props: { modelValue: cloneState(DEFAULT_STATE), ...props },
        attachTo: document.body,
    })
    mounted.push(wrapper)

    return wrapper
}

function lastEmitted<T>(wrapper: VueWrapper, event: string): T | undefined {
    const calls = wrapper.emitted(event)

    return calls?.[calls.length - 1]?.[0] as T | undefined
}

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    document.body.innerHTML = ''
})

describe('FitmentCalculator (the form)', () => {
    it('shows the comparison it was given in every control', () => {
        const wrapper = mountForm()

        expect(setupOf(column(wrapper, 'current'))).toEqual([7.5, 17, 45, 225, 45])
        expect(setupOf(column(wrapper, 'next'))).toEqual([8.5, 19, 35, 225, 35])
    })

    it('lays the teaser out as two fieldsets with short labels, five fields each, and the unit as a suffix on the ET only', () => {
        const wrapper = mountForm({ layout: 'row' })

        const sets = wrapper.findAll('fieldset')
        expect(sets).toHaveLength(2)
        expect(sets.map((s) => s.find('legend').text())).toEqual(['Aktuell', 'Neu'])
        expect(wrapper.find('.calc-row').exists()).toBe(true)

        const controls = wrapper.findAll('select, input[type="number"]')
        expect(controls).toHaveLength(10)
        expect(controls.slice(0, 5).map((c) => nameOf(wrapper, c.element as HTMLElement))).toEqual([
            'Breite',
            'Durchmesser',
            'ET',
            'Reifenbreite',
            'Querschnitt',
        ])
        expect(wrapper.findAll('.input-group__suffix').map((s) => s.text())).toEqual(['mm', 'mm'])

        for (const c of controls) {
            expect(c.classes()).toContain('input')
        }
    })

    it('lays the full page out as a compact table: five rows, one label, Aktuell and Neu beside it', () => {
        const wrapper = mountForm({ layout: 'table' })
        const table = wrapper.find('.calc-form__table')

        expect(table.attributes('role')).toBe('group')
        expect(table.findAll('.calc-form__head').map((h) => h.text())).toEqual(['Aktuell', 'Neu'])
        expect(table.findAll('.calc-form__row-label').map((l) => l.text())).toEqual([
            'Felgenbreite',
            'Durchmesser',
            'Einpresstiefe (ET)',
            'Reifenbreite',
            'Querschnitt',
        ])
        expect(wrapper.findAll('fieldset')).toHaveLength(0)
        expect(wrapper.findAll('[role="tab"]')).toHaveLength(0)

        const names = wrapper.findAll('select, input[type="number"]').map((c) => nameOf(wrapper, c.element as HTMLElement))
        expect(names).toEqual([
            'Felgenbreite Aktuell',
            'Felgenbreite Neu',
            'Durchmesser Aktuell',
            'Durchmesser Neu',
            'Einpresstiefe (ET) Aktuell',
            'Einpresstiefe (ET) Neu',
            'Reifenbreite Aktuell',
            'Reifenbreite Neu',
            'Querschnitt Aktuell',
            'Querschnitt Neu',
        ])
    })

    it('renders Aktuell · Neu as tabs on the phone, one side at a time, each field with a visible label', async () => {
        const wrapper = mountForm({ layout: 'tabs' })

        expect(wrapper.find('.calc-form__table').exists()).toBe(false)
        const tabs = wrapper.findAll('[role="tab"]')
        expect(tabs.map((t) => t.text())).toEqual(['Aktuell', 'Neu'])

        let controls = wrapper.findAll('select, input[type="number"]')
        expect(controls).toHaveLength(5)
        expect(controls.map((c) => nameOf(wrapper, c.element as HTMLElement))).toEqual([
            'Felgenbreite',
            'Durchmesser',
            'Einpresstiefe (ET)',
            'Reifenbreite',
            'Querschnitt',
        ])
        expect(setupOf(column(wrapper, 'current'))).toEqual([7.5, 17, 45, 225, 45])

        await tabs[1]?.trigger('mousedown', { button: 0 })
        await tabs[1]?.trigger('click')
        await nextTick()
        controls = wrapper.findAll('select, input[type="number"]')
        expect(controls).toHaveLength(5)
        expect(setupOf(column(wrapper, 'next'))).toEqual([8.5, 19, 35, 225, 35])
    })

    it('offers the specification’s ranges: 5,5 … 12 J, 13 … 24 Zoll, 135 … 355 mm, 25 … 85 %', () => {
        const wrapper = mountForm()
        const options = (el: HTMLSelectElement) => Array.from(el.options).map((o) => o.value)
        const neu = column(wrapper, 'next')

        expect(options(neu.width)[0]).toBe('5.5')
        expect(options(neu.width).at(-1)).toBe('12')
        expect(options(neu.diameter)).toHaveLength(12)
        expect(options(neu.tyreWidth)[0]).toBe('135')
        expect(options(neu.tyreWidth).at(-1)).toBe('355')
        expect(options(neu.aspect).at(-1)).toBe('85')
        expect(neu.et.getAttribute('min')).toBe('-30')
        expect(neu.et.getAttribute('max')).toBe('70')
        // The option text carries the unit, German-formatted as R-10 writes a rim width.
        expect(neu.width.options[neu.width.selectedIndex]?.text.trim()).toBe('8,5J')
    })

    it('keeps the page translator off every control in every layout: the options are figures ("5,5J" is no "5.5 years")', () => {
        for (const layout of ['row', 'table', 'tabs'] as const) {
            const wrapper = mountForm({ layout })
            const controls = wrapper.findAll('select, input[type="number"]')

            expect(controls.length).toBeGreaterThanOrEqual(5)

            for (const c of controls) {
                expect(c.attributes('translate'), `${layout}: ${c.attributes('id')}`).toBe('no')
            }

            for (const suffix of wrapper.findAll('.input-group__suffix')) {
                expect(suffix.attributes('translate')).toBe('no')
            }
        }
    })

    it('keeps the figures of an error message away from the translator', async () => {
        const wrapper = mountForm()
        const neu = column(wrapper, 'next')

        change(neu.et, '80')
        await nextTick()

        const error = wrapper.find(`#${CSS.escape(neu.et.getAttribute('aria-describedby') ?? '')}`)
        expect(error.findAll('[translate="no"]').map((v) => v.text())).toEqual(['−30', '70 mm'])
    })

    it('hands a changed comparison up — and only when every figure is one it offers', async () => {
        const wrapper = mountForm()
        const neu = column(wrapper, 'next')

        change(neu.diameter, '18')
        await nextTick()

        const state = lastEmitted<RechnerState>(wrapper, 'update:modelValue')
        expect(state?.next.diameterIn).toBe(18)
        expect(state?.current).toEqual(DEFAULT_STATE.current)
        expect(lastEmitted<boolean>(wrapper, 'update:valid')).toBe(true)
    })

    it('explains an impossible ET under the field, marks it invalid and hands nothing up', async () => {
        const wrapper = mountForm()
        const neu = column(wrapper, 'next')

        change(neu.et, '80')
        neu.et.dispatchEvent(new Event('blur'))
        await nextTick()

        expect(neu.et.getAttribute('aria-invalid')).toBe('true')
        const errorId = neu.et.getAttribute('aria-describedby') ?? ''
        const error = wrapper.find(`#${CSS.escape(errorId)}`)
        expect(error.text()).toBe('Die Einpresstiefe liegt zwischen −30 und 70 mm.')
        expect(error.classes()).toContain('form-field__error')
        expect(wrapper.emitted('update:modelValue')).toBeUndefined()
        expect(lastEmitted<boolean>(wrapper, 'update:valid')).toBe(false)

        change(neu.et, '-30')
        neu.et.dispatchEvent(new Event('blur'))
        await nextTick()

        expect(neu.et.getAttribute('aria-invalid')).toBeNull()
        expect(error.text()).toBe('')
        expect(lastEmitted<RechnerState>(wrapper, 'update:modelValue')?.next.etMm).toBe(-30)
        expect(lastEmitted<boolean>(wrapper, 'update:valid')).toBe(true)
    })

    it('follows a comparison applied from outside and clears its errors', async () => {
        const wrapper = mountForm()
        const neu = column(wrapper, 'next')

        change(neu.et, '99')
        neu.et.dispatchEvent(new Event('blur'))
        await nextTick()
        expect(neu.et.getAttribute('aria-invalid')).toBe('true')

        const next: RechnerState = {
            current: { widthIn: 8, diameterIn: 18, etMm: 40, tyreWidthMm: 235, aspect: 40 },
            next: { widthIn: 9, diameterIn: 20, etMm: 30, tyreWidthMm: 245, aspect: 30 },
        }
        await wrapper.setProps({ modelValue: next })

        expect(setupOf(column(wrapper, 'current'))).toEqual([8, 18, 40, 235, 40])
        expect(setupOf(column(wrapper, 'next'))).toEqual([9, 20, 30, 245, 30])
        expect(neu.et.getAttribute('aria-invalid')).toBeNull()
        expect(lastEmitted<boolean>(wrapper, 'update:valid')).toBe(true)
    })

    it('marks the Aktuell controls as prefilled when told so, and nothing else', () => {
        const wrapper = mountForm({ prefilled: true })

        expect(wrapper.findAll('[data-prefilled="true"]')).toHaveLength(5)
        expect(column(wrapper, 'current').width.getAttribute('data-prefilled')).toBe('true')
        expect(column(wrapper, 'next').width.getAttribute('data-prefilled')).toBeNull()
        expect(mountForm().findAll('[data-prefilled]')).toHaveLength(0)
    })

    it('is a form that never submits, with every button typed', () => {
        const wrapper = mountForm()

        expect(wrapper.find('form').attributes('novalidate')).toBeDefined()
        expect(wrapper.findAll('button').every((b) => b.attributes('type') !== undefined)).toBe(true)
    })
})
