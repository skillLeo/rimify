<script setup lang="ts">
/**
 * The vehicle selector as a full page.
 *
 * Two routes in — the key numbers and the guided drill. The key numbers come first, because someone
 * holding their Zulassungsbescheinigung is faster typing seven characters than scrolling a make list;
 * from 900px the two sit side by side in the same order. The selector owns that order, in its markup.
 *
 * A failure here never clears the form and never dead-ends (R-09): the selector keeps what was
 * typed and offers three ways forward.
 *
 * One page for every width.
 */

import { Head } from '@inertiajs/vue3'
import { computed } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import VehicleSelector from '../../Components/Vehicle/VehicleSelector.vue'
import type { SelectorProps } from '../../types/pages'

defineOptions({ layout: AppLayout, inheritAttrs: false })

const props = defineProps<SelectorProps & { returnTo?: string | null }>()

/* A page that sent the visitor here gets them back (`zurueck`, the compare table): kept through every drill step. */
const baseQuery = computed((): Record<string, string> => {
    const query: Record<string, string> = {}

    if (props.returnTo) {
        query.zurueck = props.returnTo
    }

    return query
})
</script>

<template>
    <Head title="Fahrzeug wählen" />

    <section class="section">
        <div class="wrap">
            <h1 class="t-h1">Fahrzeug wählen</h1>
            <p class="t-lead sel__lead">
                Danach siehst du nur Felgen, deren Gutachten dein Auto nennt. Zwei Wege – direkt über die
                Schlüsselnummern aus deinen Fahrzeugpapieren oder über Marke und Modell.
            </p>

            <div class="sel__panel">
                <VehicleSelector
                    :makes="makes"
                    :models="models"
                    :variants="variants"
                    :selected-make="selectedMake"
                    :selected-model="selectedModel"
                    base-path="/felgen-suchen"
                    :base-query="baseQuery"
                    :return-to="returnTo ?? null"
                    :heading-level="2"
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
