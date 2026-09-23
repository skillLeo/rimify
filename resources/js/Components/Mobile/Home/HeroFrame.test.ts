import { mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { NNBSP } from '../../../format'
import { HERO_SIZES_PHONE } from './calloutSlots'
import type { ImageManifest, WheelAnchors } from '../../Ui/Picture.vue'
import type { HeroProduct } from '../../../types/pages'

/*
 * The hero on a phone (docs/phase0/ACCURACY.md D10, §3.0, §4): the same `bare` cut-out and anchors
 * as the desktop stage, two leaders (Lochkreis and KBA), the values from the server's `facts`, a
 * physically correct roll-in and a final frame that needs no script. The fixture's anchors are
 * copied from the MOTEC's manifest.json; positions are checked in the frame's own units.
 */

const current: { props: Record<string, unknown> } = { props: {} }

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    Link: defineComponent({
        inheritAttrs: false,
        props: { href: { type: String, required: true } },
        setup(props, { slots, attrs }) {
            return () => h('a', { ...attrs, href: props.href }, slots.default?.())
        },
    }),
}))

const { default: HeroFrame } = await import('./HeroFrame.vue')

class FakeResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
}

const NBSP = ' '
const CAPTION = 'Abbildung zeigt das Design; Werte der gezeigten Ausführung.'
const DEMO = 'Demodaten – Beispielsortiment; Preise und Bestände sind Beispielwerte.'
const SYMBOLIC = 'Symbolbild – Werte einer Beispielkonfiguration'

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

let wrappers: VueWrapper[] = []

function mountFrame(p: HeroProduct = product()): VueWrapper {
    const wrapper = mount(HeroFrame, { props: { product: p }, attachTo: document.body })
    wrappers.push(wrapper)

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
    Object.defineProperties(event, { pointerType: { value: 'touch' }, clientX: { value: clientX }, clientY: { value: 200 } })

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

/** The frame in the leaders' own units, and the square picture where the frame's style puts it. */
function pictureBox(frameEl: DOMWrapper<Element>, callout: DOMWrapper<Element>): Box {
    const width = Number((callout.find('svg.callout__line').attributes('viewBox') ?? '').split(/\s+/)[2])

    return {
        width,
        // `left` and the picture's width are percentages of the frame's width, `top` of its height.
        left: (parseFloat(cssVar(frameEl, '--pic-left')) / 100) * width,
        top: parseFloat(cssVar(frameEl, '--pic-top')),
        side: (parseFloat(cssVar(frameEl, '--pic-size')) / 100) * width,
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
    current.props = { demo: false }
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    imageState(false, 0)
})

afterEach(() => {
    wrappers.forEach((w) => w.unmount())
    wrappers = []
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
})

describe('HeroFrame · the picture', () => {
    it('is the shadowless bare frame, eager at the preloaded phone sizes, on exactly one CSS contact shadow', () => {
        const wrapper = mountFrame()
        const img = wrapper.find('.hero-frame img')

        expect(wrapper.findAll('.hero-frame img')).toHaveLength(1)
        expect(img.attributes('src')).toBe(`${BARE_BASE}-1080.png`)
        expect(wrapper.find('.hero-frame source[type="image/avif"]').attributes('srcset')).toBe(
            `${BARE_BASE}-480.avif 480w, ${BARE_BASE}-768.avif 768w, ${BARE_BASE}-1080.avif 1080w`
        )
        expect(img.attributes('sizes')).toBe(HERO_SIZES_PHONE)
        expect(img.attributes('loading')).toBe('eager')
        expect(img.attributes('fetchpriority')).toBe('high')
        expect(img.attributes('alt')).toBe('MOTEC MCR4 Ultimate in Light Grey D5, Ansicht von vorn')

        const shadows = wrapper.findAll('.hero-contact')
        expect(shadows).toHaveLength(1)
        expect(shadows[0]?.attributes('aria-hidden')).toBe('true')
        expect(cssVar(wrapper.find('.hero-frame__roll'), '--contact-w')).not.toBe('')
    })

    it('is the square frame, without a CSS shadow, when there is no bare frame', () => {
        const wrapper = mountFrame(product({ imageManifest: manifest({ bare: undefined }) }))

        expect(wrapper.find('.hero-frame img').attributes('src')).toBe(`${SQUARE_BASE}-1080.png`)
        expect(wrapper.findAll('.hero-contact')).toHaveLength(0)
        expect(wrapper.find('.hero-frame__roll').attributes('style') ?? '').not.toContain('--contact')
        expect(wrapper.findAll('.callout')).toHaveLength(2)
    })

    it('draws the outline, prints the spec line and points at nothing without a photograph', () => {
        const wrapper = mountFrame(product({ imageManifest: null, symbolic: true }))

        expect(wrapper.find('img').exists()).toBe(false)
        expect(wrapper.find('.hero-frame__outline svg.outline').exists()).toBe(true)
        expect(wrapper.findAll('.callout-anchor')).toHaveLength(0)
        expect(wrapper.findAll('.hero-contact')).toHaveLength(0)
        expect(visibleText(wrapper.find('.hero-mobile__spec'))).toBe(FACTS.specLine)
    })
})

describe('HeroFrame · the callouts', () => {
    it('points at two things only: the Lochkreis and the KBA stamp', () => {
        const wrapper = mountFrame()
        const rows = wrapper.findAll('[data-callout]').map((c) => [
            c.attributes('data-callout'),
            c.find('.callout__label').text(),
            c.find('.callout__value').text(),
        ])

        expect(rows).toEqual([
            ['boltCircle', 'Lochkreis', FACTS.boltPattern],
            ['kba', 'KBA-Nummer', '53810 (ABE)'],
        ])
        expect(wrapper.find('.callout__note').exists()).toBe(false)
        expect(wrapper.text()).not.toContain('Mittenlochbohrung')
    })

    it('draws the Lochkreis as one ring through the bolt-hole centres, its radius from anchors.pcd', () => {
        const wrapper = mountFrame()
        const lochkreis = wrapper.find('[data-callout="boltCircle"]')
        const ring = lochkreis.find('circle.callout__ring')
        const box = pictureBox(wrapper.find('.hero-frame'), lochkreis)

        expect(wrapper.findAll('circle.callout__ring')).toHaveLength(1)
        expect(ring.exists()).toBe(true)

        const centre = toPicture(box, Number(ring.attributes('cx')), Number(ring.attributes('cy')))
        expect(centre.x).toBeCloseTo(PCD.x, 3)
        expect(centre.y).toBeCloseTo(PCD.y, 3)
        expect(Number(ring.attributes('r')) / box.side).toBeCloseTo(PCD.r, 3)
    })

    it('ends both leaders on their anchors, in the frame\'s own coordinates', () => {
        const wrapper = mountFrame()
        const frameEl = wrapper.find('.hero-frame')

        const at = (key: string): { x: number; y: number } => {
            const callout = wrapper.find(`[data-callout="${key}"]`)
            const box = pictureBox(frameEl, callout)
            const end = leaderEnd(callout)

            // The drawing has the frame's ratio, so nothing in it is stretched.
            expect(box.width).toBeCloseTo(parseFloat(cssVar(frameEl, '--frame-ratio')) * 100, 1)

            return toPicture(box, end.x, end.y)
        }

        const lochkreis = at('boltCircle')
        expect(Math.hypot(lochkreis.x - PCD.x, lochkreis.y - PCD.y)).toBeCloseTo(PCD.r, 3)

        const stamp = at('kba')
        expect(Math.abs(stamp.x - KBA.x)).toBeLessThanOrEqual(KBA.w / 2 + 0.0005)
        expect(Math.abs(stamp.y - KBA.y)).toBeLessThanOrEqual(KBA.h / 2 + 0.0005)
    })

    it('names the KBA number only when facts.kba is set', () => {
        const wrapper = mountFrame(product({ facts: { ...FACTS, kba: null } }))

        expect(calloutKeys(wrapper)).toEqual(['boltCircle'])
        expect(wrapper.text()).not.toContain('53810')
        expect(wrapper.text()).not.toContain('KBA')
    })

    it('takes every value from facts, none typed in', () => {
        const wrapper = mountFrame(product({ facts: OTHER, imageManifest: manifest({ stamp: '53811' }) }))

        expect(wrapper.findAll('.callout__value').map((v) => v.text())).toEqual([OTHER.boltPattern, '53811 (ABE)'])
        expect(visibleText(wrapper.find('.hero-mobile__spec'))).toBe(OTHER.specLine)

        const text = wrapper.text()
        for (const stale of ['112', '66,6', '53810', '620']) {
            expect(text).not.toContain(stale)
        }
    })

    it('draws no callout whose anchor is missing', () => {
        const noCircle = mountFrame(product({ imageManifest: manifest({}, withoutAnchor('pcd')) }))
        expect(calloutKeys(noCircle)).toEqual(['kba'])
        expect(noCircle.find('circle.callout__ring').exists()).toBe(false)

        expect(calloutKeys(mountFrame(product({ imageManifest: manifest({}, withoutAnchor('kba')) })))).toEqual(['boltCircle'])
        expect(calloutKeys(mountFrame(product({ imageManifest: manifest({}, null) })))).toEqual([])
    })
})

describe('HeroFrame · motion', () => {
    it('rolls the wheel in once from the right, turning by distance / radius about its own axle, and draws the leaders after it', () => {
        const wrapper = mountFrame()
        const roll = wrapper.find('.hero-frame__roll')
        const distance = parseFloat(cssVar(roll, '--roll-distance')) / 100
        const angle = parseFloat(cssVar(roll, '--roll-angle'))
        const [originX, originY] = cssVar(roll, '--roll-origin').split(/\s+/).map((v) => parseFloat(v))

        expect(roll.classes()).toContain('hero-frame__roll--rolling')
        expect(cssVar(roll, '--roll-distance')).toBe('115%')
        expect(cssVar(roll, '--roll-angle')).toMatch(/deg$/)
        // From the right (positive travel), clockwise at the start and unwinding to 0: counter-clockwise, without slipping.
        expect(distance).toBeGreaterThan(0)
        expect(angle).toBeGreaterThan(0)
        expect(angle).toBeCloseTo(((distance / WHEEL.r) * 180) / Math.PI, 1)
        expect(originX).toBeCloseTo(CENTRE.x * 100, 2)
        expect(originY).toBeCloseTo(CENTRE.y * 100, 2)
        expect(roll.find('.hero-frame__spin img').exists()).toBe(true)
        expect(cssVar(wrapper.find('.hero-frame'), '--callout-delay')).toBe('var(--d-roll)')
    })

    it('shows its final frame from the start: the picture, both leaders and every line, nothing hidden', () => {
        const wrapper = mountFrame()

        expect(wrapper.find('.hero-frame__roll img').exists()).toBe(true)
        expect(wrapper.findAll('.callout')).toHaveLength(2)
        expect(visibleText(wrapper.find('.hero-mobile__spec'))).toBe(FACTS.specLine)
        expect(wrapper.find('.hero-mobile__shown').text()).toBe(CAPTION)
        expect(hiddenIn(wrapper.element)).toEqual([])
    })

    it('stands still without the roll class, everything shown and the leaders drawn at once, when there is nothing to roll', () => {
        const wrapper = mountFrame(product({ imageManifest: manifest({}, withoutAnchor('wheel')) }))

        expect(wrapper.find('.hero-frame__roll').classes()).not.toContain('hero-frame__roll--rolling')
        expect(cssVar(wrapper.find('.hero-frame'), '--callout-delay')).toBe('0ms')
        expect(wrapper.findAll('.callout')).toHaveLength(2)
        expect(hiddenIn(wrapper.element)).toEqual([])
    })

    it('has no cursor or touch roll: moving a pointer over the frame changes nothing', async () => {
        const wrapper = mountFrame()
        const before = wrapper.html()
        const targets: EventTarget[] = [wrapper.find('.hero-frame').element, wrapper.find('.hero-frame__roll').element, wrapper.find('.hero-frame img').element, window]

        for (const target of targets) {
            for (const [type, x] of [['pointerdown', 10], ['pointermove', 0], ['pointermove', 390], ['touchmove', 200], ['pointerleave', 0]] as [string, number][]) {
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
        const reduced = mountFrame()
        media(false)
        const moving = mountFrame()

        expect(reduced.html()).toBe(moving.html())
        expect(reduced.find('.hero-frame__roll img').exists()).toBe(true)
        expect(reduced.findAll('.callout')).toHaveLength(2)
        expect(hiddenIn(reduced.element)).toEqual([])
        expect(inlineTransforms(reduced.element)).toEqual([])
    })
})

describe('HeroFrame · the lines under the frame', () => {
    it('prints the spec line, the caption that links to the product, and what the picture shows', () => {
        const wrapper = mountFrame()
        const frameLink = wrapper.find('.hero-frame')
        const caption = wrapper.find('a.hero-mobile__caption')

        expect(visibleText(wrapper.find('.hero-mobile__spec'))).toBe(FACTS.specLine)
        expect(frameLink.element.tagName).toBe('A')
        expect(frameLink.attributes('href')).toBe('/felgen/motec-mcr4-ultimate')
        // Named by its content — the picture's alt — never by a label that leaves the visible text out.
        expect(frameLink.attributes('aria-label')).toBeUndefined()
        expect(caption.attributes('href')).toBe('/felgen/motec-mcr4-ultimate')
        expect(caption.text()).toContain('MOTEC MCR4 Ultimate · Light Grey D5')
        expect(caption.text()).toContain(`ab 189,00${NNBSP}€ · pro Felge`)
        expect(wrapper.find('.hero-mobile__shown').text()).toBe(CAPTION)
        expect(wrapper.find('.hero-mobile__symbolic').exists()).toBe(false)
        expect(wrapper.text()).not.toContain('Demodaten')
    })

    it('reads the stamp number with the spec line, because the callouts are drawing', () => {
        const wrapper = mountFrame()

        expect(wrapper.find('.callout-anchor').attributes('aria-hidden')).toBe('true')
        expect(wrapper.find('.hero-mobile__spec .visually-hidden').text()).toBe('· KBA-Nummer 53810 (ABE)')
    })

    it('adds the Demodaten line, once, when page.props.demo', () => {
        current.props.demo = true
        const wrapper = mountFrame()

        expect(wrapper.findAll('.demo-note')).toHaveLength(1)
        expect(wrapper.find('.demo-note').text()).toBe(DEMO)
    })

    it('names no brand, no price and no link for a symbolic product', () => {
        const wrapper = mountFrame(product({ imageManifest: null, symbolic: true }))
        const text = wrapper.text()

        expect(wrapper.findAll('a')).toHaveLength(0)
        expect(wrapper.find('[href]').exists()).toBe(false)
        expect(wrapper.find('.hero-frame').element.tagName).toBe('DIV')
        expect(wrapper.find('.hero-frame').attributes('aria-label')).toBeUndefined()
        for (const named of ['MOTEC', 'MCR4', 'Light Grey', 'pro Felge', '189,00', '756,00']) {
            expect(text).not.toContain(named)
        }

        expect(visibleText(wrapper.find('.hero-mobile__spec'))).toBe(FACTS.specLine)
        expect(wrapper.find('.hero-mobile__symbolic').text()).toBe(SYMBOLIC)
        expect(text).not.toContain(CAPTION)
    })
})

describe('HeroFrame · a broken photograph', () => {
    function expectOutline(wrapper: VueWrapper): void {
        expect(wrapper.find('img').exists()).toBe(false)
        expect(wrapper.find('.hero-frame__outline svg.outline').exists()).toBe(true)
        // The leaders would point at nothing: they go, ring and shadow with them.
        expect(wrapper.findAll('.callout-anchor')).toHaveLength(0)
        expect(wrapper.find('circle.callout__ring').exists()).toBe(false)
        expect(wrapper.findAll('.hero-contact')).toHaveLength(0)
        // The values are data and stay in the spec line; the sentence about the picture goes with it.
        expect(visibleText(wrapper.find('.hero-mobile__spec'))).toBe(FACTS.specLine)
        expect(wrapper.text()).not.toContain(CAPTION)
        // The name belongs to the photograph (ACCURACY.md D1): under the outline, no brand, no
        // price, no link — and the line says the drawing is a symbol.
        expect(wrapper.find('[href]').exists()).toBe(false)
        expect(wrapper.find('.hero-frame').element.tagName).toBe('DIV')
        for (const named of ['MOTEC', 'MCR4', 'Light Grey', 'pro Felge', '53810']) {
            expect(wrapper.text()).not.toContain(named)
        }
        expect(wrapper.find('.hero-mobile__symbolic').text()).toBe(SYMBOLIC)
    }

    it('falls back to the outline and drops the leaders when the image fails', async () => {
        const wrapper = mountFrame()

        await wrapper.find('.hero-frame img').trigger('error')
        expectOutline(wrapper)
    })

    it('falls back at once when the cached photograph was already broken at mount', async () => {
        imageState(true, 0)
        const wrapper = mountFrame()
        await nextTick()

        expectOutline(wrapper)
    })

    it('keeps a cached photograph that did load', async () => {
        imageState(true, 1080)
        const wrapper = mountFrame()
        await nextTick()

        expect(wrapper.find('.hero-frame img').exists()).toBe(true)
        expect(wrapper.findAll('.callout')).toHaveLength(2)
    })
})
