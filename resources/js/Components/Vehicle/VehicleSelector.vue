<script setup lang="ts">
/**
 * The vehicle selector: the guided route and the key numbers, side by side.
 *
 * Two routes in, because the two halves of this audience are genuinely different. Someone who
 * knows their car picks Marke → Modell → Variante; someone holding their Fahrzeugschein types four
 * characters and three, which is faster — and is also the only route that can resolve to two cars.
 *
 * Three outcomes, and none of them is a dead end (R-09):
 *   one match       → the vehicle is written and the listing opens;
 *   several matches → the card expands into a chooser. NEVER an error — a confirmation;
 *   no match        → everything typed stays on screen and three ways forward are offered.
 *
 * The drill is server-driven, so the back button works and a chosen make is a shareable URL.
 *
 * Where the key numbers are found is written next to the fields, not hidden in the FAQ: it is the
 * question this form is asked most often, and an answer one tap away is not an answer.
 */

import { Link, router, useForm, usePage } from '@inertiajs/vue3'
import { computed, ref, watch } from 'vue'
import DocFacsimile from '../Art/DocFacsimile.vue'
import Icon from '../Art/Icon.vue'
import type { DocVariant } from '../../art'
import type { LookupResult, VariantOption } from '../../types/pages'

const props = withDefaults(
    defineProps<{
        makes: { make: string; models: number }[]
        models: { model: string; variants: number }[]
        variants: VariantOption[]
        selectedMake: string | null
        selectedModel: string | null
        /** Where a drill step navigates to — the selector page or the check page. */
        basePath?: string
        /** The homepage fold is tighter than the full-page version. */
        compact?: boolean
    }>(),
    { basePath: '/felgen-suchen', compact: false }
)

const page = usePage<{ lookup?: LookupResult }>()
const lookup = computed(() => page.props.lookup ?? null)

const query = ref('')
const doc = ref<DocVariant>('neu')
const helpOpen = ref(false)
const tsnField = ref<HTMLInputElement | null>(null)

const keys = useForm({ hsn: '', tsn: '' })
const choice = useForm({ fahrzeug: 0 })

const level = computed<'make' | 'model' | 'variant'>(() => {
    if (props.selectedMake === null) {
        return 'make'
    }

    return props.selectedModel === null ? 'model' : 'variant'
})

const stepLabel = computed(() => {
    if (level.value === 'make') {
        return 'Marke wählen'
    }

    return level.value === 'model' ? 'Modell wählen' : 'Variante wählen'
})

const rows = computed(() => {
    const needle = query.value.trim().toLowerCase()

    if (level.value === 'make') {
        return props.makes
            .filter((m) => needle === '' || m.make.toLowerCase().includes(needle))
            .map((m) => ({
                key: m.make,
                label: m.make,
                note: `${m.models} Modelle`,
                blocked: false,
            }))
    }

    if (level.value === 'model') {
        return props.models
            .filter((m) => needle === '' || m.model.toLowerCase().includes(needle))
            .map((m) => ({
                key: m.model,
                label: m.model,
                note: `${m.variants} Varianten`,
                blocked: false,
            }))
    }

    return props.variants
        .filter((v) => needle === '' || v.variant.toLowerCase().includes(needle))
        .map((v) => ({
            key: String(v.id),
            label: v.variant,
            note: v.buildWindow,
            // A vehicle we could not characterise can never produce a positive verdict, so it is
            // offered but named as incomplete rather than silently leading to UNKNOWN (R-03).
            blocked: v.needsReview,
        }))
})

// The search box is scoped to the current step, so its contents mean nothing after a drill.
watch(level, () => {
    query.value = ''
})

function step(key: string): void {
    if (level.value === 'make') {
        router.get(props.basePath, { marke: key }, { preserveScroll: true })

        return
    }

    if (level.value === 'model') {
        router.get(
            props.basePath,
            { marke: props.selectedMake, modell: key },
            { preserveScroll: true }
        )

        return
    }

    pick(Number(key))
}

/** Choosing a variant writes the vehicle and opens the listing. */
function pick(vehicleId: number): void {
    choice.fahrzeug = vehicleId
    choice.post('/fahrzeug', { preserveScroll: true })
}

function back(): void {
    if (level.value === 'variant') {
        router.get(props.basePath, { marke: props.selectedMake }, { preserveScroll: true })

        return
    }

    router.get(props.basePath, {}, { preserveScroll: true })
}

function submitKeys(): void {
    keys.post('/fahrzeug/schluesselnummern', { preserveScroll: true })
}

/** Four characters is a complete HSN, so the caret moves on without being asked. */
function onHsn(event: Event): void {
    const value = (event.target as HTMLInputElement).value.toUpperCase().slice(0, 4)
    keys.hsn = value

    if (value.length === 4) {
        tsnField.value?.focus()
    }
}

function onTsn(event: Event): void {
    keys.tsn = (event.target as HTMLInputElement).value.toUpperCase().slice(0, 3)
}
</script>

<template>
    <div class="vsel" :class="{ 'vsel--compact': compact }">
        <!-- Route one: the guided drill. -->
        <section class="vsel__col" aria-labelledby="vsel-drill-title">
            <div class="vsel__head">
                <button v-if="level !== 'make'" class="vsel__back" type="button" @click="back">
                    <Icon name="chevron-right" :size="20" />
                    {{ level === 'variant' ? selectedMake : 'Zurück' }}
                </button>
                <h3 id="vsel-drill-title" class="t-h3 vsel__title">{{ stepLabel }}</h3>
            </div>

            <label class="visually-hidden" :for="`vsel-q-${basePath}`">Marke oder Modell suchen</label>
            <div class="vsel__search">
                <Icon name="search" :size="20" />
                <input
                    :id="`vsel-q-${basePath}`"
                    v-model="query"
                    class="field vsel__input"
                    type="search"
                    placeholder="Suchen"
                    autocomplete="off"
                />
            </div>

            <div class="row-list vsel__rows">
                <button
                    v-for="row in rows"
                    :key="row.key"
                    class="row-item"
                    type="button"
                    :disabled="choice.processing"
                    @click="step(row.key)"
                >
                    <span class="vsel__label">
                        {{ row.label }}
                        <span v-if="row.blocked" class="tag tag--unknown vsel__flag">
                            Daten unvollständig
                        </span>
                    </span>
                    <span class="data vsel__note">{{ row.note }}</span>
                </button>

                <p v-if="rows.length === 0" class="quiet vsel__empty">
                    Kein Treffer. Prüfe die Schreibweise oder nutze die Schlüsselnummern.
                </p>
            </div>
        </section>

        <div class="vsel__divider" aria-hidden="true"><span>oder</span></div>

        <!-- Route two: the key numbers off the registration document. -->
        <section class="vsel__col vsel__col--keys" aria-labelledby="vsel-keys-title">
            <h3 id="vsel-keys-title" class="t-h3 vsel__title">Mit Schlüsselnummern</h3>

            <form @submit.prevent="submitKeys">
                <div class="vsel__keys">
                    <div>
                        <label class="field-label" :for="`hsn-${basePath}`">HSN</label>
                        <input
                            :id="`hsn-${basePath}`"
                            class="field field--key"
                            :class="{ 'field--error': keys.errors.hsn }"
                            :value="keys.hsn"
                            inputmode="numeric"
                            maxlength="4"
                            autocomplete="off"
                            enterkeyhint="next"
                            placeholder="0005"
                            :aria-invalid="keys.errors.hsn ? 'true' : undefined"
                            @input="onHsn"
                        />
                    </div>

                    <div>
                        <label class="field-label" :for="`tsn-${basePath}`">TSN</label>
                        <input
                            :id="`tsn-${basePath}`"
                            ref="tsnField"
                            class="field field--key"
                            :class="{ 'field--error': keys.errors.tsn }"
                            :value="keys.tsn"
                            maxlength="3"
                            autocomplete="off"
                            enterkeyhint="go"
                            placeholder="582"
                            :aria-invalid="keys.errors.tsn ? 'true' : undefined"
                            @input="onTsn"
                        />
                    </div>
                </div>

                <span class="field-error">{{ keys.errors.hsn ?? keys.errors.tsn ?? '' }}</span>

                <!-- The answer to the question this form is asked most, next to the fields. -->
                <p class="field-help">
                    Beide stehen in deiner Zulassungsbescheinigung Teil I – die HSN in Feld 2.1, die
                    TSN in Feld 2.2.
                    <button class="vsel__helplink" type="button" @click="helpOpen = !helpOpen">
                        {{ helpOpen ? 'Abbildung ausblenden' : 'Abbildung zeigen' }}
                    </button>
                </p>

                <button
                    class="btn btn--primary btn--block vsel__go"
                    type="submit"
                    :disabled="keys.processing"
                >
                    {{ keys.processing ? 'Wird geprüft …' : 'Fahrzeug wählen' }}
                </button>
            </form>

            <!-- Several matches. A confirmation, not a failure: the rows carry exactly what
                 differs between the candidates and nothing that does not. -->
            <div v-if="lookup?.status === 'ambiguous' && lookup.distinction" class="vsel__chooser">
                <p class="t-h3 vsel__chooser-title">
                    Zu dieser Schlüsselnummer gibt es mehrere Varianten.
                </p>

                <p v-if="lookup.distinction.indistinguishable" class="quiet vsel__chooser-note">
                    Die Varianten unterscheiden sich in keinem Feld, das wir anzeigen können. Die
                    VSN aus deinem Fahrzeugschein hilft weiter.
                </p>

                <button
                    v-for="row in lookup.distinction.rows"
                    :key="row.id"
                    class="vsel__candidate"
                    type="button"
                    @click="pick(row.id)"
                >
                    <span class="vsel__candidate-text">
                        <span class="vsel__candidate-name">{{ row.label }}</span>
                        <span class="data vsel__candidate-values">
                            <template
                                v-for="attribute in lookup.distinction.attributes"
                                :key="attribute"
                            >
                                {{ lookup.distinction.labels[attribute] }}:
                                {{ row.values[attribute] }}
                            </template>
                            <template v-if="row.vsn"> VSN {{ row.vsn }}</template>
                        </span>
                    </span>
                    <span class="btn btn--secondary btn--sm vsel__candidate-cta">Das ist meins</span>
                </button>
            </div>

            <!-- No match. Everything typed stays; three ways forward. -->
            <div v-else-if="lookup?.status === 'not_found'" class="vsel__miss">
                <p class="vsel__miss-title">
                    <Icon name="warning" :size="20" />
                    Zu dieser Kombination haben wir kein Fahrzeug gefunden.
                </p>
                <div class="vsel__miss-actions">
                    <button class="btn btn--secondary btn--sm" type="button" @click="helpOpen = true">
                        Schlüsselnummern prüfen
                    </button>
                    <Link :href="basePath" class="btn btn--secondary btn--sm">
                        Stattdessen Marke wählen
                    </Link>
                    <Link href="/kontakt" class="btn btn--quiet btn--sm">Daten an RIMIFY senden</Link>
                </div>
            </div>

            <div v-if="helpOpen" class="vsel__doc">
                <div class="vsel__toggle" role="group" aria-label="Fahrzeugschein">
                    <button
                        class="pill"
                        :class="{ 'pill--on': doc === 'neu' }"
                        type="button"
                        :aria-pressed="doc === 'neu'"
                        @click="doc = 'neu'"
                    >
                        Neuer Fahrzeugschein
                    </button>
                    <button
                        class="pill"
                        :class="{ 'pill--on': doc === 'alt' }"
                        type="button"
                        :aria-pressed="doc === 'alt'"
                        @click="doc = 'alt'"
                    >
                        Alter Fahrzeugschein
                    </button>
                </div>

                <DocFacsimile :variant="doc" :width="520" />
            </div>
        </section>
    </div>
</template>

<style scoped>
.vsel {
    display: grid;
    gap: var(--space-5);
    align-items: start;
}

.vsel__col {
    min-width: 0;
}

.vsel__head {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
}

.vsel__title {
    margin: 0;
}

.vsel__back {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    min-height: 44px;
    padding-inline: var(--space-2);
    background: transparent;
    border: 0;
    color: var(--blue);
    font-size: var(--text-small);
    font-weight: 700;
    cursor: pointer;
}

.vsel__back :deep(svg) {
    transform: rotate(180deg);
}

.vsel__search {
    position: relative;
    display: flex;
    align-items: center;
    color: var(--ink3);
}

.vsel__search :deep(svg) {
    position: absolute;
    left: var(--space-3);
    pointer-events: none;
}

.vsel__input {
    padding-left: 44px;
}

.vsel__rows {
    margin-top: var(--space-3);
}

.vsel__label {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.vsel__flag {
    flex: none;
}

.vsel__note {
    flex: none;
}

.vsel__empty {
    padding: var(--space-4) 0;
}

/* "oder" between the two routes: a hairline through the gap, not a heading. */
.vsel__divider {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    color: var(--ink3);
    font-size: var(--text-small);
}

.vsel__divider::before,
.vsel__divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--line);
}

.vsel__keys {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: var(--space-3);
    margin-top: var(--space-3);
}

.vsel__helplink {
    padding: 0;
    background: transparent;
    border: 0;
    color: var(--blue);
    font-size: inherit;
    font-weight: 700;
    text-decoration: underline;
    cursor: pointer;
}

.vsel__go {
    margin-top: var(--space-4);
}

.vsel__chooser {
    margin-top: var(--space-5);
}

.vsel__chooser-title {
    margin-bottom: var(--space-3);
}

.vsel__chooser-note {
    margin-bottom: var(--space-3);
    font-size: var(--text-small);
}

/* A list of cars, not an error panel. */
.vsel__candidate {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    width: 100%;
    min-height: 72px;
    padding: var(--space-3);
    margin-bottom: var(--space-2);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    text-align: left;
    cursor: pointer;
}

@media (hover: hover) and (pointer: fine) {
    .vsel__candidate:hover {
        border-color: var(--ink2);
    }
}

.vsel__candidate-text {
    display: grid;
    gap: var(--space-1);
    min-width: 0;
}

.vsel__candidate-name {
    font-weight: 700;
}

.vsel__candidate-values {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
}

.vsel__candidate-cta {
    flex: none;
}

.vsel__miss {
    margin-top: var(--space-4);
    padding: var(--space-4);
    background: var(--warn-w);
    border-radius: var(--radius-md);
}

.vsel__miss-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
    color: var(--warn);
    font-size: var(--text-small);
    font-weight: 700;
}

.vsel__miss-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
}

.vsel__doc {
    margin-top: var(--space-4);
}

.vsel__toggle {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
}

/* The key-number route comes first on a phone: faster for anyone holding their papers. The
   divider follows it, so "oder" always sits between the two routes. */
.vsel__col--keys {
    order: -2;
}

.vsel__divider {
    order: -1;
}

@media (min-width: 900px) {
    .vsel {
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
        gap: var(--space-6);
    }

    .vsel--compact {
        gap: var(--space-5);
    }

    .vsel__col--keys {
        order: 0;
    }

    .vsel__divider {
        order: 0;
        flex-direction: column;
        align-self: stretch;
    }

    .vsel__divider::before,
    .vsel__divider::after {
        width: 1px;
        height: auto;
    }
}
</style>
