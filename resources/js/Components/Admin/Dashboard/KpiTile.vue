<script setup lang="ts">
/**
 * One figure on the Übersicht: its label, the figure and its unit in tabular figures (money through
 * num.ts's formatMoney, from minor units: `59.748,00 €`), exactly one line under it, and a 40 px curve
 * of the same measure — and the whole tile is the link to the list that shows what it counts.
 *
 * Zero is a figure: `0,00 €`, `0`. A dash stands only where no figure can be computed (an average of no
 * orders), and the line under it says why. The line is the change against the previous period — an
 * arrow and a sign in ink, never a colour alone — or one fact about the figure.
 *
 * What the figure counts is one sentence: it appears beside the label on hover, and when the tile
 * takes the keyboard's focus, and a screen reader hears it with the link (aria-describedby).
 */

import { Link } from '@inertiajs/vue3'
import { TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
import { computed, ref, useId } from 'vue'
import Icon from '../AdminIcon.vue'
import Sparkline from '../Charts/Sparkline.vue'
import { NNBSP, formatMoney, formatNumber } from '../../../lib/num'
import type { Kpi } from '../../../types/admin/uebersicht'

const props = defineProps<{ kpi: Kpi }>()

/**
 * The figure and its unit, written by num.ts — money from minor units with its cents, `59.748,00 €`
 * — and parted only at the no-break space, so the unit can be set smaller without being retyped.
 */
const parts = computed<{ figure: string; unit: string | null } | null>(() => {
    const value = props.kpi.value

    if (value === null) {
        return null
    }

    if (props.kpi.unit !== 'EUR') {
        return { figure: formatNumber(value), unit: null }
    }

    const [figure = '', unit = ''] = formatMoney(value).split(NNBSP)

    return { figure, unit: `${NNBSP}${unit}` }
})

const hintId = useId()

/*
 * The hint shows while the tile has the focus or a mouse is over its label or over the hint itself
 * (WCAG 1.4.13: hoverable, persistent), and Esc puts it away until the next time. A finger's tap
 * opens nothing: touch fakes a hover that would never leave.
 */
const hovered = ref(false)
const hoveringHint = ref(false)
const focused = ref(false)
const dismissed = ref(false)

const hintOpen = computed(() => (hovered.value || hoveringHint.value || focused.value) && !dismissed.value)

function onPointer(event: PointerEvent, over: boolean): void {
    if (event.pointerType !== 'mouse') {
        return
    }

    hovered.value = over

    if (!over && !focused.value) {
        dismissed.value = false
    }
}

function onFocus(on: boolean): void {
    focused.value = on

    if (!on) {
        dismissed.value = false
    }
}

const arrow = computed(() => (props.kpi.sub.kind === 'delta' && props.kpi.sub.direction !== 'flat' ? (props.kpi.sub.direction === 'up' ? 'arrow-up' : 'arrow-down') : null))
</script>

<template>
    <TooltipProvider :delay-duration="200">
        <component
            :is="kpi.href ? Link : 'div'"
            :href="kpi.href ?? undefined"
            class="kpi"
            :class="{ 'kpi--link': kpi.href, 'kpi--empty': kpi.value === null }"
            :aria-describedby="hintId"
            @focus="onFocus(true)"
            @blur="onFocus(false)"
            @keydown.esc="dismissed = true"
        >
            <span class="kpi__head">
                <TooltipRoot :open="hintOpen">
                    <TooltipTrigger as-child>
                        <span class="kpi__label" @pointerenter="onPointer($event, true)" @pointerleave="onPointer($event, false)">
                            {{ kpi.label }}
                            <Icon class="kpi__info" name="info" :size="16" />
                        </span>
                    </TooltipTrigger>
                    <TooltipPortal>
                        <TooltipContent
                            class="adm-tooltip kpi__tooltip"
                            side="top"
                            align="start"
                            :side-offset="6"
                            @pointerenter="hoveringHint = true"
                            @pointerleave="hoveringHint = false"
                            @escape-key-down="dismissed = true"
                        >
                            {{ kpi.hint }}
                        </TooltipContent>
                    </TooltipPortal>
                </TooltipRoot>
                <Icon v-if="kpi.href" class="kpi__go" name="arrow-right" :size="16" />
            </span>
            <!-- The tile's description, read once: hidden from the link's name, still named by aria-describedby. -->
            <span :id="hintId" class="visually-hidden" aria-hidden="true">{{ kpi.hint }}</span>

            <span v-if="parts" class="kpi__value">{{ parts.figure }}<span v-if="parts.unit" class="kpi__unit">{{ parts.unit }}</span></span>
            <!-- No figure can be computed: a dash in its place and size, and the line says why. -->
            <span v-else class="kpi__value kpi__value--none"><span aria-hidden="true">—</span><span class="visually-hidden">keine Zahl</span></span>

            <!-- Exactly one line: the change, a fact, or the reason. -->
            <span class="kpi__sub" :class="[`kpi__sub--${kpi.sub.kind}`, kpi.sub.direction ? `kpi__sub--${kpi.sub.direction}` : null]">
                <Icon v-if="arrow" :name="arrow" :size="16" />
                {{ kpi.sub.text }}
            </span>

            <Sparkline v-if="kpi.series.length > 1" class="kpi__spark" :values="kpi.series" />
        </component>
    </TooltipProvider>
</template>

<style scoped>
/* Label, figure, its one line — and the curve at the bottom, level across a row (the row's grid
   stretches the tiles to one height; a tile has no minimum of its own). */
.kpi {
    display: flex;
    flex-direction: column;
    gap: var(--sp-8);
    padding: var(--adm-card-pad);
    border: 1px solid var(--c-line);
    border-radius: var(--r-tile);
    background: var(--c-surface);
    color: var(--c-ink);
    text-decoration: none;
}

.kpi--link {
    transition: border-color var(--d-1) var(--ease-out);
}

@media (hover: hover) and (pointer: fine) {
    .kpi--link:hover {
        border-color: var(--c-line-2);
    }

    .kpi--link:hover .kpi__go {
        color: var(--c-ink);
    }
}

.kpi--link:focus-visible {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

.kpi__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-8);
}

.kpi__label {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-4);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 500;
    color: var(--c-ink-2);
}

.kpi__info {
    color: var(--c-ink-3);
}

.kpi__go {
    flex: none;
    color: var(--c-ink-3);
    transition: color var(--d-1) var(--ease-out);
}

.kpi__tooltip {
    max-width: 32ch;
}

.kpi__value {
    font-size: var(--fs-h3);
    line-height: var(--lh-h3);
    font-weight: 700;
    font-stretch: var(--wdth-display);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

/* The unit beside the figure (after its no-break space), smaller and quieter: the number is read. */
.kpi__unit {
    font-size: var(--fs-small);
    font-weight: 600;
    font-stretch: var(--wdth-text);
    color: var(--c-ink-2);
}

.kpi__sub {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-4);
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    font-variant-numeric: tabular-nums;
    color: var(--c-ink-3);
}

/* A change: the arrow and the sign carry it, in ink — up is not „good“ for every figure. */
.kpi__sub--delta {
    font-weight: 600;
    color: var(--c-ink-2);
}

.kpi__sub--up {
    color: var(--delta-up);
}

.kpi__sub--down {
    color: var(--delta-down);
}

.kpi__spark {
    margin-top: auto;
}

/* No figure: a dash in the value's own place and size, quiet — the row keeps its shape. */
.kpi__value--none {
    color: var(--c-ink-3);
}

@media (prefers-reduced-motion: reduce) {
    .kpi--link,
    .kpi__go {
        transition: none;
    }
}
</style>
