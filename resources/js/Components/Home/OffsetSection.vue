<script setup lang="ts">
/**
 * The offset cross-section: a wheel and its tyre cut through the axle, drawn the way a Gutachten
 * draws it. The current setup is dashed, the new one solid, and three dimension lines say what
 * moved — the outer rim edge, the inner rim edge and the tyre's outer diameter.
 *
 * The mounting face (Anlagefläche) is the fixed reference: it is the plane bolted to the car, so
 * it never moves in the drawing and everything else is read against it. Inboard is left, outboard
 * is right. Both wheels share the same flange, well and hub details, which is why those cancel
 * out of every dimension exactly as they do in the formulas.
 *
 * Every line is a 1px hairline (`vector-effect: non-scaling-stroke`) in ink, ink-3 or blue; the
 * arrowheads are the only filled shapes. Labels are HTML placed over the drawing by viewBox
 * percentages, so they stay at the micro size at every width instead of scaling with the sheet.
 *
 * Signature moment 4: when a value changes, the ten numbers that define the two setups are tweened
 * over `--d-2` with `--ease-std` in a requestAnimationFrame loop and the paths are rebuilt from
 * the in-between values, so the profile morphs rather than jumps. Labels and the aria-label read
 * the target values straight away — numbers change instantly. Under reduced motion, and on the
 * server, the drawing simply rests in its end state.
 */

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { decimal, NNBSP, withUnit } from '../../format'
import { compare, MM_PER_INCH, signedDecimal, type WheelSetup } from '../../lib/fitmentMath'

const props = defineProps<{ current: WheelSetup; next: WheelSetup }>()

/* ── The sheet, in viewBox units ─────────────────────────────────────────────── */

const VB_W = 440
const VB_H = 800
/** The mounting face. It never moves. */
const FACE_X = 236
const AXLE_Y = 400
/** The box the wheel may fill; the margins around it belong to dimension lines and labels. */
const FIT = { left: 40, right: 344, top: 112 }
const DIM_TOP_Y = 64
const DIM_BOTTOM_Y = 736
const DIM_RIGHT_X = 396
const ARROW_LENGTH = 9
const ARROW_HALF = 3
/** Below this span the arrowheads move outside the extension lines, drafting-style. */
const INSIDE_MIN = 28
const OVERSHOOT = 4
const GAP = 2
const LABEL_MIN_PCT = 20
const LABEL_MAX_PCT = 80

/* ── Rim and hub details in mm, identical on both wheels ─────────────────────── */

const FLANGE_H = 17
const FLANGE_W = 12
const WELL_D = 24
const HUB_BORE = 33
const HUB_R = 72
const PAD_T = 12

interface Section {
    xc: number
    xi: number
    xo: number
    edgeIn: number
    edgeOut: number
    rRim: number
    rFlange: number
    rTyre: number
    halfTyre: number
    tyreWidth: number
}

/** One wheel as mm coordinates: x from the mounting face (outboard positive), y from the axle. */
function section(s: WheelSetup): Section {
    const width = s.widthIn * MM_PER_INCH
    const xc = -s.etMm
    const rRim = (s.diameterIn * MM_PER_INCH) / 2
    const rFlange = rRim + FLANGE_H

    return {
        xc,
        xi: xc - width / 2,
        xo: xc + width / 2,
        edgeIn: xc - width / 2 - FLANGE_W,
        edgeOut: xc + width / 2 + FLANGE_W,
        rRim,
        rFlange,
        rTyre: Math.max(rRim + (s.tyreWidthMm * s.aspect) / 100, rFlange + 4),
        halfTyre: Math.max(s.tyreWidthMm / 2, width / 2 + FLANGE_W + 3),
        tyreWidth: s.tyreWidthMm,
    }
}

/** Millimetres per viewBox unit, so that both wheels fit the sheet with the mounting face fixed. */
function scaleFor(a: Section, b: Section): number {
    const xMin = Math.min(a.xc - a.halfTyre, b.xc - b.halfTyre)
    const xMax = Math.max(a.xc + a.halfTyre, b.xc + b.halfTyre)
    const rMax = Math.max(a.rTyre, b.rTyre)

    return Math.min(
        (FACE_X - FIT.left) / Math.max(-xMin, 1),
        (FIT.right - FACE_X) / Math.max(xMax, 1),
        (AXLE_Y - FIT.top) / Math.max(rMax, 1)
    )
}

type Point = (x: number, y: number) => string

function mapper(scale: number): { X: (x: number) => number; Y: (y: number) => number; p: Point } {
    const X = (x: number) => Math.round((FACE_X + x * scale) * 10) / 10
    const Y = (y: number) => Math.round((AXLE_Y - y * scale) * 10) / 10

    return { X, Y, p: (x, y) => `${X(x)} ${Y(y)}` }
}

/* Each profile is the upper half mirrored about the axle: the same path with y negated. */
function mirrored(build: (y: (v: number) => number) => string): string {
    return [1, -1].map((m) => build((v) => m * v)).join(' ')
}

function rimPath(g: Section, p: Point): string {
    return mirrored(
        (y) =>
            `M${p(g.edgeIn, y(g.rRim - 8))} L${p(g.edgeIn, y(g.rFlange))} L${p(g.xi, y(g.rFlange))} ` +
            `L${p(g.xi, y(g.rRim))} L${p(g.xi + 22, y(g.rRim))} L${p(g.xi + 38, y(g.rRim - WELL_D))} ` +
            `L${p(g.xo - 58, y(g.rRim - WELL_D))} L${p(g.xo - 40, y(g.rRim))} L${p(g.xo, y(g.rRim))} ` +
            `L${p(g.xo, y(g.rFlange))} L${p(g.edgeOut, y(g.rFlange))} L${p(g.edgeOut, y(g.rRim - 8))}`
    )
}

function discPath(g: Section, p: Point): string {
    const well = g.rRim - WELL_D
    /* The spoke lands on the well's outer ramp, which climbs from the floor to the bead seat. */
    const ramp = (x: number) => well + ((x - (g.xo - 58)) / 18) * WELL_D

    return mirrored(
        (y) =>
            `M${p(0, y(HUB_BORE))} L${p(PAD_T, y(HUB_BORE))} ` +
            `M${p(0, y(HUB_BORE))} L${p(0, y(HUB_R))} L${p(g.xo - 52, y(ramp(g.xo - 52)))} ` +
            `M${p(PAD_T, y(HUB_BORE))} L${p(PAD_T, y(HUB_R))} L${p(g.xo - 42, y(ramp(g.xo - 42)))}`
    )
}

function tyrePath(g: Section, p: Point): string {
    const h = g.rTyre - g.rRim
    const shoulder = 0.18 * g.tyreWidth
    const xl = g.xc - g.halfTyre
    const xr = g.xc + g.halfTyre
    const mid = g.rRim + 0.55 * h
    const root = g.rFlange + 0.1 * h

    return mirrored(
        (y) =>
            `M${p(g.edgeIn, y(g.rFlange))} Q${p(xl, y(root))} ${p(xl, y(mid))} ` +
            `Q${p(xl, y(g.rTyre))} ${p(xl + shoulder, y(g.rTyre))} L${p(xr - shoulder, y(g.rTyre))} ` +
            `Q${p(xr, y(g.rTyre))} ${p(xr, y(mid))} Q${p(xr, y(root))} ${p(g.edgeOut, y(g.rFlange))}`
    )
}

/* ── Dimension lines: extension lines, the line itself, and two closed arrowheads ─ */

interface Dimension {
    ext: string
    line: string
    arrows: string
}

function arrow(x: number, y: number, dir: 'l' | 'r' | 'u' | 'd'): string {
    switch (dir) {
        case 'l':
            return `M${x} ${y} L${x + ARROW_LENGTH} ${y - ARROW_HALF} L${x + ARROW_LENGTH} ${y + ARROW_HALF} Z`
        case 'r':
            return `M${x} ${y} L${x - ARROW_LENGTH} ${y - ARROW_HALF} L${x - ARROW_LENGTH} ${y + ARROW_HALF} Z`
        case 'u':
            return `M${x} ${y} L${x - ARROW_HALF} ${y + ARROW_LENGTH} L${x + ARROW_HALF} ${y + ARROW_LENGTH} Z`
        default:
            return `M${x} ${y} L${x - ARROW_HALF} ${y - ARROW_LENGTH} L${x + ARROW_HALF} ${y - ARROW_LENGTH} Z`
    }
}

/** A horizontal dimension at `y`; `dir` is −1 when it sits above its features, +1 below. */
function hDim(x1: number, fromY1: number, x2: number, fromY2: number, y: number, dir: -1 | 1): Dimension {
    const lo = Math.min(x1, x2)
    const hi = Math.max(x1, x2)
    const inside = hi - lo >= INSIDE_MIN
    const reach = ARROW_LENGTH + 8

    return {
        ext:
            `M${x1} ${fromY1 + dir * GAP} L${x1} ${y + dir * OVERSHOOT} ` +
            `M${x2} ${fromY2 + dir * GAP} L${x2} ${y + dir * OVERSHOOT}`,
        line: inside ? `M${lo} ${y} L${hi} ${y}` : `M${lo - reach} ${y} L${hi + reach} ${y}`,
        arrows: inside ? `${arrow(lo, y, 'l')} ${arrow(hi, y, 'r')}` : `${arrow(lo, y, 'r')} ${arrow(hi, y, 'l')}`,
    }
}

/** A vertical dimension at `x`, to the right of its features. */
function vDim(y1: number, y2: number, fromX: number, x: number): Dimension {
    const lo = Math.min(y1, y2)
    const hi = Math.max(y1, y2)
    const inside = hi - lo >= INSIDE_MIN
    const reach = ARROW_LENGTH + 8

    return {
        ext: `M${fromX + GAP} ${y1} L${x + OVERSHOOT} ${y1} M${fromX + GAP} ${y2} L${x + OVERSHOOT} ${y2}`,
        line: inside ? `M${x} ${lo} L${x} ${hi}` : `M${x} ${lo - reach} L${x} ${hi + reach}`,
        arrows: inside ? `${arrow(x, lo, 'u')} ${arrow(x, hi, 'd')}` : `${arrow(x, lo, 'd')} ${arrow(x, hi, 'u')}`,
    }
}

/* ── The morph ─────────────────────────────────────────────────────────────────── */

interface Pair {
    current: WheelSetup
    next: WheelSetup
}

const KEYS: (keyof WheelSetup)[] = ['widthIn', 'diameterIn', 'etMm', 'tyreWidthMm', 'aspect']

function snapshot(pair: Pair): Pair {
    return { current: { ...pair.current }, next: { ...pair.next } }
}

function lerpSetup(from: WheelSetup, to: WheelSetup, t: number): WheelSetup {
    const out = { ...to }

    for (const key of KEYS) {
        out[key] = from[key] + (to[key] - from[key]) * t
    }

    return out
}

/** The CSS timing function as a number-to-number function (the usual Newton–Raphson on x). */
function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
    const a = (p1: number, p2: number) => 1 - 3 * p2 + 3 * p1
    const b = (p1: number, p2: number) => 3 * p2 - 6 * p1
    const c = (p1: number) => 3 * p1
    const at = (t: number, p1: number, p2: number) => ((a(p1, p2) * t + b(p1, p2)) * t + c(p1)) * t
    const slope = (t: number, p1: number, p2: number) => 3 * a(p1, p2) * t * t + 2 * b(p1, p2) * t + c(p1)

    return (x) => {
        if (x <= 0) {
            return 0
        }

        if (x >= 1) {
            return 1
        }

        let t = x

        for (let i = 0; i < 8; i++) {
            const dx = at(t, x1, x2) - x
            const d = slope(t, x1, x2)

            if (Math.abs(dx) < 1e-5 || d === 0) {
                break
            }

            t -= dx / d
        }

        return at(t, y1, y2)
    }
}

function parseMs(value: string): number | null {
    const match = /^\s*([\d.]+)\s*(ms|s)\s*$/.exec(value)

    if (match === null || match[1] === undefined) {
        return null
    }

    const n = Number(match[1])

    return Number.isFinite(n) ? (match[2] === 's' ? n * 1000 : n) : null
}

function parseBezier(value: string): ((t: number) => number) | null {
    const match = /cubic-bezier\(([^)]+)\)/.exec(value)
    const parts = match?.[1]?.split(',').map((v) => Number(v.trim())) ?? []

    if (parts.length !== 4 || parts.some((v) => !Number.isFinite(v))) {
        return null
    }

    return cubicBezier(parts[0] as number, parts[1] as number, parts[2] as number, parts[3] as number)
}

const root = ref<HTMLElement | null>(null)
const shown = ref<Pair>(snapshot(props))
/* No motion until we are on a client that has not asked for stillness. */
const motion = ref(false)
let frame = 0
let duration = 200
let ease = cubicBezier(0.4, 0, 0.2, 1)

onMounted(() => {
    motion.value = !(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)

    if (root.value !== null) {
        const style = getComputedStyle(root.value)
        duration = parseMs(style.getPropertyValue('--d-2')) ?? duration
        ease = parseBezier(style.getPropertyValue('--ease-std')) ?? ease
    }
})

function stop(): void {
    if (frame !== 0 && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(frame)
    }

    frame = 0
}

watch(
    () => [props.current, props.next],
    () => {
        stop()
        const to = snapshot(props)

        if (!motion.value || typeof requestAnimationFrame !== 'function') {
            shown.value = to

            return
        }

        const from = snapshot(shown.value)
        const started = performance.now()

        const step = (now: number): void => {
            const t = Math.min(1, (now - started) / duration)
            const e = ease(t)
            shown.value = {
                current: lerpSetup(from.current, to.current, e),
                next: lerpSetup(from.next, to.next, e),
            }
            frame = t < 1 ? requestAnimationFrame(step) : 0
        }

        frame = requestAnimationFrame(step)
    },
    { deep: true }
)

onBeforeUnmount(stop)

/* ── What is drawn (from the tweened values) and what is written (from the real ones) ─ */

const drawing = computed(() => {
    const a = section(shown.value.current)
    const b = section(shown.value.next)
    const { X, Y, p } = mapper(scaleFor(a, b))
    const rMax = Math.max(a.rTyre, b.rTyre)
    const outer = hDim(X(a.edgeOut), Y(a.rFlange), X(b.edgeOut), Y(b.rFlange), DIM_TOP_Y, -1)
    const inner = hDim(X(a.edgeIn), Y(-a.rFlange), X(b.edgeIn), Y(-b.rFlange), DIM_BOTTOM_Y, 1)
    const diameter = vDim(Y(b.rTyre), Y(-b.rTyre), X(b.xc + b.halfTyre), DIM_RIGHT_X)

    return {
        old: `${rimPath(a, p)} ${discPath(a, p)} ${tyrePath(a, p)}`,
        rim: rimPath(b, p),
        disc: discPath(b, p),
        tyre: tyrePath(b, p),
        axle: `M${FIT.left} ${AXLE_Y} L${DIM_RIGHT_X - 12} ${AXLE_Y}`,
        face: `M${FACE_X} ${Y(rMax) - 8} L${FACE_X} ${Y(-rMax) + 8}`,
        centre: `M${X(b.xc)} ${Y(b.rFlange) - 8} L${X(b.xc)} ${Y(-b.rFlange) + 8}`,
        ext: `${outer.ext} ${inner.ext} ${diameter.ext}`,
        dims: `${outer.line} ${inner.line} ${diameter.line}`,
        arrows: `${outer.arrows} ${inner.arrows} ${diameter.arrows}`,
    }
})

function mm(value: number): string {
    return Number.isFinite(value) ? withUnit(decimal(value, 1), 'mm') : '–'
}

function signedMm(value: number): string {
    return withUnit(signedDecimal(value, 1), 'mm')
}

function pct(value: number, of: number): string {
    return `${Math.round((value / of) * 1000) / 10}%`
}

function clampPct(value: number, of: number): string {
    return pct(Math.min(Math.max((value / of) * 100, LABEL_MIN_PCT), LABEL_MAX_PCT), 100)
}

const results = computed(() => compare(props.current, props.next))

const labels = computed(() => {
    const r = results.value
    const a = section(props.current)
    const b = section(props.next)
    const { X, Y } = mapper(scaleFor(a, b))

    return {
        outer: {
            text: `außen ${signedMm(r.outerEdgeMm)}`,
            left: clampPct((X(a.edgeOut) + X(b.edgeOut)) / 2, VB_W),
            top: pct(DIM_TOP_Y - 8, VB_H),
        },
        inner: {
            text: `innen ${signedMm(r.innerEdgeMm)}`,
            left: clampPct((X(a.edgeIn) + X(b.edgeIn)) / 2, VB_W),
            top: pct(DIM_BOTTOM_Y + 8, VB_H),
        },
        diameter: {
            text: `Ø${NNBSP}${mm(r.next.diameterMm)}`,
            top: pct(Y(-b.rTyre) + 8, VB_H),
        },
    }
})

const description = computed(() => {
    const r = results.value
    const speed = Number.isFinite(r.speedoAt100KmH) ? withUnit(decimal(r.speedoAt100KmH, 1), 'km/h') : '–'
    const delta = withUnit(signedDecimal(r.diameterDeltaPercent, 1), '%')

    return (
        'Querschnitt von Felge und Reifen, aktuell gestrichelt, neu durchgezogen. ' +
        `Außenkante ${signedMm(r.outerEdgeMm)}, Innenkante ${signedMm(r.innerEdgeMm)}, ` +
        `Abrollumfang ${mm(r.next.circumferenceMm)} (${delta}), ` +
        `bei Tacho ${withUnit(100, 'km/h')} tatsächlich ${speed}.`
    )
})
</script>

<template>
    <div ref="root" class="offset">
        <div class="offset__figure" role="img" :aria-label="description">
            <svg class="offset__svg" :viewBox="`0 0 ${VB_W} ${VB_H}`" aria-hidden="true" focusable="false">
                <path class="offset__line offset__axis" :d="drawing.axle" />
                <path class="offset__line offset__axis" :d="drawing.face" />
                <path class="offset__line offset__axis" :d="drawing.centre" />
                <path class="offset__line offset__old" :d="drawing.old" />
                <path class="offset__line offset__new" :d="drawing.rim" />
                <path class="offset__line offset__new" :d="drawing.disc" />
                <path class="offset__line offset__new" :d="drawing.tyre" />
                <path class="offset__line offset__dim" :d="drawing.ext" />
                <path class="offset__line offset__dim" :d="drawing.dims" />
                <path class="offset__arrow" :d="drawing.arrows" />
            </svg>
            <span
                class="offset__label offset__label--outer micro num"
                :style="{ left: labels.outer.left, top: labels.outer.top }"
            >
                {{ labels.outer.text }}
            </span>
            <span
                class="offset__label offset__label--inner micro num"
                :style="{ left: labels.inner.left, top: labels.inner.top }"
            >
                {{ labels.inner.text }}
            </span>
            <span class="offset__label offset__label--diameter micro num" :style="{ top: labels.diameter.top }">
                {{ labels.diameter.text }}
            </span>
        </div>

        <p class="offset__legend micro quiet" aria-hidden="true">
            <span class="offset__key">
                <svg class="offset__swatch" viewBox="0 0 32 8" width="32" height="8" focusable="false">
                    <path class="offset__line offset__old" d="M0 4 L32 4" />
                </svg>
                Aktuell
            </span>
            <span class="offset__key">
                <svg class="offset__swatch" viewBox="0 0 32 8" width="32" height="8" focusable="false">
                    <path class="offset__line offset__new" d="M0 4 L32 4" />
                </svg>
                Neu
            </span>
        </p>
    </div>
</template>

<style scoped>
.offset {
    display: grid;
    gap: var(--sp-8);
    width: 100%;
}

.offset__figure {
    position: relative;
    width: 100%;
    overflow: hidden;
}

.offset__svg {
    display: block;
    width: 100%;
    height: auto;
}

.offset__line {
    fill: none;
    stroke-width: 1;
    stroke-linecap: square;
    stroke-linejoin: miter;
    vector-effect: non-scaling-stroke;
}

.offset__new {
    stroke: var(--c-ink);
}

.offset__old {
    stroke: var(--c-ink-3);
    stroke-dasharray: 6 4;
}

/* Centre lines the way a drawing office draws them: long dash, short dash. */
.offset__axis {
    stroke: var(--c-ink-3);
    stroke-dasharray: 12 4 2 4;
}

.offset__dim {
    stroke: var(--c-blue);
}

.offset__arrow {
    fill: var(--c-blue);
    stroke: none;
}

.offset__label {
    position: absolute;
    display: block;
    color: var(--c-blue);
    font-weight: 500;
    white-space: nowrap;
    pointer-events: none;
}

.offset__label--outer {
    transform: translate(-50%, -100%);
}

.offset__label--inner {
    transform: translate(-50%, 0);
}

.offset__label--diameter {
    right: 0;
}

.offset__legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-16);
    margin: 0;
}

.offset__key {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-8);
}

.offset__swatch {
    flex: none;
    overflow: visible;
}
</style>
