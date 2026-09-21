import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import GutachtenStory from './GutachtenStory.vue'
import type { HomeStats } from '../../types/pages'
import type { VehicleProp } from '../../types/rimify'

const stats: HomeStats = { gutachten: 1234, variants: 56789, wheels: 412, brands: 6 }

const vehicle: VehicleProp = {
    id: 3,
    make: 'Audi',
    model: 'RS 4',
    variant: 'RS 4 Avant Quattro',
    label: 'Audi RS 4 Avant Quattro',
    short: 'Audi RS 4',
    hsn: '0588',
    tsn: 'AAS',
    keyNumbers: 'HSN 0588 · TSN AAS',
    buildWindow: '09/2012–06/2019',
}

/* The observer the fallback attaches, with a way to fire it from the test. */
type IoCallback = (entries: { isIntersecting: boolean; target: Element }[]) => void
let ioCallback: IoCallback | null = null
const observed: Element[] = []

class FakeIntersectionObserver {
    constructor(callback: IoCallback) {
        ioCallback = callback
    }

    observe(el: Element): void {
        observed.push(el)
    }

    disconnect(): void {
        observed.length = 0
    }
}

function reach(wrapper: VueWrapper, step: number): void {
    const el = wrapper.find(`[data-step-index="${step}"]`).element
    ioCallback?.([{ isIntersecting: true, target: el }])
}

let wrappers: VueWrapper[] = []

function mountStory(props: { stats?: HomeStats; vehicle?: VehicleProp | null } = {}): VueWrapper {
    const wrapper = mount(GutachtenStory, {
        props: { stats: props.stats ?? stats, vehicle: props.vehicle ?? null },
        attachTo: document.body,
    })
    wrappers.push(wrapper)

    return wrapper
}

beforeEach(() => {
    ioCallback = null
    observed.length = 0
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
    vi.stubGlobal('CSS', { supports: () => false })
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia
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

        const figure = wrapper.find('figure.doc')
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

    it('names the chosen vehicle in the marked row and borrows nothing from the example', () => {
        const wrapper = mountStory({ vehicle })

        const target = wrapper.find('.doc__row--target')
        expect(target.text()).toContain('Audi')
        expect(target.text()).toContain('RS 4 Avant Quattro')
        expect(target.text()).not.toContain('346C')
        expect(target.text()).not.toContain('e1*2001/116*0136*')
        expect(target.text()).not.toContain('225/40 R18')

        // The rest of the document is still the example.
        expect(wrapper.find('figure.doc').text()).toContain('Golf VII')
    })

    it('writes the Auflagen out as sentences beside the document and keeps the codes inside it', () => {
        const wrapper = mountStory()

        const steps = wrapper.find('.story__steps')
        expect(steps.text()).toContain('Die Verwendung ist nur mit Reifen der Größe 225/40 R18 zulässig.')
        expect(steps.text()).toContain('Die Änderung ist in die Fahrzeugpapiere einzutragen.')
        expect(steps.find('.verdict--warn').text()).toBe('Mit Auflagen')
        expect(steps.text()).not.toMatch(/\bA02\b|\bA11\b|\bK1a\b/)

        expect(wrapper.find('figure.doc').text()).toContain('A02')
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

    it('falls back to an observer without scroll-driven animations and never steps backwards', async () => {
        const wrapper = mountStory()
        await nextTick()

        const section = wrapper.find('section#h4')
        expect(section.classes()).toContain('is-io')
        expect(section.attributes('data-step')).toBeUndefined()
        expect(observed).toHaveLength(3)

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
    })

    it('attaches no observer when the browser drives the animation from the scroll', async () => {
        vi.stubGlobal('CSS', { supports: (q: string) => q === 'animation-timeline: view()' })

        const wrapper = mountStory()
        await nextTick()

        expect(wrapper.find('section#h4').classes()).not.toContain('is-io')
        expect(observed).toHaveLength(0)
    })

    it('attaches no observer under reduced motion, so the end state stands from the first paint', async () => {
        window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia

        const wrapper = mountStory()
        await nextTick()

        expect(wrapper.find('section#h4').classes()).not.toContain('is-io')
        expect(observed).toHaveLength(0)
    })
})
