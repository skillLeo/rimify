<script setup lang="ts">
/**
 * /felgenrechner as an app screen (home-overhaul §3.3, 390). The bar carries the large title —
 * it is the page's h1 — and the back arrow to the homepage. Then one column: Aktuell · Neu as
 * tabs with the five fields two abreast, the three results — each answer in a plain sentence, the
 * rear-view drawing under the position sentence — the full figures, the share block with a
 * full-width button, the disclaimer. No sticky bar.
 *
 * Same props as the desktop document; the split is presentation only.
 */

import { Head } from '@inertiajs/vue3'
import { computed, h, type Component, type VNode } from 'vue'
import MobileLayout from '../../Layouts/MobileLayout.vue'
import ClearanceDrawing from '../../Components/Ui/ClearanceDrawing.vue'
import FitmentCalculator from '../../Components/Home/FitmentCalculator.vue'
import FitmentResults from '../../Components/Home/FitmentResults.vue'
import RechnerShare from '../../Components/Home/RechnerShare.vue'
import ValueText from '../../Components/Ui/ValueText.vue'
import { useRechner } from '../../composables/useRechner'
import { useShared } from '../../composables/useShared'
import { DISCLAIMER } from '../../lib/rechner'
import type { FelgenrechnerProps } from '../../types/pages'

/* Inertia hands the rendered page as a VNode at runtime; its type names it a Component. */
defineOptions({
    layout: (_: unknown, page: Component): VNode =>
        h(MobileLayout, { title: 'Felgenrechner', large: true, back: '/' }, () => page as unknown as VNode),
})

const props = defineProps<FelgenrechnerProps>()

const shared = useShared()
const vehicle = computed(() => shared.value.vehicle)

const LEAD = 'Rechne aus, wie sich eine andere Felgen- und Reifengröße rechnerisch auf Abrollumfang, Tacho und die Lage der Felgenkanten auswirkt.'

const { state, shown, shareParam, prefillLine, fromVehicle, specs, update, setValid } = useRechner({
    prefill: () => props.prefill,
    vehicle: () => vehicle.value,
    state: props.state,
    writeUrl: true,
})
</script>

<template>
    <Head title="Felgenrechner">
        <meta name="description" :content="LEAD" head-key="description" />
    </Head>

    <div class="container rechner">
        <p class="body muted rechner__lead">{{ LEAD }}</p>

        <div class="rechner__form">
            <p v-if="prefillLine" class="small quiet rechner__prefill">{{ prefillLine }}</p>
            <FitmentCalculator :model-value="state" layout="tabs" :prefilled="fromVehicle" @update:model-value="update" @update:valid="setValid" />
        </div>

        <!-- The answer in words first; the drawing sits under the position sentence it shows. -->
        <FitmentResults :result="shown">
            <template #drawing>
                <ClearanceDrawing class="calc-drawing" :current="state.current" :next="state.next" />
            </template>
        </FitmentResults>

        <dl v-if="specs.length > 0" class="specs small" aria-label="Alle Werte">
            <template v-for="row in specs" :key="row.key">
                <dt>{{ row.label }}</dt>
                <dd class="num"><ValueText :text="row.value" /></dd>
            </template>
        </dl>

        <RechnerShare :param="shareParam" block />

        <p class="small muted rechner__disclaimer"><ValueText :text="DISCLAIMER" /></p>
    </div>
</template>

<style scoped>
.rechner {
    display: grid;
    gap: var(--sp-32);
    padding-block: var(--sp-16) var(--sp-48);
}

.rechner__lead {
    max-width: 54ch;
    hyphens: auto;
}

.rechner__form {
    display: grid;
    gap: var(--sp-12);
}

.rechner__disclaimer {
    max-width: 54ch;
    hyphens: auto;
}
</style>
