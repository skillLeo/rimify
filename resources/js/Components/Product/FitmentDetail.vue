<script setup lang="ts">
/**
 * What the Gutachten asks of the chosen car, in full and in the order it is done (Block D, item 15): Abnahme,
 * Arbeiten am Fahrzeug with the millimetres its document prints for this Fahrzeugtyp, Befestigung with the bolt
 * set and its torque, Reifen with each size's axle, band and printed minimum, Hinweise, then the document's own
 * notes. Every line is a sentence of the answer's documents.
 *
 * Full width below the purchase: a Nachtrag gives one car forty sentences, and the check panel beside the photo
 * keeps its overview and the buy button where they are (the panel links here).
 */

import { computed } from 'vue'
import type { FitmentDetailView } from '../../types/pages'

const props = defineProps<{
    detail: FitmentDetailView
    /** `BMW 1er-Reihe 1K4`, for the heading. */
    vehicleLabel: string
}>()

const ORDER = ['Abnahme', 'Arbeiten am Fahrzeug', 'Befestigung', 'Reifen', 'Hinweise']

/* A section the bolts or the sizes need is there even when no sentence of that kind is. */
const sections = computed(() => {
    const out = props.detail.sections
        .filter((section) => section.items.length > 0)

    for (const [title, needed] of [['Befestigung', props.detail.fasteners.length > 0], ['Reifen', props.detail.tyres.length > 0]] as const) {
        if (needed && !out.some((section) => section.title === title)) {
            out.push({ title, items: [] })
        }
    }

    return out.sort((a, b) => ORDER.indexOf(a.title) - ORDER.indexOf(b.title))
})
</script>

<template>
    <section id="auflagen" class="fdt" aria-labelledby="fdt-h">
        <h2 id="fdt-h" class="t-h2 fdt__h">Was das Gutachten für deinen {{ vehicleLabel }} verlangt</h2>
        <p class="t-small quiet fdt__lede">Im Wortlaut des Gutachtens, in der Reihenfolge, in der es erledigt wird.</p>

        <div class="fdt__grid">
            <section v-for="section in sections" :key="section.title" class="fdt__sec" :aria-label="section.title">
                <h3 class="fdt__sec-h">{{ section.title }}</h3>
                <ul v-if="section.items.length" class="fdt__list">
                    <li v-for="item in section.items" :key="item.text">
                        {{ item.text }}
                        <ul v-if="item.measures.length" class="fdt__measures">
                            <li v-for="measure in item.measures" :key="measure" class="data">{{ measure }}</li>
                        </ul>
                    </li>
                </ul>
                <ul v-if="section.title === 'Befestigung' && detail.fasteners.length" class="fdt__bolts">
                    <li v-for="bolt in detail.fasteners" :key="`${bolt.label}${bolt.torque}${bolt.limit}`">
                        <span class="data">{{ bolt.label }}</span>
                        <span v-if="bolt.torque"> · Anzugsmoment <span class="data">{{ bolt.torque }}</span></span>
                        <span v-if="bolt.article" class="quiet"> · {{ bolt.article }}</span>
                        <span v-if="bolt.limit" class="quiet"> · {{ bolt.limit }}</span>
                    </li>
                </ul>
                <ul v-if="section.title === 'Reifen' && detail.tyres.length" class="fdt__sizes">
                    <li v-for="size in detail.tyres" :key="size.label">
                        <span class="data">{{ size.label }}</span>
                        <span class="quiet"> · {{ size.axle }}</span>
                        <span v-if="size.band" class="quiet"> · <span class="data">{{ size.band }}</span></span>
                        <span v-if="size.minimum" class="quiet"> · {{ size.minimum }}</span>
                    </li>
                </ul>
            </section>

            <section v-if="detail.notices.length" class="fdt__sec" aria-label="Hinweise des Gutachtens">
                <h3 class="fdt__sec-h">Hinweise des Gutachtens</h3>
                <ul class="fdt__list fdt__list--quiet">
                    <li v-for="notice in detail.notices" :key="notice">{{ notice }}</li>
                </ul>
            </section>
        </div>
    </section>
</template>

<style scoped>
.fdt {
    margin-top: var(--sp-48);
}

.fdt__h {
    margin: 0;
    text-wrap: balance;
}

.fdt__lede {
    margin: var(--sp-8) 0 0;
}

/* Two columns on the desk, one on the phone: the sentences keep a readable measure either way. */
.fdt__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 30rem), 1fr));
    gap: var(--sp-24) var(--sp-48);
    margin-top: var(--sp-24);
}

.fdt__sec-h {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 700;
    color: var(--c-ink);
}

.fdt__list,
.fdt__measures,
.fdt__bolts,
.fdt__sizes {
    display: grid;
    gap: var(--sp-8);
    margin: var(--sp-8) 0 0;
    padding-left: var(--sp-16);
    max-width: 72ch;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink);
}

.fdt__measures {
    gap: var(--sp-4);
    margin-top: var(--sp-4);
}

.fdt__list--quiet {
    color: var(--c-ink-2);
}
</style>
