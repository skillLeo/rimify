<script setup lang="ts">
/**
 * The paper beside the form (the Gutachten rework §7 step 4; D-389): the uploaded PDF in the browser's own viewer, on our own
 * address for the CSP, driven by our page control through `#page=N` — no pdf.js. „Aktuelle PDF-Seite übernehmen“ takes our
 * control's number: a page scrolled to inside the viewer goes unseen, and the viewer says so by keeping our number.
 */

import { computed, ref } from 'vue'
import Icon from '../../../../Components/Admin/AdminIcon.vue'
import { withUnit } from '../../../../format'
import { useEntry, useGutachtenPage } from './entryStore'

const { state } = useEntry()
const page = useGutachtenPage()

/* null: the page's width fits the column — an A4 at 100 % is 794 px in a column of 336. `view` is what Chrome reads, `zoom` what Firefox does. */
const zoom = ref<number | null>(null)
const ZOOMS = [50, 75, 100, 125, 150]

const pages = computed(() => page.props.document.pageCount)
const src = computed(() => (page.props.document.hasPdf ? `/admin/gutachten/${state.documentId}/pdf#page=${state.pdfPage}&${zoom.value === null ? 'view=FitH&zoom=FitH' : `zoom=${zoom.value}`}` : null))

function go(to: number, field?: HTMLInputElement): void {
    const top = pages.value ?? Number.MAX_SAFE_INTEGER

    state.pdfPage = Number.isFinite(to) ? Math.max(1, Math.min(top, Math.round(to))) : state.pdfPage

    if (field !== undefined) {
        field.value = String(state.pdfPage)
    }
}

function zoomBy(step: number): void {
    // From „Breite“ the next figure up or down from the middle.
    const at = zoom.value === null ? (step > 0 ? 0 : 1) : ZOOMS.indexOf(zoom.value)

    zoom.value = ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, at + step))] ?? null
}
</script>

<template>
    <section class="ef-pdf" aria-label="Gutachten-PDF">
        <div class="ef-pdf__bar">
            <span class="ef-pdf__pages">
                <button class="ef-pdf__btn" type="button" aria-label="Vorherige Seite" :disabled="state.pdfPage <= 1" @click="go(state.pdfPage - 1)">
                    <Icon name="chevron-left" :size="16" />
                </button>
                <label class="visually-hidden" for="ef-pdf-page">Seite</label>
                <input id="ef-pdf-page" class="input ef-pdf__page" type="text" inputmode="numeric" :value="state.pdfPage" @change="go(Number(($event.target as HTMLInputElement).value), $event.target as HTMLInputElement)">
                <span v-if="pages" class="ef-count">/ {{ pages }}</span>
                <button class="ef-pdf__btn" type="button" aria-label="Nächste Seite" :disabled="pages !== null && state.pdfPage >= pages" @click="go(state.pdfPage + 1)">
                    <Icon name="chevron-right" :size="16" />
                </button>
            </span>
            <span class="ef-pdf__zoom">
                <button class="ef-pdf__btn" type="button" aria-label="Verkleinern" :disabled="zoom === ZOOMS[0]" @click="zoomBy(-1)"><Icon name="minus" :size="16" /></button>
                <button class="ef-count ef-pdf__pct" type="button" :aria-label="zoom === null ? 'Passt auf die Spaltenbreite' : 'Auf die Spaltenbreite einpassen'" :disabled="zoom === null" @click="zoom = null">{{ zoom === null ? 'Breite' : withUnit(zoom, '%') }}</button>
                <button class="ef-pdf__btn" type="button" aria-label="Vergrößern" :disabled="zoom === ZOOMS[ZOOMS.length - 1]" @click="zoomBy(1)"><Icon name="plus" :size="16" /></button>
            </span>
            <a v-if="src" class="ef-pdf__btn ef-pdf__open" :href="page.props.document.pdfUrl ?? undefined" target="_blank" rel="noopener" aria-label="PDF in neuem Tab öffnen" title="PDF in neuem Tab öffnen"><Icon name="documents" :size="16" /></a>
        </div>

        <div class="ef-pdf__view">
            <iframe v-if="src" :key="zoom ?? 'breite'" class="ef-pdf__frame" :src="src" title="Gutachten-PDF" />
            <p v-else class="adm-note">Noch kein PDF hinterlegt. Lad es in Schritt 1 hoch.</p>
        </div>
    </section>
</template>

<style scoped>
.ef-pdf {
    display: grid;
    gap: var(--sp-8);
    min-width: 0;
}

.ef-pdf__bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
}

.ef-pdf__pages,
.ef-pdf__zoom {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-4);
}

.ef-pdf__btn {
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

.ef-pdf__btn:disabled {
    border-color: transparent;
    background: var(--c-band);
    color: var(--c-ink-3);
    cursor: default;
}

@media (hover: hover) and (pointer: fine) {
    .ef-pdf__btn:not(:disabled):hover {
        border-color: var(--c-ink);
    }

    .ef-pdf__pct:not(:disabled):hover {
        color: var(--c-ink);
        text-decoration: underline;
    }
}

.ef-pdf__page {
    width: calc(5 * var(--ch-text));
    min-height: 32px;
    padding-inline: var(--sp-8);
    text-align: center;
}

.ef-pdf__pct {
    min-width: calc(6 * var(--ch-text));
    min-height: 32px;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    font-size: var(--fs-small);
    text-align: center;
    cursor: pointer;
}

.ef-pdf__pct:disabled {
    cursor: default;
}

.ef-pdf__open {
    margin-left: auto;
}

.ef-pdf__view {
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
    background: var(--c-band);
    overflow: hidden;
}

.ef-pdf__frame {
    display: block;
    width: 100%;
    height: 72vh;
    border: 0;
}

@media (max-width: 767px) {
    .ef-pdf__frame {
        height: 50vh;
    }
}
</style>
