<script setup lang="ts">
/**
 * Step 4, Reifen — the main screen (the brief §7): the paper on the left, what is still open in the middle, the tyres of
 * one car group on the right. The middle column is also where the paper's codes live („Auflagen dieses Gutachtens"),
 * one tab away from the to-do list.
 */

import { computed, ref } from 'vue'
import Icon from '../../../../Components/Admin/AdminIcon.vue'
import { WHEELS, sizeName, widthText } from '../gutachtenDemo'
import { cellDone, cellSummary } from '../gutachtenSketch'
import { useSketch } from '../gutachtenStore'
import CellEditor from './CellEditor.vue'
import CodesPanel from './CodesPanel.vue'
import PdfPanel from './PdfPanel.vue'

const store = useSketch()
const { state } = store

const tab = ref<'todo' | 'codes'>('todo')

const wheel = computed(() => WHEELS.find((w) => w.id === state.wheelId))
const size = computed(() => wheel.value?.sizes.find((s) => s.id === state.sizeId) ?? wheel.value?.sizes[0])
const groups = computed(() => store.chosenGroups())
const done = computed(() => groups.value.filter((group) => cellDone(store.cellOf(group.id))).length)
const current = computed(() => groups.value.find((group) => group.id === state.cell) ?? groups.value[0])
const shortSize = computed(() => (size.value ? `${widthText(size.value.width)} × ${size.value.diameter}` : ''))
</script>

<template>
    <section class="sk-step" aria-labelledby="sk-tyres-h">
        <h2 id="sk-tyres-h" class="visually-hidden" tabindex="-1">Reifen</h2>

        <div v-if="groups.length === 0" class="sk-none">
            <p class="adm-note">Noch keine Fahrzeuggruppe. Übernimm in Schritt 3 mindestens eine Zeile des Gutachtens, dann trägst du hier ihre Reifen ein.</p>
            <button class="btn btn--primary" type="button" @click="store.go(2)">Zu Schritt 3: Fahrzeuge</button>
        </div>

        <div v-else class="sk-tyres">
            <PdfPanel class="sk-tyres__pdf" />

            <aside class="sk-side" aria-label="Zu erledigen und Auflagen">
                <div class="sk-side__tabs" role="tablist" aria-label="Ansicht">
                    <button id="sk-tab-todo" class="sk-side__tab" role="tab" type="button" :aria-selected="tab === 'todo'" aria-controls="sk-panel-todo" @click="tab = 'todo'">Zu erledigen</button>
                    <button id="sk-tab-codes" class="sk-side__tab" role="tab" type="button" :aria-selected="tab === 'codes'" aria-controls="sk-panel-codes" @click="tab = 'codes'">Auflagen</button>
                </div>

                <div v-if="tab === 'todo'" id="sk-panel-todo" role="tabpanel" aria-labelledby="sk-tab-todo" class="sk-todo">
                    <p class="sk-side__title">{{ done }} von {{ groups.length }} erledigt</p>
                    <ul class="sk-todo__list">
                        <li v-for="group in groups" :key="group.id">
                            <button class="sk-todo__item" type="button" :aria-current="state.cell === group.id ? 'true' : undefined" @click="state.cell = group.id">
                                <span class="sk-todo__name">{{ group.sales }} ({{ group.type }})</span>
                                <span class="sk-todo__size">{{ shortSize }} · {{ cellSummary(store.cellOf(group.id)) }}</span>
                                <span v-if="cellDone(store.cellOf(group.id))" class="sk-todo__state sk-todo__state--done"><Icon name="check" :size="20" /><span class="visually-hidden">erledigt</span></span>
                                <span v-else class="adm-tag adm-tag--warn sk-todo__state">offen</span>
                            </button>
                        </li>
                    </ul>
                </div>

                <CodesPanel v-else id="sk-panel-codes" role="tabpanel" aria-labelledby="sk-tab-codes" />
            </aside>

            <CellEditor v-if="current && size && wheel" :key="current.id" class="sk-tyres__editor" :group="current" :wheel-name="`${wheel.brand} ${wheel.model}`" :size-name="sizeName(size)" />
        </div>
    </section>
</template>

<style scoped>
.sk-none {
    display: grid;
    justify-items: start;
    gap: var(--sp-12);
}

.sk-tyres {
    display: grid;
    gap: var(--sp-24);
    align-items: start;
}

@media (min-width: 1360px) {
    .sk-tyres {
        grid-template-columns: minmax(0, 1fr) minmax(280px, 0.6fr) minmax(0, 1.3fr);
    }
}

@media (min-width: 1100px) and (max-width: 1359px) {
    .sk-tyres {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
    }

    .sk-side {
        grid-column: 2;
        grid-row: 1;
    }

    .sk-tyres__editor {
        grid-column: 1 / -1;
    }
}

/* Sticky only in three columns: in two, the editor runs under the PDF and would slide beneath it. */
@media (min-width: 1360px) {
    .sk-tyres__pdf {
        position: sticky;
        top: calc(var(--adm-topbar-h) + var(--sp-16));
    }
}

.sk-side {
    display: grid;
    gap: var(--sp-12);
    min-width: 0;
}

.sk-side__tabs {
    display: flex;
    border-bottom: 1px solid var(--c-line);
}

.sk-side__tab {
    flex: 1;
    min-height: 40px;
    padding: 0 var(--sp-8);
    border: 0;
    border-bottom: 2px solid transparent;
    background: none;
    color: var(--c-ink-2);
    font: inherit;
    font-size: var(--fs-small);
    font-weight: 600;
    cursor: pointer;
}

.sk-side__tab[aria-selected='true'] {
    border-bottom-color: var(--c-blue);
    color: var(--c-ink);
}

.sk-side__title {
    margin: 0;
    font-weight: 600;
}

.sk-todo {
    display: grid;
    gap: var(--sp-8);
}

.sk-todo__list {
    display: grid;
    margin: var(--sp-8) 0 0;
    padding: 0;
    border-top: 1px solid var(--c-line);
    list-style: none;
}

/* Rows, as the rail lists its items: the current one tinted, with the rail's bar on its left. */
.sk-todo__item {
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

.sk-todo__item[aria-current='true'] {
    background: var(--c-blue-tint);
    box-shadow: var(--adm-row-focus);
}

.sk-todo__item:active,
.sk-side__tab:active {
    background: var(--c-band);
}

@media (hover: hover) and (pointer: fine) {
    .sk-todo__item:not([aria-current='true']):hover,
    .sk-side__tab:hover {
        background: var(--c-band);
    }
}

.sk-todo__item:focus-visible,
.sk-side__tab:focus-visible {
    outline: 2px solid var(--c-blue);
    outline-offset: -2px;
}

.sk-todo__name {
    font-weight: 600;
}

.sk-todo__size {
    grid-row: 2;
    color: var(--c-ink-2);
    font-size: var(--fs-micro);
}

.sk-todo__state {
    grid-row: 1 / span 2;
    grid-column: 2;
    align-self: center;
}

.sk-todo__state--done {
    display: inline-flex;
    color: var(--c-ink-2);
}
</style>
