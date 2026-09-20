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
            <p class="fit__entry">
                {{
                    verdict.requiresEntry
                        ? 'Eintragung in die Fahrzeugpapiere erforderlich.'
                        : 'Keine Eintragung erforderlich.'
                }}
            </p>

            <p v-if="verdict.entryNoteDe" class="quiet fit__note">{{ verdict.entryNoteDe }}</p>

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

            <p v-if="verdict.document" class="fit__doc">
                <Icon name="document" :size="20" />
                <span class="data">
                    {{ verdict.document.issuer }} · {{ verdict.document.number }}
                </span>
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
    margin: var(--s2) 0 0;
    font-size: 14px;
    font-weight: 700;
}

.fit__note {
    margin: var(--s2) 0 0;
    font-size: 13px;
}

.fit__conditions {
    display: grid;
    gap: 6px;
    margin: var(--s3) 0 0;
    padding-left: var(--s4);
    font-size: 14px;
    color: var(--ink2);
}

.fit__tyres {
    margin-top: var(--s3);
}

.fit__tyres p {
    margin: 2px 0 0;
}

.fit__reason {
    margin: var(--s3) 0 0;
    font-size: 14px;
    color: var(--ink2);
}

.fit__doc {
    display: flex;
    align-items: center;
    gap: var(--s2);
    margin: var(--s3) 0 0;
    color: var(--ink2);
}
</style>
