import { mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, reactive } from 'vue'
import { NNBSP } from '../../format'
import { HERO_SIZES_DESKTOP } from '../Mobile/Home/calloutSlots'
import type { ImageManifest, WheelAnchors } from '../Ui/Picture.vue'
import type { HeroProduct, StartseiteProps } from '../../types/pages'
import type { ContactProp, VehicleProp } from '../../types/rimify'

/*
 * The desktop hero (docs/phase0/ACCURACY.md D10, §3.0, §4): the MOTEC's own `bare` cut-out on one
 * CSS contact shadow, leaders only to what a front view shows, the values from the server's
 * `facts`, a physically correct roll-in, and a final frame that needs no script to be there. The
 * fixture's anchors are copied from the MOTEC's manifest.json; positions are checked in the
 * frame's own units, from the rendered layout and the normalised anchor.
 */

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

class FakeResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
}

const NBSP = ' '
const CAPTION = 'Abbildung zeigt das Design; Werte der gezeigten Ausführung.'
const DEMO = 'Demodaten – Beispielsortiment; Preise und Bestände sind Beispielwerte.'
const SYMBOLIC = 'Symbolbild – Werte einer Beispielkonfiguration'

/* No phone, as on the live shop until the client publishes one; the e-mail is a reserved example domain. */
const CONTACT: ContactProp = { email: 'service@example.com', phone: null, phoneIntl: null, whatsapp: null, hours: 'Mo–Fr 9:00–17:00 Uhr' }

const VEHICLE: VehicleProp = {
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

/* storage/app/public/demo/wheels/motec-mcr4-ultimate-light-grey/manifest.json, copied. */
const CENTRE = { x: 0.4992, y: 0.4681 }
const WHEEL = { x: 0.5, y: 0.4708, r: 0.4086 }
const PCD = { x: 0.4992, y: 0.4681, r: 0.0854 }
const BORE = { x: 0.5, y: 0.4704, r: 0.0554 }
const KBA = { x: 0.5, y: 0.8469, w: 0.0696, h: 0.0142 }
const ANCHORS: WheelAnchors = { centre: CENTRE, wheel: WHEEL, pcd: PCD, bore: BORE, valve: { x: 0.4976, y: 0.8145 }, kba: KBA }

const DIR = '/storage/demo/wheels/motec-mcr4-ultimate-light-grey'
const SQUARE_BASE = `${DIR}/motec-mcr4-ultimate-light-grey`
const BARE_BASE = `${DIR}/motec-mcr4-ultimate-light-grey-bare`

function frame(name: string, height: number, anchors: WheelAnchors | null): ImageManifest {
    return {
        name,
        base: `${DIR}/${name}`,
        width: 1080,
        height,
        widths: [480, 768, 1080],
        fallback: 'png',
        placeholder: 'data:image/png;base64,iVBORw0KGgo=',
        ...(anchors === null ? {} : { anchors }),
    }
}

function manifest(overrides: Partial<ImageManifest> = {}, anchors: WheelAnchors | null = ANCHORS): ImageManifest {
    return {
        ...frame('motec-mcr4-ultimate-light-grey', 1080, anchors),
        wide: frame('motec-mcr4-ultimate-light-grey-4x3', 810, null),
        bare: frame('motec-mcr4-ultimate-light-grey-bare', 1080, anchors),
        stamp: '53810',
        ...overrides,
    }
}

function withoutAnchor(anchor: 'wheel' | 'pcd' | 'bore' | 'kba'): WheelAnchors {
    const copy: WheelAnchors = { ...ANCHORS }
    delete copy[anchor]

    return copy
}

const FACTS: HeroProduct['facts'] = {
    width: '8,5J',
    diameter: '19',
    et: `ET${NBSP}45`,
    boltPattern: `5${NBSP}×${NBSP}112`,
    centreBore: `66,6${NBSP}mm`,
    kba: '53810',
    maxLoad: `620${NBSP}kg`,
    specLine: `8,5J${NBSP}×${NBSP}19 · ET${NBSP}45 · LK${NBSP}5${NBSP}×${NBSP}112 · MLB${NBSP}66,6${NBSP}mm · Traglast${NBSP}620${NBSP}kg`,
}

/* Another configuration's facts: every value differs, so a value typed into the component would show. */
const OTHER: HeroProduct['facts'] = {
    width: '8J',
    diameter: '18',
    et: `ET${NBSP}35`,
    boltPattern: `5${NBSP}×${NBSP}120`,
    centreBore: `72,6${NBSP}mm`,
    kba: '53811',
    maxLoad: null,
    specLine: `8J${NBSP}×${NBSP}18 · ET${NBSP}35 · LK${NBSP}5${NBSP}×${NBSP}120 · MLB${NBSP}72,6${NBSP}mm`,
}

function product(overrides: Partial<HeroProduct> = {}): HeroProduct {
    return {
        slug: 'motec-mcr4-ultimate',
        name: 'MCR4 Ultimate',
        brand: 'MOTEC',
        finish: 'Light Grey D5',
        fromPriceCents: 75600,
        fromPrice: `756,00${NBSP}€`,
        imageManifest: manifest(),
        symbolic: false,
        config: { widthIn: 8.5, diameterIn: 19, etMm: 45, boltHoles: 5, boltCircleMm: 112, centreBoreMm: 66.6 },
        facts: FACTS,
        ...overrides,
    }
}

function hero(p: HeroProduct | null): StartseiteProps['hero'] {
    return {
        title: 'Felgen, die an dein Auto dürfen.',
        subline: '',
        sublineMobile: '',
        product: p,
        stats: { gutachten: 1, variants: 1, wheels: 1, brands: 1 },
    }
}

let mounted: VueWrapper[] = []

function mountHero(p: HeroProduct | null = product()): VueWrapper {
    const wrapper = mount(HomeHero, {
        props: { hero: hero(p), selector: { makes: [] } },
        global: { stubs: { HeroSelector: true } },
        attachTo: document.body,
    })
    mounted.push(wrapper)

    return wrapper
}

/** What the browser reports about the photograph at hydration: still loading, cached, or broken. */
function imageState(complete: boolean, naturalWidth: number): void {
    Object.defineProperty(HTMLImageElement.prototype, 'complete', { get: () => complete, configurable: true })
    Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', { get: () => naturalWidth, configurable: true })
}

function media(reduced: boolean): void {
    vi.stubGlobal(
        'matchMedia',
        vi.fn((query: string) => ({
            matches: query.includes('prefers-reduced-motion') ? reduced : false,
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

/** A pointer event as a listener would see it; happy-dom has no PointerEvent constructor to rely on. */
function pointer(type: string, clientX: number): Event {
    const event = new Event(type, { bubbles: true })
    Object.defineProperties(event, { pointerType: { value: 'mouse' }, clientX: { value: clientX }, clientY: { value: 200 } })

    return event
}

const cssVar = (el: DOMWrapper<Element>, name: string): string => (el.element as HTMLElement).style.getPropertyValue(name)

/** What a sighted reader sees: the element's text without its screen-reader-only parts. */
function visibleText(el: DOMWrapper<Element>): string {
    const copy = el.element.cloneNode(true) as Element
    copy.querySelectorAll('.visually-hidden').forEach((hidden) => hidden.remove())

    return (copy.textContent ?? '').trim()
}

/** Every element the markup itself hides: the final frame must be there without any script or class. */
function hiddenIn(root: Element): string[] {
    return [root, ...Array.from(root.querySelectorAll('*'))]
        .filter((el) => {
            const style = (el.getAttribute('style') ?? '').replace(/\s+/g, '')

            return el.hasAttribute('hidden') || /(^|;)(opacity:0(\.0*)?|visibility:hidden|display:none)(;|$)/.test(style)
        })
        .map((el) => `${el.tagName.toLowerCase()}.${el.getAttribute('class') ?? ''}`)
}

/** Every element that turns or moves by an inline style — a script-driven roll would leave one. */
function inlineTransforms(root: Element): string[] {
    return [root, ...Array.from(root.querySelectorAll('[style]'))]
        .filter((el) => /transform|rotate\(|translate/.test(el.getAttribute('style') ?? ''))
        .map((el) => `${el.tagName.toLowerCase()}.${el.getAttribute('class') ?? ''}`)
}

interface Box {
    /** The drawing is 100 units tall and this wide. */
    width: number
    left: number
    top: number
    side: number
}

/** The frame in the leaders' own units, and the square picture where the stage's style puts it. */
function pictureBox(stage: DOMWrapper<Element>, callout: DOMWrapper<Element>): Box {
    const width = Number((callout.find('svg.callout__line').attributes('viewBox') ?? '').split(/\s+/)[2])

    return {
        width,
        // `left` and the picture's width are percentages of the frame's width, `top` of its height.
        left: (parseFloat(cssVar(stage, '--pic-left')) / 100) * width,
        top: parseFloat(cssVar(stage, '--pic-top')),
        side: (parseFloat(cssVar(stage, '--pic-size')) / 100) * width,
    }
}

const toPicture = (box: Box, x: number, y: number): { x: number; y: number } => ({ x: (x - box.left) / box.side, y: (y - box.top) / box.side })

/** Where a callout's leader ends, in the drawing's units: its dot, which is also the path's last point. */
function leaderEnd(callout: DOMWrapper<Element>): { x: number; y: number } {
    const dot = callout.find('circle.callout__dot')
    const end = { x: Number(dot.attributes('cx')), y: Number(dot.attributes('cy')) }
    const path = (callout.find('path.callout__leader').attributes('d') ?? '').trim().split(/\s+/)

    expect([Number(path[path.length - 2]), Number(path[path.length - 1])]).toEqual([end.x, end.y])

    return end
}

const calloutKeys = (wrapper: VueWrapper): (string | undefined)[] => wrapper.findAll('[data-callout]').map((c) => c.attributes('data-callout'))

beforeEach(() => {
    current.props = { vehicle: null, garage: [], contact: CONTACT, demo: false }
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    imageState(false, 0)
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
        current.props.vehicle = VEHICLE

        expect(mountHero().find('h1').text()).toBe('Felgen, die an deinen BMW 3er dürfen.')
    })
})

describe('HomeHero · the picture', () => {
    it('is the shadowless bare frame, eager at the preloaded sizes, on exactly one CSS contact shadow', () => {
        const wrapper = mountHero()
        const images = wrapper.findAll('.hero__frame img')
        const img = wrapper.find('.hero__frame img')

        expect(images).toHaveLength(1)
        expect(img.attributes('src')).toBe(`${BARE_BASE}-1080.png`)
        expect(wrapper.find('.hero__frame source[type="image/avif"]').attributes('srcset')).toBe(
            `${BARE_BASE}-480.avif 480w, ${BARE_BASE}-768.avif 768w, ${BARE_BASE}-1080.avif 1080w`
        )
        expect(img.attributes('sizes')).toBe(HERO_SIZES_DESKTOP)
        expect(img.attributes('loading')).toBe('eager')
        expect(img.attributes('fetchpriority')).toBe('high')
        expect(img.attributes('alt')).toBe('MOTEC MCR4 Ultimate in Light Grey D5, Ansicht von vorn')

        const shadows = wrapper.findAll('.hero-contact')
        expect(shadows).toHaveLength(1)
        expect(shadows[0]?.attributes('aria-hidden')).toBe('true')
        expect(cssVar(wrapper.find('.hero__roll'), '--contact-w')).not.toBe('')
    })

    it('is the square frame, without a CSS shadow, when there is no bare frame', () => {
        const wrapper = mountHero(product({ imageManifest: manifest({ bare: undefined }) }))

        expect(wrapper.find('.hero__frame img').attributes('src')).toBe(`${SQUARE_BASE}-1080.png`)
        expect(wrapper.findAll('.hero-contact')).toHaveLength(0)
        expect(wrapper.find('.hero__roll').attributes('style') ?? '').not.toContain('--contact')
        // The square frame has the same anchors: the leaders stay.
        expect(wrapper.findAll('.callout')).toHaveLength(3)
    })

    it('draws the outline, prints the spec line and points at nothing for a product without a photograph', () => {
        const wrapper = mountHero(product({ imageManifest: null, symbolic: true }))

        expect(wrapper.find('img').exists()).toBe(false)
        expect(wrapper.find('.hero__outline svg.outline').exists()).toBe(true)
        expect(wrapper.findAll('.callout-anchor')).toHaveLength(0)
        expect(wrapper.findAll('.hero-contact')).toHaveLength(0)
        expect(visibleText(wrapper.find('.hero__spec'))).toBe(FACTS.specLine)
    })
})

describe('HomeHero · the callouts', () => {
    it('points only at what a front view shows: the Lochkreis, the cap over the bore and the KBA stamp', () => {
        const wrapper = mountHero()
        const rows = wrapper.findAll('[data-callout]').map((c) => [
            c.attributes('data-callout'),
            c.find('.callout__label').text(),
            c.find('.callout__value').text(),
            c.find('.callout__note').exists() ? c.find('.callout__note').text() : null,
        ])

        expect(rows).toEqual([
            ['boltCircle', 'Lochkreis', FACTS.boltPattern, null],
            ['centreBore', 'Mittenlochbohrung', FACTS.centreBore, 'hinter der Nabenkappe'],
            ['kba', 'KBA-Nummer', '53810 (ABE)', null],
        ])

        // Width, diameter and ET are in the spec line, never at a leader.
        const values = wrapper.findAll('.callout__value').map((v) => v.text())
        expect(values).not.toContain(FACTS.width)
        expect(values).not.toContain(FACTS.diameter)
        expect(values).not.toContain(FACTS.et)
    })

    it('draws the Lochkreis as one ring through the bolt-hole centres, its radius from anchors.pcd', () => {
        const wrapper = mountHero()
        const lochkreis = wrapper.find('[data-callout="boltCircle"]')
        const ring = lochkreis.find('circle.callout__ring')
        const box = pictureBox(wrapper.find('.hero__stage'), lochkreis)

        expect(wrapper.findAll('circle.callout__ring')).toHaveLength(1)
        expect(ring.exists()).toBe(true)

        const centre = toPicture(box, Number(ring.attributes('cx')), Number(ring.attributes('cy')))
        expect(centre.x).toBeCloseTo(PCD.x, 3)
        expect(centre.y).toBeCloseTo(PCD.y, 3)
        expect(Number(ring.attributes('r')) / box.side).toBeCloseTo(PCD.r, 3)
    })

    it('ends every leader on its anchor, in the frame\'s own coordinates', () => {
        const wrapper = mountHero()
        const stage = wrapper.find('.hero__stage')

        const at = (key: string): { x: number; y: number } => {
            const callout = wrapper.find(`[data-callout="${key}"]`)
            const box = pictureBox(stage, callout)
            const end = leaderEnd(callout)

            // The drawing has the frame's ratio, so nothing in it is stretched.
            expect(box.width).toBeCloseTo(parseFloat(cssVar(stage, '--frame-ratio')) * 100, 1)

            return toPicture(box, end.x, end.y)
        }

        const lochkreis = at('boltCircle')
        expect(Math.hypot(lochkreis.x - PCD.x, lochkreis.y - PCD.y)).toBeCloseTo(PCD.r, 3)

        const cap = at('centreBore')
        expect(Math.hypot(cap.x - BORE.x, cap.y - BORE.y)).toBeLessThanOrEqual(BORE.r + 0.0005)

        const stamp = at('kba')
        expect(Math.abs(stamp.x - KBA.x)).toBeLessThanOrEqual(KBA.w / 2 + 0.0005)
        expect(Math.abs(stamp.y - KBA.y)).toBeLessThanOrEqual(KBA.h / 2 + 0.0005)
    })

    it('names the KBA number only when facts.kba is set', () => {
        const wrapper = mountHero(product({ facts: { ...FACTS, kba: null } }))

        expect(calloutKeys(wrapper)).toEqual(['boltCircle', 'centreBore'])
        expect(wrapper.text()).not.toContain('53810')
        expect(wrapper.text()).not.toContain('KBA')
    })

    it('takes every value from facts, none typed in', () => {
        const wrapper = mountHero(product({ facts: OTHER, imageManifest: manifest({ stamp: '53811' }) }))

        expect(wrapper.findAll('.callout__value').map((v) => v.text())).toEqual([OTHER.boltPattern, OTHER.centreBore, '53811 (ABE)'])
        expect(visibleText(wrapper.find('.hero__spec'))).toBe(OTHER.specLine)

        const text = wrapper.text()
        for (const stale of ['112', '66,6', '53810', '620']) {
            expect(text).not.toContain(stale)
        }
    })

    it('draws no callout whose anchor is missing', () => {
        const noCircle = mountHero(product({ imageManifest: manifest({}, withoutAnchor('pcd')) }))
        expect(calloutKeys(noCircle)).toEqual(['centreBore', 'kba'])
        expect(noCircle.find('circle.callout__ring').exists()).toBe(false)

        expect(calloutKeys(mountHero(product({ imageManifest: manifest({}, withoutAnchor('bore')) })))).toEqual(['boltCircle', 'kba'])
        expect(calloutKeys(mountHero(product({ imageManifest: manifest({}, withoutAnchor('kba')) })))).toEqual(['boltCircle', 'centreBore'])
        expect(calloutKeys(mountHero(product({ imageManifest: manifest({}, null) })))).toEqual([])
    })
})

describe('HomeHero · motion', () => {
    it('rolls the wheel in once from the right, turning by distance / radius about its own axle, and draws the leaders after it', () => {
        const wrapper = mountHero()
        const roll = wrapper.find('.hero__roll')
        const distance = parseFloat(cssVar(roll, '--roll-distance')) / 100
        const angle = parseFloat(cssVar(roll, '--roll-angle'))
        const [originX, originY] = cssVar(roll, '--roll-origin').split(/\s+/).map((v) => parseFloat(v))

        expect(roll.classes()).toContain('hero__roll--rolling')
        expect(cssVar(roll, '--roll-distance')).toBe('160%')
        expect(cssVar(roll, '--roll-angle')).toMatch(/deg$/)
        // From the right (positive travel), clockwise at the start and unwinding to 0: counter-clockwise, without slipping.
        expect(distance).toBeGreaterThan(0)
        expect(angle).toBeGreaterThan(0)
        expect(angle).toBeCloseTo(((distance / WHEEL.r) * 180) / Math.PI, 1)
        expect(originX).toBeCloseTo(CENTRE.x * 100, 2)
        expect(originY).toBeCloseTo(CENTRE.y * 100, 2)
        // The box travels, the picture inside it turns.
        expect(roll.find('.hero__spin img').exists()).toBe(true)
        expect(cssVar(wrapper.find('.hero__stage'), '--callout-delay')).toBe('var(--d-roll)')
    })

    it('shows its final frame from the start: the picture, every leader and every line, nothing hidden', () => {
        const wrapper = mountHero()

        expect(wrapper.find('.hero__roll img').exists()).toBe(true)
        expect(wrapper.findAll('.callout')).toHaveLength(3)
        expect(visibleText(wrapper.find('.hero__spec'))).toBe(FACTS.specLine)
        expect(wrapper.find('.hero__shown').text()).toBe(CAPTION)
        expect(hiddenIn(wrapper.element)).toEqual([])
    })

    it('stands still without the roll class, everything shown and the leaders drawn at once, when there is nothing to roll', () => {
        const wrapper = mountHero(product({ imageManifest: manifest({}, withoutAnchor('wheel')) }))

        expect(wrapper.find('.hero__roll').classes()).not.toContain('hero__roll--rolling')
        expect(cssVar(wrapper.find('.hero__stage'), '--callout-delay')).toBe('0ms')
        expect(wrapper.findAll('.callout')).toHaveLength(3)
        expect(hiddenIn(wrapper.element)).toEqual([])
    })

    it('has no cursor roll: moving a pointer over the stage changes nothing', async () => {
        const wrapper = mountHero()
        const before = wrapper.html()
        const targets: EventTarget[] = [
            wrapper.find('.hero__stage').element,
            wrapper.find('.hero__frame').element,
            wrapper.find('.hero__roll').element,
            wrapper.find('.hero__frame img').element,
            window,
        ]

        for (const target of targets) {
            for (const [type, x] of [['pointerenter', 0], ['pointermove', 0], ['pointermove', 900], ['mousemove', 450], ['pointerleave', 0]] as [string, number][]) {
                target.dispatchEvent(pointer(type, x))
            }
        }

        await nextTick()
        await new Promise<void>((resolve) => setTimeout(resolve, 20))

        expect(wrapper.html()).toBe(before)
        expect(inlineTransforms(wrapper.element)).toEqual([])
    })

    it('under reduced motion renders the very same resting frame: the wheel in place, the leaders drawn, nothing hidden', () => {
        media(true)
        const reduced = mountHero()
        media(false)
        const moving = mountHero()

        expect(reduced.html()).toBe(moving.html())
        expect(reduced.find('.hero__roll img').exists()).toBe(true)
        expect(reduced.findAll('.callout')).toHaveLength(3)
        expect(hiddenIn(reduced.element)).toEqual([])
        expect(inlineTransforms(reduced.element)).toEqual([])
    })
})

describe('HomeHero · the lines under the picture', () => {
    it('prints the spec line and says what the picture shows', () => {
        const wrapper = mountHero()

        expect(visibleText(wrapper.find('.hero__spec'))).toBe(FACTS.specLine)
        expect(wrapper.find('.hero__shown').text()).toBe(CAPTION)
        expect(wrapper.text()).not.toContain('Demodaten')
    })

    it('reads the stamp number with the spec line, because the callouts are drawing', () => {
        const wrapper = mountHero()

        expect(wrapper.find('.callout-anchor').attributes('aria-hidden')).toBe('true')
        expect(wrapper.find('.hero__spec .visually-hidden').text()).toBe('· KBA-Nummer 53810 (ABE)')
    })

    it('adds the Demodaten line, once, when page.props.demo', () => {
        current.props.demo = true
        const wrapper = mountHero()

        expect(wrapper.findAll('.demo-note')).toHaveLength(1)
        expect(wrapper.find('.demo-note').text()).toBe(DEMO)
    })

    it('links the picture and the caption once, to the product, with the per-wheel price', () => {
        const wrapper = mountHero()
        const links = wrapper.findAll('a')

        expect(links).toHaveLength(1)
        expect(links[0]?.attributes('href')).toBe('/felgen/motec-mcr4-ultimate')
        // Named by content — the picture's alt and the caption — never by a label that leaves the visible text out.
        expect(links[0]?.attributes('aria-label')).toBeUndefined()
        expect(links[0]?.find('img').exists()).toBe(true)
        expect(links[0]?.text()).toContain('MOTEC MCR4 Ultimate · Light Grey D5')
        expect(links[0]?.text()).toContain(`ab 189,00${NNBSP}€ · pro Felge`)
        expect(wrapper.text()).not.toContain(SYMBOLIC)
    })

    it('names no brand, no price and no link for a symbolic product', () => {
        const wrapper = mountHero(product({ imageManifest: null, symbolic: true }))
        const text = wrapper.text()

        expect(wrapper.findAll('a')).toHaveLength(0)
        expect(wrapper.find('[href]').exists()).toBe(false)
        expect(wrapper.find('.hero__link').element.tagName).toBe('DIV')
        expect(wrapper.find('.hero__caption').exists()).toBe(false)
        for (const named of ['MOTEC', 'MCR4', 'Light Grey', 'pro Felge', '189,00', '756,00']) {
            expect(text).not.toContain(named)
        }

        expect(visibleText(wrapper.find('.hero__spec'))).toBe(FACTS.specLine)
        expect(wrapper.find('.hero__symbolic').text()).toBe(SYMBOLIC)
        expect(text).not.toContain(CAPTION)
    })

    it('shows the outline and names nothing without a hero product', () => {
        const wrapper = mountHero(null)

        expect(wrapper.find('.hero__outline svg.outline').exists()).toBe(true)
        expect(wrapper.findAll('.callout-anchor')).toHaveLength(0)
        expect(wrapper.findAll('a')).toHaveLength(0)
        expect(wrapper.find('.hero__notes').exists()).toBe(false)
    })
})

describe('HomeHero · a broken photograph', () => {
    function expectOutline(wrapper: VueWrapper): void {
        expect(wrapper.find('picture').exists()).toBe(false)
        expect(wrapper.find('.hero__outline svg.outline').exists()).toBe(true)
        // The leaders would point at nothing: they go, ring and shadow with them.
        expect(wrapper.findAll('.callout-anchor')).toHaveLength(0)
        expect(wrapper.find('circle.callout__ring').exists()).toBe(false)
        expect(wrapper.findAll('.hero-contact')).toHaveLength(0)
        // The values are data and stay in the spec line; the sentence about the picture goes with it.
        expect(visibleText(wrapper.find('.hero__spec'))).toBe(FACTS.specLine)
        expect(wrapper.text()).not.toContain(CAPTION)
        // The name belongs to the photograph (ACCURACY.md D1): under the outline, no brand, no
        // price, no link — and the line says the drawing is a symbol.
        expect(wrapper.find('[href]').exists()).toBe(false)
        expect(wrapper.find('.hero__caption').exists()).toBe(false)
        for (const named of ['MOTEC', 'MCR4', 'Light Grey', 'pro Felge', '53810']) {
            expect(wrapper.text()).not.toContain(named)
        }
        expect(wrapper.find('.hero__symbolic').text()).toBe(SYMBOLIC)
    }

    it('falls back to the outline and drops the leaders when the image fails', async () => {
        const wrapper = mountHero()

        await wrapper.find('.hero__frame img').trigger('error')
        expectOutline(wrapper)
    })

    it('falls back at once when the cached photograph was already broken at mount', async () => {
        imageState(true, 0)
        const wrapper = mountHero()
        await nextTick()

        expectOutline(wrapper)
    })

    it('keeps a cached photograph that did load', async () => {
        imageState(true, 1080)
        const wrapper = mountHero()
        await nextTick()

        expect(wrapper.find('.hero__frame img').exists()).toBe(true)
        expect(wrapper.findAll('.callout')).toHaveLength(3)
    })
})
