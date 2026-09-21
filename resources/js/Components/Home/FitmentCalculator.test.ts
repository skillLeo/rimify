import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { NNBSP, withUnit } from '../../format'
import FitmentCalculator from './FitmentCalculator.vue'
import type { VehicleProp } from '../../types/rimify'

const mm = (value: string) => withUnit(value, 'mm')

/* The worked example from the specification is what the calculator shows without a vehicle. */
const EXAMPLE_PARAM = '7.5-17-45-225-45_8.5-19-35-225-35'

const vehicle: VehicleProp = {
    id: 3,
    make: 'BMW',
    model: '3er',
    variant: 'Coupé',
    label: 'BMW 3er Coupé',
    short: 'BMW 3er',
    hsn: '0005',
    tsn: '582',
    keyNumbers: 'HSN 0005 · TSN 582',
    buildWindow: '01/1995–12/1999',
}

type Side = 'current' | 'next'

interface Column {
    width: HTMLSelectElement
    diameter: HTMLSelectElement
    et: HTMLInputElement
    tyreWidth: HTMLSelectElement
    aspect: HTMLSelectElement
}

/** One control, found by the id the component gives it — the same in both layouts. */
function control<T extends HTMLElement>(wrapper: VueWrapper, side: Side, field: string): T {
    const found = wrapper.find<T>(`[id$="-${side}-${field}"]`)

    if (!found.exists()) {
        throw new Error(`No control ${side}/${field}`)
    }

    return found.element
}

/** The five controls of one side. */
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

let mounted: VueWrapper[] = []

function mountCalculator(props: Record<string, unknown> = {}): VueWrapper {
    const wrapper = mount(FitmentCalculator, { props, attachTo: document.body })
    mounted.push(wrapper)

    return wrapper
}

beforeEach(() => {
    window.history.replaceState(null, '', '/')
})

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    document.body.innerHTML = ''
})

describe('FitmentCalculator', () => {
    it('shows the required values for 225/45 R17 on 7,5 J ET 45 → 225/35 R19 on 8,5 J ET 35', () => {
        const wrapper = mountCalculator()
        const text = wrapper.text()

        expect(text).toContain(mm('634,3'))
        expect(text).toContain(mm('640,1'))
        expect(text).toContain(mm('+22,7'))
        expect(text).toContain(mm('+2,7'))
        expect(text).toContain(mm('2.010,9'))
        expect(text).toContain(withUnit('+0,9', '%'))
        expect(text).toContain(withUnit('100,9', 'km/h'))

        expect(text).toContain('Außenkante')
        expect(text).toContain('Innenkante')
        expect(text).toContain('Abrollumfang')
        expect(text).toContain(`Tacho bei ${withUnit(100, 'km/h')}`)
    })

    it('carries the honest line, verbatim', () => {
        const wrapper = mountCalculator()

        expect(wrapper.text()).toContain(
            'Rechenwerte ersetzen kein Gutachten – ob eine Kombination zulässig ist, steht im Gutachten.'
        )
    })

    it('states the four results in German on the drawing, a landscape half-section without arrowheads', () => {
        const wrapper = mountCalculator()
        const label = wrapper.find('[role="img"]').attributes('aria-label') ?? ''

        expect(label).toContain(`Außenkante ${mm('+22,7')}`)
        expect(label).toContain(`Innenkante ${mm('+2,7')}`)
        expect(label).toContain(`Abrollumfang ${mm('2.010,9')} (${withUnit('+0,9', '%')})`)
        expect(label).toContain(`tatsächlich ${withUnit('100,9', 'km/h')}`)
        expect(wrapper.find('[role="img"] svg').attributes('viewBox')).toBe('0 0 480 300')
        expect(wrapper.find('.offset__arrow').exists()).toBe(false)
        expect(wrapper.find('.offset__label--outer').text()).toBe(`außen ${mm('+22,7')}`)
        expect(wrapper.find('.offset__label--inner').text()).toBe(`innen ${mm('+2,7')}`)
        expect(wrapper.find('.offset__label--diameter').text()).toBe(`Ø${NNBSP}${mm('640,1')}`)
        expect(wrapper.find('.offset__label--face').text()).toBe('Anlagefläche')
    })

    it('lays the desktop form out as a compact table: five rows, one label, Aktuell and Neu beside it', () => {
        const wrapper = mountCalculator()
        const table = wrapper.find('.calc__table')

        expect(table.attributes('role')).toBe('group')
        expect(table.findAll('.calc__head').map((h) => h.text())).toEqual(['Aktuell', 'Neu'])
        expect(table.findAll('.calc__row-label').map((l) => l.text())).toEqual([
            'Felgenbreite',
            'Durchmesser',
            'Einpresstiefe (ET)',
            'Reifenbreite',
            'Querschnitt',
        ])
        expect(wrapper.findAll('fieldset')).toHaveLength(0)
        expect(wrapper.findAll('[role="tab"]')).toHaveLength(0)
        expect(wrapper.findAll('.calc__summary').map((s) => s.text())).toEqual([
            `Aktuell: 7,5${NNBSP}J × 17 · ET${NNBSP}45 · 225/45 R17 · Ø${NNBSP}${mm('634,3')}`,
            `Neu: 8,5${NNBSP}J × 19 · ET${NNBSP}35 · 225/35 R19 · Ø${NNBSP}${mm('640,1')}`,
        ])
        expect(table.findAll('.input-group__suffix').map((s) => s.text())).toEqual(['mm', 'mm'])
        expect(wrapper.find('.calc__share .btn').classes()).toContain('btn--sm')
        expect(wrapper.find('.calc__share .btn').classes()).not.toContain('btn--block')
    })

    it('renders Aktuell · Neu as tabs with the five fields, then the drawing, the values, the line and a full-width button', async () => {
        const wrapper = mountCalculator({ layout: 'tabs' })

        expect(wrapper.find('.calc__table').exists()).toBe(false)
        const tabs = wrapper.findAll('[role="tab"]')
        expect(tabs.map((t) => t.text())).toEqual(['Aktuell', 'Neu'])

        // One tab at a time, each field with its own visible label.
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

        // The order of the block: form, drawing, values, honest line, then the button.
        const html = wrapper.html()
        const at = (needle: string) => html.indexOf(needle)
        expect(at('role="tablist"')).toBeLessThan(at('role="img"'))
        expect(at('role="img"')).toBeLessThan(at('class="specs'))
        expect(at('class="specs')).toBeLessThan(at('Rechenwerte ersetzen kein Gutachten'))
        expect(at('Rechenwerte ersetzen kein Gutachten')).toBeLessThan(at('Link kopieren'))

        const button = wrapper.find('.calc__share .btn')
        expect(button.classes()).toContain('btn--block')
        expect(button.classes()).toContain('btn--secondary')
    })

    it('recalculates when a figure changes', async () => {
        const wrapper = mountCalculator()
        const neu = column(wrapper, 'next')

        neu.diameter.value = '18'
        neu.diameter.dispatchEvent(new Event('change'))
        await nextTick()

        // 225/35 R18: 457,2 + 157,5 = 614,7 mm, and the speedometer now reads high.
        expect(wrapper.text()).toContain(mm('614,7'))
        expect(wrapper.text()).toContain(withUnit('96,9', 'km/h'))
    })

    it('fills Aktuell from the vehicle, starts Neu at the same size and says whose Serienbereifung it is', async () => {
        const wrapper = mountCalculator({
            prefill: { widthIn: 8, diameterIn: 18, etMm: 40, tyreWidth: 235, aspect: 40 },
            vehicle,
        })

        expect(setupOf(column(wrapper, 'current'))).toEqual([8, 18, 40, 235, 40])
        expect(setupOf(column(wrapper, 'next'))).toEqual([8, 18, 40, 235, 40])

        const text = wrapper.text()
        expect(text).toContain(mm('±0,0'))
        expect(text).toContain(withUnit('100,0', 'km/h'))
        expect(text).toContain('235/40 R18')

        const note = wrapper.find('.calc__prefill')
        expect(note.text()).toBe('Vorbelegt mit der Serienbereifung deines BMW 3er.')
        expect(note.classes()).toContain('small')
        expect(note.classes()).toContain('quiet')
        // The note stands above the form's controls.
        expect(wrapper.html().indexOf('calc__prefill')).toBeLessThan(wrapper.html().indexOf('calc__table'))

        // Once a figure is the customer's own, the note would be untrue.
        const neu = column(wrapper, 'next')
        neu.diameter.value = '19'
        neu.diameter.dispatchEvent(new Event('change'))
        await nextTick()
        expect(wrapper.find('.calc__prefill').exists()).toBe(false)
    })

    it('prints no prefill note without a vehicle, and none without a prefill', () => {
        expect(mountCalculator({ prefill: { widthIn: 8, diameterIn: 18, etMm: 40, tyreWidth: 235, aspect: 40 } }).find('.calc__prefill').exists()).toBe(false)
        expect(mountCalculator({ vehicle }).find('.calc__prefill').exists()).toBe(false)
        expect(mountCalculator({ vehicle, prefill: { widthIn: 7.25, diameterIn: 17, etMm: 45, tyreWidth: 225, aspect: 45 } }).find('.calc__prefill').exists()).toBe(false)
    })

    it('ignores a prefill the form could not have produced itself', () => {
        const wrapper = mountCalculator({
            prefill: { widthIn: 7.25, diameterIn: 17, etMm: 45, tyreWidth: 225, aspect: 45 },
        })

        expect(setupOf(column(wrapper, 'current'))).toEqual([7.5, 17, 45, 225, 45])
    })

    it('copies a shareable link and reads the same comparison back on mount', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined)
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

        const wrapper = mountCalculator()
        const button = wrapper.findAll('button').find((b) => b.text() === 'Link kopieren')

        expect(button).toBeDefined()
        await button?.trigger('click')
        await flushPromises()

        expect(writeText).toHaveBeenCalledTimes(1)
        const url = new URL(writeText.mock.calls[0]?.[0] as string)
        expect(url.searchParams.get('rechner')).toBe(EXAMPLE_PARAM)
        expect(wrapper.find('[role="status"]').text()).toBe('Link kopiert.')

        // The other end of the link: the same figures, and the link outranks the vehicle prefill — and its note.
        window.history.replaceState(null, '', `/?rechner=${url.searchParams.get('rechner')}`)
        const again = mountCalculator({
            prefill: { widthIn: 6, diameterIn: 15, etMm: 38, tyreWidth: 185, aspect: 65 },
            vehicle,
        })
        await nextTick()

        expect(setupOf(column(again, 'current'))).toEqual([7.5, 17, 45, 225, 45])
        expect(setupOf(column(again, 'next'))).toEqual([8.5, 19, 35, 225, 35])
        expect(again.text()).toContain(mm('+22,7'))
        expect(again.find('.calc__prefill').exists()).toBe(false)
    })

    it('round-trips a negative ET through the link', async () => {
        window.history.replaceState(null, '', '/?rechner=8-17--10-225-45_8-17--20-225-45')
        const wrapper = mountCalculator()
        await nextTick()

        expect(column(wrapper, 'current').et.value).toBe('-10')
        expect(column(wrapper, 'next').et.value).toBe('-20')
        expect(wrapper.text()).toContain(mm('+10,0'))
        expect(wrapper.text()).toContain(mm('−10,0'))

        const writeText = vi.fn().mockResolvedValue(undefined)
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
        await wrapper.findAll('button').find((b) => b.text() === 'Link kopieren')?.trigger('click')
        await flushPromises()

        const url = new URL(writeText.mock.calls[0]?.[0] as string)
        expect(url.searchParams.get('rechner')).toBe('8-17--10-225-45_8-17--20-225-45')
    })

    it('fails closed on a link with figures the form does not offer', async () => {
        window.history.replaceState(null, '', '/?rechner=99-1-999-1-1_7.5-17-45-225-45')
        const wrapper = mountCalculator()
        await nextTick()

        expect(setupOf(column(wrapper, 'current'))).toEqual([7.5, 17, 45, 225, 45])
        expect(setupOf(column(wrapper, 'next'))).toEqual([8.5, 19, 35, 225, 35])
    })

    it('offers the link to copy by hand when the clipboard is not available', async () => {
        Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
        const wrapper = mountCalculator()

        await wrapper.findAll('button').find((b) => b.text() === 'Link kopieren')?.trigger('click')
        await flushPromises()

        const manual = wrapper.find('input[type="url"]')
        expect(manual.exists()).toBe(true)
        expect((manual.element as HTMLInputElement).value).toContain(`rechner=${EXAMPLE_PARAM}`)
        expect(wrapper.find('[role="status"]').text()).toBe('')
    })

    it('explains an impossible ET under the field on blur and keeps the last good value', async () => {
        const wrapper = mountCalculator()
        const neu = column(wrapper, 'next')

        neu.et.value = '80'
        neu.et.dispatchEvent(new Event('change'))
        neu.et.dispatchEvent(new Event('blur'))
        await nextTick()

        expect(neu.et.getAttribute('aria-invalid')).toBe('true')
        const errorId = neu.et.getAttribute('aria-describedby') ?? ''
        const error = wrapper.find(`#${CSS.escape(errorId)}`)
        expect(error.text()).toBe('Bitte eine ganze Zahl zwischen −50 und 70 angeben.')
        expect(error.classes()).toContain('form-field__error')

        // The result still stands on ET 35: nothing was computed from a value that is not allowed.
        expect(wrapper.text()).toContain(mm('+22,7'))

        neu.et.value = '25'
        neu.et.dispatchEvent(new Event('change'))
        neu.et.dispatchEvent(new Event('blur'))
        await nextTick()

        expect(neu.et.getAttribute('aria-invalid')).toBeNull()
        expect(error.text()).toBe('')
        expect(wrapper.text()).toContain(mm('+32,7'))
    })

    it('names every control by its row and its column and keeps each input at body size', () => {
        const wrapper = mountCalculator()
        const controls = wrapper.findAll('select, input[type="number"]')

        expect(controls).toHaveLength(10)

        const names = controls.map((c) => nameOf(wrapper, c.element as HTMLElement))
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

        for (const control of controls) {
            expect(control.classes()).toContain('input')
        }
    })
})
