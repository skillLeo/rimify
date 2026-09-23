<script setup lang="ts">
/**
 * The vehicle selector as a full page.
 *
 * Two routes in — the guided drill and the key numbers. On a phone the key numbers come first,
 * because someone holding their Zulassungsbescheinigung is faster typing seven characters than
 * scrolling a make list; from 900px the two sit side by side. The selector owns that order.
 *
 * A failure here never clears the form and never dead-ends (R-09): the selector keeps what was
 * typed and offers three ways forward.
 *
 * One page for every width.
 */

import { Head } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'
import VehicleSelector from '../../Components/Vehicle/VehicleSelector.vue'
import type { SelectorProps } from '../../types/pages'

defineOptions({ layout: AppLayout, inheritAttrs: false })

defineProps<SelectorProps>()
</script>

<template>
    <Head title="Auto wählen" />

    <section class="section">
        <div class="wrap">
            <h1 class="t-h1">Auto wählen, garantiert passende Felge finden</h1>
            <p class="t-lead sel__lead">
                Zwei Wege – über die Fahrzeugdaten oder direkt über die Schlüsselnummern aus deinem
                Fahrzeugschein.
            </p>

            <div class="sel__panel">
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
.sel__lead {
    margin-top: var(--space-3);
    color: var(--ink2);
}

.sel__panel {
    margin-top: var(--space-6);
    padding: var(--space-4);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
}

@media (min-width: 900px) {
    .sel__panel {
        padding: var(--space-6);
    }
}
</style>
