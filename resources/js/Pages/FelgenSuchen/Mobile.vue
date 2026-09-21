<script setup lang="ts">
/**
 * The selector on a phone: one column, the guided route first, the key numbers beneath an `ODER`
 * divider, and the Fahrzeugschein help as a sheet rather than inline — the document drawing is
 * wider than the screen and pushing it into the flow would bury the fields it explains.
 */

import { Head } from '@inertiajs/vue3'
import VehicleSelector from '../../Components/Vehicle/VehicleSelector.vue'
import type { SelectorProps } from '../../types/pages'

defineProps<SelectorProps>()
</script>

<template>
    <Head title="Auto wählen" />

    <section class="section">
        <div class="wrap">
            <h1 class="t-h2">Auto wählen, garantiert passende Felge finden</h1>
            <p class="t-body">
                Zwei Wege – über die Fahrzeugdaten oder direkt über die Schlüsselnummern aus deinem
                Fahrzeugschein.
            </p>

            <div class="card msel">
                <VehicleSelector
                    :makes="makes"
                    :models="models"
                    :variants="variants"
                    :selected-make="selectedMake"
                    :selected-model="selectedModel"
                    base-path="/felgen-suchen"
                />
            </div>
        </div>
    </section>
</template>

<style scoped>
.msel {
    margin-top: var(--s5);
    padding: var(--s4);
}
</style>
