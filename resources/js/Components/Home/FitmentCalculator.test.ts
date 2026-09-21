import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { withUnit } from '../../format'
import FitmentCalculator from './FitmentCalculator.vue'

const mm = (value: string) => withUnit(value, 'mm')

/* The worked example from the specification is what the calculator shows without a vehicle. */
const EXAMPLE_PARAM = '7.5-17-45-225-45_8.5-19-35-225-35'

interface Column {
    width: HTMLSelectElement
    diameter: HTMLSelectElement
    et: HTMLInputElement
    tyreWidth: HTMLSelectElement
    aspect: HTMLSelectElement
}

/** The controls of one column, in the order the form lays them out. */
function column(wrapper: VueWrapper, index: number): Column {
    const fieldset = wrapper.findAll('fieldset')[index]

    if (fieldset === undefined) {
        throw new Error(`No fieldset ${index}`)
    }

    const selects = fieldset.findAll('select').map((s) => s.element)

    return {
        width: selects[0] as HTMLSelectElement,
        diameter: selects[1] as HTMLSelectElement,
        et: fieldset.find('input[type="number"]').element as HTMLInputElement,
        tyreWidth: selects[2] as HTMLSelectElement,
        aspect: selects[3] as HTMLSelectElement,
    }
}

function setupOf(col: Column): number[] {
    return [col.width, col.diameter, col.et, col.tyreWidth, col.aspect].map((el) => Number(el.value))
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

    it('states the four results in German on the drawing', () => {
        const wrapper = mountCalculator()
        const label = wrapper.find('[role="img"]').attributes('aria-label') ?? ''

        expect(label).toContain(`Außenkante ${mm('+22,7')}`)
        expect(label).toContain(`Innenkante ${mm('+2,7')}`)
        expect(label).toContain(`Abrollumfang ${mm('2.010,9')} (${withUnit('+0,9', '%')})`)
        expect(label).toContain(`tatsächlich ${withUnit('100,9', 'km/h')}`)
        expect(wrapper.find('[role="img"] svg').attributes('viewBox')).toBeTruthy()
    })

    it('recalculates when a figure changes', async () => {
        const wrapper = mountCalculator()
        const neu = column(wrapper, 1)

        neu.diameter.value = '18'
        neu.diameter.dispatchEvent(new Event('change'))
        await nextTick()

        // 225/35 R18: 457,2 + 157,5 = 614,7 mm, and the speedometer now reads high.
        expect(wrapper.text()).toContain(mm('614,7'))
        expect(wrapper.text()).toContain(withUnit('96,9', 'km/h'))
    })

    it('fills Aktuell from the vehicle and starts Neu at the same size', () => {
        const wrapper = mountCalculator({
            prefill: { widthIn: 8, diameterIn: 18, etMm: 40, tyreWidth: 235, aspect: 40 },
        })

        expect(setupOf(column(wrapper, 0))).toEqual([8, 18, 40, 235, 40])
        expect(setupOf(column(wrapper, 1))).toEqual([8, 18, 40, 235, 40])

        const text = wrapper.text()
        expect(text).toContain(mm('±0,0'))
        expect(text).toContain(withUnit('100,0', 'km/h'))
        expect(text).toContain('235/40 R18')
    })

    it('ignores a prefill the form could not have produced itself', () => {
        const wrapper = mountCalculator({
            prefill: { widthIn: 7.25, diameterIn: 17, etMm: 45, tyreWidth: 225, aspect: 45 },
        })

        expect(setupOf(column(wrapper, 0))).toEqual([7.5, 17, 45, 225, 45])
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

        // The other end of the link: the same figures, and the link outranks the vehicle prefill.
        window.history.replaceState(null, '', `/?rechner=${url.searchParams.get('rechner')}`)
        const again = mountCalculator({
            prefill: { widthIn: 6, diameterIn: 15, etMm: 38, tyreWidth: 185, aspect: 65 },
        })
        await nextTick()

        expect(setupOf(column(again, 0))).toEqual([7.5, 17, 45, 225, 45])
        expect(setupOf(column(again, 1))).toEqual([8.5, 19, 35, 225, 35])
        expect(again.text()).toContain(mm('+22,7'))
    })

    it('round-trips a negative ET through the link', async () => {
        window.history.replaceState(null, '', '/?rechner=8-17--10-225-45_8-17--20-225-45')
        const wrapper = mountCalculator()
        await nextTick()

        expect(column(wrapper, 0).et.value).toBe('-10')
        expect(column(wrapper, 1).et.value).toBe('-20')
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

        expect(setupOf(column(wrapper, 0))).toEqual([7.5, 17, 45, 225, 45])
        expect(setupOf(column(wrapper, 1))).toEqual([8.5, 19, 35, 225, 35])
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
        const neu = column(wrapper, 1)

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

    it('labels every control visibly and keeps each input at body size', () => {
        const wrapper = mountCalculator()
        const controls = wrapper.findAll('select, input[type="number"]')

        expect(controls).toHaveLength(10)

        for (const control of controls) {
            const id = control.attributes('id') ?? ''
            const label = wrapper.find(`label[for="${CSS.escape(id)}"]`)

            expect(label.exists()).toBe(true)
            expect(label.text().length).toBeGreaterThan(0)
            expect(control.classes()).toContain('input')
        }
    })
})
