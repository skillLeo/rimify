<script setup lang="ts">
/**
 * The RIMIFY-CHECK panel, at panel density.
 *
 * It ALWAYS names the vehicle. `Passend` on its own is meaningless — the entire claim of this
 * product is that the answer is about one specific car, and a panel that omits the car has thrown
 * that away.
 *
 * Four states, and `UNKNOWN` is not dressed as a refusal: "we hold no document" and "the document
 * does not cover this" are different facts, and only one of them is about the customer's car.
 */

import { router } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import Icon from '../Art/Icon.vue'
import ValueText from '../Ui/ValueText.vue'
import BuildForm from './BuildForm.vue'
import PapersForm from './PapersForm.vue'
import type { IconName } from '../../art'
import type { ConfigVerdict } from '../../types/pages'
import type { VehicleProp } from '../../types/rimify'

const props = defineProps<{
    verdict: ConfigVerdict | null
    vehicle: VehicleProp | null
    /** The size shown: „RIMIFY-Check drucken“ freezes the answer for it and this car. */
    configId?: number | null
}>()

/* „RIMIFY-Check drucken“: the answer frozen whole on the server, then its printable page. */
const issuing = ref(false)

function issueCheck(): void {
    if (props.configId == null || issuing.value) {
        return
    }

    issuing.value = true
    router.post('/rimify-check/ergebnis', { wheelConfigId: props.configId }, {
        onFinish: () => {
            issuing.value = false
        },
    })
}

const tone = computed<{ cls: string; icon: IconName }>(() => {
    if (props.vehicle === null || props.verdict === null) {
        return { cls: 'rcheck-panel--unknown', icon: 'info' }
    }

    switch (props.verdict.status) {
        case 'PERMITTED':
            return { cls: '', icon: 'check-circle' }
        case 'CONDITIONAL':
            return { cls: 'rcheck-panel--warn', icon: 'warning' }
        case 'NOT_PERMITTED':
            return { cls: 'rcheck-panel--danger', icon: 'close' }
        default:
            return { cls: 'rcheck-panel--unknown', icon: 'info' }
    }
})

/*
 * Whether the papers need an entry is only a meaningful sentence about a wheel that may be fitted
 * at all. "Keine Eintragung erforderlich." under "Nicht freigegeben" read as reassurance about a
 * wheel that cannot legally go on the car, entry or not.
 */
const entryLine = computed(() => {
    const verdict = props.verdict

    if (verdict === null || (verdict.status !== 'PERMITTED' && verdict.status !== 'CONDITIONAL')) {
        return null
    }

    return verdict.requiresEntry
        ? 'Eintragung in die Fahrzeugpapiere erforderlich.'
        : 'Keine Eintragung erforderlich.'
})

/* An Auflage that says word for word what the entry line above it says is not said twice. */
const conditions = computed(() => (props.verdict?.conditions ?? []).filter((condition) => condition !== entryLine.value))

/*
 * With the detail (Block D, item 15) the panel gives the overview — what there is to do, section by section —
 * and the sentences stand in full below the purchase (FitmentDetail, #auflagen): a Nachtrag gives one car forty
 * of them, and the buy button stays where the customer decides.
 */
const detail = computed(() => props.verdict?.detail ?? null)

const overview = computed(() => {
    const view = detail.value

    if (view === null) {
        return []
    }

    // What there is to do — the notes are not a task, and the sizes have their own line below.
    const lines: string[] = []
    const items = (title: string): number => view.sections.find((s) => s.title === title)?.items.filter((i) => i.text !== entryLine.value).length ?? 0
    const work = items('Arbeiten am Fahrzeug')
    const first = view.fasteners[0]

    // A size's own work counts only with that size (D-04): „bis zu“ while the size decides.
    const bySize = view.sections.find((s) => s.title === 'Arbeiten am Fahrzeug')?.items.some((i) => i.sizes?.length) ?? false

    if (items('Abnahme') > 0) lines.push('Abnahme beim Prüfer')
    if (work > 0) lines.push(`${bySize ? 'bis zu ' : ''}${work} ${work === 1 ? 'Arbeit' : 'Arbeiten'} am Fahrzeug${bySize ? ', je nach Reifengröße' : ''}`)

    if (first !== undefined) {
        // Which set is the car's is not the customer's choice (D-08): the car decides.
        const more = view.fasteners.length - 1

        lines.push(more > 0
            ? `${first.thread}${first.torque ? ` (${first.torque})` : ''} oder ${more === 1 ? 'ein anderer Schraubensatz' : `einer von ${more} anderen Schraubensätzen`} – welcher, hängt von deinem Fahrzeug ab`
            : `${first.thread}${first.torque ? `, ${first.torque}` : ''}`)
    }

    return lines
})

/* Every size the car may carry, front and rear: a size for the rear axle only is still one of them (D-09). */
const sizes = computed(() => [...new Set([
    ...(props.verdict?.tyreSizesFront ?? props.verdict?.tyreSizes ?? []),
    ...(props.verdict?.tyreSizesRear ?? []),
])])

/*
 * „Alle Auflagen im Wortlaut“ scrolls to the section without a history entry: Back from a fragment is an Inertia
 * visit that re-mounts the page and throws away the chosen size and colour (D-01). The heading takes the focus,
 * so a screen reader reads on from there (D-12). A modified click keeps the link's own behaviour.
 */
function toDetail(event: MouseEvent): void {
    const section = document.getElementById('auflagen')

    if (section === null || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
    }

    event.preventDefault()
    document.getElementById('fdt-h')?.focus({ preventScroll: true })
    section.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
}

const documentLine = computed(() => {
    const document = props.verdict?.document

    if (!document) {
        return null
    }

    const parts = [document.issuer, document.number].filter(
        (part): part is string => typeof part === 'string' && part.trim() !== ''
    )
    const line = parts.length > 0 ? parts.join(' · ') : null
    const others = document.others ?? []

    // Several documents the answer rests on are each named, the newest first (the corrections memo §3).
    return others.length === 0 ? line : [line, ...others].filter((part): part is string => part !== null).join(' und ')
})

const headline = computed(() => {
    if (props.vehicle === null) {
        return 'Noch kein Fahrzeug gewählt.'
    }

    if (props.verdict === null) {
        return `Prüfung für ${props.vehicle.label}`
    }

    switch (props.verdict.status) {
        case 'PERMITTED':
            return `Freigegeben für ${props.vehicle.label}`
        case 'CONDITIONAL':
            return `Mit Auflagen freigegeben für ${props.vehicle.label}`
        case 'NOT_PERMITTED':
            return `Nicht freigegeben für ${props.vehicle.label}`
        default:
            return `Keine Freigabe hinterlegt für ${props.vehicle.label}`
    }
})
</script>

<template>
    <div class="rcheck-panel" :class="tone.cls">
        <p class="rcheck-panel__head">
            <Icon :name="tone.icon" :size="20" /> RIMIFY-CHECK
        </p>

        <p class="rcheck-panel__vehicle">{{ headline }}</p>

        <template v-if="verdict">
            <!-- What the answer waits for, asked by name and answered in place; a derived body style or drive
                 stands as such, with „stimmt das?“ (the operator's last prompt §1.1). Keyed by the car (C-08). -->
            <BuildForm v-if="vehicle" :key="`build-${vehicle.id}`" :vehicle-id="vehicle.id" :build="vehicle.build ?? null" :missing="verdict.missing ?? []" />

            <!-- Two lines, one per half: the wheel rests on the Gutachten, the tyres on the car's papers. -->
            <dl v-if="verdict.wheelLabel && verdict.tyre" class="fit__halves">
                <div class="fit__half">
                    <dt>Felge</dt>
                    <dd>{{ verdict.wheelLabel }}</dd>
                </div>
                <div class="fit__half" :data-tyre="verdict.tyre.status">
                    <dt>Reifen</dt>
                    <dd>{{ verdict.tyre.label }}</dd>
                </div>
            </dl>
            <!-- With the car's figures: the answer and its document always, the sum one click away, inline —
                 open at once where we say no or the customer's own figures made it stricter (29.09.2026). -->
            <template v-if="verdict.tyre?.summary">
                <p class="fit__tyre-summary"><ValueText :text="verdict.tyre.summary" /></p>
                <p v-if="verdict.tyre.basis" class="fit__tyre-basis">{{ verdict.tyre.basis }}</p>
                <details v-if="verdict.tyre.lines.length" class="fit__sum" :open="verdict.tyre.open || undefined">
                    <summary class="fit__sum-toggle">So haben wir gerechnet</summary>
                    <ul class="fit__tyre-lines">
                        <li v-for="line in verdict.tyre.lines" :key="line"><ValueText :text="line" /></li>
                    </ul>
                </details>
            </template>
            <!-- Without them: the document's thresholds and the fields to compare, in full (R-03). -->
            <ul v-else-if="verdict.tyre?.lines.length" class="fit__tyre-lines">
                <li v-for="line in verdict.tyre.lines" :key="line"><ValueText :text="line" /></li>
            </ul>
            <!-- 8.1, 8.2 and T from the customer's papers: optional, and what turns the tyre line into a sum. -->
            <!-- Keyed by the car: another car chosen meanwhile (in another tab) gets a fresh form, never the
                 last car's figures under its name (C-08). -->
            <PapersForm v-if="vehicle && verdict.tyre" :key="vehicle.id" :vehicle-id="vehicle.id" :papers="vehicle.papers ?? null" :power-kw="vehicle.powerKw ?? null" />

            <p v-if="entryLine" class="fit__entry">{{ entryLine }}</p>

            <p v-if="entryLine && verdict.entryNoteDe" class="quiet fit__note">{{ verdict.entryNoteDe }}</p>

            <!-- Auflagen in full sentences. They cost the customer money and time; burying them is
                 both a conversion problem and a trust problem. With the detail, in the order they are done. -->
            <div v-if="detail && overview.length" class="fit__overview">
                <p class="label fit__overview-h">Das verlangt das Gutachten</p>
                <p class="small fit__overview-line">{{ overview.join(' · ') }} · <a class="fit__to-detail" href="#auflagen" @click="toDetail">alle Auflagen im Wortlaut</a></p>
            </div>
            <ul v-else-if="!detail && conditions.length" class="fit__conditions">
                <li v-for="condition in conditions" :key="condition">{{ condition }}</li>
            </ul>

            <div v-if="sizes.length" class="fit__tyres">
                <span class="micro">Passende Reifengrößen</span>
                <p class="data">{{ sizes.join(' · ') }}</p>
            </div>

            <!-- Said once: a reason the tyre lines above already give is not repeated here. -->
            <!-- Where the answer waits for the car's body style or drive, the question above says so by name. -->
            <p v-if="verdict.reason && !(verdict.missing ?? []).length && !(verdict.tyre?.lines ?? []).includes(verdict.reason) && verdict.reason !== verdict.tyre?.summary" class="fit__reason">{{ verdict.reason }}</p>

            <p v-if="documentLine" class="fit__doc">
                <Icon name="document" :size="20" />
                <span class="data">{{ documentLine }}</span>
            </p>
            <!-- What the document itself limits: a Nachtrag without its base, the month a wheel must be made from. -->
            <p v-for="note in verdict.document?.notes ?? []" :key="note" class="fit__note">{{ note }}</p>
            <!-- The document itself, opened where the answer stands: the customer can check it. -->
            <p v-if="verdict.document?.pdf" class="fit__pdf">
                <a :href="verdict.document.pdf.url" target="_blank" rel="noopener">
                    Gutachten öffnen (PDF<template v-if="verdict.document.pdf.page">, Seite {{ verdict.document.pdf.page }}</template>)
                </a>
            </p>
            <!-- The answer to take away: frozen whole, every line of the sum, printable and shareable. -->
            <p v-if="vehicle && configId" class="fit__pdf">
                <button class="link fit__issue" type="button" :disabled="issuing" :aria-busy="issuing ? 'true' : undefined" @click="issueCheck">
                    RIMIFY-Check drucken oder teilen
                </button>
            </p>
        </template>

        <p v-else-if="vehicle === null" class="quiet fit__note">
            Ohne Fahrzeug können wir keine Freigabe bestätigen.
        </p>

        <slot />
    </div>
</template>

<style scoped>
.fit__halves {
    display: grid;
    gap: var(--space-1);
    margin: var(--space-2) 0 0;
}

.fit__half {
    display: flex;
    gap: var(--space-2);
    font-size: var(--text-small);
}

.fit__half dt {
    min-width: 4.5em;
    color: var(--ink2);
}

.fit__half dd {
    margin: 0;
    font-weight: 700;
}

.fit__tyre-lines {
    display: grid;
    gap: var(--space-2);
    margin: var(--space-2) 0 0;
    padding-left: var(--space-4);
    font-size: var(--text-small);
    color: var(--ink);
}

/* The answer, then its document: two lines, always there. */
.fit__tyre-summary {
    margin: var(--sp-8) 0 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 600;
    color: var(--c-ink);
}

.fit__tyre-basis {
    margin: var(--sp-4) 0 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

/* The sum, one click away and inline: a native disclosure, so it works without script and on a phone. */
.fit__sum {
    margin: var(--sp-8) 0 0;
}

/* A finger's target (DIRECTION §6, 44 px) without moving the line (D-11). */
@media (pointer: coarse) {
    .fit__to-detail {
        display: inline-block;
        padding-block: var(--sp-12);
        margin-block: calc(-1 * var(--sp-12));
    }
}

.fit__sum-toggle {
    cursor: pointer;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-blue);
    text-decoration: underline;
    text-underline-offset: 2px;
}

.fit__sum-toggle:focus-visible {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

.fit__entry {
    margin: var(--space-2) 0 0;
    font-size: var(--text-small);
    font-weight: 700;
}

.fit__note {
    margin: var(--space-2) 0 0;
    font-size: var(--text-small);
}

/* An Auflage is a sentence the customer must act on: body size, full ink. */
.fit__conditions {
    display: grid;
    gap: var(--space-2);
    margin: var(--space-3) 0 0;
    padding-left: var(--space-4);
    font-size: var(--text-body);
    color: var(--ink);
}

/* What there is to do, one line per section; the sentences stand in full below the purchase (#auflagen). */
.fit__overview {
    margin-top: var(--space-3);
}

.fit__overview-h {
    margin: 0;
}

.fit__overview-line {
    margin: var(--space-1) 0 0;
    color: var(--ink);
}

.fit__tyres {
    margin-top: var(--space-3);
}

.fit__tyres p {
    margin: 2px 0 0;
}

.fit__reason {
    margin: var(--space-3) 0 0;
    font-size: var(--text-body);
    color: var(--ink2);
}

.fit__pdf {
    margin: var(--space-2) 0 0;
    font-size: var(--text-small);
}

.fit__doc {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: var(--space-3) 0 0;
    color: var(--ink2);
}
</style>
