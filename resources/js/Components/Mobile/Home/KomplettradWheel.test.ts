import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import illustration from '../../../images/komplettrad-illustration.json'
import KomplettradWheel from './KomplettradWheel.vue'

/*
 * The Komplettrad in the dark band on a phone (docs/phase0/ACCURACY.md §3.1): a generated
 * illustration of a wheel with its tyre — the parametric render, no car, no brake, no brand, no
 * size — labelled "Illustration", turning with the scroll through CSS alone.
 */

/* The component's own source, read the way styles.test.ts reads every component: the turn is CSS, which happy-dom does not run. */
const SOURCE = Object.values(import.meta.glob<string>('./KomplettradWheel.vue', { query: '?raw', import: 'default', eager: true }))[0] ?? ''

/** The component's stylesheet, without its comments. */
function stylesheet(): string {
    return (SOURCE.match(/<style\b[^>]*>([\s\S]*?)<\/style>/)?.[1] ?? '').replace(/\/\*[\s\S]*?\*\//g, '')
}

let wrappers: VueWrapper[] = []

function mountWheel(): VueWrapper {
    const wrapper = mount(KomplettradWheel, { attachTo: document.body })
    wrappers.push(wrapper)

    return wrapper
}

afterEach(() => {
    wrappers.forEach((w) => w.unmount())
    wrappers = []
    document.body.innerHTML = ''
    vi.restoreAllMocks()
})

describe('KomplettradWheel', () => {
    it('shows an illustration of a complete wheel, labelled "Illustration", lazily at 240 px and square', () => {
        const wrapper = mountWheel()
        const img = wrapper.find('.komplett-wheel__turn img')

        expect(img.exists()).toBe(true)
        expect(img.attributes('alt')).toBe('Illustration eines Komplettrads aus Felge und Reifen, Ansicht von vorn')
        expect(wrapper.find('figure figcaption').text()).toBe('Illustration')
        // No brand, no lettering, no size: the label is all the text there is.
        expect(wrapper.text()).toBe('Illustration')
        expect(img.attributes('loading')).toBe('lazy')
        expect(img.attributes('sizes')).toBe('240px')
        // Square, so the turn never changes the layout box.
        expect(img.attributes('width')).toBe(img.attributes('height'))
    })

    it('is the generated render, never a photograph of a wheel on a car', () => {
        const wrapper = mountWheel()
        const files = [
            wrapper.find('img').attributes('src') ?? '',
            ...wrapper.findAll('source, img').flatMap((el) => (el.attributes('srcset') ?? '').split(',').map((entry) => entry.trim().split(/\s+/)[0] ?? '')),
        ]

        expect(files.length).toBeGreaterThan(3)
        for (const file of files) {
            expect(file).toMatch(/^\/images\/komplettrad-illustration\/komplettrad-illustration-\d+\.(avif|webp|png)$/)
        }

        // Its provenance: rendered from the parametric wheel and tyre, no third-party design.
        expect(illustration.licence).toContain('render-komplettrad')
    })

    it('turns with the scroll through CSS alone: no scroll listener, and scrolling moves nothing', async () => {
        const onWindow = vi.spyOn(window, 'addEventListener')
        const onDocument = vi.spyOn(document, 'addEventListener')
        const wrapper = mountWheel()
        const before = wrapper.html()
        const listened = [...onWindow.mock.calls, ...onDocument.mock.calls].map((call) => String(call[0]))

        for (const type of ['scroll', 'wheel', 'touchmove']) {
            expect(listened).not.toContain(type)
        }

        window.dispatchEvent(new Event('scroll'))
        document.dispatchEvent(new Event('scroll'))
        await nextTick()

        expect(wrapper.html()).toBe(before)
        expect(wrapper.find('.komplett-wheel__turn').attributes('style')).toBeUndefined()
    })

    it('turns two full turns backwards on a scroll timeline where the browser has one, and stands still under reduced motion', () => {
        const css = stylesheet()
        const scrollDriven = css.match(/@supports\s*\(\s*animation-timeline:\s*view\(\)\s*\)\s*\{\s*\.komplett-wheel__turn\s*\{([^}]*)\}/)?.[1] ?? ''
        const turn = css.match(/@keyframes\s+turn\s*\{\s*from\s*\{\s*transform:\s*rotate\((-?\d+)deg\);?\s*\}\s*to\s*\{\s*transform:\s*rotate\((-?\d+)deg\);?\s*\}\s*\}/)
        const reduced = css.match(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{\s*\.komplett-wheel__turn\s*\{([^}]*)\}/)?.[1] ?? ''

        expect(scrollDriven).toMatch(/animation:\s*turn\b/)
        expect(scrollDriven).toMatch(/animation-timeline:\s*view\(\)/)
        expect(turn?.[1]).toBe('0')
        expect(turn?.[2]).toBe('-720')
        expect(reduced).toMatch(/animation:\s*none/)
    })

    it('falls back to the drawn wheel when the picture fails, never to a photograph, and keeps its label', async () => {
        const wrapper = mountWheel()

        await wrapper.find('img').trigger('error')

        expect(wrapper.find('img').exists()).toBe(false)
        expect(wrapper.find('.komplett-wheel__fallback svg.outline').exists()).toBe(true)
        expect(wrapper.find('.komplett-wheel__fallback').attributes('aria-hidden')).toBe('true')
        expect(wrapper.find('figcaption').text()).toBe('Illustration')
    })
})
