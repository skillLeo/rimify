import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import GutachtenStory from './GutachtenStory.vue'
import type { HomeStats } from '../../types/pages'

const stats: HomeStats = { gutachten: 1234, variants: 56789, wheels: 412, brands: 6 }

/* The observers the fallback attaches — one per band — with a way to fire them from the test. */
type IoCallback = (entries: { isIntersecting: boolean; target: Element }[]) => void
const callbacks = new Map<string, IoCallback>()
const observed = new Map<string, Element[]>()

class FakeIntersectionObserver {
    private readonly band: string

    constructor(callback: IoCallback, options: { rootMargin?: string } = {}) {
        this.band = options.rootMargin ?? ''
        callbacks.set(this.band, callback)
        observed.set(this.band, [])
    }

    observe(el: Element): void {
        observed.get(this.band)?.push(el)
    }

    disconnect(): void {
        observed.set(this.band, [])
    }
}

const CENTRE = '-40% 0px -40% 0px'
const UPPER = '0px 0px -75% 0px'

function reach(wrapper: VueWrapper, step: number, band = CENTRE): void {
    const el = wrapper.find(`[data-step-index="${step}"]`).element
    callbacks.get(band)?.([{ isIntersecting: true, target: el }])
}

function media(queries: Record<string, boolean>): void {
    window.matchMedia = vi.fn((query: string) => ({
        matches: Object.entries(queries).some(([needle, value]) => value && query.includes(needle)),
    })) as unknown as typeof window.matchMedia
}

let wrappers: VueWrapper[] = []

function mountStory(props: { stats?: HomeStats } = {}): VueWrapper {
    const wrapper = mount(GutachtenStory, {
        props: { stats: props.stats ?? stats },
        attachTo: document.body,
    })
    wrappers.push(wrapper)

    return wrapper
}

beforeEach(() => {
    callbacks.clear()
    observed.clear()
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
    vi.stubGlobal('CSS', { supports: () => false })
    media({ 'min-width: 1024px': true })
})

afterEach(() => {
    wrappers.forEach((w) => w.unmount())
    wrappers = []
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
})

describe('GutachtenStory', () => {
    it('is a document with a marked example row, three marker strokes in the marker ink, and a stamp', () => {
        const wrapper = mountStory()

        const figure = wrapper.find('.doc')
        expect(figure.element.tagName).toBe('DIV')
        expect(figure.attributes('role')).toBe('img')
        expect(figure.attributes('aria-label')).toBe('Beispiel eines Gutachten-Auszugs; die Zeile des gewählten Fahrzeugs ist markiert')
        expect(figure.text()).toContain('Teilegutachten Nr. 12-3456 (Beispiel)')

        const target = wrapper.find('.doc__row--target')
        expect(target.text()).toContain('BMW')
        expect(target.text()).toContain('3er Coupé')
        expect(target.text()).toContain('346C')
        expect(target.text()).toContain('e1*2001/116*0136*')

        const marker = wrapper.find('svg.marker')
        expect(marker.exists()).toBe(true)
        expect(marker.attributes('aria-hidden')).toBe('true')
        expect(marker.find('linearGradient#marker-ink').exists()).toBe(true)

        const strokes = marker.findAll('path')
        // Three strokes, each drawn twice for the uneven edge.
        expect(strokes).toHaveLength(6)
        for (const path of strokes) {
            expect(path.attributes('stroke')).toBe('url(#marker-ink)')
            expect(path.attributes('pathLength')).toBe('1')
        }
        expect(marker.findAll('.marker__stroke--1')).toHaveLength(2)
        expect(marker.findAll('.marker__stroke--2')).toHaveLength(2)
        expect(marker.findAll('.marker__stroke--3')).toHaveLength(2)

        expect(wrapper.find('.doc__stamp .verdict--ok').text()).toBe('Freigegeben')
    })

    it('keeps the example row as it is: the document never names a real car it knows nothing about', () => {
        const wrapper = mountStory()
        const rows = wrapper.findAll('.doc__row:not(.doc__row--head)')

        expect(rows).toHaveLength(9)
        expect(rows[3]!.classes()).toContain('doc__row--target')
        expect(rows[3]!.text()).toContain('346C')
        expect(rows[3]!.findAll('.doc__cell').map((c) => c.text())).not.toContain('')
        expect(wrapper.find('.doc').text()).toContain('Golf VII')
        expect(wrapper.text()).not.toContain('– · –')
    })

    it('writes the Auflagen out as sentences beside the document and keeps the codes inside it', () => {
        const wrapper = mountStory()

        const steps = wrapper.find('.story__steps')
        expect(steps.text()).toContain('Die Verwendung ist nur mit Reifen der Größe 225/40 R18 zulässig.')
        expect(steps.text()).toContain('Die Änderung ist in die Fahrzeugpapiere einzutragen.')
        expect(steps.find('.verdict--warn').text()).toBe('Mit Auflagen')
        expect(steps.text()).not.toMatch(/\bA02\b|\bA11\b|\bK1a\b/)

        expect(wrapper.find('.doc').text()).toContain('A02')
        expect(wrapper.findAll('.story__step')).toHaveLength(3)
    })

    it('carries the three steps verbatim and no call to action', () => {
        const wrapper = mountStory()

        expect(wrapper.find('h2').text()).toBe('Wir lesen das Gutachten. Du bekommst die Antwort.')
        expect(wrapper.findAll('h3').map((h) => h.text())).toEqual(['Fahrzeug eindeutig erkennen', 'Gutachten abgleichen', 'Klare Antwort'])
        expect(wrapper.text()).toContain('fragen wir nach, statt zu raten')

        expect(wrapper.findAll('a')).toHaveLength(0)
        expect(wrapper.findAll('.btn')).toHaveLength(0)
    })

    it('formats the facts line in German and hides it when any count is zero', () => {
        const wrapper = mountStory()
        expect(wrapper.find('.story__facts').text()).toBe('1.234 Gutachten · 56.789 Fahrzeugvarianten · 412 Felgen mit Gutachten')

        const empty = mountStory({ stats: { gutachten: 12, variants: 0, wheels: 40, brands: 2 } })
        expect(empty.find('.story__facts').exists()).toBe(false)
    })

    it('falls back to observers without scroll-driven animations, in the story order, and never steps backwards', async () => {
        const wrapper = mountStory()
        await nextTick()

        const section = wrapper.find('section#h4')
        expect(section.classes()).toContain('is-io')
        expect(section.attributes('data-step')).toBeUndefined()
        // The centre band watches every step; the upper band only the last one, for the stamp.
        expect(observed.get(CENTRE)).toHaveLength(3)
        expect(observed.get(UPPER)).toHaveLength(1)
        expect(observed.get(UPPER)?.[0]?.getAttribute('data-step-index')).toBe('3')

        reach(wrapper, 1)
        await nextTick()
        expect(section.attributes('data-step')).toBe('1')

        reach(wrapper, 2)
        await nextTick()
        expect(section.attributes('data-step')).toBe('2')

        // Scrolling back up to step 1 keeps what was reached: the strokes never flicker.
        reach(wrapper, 1)
        await nextTick()
        expect(section.attributes('data-step')).toBe('2')

        reach(wrapper, 3)
        await nextTick()
        expect(section.attributes('data-step')).toBe('3')

        // The stamp lands only once step 3 has moved on up, after its own stroke.
        reach(wrapper, 3, UPPER)
        await nextTick()
        expect(section.attributes('data-step')).toBe('stamped')

        reach(wrapper, 2)
        await nextTick()
        expect(section.attributes('data-step')).toBe('stamped')
    })

    it('never lets the upper band skip ahead of the centre band order', async () => {
        const wrapper = mountStory()
        await nextTick()

        // A fast scroll can fire the upper band first; the state still only ever advances.
        reach(wrapper, 3, UPPER)
        await nextTick()
        expect(wrapper.find('section#h4').attributes('data-step')).toBe('stamped')

        reach(wrapper, 2)
        await nextTick()
        expect(wrapper.find('section#h4').attributes('data-step')).toBe('stamped')
    })

    it('attaches no observer when the browser drives the animation from the scroll', async () => {
        vi.stubGlobal('CSS', { supports: (q: string) => q === 'animation-timeline: view()' })

        const wrapper = mountStory()
        await nextTick()

        expect(wrapper.find('section#h4').classes()).not.toContain('is-io')
        expect(callbacks.size).toBe(0)
    })

    it('attaches no observer under reduced motion, so the end state stands from the first paint', async () => {
        media({ 'min-width: 1024px': true, 'reduced-motion': true })

        const wrapper = mountStory()
        await nextTick()

        expect(wrapper.find('section#h4').classes()).not.toContain('is-io')
        expect(callbacks.size).toBe(0)
    })

    it('attaches no observer below 1024, where the document stands above the steps fully drawn', async () => {
        media({ 'min-width: 1024px': false })

        const wrapper = mountStory()
        await nextTick()

        expect(wrapper.find('section#h4').classes()).not.toContain('is-io')
        expect(callbacks.size).toBe(0)
    })
})
