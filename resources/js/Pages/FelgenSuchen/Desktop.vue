<script setup lang="ts">
/**
 * The vehicle selector as a full page.
 *
 * Two routes in, side by side and equally weighted — the guided drill and the key numbers. A
 * failure here never clears the form and never dead-ends: the empty state names a way forward
 * (R-09), because a customer who cannot find their car is a customer who leaves.
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

            <div class="panel sel__panel">
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
.sel__panel {
    margin-top: var(--s6);
}
</style>
