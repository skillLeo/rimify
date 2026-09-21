<script setup lang="ts">
/**
 * /felgenrechner, desktop document (home-overhaul §3.3): the full tool. The compact table of
 * controls with the two summary lines and the share block in the left columns; the clearance
 * drawing, the three results, the full figures and the disclaimer on the right. Between 768 and
 * 1023 the blocks stack in reading order: form, drawing, results as three columns, figures,
 * share block, disclaimer.
 *
 * The comparison arrives from the server: `state` when the address carried `?rechner=`, else the
 * vehicle's original size, else the worked example — so the first paint already shows it. Every
 * valid change is written back to the address, which is what the share field shows.
 */

import { Head, Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import ClearanceDrawing from '../../Components/Ui/ClearanceDrawing.vue'
import FitmentCalculator from '../../Components/Home/FitmentCalculator.vue'
import FitmentResults from '../../Components/Home/FitmentResults.vue'
import RechnerShare from '../../Components/Home/RechnerShare.vue'
import { useRechner } from '../../composables/useRechner'
import { useShared } from '../../composables/useShared'
import { DISCLAIMER, SIDES } from '../../lib/rechner'
import type { FelgenrechnerProps } from '../../types/pages'

defineOptions({ layout: AppLayout })

const props = defineProps<FelgenrechnerProps>()

const shared = useShared()
const vehicle = computed(() => shared.value.vehicle)

const LEAD = 'Rechne aus, wie sich eine neue Felgen- und Reifengröße auf Abrollumfang, Tacho und Freigängigkeit auswirkt.'

const { state, shown, shareParam, prefillNote, fromVehicle, summaries, specs, update, setValid } = useRechner({
    prefill: () => props.prefill,
    vehicle: () => vehicle.value,
    state: props.state,
    writeUrl: true,
})
</script>

<template>
    <Head title="Felgenrechner">
        <meta name="description" :content="LEAD" head-key="description" />
    </Head>

    <section class="section rechner" aria-labelledby="rechner-title">
        <div class="container">
            <nav class="small muted rechner__crumbs" aria-label="Du bist hier">
                <ol class="rechner__crumb-list">
                    <li><Link href="/" class="rechner__crumb" prefetch>Startseite</Link></li>
                    <li aria-current="page">Felgenrechner</li>
                </ol>
            </nav>

            <h1 id="rechner-title" class="h1 rechner__title">Felgenrechner</h1>
            <p class="body-l muted rechner__lead">{{ LEAD }}</p>

            <div class="grid rechner__grid">
                <div class="rechner__left">
                    <div class="rechner__form">
                        <p v-if="prefillNote" class="small quiet rechner__prefill">Vorbelegt mit der Serienbereifung deines {{ prefillNote }}.</p>
                        <FitmentCalculator :model-value="state" layout="table" :prefilled="fromVehicle" @update:model-value="update" @update:valid="setValid" />

                        <!-- Each setup in one line, as a tyre shop would write it. -->
                        <ul class="rechner__summaries" aria-label="Die beiden Größen">
                            <li v-for="side in SIDES" :key="side.key" class="small muted num rechner__summary">
                                <span class="rechner__summary-side">{{ side.label }}:</span> {{ summaries[side.key] }}
                            </li>
                        </ul>
                    </div>

                    <RechnerShare class="rechner__share" :param="shareParam" />
                </div>

                <div class="rechner__right">
                    <ClearanceDrawing class="calc-drawing rechner__drawing" :current="state.current" :next="state.next" />

                    <FitmentResults class="rechner__results" :result="shown" />

                    <dl class="specs small rechner__specs" aria-label="Alle Werte">
                        <template v-for="row in specs" :key="row.key">
                            <dt>{{ row.label }}</dt>
                            <dd class="num">{{ row.value }}</dd>
                        </template>
                    </dl>

                    <p class="small muted rechner__disclaimer">{{ DISCLAIMER }}</p>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.rechner__crumbs {
    margin-bottom: var(--sp-16);
}

.rechner__crumb-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
    margin: 0;
    padding: 0;
    list-style: none;
}

.rechner__crumb-list li + li::before {
    content: '›';
    margin-right: var(--sp-8);
    color: var(--c-ink-3);
}

.rechner__crumb {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
}

@media (hover: hover) and (pointer: fine) {
    .rechner__crumb:hover {
        color: var(--c-ink);
    }
}

.rechner__lead {
    max-width: 54ch;
    margin-top: var(--sp-12);
    hyphens: auto;
}

.rechner__grid {
    row-gap: var(--sp-40);
    margin-top: var(--sp-40);
    align-items: start;
}

/* Below 1024 the two columns dissolve and their blocks take the page grid in reading order. */
.rechner__left,
.rechner__right {
    display: contents;
}

.rechner__form,
.rechner__share,
.rechner__drawing,
.rechner__results,
.rechner__specs,
.rechner__disclaimer {
    grid-column: 1 / -1;
    min-width: 0;
}

.rechner__form {
    order: 1;
    display: grid;
    gap: var(--sp-16);
}

.rechner__drawing {
    order: 2;
}

.rechner__results {
    order: 3;
}

.rechner__specs {
    order: 4;
}

.rechner__share {
    order: 5;
}

.rechner__disclaimer {
    order: 6;
    max-width: 54ch;
    hyphens: auto;
}

.rechner__summaries {
    display: grid;
    gap: var(--sp-4);
    margin: 0;
    padding: 0;
    list-style: none;
}

.rechner__summary {
    overflow-wrap: anywhere;
}

.rechner__summary-side {
    color: var(--c-ink);
    font-weight: 500;
}

/* ── 768–1023: the results as three columns under the drawing ───────────────── */

@media (min-width: 768px) and (max-width: 1023px) {
    .rechner__results {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--gutter);
    }

    .rechner__results :deep(.calc-result + .calc-result) {
        padding-left: var(--sp-16);
        border-left: 1px solid var(--c-line);
    }

    .rechner__results,
    .rechner__specs {
        margin-top: calc(var(--sp-24) - var(--sp-40));
    }
}

/* ── ≥ 1024: form and share in columns 1–5, everything else in 7–12 ─────────── */

@media (min-width: 1024px) {
    .rechner__left,
    .rechner__right {
        display: grid;
        min-width: 0;
    }

    .rechner__left {
        grid-column: 1 / span 5;
        gap: var(--sp-24);
        align-content: start;
    }

    .rechner__right {
        grid-column: 7 / span 6;
        gap: var(--sp-16);
    }

    .rechner__drawing {
        margin-bottom: var(--sp-8);
    }
}
</style>
