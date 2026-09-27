<script setup lang="ts">
/**
 * Part of a whole, over weeks (BRIEF §5: part of a whole → a stacked bar). One column per week, the
 * series stacked in their fixed order and colours (the categorical palette; colour follows the
 * series, never the rank). Columns are 24 px at most; touching segments are parted by a 2 px gap in
 * the surface colour, never a stroke; only the top of a column is rounded, its base stays square.
 *
 * The legend names every series in words. Pointing at a column, or moving with the arrow keys,
 * shows that week's numbers. Columns grow from the baseline once, on the first paint.
 */

import { scaleBand, scaleLinear } from 'd3-scale'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { decimal } from '../../../format'
import type { VerdictChart } from '../../../types/admin/uebersicht'
import { mayAnimate, useWidth } from './useWidth'

/* loading: the legend as it will be — it wraps as the chart's will — above a skeleton of the plot's
   height: the chart's own size before its weeks arrive. */
const props = withDefaults(defineProps<{ chart: VerdictChart; height?: number; label: string; loading?: boolean }>(), { height: 240, loading: false })

const M = { top: 12, right: 8, bottom: 28, left: 44 }
const GAP = 2
const RADIUS = 4
const MAX_BAR = 24
/** What one week label ("KW 38") needs on the axis, with air on either side. */
const LABEL_ROOM = 44
/** The room between the column and its tip. */
const TIP_GAP = 16

const { el, width } = useWidth(360)
const active = ref<number | null>(null)
const growIn = ref(false)

onMounted(() => {
    growIn.value = mayAnimate()
})

/** A rectangle whose top corners are rounded and whose base is square. */
function column(x: number, y: number, w: number, h: number, rounded: boolean): string {
    const r = rounded ? Math.min(RADIUS, w / 2, h) : 0

    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`
}

const geometry = computed(() => {
    const innerW = Math.max(40, width.value - M.left - M.right)
    const innerH = props.height - M.top - M.bottom
    const weeks = props.chart.weeks
    const max = Math.max(1, ...weeks.map((w) => w.total))

    const x = scaleBand<string>().domain(weeks.map((w) => w.key)).range([0, innerW]).paddingInner(0.4).paddingOuter(0.2)
    const y = scaleLinear().domain([0, max]).range([innerH, 0]).nice(4)
    const barW = Math.min(MAX_BAR, x.bandwidth())

    const columns = weeks.map((week, index) => {
        const left = (x(week.key) ?? 0) + (x.bandwidth() - barW) / 2
        const segments: { key: string; d: string; fill: string }[] = []
        let base = 0
        const present = props.chart.series.filter((s) => (week.values[s.key] ?? 0) > 0)

        present.forEach((series, i) => {
            const value = week.values[series.key] ?? 0
            const top = y(base + value)
            const bottom = y(base) - (i > 0 ? GAP : 0)
            const seriesIndex = props.chart.series.findIndex((s) => s.key === series.key)

            segments.push({
                key: series.key,
                d: column(left, top, barW, Math.max(0, bottom - top), i === present.length - 1),
                fill: colour(series.key, seriesIndex),
            })
            base += value
        })

        return { key: week.key, index, left, center: left + barW / 2, segments, label: week.label }
    })

    // A label every so many weeks that a week label never touches the next one (a year: about every fourth).
    const every = Math.max(1, Math.ceil(LABEL_ROOM / Math.max(1, x.step())))

    return {
        innerW,
        innerH,
        barW,
        columns,
        every,
        ticks: y.ticks(4).map((value) => ({ value, y: y(value), label: decimal(value, 0) })),
        band: x.bandwidth(),
    }
})

/*
 * A verdict wears the verdict's own colour, the one the shop shows it in — Freigegeben green, Mit
 * Auflagen amber, Nicht freigegeben red, Unbekannt grey — never a chart colour that means nothing
 * there. Any other series takes the categorical palette.
 */
const VERDICT_COLOURS: Record<string, string> = {
    PERMITTED: 'var(--c-ok)',
    CONDITIONAL: 'var(--c-warn)',
    NOT_PERMITTED: 'var(--c-bad)',
    UNKNOWN: 'var(--c-unk)',
}

function colour(key: string, index: number): string {
    return VERDICT_COLOURS[key] ?? `var(--chart-cat-${index + 1})`
}

const hovered = computed(() => {
    if (active.value === null) {
        return null
    }

    const week = props.chart.weeks[active.value]
    const col = geometry.value.columns[active.value]

    if (!week || !col) {
        return null
    }

    return { week, left: M.left + col.center }
})

/* The tip right of the column where it fits, else left of it, never past the chart's edge. */
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

/* Said aloud only when the keyboard moved it. */
const byKeyboard = ref(false)

function onLeave(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
        active.value = null
    }
}

const announcement = computed(() => {
    if (!hovered.value || !byKeyboard.value) {
        return ''
    }

    const { week } = hovered.value

    return `${week.label}, ${week.range}: ` + props.chart.series.map((s) => `${s.label} ${week.values[s.key] ?? 0}`).join(', ')
})

function onMove(event: PointerEvent): void {
    byKeyboard.value = false
    const box = (event.currentTarget as SVGElement).getBoundingClientRect()
    const px = event.clientX - box.left - M.left
    let nearest = 0
    let distance = Infinity

    geometry.value.columns.forEach((col, i) => {
        const d = Math.abs(col.center - px)

        if (d < distance) {
            distance = d
            nearest = i
        }
    })

    active.value = nearest
}

function onKey(event: KeyboardEvent): void {
    const n = props.chart.weeks.length
    const step = { ArrowLeft: -1, ArrowRight: 1, Home: -n, End: n }[event.key]

    if (step === undefined) {
        return
    }

    event.preventDefault()
    byKeyboard.value = true
    active.value = Math.min(n - 1, Math.max(0, (active.value ?? n - 1) + step))
}
</script>

<template>
    <div class="sb">
        <ul class="sb__legend">
            <li v-for="(series, i) in chart.series" :key="series.key" class="sb__key">
                <span class="sb__swatch" :style="{ background: colour(series.key, i) }" aria-hidden="true" />
                {{ series.label }}
            </li>
        </ul>

        <span v-if="loading" class="skeleton sb__skeleton" :style="{ height: `${height}px` }" aria-hidden="true" />

        <div v-else ref="el" class="sb__plot" :style="{ height: `${height}px` }">
            <!-- Drawn at the measured width; between two measurements (a rail being dragged) the drawing
                 scales down into its box rather than past it — letterboxed, never overflowing. -->
            <svg
                class="sb__svg"
                :width="width"
                :height="height"
                :viewBox="`0 0 ${width} ${height}`"
                preserveAspectRatio="xMinYMin meet"
                role="group"
                :aria-label="`${label}. Mit den Pfeiltasten von Woche zu Woche.`"
                tabindex="0"
                @pointerdown="onMove"
                @pointermove="onMove"
                @pointerleave="onLeave"
                @keydown="onKey"
                @blur="active = null"
            >
                <g :transform="`translate(${M.left},${M.top})`">
                    <g class="sb__grid" aria-hidden="true">
                        <template v-for="tick in geometry.ticks" :key="tick.value">
                            <line :x1="0" :x2="geometry.innerW" :y1="tick.y" :y2="tick.y" />
                            <text class="sb__tick" :x="-10" :y="tick.y" dy="0.32em" text-anchor="end">{{ tick.label }}</text>
                        </template>
                    </g>

                    <g
                        v-for="(col, i) in geometry.columns"
                        :key="col.key"
                        class="sb__column"
                        :class="{ 'sb__column--grow': growIn, 'sb__column--dim': hovered && active !== i }"
                        aria-hidden="true"
                    >
                        <path v-for="segment in col.segments" :key="segment.key" :d="segment.d" :fill="segment.fill" />
                        <text v-if="i % geometry.every === 0" class="sb__tick" :x="col.center" :y="geometry.innerH + 20" text-anchor="middle">{{ col.label }}</text>
                    </g>
                </g>
            </svg>

            <div v-if="hovered" ref="tip" class="sb__tip" :style="{ left: `${tipLeft}px` }" aria-hidden="true">
                <span class="sb__tip-week">{{ hovered.week.label }} · {{ hovered.week.range }}</span>
                <span v-for="(series, i) in chart.series" :key="series.key" class="sb__tip-row">
                    <span class="sb__swatch" :style="{ background: colour(series.key, i) }" />
                    {{ series.label }}
                    <strong>{{ decimal(hovered.week.values[series.key] ?? 0, 0) }}</strong>
                </span>
            </div>

            <span class="visually-hidden" role="status">{{ announcement }}</span>
        </div>
    </div>
</template>

<style scoped>
.sb {
    display: grid;
    gap: var(--sp-12);
}

.sb__skeleton {
    display: block;
}

.sb__legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-4) var(--sp-16);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-2);
}

.sb__key {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.sb__swatch {
    display: inline-block;
    flex: none;
    width: 10px;
    height: 10px;
    border-radius: var(--r-control);
}

.sb__plot {
    position: relative;
}

/* A finger drawn sideways reads the weeks; drawn up or down it scrolls the page. */
.sb__svg {
    display: block;
    width: 100%;
    overflow: visible;
    outline: none;
    touch-action: pan-y;
}

/* The panel's one focus ring — not the row marker, which is for rows. */
.sb__svg:focus-visible {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

.sb__grid line {
    stroke: var(--chart-grid);
    stroke-width: 1px;
    shape-rendering: crispEdges;
}

.sb__tick {
    fill: var(--chart-text);
    font-size: var(--fs-micro);
    font-variant-numeric: tabular-nums;
}

.sb__column {
    transition: opacity var(--d-1) var(--ease-out);
}

.sb__column--dim {
    opacity: 0.45;
}

/* Columns grow from the baseline once, 240 ms, all together: no staggered cascade (DIRECTION §5). */
.sb__column--grow path {
    transform-box: fill-box;
    transform-origin: bottom;
    animation: sb-grow 240ms var(--ease-out) backwards;
}

@keyframes sb-grow {
    from {
        transform: scaleY(0);
    }
}

.sb__tip {
    position: absolute;
    top: 0;
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


.sb__tip-week {
    color: var(--c-line-2);
}

.sb__tip-row {
    display: flex;
    align-items: center;
    gap: 6px;
}

.sb__tip-row strong {
    margin-left: auto;
    padding-left: var(--sp-12);
}

@media (prefers-reduced-motion: reduce) {
    .sb__column,
    .sb__column--grow path {
        transition: none;
        animation: none;
    }
}
</style>
