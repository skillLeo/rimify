<script setup lang="ts">
/**
 * Step 4, Reifen — the main screen (the Gutachten rework §7): the paper on the left, what is still open in the middle, one per car
 * and wheel combination (the client's changes of 05.11.2026 and 07.11.2026), the tyres of one of them on the right. The middle column is also where the paper's codes live
 * („Auflagen dieses Gutachtens“), one tab away from the to-do list.
 */

import { computed, ref } from 'vue'
import Icon from '../../../../Components/Admin/AdminIcon.vue'
import CodesPanel from './CodesPanel.vue'
import { carSummary, useEntry, carLine } from './entryStore'
import LinesEditor from './LinesEditor.vue'
import PdfPanel from './PdfPanel.vue'

const store = useEntry()
const { state } = store

const tab = ref<'todo' | 'codes'>('todo')

const cars = computed(() => state.entry.cars)
const done = computed(() => cars.value.filter((car) => car.done).length)
const current = computed(() => store.car(state.carId) ?? cars.value[0])
const combination = computed(() => state.entry.combinations.find((c) => c.id === current.value?.combinationId))
const wheelName = computed(() => state.entry.wheelSizes[0]?.wheel ?? '')
const several = computed(() => state.entry.combinations.length > 1)
const combinationLabel = (id: number): string => state.entry.combinations.find((c) => c.id === id)?.label ?? ''
const percent = computed(() => (cars.value.length === 0 ? 0 : Math.round((done.value / cars.value.length) * 100)))
</script>

<template>
    <section class="ef-step" aria-labelledby="ef-tyres-h">
        <h2 id="ef-tyres-h" class="visually-hidden" tabindex="-1">Reifen</h2>

        <div v-if="cars.length === 0" class="ef-none">
            <p class="adm-note">Noch kein Fahrzeug. Hak in Schritt 3 die Fahrzeuge an, dann trägst du hier ihre Reifen ein.</p>
            <button class="btn btn--primary" type="button" @click="store.go(2)">Zu Schritt 3: Fahrzeuge</button>
        </div>

        <div v-else class="ef-tyres">
            <PdfPanel class="ef-tyres__pdf" />

            <aside class="ef-side" aria-label="Zu erledigen und Auflagen">
                <div class="ef-side__tabs" role="tablist" aria-label="Ansicht">
                    <button id="ef-tab-todo" class="ef-side__tab" role="tab" type="button" :aria-selected="tab === 'todo'" aria-controls="ef-panel-todo" @click="tab = 'todo'">Zu erledigen</button>
                    <button id="ef-tab-codes" class="ef-side__tab" role="tab" type="button" :aria-selected="tab === 'codes'" aria-controls="ef-panel-codes" @click="tab = 'codes'">Auflagen</button>
                </div>

                <div v-show="tab === 'todo'" id="ef-panel-todo" role="tabpanel" aria-labelledby="ef-tab-todo" class="ef-todo">
                    <p class="ef-side__title">{{ done }} von {{ cars.length }} erledigt</p>
                    <div class="ef-progress" role="progressbar" :aria-valuenow="done" :aria-valuemin="0" :aria-valuemax="cars.length" aria-label="Fahrzeuge mit Reifen"><span class="ef-progress__bar" :style="{ width: `${percent}%` }" /></div>
                    <ul class="ef-todo__list">
                        <li v-for="car in cars" :key="car.id">
                            <button class="ef-todo__item" type="button" :aria-current="current?.id === car.id ? 'true' : undefined" @click="store.openCar(car.id)">
                                <span class="ef-todo__name">{{ carLine(car.label) }}</span>
                                <span v-if="several" class="ef-todo__size" data-combination>{{ combinationLabel(car.combinationId) }}</span>
                                <span class="ef-todo__size">{{ carSummary(car) }}<template v-if="car.finish"> · nur {{ car.finish }}</template><template v-if="car.axle !== 'ALL'"> · {{ car.axle === 'FRONT' ? 'nur vorne' : 'nur hinten' }}</template></span>
                                <span v-if="car.conflict" class="adm-tag adm-tag--warn ef-todo__state">Prüfen</span>
                                <span v-else-if="car.done" class="ef-todo__state ef-todo__state--done"><Icon name="check" :size="20" /><span class="visually-hidden">erledigt</span></span>
                                <span v-else class="adm-tag adm-tag--warn ef-todo__state">Offen</span>
                            </button>
                        </li>
                    </ul>
                </div>

                <!-- Kept while the to-do list shows: a code half described in here is still there on the way back. -->
                <CodesPanel v-show="tab === 'codes'" id="ef-panel-codes" role="tabpanel" aria-labelledby="ef-tab-codes" />
            </aside>

            <LinesEditor v-if="current && combination" :key="current.id" class="ef-tyres__editor" :car="current" :wheel-name="wheelName" :combination="combination" />
        </div>
    </section>
</template>

<style scoped>
.ef-none {
    display: grid;
    justify-items: start;
    gap: var(--sp-12);
}

.ef-tyres {
    display: grid;
    gap: var(--sp-24);
    align-items: start;
}

@media (min-width: 1360px) {
    .ef-tyres {
        grid-template-columns: minmax(0, 1fr) minmax(280px, 0.6fr) minmax(0, 1.3fr);
    }
}

@media (min-width: 1100px) and (max-width: 1359px) {
    .ef-tyres {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
    }

    .ef-side {
        grid-column: 2;
        grid-row: 1;
    }

    .ef-tyres__editor {
        grid-column: 1 / -1;
    }
}

/* Sticky only in three columns: in two, the editor runs under the PDF and would slide beneath it. */
@media (min-width: 1360px) {
    .ef-tyres__pdf,
    .ef-side {
        position: sticky;
        top: calc(var(--adm-topbar-h) + var(--sp-16));
    }

    /* A paper of a hundred cars: the list scrolls in its own column, or its end could only be reached at the end of the editor. */
    .ef-side {
        max-height: calc(100dvh - 2 * var(--adm-topbar-h) - var(--sp-32));
        overflow-y: auto;
    }
}

.ef-side {
    display: grid;
    gap: var(--sp-12);
    min-width: 0;
}

.ef-side__tabs {
    display: flex;
    gap: var(--sp-24);
    border-bottom: 1px solid var(--c-line);
}

/* As the admin's section tabs (.adm-tabs): no boxes, the line under the one on screen. */
.ef-side__tab {
    flex: none;
    min-height: 40px;
    margin-bottom: -1px;
    padding: 0;
    border: 0;
    border-bottom: 2px solid transparent;
    background: none;
    color: var(--c-ink-2);
    font: inherit;
    font-size: var(--fs-small);
    font-weight: 500;
    cursor: pointer;
}

.ef-side__tab[aria-selected='true'] {
    border-bottom-color: var(--c-ink);
    color: var(--c-ink);
}

.ef-side__title {
    margin: 0;
    font-weight: 600;
}

.ef-todo {
    display: grid;
    gap: var(--sp-8);
}

.ef-todo__list {
    display: grid;
    margin: var(--sp-8) 0 0;
    padding: 0;
    border-top: 1px solid var(--c-line);
    list-style: none;
}

/* Rows, as the rail lists its items: the current one tinted, with the rail's bar on its left. */
.ef-todo__item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0 var(--sp-8);
    width: 100%;
    padding: var(--sp-8) var(--sp-12);
    border: 0;
    border-bottom: 1px solid var(--c-line);
    background: none;
    color: var(--c-ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
}

.ef-todo__item[aria-current='true'] {
    background: var(--c-blue-tint);
    box-shadow: var(--adm-row-focus);
}

.ef-todo__item:active {
    background: var(--c-band);
}

@media (hover: hover) and (pointer: fine) {
    .ef-todo__item:not([aria-current='true']):hover {
        background: var(--c-band);
    }

    .ef-side__tab:hover {
        color: var(--c-ink);
    }
}

.ef-todo__item:focus-visible,
.ef-side__tab:focus-visible {
    outline: 2px solid var(--c-blue);
    outline-offset: -2px;
}

.ef-todo__name {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 600;
}

.ef-todo__size {
    grid-row: 2;
    color: var(--c-ink-2);
    font-size: var(--fs-micro);
}

.ef-todo__state {
    grid-row: 1 / span 2;
    grid-column: 2;
    align-self: center;
}

.ef-todo__state--done {
    display: inline-flex;
    color: var(--c-ink-2);
}
</style>
