<script setup lang="ts">
/**
 * H8 v2 — the Felgenrechner's teaser on the homepage (home-overhaul §3.2). The compact input
 * row, the clearance drawing, the three results with the one tolerance light, the link to the
 * full tool carrying the current comparison, and the sentence that says the Gutachten decides.
 *
 * Two layouts, one component, chosen by the page: `desktop` puts the two fieldsets side by side
 * and the drawing beside the results; `phone` puts Aktuell · Neu as tabs, then the drawing, the
 * results and a full-width button. The page supplies the section and the heading; this is the body.
 *
 * The state lives in `useRechner`: on this surface the URL is read on mount (the homepage does
 * not carry `?rechner=` as a prop) and written on every valid change, so the address bar is
 * always a share link and the *Zum vollständigen Felgenrechner* link carries the same figures.
 */

import { Link } from '@inertiajs/vue3'
import ClearanceDrawing from '../Ui/ClearanceDrawing.vue'
import FitmentCalculator from './FitmentCalculator.vue'
import FitmentResults from './FitmentResults.vue'
import { useRechner } from '../../composables/useRechner'
import { DISCLAIMER, type CalculatorPrefill } from '../../lib/rechner'
import type { VehicleProp } from '../../types/rimify'

export type TeaserLayout = 'desktop' | 'phone'

const props = withDefaults(
    defineProps<{
        prefill?: CalculatorPrefill | null
        /** The shared vehicle, named in the prefill note; the note needs both a vehicle and a prefill. */
        vehicle?: VehicleProp | null
        layout?: TeaserLayout
    }>(),
    { prefill: null, vehicle: null, layout: 'desktop' }
)

const { state, shown, href, prefillNote, fromVehicle, update, setValid } = useRechner({
    prefill: () => props.prefill,
    vehicle: () => props.vehicle,
    readUrl: true,
    writeUrl: true,
})
</script>

<template>
    <div class="teaser" :class="`teaser--${layout}`">
        <div class="grid teaser__grid">
            <div class="teaser__form">
                <FitmentCalculator
                    :model-value="state"
                    :layout="layout === 'phone' ? 'tabs' : 'row'"
                    :prefilled="fromVehicle"
                    @update:model-value="update"
                    @update:valid="setValid"
                />
                <p v-if="prefillNote" class="small quiet teaser__prefill">Vorbelegt mit der Serienbereifung deines {{ prefillNote }}.</p>
            </div>

            <ClearanceDrawing class="calc-drawing teaser__drawing" :current="state.current" :next="state.next" />

            <FitmentResults class="teaser__results" :result="shown" />

            <div class="teaser__foot">
                <Link :href="href" :class="layout === 'phone' ? 'btn btn--secondary btn--block' : 'link'" prefetch>
                    Zum vollständigen Felgenrechner
                </Link>
                <p class="small muted teaser__disclaimer">{{ DISCLAIMER }}</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.teaser__grid {
    row-gap: var(--sp-40);
    align-items: start;
}

.teaser__form,
.teaser__drawing,
.teaser__results,
.teaser__foot {
    grid-column: 1 / -1;
    min-width: 0;
}

.teaser__form {
    display: grid;
    gap: var(--sp-12);
}

.teaser__foot {
    display: grid;
    gap: var(--sp-12);
    justify-items: start;
    margin-top: calc(var(--sp-24) - var(--sp-40));
}

.teaser--phone .teaser__foot {
    justify-items: stretch;
}

.teaser__disclaimer {
    max-width: 54ch;
    hyphens: auto;
}

/* ── 768–1023: the results as three columns under the drawing ───────────────── */

@media (min-width: 768px) {
    .teaser--desktop .teaser__results {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--gutter);
    }

    .teaser--desktop .teaser__results :deep(.calc-result + .calc-result) {
        padding-left: var(--sp-16);
        border-left: 1px solid var(--c-line);
    }
}

/* ── ≥ 1024: the drawing in columns 1–6, the results in 7–12 ───────────────── */

@media (min-width: 1024px) {
    .teaser--desktop .teaser__drawing {
        grid-column: 1 / span 6;
    }

    .teaser--desktop .teaser__results {
        grid-column: 7 / span 6;
        grid-template-columns: none;
        gap: 0;
    }

    .teaser--desktop .teaser__results :deep(.calc-result + .calc-result) {
        padding-left: 0;
        border-left: 0;
    }

    /* The foot sits under the drawing, in its columns, so the results column sets the height. */
    .teaser--desktop .teaser__foot {
        grid-column: 1 / span 6;
        margin-top: calc(var(--sp-24) - var(--sp-40));
    }
}
</style>
