<script setup lang="ts">
/** RIMIFY-CHECK on a phone: the selector first, the explanation beneath it. */

import { Head } from '@inertiajs/vue3'
import Icon from '../../Components/Art/Icon.vue'
import Photo from '../../Components/Media/Photo.vue'
import VehicleSelector from '../../Components/Vehicle/VehicleSelector.vue'
import { PHOTOS } from '../../media/photos'
import type { SelectorProps } from '../../types/pages'

defineProps<SelectorProps>()

const STEPS = [
    { title: 'Fahrzeug wählen', body: 'Über die Fahrzeugdaten oder die Schlüsselnummern aus deinem Fahrzeugschein.' },
    { title: 'Felge wählen', body: 'Marke, Modell und Größe – wir prüfen jede Kombination einzeln.' },
    { title: 'Ergebnis erhalten', body: 'Mit Gutachten, Auflagen im Klartext und passenden Reifengrößen.' },
]
</script>

<template>
    <Head title="RIMIFY-CHECK" />

    <section class="rcheck-hero mchk__hero">
        <div class="mchk__art" aria-hidden="true">
            <Photo :photo="PHOTOS.checkHero"><span /></Photo>
        </div>

        <div class="mchk__inner">
            <p class="micro">RIMIFY-CHECK</p>
            <h1 class="t-display mchk__title">Passt diese Felge an mein Auto?</h1>
        </div>
    </section>

    <section class="section">
        <div class="wrap">
            <div class="card mchk__card">
                <VehicleSelector
                    :makes="makes"
                    :models="models"
                    :variants="variants"
                    :selected-make="selectedMake"
                    :selected-model="selectedModel"
                    base-path="/rimify-check"
                />
            </div>

            <div class="stack-4 mchk__steps">
                <article v-for="(step, index) in STEPS" :key="step.title" class="card">
                    <span class="mchk__num">{{ index + 1 }}</span>
                    <h2 class="t-h3">{{ step.title }}</h2>
                    <p class="t-body">{{ step.body }}</p>
                </article>
            </div>

            <div class="panel--wash mchk__note">
                <Icon name="shield" :size="24" />
                <p class="t-body">
                    Liegt für eine Kombination kein Gutachten vor, sagen wir das – und raten nicht.
                </p>
            </div>
        </div>
    </section>
</template>

<style scoped>
.mchk__hero {
    position: relative;
    border-radius: 0;
    padding: var(--s7) var(--gutter-m);
    overflow: hidden;
}

.mchk__art {
    position: absolute;
    inset: 0;
    opacity: 0.26;
}

.mchk__inner {
    position: relative;
}

.mchk__title {
    margin: var(--s2) 0 0;
    color: #fff;
}

.mchk__card {
    padding: var(--s4);
}

.mchk__steps {
    margin-top: var(--s5);
}

.mchk__num {
    display: inline-grid;
    place-items: center;
    width: 32px;
    height: 32px;
    margin-bottom: var(--s2);
    border-radius: 50%;
    background: var(--wash);
    color: var(--blue);
    font-weight: 900;
}

.mchk__note {
    display: flex;
    align-items: flex-start;
    gap: var(--s3);
    margin-top: var(--s5);
    color: var(--blue);
}

.mchk__note p {
    margin: 0;
    color: var(--ink);
}
</style>
