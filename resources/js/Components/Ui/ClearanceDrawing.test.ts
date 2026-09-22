import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { withUnit } from '../../format'
import type { WheelSetup } from '../../lib/fitmentMath'
import ClearanceDrawing from './ClearanceDrawing.vue'

const mm = (value: string) => withUnit(value, 'mm')

const current: WheelSetup = { widthIn: 7.5, diameterIn: 17, etMm: 45, tyreWidthMm: 225, aspect: 45 }
const next: WheelSetup = { widthIn: 8.5, diameterIn: 19, etMm: 35, tyreWidthMm: 225, aspect: 35 }

let mounted: VueWrapper[] = []

function mountDrawing(props: { current?: WheelSetup; next?: WheelSetup } = {}): VueWrapper {
    const wrapper = mount(ClearanceDrawing, {
        props: { current: props.current ?? current, next: props.next ?? next },
        attachTo: document.body,
    })
    mounted.push(wrapper)

    return wrapper
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

function rectX(wrapper: VueWrapper, group: 'old' | 'new'): number {
    return Number(wrapper.find(`g.${group} rect`).attributes('x'))
}

function rectWidth(wrapper: VueWrapper, group: 'old' | 'new'): number {
    return Number(wrapper.find(`g.${group} rect`).attributes('width'))
}

beforeEach(() => {
    reducedMotion(true)
})

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    document.body.innerHTML = ''
})

describe('ClearanceDrawing', () => {
    it('is a plan view on a 480 × 200 sheet that names the two figures in German', () => {
        const wrapper = mountDrawing()
        const figure = wrapper.find('.cd')

        expect(figure.element.tagName).toBe('DIV')
        expect(figure.attributes('role')).toBe('img')
        expect(figure.attributes('aria-label')).toBe(
            `Draufsicht: die neue Felge steht ${mm('+22,7')} weiter außen und ${mm('+2,7')} näher am Federbein als die aktuelle.`
        )
        expect(wrapper.find('svg').attributes('viewBox')).toBe('0 0 480 200')
        expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true')
    })

    it('places the bands by ET and tyre width: centreline at 260 − ET, width = section width', () => {
        const wrapper = mountDrawing()

        // Aktuell: x_c = 215, 225 wide → 102,5 … 327,5. Neu: x_c = 225 → 112,5 … 337,5.
        expect(rectX(wrapper, 'old')).toBe(102.5)
        expect(rectWidth(wrapper, 'old')).toBe(225)
        expect(rectX(wrapper, 'new')).toBe(112.5)
        expect(rectWidth(wrapper, 'new')).toBe(225)
        expect(wrapper.find('g.new .cd__centre').attributes('d')).toBe('M225 50 V150')
        // The mounting face never moves.
        expect(wrapper.find('.cd__face').attributes('d')).toBe('M260 20 V180')
        // The rim bracket under the band: 8,5 J = 215,9 mm around x_c 225.
        expect(wrapper.find('g.new path.cd__new').attributes('d')).toContain('M117.1 148 V152 M117.1 150 H333')
    })

    it('draws the three dimensions with square ticks and no arrowheads, and labels them', () => {
        const wrapper = mountDrawing()
        const dims = wrapper.find('.cd__dim').attributes('d') ?? ''

        // ET between the new centreline (225) and the face (260) at y 40.
        expect(dims).toContain('M225 38 V42 M225 40 H260 M260 38 V42')
        // Außen between the old and new outer edges (327,5 → 337,5) at y 170; innen between 102,5 and 112,5.
        expect(dims).toContain('M327.5 168 V172 M327.5 170 H337.5 M337.5 168 V172')
        expect(dims).toContain('M102.5 168 V172 M102.5 170 H112.5 M112.5 168 V172')
        expect(wrapper.html()).not.toMatch(/marker|arrow/)

        expect(wrapper.find('.cd__label--et').text()).toBe('ET 35')
        expect(wrapper.find('.cd__label--outer').text()).toBe(`außen ${mm('+22,7')}`)
        expect(wrapper.find('.cd__label--inner').text()).toBe(`innen ${mm('+2,7')}`)
        expect(wrapper.find('.cd__label--face').text()).toBe('Anlagefläche')
        expect(wrapper.findAll('.cd__label--side').map((l) => l.text())).toEqual(['innen (Federbein)', 'außen (Kotflügel)'])
        expect(wrapper.findAll('.cd__key').map((k) => k.text())).toEqual(['Aktuell', 'Neu'])
    })

    it('writes a negative ET with a real minus sign', () => {
        const wrapper = mountDrawing({ next: { ...next, etMm: -10 } })

        expect(wrapper.find('.cd__label--et').text()).toBe('ET −10')
        expect(rectX(wrapper, 'new')).toBe(157.5)
    })

    it('omits the edge dimensions and reads ±0,0 mm when nothing moved', () => {
        const wrapper = mountDrawing({ next: { ...current } })

        expect(wrapper.find('.cd__dim').attributes('d')).toBe('M215 38 V42 M215 40 H260 M260 38 V42')
        expect(wrapper.find('.cd__ext').attributes('d')).toBe('M215 48 V38')
        expect(wrapper.find('.cd__label--outer').text()).toBe(`außen ${mm('±0,0')}`)
        expect(wrapper.find('.cd__label--inner').text()).toBe(`innen ${mm('±0,0')}`)
        expect(wrapper.find('.cd').attributes('aria-label')).toContain(`steht ${mm('±0,0')} weiter außen`)
        // The dashed band lies exactly under the solid one.
        expect(rectX(wrapper, 'old')).toBe(rectX(wrapper, 'new'))
    })

    it('keeps the band inside the sheet over the whole input range', () => {
        for (const etMm of [-30, 0, 70]) {
            for (const tyreWidthMm of [135, 225, 355]) {
                const setup: WheelSetup = { widthIn: 12, diameterIn: 24, etMm, tyreWidthMm, aspect: 85 }
                const wrapper = mountDrawing({ current: setup, next: setup })
                const x = rectX(wrapper, 'new')
                const right = x + rectWidth(wrapper, 'new')

                expect(x, `ET ${etMm}, ${tyreWidthMm} mm`).toBeGreaterThanOrEqual(12)
                expect(right, `ET ${etMm}, ${tyreWidthMm} mm`).toBeLessThanOrEqual(468)
            }
        }
    })

    it('uses ink strokes only — nothing in the drawing is blue', () => {
        const wrapper = mountDrawing()
        const shapes = wrapper.findAll('svg path, svg rect')

        expect(shapes.length).toBeGreaterThan(5)

        for (const shape of shapes) {
            expect(shape.classes()).toContain('cd__line')
            expect(shape.attributes('stroke')).toBeUndefined()
            expect(shape.attributes('fill')).toBeUndefined()
            expect(shape.attributes('style')).toBeUndefined()
        }

        expect(wrapper.html()).not.toContain('blue')
    })

    it('rests in its end state under reduced motion: a change is drawn instantly', async () => {
        reducedMotion(true)
        const wrapper = mountDrawing()

        await wrapper.setProps({ next: { ...next, etMm: 10 } })
        await nextTick()

        expect(rectX(wrapper, 'new')).toBe(137.5)
        expect(wrapper.find('.cd__label--et').text()).toBe('ET 10')
    })

    it('tweens the band towards the new value over --d-2 when motion is allowed, while the label changes at once', async () => {
        reducedMotion(false)
        const wrapper = mountDrawing()

        await wrapper.setProps({ next: { ...next, etMm: 10 } })
        await nextTick()

        // The label reads the target straight away; the band is still on its way.
        expect(wrapper.find('.cd__label--et').text()).toBe('ET 10')
        expect(rectX(wrapper, 'new')).toBeLessThan(137.5)

        await new Promise((resolve) => setTimeout(resolve, 450))
        await nextTick()

        expect(rectX(wrapper, 'new')).toBe(137.5)
    })
})
