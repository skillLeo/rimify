<script setup lang="ts">
/**
 * The vehicle selector: the guided route on the left, the key numbers on the right.
 *
 * Two routes in, because the two halves of this audience are genuinely different. Someone who
 * knows their car picks make → model → variant; someone holding their Fahrzeugschein types four
 * characters and three, which is faster — and is also the only route that can resolve to two cars.
 *
 * Three outcomes, and none of them is a dead end (R-09):
 *   one match       → the vehicle is written and the listing opens;
 *   several matches → the card expands into a chooser. NEVER an error — a confirmation;
 *   no match        → everything typed stays on screen and three ways forward are offered.
 *
 * The drill is server-driven, so the back button works and a chosen make is a shareable URL.
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
        /** The hero card is tighter than the full-page version. */
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

const rows = computed(() => {
    const needle = query.value.trim().toLowerCase()

    if (level.value === 'make') {
        return props.makes
            .filter((m) => needle === '' || m.make.toLowerCase().includes(needle))
            .map((m) => ({ key: m.make, label: m.make, note: `${m.models}`, blocked: false }))
    }

    if (level.value === 'model') {
        return props.models
            .filter((m) => needle === '' || m.model.toLowerCase().includes(needle))
            .map((m) => ({ key: m.model, label: m.model, note: `${m.variants}`, blocked: false }))
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
        <div class="vsel__col">
            <div class="vsel__head">
                <button v-if="level !== 'make'" class="vsel__back" type="button" @click="back">
                    <Icon name="chevron-right" :size="20" />
                    {{ level === 'variant' ? selectedMake : 'Zurück' }}
                </button>
                <span class="t-h3 vsel__title">Wähle dein Auto</span>
            </div>

            <label class="visually-hidden" :for="`vsel-q-${basePath}`">Suche</label>
            <div class="vsel__search">
                <Icon name="search" :size="20" />
                <input
                    :id="`vsel-q-${basePath}`"
                    v-model="query"
                    class="field vsel__input"
                    type="search"
                    placeholder="Suche"
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
        </div>

        <div class="vsel__divider mobile-only"><span>ODER</span></div>

        <div class="vsel__col vsel__col--keys">
            <span class="t-h3 vsel__title">Oder ganz einfach mit Fahrzeugschein</span>

            <form @submit.prevent="submitKeys">
                <div class="vsel__keys">
                    <div>
                        <label class="field-label" :for="`hsn-${basePath}`">
                            HSN
                            <button
                                class="vsel__help"
                                type="button"
                                aria-label="Wo finde ich HSN und TSN?"
                                @click="helpOpen = !helpOpen"
                            >
                                ?
                            </button>
                        </label>
                        <input
                            :id="`hsn-${basePath}`"
                            class="field field--key"
                            :class="{ 'field--error': keys.errors.hsn }"
                            :value="keys.hsn"
                            inputmode="numeric"
                            maxlength="4"
                            autocomplete="off"
                            placeholder="0005"
                            @input="onHsn"
                        />
                        <span v-if="keys.errors.hsn" class="field-error">{{ keys.errors.hsn }}</span>
                    </div>

                    <div>
                        <label class="field-label" :for="`tsn-${basePath}`">TSN</label>
                        <input
                            :id="`tsn-${basePath}`"
                            ref="tsnField"
                            class="field field--key"
                            :class="{ 'field--error': keys.errors.tsn }"
                            :value="keys.tsn"
                            inputmode="text"
                            maxlength="3"
                            autocomplete="off"
                            placeholder="AAS"
                            @input="onTsn"
                        />
                        <span v-if="keys.errors.tsn" class="field-error">{{ keys.errors.tsn }}</span>
                    </div>
                </div>

                <button
                    class="btn btn--primary btn--block vsel__go"
                    type="submit"
                    :disabled="keys.processing"
                >
                    {{ keys.processing ? 'Wird geprüft …' : 'Fahrzeug wählen' }}
                </button>
            </form>

            <button class="vsel__helplink mobile-only" type="button" @click="helpOpen = !helpOpen">
                Wo finde ich HSN und TSN?
            </button>

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
                    <span class="vsel__candidate-name">{{ row.label }}</span>
                    <span class="data vsel__candidate-values">
                        <template v-for="attribute in lookup.distinction.attributes" :key="attribute">
                            {{ lookup.distinction.labels[attribute] }}:
                            {{ row.values[attribute] }}
                        </template>
                        <template v-if="row.vsn"> VSN {{ row.vsn }}</template>
                    </span>
                    <Icon name="chevron-right" :size="20" />
                </button>
            </div>

            <!-- No match. Everything typed stays; three ways forward. -->
            <div v-else-if="lookup?.status === 'not_found'" class="vsel__miss">
                <p class="vsel__miss-title">
                    <Icon name="warning" :size="20" />
                    Zu dieser Kombination haben wir kein Fahrzeug gefunden.
                </p>
                <div class="vsel__miss-actions">
                    <button class="btn btn--secondary" type="button" @click="helpOpen = true">
                        Schlüsselnummern prüfen
                    </button>
                    <Link :href="basePath" class="btn btn--secondary">Stattdessen Marke wählen</Link>
                    <Link href="/kontakt" class="btn btn--quiet">Daten an RIMIFY senden</Link>
                </div>
            </div>

            <div v-if="helpOpen" class="vsel__doc">
                <div class="vsel__toggle" role="group" aria-label="Fahrzeugschein">
                    <button
                        class="pill"
                        :class="{ 'pill--on': doc === 'neu' }"
                        type="button"
                        @click="doc = 'neu'"
                    >
                        Neuer Fahrzeugschein
                    </button>
                    <button
                        class="pill"
                        :class="{ 'pill--on': doc === 'alt' }"
                        type="button"
                        @click="doc = 'alt'"
                    >
                        Alter Fahrzeugschein
                    </button>
                </div>

                <DocFacsimile :variant="doc" :width="520" />
            </div>

            <p class="quiet vsel__hint">
                Findest du dein Fahrzeug nicht?
                <Link href="/kontakt" class="vsel__hintlink">Wir suchen es für dich.</Link>
            </p>
        </div>
    </div>
</template>

<style scoped>
.vsel {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--s6);
    align-items: start;
}

.vsel--compact {
    gap: var(--s5);
}

.vsel__col {
    min-width: 0;
}

.vsel__head {
    display: flex;
    align-items: center;
    gap: var(--s3);
    margin-bottom: var(--s3);
}

.vsel__title {
    margin: 0;
}

.vsel__back {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding-inline: var(--s2);
    background: transparent;
    border: 0;
    color: var(--blue);
    font-size: 14px;
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
    left: var(--s3);
    pointer-events: none;
}

.vsel__input {
    padding-left: 44px;
}

.vsel__rows {
    margin-top: var(--s3);
}

.vsel__label {
    display: inline-flex;
    align-items: center;
    gap: var(--s2);
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
    color: inherit;
    opacity: 0.7;
}

.vsel__empty {
    padding: var(--s4) 0;
    margin: 0;
}

.vsel__keys {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: var(--s3);
    margin-top: var(--s3);
}

.vsel__help {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    margin-left: 6px;
    border-radius: 50%;
    border: 1px solid var(--line);
    background: var(--surface);
    color: var(--ink2);
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    vertical-align: middle;
}

.vsel__go {
    margin-top: var(--s4);
}

.vsel__helplink {
    margin-top: var(--s3);
    background: transparent;
    border: 0;
    padding: 0;
    color: var(--blue);
    font-size: 14px;
    font-weight: 700;
    text-align: left;
    cursor: pointer;
    min-height: 44px;
}

.vsel__chooser {
    margin-top: var(--s4);
}

.vsel__chooser-title {
    margin: 0 0 var(--s3);
}

.vsel__chooser-note {
    margin: 0 0 var(--s3);
    font-size: 13px;
}

/* White with a hairline, 72px tall. It must read as a list of cars, not as an error panel. */
.vsel__candidate {
    display: flex;
    align-items: center;
    gap: var(--s3);
    width: 100%;
    min-height: 72px;
    padding: var(--s3);
    margin-bottom: var(--s2);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--r-btn);
    text-align: left;
    cursor: pointer;
}

.vsel__candidate:hover {
    background: var(--wash);
}

.vsel__candidate-name {
    font-weight: 700;
    flex: 1;
    min-width: 0;
}

.vsel__candidate-values {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s3);
    color: var(--ink2);
}

.vsel__miss {
    margin-top: var(--s4);
    padding: var(--s4);
    background: var(--warn-w);
    border-radius: var(--r-img);
}

.vsel__miss-title {
    display: flex;
    align-items: center;
    gap: var(--s2);
    margin: 0 0 var(--s3);
    color: var(--warn);
    font-size: 14px;
    font-weight: 700;
}

.vsel__miss-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s2);
}

.vsel__doc {
    margin-top: var(--s4);
}

.vsel__toggle {
    display: flex;
    gap: var(--s2);
    margin-bottom: var(--s3);
}

.vsel__hint {
    margin-top: var(--s4);
    font-size: 13px;
}

.vsel__hintlink {
    color: var(--blue);
}

.vsel__divider {
    display: none;
}

@media (max-width: 860px) {
    .vsel {
        grid-template-columns: 1fr;
        gap: var(--s4);
    }

    /* The key-number block comes first on a phone: faster for anyone holding their papers. */
    .vsel__col--keys {
        order: -1;
    }

    .vsel__divider {
        display: flex;
        align-items: center;
        gap: var(--s3);
        color: var(--ink3);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.1em;
    }

    .vsel__divider::before,
    .vsel__divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--line);
    }
}
</style>
