<script setup lang="ts">
/**
 * An article's table (his admin item 11, D-306), typed cell by cell: the first row holds the column headings,
 * the rows below the content. Columns and rows are added and removed with buttons — 2 to 6 columns, up to 30
 * rows, as PageSchema checks them — and every cell is plain text, never HTML.
 *
 * The first heading carries the field's id and the first cell the rows' id, so an error of the publish check
 * finds its place (Bearbeiten.vue › focusField).
 */

import { nextTick } from 'vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import { toast } from '../../../Components/Chrome/toast'
import { clickGuard, COLUMNS_MAX, COLUMNS_MIN, insertAt, length, ROWS_MAX } from './content'

const props = withDefaults(
    defineProps<{
        id: string
        rowsId: string
        label: string
        help?: string
        head: string[]
        rows: string[][]
        /** The longest a cell may be, as the server counts it. */
        max: number
        headError?: string
        rowsError?: string
        readonly?: boolean
    }>(),
    { help: '', headError: '', rowsError: '', readonly: false }
)

const emit = defineEmits<{ change: [table: { head: string[]; rows: string[][] }] }>()

function headId(column: number): string {
    return column === 0 ? props.id : `${props.id}-${column}`
}

function cellId(row: number, column: number): string {
    return row === 0 && column === 0 ? props.rowsId : `${props.rowsId}-${row}-${column}`
}

function focus(id: string): void {
    void nextTick(() => document.getElementById(id)?.focus())
}

function setHead(column: number, value: string): void {
    emit('change', { head: props.head.map((cell, c) => (c === column ? value : cell)), rows: props.rows })
}

function setCell(row: number, column: number, value: string): void {
    emit('change', { head: props.head, rows: props.rows.map((cells, r) => (r === row ? cells.map((cell, c) => (c === column ? value : cell)) : cells)) })
}

function addColumn(): void {
    if (props.head.length >= COLUMNS_MAX) {
        return
    }

    emit('change', { head: [...props.head, ''], rows: props.rows.map((cells) => [...cells, '']) })
    focus(headId(props.head.length))
}

/* One click of a double-click per removal (content.ts › clickGuard; SEI-24). */
const settled = clickGuard()

function removeColumn(column: number, event?: MouseEvent): void {
    if (props.head.length <= COLUMNS_MIN || !settled(event)) {
        return
    }

    const heading = props.head[column] ?? ''
    const cells = props.rows.map((row) => row[column] ?? '')
    emit('change', { head: props.head.filter((_, c) => c !== column), rows: props.rows.map((row) => row.filter((_, c) => c !== column)) })
    focus(headId(Math.min(column, props.head.length - 2)))

    // A slip should not need Verwerfen to undo, as with a block (SEI-28): back at its place, with what it held.
    toast.show({
        text: `Spalte ${column + 1} entfernt.`,
        action: {
            label: 'Rückgängig',
            run: () => {
                if (props.head.length >= COLUMNS_MAX) {
                    toast.show({ text: `Spalte ${column + 1} kommt nicht zurück: Mehr als ${COLUMNS_MAX} Spalten hat eine Tabelle nicht.`, icon: 'info' })

                    return
                }

                const at = Math.min(column, props.head.length)
                emit('change', { head: insertAt(props.head, at, heading), rows: props.rows.map((row, r) => insertAt(row, at, cells[r] ?? '')) })
                focus(headId(at))
            },
        },
    })
}

function addRow(): void {
    if (props.rows.length >= ROWS_MAX) {
        return
    }

    emit('change', { head: props.head, rows: [...props.rows, props.head.map(() => '')] })
    focus(cellId(props.rows.length, 0))
}

function removeRow(row: number, event?: MouseEvent): void {
    if (props.rows.length <= 1 || !settled(event)) {
        return
    }

    const cells = [...(props.rows[row] ?? [])]
    emit('change', { head: props.head, rows: props.rows.filter((_, r) => r !== row) })
    focus(row < props.rows.length - 1 ? cellId(row, 0) : `${props.id}-add-row`)

    toast.show({
        text: `Zeile ${row + 1} entfernt.`,
        action: {
            label: 'Rückgängig',
            run: () => {
                if (props.rows.length >= ROWS_MAX) {
                    toast.show({ text: `Zeile ${row + 1} kommt nicht zurück: Mehr als ${ROWS_MAX} Zeilen hat eine Tabelle nicht.`, icon: 'info' })

                    return
                }

                const at = Math.min(row, props.rows.length)
                // As wide as the table is now: a column added or removed meanwhile is filled or dropped.
                emit('change', { head: props.head, rows: insertAt(props.rows, at, props.head.map((_, c) => cells[c] ?? '')) })
                focus(cellId(at, 0))
            },
        },
    })
}

function over(value: string): boolean {
    return length(value) > props.max
}

function describedBy(kind: 'head' | 'rows'): string {
    return [props.help ? `${props.id}-help` : null, `${props.id}-${kind}-err`].filter(Boolean).join(' ')
}
</script>

<template>
    <div class="form-field pg-grid">
        <span :id="`${id}-label`" class="form-field__label">{{ label }}</span>

        <!-- Wider than the column on a phone: the table scrolls inside its frame, the page does not. -->
        <div class="pg-grid__frame">
            <table class="pg-grid__table" :aria-labelledby="`${id}-label`" :style="{ '--pg-grid-columns': head.length }">
                <thead>
                    <!-- Each column's remove button in a row of its own, so a column head is as wide as the cells under it —
                         and only once a column may go: two columns are the least a table has. -->
                    <tr v-if="!readonly && head.length > COLUMNS_MIN" class="pg-grid__column-tools">
                        <td v-for="(_, c) in head" :key="c">
                            <button
                                class="adm-iconbtn"
                                type="button"
                                :aria-label="`Spalte ${c + 1} entfernen`"
                                @click="removeColumn(c, $event)"
                            >
                                <Icon name="delete" :size="20" />
                            </button>
                        </td>
                        <td class="pg-grid__tools" />
                    </tr>
                    <tr>
                        <th v-for="(cell, c) in head" :key="c" scope="col" class="pg-grid__head">
                            <input
                                :id="headId(c)"
                                class="input pg-grid__input pg-grid__input--head"
                                type="text"
                                :value="cell"
                                :readonly="readonly"
                                :aria-label="`Spaltenkopf ${c + 1}`"
                                :aria-invalid="headError || over(cell) ? 'true' : undefined"
                                :aria-describedby="describedBy('head')"
                                @input="setHead(c, ($event.target as HTMLInputElement).value)"
                            >
                        </th>
                        <td v-if="!readonly" class="pg-grid__tools" />
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(cells, r) in rows" :key="r">
                        <td v-for="(cell, c) in cells" :key="c">
                            <input
                                :id="cellId(r, c)"
                                class="input pg-grid__input"
                                type="text"
                                :value="cell"
                                :readonly="readonly"
                                :aria-label="`Zeile ${r + 1}, ${head[c] || `Spalte ${c + 1}`}`"
                                :aria-invalid="over(cell) ? 'true' : undefined"
                                :aria-describedby="describedBy('rows')"
                                @input="setCell(r, c, ($event.target as HTMLInputElement).value)"
                            >
                        </td>
                        <td v-if="!readonly" class="pg-grid__tools">
                            <button
                                class="adm-iconbtn"
                                type="button"
                                :disabled="rows.length <= 1"
                                :aria-label="`Zeile ${r + 1} entfernen`"
                                @click="removeRow(r, $event)"
                            >
                                <Icon name="delete" :size="20" />
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-if="!readonly" class="pg-grid__actions">
            <button :id="`${id}-add-row`" class="btn btn--secondary" type="button" :disabled="rows.length >= ROWS_MAX" @click="addRow">
                <Icon name="plus" :size="20" />
                Zeile hinzufügen
            </button>
            <button :id="`${id}-add-column`" class="btn btn--secondary" type="button" :disabled="head.length >= COLUMNS_MAX" @click="addColumn">
                <Icon name="plus" :size="20" />
                Spalte hinzufügen
            </button>
        </div>

        <p v-if="help" :id="`${id}-help`" class="form-field__help">{{ help }}</p>
        <p :id="`${id}-head-err`" class="form-field__error">{{ headError }}</p>
        <p :id="`${id}-rows-err`" class="form-field__error">{{ rowsError }}</p>
    </div>
</template>

<style scoped>
/* The cells' spacing lies outside the field's edges, inside the frame: the first column lines up with the fields above,
   and a cell's focus ring is not cut off by the scrolling frame. */
.pg-grid__frame {
    margin: calc(-1 * var(--sp-4)) calc(-1 * var(--sp-4)) 0;
    overflow-x: auto;
}

/* Every column the same share; six of 6rem fit the form's 40rem column. On a phone each keeps a cell a word fits in,
   and the frame scrolls. */
.pg-grid__table {
    width: 100%;
    min-width: calc(var(--pg-grid-columns) * 6rem);
    table-layout: fixed;
    border-collapse: separate;
    border-spacing: var(--sp-4);
}

.pg-grid__head {
    font-weight: 400;
    text-align: left;
}

/* The remove buttons sit at the right edge of their column, quiet until a column may go. */
.pg-grid__column-tools td {
    text-align: right;
    padding: 0;
}

.pg-grid__input {
    width: 100%;
    min-width: 0;
}

/* The headings read as headings: the table on the page sets them in the heavier weight too. */
.pg-grid__input--head {
    font-weight: 600;
}

.pg-grid__input[aria-invalid='true'] {
    border-color: var(--c-bad);
}

/* The row's delete button on the same right edge as the block's own. */
.pg-grid__tools {
    width: var(--adm-control-h);
    text-align: right;
}

@media (pointer: coarse) {
    .pg-grid__tools {
        width: var(--adm-control-h-lg);
    }
}

.pg-grid__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

.pg-grid .form-field__error:empty {
    display: none;
}
</style>
