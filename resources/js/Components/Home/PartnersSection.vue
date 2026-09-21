<script setup lang="ts">
/**
 * H9 · Montage in deiner Nähe (F10, behind the `partners` flag).
 *
 * A postcode field and a schematic map of Germany, drawn as one hairline — no tile server, no
 * third-party map, no request leaves the page. The partner search itself has no backend yet: the
 * field checks the postcode's shape, and a well-formed postcode meets the honest empty state
 * rather than an invented list. When the seeded data is demo data, the badge says so.
 *
 * Projection for the map: a fixed linear mapping of longitude 5.5–15.5° E to x 0–600 and latitude
 * 55.3–47.0° N to y 0–800, which is close enough to a plate carrée for a schematic outline.
 */

import { computed, ref, useId } from 'vue'
import { useShared } from '../../composables/useShared'

defineProps<{ demo: boolean }>()

const shared = useShared()
const contact = computed(() => shared.value.contact)
const telHref = computed(() => `tel:${contact.value.phoneIntl.replace(/\s/g, '')}`)

const uid = useId()
const plz = ref('')
const error = ref<string | null>(null)
const searched = ref<string | null>(null)

const PLZ = /^\d{5}$/
const PLZ_ERROR = 'Diese Postleitzahl kennen wir nicht. Prüf bitte die fünf Ziffern.'

const empty = computed(() => plz.value.trim() === '')

function validate(): boolean {
    const value = plz.value.trim()
    error.value = PLZ.test(value) ? null : PLZ_ERROR

    return error.value === null
}

function onBlur(): void {
    if (!empty.value) {
        validate()
    }
}

function submit(): void {
    if (empty.value) {
        return
    }

    searched.value = validate() ? plz.value.trim() : null
}

/* ── The map: Germany's border as a closed path, longitude/latitude in degrees ── */

const LON_MIN = 5.5
const LON_MAX = 15.5
const LAT_MIN = 47.0
const LAT_MAX = 55.3
const VB_W = 600
const VB_H = 800

const BORDER: readonly [number, number][] = [
    [9.43, 54.79], [10.0, 54.5], [10.7, 54.0], [11.1, 54.1], [11.5, 53.95], [12.3, 54.3], [13.1, 54.55], [13.4, 54.65], [13.8, 54.2],
    [14.2, 53.9], [14.35, 53.3], [14.15, 52.85], [14.6, 52.6], [14.7, 52.1], [14.75, 51.6], [15.0, 51.15], [14.8, 50.87],
    [14.3, 51.05], [13.8, 50.7], [13.0, 50.45], [12.35, 50.2], [12.5, 49.9], [12.7, 49.55], [13.4, 49.0], [13.75, 48.55],
    [13.3, 48.3], [12.9, 47.95], [13.0, 47.6], [12.5, 47.65], [12.0, 47.6], [11.4, 47.5], [10.9, 47.4], [10.4, 47.3],
    [10.1, 47.45], [9.75, 47.55], [9.3, 47.65], [8.8, 47.7], [8.4, 47.6], [7.9, 47.55], [7.6, 47.6], [7.6, 48.0],
    [7.8, 48.6], [8.2, 48.95], [7.9, 49.05], [7.2, 49.1], [6.8, 49.2], [6.4, 49.45], [6.35, 49.85], [6.15, 50.2],
    [6.0, 50.5], [5.95, 50.8], [6.0, 51.0], [6.2, 51.4], [6.1, 51.75], [5.95, 51.85], [6.4, 52.0], [6.7, 52.1],
    [7.05, 52.35], [6.7, 52.55], [7.05, 52.8], [7.2, 53.25], [7.0, 53.5], [7.3, 53.7], [7.9, 53.75], [8.5, 53.55],
    [8.9, 53.85], [8.85, 54.3], [8.6, 54.55], [8.3, 54.9], [8.65, 55.05], [9.0, 54.85],
]

function project([lon, lat]: readonly [number, number]): string {
    const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * VB_W
    const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * VB_H

    return `${x.toFixed(1)} ${y.toFixed(1)}`
}

const border = `M ${BORDER.map(project).join(' L ')} Z`
</script>

<template>
    <section id="h9" class="partners" data-section="H9" aria-labelledby="h9-heading">
        <div class="container grid partners__grid">
            <div class="partners__main">
                <div class="partners__title">
                    <h2 id="h9-heading" class="h2">Montage in deiner Nähe</h2>
                    <span v-if="demo" class="badge">Beispieldaten</span>
                </div>

                <form class="partners__form" novalidate @submit.prevent="submit">
                    <div class="partners__row">
                        <div class="form-field partners__field">
                            <label class="form-field__label" :for="`${uid}-plz`">Postleitzahl</label>
                            <input
                                :id="`${uid}-plz`"
                                v-model="plz"
                                class="input num"
                                type="text"
                                inputmode="numeric"
                                maxlength="5"
                                autocomplete="postal-code"
                                :aria-invalid="error ? 'true' : undefined"
                                :aria-describedby="`${uid}-plz-error`"
                                @blur="onBlur"
                            />
                        </div>
                        <button class="btn btn--primary" type="submit" :aria-disabled="empty ? 'true' : undefined">
                            {{ empty ? 'Postleitzahl eingeben' : 'Partner finden' }}
                        </button>
                    </div>
                    <p :id="`${uid}-plz-error`" class="form-field__error">{{ error ?? '' }}</p>
                </form>

                <div class="partners__result">
                    <p v-if="searched === null" class="body muted">Gib deine Postleitzahl ein – wir zeigen dir die drei nächsten Montagepartner.</p>
                    <div v-else class="empty partners__empty" role="status">
                        <p class="empty__title">Noch keine Partner in deiner Nähe.</p>
                        <p class="empty__text">
                            Ruf uns an, wir finden einen Weg:
                            <a :href="telHref" class="num">{{ contact.phone }}</a>
                        </p>
                    </div>
                </div>
            </div>

            <div class="partners__map">
                <svg class="de-map" :viewBox="`0 0 ${VB_W} ${VB_H}`" role="img" aria-label="Schematische Karte von Deutschland" focusable="false">
                    <path class="de-map__border" :d="border" />
                </svg>
            </div>
        </div>
    </section>
</template>

<style scoped>
.partners__grid {
    row-gap: var(--sp-40);
}

.partners__main,
.partners__map {
    grid-column: 1 / -1;
    min-width: 0;
}

.partners__title {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-12);
}

.partners__form {
    margin-top: var(--sp-24);
}

.partners__row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--sp-12) var(--gutter);
}

.partners__field {
    width: 160px;
}

.partners__result {
    margin-top: var(--sp-24);
}

.partners__empty {
    padding-block: var(--sp-16);
}

.de-map {
    width: 100%;
    max-width: 440px;
    height: auto;
}

.de-map__border {
    fill: none;
    stroke: var(--c-line-2);
    stroke-width: 1;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
}

@media (min-width: 1024px) {
    .partners__main {
        grid-column: 1 / span 4;
    }

    .partners__map {
        grid-column: 6 / span 7;
    }

    .de-map {
        max-width: 520px;
    }
}
</style>
