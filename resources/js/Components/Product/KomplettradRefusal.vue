<script setup lang="ts">
/**
 * Why there is no Komplettrad for this size: one sentence and a way forward, never an empty panel and never a dead end. The refusal code
 * is never rendered — it only picks which routes make sense: the selector when the car is missing, the papers form when the tyres wait
 * for the car's figures (D-286), the contact form when a person has to look at it.
 */

import { Link, usePage } from '@inertiajs/vue3'
import { computed } from 'vue'
import { contactHref } from '../../lib/contact'
import { focusPapersForm } from '../../lib/papersForm'
import { useVehicleChangeHref } from '../../lib/vehicleChange'
import Icon from '../Ui/Icon.vue'

const props = defineProps<{ sentence: string; code: string | null }>()

const page = usePage()
/* The car chosen comes back here: to this wheel and this version. */
const carHref = useVehicleChangeHref()

const forward = computed(() => ({
    vehicle: props.code === 'NO_VEHICLE' || props.code === 'VERDICT_RESTORED',
    // The tyres wait for the car's own figures: the way on is the customer's, in the panel — not a message to us.
    papers: props.code === 'TYRES_AWAIT_PAPERS',
    contact: props.code !== 'NO_VEHICLE' && props.code !== 'TYRES_AWAIT_PAPERS',
}))

/* „Schreib uns“: the contact form (#26), with this page as the way back. */
const askHref = computed(() => contactHref({ subject: 'Frage zum Komplettrad', from: page.url }))
</script>

<template>
    <div class="notice kr-refusal">
        <Icon name="info" :size="20" />
        <div>
            <p class="kr-refusal__text">{{ sentence }}</p>
            <p v-if="forward.vehicle || forward.papers || forward.contact" class="kr-refusal__routes">
                <Link v-if="forward.vehicle" :href="carHref" class="btn btn--secondary btn--sm">Fahrzeug wählen</Link>
                <button v-if="forward.papers" class="btn btn--secondary btn--sm" type="button" @click="focusPapersForm">Werte eintragen</button>
                <Link v-if="forward.contact" :href="askHref" class="link kr-refusal__mail">Schreib uns</Link>
            </p>
        </div>
    </div>
</template>

<style scoped>
.kr-refusal__text {
    margin: 0;
}

.kr-refusal__routes {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-12) var(--sp-16);
    align-items: center;
    margin: var(--sp-12) 0 0;
}
</style>
