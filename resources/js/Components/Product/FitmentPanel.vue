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

const documentLine = computed(() => {
    const document = props.verdict?.document

    if (!document) {
        return null
    }

    const parts = [document.issuer, document.number].filter(
        (part): part is string => typeof part === 'string' && part.trim() !== ''
    )

    return parts.length > 0 ? parts.join(' · ') : null
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
            <p v-if="entryLine" class="fit__entry">{{ entryLine }}</p>

            <p v-if="entryLine && verdict.entryNoteDe" class="quiet fit__note">{{ verdict.entryNoteDe }}</p>

            <!-- Auflagen in full sentences. They cost the customer money and time; burying them is
                 both a conversion problem and a trust problem. -->
            <ul v-if="verdict.conditions.length" class="fit__conditions">
                <li v-for="condition in verdict.conditions" :key="condition">{{ condition }}</li>
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
        </template>

        <p v-else-if="vehicle === null" class="quiet fit__note">
            Ohne Fahrzeug können wir keine Freigabe bestätigen.
        </p>

        <slot />
    </div>
</template>

<style scoped>
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

.fit__doc {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: var(--space-3) 0 0;
    color: var(--ink2);
}
</style>
