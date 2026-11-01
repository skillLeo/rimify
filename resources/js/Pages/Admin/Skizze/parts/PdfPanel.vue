<script setup lang="ts">
/**
 * The paper beside the form (the brief §7 step 4): page, zoom, and the page number the editor can take over. In the
 * sketch a placeholder stands where the PDF will — its Verwendungsbereich rows and the code texts on their pages — and
 * says so. The real panel shows the uploaded PDF in the browser's own viewer, driven by these controls (Phase 0 §9).
 */

import { computed, ref } from 'vue'
import Icon from '../../../../Components/Admin/AdminIcon.vue'
import { withUnit } from '../../../../format'
import { CODES, PAGE_TITLES, PAPER, PRINTED_ONLY, PRINTED_ROWS } from '../gutachtenDemo'
import { useSketch } from '../gutachtenStore'

const store = useSketch()
const { state } = store

const zoom = ref(100)
const ZOOMS = [75, 100, 125, 150]

const rows = computed(() => PRINTED_ROWS[state.pdfPage] ?? [])

/* The type of the car group being entered: its rows on the page are marked, a Gutachten excerpt with the car's row picked out. */
const current = computed(() => store.group(state.cell)?.type ?? null)

/* The codes this page prints, from the recorded list and from the ones nobody has described yet. */
const codes = computed(() => [
    ...CODES.filter((code) => code.page === state.pdfPage && code.text !== null).map((code) => ({ code: code.code, text: code.text ?? '' })),
    ...Object.entries(PRINTED_ONLY).filter(([, printed]) => printed.page === state.pdfPage).map(([code, printed]) => ({ code, text: printed.text })),
])

const heading = computed(() => PAGE_TITLES[state.pdfPage] ?? (codes.value.length ? 'Auflagen und Hinweise' : `Seite ${state.pdfPage}`))

function page(to: number, field?: HTMLInputElement): void {
    state.pdfPage = Number.isFinite(to) ? Math.max(1, Math.min(PAPER.pages, Math.round(to))) : state.pdfPage

    if (field !== undefined) {
        field.value = String(state.pdfPage)
    }
}

function zoomBy(step: number): void {
    const at = ZOOMS.indexOf(zoom.value)

    zoom.value = ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, at + step))] ?? 100
}
</script>

<template>
    <section class="sk-pdf" aria-label="Gutachten-PDF">
        <div class="sk-pdf__bar">
            <span class="sk-pdf__file" :title="PAPER.file">
                <Icon name="documents" :size="16" />
                <span class="sk-pdf__name">{{ PAPER.file }}</span>
            </span>
            <span class="sk-pdf__pages">
                <button class="sk-pdf__btn" type="button" aria-label="Vorherige Seite" :disabled="state.pdfPage <= 1" @click="page(state.pdfPage - 1)">
                    <Icon name="chevron-left" :size="16" />
                </button>
                <label class="visually-hidden" for="sk-pdf-page">Seite</label>
                <input id="sk-pdf-page" class="input sk-pdf__page" type="number" step="1" min="1" :max="PAPER.pages" :value="state.pdfPage" @change="page(Number(($event.target as HTMLInputElement).value), $event.target as HTMLInputElement)">
                <span class="sk-count">/ {{ PAPER.pages }}</span>
                <button class="sk-pdf__btn" type="button" aria-label="Nächste Seite" :disabled="state.pdfPage >= PAPER.pages" @click="page(state.pdfPage + 1)">
                    <Icon name="chevron-right" :size="16" />
                </button>
            </span>
            <span class="sk-pdf__zoom">
                <button class="sk-pdf__btn" type="button" aria-label="Verkleinern" :disabled="zoom === ZOOMS[0]" @click="zoomBy(-1)"><Icon name="minus" :size="16" /></button>
                <span class="sk-count sk-pdf__pct">{{ withUnit(zoom, '%') }}</span>
                <button class="sk-pdf__btn" type="button" aria-label="Vergrößern" :disabled="zoom === ZOOMS[ZOOMS.length - 1]" @click="zoomBy(1)"><Icon name="plus" :size="16" /></button>
            </span>
        </div>

        <div class="sk-pdf__view">
            <article class="sk-sheet" :style="{ '--zoom': zoom / 100 }">
                <p class="sk-sheet__mark">Platzhalter · hier steht im echten Ablauf das PDF</p>
                <header class="sk-sheet__head">
                    <span>TÜV AUSTRIA · {{ PAPER.supplement.replace('Nachtrag ', '') }}</span>
                    <span>Seite {{ state.pdfPage }} von {{ PAPER.pages }}</span>
                </header>
                <h3 class="sk-sheet__title">{{ heading }}</h3>

                <table v-if="rows.length" class="sk-sheet__table">
                    <thead>
                        <tr>
                            <th class="sk-sheet__type">Typ</th>
                            <th>Betriebs­erlaubnis</th>
                            <th class="sk-sheet__kw">kW</th>
                            <th>Reifen</th>
                            <th>Auflagen zu Reifen</th>
                        </tr>
                    </thead>
                    <tbody v-for="row in rows" :key="row.type" :class="{ 'sk-sheet__rows--on': row.type === current }">
                        <tr class="sk-sheet__group"><td colspan="5">{{ row.group }}</td></tr>
                        <tr v-for="(tyre, index) in row.tyres" :key="tyre.size">
                            <td>{{ index === 0 ? row.type : '' }}</td>
                            <td>{{ index === 0 ? row.approval : '' }}</td>
                            <td>{{ index === 0 ? row.kw : '' }}</td>
                            <td>{{ tyre.size }}</td>
                            <td>{{ tyre.codes }}</td>
                        </tr>
                        <tr><td colspan="5" class="sk-sheet__general"><strong>Auflagen:</strong> {{ row.general }}</td></tr>
                    </tbody>
                </table>

                <dl v-else-if="codes.length" class="sk-sheet__codes">
                    <div v-for="entry in codes" :key="entry.code">
                        <dt>{{ entry.code }}</dt>
                        <dd>{{ entry.text }}</dd>
                    </div>
                </dl>

                <div v-else class="sk-sheet__lines" aria-hidden="true">
                    <span v-for="n in 14" :key="n" class="sk-sheet__line" :style="{ width: `${60 + ((n * 37) % 40)}%` }" />
                </div>
            </article>
        </div>
    </section>
</template>

<style scoped>
.sk-pdf {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    min-width: 0;
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
    background: var(--c-band);
    overflow: hidden;
}

.sk-pdf__bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8) var(--sp-12);
    padding: var(--sp-8) var(--sp-12);
    border-bottom: 1px solid var(--c-line);
    background: var(--c-surface);
    font-size: var(--fs-small);
}

.sk-pdf__file {
    display: inline-flex;
    flex: 1 1 140px;
    align-items: center;
    gap: var(--sp-4);
    min-width: 0;
    font-weight: 600;
}

.sk-pdf__name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.sk-pdf__pages,
.sk-pdf__zoom {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-4);
}

.sk-pdf__page {
    width: 56px;
    height: 32px;
    padding-inline: var(--sp-8);
    text-align: center;
}

.sk-pdf__pct {
    min-width: 44px;
    text-align: center;
}

.sk-pdf__btn {
    display: inline-grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: 1px solid var(--c-line-2);
    border-radius: var(--r-control);
    background: var(--c-surface);
    color: var(--c-ink);
    cursor: pointer;
}

.sk-pdf__btn:disabled {
    color: var(--c-ink-3);
    cursor: default;
}

.sk-pdf__btn:not(:disabled):active {
    background: var(--c-band);
}

@media (hover: hover) and (pointer: fine) {
    .sk-pdf__btn:not(:disabled):hover {
        border-color: var(--c-ink-3);
    }
}

.sk-pdf__view {
    max-height: 760px;
    padding: var(--sp-16);
    overflow: auto;
}

/* 100 % is the panel's width; zoomed in, the page grows and the panel scrolls, as a PDF viewer does. */
.sk-sheet {
    width: calc(100% * var(--zoom, 1));
    max-width: none;
    min-height: 640px;
    margin-inline: auto;
    padding: var(--sp-24);
    background: var(--c-surface);
    box-shadow: var(--e-1);
    color: var(--c-ink);
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
}

.sk-sheet__mark {
    margin: 0 0 var(--sp-12);
    padding: var(--sp-4) var(--sp-8);
    border-radius: var(--r-control);
    background: var(--c-warn-tint);
    font-weight: 600;
    text-align: center;
}

.sk-sheet__head {
    display: flex;
    justify-content: space-between;
    gap: var(--sp-8);
    padding-bottom: var(--sp-8);
    border-bottom: 1px solid var(--c-line);
    color: var(--c-ink-2);
}

.sk-sheet__title {
    margin: var(--sp-12) 0;
    font-size: var(--fs-small);
}

.sk-sheet__table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    overflow-wrap: break-word;
    hyphens: auto;
}

.sk-sheet__type,
.sk-sheet__kw {
    width: 15%;
}

.sk-sheet__rows--on td {
    background: var(--c-blue-tint);
}

.sk-sheet__table th,
.sk-sheet__table td {
    padding: var(--sp-4);
    border: 1px solid var(--c-line);
    text-align: left;
    vertical-align: top;
}

.sk-sheet__table th {
    background: var(--c-band);
    font-weight: 600;
}

.sk-sheet__group td {
    background: var(--c-band);
    font-weight: 600;
}

.sk-sheet__codes {
    display: grid;
    gap: var(--sp-8);
    margin: 0;
}

.sk-sheet__codes div {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr);
    gap: var(--sp-8);
}

.sk-sheet__codes dt {
    font-weight: 700;
}

.sk-sheet__codes dd {
    margin: 0;
}

.sk-sheet__lines {
    display: grid;
    gap: var(--sp-12);
    margin-top: var(--sp-16);
}

.sk-sheet__line {
    display: block;
    height: 8px;
    border-radius: var(--r-control);
    background: var(--c-band);
}
</style>
