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
 * The change is a word and an arrow, never a colour alone: „+12,4 % vs. Vorperiode“.
 */

import { Link } from '@inertiajs/vue3'
import { TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
import { computed, ref, useId } from 'vue'
import Icon from '../../Ui/Icon.vue'
import Sparkline from '../Charts/Sparkline.vue'
import type { Kpi } from '../../../types/admin/uebersicht'

const props = defineProps<{ kpi: Kpi; compare: boolean }>()

const hintId = useId()
const hintOpen = ref(false)

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
            @focus="hintOpen = true"
            @blur="hintOpen = false"
        >
            <span class="kpi__head">
                <TooltipRoot :open="hintOpen">
                    <TooltipTrigger as-child>
                        <span class="kpi__label" @mouseenter="hintOpen = true" @mouseleave="hintOpen = false">
                            {{ kpi.label }}
                            <Icon class="kpi__info" name="info" :size="16" />
                        </span>
                    </TooltipTrigger>
                    <TooltipPortal>
                        <TooltipContent class="adm-tooltip kpi__tooltip" side="top" align="start" :side-offset="6">{{ kpi.hint }}</TooltipContent>
                    </TooltipPortal>
                </TooltipRoot>
                <Icon v-if="kpi.href" class="kpi__go" name="arrow-right" :size="16" />
            </span>
            <span :id="hintId" class="visually-hidden">{{ kpi.hint }}</span>

            <template v-if="kpi.value !== null">
                <span class="kpi__value">{{ kpi.value }}</span>
                <span v-if="showsDelta && kpi.delta" class="kpi__delta" :class="`kpi__delta--${kpi.delta.direction}`">
                    <Icon v-if="kpi.delta.direction !== 'flat'" :name="kpi.delta.direction === 'up' ? 'chevron-up' : 'chevron-down'" :size="16" />
                    {{ kpi.delta.label }}
                </span>
                <span v-else-if="compare && kpi.deltaNote" class="kpi__meta">{{ kpi.deltaNote }}</span>
                <span v-else-if="kpi.note" class="kpi__meta">{{ kpi.note }}</span>
                <Sparkline v-if="kpi.series.length > 1" class="kpi__spark" :values="kpi.series" />
            </template>
            <span v-else class="kpi__empty">{{ kpi.empty }}</span>
        </component>
    </TooltipProvider>
</template>

<style scoped>
.kpi {
    display: grid;
    grid-template-rows: auto auto auto 1fr;
    align-content: start;
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
    align-self: end;
}

.kpi__empty {
    align-self: center;
    max-width: 28ch;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

@media (prefers-reduced-motion: reduce) {
    .kpi--link,
    .kpi__go {
        transition: none;
    }
}
</style>
