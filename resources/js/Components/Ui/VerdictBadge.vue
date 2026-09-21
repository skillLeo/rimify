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
    }>(),
    { size: 'sm', label: undefined }
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

const tone = computed(() => TONES[props.status])
const text = computed(() => props.label ?? LABELS[props.status])
</script>

<template>
    <span class="verdict" :class="[tone.cls, { 'verdict--lg': size === 'lg' }]">
        <Icon :name="tone.icon" :size="size === 'lg' ? 20 : 16" />
        {{ text }}
    </span>
</template>
