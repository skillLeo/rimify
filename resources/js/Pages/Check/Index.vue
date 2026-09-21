<script setup lang="ts">
/**
 * RIMIFY-CHECK as its own page: "does THIS wheel fit my car", asked directly.
 *
 * Two steps, and the stepper says which one is on screen — it never marks a step current while
 * showing another step's content. Step one is the vehicle. Step two is the wheel, and the answer
 * to it is the verdict panel on that wheel's product page, which names the car, the Gutachten and
 * every Auflage. There is no second, lighter check that could disagree with it.
 *
 * Choosing a vehicle writes it and opens the listing (FahrzeugController::adopt). Coming back here
 * with a vehicle set shows step one as done.
 *
 * One page for every width.
 */

import { Head, Link } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import Icon from '../../Components/Art/Icon.vue'
import VehicleSelector from '../../Components/Vehicle/VehicleSelector.vue'
import { useShared } from '../../composables/useShared'
import type { SelectorProps } from '../../types/pages'

defineOptions({ layout: AppLayout, inheritAttrs: false })

const props = defineProps<SelectorProps>()

const shared = useShared()
const vehicle = computed(() => shared.value.vehicle)

/*
 * Step one is open with no vehicle, after "Ändern", and while the customer drills through makes
 * again — all three mean the vehicle is being chosen, so the stepper says so.
 */
const changing = ref(false)
const choosingVehicle = computed(
    () => vehicle.value === null || changing.value || props.selectedMake !== null
)

/*
 * What a result can say. Four states, never a yes/no, and "no document" is not "not permitted"
 * (R-07) — so the page explains the difference before anyone meets it on a product page.
 */
const STATES = [
    {
        tag: 'tag--ok',
        label: 'Freigegeben',
        text: 'Das Gutachten deckt dein Fahrzeug in dieser Größe ab. Wir nennen die Gutachten-Nummer und ob eine Eintragung nötig ist.',
    },
    {
        tag: 'tag--warn',
        label: 'Freigegeben mit Auflagen',
        text: 'Zulässig unter Bedingungen aus dem Gutachten, etwa nur mit bestimmten Radschrauben. Jede Auflage steht als ganzer Satz da.',
    },
    {
        tag: 'tag--danger',
        label: 'Nicht freigegeben',
        text: 'Das Gutachten deckt diese Größe für dein Fahrzeug nicht ab. Steht der Grund im Gutachten, nennen wir ihn.',
    },
    {
        tag: 'tag--unknown',
        label: 'Keine Angabe',
        text: 'Für diese Kombination liegt uns kein Gutachten vor. Das heißt nicht, dass die Felge unzulässig ist – nur, dass wir es nicht belegen können.',
    },
]
</script>

<template>
    <Head title="RIMIFY-CHECK" />

    <section class="section-dense">
        <div class="wrap chk">
            <h1 class="t-h1">Passt diese Felge auf dein Auto?</h1>
            <p class="t-lead chk__lead">
                In zwei Schritten zur verbindlichen Antwort – mit dem Gutachten als Beleg.
            </p>

            <!-- The stepper mirrors what is rendered below it, and nothing else. -->
            <ol class="steps chk__steps" aria-label="Fortschritt">
                <li
                    class="steps__item"
                    :class="choosingVehicle ? 'steps__item--on' : 'steps__item--done'"
                    :aria-current="choosingVehicle ? 'step' : undefined"
                >
                    <span class="steps__num">
                        <Icon v-if="!choosingVehicle" name="check" :size="20" />
                        <template v-else>1</template>
                    </span>
                    Fahrzeug wählen
                </li>
                <li
                    class="steps__item"
                    :class="{ 'steps__item--on': !choosingVehicle }"
                    :aria-current="!choosingVehicle ? 'step' : undefined"
                >
                    <span class="steps__num">2</span>
                    Felge wählen
                </li>
            </ol>

            <!-- Step one, open: the selector. -->
            <div v-if="choosingVehicle" class="chk__panel">
                <VehicleSelector
                    :makes="makes"
                    :models="models"
                    :variants="variants"
                    :selected-make="selectedMake"
                    :selected-model="selectedModel"
                    base-path="/rimify-check"
                />
            </div>

            <template v-else-if="vehicle">
                <!-- Step one, done: the car the answer will be about, and a way to change it. -->
                <div class="chk__done">
                    <div class="chk__done-text">
                        <span class="micro">Fahrzeug</span>
                        <p class="chk__vehicle">{{ vehicle.label }}</p>
                        <p class="data">{{ vehicle.keyNumbers }} · {{ vehicle.buildWindow }}</p>
                    </div>
                    <button class="btn btn--quiet" type="button" @click="changing = true">
                        Ändern<span class="visually-hidden"> (Fahrzeug)</span>
                    </button>
                </div>

                <!-- Step two: the wheel. The verdict lives on its product page. -->
                <div class="chk__panel chk__step2">
                    <h2 class="t-h3">Felge wählen</h2>
                    <p class="t-body chk__step2-text">
                        Die Liste zeigt nur Felgen mit gültigem Gutachten für deinen {{ vehicle.short }}.
                        Auf jeder Produktseite steht das Ergebnis für die gewählte Größe – mit
                        Gutachten-Nummer und allen Auflagen im Wortlaut.
                    </p>
                    <Link href="/felgen" class="btn btn--primary chk__go">
                        Felgen für {{ vehicle.short }} ansehen
                    </Link>
                </div>
            </template>
        </div>
    </section>

    <!-- What the answer can be. A list, because the four states are compared, not browsed. -->
    <section class="section band">
        <div class="wrap">
            <h2 class="t-h2">Vier mögliche Ergebnisse</h2>
            <dl class="chk__states">
                <div v-for="state in STATES" :key="state.label" class="chk__state">
                    <dt><span class="tag" :class="state.tag">{{ state.label }}</span></dt>
                    <dd class="t-body">{{ state.text }}</dd>
                </div>
            </dl>
        </div>
    </section>
</template>

<style scoped>
.chk__lead {
    margin-top: var(--space-3);
    color: var(--ink2);
}

.chk__steps {
    margin: var(--space-6) 0 0;
    padding: 0;
    list-style: none;
}

.chk__steps .steps__num :deep(svg) {
    width: 14px;
    height: 14px;
}

.chk__panel {
    margin-top: var(--space-5);
    padding: var(--space-4);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
}

.chk__done {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
    margin-top: var(--space-5);
    padding-bottom: var(--space-4);
    border-bottom: 1px solid var(--line);
}

.chk__done-text {
    min-width: 0;
}

.chk__vehicle {
    margin: var(--space-1) 0;
    font-weight: 700;
}

.chk__step2-text {
    margin-top: var(--space-2);
    color: var(--ink2);
}

.chk__go {
    margin-top: var(--space-4);
}

.chk__states {
    margin: var(--space-5) 0 0;
    border-top: 1px solid var(--line);
}

.chk__state {
    display: grid;
    gap: var(--space-2);
    padding-block: var(--space-4);
    border-bottom: 1px solid var(--line);
}

.chk__state dd {
    margin: 0;
    color: var(--ink2);
}

@media (min-width: 900px) {
    .chk__panel {
        padding: var(--space-6);
    }

    .chk__state {
        grid-template-columns: 240px minmax(0, 1fr);
        gap: var(--space-5);
        align-items: baseline;
    }
}
</style>
