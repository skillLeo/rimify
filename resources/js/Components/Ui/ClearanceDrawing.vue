<script setup lang="ts">
/**
 * The clearance drawing (signature moment 4): a plan view of the tyre's tread band from above, in
 * technical-drawing style. The car's interior is on the left, the exterior on the right; the
 * mounting face (Anlagefläche) is the fixed vertical line everything is read against, because it
 * is the one plane bolted to the car. The current setup is dashed, the new one solid, and two
 * dimensions say how far the tread's outer and inner edges moved — the "does it poke" question in
 * millimetres, without a word about whether it may.
 *
 * `viewBox="0 0 480 200"`, one user unit is one millimetre. Every line is a hairline in ink,
 * ink-2 or ink-3 (`vector-effect: non-scaling-stroke`) — never blue; blue is for actions.
 * Dimension lines end in square ticks, drawing-office style, not arrowheads. Labels are HTML
 * placed over the sheet by viewBox percentages, so they keep the micro size at every width
 * instead of scaling with the sheet.
 *
 * Motion: when a value changes, the ten numbers that define the two setups are tweened over
 * `--d-2` with `--ease-std` in a requestAnimationFrame loop and the shapes are rebuilt from the
 * in-between values, so the band slides rather than jumps. Labels and the aria-label read the
 * target values straight away — numbers change instantly. Under reduced motion, and on the
 * server, the drawing rests in its end state.
 */

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { withUnit } from '../../format'
import { compare, MM_PER_INCH, signedDecimal, type WheelSetup } from '../../lib/fitmentMath'
import { etLabel } from '../../lib/rechner'

const props = defineProps<{ current: WheelSetup; next: WheelSetup }>()

/* ── The sheet, in millimetres ─────────────────────────────────────────────────── */

const VB_W = 480
const VB_H = 200
/** The mounting face. It never moves. */
const FACE_X = 260
const FACE = { top: 20, bottom: 180 }
/** The tread band: as wide as the tyre's section, centred on the rim's centreline. */
const BAND = { top: 60, bottom: 140, rx: 6 }
const CENTRE = { top: 50, bottom: 150 }
/** The rim width as a bracket under the band. */
const BRACKET_Y = 150
const ET_DIM_Y = 40
const EDGE_DIM_Y = 170
/** Half of a 4 mm square tick. */
const TICK = 2
const EXT_GAP = 2
const EXT_OVER = 2
const LABEL_MIN_PCT = 10
const LABEL_MAX_PCT = 90
/** Below this an edge has not moved: the dimension is omitted and the label reads ±0,0. */
const COINCIDE_MM = 0.05

interface Band {
    xc: number
    left: number
    right: number
    rimLeft: number
    rimRight: number
}

/** Where one setup's band and rim sit on the sheet; `x_c = 260 − ET`. */
function band(s: WheelSetup): Band {
    const xc = FACE_X - s.etMm
    const halfTyre = s.tyreWidthMm / 2
    const halfRim = (s.widthIn * MM_PER_INCH) / 2

    return { xc, left: xc - halfTyre, right: xc + halfTyre, rimLeft: xc - halfRim, rimRight: xc + halfRim }
}

function r1(n: number): number {
    return Math.round(n * 10) / 10
}

/** A horizontal line with a square tick at each end. */
function hLine(x1: number, x2: number, y: number): string {
    const lo = r1(Math.min(x1, x2))
    const hi = r1(Math.max(x1, x2))

    return `M${lo} ${y - TICK} V${y + TICK} M${lo} ${y} H${hi} M${hi} ${y - TICK} V${y + TICK}`
}

function bracket(b: Band): string {
    return hLine(b.rimLeft, b.rimRight, BRACKET_Y)
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

const results = computed(() => compare(props.current, props.next))

/** An edge that has not moved gets no dimension line, only a `±0,0 mm` label beside it. */
const moved = computed(() => ({
    outer: Math.abs(results.value.outerEdgeMm) >= COINCIDE_MM,
    inner: Math.abs(results.value.innerEdgeMm) >= COINCIDE_MM,
    et: Math.abs(props.next.etMm) >= COINCIDE_MM,
}))

const drawing = computed(() => {
    const a = band(shown.value.current)
    const b = band(shown.value.next)
    const ext: string[] = []
    const dims: string[] = []

    if (moved.value.et) {
        ext.push(`M${r1(b.xc)} ${CENTRE.top - EXT_GAP} V${ET_DIM_Y - EXT_OVER}`)
        dims.push(hLine(b.xc, FACE_X, ET_DIM_Y))
    }

    if (moved.value.outer) {
        ext.push(`M${r1(a.right)} ${BAND.bottom + EXT_GAP} V${EDGE_DIM_Y + EXT_OVER} M${r1(b.right)} ${BAND.bottom + EXT_GAP} V${EDGE_DIM_Y + EXT_OVER}`)
        dims.push(hLine(a.right, b.right, EDGE_DIM_Y))
    }

    if (moved.value.inner) {
        ext.push(`M${r1(a.left)} ${BAND.bottom + EXT_GAP} V${EDGE_DIM_Y + EXT_OVER} M${r1(b.left)} ${BAND.bottom + EXT_GAP} V${EDGE_DIM_Y + EXT_OVER}`)
        dims.push(hLine(a.left, b.left, EDGE_DIM_Y))
    }

    return {
        old: { x: r1(a.left), width: r1(a.right - a.left), bracket: bracket(a) },
        new: { x: r1(b.left), width: r1(b.right - b.left), bracket: bracket(b) },
        centre: `M${r1(b.xc)} ${CENTRE.top} V${CENTRE.bottom}`,
        ext: ext.join(' '),
        dims: dims.join(' '),
    }
})

function pct(value: number, of: number): string {
    return `${Math.round((value / of) * 1000) / 10}%`
}

function clampPct(value: number, of: number): string {
    return pct(Math.min(Math.max((value / of) * 100, LABEL_MIN_PCT), LABEL_MAX_PCT), 100)
}

function signedMm(value: number): string {
    return withUnit(signedDecimal(value, 1), 'mm')
}

const labels = computed(() => {
    const r = results.value
    const a = band(props.current)
    const b = band(props.next)

    return {
        et: {
            text: etLabel(props.next.etMm),
            /* Between the new centreline and the face; beside the face when they coincide. */
            left: moved.value.et ? clampPct((b.xc + FACE_X) / 2, VB_W) : pct(FACE_X + 4, VB_W),
            top: pct(ET_DIM_Y - 4, VB_H),
            centred: moved.value.et,
        },
        outer: {
            text: `außen ${signedMm(r.outerEdgeMm)}`,
            left: clampPct((a.right + b.right) / 2, VB_W),
            top: pct(EDGE_DIM_Y + 4, VB_H),
        },
        inner: {
            text: `innen ${signedMm(r.innerEdgeMm)}`,
            left: clampPct((a.left + b.left) / 2, VB_W),
            top: pct(EDGE_DIM_Y + 4, VB_H),
        },
        face: { left: pct(FACE_X + 4, VB_W), top: pct(FACE.bottom + 6, VB_H) },
        side: { left: pct(8, VB_W), right: pct(8, VB_W), top: pct(104, VB_H) },
    }
})

const description = computed(
    () =>
        `Draufsicht: die neue Felge steht ${signedMm(results.value.outerEdgeMm)} weiter außen und ` +
        `${signedMm(results.value.innerEdgeMm)} näher am Federbein als die aktuelle.`
)
</script>

<template>
    <!-- One image to assistive tech (the sentence says what it shows); a figure may not carry role="img". -->
    <div ref="root" class="cd" role="img" :aria-label="description">
        <div class="cd__sheet">
            <svg class="cd__svg" :viewBox="`0 0 ${VB_W} ${VB_H}`" aria-hidden="true" focusable="false">
                <path class="cd__line cd__face" :d="`M${FACE_X} ${FACE.top} V${FACE.bottom}`" />
                <g class="old">
                    <rect class="cd__line cd__old" :x="drawing.old.x" :y="BAND.top" :width="drawing.old.width" :height="BAND.bottom - BAND.top" :rx="BAND.rx" />
                    <path class="cd__line cd__old" :d="drawing.old.bracket" />
                </g>
                <g class="new">
                    <path class="cd__line cd__centre" :d="drawing.centre" />
                    <rect class="cd__line cd__new" :x="drawing.new.x" :y="BAND.top" :width="drawing.new.width" :height="BAND.bottom - BAND.top" :rx="BAND.rx" />
                    <path class="cd__line cd__new" :d="drawing.new.bracket" />
                </g>
                <path class="cd__line cd__ext" :d="drawing.ext" />
                <path class="cd__line cd__dim" :d="drawing.dims" />
            </svg>

            <span class="cd__label cd__label--et micro num" :class="{ 'cd__label--centred': labels.et.centred }" :style="{ left: labels.et.left, top: labels.et.top }">
                {{ labels.et.text }}
            </span>
            <span class="cd__label cd__label--outer micro num" :style="{ left: labels.outer.left, top: labels.outer.top }">
                {{ labels.outer.text }}
            </span>
            <span class="cd__label cd__label--inner micro num" :style="{ left: labels.inner.left, top: labels.inner.top }">
                {{ labels.inner.text }}
            </span>
            <span class="cd__label cd__label--face micro quiet" :style="{ left: labels.face.left, top: labels.face.top }">Anlagefläche</span>
            <span class="cd__label cd__label--side micro quiet" :style="{ left: labels.side.left, top: labels.side.top }">innen (Federbein)</span>
            <span class="cd__label cd__label--side cd__label--right micro quiet" :style="{ right: labels.side.right, top: labels.side.top }">außen (Kotflügel)</span>
        </div>

        <div class="cd__legend micro muted" aria-hidden="true">
            <span class="cd__key">
                <svg class="cd__swatch" viewBox="0 0 32 8" width="32" height="8" focusable="false">
                    <path class="cd__line cd__old" d="M0 4 H32" />
                </svg>
                Aktuell
            </span>
            <span class="cd__key">
                <svg class="cd__swatch" viewBox="0 0 32 8" width="32" height="8" focusable="false">
                    <path class="cd__line cd__new" d="M0 4 H32" />
                </svg>
                Neu
            </span>
        </div>
    </div>
</template>

<style scoped>
.cd {
    display: grid;
    gap: var(--sp-8);
    width: 100%;
    margin: 0;
}

/* The sheet holds its 12 : 5 box before the drawing paints. */
.cd__sheet {
    position: relative;
    width: 100%;
    aspect-ratio: 12 / 5;
    overflow: hidden;
}

.cd__svg {
    display: block;
    width: 100%;
    height: auto;
}

.cd__line {
    fill: none;
    stroke-width: 1;
    stroke-linecap: square;
    stroke-linejoin: miter;
    vector-effect: non-scaling-stroke;
}

.cd__new {
    stroke: var(--c-ink);
    stroke-width: 1.5;
}

.cd__old {
    stroke: var(--c-ink-3);
    stroke-dasharray: 4 3;
}

/* The mounting face the way a drawing office draws a datum: dash-dot. */
.cd__face {
    stroke: var(--c-ink-2);
    stroke-dasharray: 6 3 1 3;
}

.cd__centre {
    stroke: var(--c-ink-3);
    stroke-width: 0.75;
}

/* Dimension lines in the secondary ink, extension lines in the tertiary; nothing in the drawing is blue. */
.cd__dim {
    stroke: var(--c-ink-2);
}

.cd__ext {
    stroke: var(--c-ink-3);
}

.cd__label {
    position: absolute;
    display: block;
    color: var(--c-ink-2);
    font-weight: 500;
    white-space: nowrap;
    pointer-events: none;
}

.cd__label--et {
    transform: translateY(-100%);
}

.cd__label--centred,
.cd__label--outer,
.cd__label--inner {
    transform: translateX(-50%);
}

.cd__label--centred {
    transform: translate(-50%, -100%);
}

.cd__label--face,
.cd__label--side {
    font-weight: 400;
    color: var(--c-ink-3);
}

.cd__label--side {
    transform: translateY(-50%);
}

.cd__legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-16);
    margin: 0;
}

.cd__key {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-8);
}

.cd__swatch {
    flex: none;
    overflow: visible;
}
</style>
