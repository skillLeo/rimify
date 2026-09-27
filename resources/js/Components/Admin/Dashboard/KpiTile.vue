<script setup lang="ts">
/**
 * One figure on the Übersicht: its label, the value in tabular figures, the change against the
 * named previous period, and a 40 px curve of the same measure — and the whole tile is the link to
 * the list that shows exactly what it counts.
 *
 * What the figure counts is one sentence: it appears beside the label on hover, and when the tile
 * takes the keyboard's focus, and a screen reader hears it with the link (aria-describedby). A
 * tile with nothing to count shows its sentence where the number would be — never a zero that reads
 * like a result.
 *
 * The change is a word and an arrow, never a colour alone: „+12,4 % zum Vorzeitraum“.
 */

import { Link } from '@inertiajs/vue3'
import { TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
import { computed, ref, useId } from 'vue'
import Icon from '../AdminIcon.vue'
import Sparkline from '../Charts/Sparkline.vue'
import type { Kpi } from '../../../types/admin/uebersicht'

const props = defineProps<{ kpi: Kpi; compare: boolean }>()

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


const showsDelta = computed(() => props.compare && props.kpi.delta !== null)
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

            <template v-if="kpi.value !== null">
                <span class="kpi__value">{{ kpi.value }}</span>
                <!-- The figure's second line: one fact about what it counts („älteste seit 74 Tagen“). -->
                <span v-if="kpi.note" class="kpi__meta">{{ kpi.note }}</span>
                <span v-if="showsDelta && kpi.delta" class="kpi__delta" :class="`kpi__delta--${kpi.delta.direction}`">
                    <Icon v-if="kpi.delta.direction !== 'flat'" :name="kpi.delta.direction === 'up' ? 'arrow-up' : 'arrow-down'" :size="16" />
                    {{ kpi.delta.label }}
                </span>
                <span v-else-if="compare && kpi.deltaNote" class="kpi__meta">{{ kpi.deltaNote }}</span>
                <Sparkline v-if="kpi.series.length > 1" class="kpi__spark" :values="kpi.series" />
            </template>
            <!-- Nothing to count: the same tile, its value a dash, the sentence where the second line goes. -->
            <template v-else>
                <span class="kpi__value kpi__value--none" aria-hidden="true">—</span>
                <span class="kpi__empty">{{ kpi.empty }}</span>
            </template>
        </component>
    </TooltipProvider>
</template>

<style scoped>
/* Label, value, the second line, the change — and the curve at the bottom, level across a row. */
.kpi {
    display: flex;
    flex-direction: column;
    gap: var(--sp-8);
    min-height: 152px;
    padding: var(--sp-20);
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
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

.kpi__delta,
.kpi__meta {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-4);
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    font-variant-numeric: tabular-nums;
}

.kpi__delta--up {
    color: var(--c-ok);
}

.kpi__delta--down {
    color: var(--c-bad);
}

.kpi__delta--flat,
.kpi__meta {
    color: var(--c-ink-3);
}

.kpi__spark {
    margin-top: auto;
}

/* No figure: a dash in the value's own place and size, quiet — the row keeps its shape. */
.kpi__value--none {
    color: var(--c-ink-3);
}

.kpi__empty {
    max-width: 28ch;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-2);
}

@media (prefers-reduced-motion: reduce) {
    .kpi--link,
    .kpi__go {
        transition: none;
    }
}
</style>
