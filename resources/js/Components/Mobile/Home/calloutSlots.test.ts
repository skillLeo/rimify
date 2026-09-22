import { describe, expect, it } from 'vitest'
import type { ImageManifest, WheelAnchors } from '../../Ui/Picture.vue'
import type { HeroProduct } from '../../../types/pages'
import {
    DESKTOP_LAYOUT,
    frameStyle,
    HERO_SIZES_DESKTOP,
    HERO_SIZES_PHONE,
    heroScene,
    kbaValue,
    PHONE_LAYOUT,
    rollStyle,
    type Callout,
    type CalloutKey,
    type HeroLayout,
    type HeroScene,
} from './calloutSlots'

/*
 * The hero's geometry (docs/phase0/ACCURACY.md D10, §3.0, §4), pinned on the MOTEC MCR4 Ultimate's
 * own cut-out. The anchors are copied from
 * storage/app/public/demo/wheels/motec-mcr4-ultimate-light-grey/manifest.json (never read at test
 * time); the facts are what StartseiteController::heroFacts formats for the stamp's configuration,
 * 8,5J × 19 ET 45 5 × 112. Every expected position is computed here from the layout and the
 * normalised anchor, never taken from calloutSlots.ts itself.
 */

const NBSP = ' '

const CENTRE = { x: 0.4992, y: 0.4681 }
const WHEEL = { x: 0.5, y: 0.4708, r: 0.4086 }
const PCD = { x: 0.4992, y: 0.4681, r: 0.0854 }
const BORE = { x: 0.5, y: 0.4704, r: 0.0554 }
const KBA = { x: 0.5, y: 0.8469, w: 0.0696, h: 0.0142 }

/* The square frame's anchors; `bare` has the same framing and carries the same ones. */
const ANCHORS: WheelAnchors = { centre: CENTRE, wheel: WHEEL, pcd: PCD, bore: BORE, valve: { x: 0.4976, y: 0.8145 }, kba: KBA }

/* The 4:3 frame's own anchors: the hero never uses them. */
const WIDE_ANCHORS: WheelAnchors = {
    centre: { x: 0.4994, y: 0.4684 },
    wheel: { x: 0.5, y: 0.471, r: 0.2915 },
    pcd: { x: 0.4994, y: 0.4684, r: 0.0609 },
    bore: { x: 0.5, y: 0.4706, r: 0.0395 },
    valve: { x: 0.4983, y: 0.7977 },
    kba: { x: 0.5, y: 0.8285, w: 0.0497, h: 0.0135 },
}

const DIR = '/storage/demo/wheels/motec-mcr4-ultimate-light-grey'

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

/** The MOTEC's manifest; `anchors` replaces the square and the bare frame's anchors (null: none measured). */
function manifest(overrides: Partial<ImageManifest> = {}, anchors: WheelAnchors | null = ANCHORS): ImageManifest {
    return {
        ...frame('motec-mcr4-ultimate-light-grey', 1080, anchors),
        wide: frame('motec-mcr4-ultimate-light-grey-4x3', 810, WIDE_ANCHORS),
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

/* Another configuration's facts: every value differs, so a value typed into the code would show. */
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

const keys = (scene: HeroScene): CalloutKey[] => scene.callouts.map((c) => c.key)

function callout(scene: HeroScene, key: CalloutKey): Callout {
    const found = scene.callouts.find((c) => c.key === key)

    if (found === undefined) {
        throw new Error(`no ${key} callout`)
    }

    return found
}

const LAYOUTS: [string, HeroLayout][] = [
    ['desktop', DESKTOP_LAYOUT],
    ['phone', PHONE_LAYOUT],
]

interface Box {
    /** The frame is 100 units tall and this wide. */
    width: number
    left: number
    top: number
    side: number
}

/**
 * The square picture where frameStyle() tells the stylesheet to put it, in a frame 100 units tall:
 * `left` and the picture's width are percentages of the frame's width, `top` of its height.
 */
function pictureBox(layout: HeroLayout): Box {
    const style = frameStyle(layout)
    const width = layout.ratio * 100

    return {
        width,
        left: (parseFloat(style['--pic-left'] ?? '') / 100) * width,
        top: parseFloat(style['--pic-top'] ?? ''),
        side: (parseFloat(style['--pic-size'] ?? '') / 100) * width,
    }
}

/** A point in percent of the frame's width and height, as a point of the picture (fractions of its side). */
function onPicture(layout: HeroLayout, point: { tx: number; ty: number }): { x: number; y: number } {
    const box = pictureBox(layout)

    return { x: ((point.tx / 100) * box.width - box.left) / box.side, y: (point.ty - box.top) / box.side }
}

/*
 * The preload's `imagesizes`, read from the template itself, the way styles.test.ts and
 * claims.test.ts read their sources (a raw import resolved by Vite, no runtime path).
 */
const BLADE = Object.values(import.meta.glob<string>('../../../../views/app.blade.php', { query: '?raw', import: 'default', eager: true }))[0] ?? ''

describe('heroScene · the picture', () => {
    it('is the shadowless bare frame when there is one, on one CSS contact shadow at the bottom of the rim', () => {
        const m = manifest()
        const scene = heroScene(product({ imageManifest: m }), DESKTOP_LAYOUT)

        expect(scene.picture).toBe(m.bare)
        expect(scene.shadow).not.toBeNull()
        // Centred under the wheel, where the rim meets the floor, never wider than the wheel.
        expect(scene.shadow?.x).toBeCloseTo(WHEEL.x * 100, 1)
        expect(scene.shadow?.y).toBeCloseTo((WHEEL.y + WHEEL.r) * 100, 1)
        expect(scene.shadow?.w).toBeGreaterThan(0)
        expect(scene.shadow?.w).toBeLessThanOrEqual(WHEEL.r * 2 * 100)
    })

    it('is the square frame, without a CSS shadow (it has its own baked in), when bare is missing', () => {
        const m = manifest({ bare: undefined })
        const scene = heroScene(product({ imageManifest: m }), DESKTOP_LAYOUT)

        expect(scene.picture).toBe(m)
        expect(scene.shadow).toBeNull()
        expect(rollStyle(scene)).not.toHaveProperty('--contact-x')
        // The square frame carries the same anchors, so the leaders stay.
        expect(keys(scene)).toEqual(['boltCircle', 'centreBore', 'kba'])
    })

    it('is no picture at all without a photograph: the outline, no leaders, no shadow, no roll', () => {
        for (const m of [null, undefined]) {
            const scene = heroScene(product({ imageManifest: m, symbolic: true }), DESKTOP_LAYOUT)

            expect(scene.picture).toBeNull()
            expect(scene.callouts).toEqual([])
            expect(scene.shadow).toBeNull()
            expect(scene.roll).toBeNull()
            expect(rollStyle(scene)).toEqual({})
        }

        expect(heroScene(null, PHONE_LAYOUT)).toMatchObject({ picture: null, callouts: [], shadow: null, roll: null })
    })

    it('points at nothing, and does not roll, when the photograph carries no anchors', () => {
        const scene = heroScene(product({ imageManifest: manifest({}, null) }), DESKTOP_LAYOUT)

        expect(scene.picture).not.toBeNull()
        expect(scene.callouts).toEqual([])
        expect(scene.roll).toBeNull()
    })
})

describe('heroScene · the callouts', () => {
    it('points, on the desktop, only at what a front view shows: the Lochkreis, the cap over the bore and the stamp', () => {
        const scene = heroScene(product(), DESKTOP_LAYOUT)

        expect(scene.callouts.map((c) => [c.key, c.label, c.value, c.note])).toEqual([
            ['boltCircle', 'Lochkreis', FACTS.boltPattern, undefined],
            ['centreBore', 'Mittenlochbohrung', FACTS.centreBore, 'hinter der Nabenkappe'],
            ['kba', 'KBA-Nummer', '53810 (ABE)', undefined],
        ])

        // Width, diameter and ET are in the spec line, never at a leader.
        const values = scene.callouts.map((c) => c.value)
        expect(values).not.toContain(FACTS.width)
        expect(values).not.toContain(FACTS.diameter)
        expect(values).not.toContain(FACTS.et)
    })

    it('points, on the phone, at two things: the Lochkreis and the stamp', () => {
        const scene = heroScene(product(), PHONE_LAYOUT)

        expect(scene.callouts.map((c) => [c.key, c.label, c.value])).toEqual([
            ['boltCircle', 'Lochkreis', FACTS.boltPattern],
            ['kba', 'KBA-Nummer', '53810 (ABE)'],
        ])
    })

    it.each(LAYOUTS)('takes every value from facts, none typed in (%s)', (_name, layout) => {
        const scene = heroScene(product({ facts: OTHER, imageManifest: manifest({ stamp: '53811' }) }), layout)
        const values = scene.callouts.map((c) => c.value)

        expect(callout(scene, 'boltCircle').value).toBe(OTHER.boltPattern)
        expect(callout(scene, 'kba').value).toBe('53811 (ABE)')
        expect(values.join(' ')).not.toContain('112')
        expect(values.join(' ')).not.toContain('53810')

        if (layout === DESKTOP_LAYOUT) {
            expect(callout(scene, 'centreBore').value).toBe(OTHER.centreBore)
        }
    })

    const MISSING: ['pcd' | 'bore' | 'kba', CalloutKey][] = [
        ['pcd', 'boltCircle'],
        ['bore', 'centreBore'],
        ['kba', 'kba'],
    ]

    it.each(MISSING)('draws no callout whose anchor is missing: no %s, no %s', (anchor, key) => {
        const scene = heroScene(product({ imageManifest: manifest({}, withoutAnchor(anchor)) }), DESKTOP_LAYOUT)

        expect(keys(scene)).not.toContain(key)
        expect(keys(scene)).toHaveLength(2)
    })

    it('names the KBA number only when facts.kba is the number stamped on the photographed wheel', () => {
        expect(keys(heroScene(product({ facts: { ...FACTS, kba: null } }), DESKTOP_LAYOUT))).toEqual(['boltCircle', 'centreBore'])
        expect(keys(heroScene(product({ facts: { ...FACTS, kba: null } }), PHONE_LAYOUT))).toEqual(['boltCircle'])

        // A stamp that is another configuration's number, or none read, is never put next to this one.
        expect(keys(heroScene(product({ imageManifest: manifest({ stamp: '53811' }) }), DESKTOP_LAYOUT))).not.toContain('kba')
        expect(keys(heroScene(product({ imageManifest: manifest({ stamp: undefined }) }), DESKTOP_LAYOUT))).not.toContain('kba')
    })

    it('writes a five-digit KBA number as the mark of an ABE', () => {
        expect(kbaValue('53810')).toBe('53810 (ABE)')
    })
})

describe.each(LAYOUTS)('heroScene · the leaders on the %s frame', (_name, layout) => {
    const scene = heroScene(product(), layout)

    it('ends the Lochkreis leader on the circle through the bolt-hole centres', () => {
        const end = onPicture(layout, callout(scene, 'boltCircle'))

        expect(Math.hypot(end.x - PCD.x, end.y - PCD.y)).toBeCloseTo(PCD.r, 3)
    })

    it('draws the Lochkreis ring on that circle: its centre the anchor\'s, its radius anchors.pcd.r', () => {
        const ring = callout(scene, 'boltCircle').ring

        expect(ring).toBeDefined()

        const centre = onPicture(layout, { tx: ring?.cx ?? NaN, ty: ring?.cy ?? NaN })
        expect(centre.x).toBeCloseTo(PCD.x, 3)
        expect(centre.y).toBeCloseTo(PCD.y, 3)
        // The radius is in percent of the frame's height, which is the unit of the box.
        expect((ring?.r ?? NaN) / pictureBox(layout).side).toBeCloseTo(PCD.r, 3)
    })

    it('ends the KBA leader on the stamp', () => {
        const end = onPicture(layout, callout(scene, 'kba'))

        expect(Math.abs(end.x - KBA.x)).toBeLessThanOrEqual(KBA.w / 2 + 0.0005)
        expect(Math.abs(end.y - KBA.y)).toBeLessThanOrEqual(KBA.h / 2 + 0.0005)
    })

    it('starts every box inside the frame', () => {
        for (const c of scene.callouts) {
            expect(c.x).toBeGreaterThanOrEqual(0)
            expect(c.y).toBeGreaterThanOrEqual(0)
            expect(c.y).toBeLessThanOrEqual(100)
        }
    })
})

describe('heroScene · the Mittenlochbohrung leader', () => {
    it('ends on the cap that covers the bore', () => {
        const end = onPicture(DESKTOP_LAYOUT, callout(heroScene(product(), DESKTOP_LAYOUT), 'centreBore'))

        expect(Math.hypot(end.x - BORE.x, end.y - BORE.y)).toBeLessThanOrEqual(BORE.r + 0.0005)
    })
})

describe('frameStyle', () => {
    it.each(LAYOUTS)('hands the stylesheet the %s frame\'s ratio and the square picture\'s place', (_name, layout) => {
        const style = frameStyle(layout)
        const box = pictureBox(layout)

        expect(parseFloat(style['--frame-ratio'] ?? '')).toBeCloseTo(layout.ratio, 4)
        // Square, `size` of the frame's height ...
        expect(box.side).toBeCloseTo(layout.picture.size * 100, 1)
        // ... with its corner where the layout puts it ...
        expect(box.left).toBeCloseTo(layout.picture.left * box.width, 1)
        expect(box.top).toBeCloseTo(layout.picture.top * 100, 1)
        // ... and all of it inside the frame.
        expect(box.left).toBeGreaterThanOrEqual(0)
        expect(box.left + box.side).toBeLessThanOrEqual(box.width + 0.01)
        expect(box.top + box.side).toBeLessThanOrEqual(100.01)
    })
})

describe('rollStyle', () => {
    const ROLLS: [string, HeroLayout, string][] = [
        ['desktop', DESKTOP_LAYOUT, '160%'],
        ['phone', PHONE_LAYOUT, '115%'],
    ]

    /*
     * The keyframes lead from translateX(--roll-distance) rotate(--roll-angle) into the resting
     * frame. A positive distance starts the wheel to the right; a positive angle (clockwise in CSS)
     * unwinding to 0 while it moves left is the counter-clockwise turn of a wheel rolling left.
     */
    it.each(ROLLS)('rolls the %s wheel in from the right, turning counter-clockwise by the distance over its radius', (_name, layout, distance) => {
        const style = rollStyle(heroScene(product(), layout))
        const travelled = parseFloat(style['--roll-distance'] ?? '') / 100
        const angle = parseFloat(style['--roll-angle'] ?? '')

        expect(style['--roll-distance']).toBe(distance)
        expect(style['--roll-angle']).toMatch(/^-?\d+(\.\d+)?deg$/)
        expect(travelled).toBeGreaterThan(0)
        expect(Math.sign(angle)).toBe(Math.sign(travelled))
        // Without slipping: angle = distance / radius, both in widths of the picture, in degrees.
        expect(angle).toBeCloseTo(((travelled / WHEEL.r) * 180) / Math.PI, 1)
    })

    it('turns about the wheel\'s own axle, the centre anchor', () => {
        const origin = rollStyle(heroScene(product(), DESKTOP_LAYOUT))['--roll-origin'] ?? ''
        const [x, y] = origin.split(' ').map((v) => parseFloat(v))

        expect(origin).toMatch(/^[\d.]+% [\d.]+%$/)
        expect(x).toBeCloseTo(CENTRE.x * 100, 2)
        expect(y).toBeCloseTo(CENTRE.y * 100, 2)
    })

    it('takes the radius from anchors.wheel', () => {
        const smaller: WheelAnchors = { ...ANCHORS, wheel: { ...WHEEL, r: 0.3 } }
        const style = rollStyle(heroScene(product({ imageManifest: manifest({}, smaller) }), DESKTOP_LAYOUT))
        const travelled = parseFloat(style['--roll-distance'] ?? '') / 100

        expect(parseFloat(style['--roll-angle'] ?? '')).toBeCloseTo(((travelled / 0.3) * 180) / Math.PI, 1)
    })

    it('does not roll at all without the wheel anchor: no radius, no physically correct turn', () => {
        const style = rollStyle(heroScene(product({ imageManifest: manifest({}, withoutAnchor('wheel')) }), DESKTOP_LAYOUT))

        expect(style).not.toHaveProperty('--roll-distance')
        expect(style).not.toHaveProperty('--roll-angle')
    })

    it('places the one contact shadow under the bare frame, and nothing without a picture', () => {
        const style = rollStyle(heroScene(product(), DESKTOP_LAYOUT))

        expect(parseFloat(style['--contact-x'] ?? '')).toBeCloseTo(WHEEL.x * 100, 1)
        expect(parseFloat(style['--contact-y'] ?? '')).toBeCloseTo((WHEEL.y + WHEEL.r) * 100, 1)
        expect(parseFloat(style['--contact-w'] ?? '')).toBeGreaterThan(0)
        expect(rollStyle(heroScene(null, DESKTOP_LAYOUT))).toEqual({})
    })
})

describe('the hero preload in app.blade.php', () => {
    it('preloads the hero picture as an image', () => {
        expect(BLADE).toContain('rel="preload" as="image"')
        expect(BLADE).toMatch(/imagesizes="\{\{\s*\$heroSizes\s*\}\}"/)
    })

    it('asks for it at exactly the sizes each document gives the picture', () => {
        const match = BLADE.match(/\$heroSizes\s*=\s*\(\$page\['component'\]\s*\?\?\s*''\)\s*===\s*'Startseite\/Mobile'\s*\?\s*'([^']*)'\s*:\s*'([^']*)'/)

        expect(match).not.toBeNull()
        expect(match?.[1]).toBe(HERO_SIZES_PHONE)
        expect(match?.[2]).toBe(HERO_SIZES_DESKTOP)
    })
})
