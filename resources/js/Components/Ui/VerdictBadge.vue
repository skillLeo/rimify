<script setup lang="ts">
/**
 * The verdict: four states, one shape, identical wherever it appears (R-07).
 *
 * `UNKNOWN` is neutral on purpose — "we hold no document for this combination" is a different
 * fact from "your car may not have this", and only one of them is about the customer's car.
 * The badge never carries an Auflage; a `CONDITIONAL` verdict always renders its conditions as
 * full sentences beside it (R-15), which is the caller's duty.
 */

import { computed } from 'vue'
import Icon from './Icon.vue'
import type { IconName } from '../../icons'
import type { VerdictStatus } from '../../types/rimify'

const props = withDefaults(
    defineProps<{
        status: VerdictStatus
        size?: 'sm' | 'lg'
        /** A longer wording for the same state, e.g. "Freigegeben für BMW 3er". */
        label?: string
        /**
         * A CONDITIONAL answer whose Auflagen are all Hinweise (#23, D-104, decided on the server): it wears the
         * „Freigegeben“ badge; the caller says „mit Hinweisen“ quietly beside it. Nothing else is ever softened.
         */
        notesOnly?: boolean
    }>(),
    { size: 'sm', label: undefined, notesOnly: false }
)

const LABELS: Record<VerdictStatus, string> = {
    PERMITTED: 'Freigegeben',
    CONDITIONAL: 'Mit Auflagen',
    NOT_PERMITTED: 'Nicht freigegeben',
    UNKNOWN: 'Unbekannt',
}

const TONES: Record<VerdictStatus, { cls: string; icon: IconName }> = {
    PERMITTED: { cls: 'verdict--ok', icon: 'check' },
    CONDITIONAL: { cls: 'verdict--warn', icon: 'warning' },
    NOT_PERMITTED: { cls: 'verdict--bad', icon: 'close' },
    UNKNOWN: { cls: 'verdict--unk', icon: 'info' },
}

const shown = computed<VerdictStatus>(() => (props.notesOnly && props.status === 'CONDITIONAL' ? 'PERMITTED' : props.status))
const tone = computed(() => TONES[shown.value])
const text = computed(() => props.label ?? LABELS[shown.value])
</script>

<template>
    <span class="verdict" :class="[tone.cls, { 'verdict--lg': size === 'lg' }]">
        <Icon :name="tone.icon" :size="size === 'lg' ? 20 : 16" />
        {{ text }}
    </span>
</template>
