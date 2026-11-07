<script setup lang="ts">
/**
 * Gutachten › one draft: the five steps (the Gutachten rework, Phase 2) — Gutachten, Felge, Fahrzeuge, Reifen, Freigeben — in one
 * order that never changes, every change saved as it happens. The address carries the step and the car, so a step can be sent as a
 * link; coming back without one resumes where this browser left off, else at the first thing still open. Leaving while something
 * typed is on its way waits for it, and a link or Back only goes on once the server holds it; a reload asks first.
 */

import { router, usePage } from '@inertiajs/vue3'
import { computed, onBeforeUnmount, onMounted, provide, watch } from 'vue'
import AdminPage, { type AdminPageAction } from '../../../Components/Admin/AdminPage.vue'
import StepBar from '../../../Components/Ui/StepBar.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { claimPopstateGuard } from '../../../composables/admin/popstateGuard'
import type { AdminGutachtenShowProps } from '../../../types/admin/gutachten'
import { ENTRY, STEPS, createEntryStore, type EntryView } from './Erfassung/entryStore'
import StepCars from './Erfassung/StepCars.vue'
import StepPaper from './Erfassung/StepPaper.vue'
import StepRelease from './Erfassung/StepRelease.vue'
import StepTyres from './Erfassung/StepTyres.vue'
import StepWheel from './Erfassung/StepWheel.vue'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminGutachtenShowProps & {
    entry: EntryView
    /** The step the address names, from 1; null when it names none. */
    schritt: number | null
    /** The car the address names. */
    zeile: number | null
    /** The step the paper's data says is next, from 1. */
    weiter: number
}>()

const page = usePage()
const STORE_KEY = `rimify-erfassung-${props.document.id}`

const store = createEntryStore({
    documentId: props.document.id,
    entry: props.entry,
    step: (props.schritt ?? props.weiter) - 1,
    car: props.zeile ?? props.entry.cars.find((car) => !car.done)?.id ?? props.entry.cars[0]?.id ?? null,
    editable: props.can.edit,
    // Where Back finds it: the page as it opened would bring old values, and the next change would write those.
    remember: (entry) => router.replaceProp('entry', entry),
})
const { state } = store

provide(ENTRY, store)

/* A code described, a fact changed: the page's props are newer than the store's copy. */
watch(() => props.entry, (entry) => {
    state.entry = entry
})

const saving = computed(() => {
    switch (state.save) {
        case 'saving':
            return 'wird gespeichert …'
        case 'failed':
            return 'nicht gespeichert'
        default:
            return 'wird beim Tippen gespeichert'
    }
})

const context = computed(() => `${props.document.statusLabel} · Schritt ${state.step + 1} von ${STEPS.length} · ${saving.value}`)

const more = computed<AdminPageAction[]>(() => (props.document.pdfUrl ? [{ label: 'PDF öffnen', href: props.document.pdfUrl, external: true, icon: 'documents' }] : []))

/* Back has to pass here before Inertia swaps the page: this page goes back under the button while what is owed goes out (useDirtyForm). */
let ownState: unknown = null
let ownUrl = ''
let letThrough = false

function rememberOwn(): void {
    ownState = window.history.state as unknown
    ownUrl = window.location.href
}

function holdBack(event: PopStateEvent): boolean {
    if (letThrough) {
        letThrough = false

        return false
    }

    if (!store.unsaved() || event.state === null || ownState === null) {
        return false
    }

    window.history.pushState(ownState, '', ownUrl)
    void store.settled().then((ok) => {
        if (ok) {
            letThrough = true
            window.history.back()
        }
    })

    return true
}

function askBeforeReload(event: BeforeUnloadEvent): void {
    if (store.unsaved()) {
        event.preventDefault()
        // Older engines only ask when a value is set; the text itself is never shown.
        event.returnValue = ''
    }
}

/* Back online: whatever could not be sent goes now. */
function tryAgain(): void {
    void store.settled()
}

const unbind: (() => void)[] = []

onMounted(() => {
    rememberOwn()
    window.addEventListener('beforeunload', askBeforeReload)
    window.addEventListener('online', tryAgain)
    unbind.push(
        claimPopstateGuard(holdBack),
        router.on('navigate', rememberOwn),
        router.on('success', rememberOwn),
        // A link away waits for what is owed. The page's own reloads and saves go through.
        router.on('before', (event) => {
            const visit = event.detail.visit

            if (visit.method !== 'get' || visit.async || visit.prefetch || visit.url.pathname === window.location.pathname || !store.unsaved()) {
                return
            }

            event.preventDefault()
            void store.settled().then((ok) => {
                if (ok) {
                    router.visit(visit.url.href)
                }
            })
        }),
    )

    // Back where this browser left off, unless the address names a step.
    if (props.schritt === null) {
        try {
            const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null') as { step?: number; car?: number } | null

            if (saved !== null && typeof saved.step === 'number' && saved.step <= store.furthest()) {
                state.step = saved.step
            }

            if (saved !== null && typeof saved.car === 'number' && store.car(saved.car) !== undefined) {
                state.carId = saved.car
            }
        } catch {
            // Storage refused or unreadable: the paper's own next step stands.
        }
    }

    watch(
        () => [state.step, state.carId] as const,
        ([step, car]) => {
            const url = new URL(window.location.href)

            url.searchParams.set('schritt', String(step + 1))

            if (step === 3 && car !== null) {
                url.searchParams.set('zeile', String(car))
            } else {
                url.searchParams.delete('zeile')
            }

            // Through Inertia, or Back would restore the address the page opened with, and its step (useEtRechner).
            router.replace({
                url: url.pathname + url.search + url.hash,
                preserveScroll: true,
                preserveState: true,
                props: (current) => ({ ...current, schritt: step + 1, zeile: step === 3 ? car : null }),
            })

            try {
                localStorage.setItem(STORE_KEY, JSON.stringify({ step, car }))
            } catch {
                // A private window may refuse storage; the address still carries the step.
            }
        },
        { immediate: true },
    )
})

onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', askBeforeReload)
    window.removeEventListener('online', tryAgain)
    unbind.forEach((off) => off())
})

const releaseError = computed(() => ((page.props.errors ?? {}) as Record<string, string | undefined>).release ?? '')
</script>

<template>
    <AdminPage :title="document.label" :context="context" :more="more" :read-only="!can.edit">
        <StepBar class="ef-page__steps" :steps="STEPS" :current="state.step" :reached="store.furthest()" label="Schritte zum Gutachten" @go="store.go" />

        <p class="visually-hidden" aria-live="polite">Schritt {{ state.step + 1 }} von {{ STEPS.length }}: {{ STEPS[state.step] }}</p>
        <p v-if="releaseError && state.step !== 4" class="adm-alert" role="alert">{{ releaseError }}</p>

        <StepPaper v-if="state.step === 0" />
        <StepWheel v-else-if="state.step === 1" />
        <StepCars v-else-if="state.step === 2" />
        <StepTyres v-else-if="state.step === 3" />
        <StepRelease v-else />
    </AdminPage>
</template>

<style scoped>
.ef-page__steps {
    margin-bottom: var(--sp-24);
}
</style>

<style>
/* Shared by the five steps; every class starts with `ef-`. */
.ef-step {
    min-width: 0;
}

/* The field the keyboard is in stands clear of the bar that stays in sight. */
.ef-step :is(input, select, textarea, button) {
    scroll-margin-block: calc(var(--adm-topbar-h) + var(--sp-16));
}

.ef-step > .adm-section__title + .adm-note {
    margin-top: var(--sp-4);
}

/* Each step's one action stays in sight, as the admin's save bar does (admin-shell §8.3). */
.ef-actions {
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

/* A step's own bar runs the page's width, the height of the admin's save bar, with its buttons. */
.ef-step > .ef-actions {
    min-height: var(--adm-topbar-h);
    margin-inline: calc(-1 * var(--adm-page-pad));
    padding: var(--sp-4) var(--adm-page-pad);
}

.adm .ef-step > .ef-actions .btn {
    min-height: var(--adm-control-h-lg);
}

.ef-actions__note {
    margin: 0;
}

.ef-actions__why {
    font-size: var(--fs-small);
}

/* On a phone the bar stands above the admin's bottom navigation, and what is pressed is a thumb wide (DIRECTION §6). */
@media (max-width: 767px) {
    .ef-actions {
        bottom: calc(var(--bottomnav-h) + env(safe-area-inset-bottom));
    }

    .ef-link,
    .ef-iconbtn,
    .ef-more__summary,
    .ef-side__tab {
        min-height: var(--adm-control-h-lg);
    }

    .ef-link {
        display: inline-flex;
        align-items: center;
    }
}

.ef-actions__left {
    margin-right: auto;
}

/* A fold in the steps: smaller than the block headings around it, its marker our own. */
.ef-more {
    border-top: 1px solid var(--c-line);
    padding-top: var(--sp-12);
}

.ef-more__summary {
    display: flex;
    align-items: center;
    gap: var(--sp-8);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 600;
    list-style: none;
    cursor: pointer;
}

.ef-more__summary::-webkit-details-marker {
    display: none;
}

.ef-more__marker {
    flex: none;
    transition: transform var(--d-1) var(--ease-std);
}

.ef-more[open] > .ef-more__summary .ef-more__marker {
    transform: rotate(90deg);
}

@media (prefers-reduced-motion: reduce) {
    .ef-more__marker {
        transition: none;
    }
}

.ef-more__body {
    display: grid;
    gap: var(--sp-16);
    margin-top: var(--sp-16);
}

.ef-optional {
    font-weight: 400;
    color: var(--c-ink-3);
}

.ef-fieldset {
    margin: 0;
    padding: 0;
    border: 0;
}

.ef-fieldset > legend {
    padding: 0;
}

/* Floated, a legend is an ordinary item of its fieldset's grid: it stops straddling the edge of a band. */
.ef-printed > legend {
    float: left;
}

/* A chip that is a radio shows the keyboard's focus on the chip; the radio itself is hidden. */
.ef-step .adm-chip:has(:focus-visible),
.ef-popover .adm-chip:has(:focus-visible) {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

.ef-step .form-field__error:empty {
    display: none;
}

/* A code as a short tag; its text on hover and in the panel, never printed in full in a row (screen 11). */
.ef-code {
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

.ef-code--open {
    border-color: var(--c-warn-tint);
    background: var(--c-warn-tint);
}

.ef-warn {
    display: flex;
    gap: var(--sp-8);
    align-items: flex-start;
    margin: var(--sp-4) 0 0;
    color: var(--c-ink);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.ef-warn::before {
    content: '';
    flex: none;
    width: 8px;
    height: 8px;
    margin-top: 6px;
    border-radius: var(--r-round);
    background: var(--c-warn);
}

.ef-link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--c-blue);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
}

.ef-count {
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    font-variant-numeric: tabular-nums;
}

.ef-side__title {
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 600;
    line-height: var(--lh-small);
}

.ef-progress {
    height: 4px;
    border-radius: var(--r-round);
    background: var(--c-line);
    overflow: hidden;
}

.ef-progress__bar {
    display: block;
    height: 100%;
    background: var(--c-blue);
}

/* What the paper prints for its wheel, and how it differs from the size chosen (a warning, never a block). */
.ef-printed {
    display: grid;
    gap: var(--sp-12);
    padding: var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-band);
}

.ef-printed__grid {
    display: grid;
    gap: var(--sp-12);
    grid-template-columns: repeat(auto-fit, minmax(min(100%, calc(30 * var(--ch-text))), 1fr));
}

.ef-wheel__list {
    margin: 0;
    padding-left: var(--sp-24);
}

.ef-file {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
    margin: 0 0 var(--sp-8);
}

.ef-file__meta {
    color: var(--c-ink-2);
    font-size: var(--fs-small);
}

.ef-more__title {
    margin: 0 0 var(--sp-8);
    font-size: var(--fs-body);
    line-height: var(--lh-body);
}

.ef-more__section {
    display: grid;
    gap: var(--sp-8);
}

.ef-columns {
    display: grid;
    gap: var(--sp-12);
    grid-template-columns: repeat(auto-fit, minmax(min(100%, calc(18 * var(--ch-text))), 1fr));
}

.ef-columns__wide {
    grid-column: 1 / -1;
}

.ef-blockers {
    display: grid;
    gap: var(--sp-8);
    max-width: var(--adm-form-max);
    margin-top: var(--sp-24);
    padding: var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-band);
}

.ef-blockers__title {
    margin: 0;
    font-weight: 600;
}

.ef-blockers .ef-link {
    justify-self: start;
    font-size: var(--fs-small);
}

.ef-blockers__list {
    margin: 0;
    padding-left: var(--sp-24);
    list-style: disc;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    overflow-wrap: anywhere;
}
</style>
