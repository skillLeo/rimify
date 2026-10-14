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

const props = withDefaults(
    defineProps<{
        detail: FitmentDetailView
        /** `BMW 1er-Reihe 1K4`, for the heading. */
        vehicleLabel: string
        /**
         * Sentences the verdict above already says — the papers' line, „Eintragung in die Fahrzeugpapiere erforderlich.“
         * — are not listed again (the client's #21): said once, in the verdict; the document's own wording explains it.
         */
        omit?: string[]
    }>(),
    { omit: () => [] }
)

const TODO = ['Abnahme', 'Arbeiten am Fahrzeug', 'Befestigung', 'Reifen']

/* What there is to do, in order; a section the bolts or the sizes need stands even without a sentence of its kind. */
const todo = computed(() => TODO
    .map((title) => ({ title, groups: grouped(props.detail.sections.find((s) => s.title === title)?.items ?? []) }))
    .filter((section) => section.groups.length > 0
        || (section.title === 'Befestigung' && props.detail.fasteners.length > 0)
        || (section.title === 'Reifen' && props.detail.tyres.length > 0)))

const notes = computed(() => grouped(props.detail.sections.find((s) => s.title === 'Hinweise')?.items ?? []))

/* A sentence the document hangs off some sizes only says which, as a limit (D-04): „Nur bei 235/35 R19 und 255/30 R19“. */
function forSizes(sizes: string[] | undefined): string | null {
    if (!sizes?.length) {
        return null
    }

    return `Nur bei ${sizes.length === 1 ? sizes[0] : `${sizes.slice(0, -1).join(', ')} und ${sizes[sizes.length - 1]}`}`
}

/*
 * Within a section, a list of its own for what holds for every size — labelled as such where size-limited sentences
 * follow — and one list per set of sizes under its „Nur bei …“: never one list in which two sizes' Auflagen stand side
 * by side (ABE 55255, BMW X3 X83: fine-link chains with 235/45R19 and 245/40R19, no chains with 255/40R19).
 */
type Item = FitmentDetailView['sections'][number]['items'][number]

function grouped(listed: Item[]): { key: string; label: string | null; items: Item[] }[] {
    const items = listed.filter((i) => !props.omit.includes(i.text))
    const all = items.filter((i) => !i.sizes?.length && !i.own)
    // Our own kW-band sentence names its sizes in its own words: never under „Für jede zulässige Reifengröße“.
    const own = items.filter((i) => !i.sizes?.length && i.own)
    const bySizes = new Map<string, Item[]>()

    for (const item of items.filter((i) => i.sizes?.length)) {
        const label = forSizes(item.sizes) ?? ''
        bySizes.set(label, [...(bySizes.get(label) ?? []), item])
    }

    return [
        ...(all.length ? [{ key: 'all', label: bySizes.size > 0 ? 'Für jede zulässige Reifengröße' : null, items: all }] : []),
        ...(own.length ? [{ key: 'own', label: null, items: own }] : []),
        ...[...bySizes.entries()].map(([label, list]) => ({ key: label, label, items: list })),
    ]
}

/* RIMIFY's own sentences (the kW band) are marked, so the lede's „Wörtlich“ stays true (D-10). */
const hasOwn = computed(() => props.detail.sections.some((s) => s.items.some((i) => i.own)))

/* „nur bis Nachtrag 03“ names the car's type approval, not this document (D-08): said once, under the sets. */
const namesNachtrag = computed(() => props.detail.fasteners.some((f) => /Nachtrag/.test(f.limit ?? '')))

/*
 * The documents' wording as printed (the client's #21): the page arranges the Auflagen and says the Eintragung once, in
 * the verdict; what the Gutachten says stays one click away, unarranged and with nothing left out. Closed by default — a
 * native disclosure, so it opens without script.
 *
 * One thing stays with a sentence here too: the sizes its document hangs it off. The Gutachten says that with a code
 * beside the size; we show no codes, so without the label two sizes' sentences would read as one tyre's — fine-link
 * chains and no chains at all (SWEEP-01). What holds for every size first, then a list per set of sizes.
 */
type Printed = NonNullable<FitmentDetailView['original']>[number]

const original = computed(() => props.detail.original ?? [])

const originalGroups = computed(() => {
    const all = original.value.filter((i) => !i.sizes?.length)
    const bySizes = new Map<string, Printed[]>()

    for (const item of original.value.filter((i) => i.sizes?.length)) {
        const label = forSizes(item.sizes) ?? ''
        bySizes.set(label, [...(bySizes.get(label) ?? []), item])
    }

    return [
        ...(all.length ? [{ key: 'all', label: bySizes.size > 0 ? 'Für jede zulässige Reifengröße' : null, items: all }] : []),
        ...[...bySizes.entries()].map(([label, items]) => ({ key: label, label, items })),
    ]
})

const originalBySize = computed(() => originalGroups.value.some((group) => group.label !== null))
</script>

<template>
    <section id="auflagen" class="fdt" aria-labelledby="fdt-h">
        <h2 id="fdt-h" class="h2 fdt__h" tabindex="-1">Was das Gutachten für {{ vehicleLabel }} verlangt</h2>
        <p class="small muted fdt__lede">
            Der Wortlaut des Gutachtens, wie er bei uns hinterlegt ist.<template v-if="hasOwn"> Was mit „Unser Hinweis“ beginnt, kommt von uns.</template>
        </p>

        <div class="fdt__cols">
            <div class="fdt__main">
                <div v-for="section in todo" :key="section.title" class="fdt__sec">
                    <h3 class="h4 fdt__sec-h">{{ section.title }}</h3>
                    <template v-for="group in section.groups" :key="group.key">
                        <p v-if="group.label" class="fdt__for">{{ group.label }}</p>
                        <ul class="fdt__list">
                            <li v-for="item in group.items" :key="item.text">
                                <span v-if="item.own" class="fdt__own">Unser Hinweis: </span>{{ item.text }}
                                <ul v-if="item.measures.length" class="fdt__measures">
                                    <li v-for="measure in item.measures" :key="measure">{{ measure }}</li>
                                </ul>
                            </li>
                        </ul>
                    </template>

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
                            <tr><th scope="col">Größe</th><th scope="col">Achse</th><th scope="col">Motorleistung</th><th scope="col">Mindestens laut Gutachten</th></tr>
                        </thead>
                        <tbody>
                            <tr v-for="size in detail.tyres" :key="size.label">
                                <td data-label="Größe" class="fdt__key fdt__num">{{ size.label }}</td>
                                <td data-label="Achse">{{ size.axle }}</td>
                                <td data-label="Motorleistung" class="fdt__num">{{ size.band ?? '–' }}</td>
                                <td data-label="Mindestens laut Gutachten">{{ size.minimum ?? '–' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div v-if="notes.length || detail.notices.length" class="fdt__side">
                <div v-if="notes.length" class="fdt__sec">
                    <h3 class="h4 fdt__sec-h">Hinweise</h3>
                    <template v-for="group in notes" :key="group.key">
                        <p v-if="group.label" class="fdt__for">{{ group.label }}</p>
                        <ul class="fdt__list fdt__list--note">
                            <li v-for="item in group.items" :key="item.text">
                                <span v-if="item.own" class="fdt__own">Unser Hinweis: </span>{{ item.text }}
                            </li>
                        </ul>
                    </template>
                </div>
                <div v-if="detail.notices.length" class="fdt__sec">
                    <h3 class="h4 fdt__sec-h">Hinweise des Gutachtens</h3>
                    <ul class="fdt__list fdt__list--note">
                        <li v-for="notice in detail.notices" :key="notice">{{ notice }}</li>
                    </ul>
                </div>
            </div>
        </div>

        <details v-if="original.length" class="fdt__original" data-original>
            <summary class="fdt__original-toggle">Originaltext anzeigen</summary>
            <p class="small muted fdt__original-lede">
                Der bei uns hinterlegte Wortlaut des Gutachtens, ohne unsere Gliederung.<template v-if="originalBySize"> Gilt ein Satz nur für bestimmte Reifengrößen, stehen diese Größen direkt darüber.</template>
            </p>
            <template v-for="group in originalGroups" :key="group.key">
                <p v-if="group.label" class="fdt__for">{{ group.label }}</p>
                <ul class="fdt__list fdt__list--note">
                    <li v-for="item in group.items" :key="item.text">
                        {{ item.text }}<span v-if="item.page" class="fdt__page"> (Seite {{ item.page }})</span>
                    </li>
                </ul>
            </template>
        </details>
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

/* Above its own list: one label per set of sizes, the lists apart (ConditionGroups' rule, in the full wording). */
p.fdt__for {
    margin: var(--sp-12) 0 var(--sp-4);
}

.fdt__sec-h + p.fdt__for {
    margin-top: 0;
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

/* The wording as printed, below both columns: the check panel's „So haben wir gerechnet“ disclosure, in the same blue. */
.fdt__original {
    margin-top: var(--sp-32);
    padding-top: var(--sp-16);
    border-top: 1px solid var(--line-s);
}

.fdt__original-toggle {
    cursor: pointer;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-blue);
    text-decoration: underline;
    text-underline-offset: 2px;
}

.fdt__original-toggle:focus-visible {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

/* Under a finger the toggle is a 44 px row, as every other control. */
@media (pointer: coarse) {
    .fdt__original-toggle {
        display: flex;
        align-items: center;
        min-height: 44px;
    }
}

.fdt__original-lede {
    margin: var(--sp-8) 0 0;
}

.fdt__page {
    color: var(--c-ink-3);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
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
