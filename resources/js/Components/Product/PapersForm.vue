<script setup lang="ts">
/**
 * The three figures the tyre half needs, from the customer's own papers (Block C, item 10): 8.1 and 8.2,
 * the permitted axle loads front and rear, and T, the top speed. Optional — without them the wheel answer
 * stands and the tyre answer says what to compare; with them the tyre answer is definite and shows its sum.
 *
 * A drawing rings where the fields stand, on the certificate issued since 2005 and on the older
 * Fahrzeugschein. The figures are kept with THIS car in the browser (a cookie keyed by the vehicle, so two
 * saved cars never overwrite each other) until customer accounts exist, and the server reads them for every
 * answer about this car.
 */

import { router } from '@inertiajs/vue3'
import { computed, nextTick, reactive, ref } from 'vue'
import PapersFacsimile from '../Art/PapersFacsimile.vue'
import { formatNumber } from '../../lib/num'
import type { PapersProp } from '../../types/rimify'

const props = defineProps<{
    vehicleId: number
    papers: PapersProp | null
}>()

const variant = ref<'neu' | 'alt'>('neu')
const open = ref(props.papers === null)
const busy = ref(false)
const errors = ref<Record<string, string>>({})

const form = reactive({
    axle_front_kg: (props.papers?.axleFrontKg ?? '') as number | '',
    axle_rear_kg: (props.papers?.axleRearKg ?? '') as number | '',
    top_speed_kmh: (props.papers?.topSpeedKmh ?? '') as number | '',
})

const entered = computed(() => props.papers !== null)
const NBSP = ' '
const kg = (n: number): string => `${formatNumber(n)}${NBSP}kg`

function save(): void {
    busy.value = true
    router.post(`/fahrzeug/${props.vehicleId}/papiere`, { ...form }, {
        preserveScroll: true,
        errorBag: 'papiere',
        onError: (bag) => {
            errors.value = bag as Record<string, string>
            const first = ['axle_front_kg', 'axle_rear_kg', 'top_speed_kmh'].find((key) => errors.value[key])
            document.getElementById(first ? `pp-${first}` : 'pp-save')?.focus()
        },
        onSuccess: () => {
            errors.value = {}
            open.value = false
            // The form gives way to the summary: focus goes where the reader can change it again.
            void nextTick(() => document.getElementById('pp-change')?.focus())
        },
        onFinish: () => {
            busy.value = false
        },
    })
}

function clear(): void {
    busy.value = true
    router.delete(`/fahrzeug/${props.vehicleId}/papiere`, {
        preserveScroll: true,
        onSuccess: () => {
            form.axle_front_kg = ''
            form.axle_rear_kg = ''
            form.top_speed_kmh = ''
            void nextTick(() => document.getElementById('pp-axle_front_kg')?.focus())
        },
        onFinish: () => {
            busy.value = false
        },
    })
}
</script>

<template>
    <div class="pp">
        <template v-if="papers && !open">
            <p class="pp__summary">
                <span>Nach deinen Angaben: 8.1 {{ kg(papers.axleFrontKg) }} · 8.2 {{ kg(papers.axleRearKg) }} · T {{ papers.topSpeedKmh }}&nbsp;km/h</span>
                <button id="pp-change" class="btn btn--ghost btn--sm" type="button" @click="open = true">Ändern</button>
            </p>
            <p v-for="note in papers.notes" :key="note" class="pp__help">{{ note }}</p>
        </template>

        <form v-else class="pp__form" novalidate aria-labelledby="pp-h" @submit.prevent="save">
            <p id="pp-h" class="pp__title">Werte aus deiner Zulassungsbescheinigung</p>
            <p class="pp__help">
                Freiwillig: Mit der zulässigen Achslast und der Höchstgeschwindigkeit sagen wir dir genau, welche Reifen du fahren darfst. Die Werte bleiben in
                deinem Browser, bei diesem Fahrzeug.
            </p>

            <div class="pp__grid">
                <div class="form-field">
                    <label class="form-field__label" for="pp-axle_front_kg">8.1 · zulässige Achslast vorn (kg)</label>
                    <input id="pp-axle_front_kg" v-model.number="form.axle_front_kg" class="input" type="number" min="300" max="4000" inputmode="numeric" :aria-invalid="errors.axle_front_kg ? 'true' : undefined" aria-describedby="pp-axle_front_kg-err">
                    <p id="pp-axle_front_kg-err" class="form-field__error">{{ errors.axle_front_kg }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="pp-axle_rear_kg">8.2 · zulässige Achslast hinten (kg)</label>
                    <input id="pp-axle_rear_kg" v-model.number="form.axle_rear_kg" class="input" type="number" min="300" max="4000" inputmode="numeric" :aria-invalid="errors.axle_rear_kg ? 'true' : undefined" aria-describedby="pp-axle_rear_kg-err">
                    <p id="pp-axle_rear_kg-err" class="form-field__error">{{ errors.axle_rear_kg }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="pp-top_speed_kmh">T · Höchstgeschwindigkeit (km/h)</label>
                    <input id="pp-top_speed_kmh" v-model.number="form.top_speed_kmh" class="input" type="number" min="60" max="420" inputmode="numeric" :aria-invalid="errors.top_speed_kmh ? 'true' : undefined" aria-describedby="pp-top_speed_kmh-err">
                    <p id="pp-top_speed_kmh-err" class="form-field__error">{{ errors.top_speed_kmh }}</p>
                </div>
            </div>

            <figure class="pp__figure">
                <div class="pp__variants" role="group" aria-label="Welches Dokument hast du?">
                    <button class="chip" type="button" :aria-pressed="variant === 'neu' ? 'true' : 'false'" @click="variant = 'neu'">Zulassungsbescheinigung Teil I</button>
                    <button class="chip" type="button" :aria-pressed="variant === 'alt' ? 'true' : 'false'" @click="variant = 'alt'">Alter Fahrzeugschein</button>
                </div>
                <PapersFacsimile
                    :variant="variant"
                    :width="360"
                    :title="variant === 'neu' ? 'Zulassungsbescheinigung Teil I: die Felder 8.1, 8.2, T und P.2 sind markiert' : 'Alter Fahrzeugschein: die Ziffern 6, 7 und 16 sind markiert'"
                />
                <figcaption class="pp__caption">
                    {{ variant === 'neu' ? 'Die Achslasten stehen in 8.1 und 8.2, die Höchstgeschwindigkeit in T.' : 'Im alten Fahrzeugschein: Achslasten in Ziffer 16, Höchstgeschwindigkeit in Ziffer 6.' }}
                </figcaption>
            </figure>

            <div class="pp__actions">
                <button id="pp-save" class="btn btn--primary btn--sm" type="submit" :disabled="busy" :aria-busy="busy ? 'true' : undefined">Werte übernehmen</button>
                <button v-if="entered" class="btn btn--ghost btn--sm" type="button" :disabled="busy" @click="clear">Werte löschen</button>
            </div>
        </form>
    </div>
</template>

<style scoped>
.pp {
    margin-top: var(--space-3);
}

.pp__summary {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    margin: 0;
    font-size: var(--text-small);
}

.pp__form {
    display: grid;
    gap: var(--space-3);
    padding: var(--space-3);
    border-radius: var(--r-control);
    background: var(--c-band);
}

.pp__title {
    margin: 0;
    font-weight: 700;
}

.pp__help,
.pp__caption {
    margin: 0;
    font-size: var(--text-small);
    color: var(--ink2);
}

.pp__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-3);
}

.pp__form .form-field__error:empty {
    display: none;
}

.pp__figure {
    display: grid;
    gap: var(--space-2);
    margin: 0;
    max-width: 360px;
}

.pp__figure :deep(svg) {
    width: 100%;
    height: auto;
}

.pp__variants,
.pp__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
}

@media (max-width: 767px) {
    .pp__grid {
        grid-template-columns: minmax(0, 1fr);
    }
}
</style>
