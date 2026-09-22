import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { withUnit } from '../../format'
import { DISCLAIMER } from '../../lib/rechner'
import FitmentTeaser from './FitmentTeaser.vue'
import type { VehicleProp } from '../../types/rimify'

const mm = (value: string) => withUnit(value, 'mm')
const pct = (value: string) => withUnit(value, '%')
const kmh = (value: string) => withUnit(value, 'km/h')

const EXAMPLE_PARAM = '7.5x17-45-225-45_8.5x19-35-225-35'

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

/* The Inertia `Link` renders an anchor; the teaser needs nothing else from the router. */
vi.mock('@inertiajs/vue3', () => ({
    Link: {
        props: ['href'],
        template: '<a :href="href"><slot /></a>',
    },
}))

function control<T extends HTMLElement>(wrapper: VueWrapper, side: 'current' | 'next', field: string): T {
    const found = wrapper.find<T>(`[id$="-${side}-${field}"]`)

    if (!found.exists()) {
        throw new Error(`No control ${side}/${field}`)
    }

    return found.element
}

function change(el: HTMLElement, value: string): void {
    ;(el as HTMLInputElement).value = value
    el.dispatchEvent(new Event('change'))
}

function values(wrapper: VueWrapper): string[] {
    return wrapper.findAll('.calc-result .h3').map((v) => v.text())
}

function reducedMotion(matches: boolean): void {
    Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: query.includes('prefers-reduced-motion') ? matches : false,
            media: query,
            onchange: null,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    })
}

let mounted: VueWrapper[] = []

function mountTeaser(props: Record<string, unknown> = {}): VueWrapper {
    const wrapper = mount(FitmentTeaser, { props, attachTo: document.body })
    mounted.push(wrapper)

    return wrapper
}

beforeEach(() => {
    reducedMotion(true)
    window.history.replaceState(null, '', '/')
})

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    document.body.innerHTML = ''
    vi.useRealTimers()
})

describe('FitmentTeaser (H8 v2)', () => {
    it('shows the worked example from the first paint: +0,9 %, 100,9 km/h, außen +22,7 mm, innen +2,7 mm and the ok light', () => {
        const wrapper = mountTeaser()

        expect(values(wrapper)).toEqual([pct('+0,9'), kmh('100,9'), `außen ${mm('+22,7')}`])
        expect(wrapper.find('.calc-result__second').text()).toBe(`innen ${mm('+2,7')}`)
        expect(wrapper.find('.light').classes()).toContain('light--ok')
        expect(wrapper.find('.light').text()).toBe(`Innerhalb der üblichen Toleranz von ${pct('−2,5')} bis ${pct('+1,5')}.`)
        expect(wrapper.findAll('.light')).toHaveLength(1)
    })

    it('puts the input row, the drawing, the three results, the link and the disclaimer in that order', () => {
        const wrapper = mountTeaser()
        const html = wrapper.html()
        const at = (needle: string) => html.indexOf(needle)

        expect(wrapper.find('.calc-row').exists()).toBe(true)
        expect(wrapper.findAll('fieldset')).toHaveLength(2)
        expect(wrapper.find('figure.calc-drawing[role="img"]').exists()).toBe(true)
        expect(wrapper.findAll('.calc-result')).toHaveLength(3)
        expect(at('class="calc-row')).toBeLessThan(at('role="img"'))
        expect(at('role="img"')).toBeLessThan(at('class="calc-results'))
        expect(at('class="calc-results')).toBeLessThan(at('Zum vollständigen Felgenrechner'))
        expect(at('Zum vollständigen Felgenrechner')).toBeLessThan(at('Rechenwerte ersetzen kein Gutachten'))
    })

    it('carries the disclaimer verbatim, once', () => {
        const wrapper = mountTeaser()

        expect(wrapper.find('.teaser__disclaimer').text()).toBe(DISCLAIMER)
        expect(wrapper.text().split('Rechenwerte ersetzen kein Gutachten')).toHaveLength(2)
    })

    it('links to the full Felgenrechner with the current comparison, as a text link on the desktop and a full-width button on the phone', async () => {
        const wrapper = mountTeaser()
        const link = wrapper.find('a')

        expect(link.text()).toBe('Zum vollständigen Felgenrechner')
        expect(link.classes()).toContain('link')
        expect(link.attributes('href')).toBe(`/felgenrechner?rechner=${EXAMPLE_PARAM}`)

        change(control(wrapper, 'next', 'diameterIn'), '18')
        await nextTick()
        expect(wrapper.find('a').attributes('href')).toBe('/felgenrechner?rechner=7.5x17-45-225-45_8.5x18-35-225-35')

        const phone = mountTeaser({ layout: 'phone' })
        expect(phone.find('a').classes()).toEqual(expect.arrayContaining(['btn', 'btn--secondary', 'btn--block']))
        expect(phone.findAll('[role="tab"]').map((t) => t.text())).toEqual(['Aktuell', 'Neu'])
        expect(phone.findAll('fieldset')).toHaveLength(0)
    })

    it('recalculates instantly when a figure changes and switches the light without a verdict word', async () => {
        const wrapper = mountTeaser()

        // 7 J × 15 · ET 45 · 195/70: 3,1 % larger than the tolerance allows.
        change(control(wrapper, 'next', 'widthIn'), '7')
        change(control(wrapper, 'next', 'diameterIn'), '15')
        change(control(wrapper, 'next', 'etMm'), '45')
        change(control(wrapper, 'next', 'tyreWidthMm'), '195')
        change(control(wrapper, 'next', 'aspect'), '70')
        await nextTick()

        expect(wrapper.find('.light').classes()).toContain('light--warn')
        expect(wrapper.find('[data-result="abrollumfang"]').attributes('data-status')).toBe('warn')
        expect(values(wrapper)[0]).toBe(pct('+3,1'))

        // 6 J × 13 · 155/55: the speedometer would exceed 10 % + 4 km/h.
        change(control(wrapper, 'next', 'widthIn'), '6')
        change(control(wrapper, 'next', 'diameterIn'), '13')
        change(control(wrapper, 'next', 'tyreWidthMm'), '155')
        change(control(wrapper, 'next', 'aspect'), '55')
        await nextTick()

        expect(wrapper.find('.light').classes()).toContain('light--bad')
        expect(wrapper.find('.verdict').exists()).toBe(false)

        const outside = wrapper.text().replace(DISCLAIMER, '').toLowerCase()
        expect(outside).not.toContain('zulässig')
        expect(outside).not.toContain('freigegeben')
    })

    it('keeps the last valid drawing and reads a dash for the three values while the ET is impossible', async () => {
        const wrapper = mountTeaser()
        const et = control<HTMLInputElement>(wrapper, 'next', 'etMm')

        change(et, '80')
        et.dispatchEvent(new Event('blur'))
        await nextTick()

        expect(values(wrapper)).toEqual(['–', '–', '–'])
        expect(wrapper.find('.light').exists()).toBe(false)
        expect(et.getAttribute('aria-invalid')).toBe('true')
        expect(wrapper.text()).toContain('Die Einpresstiefe liegt zwischen −30 und 70 mm.')
        // The drawing still shows ET 35.
        expect(wrapper.find('.cd__label--et').text()).toBe('ET 35')
        expect(wrapper.find('a').attributes('href')).toBe(`/felgenrechner?rechner=${EXAMPLE_PARAM}`)

        change(et, '25')
        et.dispatchEvent(new Event('blur'))
        await nextTick()

        expect(values(wrapper)[2]).toBe(`außen ${mm('+32,7')}`)
        expect(wrapper.find('.cd__label--et').text()).toBe('ET 25')
    })

    it('starts on the vehicle’s size against the next plausible step, says so, marks the Aktuell fields, and withdraws the note on the first edit', async () => {
        const wrapper = mountTeaser({
            prefill: { widthIn: 8, diameterIn: 18, etMm: 40, tyreWidth: 235, aspect: 40 },
            vehicle,
        })

        // Aktuell is the car's own size; Neu is one inch up, ten points less profile, half an inch
        // wider — so the first paint answers the heading with a real change, never "±0,0".
        expect(control<HTMLSelectElement>(wrapper, 'current', 'diameterIn').value).toBe('18')
        expect(control<HTMLSelectElement>(wrapper, 'next', 'diameterIn').value).toBe('19')
        const results = wrapper.findAll('.calc-result').map((r) => r.text()).join(' ')
        expect(results).not.toContain('±0,0')
        expect(wrapper.find('.teaser__prefill').text()).toBe('Vorbelegt mit der Serienbereifung deines BMW 3er.')
        expect(wrapper.findAll('[data-prefilled="true"]')).toHaveLength(5)
        // The note stands under the row, before the drawing.
        expect(wrapper.html().indexOf('teaser__prefill')).toBeLessThan(wrapper.html().indexOf('role="img"'))

        change(control(wrapper, 'next', 'diameterIn'), '19')
        await nextTick()

        expect(wrapper.find('.teaser__prefill').exists()).toBe(false)
        expect(wrapper.findAll('[data-prefilled]')).toHaveLength(0)
    })

    it('prints no prefill note without a vehicle, without a prefill, or with a size the form does not offer', () => {
        expect(mountTeaser({ prefill: { widthIn: 8, diameterIn: 18, etMm: 40, tyreWidth: 235, aspect: 40 } }).find('.teaser__prefill').exists()).toBe(false)
        expect(mountTeaser({ vehicle }).find('.teaser__prefill').exists()).toBe(false)
        expect(mountTeaser({ vehicle, prefill: { widthIn: 7.25, diameterIn: 17, etMm: 45, tyreWidth: 225, aspect: 45 } }).find('.teaser__prefill').exists()).toBe(false)
    })

    it('reads a shared comparison from the address on mount — it outranks the vehicle prefill and its note', async () => {
        window.history.replaceState(null, '', '/?rechner=8x17--10-225-45_8x17--20-225-45')
        const wrapper = mountTeaser({
            prefill: { widthIn: 6, diameterIn: 15, etMm: 38, tyreWidth: 185, aspect: 65 },
            vehicle,
        })
        await nextTick()

        expect(control<HTMLInputElement>(wrapper, 'current', 'etMm').value).toBe('-10')
        expect(control<HTMLInputElement>(wrapper, 'next', 'etMm').value).toBe('-20')
        expect(values(wrapper)[2]).toBe(`außen ${mm('+10,0')}`)
        expect(wrapper.find('.teaser__prefill').exists()).toBe(false)
    })

    it('fails closed on a link with figures the form does not offer', async () => {
        window.history.replaceState(null, '', '/?rechner=99x1-999-1-1_7.5x17-45-225-45')
        const wrapper = mountTeaser()
        await nextTick()

        expect(wrapper.find('a').attributes('href')).toBe(`/felgenrechner?rechner=${EXAMPLE_PARAM}`)
    })

    it('writes the address on mount and every valid change after, debounced, so the address bar is always a share link', async () => {
        vi.useFakeTimers()
        const wrapper = mountTeaser()

        // The canonical link from the first paint, not from the first change.
        const atMount = window.location.search
        expect(atMount).toMatch(/^\?rechner=7\.5x17-45-225-45_/)

        change(control(wrapper, 'next', 'diameterIn'), '18')
        await nextTick()
        expect(window.location.search).toBe(atMount)

        vi.advanceTimersByTime(250)
        expect(window.location.search).toBe('?rechner=7.5x17-45-225-45_8.5x18-35-225-35')
    })

    it('draws the change instantly under reduced motion', async () => {
        reducedMotion(true)
        const wrapper = mountTeaser()

        change(control(wrapper, 'next', 'etMm'), '10')
        await nextTick()

        expect(wrapper.find('g.new rect').attributes('x')).toBe('137.5')
    })
})
