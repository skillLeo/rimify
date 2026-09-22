import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { NNBSP } from '../../../format'
import type { HeroProduct } from '../../../types/pages'

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ props: { demo: false } }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup(props, { slots, attrs }) {
            return () => h('a', { href: props.href, ...attrs }, slots.default?.())
        },
    }),
}))

const { default: HeroFrame } = await import('./HeroFrame.vue')

class FakeResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
}

/* The labels as the server ships them today (`StartseiteController`), with the bolt pattern in its current form. */
function product(overrides: Partial<HeroProduct> = {}): HeroProduct {
    return {
        slug: 'borbet-havanna-graphite-matt',
        name: 'Havanna',
        brand: 'BORBET',
        finish: 'Graphite matt',
        fromPriceCents: 68900,
        fromPrice: `689,00${NNBSP}€`,
        image: 'hero-wheel',
        symbolic: false,
        config: { widthIn: 8, diameterIn: 18, etMm: 35, boltHoles: 5, boltCircleMm: 112, centreBoreMm: 66.6 },
        spec: [
            { label: 'Breite × Durchmesser', value: `8${NNBSP}J × 18` },
            { label: 'Einpresstiefe', value: 'ET 35' },
            { label: 'Lochkreis', value: '5/112' },
            { label: 'Mittenlochbohrung', value: `66,6${NNBSP}mm` },
        ],
        ...overrides,
    }
}

let wrappers: VueWrapper[] = []

function mountFrame(overrides: Partial<HeroProduct> = {}): VueWrapper {
    const wrapper = mount(HeroFrame, { props: { product: product(overrides) }, attachTo: document.body })
    wrappers.push(wrapper)

    return wrapper
}

beforeEach(() => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
})

afterEach(() => {
    wrappers.forEach((w) => w.unmount())
    wrappers = []
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
})

describe('HeroFrame', () => {
    it('shows the size and the offset as callouts, whatever the server calls them, and the other two as one line', () => {
        const wrapper = mountFrame()

        const labels = wrapper.findAll('.callout__label').map((el) => el.text())
        expect(labels).toEqual(['Breite × Durchmesser', 'Einpresstiefe'])
        expect(wrapper.findAll('.callout__value').map((el) => el.text())).toEqual([`8${NNBSP}J × 18`, 'ET 35'])

        expect(wrapper.find('.hero-mobile__rest').text()).toBe(`LK 5/112 · MLB 66,6${NNBSP}mm`)
    })

    it('does not double a short label the value already carries', () => {
        const wrapper = mountFrame({
            spec: [
                { label: 'Felgengröße', value: `8,5${NNBSP}J × 19` },
                { label: 'Lochkreis', value: 'LK 5 × 112' },
                { label: 'Mittenlochbohrung', value: `66,6${NNBSP}mm` },
                { label: 'Einpresstiefe', value: 'ET 35' },
            ],
        })

        expect(wrapper.findAll('.callout__label').map((el) => el.text())).toEqual(['Felgengröße', 'Einpresstiefe'])
        expect(wrapper.find('.hero-mobile__rest').text()).toBe(`LK 5 × 112 · MLB 66,6${NNBSP}mm`)
    })

    it('links the wheel and the caption to the product when the picture is the product', () => {
        const wrapper = mountFrame()

        const frame = wrapper.find('.hero-frame')
        expect(frame.element.tagName).toBe('A')
        expect(frame.attributes('href')).toBe('/felgen/borbet-havanna-graphite-matt')
        // The link is named by its content — the picture's alt and the callouts — never by a label
        // that would leave the visible text out of the accessible name.
        expect(frame.attributes('aria-label')).toBeUndefined()
        expect(wrapper.find('img').attributes('alt')).toBe('BORBET Havanna in Graphite matt, Ansicht von vorn')
        expect(wrapper.find('img').attributes('sizes')).toContain('calc(70vw - 22px)')
        expect(wrapper.find('img').attributes('loading')).toBe('eager')
        expect(wrapper.find('img').attributes('fetchpriority')).toBe('high')

        const caption = wrapper.find('a.hero-mobile__caption')
        expect(caption.text()).toContain('BORBET Havanna · Graphite matt')
        expect(caption.text()).toContain(`ab 172,25${NNBSP}€ · pro Felge`)
        expect(wrapper.find('.hero-mobile__symbolic').exists()).toBe(false)
    })

    it('names no product under a symbolic picture: no brand, no price, no link — the values and one sentence', () => {
        const wrapper = mountFrame({ symbolic: true })

        expect(wrapper.findAll('a')).toHaveLength(0)
        expect(wrapper.find('.hero-frame').element.tagName).toBe('DIV')
        expect(wrapper.find('.hero-frame').attributes('aria-label')).toBeUndefined()

        const text = wrapper.text()
        expect(text).not.toContain('BORBET')
        expect(text).not.toContain('Havanna')
        expect(text).not.toContain('pro Felge')
        expect(text).not.toContain('172,25')
        expect(wrapper.find('img').attributes('alt')).toBe('Symbolbild einer Felge, Ansicht von vorn')

        expect(wrapper.findAll('.callout')).toHaveLength(2)
        expect(wrapper.find('.hero-mobile__rest').text()).toBe(`LK 5/112 · MLB 66,6${NNBSP}mm`)
        expect(wrapper.find('.hero-mobile__symbolic').text()).toBe('Symbolbild – Werte einer Beispielkonfiguration')
        expect(wrapper.find('.hero-mobile__symbolic').classes()).toContain('micro')
    })

    it('marks the frame ready once the picture has painted, and draws the outline if it fails', async () => {
        const wrapper = mountFrame()

        expect(wrapper.find('.hero-frame').classes()).not.toContain('is-ready')
        await wrapper.find('img').trigger('load')
        expect(wrapper.find('.hero-frame').classes()).toContain('is-ready')

        await wrapper.find('img').trigger('error')
        expect(wrapper.find('img').exists()).toBe(false)
        expect(wrapper.find('.hero-frame__outline svg.outline').exists()).toBe(true)
        // The values are data: they stay when the picture goes.
        expect(wrapper.findAll('.callout')).toHaveLength(2)
    })
})
