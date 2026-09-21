<script setup lang="ts">
/**
 * RIMIFY-CHECK as its own page: the promise the brand is built on, asked directly.
 *
 * It exists separately from the listing because the question is different. The listing asks "what
 * fits my car"; this page asks "does THIS wheel fit", which is what someone already holding a
 * quote from a workshop wants to know.
 */

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

    <section class="rcheck-hero chk__hero">
        <!-- The photograph sits under the blue panel, not beside it: the panel stays the subject
             and the image only gives it depth. -->
        <div class="chk__art" aria-hidden="true">
            <Photo :photo="PHOTOS.checkHero"><span /></Photo>
        </div>

        <div class="wrap chk__inner">
            <p class="micro">RIMIFY-CHECK</p>
            <h1 class="t-display chk__title">Passt diese Felge an mein Auto?</h1>
            <p class="t-body chk__sub">
                Wir beantworten die Frage anhand des Gutachtens – nicht anhand der Maße allein.
            </p>
        </div>
    </section>

    <section class="section">
        <div class="wrap">
            <div class="panel">
                <VehicleSelector
                    :makes="makes"
                    :models="models"
                    :variants="variants"
                    :selected-make="selectedMake"
                    :selected-model="selectedModel"
                    base-path="/rimify-check"
                />
            </div>

            <div class="chk__steps">
                <article v-for="(step, index) in STEPS" :key="step.title" class="card chk__step">
                    <span class="chk__num">{{ index + 1 }}</span>
                    <h2 class="t-h3">{{ step.title }}</h2>
                    <p class="t-body">{{ step.body }}</p>
                </article>
            </div>

            <div class="panel--wash chk__note">
                <Icon name="shield" :size="24" />
                <p class="t-body">
                    Liegt für eine Kombination kein Gutachten vor, sagen wir das – und raten nicht.
                </p>
            </div>
        </div>
    </section>
</template>

<style scoped>
.chk__hero {
    position: relative;
    border-radius: 0;
    padding-block: var(--s9);
    overflow: hidden;
}

.chk__art {
    position: absolute;
    inset: 0;
    /* Held well back: the blue panel is the message, the photograph is only its ground. */
    opacity: 0.26;
}

.chk__inner {
    position: relative;
}

.chk__title {
    margin: var(--s3) 0 var(--s3);
    color: #fff;
    max-width: 18ch;
}

.chk__sub {
    color: rgba(255, 255, 255, 0.86);
}

.chk__steps {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--s5);
    margin-top: var(--s7);
}

.chk__num {
    display: inline-grid;
    place-items: center;
    width: 32px;
    height: 32px;
    margin-bottom: var(--s3);
    border-radius: 50%;
    background: var(--wash);
    color: var(--blue);
    font-weight: 900;
}

.chk__step h2 {
    margin: 0 0 var(--s2);
}

.chk__note {
    display: flex;
    align-items: center;
    gap: var(--s3);
    margin-top: var(--s6);
    color: var(--blue);
}

.chk__note p {
    margin: 0;
    color: var(--ink);
}
</style>
