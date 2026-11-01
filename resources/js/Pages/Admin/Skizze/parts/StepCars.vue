<script setup lang="ts">
/**
 * Step 3, Fahrzeuge (the brief §7): staff search the way the paper is written — approval number, type, model or HSN/TSN —
 * and take over a row of the paper as one group: its approval number and kW range link every matching car. A group opens
 * to untick a car; a car whose field K matches but which has no kW is offered to add by hand; a row with no car in the
 * database creates one here, its provenance „aus diesem Gutachten" set by itself.
 */

import { computed, reactive, ref } from 'vue'
import Icon from '../../../../Components/Admin/AdminIcon.vue'
import { EMPTY_ROW, documented, kwRange, type DemoCar, type DemoGroup } from '../gutachtenDemo'
import { useSketch } from '../gutachtenStore'

const store = useSketch()
const { state, go } = store

const query = ref('')
const open = ref<string | null>(null)
const creating = ref(false)
const draft = reactive({ name: 'BMW 3er (E46) 318i Limousine', hsn: '0005', tsn: '', kw: '87' })

const groups = computed(() => {
    const q = query.value.trim().toLowerCase()

    return store.allGroups().filter((group) => {
        if (q === '') {
            return true
        }

        const haystack = [group.sales, group.type, ...group.approvals, ...group.cars.map((car) => `${car.name} ${car.hsn} ${car.tsn} ${car.hsn}/${car.tsn}`)].join(' ').toLowerCase()

        return haystack.includes(q)
    })
})

const emptyShown = computed(() => {
    const q = query.value.trim().toLowerCase()

    return !state.created.some((group) => group.id === EMPTY_ROW.id) && (q === '' || `${EMPTY_ROW.sales} ${EMPTY_ROW.type} ${EMPTY_ROW.approvals.join(' ')}`.toLowerCase().includes(q))
})

const carCount = computed(() => store.chosenGroups().reduce((sum, group) => sum + store.carsOf(group).length, 0))

function label(group: Pick<DemoGroup, 'sales' | 'type' | 'approvals' | 'kwMin' | 'kwMax'>): string {
    return `${group.sales} · Typ ${group.type} · ${group.approvals.join(', ')} · ${kwRange(group.kwMin, group.kwMax)}`
}

function cars(n: number): string {
    return n === 1 ? '1 Fahrzeug' : `${n} Fahrzeuge`
}

function create(): void {
    const kw = Number(draft.kw)
    const car: DemoCar = {
        id: 'e46-1',
        name: draft.name.trim() || 'Neues Fahrzeug',
        hsn: draft.hsn.trim(),
        tsn: draft.tsn.trim() || 'ABC',
        kw: Number.isFinite(kw) && kw > 0 ? kw : null,
        k: 'e1*93/81*0016*09',
        provenance: 'gutachten',
    }

    store.createGroup({ ...EMPTY_ROW, cars: [car], withoutKw: [] })
    creating.value = false
}
</script>

<template>
    <section class="sk-step" aria-labelledby="sk-cars-h">
        <h2 id="sk-cars-h" class="adm-section__title" tabindex="-1">Für welche Fahrzeuge?</h2>
        <p class="adm-note">Eine Gruppe ist eine Zeile des Gutachtens: Genehmigungsnummer und kW-Bereich wie gedruckt. Sie verknüpft jedes passende Fahrzeug der Datenbank.</p>

        <div class="sk-cars">
            <div class="sk-cars__main">
                <div class="form-field">
                    <label class="form-field__label" for="sk-cars-q">Fahrzeuge suchen</label>
                    <input id="sk-cars-q" v-model="query" class="input" type="search" placeholder="Genehmigungsnummer, Typ, Modell oder HSN/TSN" autocomplete="off">
                </div>

                <ul class="sk-results" aria-label="Treffer">
                    <li v-for="group in groups" :key="group.id" class="sk-result" :class="{ 'sk-result--on': state.groups.includes(group.id) }">
                        <div class="sk-result__head">
                            <div class="sk-result__titles">
                                <p class="sk-result__title">{{ label(group) }}</p>
                                <p class="sk-result__sub">
                                    {{ cars(group.cars.length) }} in der Datenbank<template v-if="group.withoutKw.length"> · dazu {{ group.withoutKw.length }} ohne kW-Angabe</template>
                                    <template v-if="group.notes"> · im Gutachten: „{{ group.notes }}“</template>
                                </p>
                            </div>
                            <button
                                class="btn"
                                :class="state.groups.includes(group.id) ? 'btn--secondary' : 'btn--primary'"
                                type="button"
                                :aria-pressed="state.groups.includes(group.id)"
                                @click="store.toggleGroup(group.id)"
                            >
                                <Icon :name="state.groups.includes(group.id) ? 'check' : 'plus'" :size="20" />
                                {{ state.groups.includes(group.id) ? 'Übernommen' : 'Gruppe übernehmen' }}
                            </button>
                        </div>

                        <button class="sk-result__toggle" type="button" :aria-expanded="open === group.id" @click="open = open === group.id ? null : group.id">
                            <Icon :name="open === group.id ? 'chevron-up' : 'chevron-down'" :size="16" />
                            Einzelne Fahrzeuge ansehen
                        </button>

                        <div v-if="open === group.id" class="sk-result__cars">
                            <label v-for="car in group.cars" :key="car.id" class="check sk-car">
                                <input type="checkbox" :checked="!state.excluded.includes(car.id)" :disabled="!state.groups.includes(group.id)" @change="store.toggleCar(car.id)">
                                <span class="sk-car__name">{{ car.name }}</span>
                                <span class="sk-car__meta">HSN/TSN {{ car.hsn }}/{{ car.tsn }} · {{ car.kw === null ? 'keine kW-Angabe' : kwRange(car.kw) }} · Feld K {{ car.k }}</span>
                                <span v-if="!documented(car.provenance)" class="adm-tag adm-tag--neutral">Herkunft nicht belegt</span>
                            </label>
                            <div v-for="car in group.withoutKw" :key="car.id" class="sk-car sk-car--nokw">
                                <span class="sk-car__name">{{ car.name }}</span>
                                <span class="sk-car__meta">HSN/TSN {{ car.hsn }}/{{ car.tsn }} · Feld K {{ car.k }} · keine kW-Angabe, deshalb nicht automatisch verknüpft</span>
                                <button v-if="!state.added.includes(car.id)" class="btn btn--ghost" type="button" :disabled="!state.groups.includes(group.id)" @click="store.addCar(car.id)">Von Hand hinzufügen</button>
                                <span v-else class="sk-count">hinzugefügt</span>
                            </div>
                        </div>
                    </li>

                    <li v-if="emptyShown" class="sk-result sk-result--empty">
                        <div class="sk-result__head">
                            <div class="sk-result__titles">
                                <p class="sk-result__title">{{ label(EMPTY_ROW) }}</p>
                                <p class="sk-result__sub">Noch kein Fahrzeug erfasst · im Gutachten: „{{ EMPTY_ROW.notes }}“</p>
                            </div>
                            <button v-if="!creating" class="btn btn--secondary" type="button" @click="creating = true">
                                <Icon name="plus" :size="20" />
                                Fahrzeug anlegen
                            </button>
                        </div>
                        <form v-if="creating" class="sk-create" @submit.prevent="create">
                            <p class="adm-note">Herkunft: aus diesem Gutachten. Feld K und kW-Bereich kommen aus der Zeile.</p>
                            <div class="sk-create__grid">
                                <div class="form-field">
                                    <label class="form-field__label" for="sk-new-name">Bezeichnung</label>
                                    <input id="sk-new-name" v-model="draft.name" class="input" type="text">
                                </div>
                                <div class="form-field">
                                    <label class="form-field__label" for="sk-new-hsn">HSN</label>
                                    <input id="sk-new-hsn" v-model="draft.hsn" class="input" type="text" inputmode="numeric" maxlength="4">
                                </div>
                                <div class="form-field">
                                    <label class="form-field__label" for="sk-new-tsn">TSN</label>
                                    <input id="sk-new-tsn" v-model="draft.tsn" class="input" type="text" maxlength="8" placeholder="z. B. 589">
                                </div>
                                <div class="form-field">
                                    <label class="form-field__label" for="sk-new-kw">kW</label>
                                    <input id="sk-new-kw" v-model="draft.kw" class="input" type="text" inputmode="numeric">
                                </div>
                            </div>
                            <div class="sk-create__actions">
                                <button class="btn btn--ghost" type="button" @click="creating = false">Abbrechen</button>
                                <button class="btn btn--primary" type="submit">Anlegen und übernehmen</button>
                            </div>
                        </form>
                    </li>
                </ul>

                <p v-if="groups.length === 0 && !emptyShown" class="adm-note">Nichts gefunden. Versuch es mit „X83“, „G191“ oder „0005“.</p>
            </div>

            <aside class="sk-chosen" aria-labelledby="sk-chosen-h">
                <h3 id="sk-chosen-h" class="sk-chosen__title">Ausgewählt</h3>
                <p class="sk-count">{{ state.groups.length }} {{ state.groups.length === 1 ? 'Gruppe' : 'Gruppen' }} · {{ cars(carCount) }}</p>
                <ul class="sk-chosen__list">
                    <li v-for="group in store.chosenGroups()" :key="group.id" class="sk-chosen__item">
                        <span>
                            <span class="sk-chosen__name">{{ group.sales }} ({{ group.type }})</span>
                            <span class="sk-chosen__sub">{{ group.approvals.join(', ') }} · {{ kwRange(group.kwMin, group.kwMax) }} · {{ cars(store.carsOf(group).length) }}</span>
                        </span>
                        <button class="sk-chosen__remove" type="button" :aria-label="`${group.sales} entfernen`" @click="store.toggleGroup(group.id)">
                            <Icon name="close" :size="16" />
                        </button>
                    </li>
                </ul>
                <p v-if="state.groups.length === 0" class="adm-note">Noch keine Gruppe. Übernimm die Zeilen des Gutachtens mit „Gruppe übernehmen“.</p>
            </aside>
        </div>

        <div class="sk-actions">
            <button class="btn btn--secondary sk-actions__left" type="button" @click="go(1)">Zurück</button>
            <button class="btn btn--primary" type="button" :disabled="state.groups.length === 0" @click="go(3)">
                Weiter: Reifen
                <Icon name="arrow-right" :size="20" />
            </button>
        </div>
    </section>
</template>

<style scoped>
.sk-cars {
    display: grid;
    gap: var(--sp-24);
    margin-top: var(--sp-20);
}

@media (min-width: 1100px) {
    .sk-cars {
        grid-template-columns: minmax(0, 1fr) minmax(260px, 320px);
        align-items: start;
    }
}

.sk-cars__main {
    display: grid;
    gap: var(--sp-16);
    min-width: 0;
}

.sk-cars__main .input {
    width: 100%;
}

.sk-results {
    display: grid;
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--c-line);
    list-style: none;
}

/* A result is a row of the list, as a row of the paper is: no box, one hairline under it. */
.sk-result {
    padding: var(--sp-16) 0;
    border-bottom: 1px solid var(--c-line);
}

.sk-result__head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: var(--sp-12);
}

.sk-result__titles {
    min-width: 0;
}

.sk-result__title {
    margin: 0;
    font-weight: 600;
    overflow-wrap: anywhere;
}

.sk-result__sub {
    margin: var(--sp-4) 0 0;
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.sk-result__toggle {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-4);
    min-height: 32px;
    margin-top: var(--sp-8);
    padding: 0;
    border: 0;
    background: none;
    color: var(--c-blue);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
}

.sk-result__cars {
    display: grid;
    gap: var(--sp-8);
    margin-top: var(--sp-12);
    padding-top: var(--sp-12);
    border-top: 1px solid var(--c-line);
}

.sk-car {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-4) var(--sp-12);
}

.sk-car__name {
    font-weight: 600;
}

.sk-car__meta {
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    font-variant-numeric: tabular-nums;
}

.sk-car--nokw {
    padding-top: var(--sp-8);
    border-top: 1px dashed var(--c-line-2);
}

.sk-create {
    display: grid;
    gap: var(--sp-12);
    margin-top: var(--sp-12);
    padding-top: var(--sp-12);
    border-top: 1px solid var(--c-line);
}

.sk-create__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 140px), 1fr));
    gap: var(--sp-12);
}

.sk-create__grid .form-field:first-child {
    grid-column: 1 / -1;
}

.sk-create__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--sp-8);
}

@media (max-width: 599px) {
    .sk-result__head {
        grid-template-columns: minmax(0, 1fr);
    }

    .sk-result__head .btn,
    .sk-result__toggle {
        min-height: 44px;
    }
}

@media (hover: hover) and (pointer: fine) {
    .sk-result__toggle:hover {
        text-decoration: underline;
    }
}

.sk-chosen {
    padding: var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-band);
}

@media (min-width: 1100px) {
    .sk-chosen {
        position: sticky;
        top: calc(var(--adm-topbar-h) + var(--sp-24));
    }
}

.sk-chosen__title {
    margin: 0;
    font-size: var(--fs-body);
    font-weight: 600;
}

.sk-chosen__list {
    display: grid;
    gap: var(--sp-8);
    margin: var(--sp-12) 0 0;
    padding: 0;
    list-style: none;
}

.sk-chosen__item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--sp-8);
    padding: var(--sp-8) 0;
    border-top: 1px solid var(--c-line-2);
}

.sk-chosen__name {
    display: block;
    font-weight: 600;
}

.sk-chosen__sub {
    display: block;
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    overflow-wrap: anywhere;
}

.sk-chosen__remove {
    display: inline-grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: var(--r-control);
    background: none;
    color: var(--c-ink-2);
    cursor: pointer;
}
</style>
