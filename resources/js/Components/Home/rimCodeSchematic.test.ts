import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import type { SchematicKey } from './rimCode'
import RimCodeSchematic from './RimCodeSchematic.vue'
import {
    BOLT_AXIS,
    CENTRE_PLANE,
    DIMENSION_ORDER,
    DIMENSIONS,
    PARTS,
    PROFILE,
    SCHEMATIC,
    WHEEL_AXIS,
    type SchematicLabel,
    type SchematicPart,
} from './rimCodeSchematic'

/*
 * The cross-section of *Was die Zahlen auf einer Felge bedeuten* (ACCURACY.md §5). The drawing is one
 * scale: its labels are SVG text in user units (`--fs-small` is 14 px where one user unit is one
 * pixel, at the drawing's own width of 360), so the words grow and shrink with the lines. Every box
 * computed here is therefore the same box at every width, and a clearance proved here holds at every
 * width. Nothing below reads a position out of the module twice: the label boxes come from the text
 * and its anchor, and the leaders are checked against the feature they name, never against
 * themselves.
 */

const S = SCHEMATIC

/** A generous average advance for the German labels: it over-estimates a box, never under-estimates it. */
const FONT = 14
const ADVANCE = 0.54 * FONT
const ASCENT = 0.75 * FONT
const DESCENT = 0.22 * FONT

interface Box {
    left: number
    right: number
    top: number
    bottom: number
}

interface Point {
    x: number
    y: number
}

interface Segment {
    x1: number
    y1: number
    x2: number
    y2: number
}

/** The ink a label covers, from the ascender to the descender. */
function boxOf(label: SchematicLabel): Box {
    const width = label.text.length * ADVANCE
    const left = label.anchor === 'start' ? label.x : label.anchor === 'end' ? label.x - width : label.x - width / 2
    const flat: Box = { left, right: left + width, top: label.y - ASCENT, bottom: label.y + DESCENT }

    if (label.rotate === undefined) {
        return flat
    }

    if (label.rotate !== -90) {
        throw new Error(`no box for a label turned by ${label.rotate}°`)
    }

    // rotate(-90) about the label's own point maps (dx, dy) to (dy, −dx): the words read upward and
    // the ascenders point towards the left edge of the sheet.
    return {
        left: label.x - ASCENT,
        right: label.x + DESCENT,
        top: label.y - (flat.right - label.x),
        bottom: label.y + (label.x - flat.left),
    }
}

/** The commands of a path, in order. */
function commands(d: string): { letter: string; values: number[] }[] {
    return [...d.matchAll(/([MLQZ])([^MLQZ]*)/g)].map((match) => ({
        letter: match[1] ?? '',
        values: (match[2] ?? '')
            .trim()
            .split(/[\s,]+/)
            .filter((value) => value !== '')
            .map(Number),
    }))
}

/** Walks a path: its straight segments, and the point each quadratic reaches at its middle. */
function walk(d: string): { lines: Segment[]; peaks: Point[] } {
    const lines: Segment[] = []
    const peaks: Point[] = []
    let at: Point = { x: 0, y: 0 }
    let opened: Point = at

    for (const { letter, values } of commands(d)) {
        const a = values[0] ?? 0
        const b = values[1] ?? 0

        if (letter === 'M') {
            at = { x: a, y: b }
            opened = at
        } else if (letter === 'L') {
            lines.push({ x1: at.x, y1: at.y, x2: a, y2: b })
            at = { x: a, y: b }
        } else if (letter === 'Q') {
            const to: Point = { x: values[2] ?? 0, y: values[3] ?? 0 }
            // A quadratic at t = ½ is (P0 + 2·C + P2) / 4.
            peaks.push({ x: (at.x + 2 * a + to.x) / 4, y: (at.y + 2 * b + to.y) / 4 })
            at = to
        } else if (letter === 'Z') {
            lines.push({ x1: at.x, y1: at.y, x2: opened.x, y2: opened.y })
            at = opened
        }
    }

    return { lines, peaks }
}

const linesOf = (d: string): Segment[] => walk(d).lines

function overlap(a: Box, b: Box): boolean {
    return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
}

/** True when a line runs through a label's ink: the boxes meet and the box straddles the line. */
function crosses(line: Segment, box: Box): boolean {
    if (Math.max(line.x1, line.x2) <= box.left || Math.min(line.x1, line.x2) >= box.right) {
        return false
    }

    if (Math.max(line.y1, line.y2) <= box.top || Math.min(line.y1, line.y2) >= box.bottom) {
        return false
    }

    const side = (x: number, y: number): number => Math.sign((line.x2 - line.x1) * (y - line.y1) - (line.y2 - line.y1) * (x - line.x1))
    const corners = [side(box.left, box.top), side(box.right, box.top), side(box.right, box.bottom), side(box.left, box.bottom)]

    return corners.some((s) => s >= 0) && corners.some((s) => s <= 0)
}

function part(id: string): SchematicPart {
    const found = PARTS.find((p) => p.id === id)

    if (found === undefined) {
        throw new Error(`no part ${id}`)
    }

    return found
}

/** A part's leader, which is always one straight line. */
function leaderOf(id: string): Segment {
    const lines = linesOf(part(id).leader ?? '')
    const only = lines[0]

    if (lines.length !== 1 || only === undefined) {
        throw new Error(`${id} has no single straight leader`)
    }

    return only
}

const named = (label: SchematicLabel): string => `${label.text} (${label.x}, ${label.y})`

const LABELS: SchematicLabel[] = [...DIMENSION_ORDER.map((key) => DIMENSIONS[key].label), ...PARTS.map((p) => p.label)]

/*
 * Every line the drawing strokes apart from the hatched outline: the five dimensions with their
 * extension lines, ticks and reference faces, the part leaders, the two axes, the centre plane and
 * the reference faces the template draws itself (RimCodeSchematic.vue).
 */
const LINES: { what: string; line: Segment }[] = [
    ...DIMENSION_ORDER.flatMap((key) =>
        [DIMENSIONS[key].ext, DIMENSIONS[key].line, DIMENSIONS[key].ticks, DIMENSIONS[key].faces].flatMap((d) =>
            linesOf(d).map((line) => ({ what: `dimension ${key}`, line }))
        )
    ),
    ...PARTS.flatMap((p) => linesOf(p.leader ?? '').map((line) => ({ what: `leader ${p.id}`, line }))),
    ...linesOf(WHEEL_AXIS).map((line) => ({ what: 'wheel axis', line })),
    ...linesOf(BOLT_AXIS).map((line) => ({ what: 'bolt axis', line })),
    { what: 'centre plane', line: { x1: CENTRE_PLANE.x, y1: CENTRE_PLANE.y1, x2: CENTRE_PLANE.x, y2: CENTRE_PLANE.y2 } },
    { what: 'flange face, inside', line: { x1: S.xFlangeIn, y1: 54, x2: S.xFlangeIn, y2: S.yBeadSeat } },
    { what: 'flange face, outside', line: { x1: S.xFlangeOut, y1: 54, x2: S.xFlangeOut, y2: S.yBeadSeat } },
    { what: 'Anlagefläche', line: { x1: S.xAnlage, y1: S.yPadTop, x2: S.xAnlage, y2: S.yBore } },
]

let mounted: VueWrapper[] = []

function mountDrawing(props: { active?: SchematicKey | null; showEt?: boolean } = {}): VueWrapper {
    const wrapper = mount(RimCodeSchematic, { props })
    mounted.push(wrapper)

    return wrapper
}

afterEach(() => {
    mounted.forEach((wrapper) => wrapper.unmount())
    mounted = []
})

describe('the cross-section keeps every word and every line clear', () => {
    it('lets no label touch another one, at any width', () => {
        for (const [i, label] of LABELS.entries()) {
            for (const other of LABELS.slice(i + 1)) {
                expect(overlap(boxOf(label), boxOf(other)), `${named(label)} runs into ${named(other)}`).toBe(false)
            }
        }
    })

    it('runs no dimension line, tick, axis, centre plane or leader through a label', () => {
        for (const { what, line } of LINES) {
            for (const label of LABELS) {
                expect(crosses(line, boxOf(label)), `${what} runs through ${named(label)}`).toBe(false)
            }
        }
    })
})

describe('the parts the drawing names', () => {
    it('names both humps, each word centred on the ridge the outline draws', () => {
        const humps = PARTS.filter((p) => p.label.text === 'Hump')

        expect(humps.map((p) => p.id)).toEqual(['hump-in', 'hump-out'])

        const ridges = walk(PROFILE).peaks.filter((peak) => peak.y === S.yHumpPeak)

        // The outline draws exactly two ridges, and each stands under one of the two words.
        expect(ridges).toHaveLength(2)
        expect(ridges.map((peak) => peak.x).sort((a, b) => a - b)).toEqual([S.xHumpIn, S.xHumpOut])

        for (const hump of humps) {
            expect(hump.label.anchor).toBe('middle')
            expect(ridges.some((ridge) => ridge.x === hump.label.x)).toBe(true)
            // The word sits above its ridge and never on it.
            expect(boxOf(hump.label).bottom).toBeLessThan(S.yHumpPeak)
            // A hump is a shape in the drawing, never a dimension of this wheel.
            expect(hump.for).toEqual([])
        }
    })

    it('prints no rim designation and no figure: the drawing names features, the product record holds values', () => {
        for (const label of LABELS) {
            expect(label.text, `${label.text} carries a digit`).not.toMatch(/\d/)
        }
    })

    it('leads Felgenmitte to the centre plane and stops short of it', () => {
        const leader = leaderOf('centre-plane')

        // One horizontal line, pointing from the word towards the plane.
        expect(leader.y1).toBe(leader.y2)
        expect(leader.x2).toBeGreaterThan(leader.x1)
        // It ends on the centre plane's own line — just short of it, never across it.
        expect(leader.x2).toBeLessThan(CENTRE_PLANE.x)
        expect(CENTRE_PLANE.x - leader.x2).toBeLessThanOrEqual(4)
        expect(leader.y1).toBeGreaterThan(CENTRE_PLANE.y1)
        expect(leader.y1).toBeLessThan(CENTRE_PLANE.y2)
        // It starts clear of its own word.
        expect(leader.x1).toBeGreaterThan(boxOf(part('centre-plane').label).right)
    })

    it('leads Anlagefläche to the mounting face and stops short of it', () => {
        const leader = leaderOf('anlage')

        expect(leader.y1).toBe(leader.y2)
        expect(leader.x2).toBeGreaterThan(leader.x1)
        // The mounting face is the pad's inboard face, from the top of the pad down to the bore.
        expect(leader.x2).toBeLessThan(S.xAnlage)
        expect(S.xAnlage - leader.x2).toBeLessThanOrEqual(4)
        expect(leader.y1).toBeGreaterThan(S.yPadTop)
        expect(leader.y1).toBeLessThan(S.yBore)
        // Not into the bolt hole, where that face is cut away.
        expect(leader.y1 > S.yBoltTop && leader.y1 < S.yBoltBottom).toBe(false)
        expect(leader.x1).toBeGreaterThan(boxOf(part('anlage').label).right)
    })

    it('draws every leader as one straight line that stops short of what it names', () => {
        const leaders = PARTS.filter((p) => p.leader !== undefined)

        expect(leaders.map((p) => p.id)).toEqual(['bead-seat', 'well', 'centre-plane', 'anlage', 'disc'])

        for (const p of leaders) {
            const line = leaderOf(p.id)

            expect(line.x1 === line.x2 || line.y1 === line.y2, `${p.id} bends`).toBe(true)
            expect(Math.hypot(line.x2 - line.x1, line.y2 - line.y1), `${p.id} is too short to read`).toBeGreaterThan(8)
        }

        // The two upper words drop onto their own feature: the bead seat and the floor of the well.
        expect(leaderOf('bead-seat').y2).toBeLessThan(S.yBeadSeat)
        expect(S.yBeadSeat - leaderOf('bead-seat').y2).toBeLessThanOrEqual(4)
        expect(leaderOf('well').y2).toBeLessThan(S.yWell)
        expect(S.yWell - leaderOf('well').y2).toBeLessThanOrEqual(4)
    })
})

describe('RimCodeSchematic', () => {
    it('renders every named part, and one leader in the one leader line for each part that has one', () => {
        const wrapper = mountDrawing()

        for (const p of PARTS) {
            const group = wrapper.find(`[data-part-label="${p.id}"]`)

            expect(group.exists(), `${p.id} is missing`).toBe(true)
            expect(group.text()).toBe(p.label.text)

            const leader = group.find('path.rc-sch__leader')
            expect(leader.exists(), `${p.id} leader`).toBe(p.leader !== undefined)

            if (p.leader !== undefined) {
                expect(leader.attributes('d')).toBe(p.leader)
                // The line comes from the stylesheet, so every leader is the same weight and ink.
                expect(leader.attributes('class')).toBe('rc-sch__leader')
                expect(leader.attributes('stroke')).toBeUndefined()
                expect(leader.attributes('style')).toBeUndefined()
            }
        }

        expect(wrapper.findAll('path.rc-sch__leader')).toHaveLength(PARTS.filter((p) => p.leader !== undefined).length)
    })

    it('shows both humps by name, and lets them light up for nothing', () => {
        for (const id of ['hump-in', 'hump-out']) {
            expect(mountDrawing().find(`[data-part-label="${id}"]`).text()).toBe('Hump')
        }

        for (const key of DIMENSION_ORDER) {
            const wrapper = mountDrawing({ active: key })

            expect(wrapper.find('[data-part-label="hump-in"]').classes()).not.toContain('is-active')
            expect(wrapper.find('[data-part-label="hump-out"]').classes()).not.toContain('is-active')
        }
    })

    it('sets the centre plane and the mounting face in the full ink while the ET is the subject, leaders and all', () => {
        const wrapper = mountDrawing({ active: 'et' })

        for (const id of ['centre-plane', 'anlage']) {
            const group = wrapper.find(`[data-part-label="${id}"]`)

            expect(group.classes()).toContain('is-active')
            expect(group.find('path.rc-sch__leader').exists()).toBe(true)
        }

        const centre = wrapper.find('[data-part="centre-plane"]')
        expect(Number(centre.attributes('y1'))).toBe(CENTRE_PLANE.y1)
        // The plane reaches past the Felgenmitte leader, so the leader ends on the line, not on its tip.
        expect(Number(centre.attributes('y2'))).toBe(CENTRE_PLANE.y2)
        expect(Number(centre.attributes('y2'))).toBeGreaterThan(leaderOf('centre-plane').y1)
    })

    it('still says that it is a schematic drawing and not to scale', () => {
        const wrapper = mountDrawing()

        expect(wrapper.find('figcaption').text()).toBe('Schnittzeichnung, schematisch, nicht maßstäblich.')
        expect(wrapper.find('svg').attributes('aria-label')).toContain('schematisch und nicht maßstäblich')
    })
})
