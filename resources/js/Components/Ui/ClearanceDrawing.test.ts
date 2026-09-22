import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { NNBSP, withUnit } from '../../format'
import { felgenModel, REAR, rearFrame, rearScene, type WheelSetup } from '../../lib/felgenGeometry'
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

function rimRect(wrapper: VueWrapper, wheel: 'current' | 'next'): { x: number; width: number } {
    const el = wrapper.find(`g[data-wheel="${wheel}"] rect.cd__rim`)

    return { x: Number(el.attributes('x')), width: Number(el.attributes('width')) }
}

function tyreRect(wrapper: VueWrapper, wheel: 'current' | 'next'): { x: number; width: number; height: number } {
    const el = wrapper.find(`g[data-wheel="${wheel}"] rect.cd__tyre`)

    return { x: Number(el.attributes('x')), width: Number(el.attributes('width')), height: Number(el.attributes('height')) }
}

/** The x extent of an arrow's shaft, read from its path `M x1 y H x2`. */
function shaft(wrapper: VueWrapper, dim: 'inner' | 'outer'): { from: number; to: number } | null {
    const path = wrapper.find(`path.cd__dim[data-dim="${dim}"]`)

    if (!path.exists()) {
        return null
    }

    const match = /M(-?[\d.]+) (-?[\d.]+) H(-?[\d.]+)/.exec(path.attributes('d') ?? '')

    return match === null ? null : { from: Number(match[1]), to: Number(match[3]) }
}

/** The x of an arrowhead's base and tip: `M base y L tip y L base y Z`. */
function head(wrapper: VueWrapper, dim: 'inner' | 'outer'): { base: number; tip: number } | null {
    const path = wrapper.find(`path.cd__head[data-dim="${dim}"]`)

    if (!path.exists()) {
        return null
    }

    const numbers = (path.attributes('d') ?? '').match(/-?[\d.]+/g)?.map(Number) ?? []

    return { base: numbers[0] as number, tip: numbers[2] as number }
}

function label(wrapper: VueWrapper, dim: 'inner' | 'outer'): string {
    return wrapper.find(`.cd__label[data-dim="${dim}"]`).text()
}

/** Every text node that carries a digit but no `translate="no"` around it. */
function unprotectedFigures(root: Element): string[] {
    const out: string[] = []

    const walk = (node: Node): void => {
        if (node.nodeType === 3) {
            const text = node.textContent ?? ''

            if (/\d/.test(text) && node.parentElement?.closest('[translate="no"]') === null) {
                out.push(text)
            }

            return
        }

        node.childNodes.forEach(walk)
    }

    walk(root)

    return out
}

beforeEach(() => {
    reducedMotion(true)
})

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    document.body.innerHTML = ''
})

describe('ClearanceDrawing (the rear view)', () => {
    it('is one image, described in German, on a 320 × 380 sheet that carries its one scale', () => {
        const wrapper = mountDrawing()
        const figure = wrapper.find('.cd')
        const svg = wrapper.find('.cd__sheet svg')
        const model = felgenModel(current, next)

        expect(figure.attributes('role')).toBe('img')
        expect(figure.attributes('aria-label')).toBe(
            `Blick von hinten auf ein Rad im Radhaus, rechnerisch. Außenkante: ${mm('23')} weiter außen. Innenkante: ${mm('3')} näher am Federbein. Federbein und Kotflügel schematisch.`
        )
        expect(svg.attributes('viewBox')).toBe(`0 0 ${REAR.width} ${REAR.height}`)
        expect(svg.attributes('aria-hidden')).toBe('true')
        expect(Number(svg.attributes('data-units-per-mm'))).toBeCloseTo(rearScene(rearFrame(model), model).unitsPerMm, 12)
    })

    it('draws both wheels where their ET puts them against the one mounting face, the tyre centred on the rim', () => {
        const wrapper = mountDrawing()
        const model = felgenModel(current, next)
        const scene = rearScene(rearFrame(model), model)

        // One mounting face in the sheet, the car's, for both wheels.
        expect(wrapper.findAll('.cd__sheet .cd__face')).toHaveLength(1)
        expect(wrapper.find('.cd__sheet .cd__face').attributes('d')).toBe(scene.face)

        for (const wheel of ['current', 'next'] as const) {
            const rim = rimRect(wrapper, wheel)
            const tyre = tyreRect(wrapper, wheel)

            expect(rim).toEqual({ x: scene[wheel].rim.x, width: scene[wheel].rim.width })
            // The tyre is centred on the rim's centre plane.
            expect(tyre.x + tyre.width / 2).toBeCloseTo(rim.x + rim.width / 2, 1)
        }

        // Bigger tyre, bigger drawing: 640,1 against 634,3 mm on one scale.
        expect(tyreRect(wrapper, 'next').height).toBeGreaterThan(tyreRect(wrapper, 'current').height)
    })

    it('makes each arrow exactly as long as the edge moved, on the one scale, with its label', () => {
        const wrapper = mountDrawing()
        const k = Number(wrapper.find('.cd__sheet svg').attributes('data-units-per-mm'))

        expect(label(wrapper, 'outer')).toBe(`Außenkante: ${mm('23')} weiter außen`)
        expect(label(wrapper, 'inner')).toBe(`Innenkante: ${mm('3')} näher am Federbein`)

        const outer = shaft(wrapper, 'outer')
        const inner = shaft(wrapper, 'inner')
        expect(outer).not.toBeNull()
        expect(inner).not.toBeNull()
        // 22,7 and 2,7 mm, drawn to scale — each within half a millimetre of the printed 23 and 3.
        expect(Math.abs((outer?.to ?? 0) - (outer?.from ?? 0)) - 22.7 * k).toBeCloseTo(0, 1)
        expect(Math.abs((inner?.to ?? 0) - (inner?.from ?? 0)) - 2.7 * k).toBeCloseTo(0, 1)
    })

    it('moves the inner edge towards the strut, and points its arrow there, exactly when the inner value says so', () => {
        const wrapper = mountDrawing()

        // Inner +2,7 mm: the new inner edge is left of the old one, the head points left.
        expect(rimRect(wrapper, 'next').x).toBeLessThan(rimRect(wrapper, 'current').x)
        expect((head(wrapper, 'inner')?.tip ?? 0) < (head(wrapper, 'inner')?.base ?? 0)).toBe(true)
        expect((head(wrapper, 'outer')?.tip ?? 0) > (head(wrapper, 'outer')?.base ?? 0)).toBe(true)

        // 8J ET 45 → 8J ET 30: 15 mm outboard, away from the strut.
        const away = mountDrawing({ current: { ...current, widthIn: 8 }, next: { ...current, widthIn: 8, etMm: 30 } })
        expect(label(away, 'inner')).toBe(`Innenkante: ${mm('15')} weiter weg vom Federbein`)
        expect(rimRect(away, 'next').x).toBeGreaterThan(rimRect(away, 'current').x)
        expect((head(away, 'inner')?.tip ?? 0) > (head(away, 'inner')?.base ?? 0)).toBe(true)

        // 8J ET 45 → 8J ET 60: 15 mm inboard, both edges.
        const inboard = mountDrawing({ current: { ...current, widthIn: 8 }, next: { ...current, widthIn: 8, etMm: 60 } })
        expect(label(inboard, 'outer')).toBe(`Außenkante: ${mm('15')} weiter innen`)
        expect((head(inboard, 'outer')?.tip ?? 0) < (head(inboard, 'outer')?.base ?? 0)).toBe(true)
    })

    it('draws no arrow and says unverändert when an edge moves by no whole millimetre', () => {
        const same = mountDrawing({ next: { ...current } })

        expect(same.find('.cd__dim').exists()).toBe(false)
        expect(same.find('.cd__head').exists()).toBe(false)
        expect(same.find('.cd__ext').exists()).toBe(false)
        expect(label(same, 'outer')).toBe('Außenkante: unverändert')
        expect(label(same, 'inner')).toBe('Innenkante: unverändert')
        expect(rimRect(same, 'next')).toEqual(rimRect(same, 'current'))

        // 0,05 mm on the outside: no outer arrow; 38 mm on the inside: an arrow.
        const hair = mountDrawing({ current: { ...current, widthIn: 7, etMm: 30 }, next: { ...current, widthIn: 8.5, etMm: 49 } })
        expect(label(hair, 'outer')).toBe('Außenkante: unverändert')
        expect(hair.find('path.cd__dim[data-dim="outer"]').exists()).toBe(false)
        expect(hair.find('path.cd__dim[data-dim="inner"]').exists()).toBe(true)
    })

    it('prints the same edge texts as the model the results read', () => {
        const pairs: [WheelSetup, WheelSetup][] = [
            [current, next],
            [next, current],
            [current, { ...current, widthIn: 9, etMm: -30 }],
        ]

        for (const [a, b] of pairs) {
            const wrapper = mountDrawing({ current: a, next: b })
            const model = felgenModel(a, b)

            expect(label(wrapper, 'outer')).toBe(model.outer.text)
            expect(label(wrapper, 'inner')).toBe(model.inner.text)
        }
    })

    it('names the parts and says that the strut and the fender are schematic', () => {
        const wrapper = mountDrawing()

        expect(wrapper.findAll('.cd__part').map((p) => p.text())).toEqual(['← innen · Federbein', 'Kotflügel · außen →'])
        expect(wrapper.find('.cd__note').text()).toBe('Federbein und Kotflügel: Lage schematisch – je nach Fahrzeug')
        expect(wrapper.findAll('.cd__key').map((k) => k.text())).toEqual([
            `bisher 7,5J × 17 · ET${NNBSP}45 · 225/45 R17`,
            `neu 8,5J × 19 · ET${NNBSP}35 · 225/35 R19`,
            'Anlagefläche: hier wird die Felge angeschraubt',
        ])
        // The viewpoint comes first, before anything in the picture.
        expect(wrapper.find('.cd__stage > :first-child').text()).toBe('Blick von hinten auf ein Rad im Radhaus')
        expect(wrapper.find('.cd__caption').text()).toBe('Rad und Reifen maßstäblich, beide im selben Maßstab. Werte rechnerisch, auf ganze Millimeter gerundet.')
        // Both schematic parts are drawn, once, for both wheels.
        expect(wrapper.findAll('.cd__sheet [data-part="strut"]')).toHaveLength(1)
        expect(wrapper.findAll('.cd__sheet [data-part="fender"]')).toHaveLength(1)
    })

    it('keeps every label inside its row: left and shift are the same fraction', () => {
        const wrapper = mountDrawing()

        for (const selector of ['.cd__label[data-dim="inner"]', '.cd__label[data-dim="outer"]', '.cd__part[data-part="strut"]', '.cd__part[data-part="fender"]']) {
            const style = wrapper.find(selector).attributes('style') ?? ''
            const left = /left: ([\d.]+)%/.exec(style)?.[1]
            const shift = /translateX\(-([\d.]+)%\)/.exec(style)?.[1]

            expect(left, `${selector}: ${style}`).toBeDefined()
            expect(shift).toBe(left)
            expect(Number(left)).toBeGreaterThanOrEqual(0)
            expect(Number(left)).toBeLessThanOrEqual(100)
        }

        // The two part names share a row split between them, so they cannot meet.
        expect(wrapper.find('.cd__parts').attributes('style')).toMatch(/grid-template-columns: [\d.]+% minmax\(0, 1fr\)/)
    })

    it('keeps the translator off every figure: each value sits in translate="no"', () => {
        const wrapper = mountDrawing()
        const values = wrapper.findAll('[translate="no"]').map((v) => v.text())

        expect(unprotectedFigures(wrapper.element)).toEqual([])
        expect(values).toContain(mm('23'))
        expect(values).toContain(mm('3'))
        expect(values).toContain('7,5J')
        expect(values).toContain(`ET${NNBSP}35`)
        expect(values).toContain('225/35 R19')
    })

    it('draws nothing for a tyre and a rim that do not belong together', () => {
        // 5,5J (139,7 mm) inside a 305 tyre: 0,46 × its width.
        const wrapper = mountDrawing({ next: { widthIn: 5.5, diameterIn: 19, etMm: 35, tyreWidthMm: 305, aspect: 30 } })

        expect(wrapper.find('.cd').exists()).toBe(false)
        expect(wrapper.find('svg').exists()).toBe(false)
        expect(wrapper.text()).toBe('')
    })

    it('never borrows a verdict word or a verdict colour: ink and line only', () => {
        const wrapper = mountDrawing()
        const text = `${wrapper.text()} ${wrapper.find('.cd').attributes('aria-label')}`

        expect(text).not.toMatch(/zulässig|passt|legal|eintragungsfrei|toleranz|freigegeben|erlaubt|\bok\b/i)

        const shapes = wrapper.findAll('.cd__sheet svg path, .cd__sheet svg rect')
        expect(shapes.length).toBeGreaterThan(8)

        for (const shape of shapes) {
            expect(shape.attributes('stroke')).toBeUndefined()
            expect(shape.attributes('fill')).toBeUndefined()
            expect(shape.attributes('style')).toBeUndefined()
        }

        expect(wrapper.html()).not.toContain('blue')
        expect(wrapper.html()).not.toMatch(/--c-(ok|warn|bad)/)
    })

    it('rests in its end state under reduced motion: a change is drawn instantly', async () => {
        reducedMotion(true)
        const wrapper = mountDrawing()
        const target = { ...next, etMm: 10 }

        await wrapper.setProps({ next: target })
        await nextTick()

        const model = felgenModel(current, target)
        const scene = rearScene(rearFrame(model), model)
        expect(rimRect(wrapper, 'next').x).toBe(scene.next.rim.x)
        // ET 45 → 10 on 7,5 → 8,5J: outer +47,7 → 48 mm, inner −22,3 → 22 mm away from the strut.
        expect(label(wrapper, 'inner')).toBe(`Innenkante: ${mm('22')} weiter weg vom Federbein`)
    })

    it('tweens the wheels towards the new value over --d-2 when motion is allowed, while the labels change at once', async () => {
        reducedMotion(false)
        const wrapper = mountDrawing()
        const target = { ...next, etMm: 10 }
        const model = felgenModel(current, target)
        const end = rearScene(rearFrame(model), model).next.rim.x

        await wrapper.setProps({ next: target })
        await nextTick()

        // The label reads the target straight away; the rim is still on its way.
        expect(label(wrapper, 'inner')).toBe(`Innenkante: ${mm('22')} weiter weg vom Federbein`)
        expect(rimRect(wrapper, 'next').x).not.toBe(end)

        await new Promise((resolve) => setTimeout(resolve, 450))
        await nextTick()

        expect(rimRect(wrapper, 'next').x).toBe(end)
    })
})
