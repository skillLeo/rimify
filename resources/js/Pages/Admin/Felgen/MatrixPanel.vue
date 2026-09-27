<script setup lang="ts">
/**
 * „Größen erzeugen“: the sizes of a model from lists — finishes × diameters × widths × ETs — sharing
 * one bolt pattern, bore, price and stock (matrix.ts). What it adds lands in the table as unsaved rows;
 * nothing is stored until the form is saved, and a size the table already holds is left out.
 */

import { computed, ref } from 'vue'
import type { FinishForm } from '../../../types/admin/felgen'
import { parseList, planned, type MatrixInput } from './matrix'

const props = defineProps<{
    finishes: FinishForm[]
    boltHoles: number[]
    /** The bolt pattern and bore of the sizes already there: most models share one. */
    start: { bolt_holes: number; bolt_circle: string; bore: string }
}>()

const emit = defineEmits<{ add: [input: MatrixInput] }>()

const input = ref<MatrixInput>({
    finishes: props.finishes.map((finish) => finish.key),
    diameters: '',
    widths: '',
    ets: '',
    bolt_holes: props.start.bolt_holes,
    bolt_circle: props.start.bolt_circle,
    bore: props.start.bore,
    price: '',
    stock: 0,
})

const count = computed(() => planned(input.value))
const missing = computed(() => {
    const out: string[] = []

    if (input.value.finishes.length === 0) {
        out.push('eine Ausführung')
    }

    if (parseList(input.value.diameters).length === 0) {
        out.push('einen Durchmesser')
    }

    if (parseList(input.value.widths).length === 0) {
        out.push('eine Breite')
    }

    if (parseList(input.value.ets).length === 0) {
        out.push('eine Einpresstiefe')
    }

    return out
})

function add(): void {
    if (missing.value.length === 0) {
        emit('add', { ...input.value, finishes: [...input.value.finishes] })
    }
}
</script>

<template>
    <details class="fe-matrix">
        <summary class="fe-matrix__summary">Größen erzeugen</summary>

        <div class="fe-matrix__body">
            <p class="adm-note">Mehrere Werte trennst du mit Leerzeichen oder Semikolon, zum Beispiel „8 8,5 9“. Jede Kombination wird eine Zeile in der Tabelle; vorhandene Größen bleiben, wie sie sind.</p>

            <fieldset class="fe-matrix__finishes">
                <legend class="form-field__label">Ausführungen</legend>
                <label v-for="finish in finishes" :key="finish.key" class="fe-matrix__check">
                    <input v-model="input.finishes" type="checkbox" :value="finish.key">
                    {{ finish.name || 'Neue Ausführung' }}
                </label>
            </fieldset>

            <div class="fe-matrix__grid">
                <div class="form-field">
                    <label class="form-field__label" for="fe-m-d">Durchmesser (Zoll)</label>
                    <input id="fe-m-d" v-model="input.diameters" class="input" type="text" inputmode="decimal" placeholder="18 19">
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="fe-m-w">Breiten (Zoll)</label>
                    <input id="fe-m-w" v-model="input.widths" class="input" type="text" inputmode="decimal" placeholder="8 8,5">
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="fe-m-et">Einpresstiefen (ET, mm)</label>
                    <input id="fe-m-et" v-model="input.ets" class="input" type="text" inputmode="numeric" placeholder="35 40">
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="fe-m-holes">Lochzahl</label>
                    <select id="fe-m-holes" v-model.number="input.bolt_holes" class="input">
                        <option v-for="n in boltHoles" :key="n" :value="n">{{ n }}</option>
                    </select>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="fe-m-lk">Lochkreis (mm)</label>
                    <input id="fe-m-lk" v-model="input.bolt_circle" class="input" type="text" inputmode="decimal" placeholder="112">
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="fe-m-bore">Mittenlochbohrung (mm)</label>
                    <input id="fe-m-bore" v-model="input.bore" class="input" type="text" inputmode="decimal" placeholder="66,6">
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="fe-m-price">Preis je Felge (€)</label>
                    <input id="fe-m-price" v-model="input.price" class="input" type="text" inputmode="decimal" placeholder="189,00">
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="fe-m-stock">Bestand je Größe</label>
                    <input id="fe-m-stock" v-model.number="input.stock" class="input" type="number" min="0" step="1">
                </div>
            </div>

            <div class="fe-matrix__foot">
                <button class="btn btn--secondary" type="button" :disabled="missing.length > 0" @click="add">
                    {{ count === 1 ? '1 Größe in die Tabelle' : `${count} Größen in die Tabelle` }}
                </button>
                <p v-if="missing.length" class="adm-note" aria-live="polite">Es fehlt noch {{ missing.join(', ') }}.</p>
            </div>
        </div>
    </details>
</template>

<style scoped>
.fe-matrix {
    border-top: 1px solid var(--c-line);
    border-bottom: 1px solid var(--c-line);
}

.fe-matrix__summary {
    display: flex;
    align-items: center;
    min-height: var(--adm-row-h);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 500;
    cursor: pointer;
}

.fe-matrix__body {
    display: grid;
    gap: var(--sp-16);
    padding-bottom: var(--sp-16);
}

.fe-matrix__finishes {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8) var(--sp-16);
    margin: 0;
    padding: 0;
    border: 0;
}

.fe-matrix__finishes legend {
    width: 100%;
    margin-bottom: var(--sp-8);
}

.fe-matrix__check {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-8);
    min-height: var(--adm-control-h);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    cursor: pointer;
}

.fe-matrix__grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--sp-16);
}

.fe-matrix__foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-12);
}

@media (max-width: 1023px) {
    .fe-matrix__grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 767px) {
    .fe-matrix__summary {
        min-height: var(--adm-control-h-lg);
    }

    .fe-matrix__foot .btn {
        min-height: var(--adm-control-h-lg);
    }
}
</style>
