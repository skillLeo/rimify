<script setup lang="ts">
/**
 * H8 · *Was die Zahlen auf einer Felge bedeuten* — the desktop document's section (ACCURACY.md
 * §5, D9). It takes the calculator's place on the homepage: the heading and the lead here, the
 * values, the photograph, the cross-section, the sentence and the teaser to `/felgenrechner` in
 * `RimCode`. The page renders it only when the hero product has facts (`rimFactsOf`), and its
 * rhythm class arrives by attribute fallthrough like every other section's.
 */

import RimCode from './RimCode.vue'
import type { RimCodeProduct } from './rimCode'

defineProps<{ product: RimCodeProduct | null }>()
</script>

<template>
    <section id="h8" class="rim-code" data-section="H8" aria-labelledby="h8-heading">
        <div class="container">
            <div class="grid">
                <div class="rim-code__head">
                    <h2 id="h8-heading" class="h2">Was die Zahlen auf einer Felge bedeuten</h2>
                    <p class="body muted rim-code__lead">
                        Wähle einen Wert – das Foto oder die Schnittzeichnung zeigt, wo er an der Felge liegt, und ein Satz erklärt ihn.
                    </p>
                </div>
            </div>

            <RimCode class="rim-code__body" :product="product" layout="desktop" />
        </div>
    </section>
</template>

<style scoped>
.rim-code__head {
    grid-column: 1 / -1;
}

.rim-code__lead {
    max-width: 54ch;
    margin-top: var(--sp-12);
    hyphens: auto;
}

.rim-code__body {
    margin-top: var(--sp-40);
}

@media (min-width: 1024px) {
    .rim-code__head {
        grid-column: 1 / span 8;
    }
}
</style>
