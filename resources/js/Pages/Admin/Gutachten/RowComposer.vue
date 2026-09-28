<script setup lang="ts">
/**
 * „Zeilen hinzufügen“: vehicles found by name or HSN/TSN, sizes found by model or SKU — a whole model
 * at once where the Gutachten covers all of it — and one set of row fields for all of them. Sending
 * makes a row for every vehicle × size (FitmentRows); rows already there stay as they are.
 *
 * Thirty rows in fifteen minutes is the goal: search, tick, type the tyre sizes once, send.
 */

import { router } from '@inertiajs/vue3'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import { focusRefused } from '../../../composables/admin/focusRefused'
import type { DocumentConditionView, RowForm, VehicleHit, WheelGroup } from '../../../types/admin/gutachten'
import RowFields from './RowFields.vue'
import VehicleFromDocument from './VehicleFromDocument.vue'
import { emptyRow, payload, unreadable } from './rows'

const props = defineProps<{
    documentId: number
    conditions: DocumentConditionView[]
    pageCount: number | null
    /** The body styles and drives a document may name, for a car created from it. */
    bodyForms: string[]
    drives: string[]
}>()

const emit = defineEmits<{ done: [] }>()

const root = ref<HTMLElement | null>(null)
const vehicleInput = ref<HTMLInputElement | null>(null)

/* ── Searching ─────────────────────────────────────────────────────────────── */

async function search<T>(url: string): Promise<T | null> {
    try {
        const response = await fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } })

        return response.ok ? ((await response.json()) as T) : null
    } catch {
        return null
    }
}

const vehicleTerm = ref('')
const vehicleHits = ref<VehicleHit[]>([])
const vehicleMore = ref(false)
const vehicleFailed = ref(false)
/** The term the list on screen answers, or null before the first answer. */
const vehicleAnswered = ref<string | null>(null)
const chosenVehicles = ref<VehicleHit[]>([])

const wheelTerm = ref('')
const wheelGroups = ref<WheelGroup[]>([])
const wheelMore = ref(false)
const wheelFailed = ref(false)
const wheelAnswered = ref<string | null>(null)
const chosenSizes = ref<{ id: number; label: string; model: string }[]>([])

let vehicleTimer: ReturnType<typeof setTimeout> | undefined
let wheelTimer: ReturnType<typeof setTimeout> | undefined

/* Each search counts: an answer that arrives after a newer question was asked is dropped, so the list
   always answers what is in the box. */
let vehicleAsked = 0
let wheelAsked = 0

async function findVehicles(term: string): Promise<void> {
    clearTimeout(vehicleTimer)
    const asked = ++vehicleAsked
    const answer = await search<{ items: VehicleHit[]; more: boolean }>(`/admin/gutachten/suche/fahrzeuge?q=${encodeURIComponent(term)}`)

    if (asked !== vehicleAsked) {
        return
    }

    vehicleFailed.value = answer === null
    vehicleHits.value = answer?.items ?? []
    vehicleMore.value = answer?.more ?? false
    vehicleAnswered.value = answer === null ? null : term
}

async function findWheels(term: string): Promise<void> {
    clearTimeout(wheelTimer)
    const asked = ++wheelAsked
    const answer = await search<{ groups: WheelGroup[]; more: boolean }>(`/admin/gutachten/suche/felgen?q=${encodeURIComponent(term)}`)

    if (asked !== wheelAsked) {
        return
    }

    wheelFailed.value = answer === null
    wheelGroups.value = answer?.groups ?? []
    wheelMore.value = answer?.more ?? false
    wheelAnswered.value = answer === null ? null : term
}

watch(vehicleTerm, (term) => {
    clearTimeout(vehicleTimer)
    vehicleTimer = setTimeout(() => void findVehicles(term), 250)
})

watch(wheelTerm, (term) => {
    clearTimeout(wheelTimer)
    wheelTimer = setTimeout(() => void findWheels(term), 250)
})

// The first lists before anything is typed: often the vehicle or model is right there.
onMounted(() => {
    void findVehicles('')
    void findWheels('')
})

onBeforeUnmount(() => {
    clearTimeout(vehicleTimer)
    clearTimeout(wheelTimer)
})

function hasVehicle(id: number): boolean {
    return chosenVehicles.value.some((v) => v.id === id)
}

function toggleVehicle(hit: VehicleHit): void {
    if (hasVehicle(hit.id)) {
        chosenVehicles.value = chosenVehicles.value.filter((v) => v.id !== hit.id)
        // „… ist angelegt und gewählt.“ is no longer true once that car is taken off.
        adoptedId.value = adoptedId.value === hit.id ? null : adoptedId.value
    } else {
        chosenVehicles.value = [...chosenVehicles.value, hit]
    }
}

function hasSize(id: number): boolean {
    return chosenSizes.value.some((s) => s.id === id)
}

function toggleSize(size: { id: number; label: string }, model: string): void {
    chosenSizes.value = hasSize(size.id) ? chosenSizes.value.filter((s) => s.id !== size.id) : [...chosenSizes.value, { id: size.id, label: size.label, model }]
}

function wholeModel(group: WheelGroup): boolean {
    return group.sizes.every((s) => hasSize(s.id))
}

/** Some of a model's sizes, not all: the model's box shows it as mixed. */
function partlyChosen(group: WheelGroup): boolean {
    return !wholeModel(group) && group.sizes.some((s) => hasSize(s.id))
}

function toggleModel(group: WheelGroup): void {
    if (wholeModel(group)) {
        const ids = new Set(group.sizes.map((s) => s.id))
        chosenSizes.value = chosenSizes.value.filter((s) => !ids.has(s.id))
    } else {
        group.sizes.filter((s) => !hasSize(s.id)).forEach((s) => chosenSizes.value.push({ id: s.id, label: s.label, model: group.model }))
    }
}

function modelLabel(group: WheelGroup): string {
    const n = group.sizes.length

    return group.partial ? `${group.model} – die ${n} gezeigten Größen` : `${group.model} – ${n === 1 ? 'die eine Größe' : `alle ${n} Größen`}`
}

/* A car just created from this document heads the list and is chosen: it was made for these rows. The
   line saying so goes when the rows are sent or the car is taken off again. */
const adoptedId = ref<number | null>(null)
const adopted = computed(() => {
    const vehicle = chosenVehicles.value.find((v) => v.id === adoptedId.value)

    return vehicle ? `${vehicle.label} ist angelegt und gewählt.` : ''
})

function adopt(vehicle: VehicleHit): void {
    vehicleHits.value = [vehicle, ...vehicleHits.value.filter((v) => v.id !== vehicle.id)]

    if (!hasVehicle(vehicle.id)) {
        chosenVehicles.value = [...chosenVehicles.value, vehicle]
    }

    adoptedId.value = vehicle.id
}

/** What a vehicle still lacks for a verdict (R-03) — said once, not guessed per field. */
function missing(hit: VehicleHit): string {
    return hit.needsReview ? ' · Angaben für die Prüfung fehlen' : ''
}

/* ── The row fields and sending ─────────────────────────────────────────────── */

const form = ref<RowForm>(emptyRow())
const errors = ref<Record<string, string | undefined>>({})
const busy = ref(false)

const count = computed(() => chosenVehicles.value.length * chosenSizes.value.length)

/** Sentences about a chosen vehicle, size or Auflage that went away meanwhile: said at the button. */
const choiceErrors = computed(() =>
    Object.entries(errors.value)
        .filter(([key, message]) => message && /^(vehicle_ids|config_ids|conditions)\.\d+/.test(key))
        .map(([, message]) => message as string)
        .filter((message, index, all) => all.indexOf(message) === index)
)

function submit(): void {
    if (unreadable(form.value).length > 0) {
        focusRefused(root.value)

        return
    }

    if (count.value === 0 || busy.value) {
        return
    }

    busy.value = true
    router.post(
        `/admin/gutachten/${props.documentId}/zeilen`,
        { ...payload(form.value), vehicle_ids: chosenVehicles.value.map((v) => v.id), config_ids: chosenSizes.value.map((s) => s.id) } as never,
        {
            preserveScroll: true,
            onSuccess: () => {
                errors.value = {}
                // The next entry is usually the next vehicle type with the same sizes: the sizes stay,
                // and the keyboard goes back to the vehicle search.
                chosenVehicles.value = []
                adoptedId.value = null
                form.value = { ...emptyRow(), tyre_sizes: form.value.tyre_sizes, source_page: form.value.source_page }
                emit('done')
                vehicleInput.value?.focus()
            },
            onError: (bag) => {
                errors.value = bag
                focusRefused(root.value)
            },
            onFinish: () => {
                busy.value = false
            },
        }
    )
}

/** A size line removed or edited: its old sentence no longer belongs to the line now in its place. */
function sizesChanged(): void {
    errors.value = Object.fromEntries(Object.entries(errors.value).filter(([key]) => !key.startsWith('tyre_sizes')))
}
</script>

<template>
    <!-- Not a form: Enter in a search box searches, and rows are sent by the button alone. -->
    <div ref="root" class="rc">
        <div class="rc-pick">
            <section class="rc-col" aria-labelledby="rc-h-vehicles">
                <h3 id="rc-h-vehicles" class="rc-col__title">Fahrzeuge</h3>
                <label class="visually-hidden" for="rc-vehicle-q">Fahrzeuge suchen</label>
                <input
                    id="rc-vehicle-q"
                    ref="vehicleInput"
                    v-model="vehicleTerm"
                    class="input"
                    type="search"
                    placeholder="Marke, Modell, Fahrzeugtyp, EG-Nummer oder HSN/TSN"
                    autocomplete="off"
                    @keydown.enter.prevent="findVehicles(vehicleTerm)"
                >
                <div v-if="vehicleFailed" class="rc-failed">
                    <p class="form-field__error">Die Suche antwortet gerade nicht.</p>
                    <button class="btn btn--ghost" type="button" @click="findVehicles(vehicleTerm)">Noch einmal suchen</button>
                </div>
                <ul v-if="vehicleHits.length" class="rc-hits">
                    <li v-for="hit in vehicleHits" :key="hit.id">
                        <label class="rc-hit">
                            <input type="checkbox" :checked="hasVehicle(hit.id)" @change="toggleVehicle(hit)">
                            <span>
                                <span class="rc-hit__label">{{ hit.label }}</span>
                                <span class="rc-hit__sub">{{ hit.window }}{{ missing(hit) }}</span>
                            </span>
                        </label>
                    </li>
                </ul>
                <p v-else-if="vehicleAnswered !== null && !vehicleFailed" class="adm-note" role="status">
                    {{ vehicleAnswered === '' ? 'Es gibt noch keine Fahrzeuge.' : `Kein Fahrzeug passt zu „${vehicleAnswered}“.` }}
                </p>
                <p v-if="vehicleMore" class="form-field__help">Mehr Treffer, als hier Platz haben. Such genauer.</p>
                <ul v-if="chosenVehicles.length" class="rc-chips" aria-label="Gewählte Fahrzeuge">
                    <li v-for="vehicle in chosenVehicles" :key="vehicle.id" class="rc-chip">
                        <span>{{ vehicle.label }}</span>
                        <button class="adm-iconbtn rc-chip__x" type="button" :aria-label="`${vehicle.label} abwählen`" @click="toggleVehicle(vehicle)">
                            <Icon name="close" :size="16" />
                        </button>
                    </li>
                </ul>
                <p v-if="errors.vehicle_ids" class="form-field__error">{{ errors.vehicle_ids }}</p>
                <p v-if="adopted" class="adm-note" role="status">{{ adopted }}</p>
                <!-- The car the document names, when no list has it yet (Block C, item 7). -->
                <VehicleFromDocument :document-id="documentId" :page-count="pageCount" :body-forms="bodyForms" :drives="drives" @created="adopt" />
            </section>

            <section class="rc-col" aria-labelledby="rc-h-sizes">
                <h3 id="rc-h-sizes" class="rc-col__title">Felgengrößen</h3>
                <label class="visually-hidden" for="rc-wheel-q">Felgengrößen suchen</label>
                <input
                    id="rc-wheel-q"
                    v-model="wheelTerm"
                    class="input"
                    type="search"
                    placeholder="Marke, Modell oder SKU"
                    autocomplete="off"
                    @keydown.enter.prevent="findWheels(wheelTerm)"
                >
                <div v-if="wheelFailed" class="rc-failed">
                    <p class="form-field__error">Die Suche antwortet gerade nicht.</p>
                    <button class="btn btn--ghost" type="button" @click="findWheels(wheelTerm)">Noch einmal suchen</button>
                </div>
                <!-- A box of its own, like the vehicles: the row fields stay within reach below it. -->
                <div v-if="wheelGroups.length" class="rc-sizes">
                    <div v-for="group in wheelGroups" :key="group.model" class="rc-group">
                        <label class="rc-hit rc-hit--model">
                            <input type="checkbox" :checked="wholeModel(group)" :indeterminate="partlyChosen(group)" @change="toggleModel(group)">
                            <span class="rc-hit__label">{{ modelLabel(group) }}</span>
                            <span v-if="group.demo" class="adm-tag adm-tag--neutral">Demodaten</span>
                        </label>
                        <ul class="rc-hits rc-hits--sizes">
                            <li v-for="size in group.sizes" :key="size.id">
                                <label class="rc-hit">
                                    <input type="checkbox" :checked="hasSize(size.id)" @change="toggleSize(size, group.model)">
                                    <span>
                                        <span class="rc-hit__label">{{ size.label }}</span>
                                        <span class="rc-hit__sub">{{ size.finish }} · {{ size.sku }}</span>
                                    </span>
                                </label>
                            </li>
                        </ul>
                    </div>
                </div>
                <p v-else-if="wheelAnswered !== null && !wheelFailed" class="adm-note" role="status">
                    {{ wheelAnswered === '' ? 'Im Katalog gibt es noch keine Felge.' : `Keine Felge passt zu „${wheelAnswered}“.` }}
                </p>
                <p v-if="wheelMore" class="form-field__help">Mehr Größen, als hier Platz haben. Such genauer, zum Beispiel nach dem Modell.</p>
                <p v-if="chosenSizes.length" class="rc-summary">{{ chosenSizes.length === 1 ? '1 Größe gewählt' : `${chosenSizes.length} Größen gewählt` }}</p>
                <p v-if="errors.config_ids" class="form-field__error">{{ errors.config_ids }}</p>
            </section>
        </div>

        <RowFields v-model:form="form" :conditions="conditions" :errors="errors" id-prefix="rc" :page-count="pageCount" @sizes-changed="sizesChanged" />

        <div class="rc-foot">
            <button class="btn btn--primary" type="button" :disabled="count === 0 || busy" :aria-busy="busy ? 'true' : undefined" @click="submit">
                {{ count === 0 ? 'Zeilen anlegen' : count === 1 ? '1 Zeile anlegen' : `${count} Zeilen anlegen` }}
            </button>
            <p v-if="count === 0" class="adm-note">Wähl mindestens ein Fahrzeug und mindestens eine Felgengröße.</p>
            <p v-else class="adm-note">{{ chosenVehicles.length }} {{ chosenVehicles.length === 1 ? 'Fahrzeug' : 'Fahrzeuge' }} × {{ chosenSizes.length }} {{ chosenSizes.length === 1 ? 'Größe' : 'Größen' }}, alle mit diesen Angaben.</p>
            <p v-for="message in choiceErrors" :key="message" class="form-field__error rc-foot__error">{{ message }}</p>
        </div>
    </div>
</template>
<style scoped>
.rc {
    display: grid;
    gap: var(--sp-24);
}

.rc-pick {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--sp-24);
}

.rc-col {
    display: grid;
    align-content: start;
    gap: var(--sp-8);
    min-width: 0;
}

.rc-col__title {
    margin: 0;
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    font-weight: 600;
}

.rc-hits {
    max-height: 280px;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
    border-top: 1px solid var(--c-line);
}

.rc-hits--sizes {
    max-height: none;
    padding-left: var(--sp-24);
    overflow: visible;
    border-top: 0;
}

.rc-sizes {
    max-height: 360px;
    overflow-y: auto;
    overscroll-behavior: contain;
}

.rc-failed {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8) var(--sp-12);
}

.rc-failed .form-field__error {
    margin: 0;
}

.rc-foot__error {
    flex-basis: 100%;
    margin: 0;
}

.rc-hit {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-8);
    min-height: var(--adm-control-h);
    padding: var(--sp-4) 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    cursor: pointer;
}

.rc-hit input {
    flex: none;
    width: 20px;
    height: 20px;
    margin: 2px 0 0;
    accent-color: var(--c-ink);
}

.rc-hit--model {
    font-weight: 500;
    border-top: 1px solid var(--c-line);
    padding-top: var(--sp-8);
}

.rc-hit__label {
    display: block;
    overflow-wrap: anywhere;
}

.rc-hit__sub {
    display: block;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
}

.rc-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
    margin: 0;
    padding: 0;
    list-style: none;
}

.rc-chip {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-4);
    max-width: 100%;
    padding-left: var(--sp-8);
    border-radius: var(--r-control);
    background: var(--c-band);
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
}

.rc-chip span {
    overflow-wrap: anywhere;
}

.rc-summary {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 500;
}

.rc-foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-12);
}

@media (max-width: 1023px) {
    .rc-pick {
        grid-template-columns: minmax(0, 1fr);
    }
}

@media (max-width: 767px) {
    .rc-hit {
        min-height: var(--adm-control-h-lg);
    }

    .rc-foot .btn {
        width: 100%;
        min-height: var(--adm-control-h-lg);
    }
}
</style>
