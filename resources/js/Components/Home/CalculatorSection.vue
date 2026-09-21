<script setup lang="ts">
/**
 * H8 · Der Rechner — "Was ändert sich mit der neuen Größe?" (F6, signature moment 4).
 *
 * The section owns the heading and the lead; the teaser owns the input row, the clearance
 * drawing, the three results and the line that says the Gutachten decides, not the arithmetic.
 * The shared vehicle goes through so the teaser can say whose Serienbereifung it was prefilled
 * with.
 *
 * The teaser is imported statically on purpose. As an async component its chunk was
 * `modulepreload`ed by Vite's runtime helper during hydration and imported a moment later, which
 * WebKit reports as a preload "not used within a few seconds" — a console warning the G5 gate
 * refuses. In the page's own module graph the chunk is preloaded and consumed together.
 */

import FitmentTeaser from './FitmentTeaser.vue'
import type { CalculatorPrefill } from '../../types/pages'
import type { VehicleProp } from '../../types/rimify'

withDefaults(defineProps<{ prefill: CalculatorPrefill | null; vehicle?: VehicleProp | null }>(), { vehicle: null })
</script>

<template>
    <section id="h8" class="calc-section" data-section="H8" aria-labelledby="h8-heading">
        <div class="container">
            <div class="grid">
                <div class="calc-section__head">
                    <h2 id="h8-heading" class="h2">Was ändert sich mit der neuen Größe?</h2>
                    <p class="body muted calc-section__lead">
                        Vergleiche deine aktuelle Größe mit einer neuen. Die Zeichnung zeigt von oben, wie weit die Felge wandert.
                    </p>
                </div>
            </div>

            <div class="calc-section__body">
                <FitmentTeaser :prefill="prefill" :vehicle="vehicle" layout="desktop" />
            </div>
        </div>
    </section>
</template>

<style scoped>
.calc-section__head {
    grid-column: 1 / -1;
}

.calc-section__lead {
    max-width: 54ch;
    margin-top: var(--sp-12);
    hyphens: auto;
}

.calc-section__body {
    margin-top: var(--sp-40);
}

@media (min-width: 1024px) {
    .calc-section__head {
        grid-column: 1 / span 8;
    }
}
</style>
