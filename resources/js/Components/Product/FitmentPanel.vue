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

import { computed } from 'vue'
import Icon from '../Art/Icon.vue'
import ValueText from '../Ui/ValueText.vue'
import PapersForm from './PapersForm.vue'
import type { IconName } from '../../art'
import type { ConfigVerdict } from '../../types/pages'
import type { VehicleProp } from '../../types/rimify'

const props = defineProps<{
    verdict: ConfigVerdict | null
    vehicle: VehicleProp | null
}>()

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
            <ul v-if="verdict.tyre?.lines.length" class="fit__tyre-lines">
                <li v-for="line in verdict.tyre.lines" :key="line"><ValueText :text="line" /></li>
            </ul>
            <!-- 8.1, 8.2 and T from the customer's papers: optional, and what turns the tyre line into a sum. -->
            <PapersForm v-if="vehicle && verdict.tyre" :vehicle-id="vehicle.id" :papers="vehicle.papers ?? null" :power-kw="vehicle.powerKw ?? null" />

            <p v-if="entryLine" class="fit__entry">{{ entryLine }}</p>

            <p v-if="entryLine && verdict.entryNoteDe" class="quiet fit__note">{{ verdict.entryNoteDe }}</p>

            <!-- Auflagen in full sentences. They cost the customer money and time; burying them is
                 both a conversion problem and a trust problem. -->
            <ul v-if="conditions.length" class="fit__conditions">
                <li v-for="condition in conditions" :key="condition">{{ condition }}</li>
            </ul>

            <div v-if="verdict.tyreSizes.length" class="fit__tyres">
                <span class="micro">Passende Reifengrößen</span>
                <p class="data">{{ verdict.tyreSizes.join(' · ') }}</p>
            </div>

            <p v-if="verdict.reason" class="fit__reason">{{ verdict.reason }}</p>

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
