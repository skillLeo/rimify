<script setup lang="ts">
/**
 * The document's own table of tyre load at speed (ABE 55255, page 6) — typed as it stands in the PDF: a
 * row per speed, a column per speed symbol, each cell a percentage, „–“ (a tyre of that symbol is not
 * permitted at that speed) or empty (the table does not say). The table belongs to its document; without
 * one, the shop cannot confirm tyres above 210 km/h (the operator's review of C9, §5).
 *
 * Saved whole, into its own error bag (`tabelle`).
 */

import { useForm, usePage } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import { useFocusAfter } from '../../../composables/admin/useFocusAfter'
import type { DeratingView } from '../../../types/admin/gutachten'

const props = defineProps<{
    documentId: number
    derating: DeratingView
    editable: boolean
    pageCount: number | null
}>()

const BAG = 'tabelle'
const focus = useFocusAfter()
const page = usePage()

/* The usual columns, until the document shows others: the symbols its table prints. */
const initialSymbols = props.derating.symbols.length > 0 ? [...props.derating.symbols] : ['V', 'W', 'Y']

const form = useForm({
    source_page: (props.derating.sourcePage ?? '') as number | '',
    symbols: initialSymbols,
    rows: props.derating.rows.map((row) => ({ speed_kmh: row.speed as number | '', cells: { ...row.cells } as Record<string, string> })),
})

const editing = ref(false)
const empty = computed(() => props.derating.rows.length === 0)
const errors = computed(() => ((page.props.errors ?? {}) as Record<string, Record<string, string> | undefined>)[BAG] ?? {})

function start(): void {
    if (form.rows.length === 0) {
        form.rows = [210, 220, 230, 240, 250, 260, 270, 280, 290, 300].map((speed) => ({ speed_kmh: speed, cells: {} }))
    }

    editing.value = true
    focus.request('dt-page')
}

function addRow(): void {
    form.rows.push({ speed_kmh: '', cells: {} })
    focus.request(`dt-speed-${form.rows.length - 1}`)
}

function removeRow(i: number): void {
    form.rows.splice(i, 1)
    focus.request(form.rows.length > 0 ? `dt-speed-${Math.max(0, i - 1)}` : 'dt-add-row')
}

function cancel(): void {
    form.reset()
    form.clearErrors()
    editing.value = false
    focus.request('dt-edit')
}

function save(): void {
    form.put(`/admin/gutachten/${props.documentId}/tragfaehigkeitstabelle`, {
        preserveScroll: true,
        errorBag: BAG,
        onSuccess: () => {
            editing.value = false
            focus.request('dt-edit')
        },
        onError: () => {
            const first = Object.keys(errors.value)[0] ?? ''
            const row = /^rows\.(\d+)\.speed_kmh$/.exec(first)
            const cell = /^rows\.(\d+)\.cells\.(.+)$/.exec(first)

            focus.request(row ? `dt-speed-${row[1]}` : cell ? `dt-cell-${cell[1]}-${cell[2]}` : first === 'source_page' ? 'dt-page' : 'dt-save')
        },
    })
}

function cellError(i: number, symbol: string): string {
    return errors.value[`rows.${i}.cells.${symbol}`] ?? ''
}
</script>

<template>
    <div class="dt">
        <p class="adm-note">
            Wie viel ihrer Last Reifen mit V, W oder Y bei hoher Geschwindigkeit tragen dürfen – so, wie dieses Gutachten es druckt. Ohne
            Tabelle kann der Shop die Reifen über 210 km/h nicht bestätigen.
        </p>

        <template v-if="!editing">
            <p v-if="empty" class="adm-note">Zu diesem Gutachten ist noch keine Tabelle hinterlegt.</p>

            <div v-else class="dt-scroll">
                <table class="adm-table dt-table">
                    <caption class="visually-hidden">Tragfähigkeit bei hoher Geschwindigkeit</caption>
                    <thead>
                        <tr>
                            <th scope="col">km/h</th>
                            <th v-for="symbol in derating.symbols" :key="symbol" scope="col" class="num">{{ symbol }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in derating.rows" :key="row.speed">
                            <th scope="row" class="num">{{ row.speed }}</th>
                            <td v-for="symbol in derating.symbols" :key="symbol" class="num">
                                {{ row.cells[symbol] === undefined ? '' : row.cells[symbol] === '–' ? '–' : `${row.cells[symbol]} %` }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <!-- Outside the scroll box, so the section's own gap separates it from the last row. -->
            <p v-if="!empty && derating.seededFrom" class="adm-note">
                Beispieltabelle aus den Demodaten ({{ derating.seededFrom }}) – nicht aus diesem Gutachten übertragen.
            </p>
            <p v-else-if="!empty && derating.sourcePage" class="adm-note">Seite {{ derating.sourcePage }} im Gutachten.</p>

            <button v-if="editable" id="dt-edit" class="btn btn--ghost" type="button" @click="start">
                <Icon :name="empty ? 'plus' : 'edit'" :size="20" />
                {{ empty ? 'Tabelle eintragen' : 'Tabelle ändern' }}
            </button>
        </template>

        <form v-else class="dt-form" novalidate aria-labelledby="dt-form-h" @submit.prevent="save">
            <p id="dt-form-h" class="form-field__label">Tabelle aus dem Gutachten</p>
            <p class="form-field__help">In jede Zelle die Prozentzahl, „–“ wenn die Tabelle einen Strich zeigt, oder nichts, wenn die Tabelle dazu nichts sagt.</p>

            <div class="form-field dt-page">
                <label class="form-field__label" for="dt-page">Seite im Gutachten</label>
                <input
                    id="dt-page"
                    v-model.number="form.source_page"
                    class="input"
                    type="number"
                    min="1"
                    :max="pageCount ?? undefined"
                    inputmode="numeric"
                    :aria-invalid="errors.source_page ? 'true' : undefined"
                    aria-describedby="dt-page-err"
                >
                <p id="dt-page-err" class="form-field__error">{{ errors.source_page }}</p>
            </div>

            <div class="dt-scroll">
                <table class="dt-grid">
                    <thead>
                        <tr>
                            <th scope="col">km/h</th>
                            <th v-for="symbol in form.symbols" :key="symbol" scope="col">{{ symbol }}</th>
                            <th scope="col"><span class="visually-hidden">Zeile entfernen</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(row, i) in form.rows" :key="i">
                            <td>
                                <label class="visually-hidden" :for="`dt-speed-${i}`">Geschwindigkeit der Zeile {{ i + 1 }} in km/h</label>
                                <input
                                    :id="`dt-speed-${i}`"
                                    v-model.number="row.speed_kmh"
                                    class="input dt-input"
                                    type="number"
                                    min="100"
                                    max="400"
                                    inputmode="numeric"
                                    :aria-invalid="errors[`rows.${i}.speed_kmh`] ? 'true' : undefined"
                                    :aria-describedby="`dt-speed-${i}-err`"
                                >
                                <p :id="`dt-speed-${i}-err`" class="form-field__error">{{ errors[`rows.${i}.speed_kmh`] }}</p>
                            </td>
                            <td v-for="symbol in form.symbols" :key="symbol">
                                <label class="visually-hidden" :for="`dt-cell-${i}-${symbol}`">{{ symbol }} bei {{ row.speed_kmh || '…' }} km/h</label>
                                <input
                                    :id="`dt-cell-${i}-${symbol}`"
                                    v-model="row.cells[symbol]"
                                    class="input dt-input"
                                    type="text"
                                    inputmode="decimal"
                                    maxlength="6"
                                    placeholder="%"
                                    :aria-invalid="cellError(i, symbol) ? 'true' : undefined"
                                    :aria-describedby="`dt-cell-${i}-${symbol}-err`"
                                >
                                <p :id="`dt-cell-${i}-${symbol}-err`" class="form-field__error">{{ cellError(i, symbol) }}</p>
                            </td>
                            <td>
                                <button class="btn btn--ghost btn--icon" type="button" :aria-label="`Zeile ${row.speed_kmh || i + 1} entfernen`" @click="removeRow(i)">
                                    <Icon name="close" :size="20" />
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="dt-actions">
                <button id="dt-add-row" class="btn btn--ghost" type="button" @click="addRow">
                    <Icon name="plus" :size="20" />
                    Zeile
                </button>
            </div>

            <div class="dt-actions">
                <button id="dt-save" class="btn btn--primary" type="submit" :disabled="form.processing" :aria-busy="form.processing ? 'true' : undefined">Tabelle speichern</button>
                <button class="btn btn--ghost" type="button" :disabled="form.processing" @click="cancel">Abbrechen</button>
            </div>
        </form>
    </div>
</template>

<style scoped>
.dt,
.dt-form {
    display: grid;
    gap: var(--sp-12);
}

.dt-form {
    padding: var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-band);
}

.dt-form > .form-field__label,
.dt-form > .form-field__help {
    margin: 0;
}

.dt-page {
    max-width: 12rem;
}

.dt-scroll {
    max-width: 100%;
    overflow-x: auto;
}

.dt-table {
    width: auto;
    min-width: 20rem;
}

.dt-grid {
    border-collapse: collapse;
}

.dt-grid th {
    padding: 0 var(--sp-8) var(--sp-4) 0;
    font-size: var(--fs-small);
    font-weight: 600;
    text-align: left;
}

.dt-grid td {
    padding: 0 var(--sp-8) var(--sp-8) 0;
    vertical-align: top;
}

.dt-input {
    width: 5.5rem;
}

.dt-form .form-field__error:empty {
    display: none;
}

.dt-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}
</style>
