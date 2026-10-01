<script setup lang="ts">
/**
 * What the Gutachten asks of the chosen car, in full (Block D, item 15), in the order the Borbet brief §5 sets:
 * Abnahme, Arbeiten am Fahrzeug with the millimetres its document prints for this Fahrzeugtyp, Befestigung with
 * the bolt sets and their torque, Reifen with each size's axle, band and printed minimum — and beside them the
 * notes. Every sentence is the answer's documents' own.
 *
 * Full width below the purchase, on the page's own split: what the customer has to do on the left, what they
 * should know on the right. A Nachtrag gives one car forty sentences; the check panel keeps the overview and the
 * buy button where they are, and links here.
 */

import { computed } from 'vue'
import type { FitmentDetailView } from '../../types/pages'

const props = defineProps<{
    detail: FitmentDetailView
    /** `BMW 1er-Reihe 1K4`, for the heading. */
    vehicleLabel: string
}>()

const TODO = ['Abnahme', 'Arbeiten am Fahrzeug', 'Befestigung', 'Reifen']

/* What there is to do, in order; a section the bolts or the sizes need stands even without a sentence of its kind. */
const todo = computed(() => TODO
    .map((title) => ({ title, items: props.detail.sections.find((s) => s.title === title)?.items ?? [] }))
    .filter((section) => section.items.length > 0
        || (section.title === 'Befestigung' && props.detail.fasteners.length > 0)
        || (section.title === 'Reifen' && props.detail.tyres.length > 0)))

const notes = computed(() => props.detail.sections.find((s) => s.title === 'Hinweise')?.items ?? [])

/* A sentence the document hangs off some sizes only says which, as a limit (D-04): „Nur bei 235/35 R19 und 255/30 R19“. */
function forSizes(sizes: string[] | undefined): string | null {
    if (!sizes?.length) {
        return null
    }

    return `Nur bei ${sizes.length === 1 ? sizes[0] : `${sizes.slice(0, -1).join(', ')} und ${sizes[sizes.length - 1]}`}`
}

/* RIMIFY's own sentences (the kW band) are marked, so the lede's „Wörtlich“ stays true (D-10). */
const hasOwn = computed(() => props.detail.sections.some((s) => s.items.some((i) => i.own)))

/* „nur bis Nachtrag 03“ names the car's type approval, not this document (D-08): said once, under the sets. */
const namesNachtrag = computed(() => props.detail.fasteners.some((f) => /Nachtrag/.test(f.limit ?? '')))
</script>

<template>
    <section id="auflagen" class="fdt" aria-labelledby="fdt-h">
        <h2 id="fdt-h" class="h2 fdt__h" tabindex="-1">Was das Gutachten für {{ vehicleLabel }} verlangt</h2>
        <p class="small muted fdt__lede">
            Wörtlich aus dem Gutachten.<template v-if="hasOwn"> Was mit „Unser Hinweis“ beginnt, kommt von uns.</template>
        </p>

        <div class="fdt__cols">
            <div class="fdt__main">
                <div v-for="section in todo" :key="section.title" class="fdt__sec">
                    <h3 class="h4 fdt__sec-h">{{ section.title }}</h3>
                    <ul v-if="section.items.length" class="fdt__list">
                        <li v-for="item in section.items" :key="item.text">
                            <span v-if="forSizes(item.sizes)" class="fdt__for">{{ forSizes(item.sizes) }}</span>
                            <span v-if="item.own" class="fdt__own">Unser Hinweis: </span>{{ item.text }}
                            <ul v-if="item.measures.length" class="fdt__measures">
                                <li v-for="measure in item.measures" :key="measure">{{ measure }}</li>
                            </ul>
                        </li>
                    </ul>

                    <table v-if="section.title === 'Befestigung' && detail.fasteners.length" class="fdt__table">
                        <thead>
                            <tr><th scope="col">Schraube</th><th scope="col">Anzugsmoment</th><th scope="col">Artikel</th><th scope="col">Gilt</th></tr>
                        </thead>
                        <tbody>
                            <tr v-for="bolt in detail.fasteners" :key="`${bolt.label}${bolt.torque}${bolt.limit}`">
                                <td data-label="Schraube" class="fdt__key"><template v-if="bolt.number">Nr. {{ bolt.number }} · </template>{{ bolt.label }}</td>
                                <td data-label="Anzugsmoment" class="fdt__num">{{ bolt.torque ?? '–' }}</td>
                                <td data-label="Artikel">{{ bolt.article ?? '–' }}</td>
                                <td data-label="Gilt">{{ bolt.limit ?? 'für diesen Typ' }}</td>
                            </tr>
                        </tbody>
                    </table>
                    <p v-if="section.title === 'Befestigung' && namesNachtrag" class="small muted fdt__aside">
                        „Nachtrag“ meint hier den Stand der EG-Typgenehmigung deines Fahrzeugs, nicht den des Gutachtens.
                        Er steht in Feld K der Zulassungsbescheinigung Teil I: die Ziffern nach dem letzten Sternchen, bei
                        …*04 also „04“.
                    </p>

                    <table v-if="section.title === 'Reifen' && detail.tyres.length" class="fdt__table">
                        <thead>
                            <tr><th scope="col">Größe</th><th scope="col">Achse</th><th scope="col">Leistung</th><th scope="col">Mindestens laut Gutachten</th></tr>
                        </thead>
                        <tbody>
                            <tr v-for="size in detail.tyres" :key="size.label">
                                <td data-label="Größe" class="fdt__key fdt__num">{{ size.label }}</td>
                                <td data-label="Achse">{{ size.axle }}</td>
                                <td data-label="Leistung" class="fdt__num">{{ size.band ?? '–' }}</td>
                                <td data-label="Mindestens laut Gutachten">{{ size.minimum ?? '–' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div v-if="notes.length || detail.notices.length" class="fdt__side">
                <div v-if="notes.length" class="fdt__sec">
                    <h3 class="h4 fdt__sec-h">Hinweise</h3>
                    <ul class="fdt__list fdt__list--note">
                        <li v-for="item in notes" :key="item.text">
                            <span v-if="forSizes(item.sizes)" class="fdt__for">{{ forSizes(item.sizes) }}</span>
                            <span v-if="item.own" class="fdt__own">Unser Hinweis: </span>{{ item.text }}
                        </li>
                    </ul>
                </div>
                <div v-if="detail.notices.length" class="fdt__sec">
                    <h3 class="h4 fdt__sec-h">Hinweise des Gutachtens</h3>
                    <ul class="fdt__list fdt__list--note">
                        <li v-for="notice in detail.notices" :key="notice">{{ notice }}</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.fdt {
    margin-top: var(--sp-64);
}

.fdt__h {
    margin: 0;
}

.fdt__lede {
    margin: var(--sp-8) 0 0;
}

/* The page's own split (Produkt/Index.vue .pdp): two independent stacks, one column on a phone. */
.fdt__cols {
    display: grid;
    gap: var(--sp-32);
    margin-top: var(--sp-32);
}

@media (min-width: 900px) {
    .fdt__cols {
        grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
        gap: var(--space-7);
        align-items: start;
    }
}

.fdt__main,
.fdt__side {
    display: grid;
    gap: var(--sp-32);
    align-content: start;
}

.fdt__sec-h {
    margin: 0;
    color: var(--c-ink);
}

/* What the customer has to do: body size, full ink, a readable measure; the notes smaller and quieter. */
.fdt__list {
    display: grid;
    gap: var(--sp-12);
    margin: var(--sp-12) 0 0;
    padding-left: var(--sp-16);
    max-width: 54ch;
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    color: var(--c-ink);
    hyphens: auto;
    text-wrap: pretty;
}

.fdt__list--note {
    gap: var(--sp-8);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

/* Which sizes a sentence belongs to, above it; RIMIFY's own words, marked. */
.fdt__for {
    display: block;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 500;
    color: var(--c-ink-2);
    font-variant-numeric: tabular-nums;
}

.fdt__own {
    font-weight: 500;
}

.fdt__aside {
    margin: var(--sp-8) 0 0;
    max-width: 54ch;
}

.fdt__measures {
    display: grid;
    gap: var(--sp-4);
    margin: var(--sp-8) 0 0;
    padding-left: var(--sp-16);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-variant-numeric: tabular-nums;
    color: var(--c-ink);
}

/* The Felgendetails' hairline rows, as a table: the values line up. */
.fdt__table {
    width: 100%;
    margin-top: var(--sp-12);
    border-collapse: collapse;
    border-top: 1px solid var(--line);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.fdt__table th {
    padding: var(--sp-8) var(--sp-12) var(--sp-8) 0;
    text-align: left;
    font-weight: 500;
    color: var(--c-ink-2);
    border-bottom: 1px solid var(--line-s);
}

.fdt__table td {
    padding: var(--sp-8) var(--sp-12) var(--sp-8) 0;
    vertical-align: top;
    color: var(--c-ink-2);
    border-bottom: 1px solid var(--line-s);
}

.fdt__table .fdt__key {
    font-weight: 500;
    color: var(--c-ink);
}

.fdt__num {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

/* On a phone each row stands as label and value. */
@media (max-width: 767px) {
    .fdt__table thead {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
    }

    .fdt__table tr {
        display: grid;
        gap: var(--sp-4);
        padding-block: var(--sp-8);
        border-bottom: 1px solid var(--line-s);
    }

    .fdt__table td {
        display: grid;
        grid-template-columns: 11em minmax(0, 1fr);
        gap: var(--sp-8);
        padding: 0;
        border: 0;
        white-space: normal;
    }

    .fdt__table td::before {
        content: attr(data-label);
        color: var(--c-ink-2);
    }
}
</style>
