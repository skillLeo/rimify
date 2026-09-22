import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, reactive } from 'vue'
import { NNBSP } from '../../format'
import type { HeroProduct, StartseiteProps } from '../../types/pages'
import type { VehicleProp } from '../../types/rimify'

const current: { props: Record<string, unknown> } = { props: {} }

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    useForm: (data: Record<string, unknown>) => reactive({ ...data, processing: false, errors: {}, post: vi.fn(), delete: vi.fn() }),
    router: { delete: vi.fn(), post: vi.fn() },
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup(props, { slots }) {
            return () => h('a', { href: props.href }, slots.default?.())
        },
    }),
}))

const { default: HomeHero } = await import('./HomeHero.vue')

const vehicle: VehicleProp = {
    id: 3,
    make: 'BMW',
    model: '3er',
    variant: 'Coupé',
    typeDesignation: null,
    label: 'BMW 3er Coupé',
    short: 'BMW 3er',
    hsn: '0005',
    tsn: '582',
    keyNumbers: 'HSN 0005 · TSN 582',
    buildWindow: '01/1995–12/1999',
}

function product(overrides: Partial<HeroProduct> = {}): HeroProduct {
    return {
        slug: 'bbs-rs-silber',
        name: 'RS',
        brand: 'BBS',
        finish: 'Silber',
        fromPriceCents: 75600,
        fromPrice: `756,00${NNBSP}€`,
        image: 'hero-wheel',
        symbolic: true,
        config: { widthIn: 8.5, diameterIn: 19, etMm: 35, boltHoles: 5, boltCircleMm: 112, centreBoreMm: 66.6 },
        spec: [
            { label: 'Felgengröße', value: `8,5${NNBSP}J × 19` },
            { label: 'Lochkreis', value: `LK 5 × 112` },
            { label: 'Mittenlochbohrung', value: `66,6${NNBSP}mm` },
            { label: 'Einpresstiefe', value: 'ET 35' },
        ],
        ...overrides,
    }
}

function hero(overrides: Partial<StartseiteProps['hero']> = {}): StartseiteProps['hero'] {
    return {
        title: 'Felgen, die an dein Auto dürfen.',
        subline: '',
        sublineMobile: '',
        product: product(),
        stats: { gutachten: 1, variants: 1, wheels: 1, brands: 1 },
        ...overrides,
    }
}

function media(reduced: boolean, fine = true): void {
    vi.stubGlobal(
        'matchMedia',
        vi.fn((query: string) => ({
            matches: query.includes('reduced-motion') ? reduced : fine,
            media: query,
            onchange: null,
            addEventListener: () => {},
            removeEventListener: () => {},
            addListener: () => {},
            removeListener: () => {},
            dispatchEvent: () => false,
        }))
    )
}

let mounted: VueWrapper[] = []

function mountHero(props: Partial<{ hero: StartseiteProps['hero'] }> = {}): VueWrapper {
    const wrapper = mount(HomeHero, {
        props: { hero: props.hero ?? hero(), selector: { makes: [] } },
        global: { stubs: { HeroSelector: true } },
        attachTo: document.body,
    })
    mounted.push(wrapper)

    return wrapper
}

/** A pointer event as the frame's listener sees it; happy-dom has no PointerEvent constructor to rely on. */
function pointer(type: string, pointerType: string, clientX: number): Event {
    const event = new Event(type, { bubbles: true })
    Object.defineProperties(event, { pointerType: { value: pointerType }, clientX: { value: clientX } })

    return event
}

/** What the browser reports about the photograph at hydration: still loading, cached, or broken. */
function imageState(complete: boolean, naturalWidth: number): void {
    Object.defineProperty(HTMLImageElement.prototype, 'complete', { get: () => complete, configurable: true })
    Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', { get: () => naturalWidth, configurable: true })
}

beforeEach(() => {
    // No phone, as on the live shop until the client publishes one; the e-mail is a reserved example domain.
    current.props = { vehicle: null, garage: [], contact: { email: 'service@example.com', phone: null, phoneIntl: null, whatsapp: null, hours: 'Mo–Fr 9:00–17:00 Uhr' } }
    media(false)
    imageState(false, 0)
    // A running CSS animation, as the browser reports it after `is-lit` is applied.
    Object.defineProperty(HTMLElement.prototype, 'getAnimations', { value: () => [{}], configurable: true, writable: true })
})

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
})

describe('HomeHero', () => {
    it('is the H2 section with one h1 and the server copy', () => {
        const wrapper = mountHero()
        const section = wrapper.find('section#h2')

        expect(section.attributes('data-section')).toBe('H2')
        expect(section.attributes('aria-labelledby')).toBe('h2-title')
        expect(wrapper.findAll('h1')).toHaveLength(1)
        expect(wrapper.find('h1').text()).toBe('Felgen, die an dein Auto dürfen.')
        expect(wrapper.find('.hero__subline').text()).toContain('Wir zeigen dir nur Felgen, deren Gutachten dein Fahrzeug ausdrücklich nennt')
    })

    it('names the chosen car in the h1', () => {
        current.props.vehicle = vehicle
        const wrapper = mountHero()

        expect(wrapper.find('h1').text()).toBe('Felgen, die an deinen BMW 3er dürfen.')
    })

    it('shows the four server values on their slots, with targets from the manifest', () => {
        const wrapper = mountHero()
        const callouts = wrapper.findAll('.callout')

        expect(callouts).toHaveLength(4)
        const values = callouts.map((c) => c.find('.callout__value').text())
        expect(values).toEqual([`8,5${NNBSP}J × 19`, 'LK 5 × 112', `66,6${NNBSP}mm`, 'ET 35'])

        // The box positions are the spec's; the slot is found by the label, not by the order shipped.
        const byLabel = Object.fromEntries(callouts.map((c) => [c.find('.callout__label').text(), c.attributes('style')]))
        expect(byLabel['Felgengröße']).toContain('left: 4%')
        expect(byLabel['Einpresstiefe']).toContain('left: 70%')
        expect(byLabel['Lochkreis']).toContain('left: 72%')
        expect(byLabel['Mittenlochbohrung']).toContain('left: 6%')
    })

    it('links the wheel and the caption once, with the per-wheel price and the alt text, when the photograph is the product', () => {
        const wrapper = mountHero({ hero: hero({ product: product({ symbolic: false }) }) })
        const links = wrapper.findAll('a')

        expect(links).toHaveLength(1)
        const link = links[0]!
        expect(link.attributes('href')).toBe('/felgen/bbs-rs-silber')
        // Named by content — alt, callouts, caption — never by a label that leaves the visible text out.
        expect(link.attributes('aria-label')).toBeUndefined()
        expect(link.text()).toContain('BBS RS · Silber')
        expect(link.text()).toContain(`ab 189,00${NNBSP}€ · pro Felge`)
        expect(wrapper.find('img').attributes('alt')).toBe('BBS RS in Silber, Ansicht von vorn')
        expect(wrapper.find('img').attributes('loading')).toBe('eager')
        expect(wrapper.find('img').attributes('fetchpriority')).toBe('high')
        expect(wrapper.text()).not.toContain('Symbolbild')
    })

    it('under a stand-in photograph prints the values and the one note, but no brand, no price and no link', () => {
        const wrapper = mountHero()

        expect(wrapper.findAll('a')).toHaveLength(0)
        expect(wrapper.find('.hero__caption').exists()).toBe(false)
        expect(wrapper.text()).not.toContain('BBS')
        expect(wrapper.text()).not.toContain('RS · Silber')
        expect(wrapper.text()).not.toContain('pro Felge')
        expect(wrapper.find('img').attributes('alt')).toBe('Symbolbild einer Leichtmetallfelge, Ansicht von vorn')
        expect(wrapper.find('img').attributes('fetchpriority')).toBe('high')

        // The values are the product's own and stay; the note is the one sentence, inside the frame.
        expect(wrapper.findAll('.callout')).toHaveLength(4)
        const note = wrapper.find('.hero__frame .hero__symbolic')
        expect(note.text()).toBe('Symbolbild – Werte einer Beispielkonfiguration')
        expect(note.classes()).toContain('micro')
        expect(note.classes()).toContain('quiet')
        expect(wrapper.text()).not.toContain('Symbolfoto')
        expect(wrapper.text()).not.toContain('Werte der gezeigten Konfiguration')
        expect(wrapper.find('.hero__link').attributes('aria-label')).toBeUndefined()
    })

    it('lights the frame on load and draws the lines when the sweep has ended', async () => {
        const wrapper = mountHero()
        const frame = wrapper.find('.hero__frame')

        expect(frame.classes()).not.toContain('is-lit')
        await wrapper.find('img').trigger('load')
        await nextTick()
        expect(frame.classes()).toContain('is-lit')
        expect(frame.classes()).not.toContain('is-ready')

        await wrapper.find('.hero-sweep').trigger('animationend')
        expect(frame.classes()).toContain('is-ready')
    })

    it('lights the frame at once when the photograph was cached before hydration', async () => {
        imageState(true, 1124)
        const wrapper = mountHero()
        await nextTick()

        expect(wrapper.find('.hero__frame').classes()).toContain('is-lit')
        expect(wrapper.find('.hero__frame').classes()).not.toContain('is-ready')
    })

    it('falls back at once when the cached photograph is broken', async () => {
        imageState(true, 0)
        const wrapper = mountHero()
        await nextTick()

        expect(wrapper.find('picture').exists()).toBe(false)
        expect(wrapper.find('svg.outline').exists()).toBe(true)
    })

    it('under reduced motion is ready on load and never attaches the roll', async () => {
        media(true)
        const wrapper = mountHero()
        const frame = wrapper.find('.hero__frame')
        frame.element.getBoundingClientRect = () => ({ left: 0, width: 800 }) as DOMRect

        await wrapper.find('img').trigger('load')
        expect(frame.classes()).toContain('is-ready')

        frame.element.dispatchEvent(pointer('pointermove', 'mouse', 800))
        await nextTick()
        expect(wrapper.find('.hero__wheel').attributes('style')).toContain('--roll: 0deg')
    })

    it('rolls the wheel with a mouse only, within ±8°, and back to 0 on leave', async () => {
        const wrapper = mountHero()
        const frame = wrapper.find('.hero__frame')
        frame.element.getBoundingClientRect = () => ({ left: 0, width: 800 }) as DOMRect
        const wheel = wrapper.find('.hero__wheel')

        frame.element.dispatchEvent(pointer('pointermove', 'mouse', 600))
        await nextTick()
        expect(wheel.attributes('style')).toContain('--roll: 4deg')

        frame.element.dispatchEvent(pointer('pointermove', 'mouse', 5000))
        await nextTick()
        expect(wheel.attributes('style')).toContain('--roll: 8deg')

        frame.element.dispatchEvent(pointer('pointermove', 'touch', 0))
        await nextTick()
        expect(wheel.attributes('style')).toContain('--roll: 8deg')

        frame.element.dispatchEvent(pointer('pointerleave', 'mouse', 0))
        await nextTick()
        expect(wheel.attributes('style')).toContain('--roll: 0deg')
    })

    it('does not roll for a coarse pointer', async () => {
        media(false, false)
        const wrapper = mountHero()
        const frame = wrapper.find('.hero__frame')
        frame.element.getBoundingClientRect = () => ({ left: 0, width: 800 }) as DOMRect

        frame.element.dispatchEvent(pointer('pointermove', 'mouse', 800))
        await nextTick()
        expect(wrapper.find('.hero__wheel').attributes('style')).toContain('--roll: 0deg')
    })

    it('falls back to the drawn outline when the photograph fails, and keeps the values', async () => {
        const wrapper = mountHero()

        await wrapper.find('img').trigger('error')
        expect(wrapper.find('picture').exists()).toBe(false)
        expect(wrapper.find('svg.outline').exists()).toBe(true)
        expect(wrapper.findAll('.callout')).toHaveLength(4)
        expect(wrapper.find('.hero__frame').classes()).toContain('is-ready')
    })

    it('shows the outline and no values at all without a hero product', () => {
        const wrapper = mountHero({ hero: hero({ product: null }) })

        expect(wrapper.find('svg.outline').exists()).toBe(true)
        expect(wrapper.findAll('.callout')).toHaveLength(0)
        expect(wrapper.findAll('a')).toHaveLength(0)
    })
})
