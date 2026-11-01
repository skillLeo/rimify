<script setup lang="ts">
/**
 * Gutachten › Neues Gutachten, as a sketch (the Gutachten rework brief §7, §11 Phase 1): the five steps — Gutachten, Felge,
 * Fahrzeuge, Reifen, Freigeben — in the admin's own look, filled with the proposal's example and clickable from end to
 * end. Nothing reaches the server: the state lives in this page and in the browser's session, so a reload resumes at the
 * same step and the same cell, as the real draft will. The address carries the step and the cell, so a click path can
 * be sent as a link.
 */

import { computed, onMounted, provide, watch } from 'vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import SketchBanner from '../../../Components/Sketch/SketchBanner.vue'
import SketchSteps from '../../../Components/Sketch/SketchSteps.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { reserveLineIds } from './gutachtenSketch'
import { SKETCH, STEPS, STORAGE_KEY, createStore, initialState, type SketchState } from './gutachtenStore'
import StepCars from './parts/StepCars.vue'
import StepPaper from './parts/StepPaper.vue'
import StepRelease from './parts/StepRelease.vue'
import StepTyres from './parts/StepTyres.vue'
import StepWheel from './parts/StepWheel.vue'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<{
    /** The step the address names, from 1; null when it names none. */
    schritt: number | null
    /** The car group whose cell the address names. */
    zeile: string | null
}>()

const store = createStore((props.schritt ?? 1) - 1, props.zeile ?? 'm3')
const { state } = store

provide(SKETCH, store)

const title = computed(() => (state.step === 0 ? 'Neues Gutachten' : `${state.art} ${state.number}${state.supplement ? ` · ${state.supplement}` : ''}`))
const context = computed(() => (state.released ? 'Freigegeben · in der Skizze' : `Entwurf · Schritt ${state.step + 1} von ${STEPS.length} · wird beim Tippen gespeichert`))

const more = [{ label: 'Skizze zurücksetzen', run: () => reset() }]

/* Resume where the session left off; an address that names a step or a cell wins for those two. */
onMounted(() => {
    try {
        const saved = sessionStorage.getItem(STORAGE_KEY)

        if (saved !== null) {
            const restored = { ...initialState(), ...(JSON.parse(saved) as Partial<SketchState>) }

            Object.assign(state, restored, {
                step: props.schritt === null ? restored.step : props.schritt - 1,
                cell: props.zeile ?? restored.cell,
                reached: Math.max(restored.reached, props.schritt === null ? restored.step : props.schritt - 1),
            })
        }
    } catch {
        // A session that cannot be read starts the sketch afresh.
    }

    reserveLineIds(state.cells)

    // The car group the address names is one taken over in step 3, or the first of them.
    if (!state.groups.includes(state.cell)) {
        state.cell = state.groups[0] ?? 'm3'
    }

    // A released paper opens on its read view.
    if (state.released) {
        state.step = STEPS.length - 1
    }

    watch(
        state,
        () => {
            try {
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
            } catch {
                // Private windows may refuse storage; the sketch still works, it just forgets.
            }
        },
        { deep: true, immediate: true },
    )

    watch(
        () => [state.step, state.cell] as const,
        ([step, cell]) => {
            const url = new URL(window.location.href)

            url.searchParams.set('schritt', String(step + 1))

            if (step === 3) {
                url.searchParams.set('zeile', cell)
            } else {
                url.searchParams.delete('zeile')
            }

            window.history.replaceState(window.history.state, '', url)
        },
        { immediate: true },
    )
})

function reset(): void {
    store.reset()
}
</script>

<template>
    <div class="sk-page">
        <SketchBanner note="So soll das Eintragen eines Gutachtens künftig aussehen. Die Werte stammen aus dem Beispiel des Vorschlags; hier wird nichts gespeichert und nichts freigegeben." />

        <AdminPage :title="title" :context="context" :more="more">
            <SketchSteps class="sk-page__steps" :steps="STEPS" :current="state.step" :reached="state.released ? -1 : Math.min(STEPS.length - 1, state.reached + 1)" label="Schritte zum Gutachten" @go="store.go" />

            <p class="visually-hidden" aria-live="polite">Schritt {{ state.step + 1 }} von {{ STEPS.length }}: {{ STEPS[state.step] }}</p>

            <StepPaper v-if="state.step === 0" />
            <StepWheel v-else-if="state.step === 1" />
            <StepCars v-else-if="state.step === 2" />
            <StepTyres v-else-if="state.step === 3" />
            <StepRelease v-else />
        </AdminPage>
    </div>
</template>

<style scoped>
.sk-page {
    display: grid;
    gap: var(--sp-16);
}

.sk-page__steps {
    margin-bottom: var(--sp-24);
}

</style>

<style>
/* Shared by the five steps of the sketch; every class starts with `sk-`. */
.sk-step {
    min-width: 0;
}

/* Each step's one action stays in sight, as the admin's save bar does (admin-shell §8.3). */
.sk-actions {
    position: sticky;
    bottom: 0;
    z-index: var(--z-sticky);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--sp-8);
    margin-top: var(--sp-32);
    padding-block: var(--sp-12);
    border-top: 1px solid var(--c-line);
    background: var(--c-surface);
}

.sk-actions__left {
    margin-right: auto;
}

.sk-optional {
    font-weight: 400;
    color: var(--c-ink-3);
}

.sk-fieldset {
    margin: 0;
    padding: 0;
    border: 0;
}

.sk-fieldset > legend {
    padding: 0;
}

/* A chip that is a radio shows the keyboard's focus on the chip; the radio itself is hidden. */
.sk-page .adm-chip:has(:focus-visible),
.sk-popover .adm-chip:has(:focus-visible) {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

.sk-step .form-field__error:empty {
    display: none;
}

/* A code as a short tag; its text on hover and in the panel, never printed in full in a row (screen 11). */
.sk-code {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-4);
    height: 24px;
    padding-inline: var(--sp-8);
    border: 1px solid var(--c-line-2);
    border-radius: var(--r-control);
    background: var(--c-surface);
    color: var(--c-ink);
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

.sk-code--open {
    border-color: var(--c-warn);
    background: var(--c-warn-tint);
}

.sk-codes {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-4);
}

.sk-warn {
    display: flex;
    gap: var(--sp-8);
    align-items: flex-start;
    margin: var(--sp-4) 0 0;
    color: var(--c-ink);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.sk-warn::before {
    content: '';
    flex: none;
    width: 8px;
    height: 8px;
    margin-top: 6px;
    border-radius: var(--r-round);
    background: var(--c-warn);
}

.sk-link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--c-blue);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
}

.sk-count {
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    font-variant-numeric: tabular-nums;
}
</style>
