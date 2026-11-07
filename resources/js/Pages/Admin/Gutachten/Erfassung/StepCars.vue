<script setup lang="ts">
/**
 * Step 3, Fahrzeuge (the client's change of 05.11.2026: „search for vehicles using their details, such as HSN/TSN, model,
 * approval number … All groupings should be removed“): one search field, single cars with HSN/TSN, kW and field K, ticked one
 * by one. „Alle Treffer auswählen“ ticks every result of the search as it stands — a shortcut: nothing is stored as a group,
 * and nothing joins by itself later. The selection beside it lists cars.
 */

import { computed, nextTick, onMounted, ref, watch } from 'vue'
import AdminConfirm from '../../../../Components/Admin/AdminConfirm.vue'
import Icon from '../../../../Components/Admin/AdminIcon.vue'
import { decimal } from '../../../../format'
import type { VehicleHit } from '../../../../types/admin/gutachten'
import VehicleFromDocument from '../VehicleFromDocument.vue'
import { Refused, send, useEntry, type CarView, useGutachtenPage, carLine, distinctCars } from './entryStore'

interface CarHit {
    id: number
    label: string
    hsnTsn: string | null
    kw: number | null
    k: string | null
    window: string | null
    needsReview: boolean
}

const store = useEntry()
const { state, go } = store
const page = useGutachtenPage()

const query = ref('')
const hits = ref<CarHit[]>([])
const total = ref(0)
const searching = ref(false)
const searched = ref(false)
/* The term the list on screen answers: the shortcut acts on the list shown, never on a term still being typed. */
const answered = ref('')
const failure = ref('')
const busy = ref(false)
const removing = ref<CarView | null>(null)
const removeOpen = computed({
    get: () => removing.value !== null,
    set: (open: boolean) => {
        if (!open) {
            removing.value = null
        }
    },
})

const chosen = computed(() => distinctCars(state.entry.cars))
const selected = computed(() => new Map(chosen.value.map((car) => [car.vehicleId, car])))
const unticked = computed(() => hits.value.filter((hit) => !selected.value.has(hit.id)).length)
const pageCount = computed(() => page.props.document.pageCount)

let timer: ReturnType<typeof setTimeout> | undefined
/* The search on screen: a late answer to an older one never replaces it. */
let asked = 0

async function search(): Promise<void> {
    const term = query.value.trim()
    const mine = ++asked

    if (term.length < 2) {
        hits.value = []
        total.value = 0
        answered.value = ''
        searched.value = false
        searching.value = false

        return
    }

    searching.value = true

    try {
        const answer = await send<{ items: CarHit[]; total: number }>('GET', `/admin/gutachten/suche/fahrzeuge?q=${encodeURIComponent(term)}`)

        if (mine === asked) {
            hits.value = answer.items
            total.value = answer.total
            answered.value = term
            searched.value = true
        }
    } catch {
        if (mine === asked) {
            // Not the old list under the new term.
            hits.value = []
            total.value = 0
            answered.value = ''
            failure.value = 'Die Suche hat nicht geantwortet. Versuch es noch einmal.'
        }
    } finally {
        if (mine === asked) {
            searching.value = false
        }
    }
}

watch(query, () => {
    clearTimeout(timer)
    failure.value = ''
    timer = setTimeout(() => void search(), 250)
})

onMounted(() => document.getElementById('ef-cars-q')?.focus({ preventScroll: true }))

async function add(body: { vehicle_ids: number[] } | { treffer: string }): Promise<void> {
    failure.value = ''

    try {
        await store.save('POST', '/fahrzeuge', body)
    } catch (error) {
        failure.value = error instanceof Refused ? error.message : 'Das hat nicht geklappt. Versuch es noch einmal.'
    }
}

async function addAll(): Promise<void> {
    busy.value = true
    await add({ treffer: answered.value })
    busy.value = false
}

/* One request per car, however often its box is pressed. */
const ticking = new Set<number>()

/*
 * A box says what is chosen, whatever happened on the way: a question answered „Abbrechen“, a refusal. It stays usable meanwhile,
 * so two ticks in a row are two cars, and the keyboard keeps its place.
 */
async function toggle(hit: CarHit, box: HTMLInputElement): Promise<void> {
    if (!ticking.has(hit.id)) {
        ticking.add(hit.id)

        const car = selected.value.get(hit.id)

        if (car === undefined) {
            await add({ vehicle_ids: [hit.id] })
        } else if (car.lines + car.unread + car.codes > 0) {
            removing.value = car
        } else {
            await remove(car)
        }

        ticking.delete(hit.id)
    }

    await nextTick()
    box.checked = selected.value.has(hit.id)
}

/* One request, however often the button is pressed. */
const leaving = new Set<number>()

async function remove(car: CarView): Promise<void> {
    removing.value = null

    if (leaving.has(car.id)) {
        return
    }

    leaving.add(car.id)
    failure.value = ''

    try {
        await store.save('DELETE', `/fahrzeuge/${car.id}`)
    } catch (error) {
        failure.value = error instanceof Refused ? error.message : 'Das hat nicht geklappt. Versuch es noch einmal.'
    } finally {
        leaving.delete(car.id)
    }
}

function created(vehicle: VehicleHit): void {
    void add({ vehicle_ids: [vehicle.id] })
}
</script>

<template>
    <section class="ef-step" aria-labelledby="ef-cars-h">
        <h2 id="ef-cars-h" class="adm-section__title" tabindex="-1">Für welche Fahrzeuge gilt das Gutachten?</h2>
        <p class="adm-note">Such nach HSN/TSN, Marke und Modell, Fahrzeugtyp, Betriebserlaubnis (Feld K) oder kW und hak die Fahrzeuge an, die im Gutachten stehen.</p>

        <div class="ef-cars">
            <div class="ef-cars__main">
                <div class="form-field">
                    <label class="form-field__label" for="ef-cars-q">Fahrzeug suchen</label>
                    <input id="ef-cars-q" v-model="query" class="input" type="search" placeholder="z. B. 0005 BGU, BMW X3, X83, e1*2001/116*0249 oder 150 kW" autocomplete="off" spellcheck="false">
                </div>

                <p v-if="failure" class="adm-alert" role="alert">{{ failure }}</p>

                <div v-if="hits.length" class="ef-cars__head">
                    <span class="ef-count" role="status">{{ total === 1 ? '1 Treffer' : `${decimal(total, 0)} Treffer` }}<template v-if="total > hits.length">, die ersten {{ decimal(hits.length, 0) }} stehen hier</template></span>
                    <button v-if="state.editable" class="btn btn--secondary" type="button" :disabled="busy || searching || query.trim() !== answered || (unticked === 0 && total === hits.length)" :aria-busy="busy ? 'true' : undefined" @click="addAll">Alle Treffer auswählen</button>
                </div>

                <ul v-if="hits.length" class="ef-hits">
                    <li v-for="hit in hits" :key="hit.id" class="ef-hit">
                        <label class="ef-hit__label">
                            <input type="checkbox" :checked="selected.has(hit.id)" :disabled="!state.editable" @change="toggle(hit, $event.target as HTMLInputElement)">
                            <span class="ef-hit__text">
                                <span class="ef-hit__name">{{ hit.label }}</span>
                                <span class="ef-hit__facts">
                                    <span>{{ hit.hsnTsn ?? 'HSN/TSN noch nicht hinterlegt' }}</span>
                                    <span>{{ hit.kw === null ? 'kW nicht hinterlegt' : `${decimal(hit.kw, 0)} kW` }}</span>
                                    <span>Feld K {{ hit.k ?? 'nicht hinterlegt' }}</span>
                                    <span v-if="hit.window">{{ hit.window }}</span>
                                    <span v-if="hit.needsReview" class="adm-tag adm-tag--neutral">Angaben für die Prüfung fehlen</span>
                                </span>
                            </span>
                        </label>
                    </li>
                </ul>

                <p v-else-if="searched && !searching" class="adm-note">Kein Fahrzeug gefunden. Steht es so im Gutachten, leg es unten an.</p>

                <VehicleFromDocument v-if="state.editable" :document-id="state.documentId" :page-count="pageCount" :body-forms="page.props.choices.bodyForms" :drives="page.props.choices.drives" @created="created" />
            </div>

            <aside class="ef-cars__side" aria-labelledby="ef-chosen-h">
                <h3 id="ef-chosen-h" class="ef-side__title">{{ chosen.length === 1 ? '1 Fahrzeug gewählt' : `${decimal(chosen.length, 0)} Fahrzeuge gewählt` }}</h3>
                <ul v-if="chosen.length" class="ef-chosen">
                    <li v-for="car in chosen" :key="car.vehicleId" class="ef-chosen__car">
                        <span class="ef-chosen__text">
                            {{ carLine(car.label) }}
                            <span v-if="car.finish || car.axle !== 'ALL'" class="ef-chosen__scope">{{ [car.finish ? `nur ${car.finish}` : '', car.axle === 'FRONT' ? 'nur Vorderachse' : car.axle === 'REAR' ? 'nur Hinterachse' : ''].filter(Boolean).join(' · ') }}</span>
                        </span>
                        <button v-if="state.editable" class="ef-iconbtn" type="button" :aria-label="`${car.label} entfernen`" @click="car.lines + car.unread + car.codes > 0 ? (removing = car) : remove(car)">
                            <Icon name="close" :size="16" />
                        </button>
                    </li>
                </ul>
                <p v-else class="adm-note">Noch keines. Hak die Fahrzeuge an, die im Gutachten stehen.</p>
            </aside>
        </div>

        <div class="ef-actions">
            <button class="btn btn--secondary ef-actions__left" type="button" @click="go(1)">Zurück</button>
            <button class="btn btn--primary" type="button" :disabled="chosen.length === 0" @click="go(3)">
                Weiter: Reifen
                <Icon name="arrow-right" :size="20" />
            </button>
        </div>

        <AdminConfirm
            v-model:open="removeOpen"
            title="Fahrzeug entfernen?"
            :body="removing ? `${removing.label} wird aus dieser Erfassung entfernt, mit seinen eingetragenen Reifen.` : ''"
            confirm-label="Entfernen"
            @confirm="removing && remove(removing)"
        />
    </section>
</template>

<style scoped>
.ef-cars {
    display: grid;
    gap: var(--sp-24);
    align-items: start;
    margin-top: var(--sp-20);
}

@media (min-width: 1100px) {
    .ef-cars {
        grid-template-columns: minmax(0, 1fr) minmax(280px, 0.45fr);
    }
}

.ef-cars__main {
    display: grid;
    gap: var(--sp-16);
    min-width: 0;
}

.ef-cars__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-8);
}

.ef-hits {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--c-line);
}

.ef-hit {
    border-bottom: 1px solid var(--c-line);
}

.ef-hit__label {
    display: flex;
    gap: var(--sp-12);
    align-items: flex-start;
    padding: var(--sp-12);
    cursor: pointer;
}

.ef-hit__label input {
    flex: none;
    width: 18px;
    height: 18px;
    margin-top: 2px;
    accent-color: var(--c-blue);
}

@media (hover: hover) and (pointer: fine) {
    .ef-hit__label:hover {
        background: var(--c-band);
    }
}

.ef-hit__text {
    display: grid;
    gap: var(--sp-4);
    min-width: 0;
}

.ef-hit__name {
    overflow-wrap: anywhere;
}

.ef-hit__facts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-4) var(--sp-16);
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    overflow-wrap: anywhere;
}

/* HSN/TSN, kW and field K in their columns from row to row, so a list of a hundred reads down. */
@media (min-width: 768px) {
    .ef-hit__facts {
        display: grid;
        grid-template-columns: calc(18 * var(--ch-text)) calc(8 * var(--ch-text)) calc(24 * var(--ch-text)) auto;
        font-variant-numeric: tabular-nums;
    }

    .ef-hit__facts .adm-tag {
        grid-column: 1 / -1;
        justify-self: start;
    }
}

.ef-cars__side {
    display: grid;
    gap: var(--sp-12);
    min-width: 0;
    padding: var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-band);
}

@media (min-width: 1100px) {
    .ef-cars__side {
        position: sticky;
        top: calc(var(--adm-topbar-h) + var(--sp-16));
    }
}

.ef-chosen {
    display: grid;
    gap: var(--sp-8);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.ef-chosen__car {
    display: flex;
    gap: var(--sp-8);
    align-items: flex-start;
    justify-content: space-between;
}

.ef-chosen__text {
    display: grid;
    gap: var(--sp-4);
    min-width: 0;
    overflow-wrap: anywhere;
}

.ef-chosen__scope {
    color: var(--c-ink-2);
}

.ef-iconbtn {
    display: inline-grid;
    flex: none;
    place-items: center;
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: var(--r-control);
    background: none;
    color: var(--c-ink-2);
    cursor: pointer;
}

@media (hover: hover) and (pointer: fine) {
    .ef-iconbtn:hover {
        color: var(--c-ink);
    }
}
</style>
