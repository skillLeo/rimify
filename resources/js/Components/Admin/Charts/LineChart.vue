<script setup lang="ts">
/**
 * A trend over days (BRIEF §5: a trend is a line), hand-built on d3-scale and d3-shape. One measure,
 * one axis: the period in the accent, 2 px with round caps, no fill; with comparing on, the previous
 * period day for day as a 1 px dotted grey line beside it — never a second axis. Gridlines are solid
 * hairlines; the axis text wears ink. The plot's height is the token's (--adm-plot-h: 260 / 200 /
 * 168 px), measured, so the drawing is never stretched.
 *
 * Only the last point carries a dot and its value. Pointing anywhere over the drawing, or moving with
 * the arrow keys once the chart has focus, sets a crosshair on the nearest day and says its date, the
 * Umsatz and the Bestellungen — aloud as well, through a polite live region. On touch a tap pins it;
 * it stays where it was read until the next tap. Amounts go through num.ts's formatMoney, with the
 * cents; only the axis' round ticks drop them.
 */

import { scaleLinear } from 'd3-scale'
import { curveMonotoneX, line } from 'd3-shape'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { formatMoney, formatNumber } from '../../../lib/num'
import type { ChartPoint } from '../../../types/admin/uebersicht'
import { mayAnimate, useWidth } from './useWidth'

const props = withDefaults(defineProps<{ points: ChartPoint[]; previous?: ChartPoint[] | null; label: string }>(), { previous: null })

const M = { top: 28, right: 20, bottom: 28, left: 72 }

/** The room between the crosshair and its tip. */
const TIP_GAP = 12

/** The server's drawing, before the box is measured: the widest plot's height. */
const { el, width, height } = useWidth(720, 260)
const active = ref<number | null>(null)
const drawIn = ref(false)

onMounted(() => {
    drawIn.value = mayAnimate()
})

/** An amount, as everywhere: `12.345,67 €` (num.ts). */
const money = (cents: number): string => formatMoney(cents)

/** The axis' round ticks: whole euros, `12.000 €`. */
const tick = (cents: number): string => formatMoney(cents, true)

function orders(n: number): string {
    return n === 1 ? '1 Bestellung' : `${formatNumber(n)} Bestellungen`
}

const geometry = computed(() => {
    const n = props.points.length
    const innerW = Math.max(40, width.value - M.left - M.right)
    const innerH = Math.max(40, height.value - M.top - M.bottom)
    const values = [...props.points.map((p) => p.value), ...(props.previous ?? []).map((p) => p.value)]
    const max = Math.max(1, ...values)

    const x = scaleLinear().domain([0, Math.max(1, n - 1)]).range([0, innerW])
    const y = scaleLinear().domain([0, max]).range([innerH, 0]).nice(4)
    const draw = line<ChartPoint>()
        .x((_, i) => x(i))
        .y((p) => y(p.value))
        .curve(curveMonotoneX)

    const ticks = y.ticks(4).map((value) => ({ value, y: y(value), label: tick(value) }))
    const xIdx = n <= 2 ? [0, n - 1] : [0, Math.floor((n - 1) / 2), n - 1]
    const xLabels = [...new Set(xIdx)].filter((i) => i >= 0).map((i) => ({ x: x(i), label: props.points[i]?.label.slice(0, 6) ?? '', anchor: i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle' }))

    const last = n - 1
    const lastPoint = props.points[last]

    return {
        innerW,
        innerH,
        x,
        y,
        path: draw(props.points) ?? '',
        previous: props.previous ? (draw(props.previous) ?? '') : null,
        ticks,
        xLabels,
        last: lastPoint ? { x: x(last), y: y(lastPoint.value), text: money(lastPoint.value) } : null,
    }
})

const hovered = computed(() => {
    if (active.value === null) {
        return null
    }

    const point = props.points[active.value]

    if (!point) {
        return null
    }

    const g = geometry.value
    const px = g.x(active.value)

    return {
        point,
        previous: props.previous?.[active.value] ?? null,
        x: px,
        y: g.y(point.value),
        left: M.left + px,
    }
})

/*
 * The tip stands right of the crosshair where it fits, else left of it, and never past the chart's
 * edge — on a 390 px phone as on a wide screen. Its width is measured, not guessed.
 */
const tip = ref<HTMLElement | null>(null)
const tipWidth = ref(0)

watch(hovered, () => void nextTick(() => (tipWidth.value = tip.value?.offsetWidth ?? 0)))

const tipLeft = computed(() => {
    const at = hovered.value?.left ?? 0
    const right = at + TIP_GAP

    if (right + tipWidth.value <= width.value) {
        return right
    }

    return Math.max(0, Math.min(at - TIP_GAP - tipWidth.value, width.value - tipWidth.value))
})

/* Said aloud only when the keyboard moved it: a mouse crossing the chart is not something to read out. */
const byKeyboard = ref(false)

const announcement = computed(() => {
    const at = hovered.value

    return byKeyboard.value && at ? `${at.point.label}: ${money(at.point.value)}, ${orders(at.point.orders)}` : ''
})

/*
 * A mouse reads wherever it points and takes the crosshair with it when it leaves. A finger reads
 * only what it meant to: a tap pins the day, a sideways drag reads along the line — and a scroll that
 * merely starts on the chart (the browser takes it: pointercancel) leaves nothing behind (M1-03).
 */
const touching = ref(false)

function read(event: PointerEvent): void {
    byKeyboard.value = false
    const svg = event.currentTarget as SVGElement
    const box = svg.getBoundingClientRect()
    const px = event.clientX - box.left - M.left
    const index = Math.round(geometry.value.x.invert(px))

    active.value = Math.min(props.points.length - 1, Math.max(0, index))
}

function onDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
        read(event)
    } else {
        touching.value = true
    }
}

function onMove(event: PointerEvent): void {
    if (event.pointerType === 'mouse' || touching.value) {
        read(event)
    }
}

function onUp(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' && touching.value) {
        touching.value = false
        read(event)
    }
}

function onCancel(): void {
    touching.value = false
    active.value = null
}

function onLeave(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
        active.value = null
    }
}

/* The first arrow says the last day (Home the first); after that, day by day (M1-11). */
function onKey(event: KeyboardEvent): void {
    const n = props.points.length
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, Home: -n, End: n }
    const step = moves[event.key]

    if (step === undefined) {
        return
    }

    event.preventDefault()
    byKeyboard.value = true
    active.value = active.value === null ? (event.key === 'Home' ? 0 : n - 1) : Math.min(n - 1, Math.max(0, active.value + step))
}
</script>

<template>
    <div ref="el" class="lc">
        <!-- Drawn at the measured width; between two measurements (a rail being dragged) the drawing
             scales down into its box rather than past it — letterboxed, never overflowing. -->
        <svg
            class="lc__svg"
            :width="width"
            :height="height"
            :viewBox="`0 0 ${width} ${height}`"
            preserveAspectRatio="xMinYMin meet"
            role="group"
            :aria-label="`${label}. Mit den Pfeiltasten von Tag zu Tag.`"
            tabindex="0"
            focusable="true"
            @pointerdown="onDown"
            @pointermove="onMove"
            @pointerup="onUp"
            @pointercancel="onCancel"
            @pointerleave="onLeave"
            @keydown="onKey"
            @blur="active = null"
        >
            <g :transform="`translate(${M.left},${M.top})`">
                <g class="lc__grid" aria-hidden="true">
                    <template v-for="tick in geometry.ticks" :key="tick.value">
                        <line :x1="0" :x2="geometry.innerW" :y1="tick.y" :y2="tick.y" />
                        <text class="lc__tick" :x="-12" :y="tick.y" dy="0.32em" text-anchor="end">{{ tick.label }}</text>
                    </template>
                    <text v-for="label in geometry.xLabels" :key="label.x" class="lc__tick" :x="label.x" :y="geometry.innerH + 20" :text-anchor="label.anchor">
                        {{ label.label }}
                    </text>
                </g>

                <path v-if="geometry.previous" class="lc__previous" :d="geometry.previous" aria-hidden="true" />
                <path class="lc__line" :class="{ 'lc__line--draw': drawIn }" :d="geometry.path" pathLength="1" aria-hidden="true" />

                <g v-if="geometry.last && !hovered" aria-hidden="true">
                    <circle class="lc__marker" :cx="geometry.last.x" :cy="geometry.last.y" r="4" />
                    <text class="lc__value" :x="geometry.last.x" :y="geometry.last.y - 12" text-anchor="end">{{ geometry.last.text }}</text>
                </g>

                <g v-if="hovered" aria-hidden="true">
                    <line class="lc__cross" :x1="hovered.x" :x2="hovered.x" :y1="0" :y2="geometry.innerH" />
                    <circle class="lc__marker" :cx="hovered.x" :cy="hovered.y" r="4" />
                </g>

                <rect :width="geometry.innerW" :height="geometry.innerH" fill="transparent" />
            </g>
        </svg>

        <div v-if="hovered" ref="tip" class="lc__tip" :style="{ left: `${tipLeft}px`, top: `${M.top}px` }" aria-hidden="true">
            <span class="lc__tip-date">{{ hovered.point.label }}</span>
            <span class="lc__tip-value">{{ money(hovered.point.value) }}</span>
            <span class="lc__tip-orders">{{ orders(hovered.point.orders) }}</span>
            <span v-if="hovered.previous" class="lc__tip-prev">Vorzeitraum: {{ money(hovered.previous.value) }}</span>
        </div>

        <span class="visually-hidden" role="status">{{ announcement }}</span>
    </div>
</template>

<style scoped>
/* The plot's height is the token's; the drawing is measured to it. */
.lc {
    position: relative;
    width: 100%;
    height: var(--adm-plot-h);
}

/* A finger drawn sideways reads the line; drawn up or down it scrolls the page. */
.lc__svg {
    display: block;
    width: 100%;
    overflow: visible;
    outline: none;
    touch-action: pan-y;
}

/* The panel's one focus ring — not the row marker, which is for rows. */
.lc__svg:focus-visible {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

.lc__grid line {
    stroke: var(--chart-grid);
    stroke-width: 1px;
    shape-rendering: crispEdges;
}

.lc__tick {
    fill: var(--chart-text);
    font-size: var(--fs-micro);
    font-variant-numeric: tabular-nums;
}

.lc__line,
.lc__previous {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.lc__line {
    stroke: var(--chart-accent);
    stroke-width: 2px;
}

/* The previous period: 1 px, dotted, in the strong line colour — beside the story, never over it. */
.lc__previous {
    stroke: var(--c-line-2);
    stroke-width: 1px;
    stroke-dasharray: 0 3;
}

/* The line draws itself once, 300 ms, on the first paint (BRIEF-2 §4). */
.lc__line--draw {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: lc-draw 300ms var(--ease-out) forwards;
}

@keyframes lc-draw {
    to {
        stroke-dashoffset: 0;
    }
}

.lc__marker {
    fill: var(--chart-accent);
    stroke: var(--c-surface);
    stroke-width: 2px;
}

/* A halo of the card's own colour, so the line running under the last value never crosses its
   figures (M1-14). */
.lc__value {
    fill: var(--c-ink);
    stroke: var(--c-surface);
    stroke-width: 4px;
    stroke-linejoin: round;
    paint-order: stroke;
    font-size: var(--fs-micro);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}

.lc__cross {
    stroke: var(--c-ink-3);
    stroke-width: 1px;
    shape-rendering: crispEdges;
}

.lc__tip {
    position: absolute;
    z-index: var(--z-raised);
    display: grid;
    gap: 2px;
    padding: var(--sp-8) var(--sp-12);
    border-radius: var(--r-control);
    background: var(--c-ink);
    color: var(--c-surface);
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    pointer-events: none;
}


.lc__tip-value {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 600;
}

.lc__tip-prev {
    color: var(--c-line-2);
}

@media (prefers-reduced-motion: reduce) {
    .lc__line--draw {
        animation: none;
        stroke-dasharray: none;
        stroke-dashoffset: 0;
    }
}
</style>
