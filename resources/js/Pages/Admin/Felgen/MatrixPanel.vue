<script setup lang="ts">
/**
 * „Größen erzeugen“: the sizes of a model from lists — finishes × diameters × widths × ETs — sharing
 * one bolt pattern, bore, price and availability (matrix.ts). What it adds lands in the table as unsaved rows;
 * nothing is stored until the form is saved, and a size the table already holds is left out.
 */

import { computed, ref, watch } from 'vue'
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
    available: true,
})

/*
 * The finishes follow the form: one removed there is no longer ticked here, and after a save — when
 * new finishes get their ids and keys — every finish is offered again, ticked.
 */
watch(
    () => props.finishes.map((finish) => finish.key).join('|'),
    (now, before) => {
        const keys = props.finishes.map((finish) => finish.key)
        const kept = input.value.finishes.filter((key) => keys.includes(key))
        const added = keys.filter((key) => !(before ?? '').split('|').includes(key))

        input.value.finishes = kept.length === 0 ? keys : [...kept, ...added]
    }
)

const count = computed(() => planned(input.value))
const missing = computed(() => {
    const out: string[] = []

    if (input.value.finishes.length === 0) {
        out.push('eine Ausführung')
    }

    if (parseList(input.value.diameters).length === 0) {
        out.push('ein Durchmesser')
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
    <div class="fe-matrix" role="group" aria-label="Größen aus Listen erzeugen">
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
                    <!-- `text`, not `numeric`: an ET can be negative, and a phone's number pad has no minus. -->
                    <input id="fe-m-et" v-model="input.ets" class="input" type="text" inputmode="text" placeholder="35 40 -5">
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
                    <label class="form-field__label" for="fe-m-available">Verfügbarkeit</label>
                    <select id="fe-m-available" v-model="input.available" class="input">
                        <option :value="true">Verfügbar</option>
                        <option :value="false">Nicht verfügbar</option>
                    </select>
                </div>
            </div>

            <div class="fe-matrix__foot">
                <button class="btn btn--secondary" type="button" :disabled="missing.length > 0" @click="add">
                    {{ count === 1 ? '1 Größe in die Tabelle' : `${count} Größen in die Tabelle` }}
                </button>
                <p v-if="missing.length" class="adm-note" aria-live="polite">Noch nötig: {{ missing.join(', ') }}.</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* A tool beside the table, set on the band: no hairline of its own to stack against the table's. */
.fe-matrix {
    padding: var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-band);
}

.fe-matrix__body {
    display: grid;
    gap: var(--sp-16);
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
    .fe-matrix {
        padding: var(--sp-12);
    }

    .fe-matrix__foot .btn {
        min-height: var(--adm-control-h-lg);
    }
}
</style>
