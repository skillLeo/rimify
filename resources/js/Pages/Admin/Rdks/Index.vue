<script setup lang="ts">
/**
 * RDKS-Sensorpreise je Marke.
 *
 * What one tyre-pressure sensor costs for one car make — per sensor, never per set: the checkout
 * multiplies by the number of Komplettrad wheels and shows `4 × 49,00 €`. A make without a row is a
 * make whose price nobody has confirmed, and the checkout says so rather than charging a number;
 * the empty state names that consequence.
 *
 * The make is free text with a datalist of the makes the vehicle table holds. The server keys it
 * (MakeName::key) so `VW`, `vw` and `Volkswagen` are one make, and the table shows that key beside
 * the label. The money field edits the German string the server sent and posts it back as typed;
 * the server parses it and refuses anything ambiguous. Every write is authorised on the server
 * (R-11); `can` only decides what is drawn.
 */

import { Head, router, usePage } from '@inertiajs/vue3'
import { computed, reactive, ref } from 'vue'
import Dialog from '../../../Components/Ui/Dialog.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import type { AdminRdksProps } from '../../../types/pages'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminRdksProps>()

type Price = AdminRdksProps['prices'][number]

interface PriceForm {
    make: string
    price: string
    active: boolean
}

const BASE = '/admin/rdks-preise'

const EMPTY_TEXT =
    'Noch kein Preis hinterlegt. Wir fragen RDKS-Sensoren an der Kasse zwar ab, können sie aber für keine Marke berechnen.'
const CONFIRM_TEXT =
    'Preis wirklich löschen? An der Kasse können wir für diese Marke dann keine Sensoren mehr berechnen.'
const MONEY_HINT = 'Preis in Euro, deutsch geschrieben – zum Beispiel 49,00.'

function blank(): PriceForm {
    return { make: '', price: '', active: true }
}

function keyNote(makeKey: string): string {
    return `Wir merken uns die Marke als ${makeKey} – so finden wir sie auch bei anderer Schreibweise wieder.`
}

const page = usePage()
const form = reactive<PriceForm>(blank())
const makeField = ref<HTMLInputElement | null>(null)
/** The id being edited, or null while the form makes a new price. */
const editing = ref<number | null>(null)
/** True once a request went out from this form: only then do the server's messages belong to it. */
const sent = ref(false)
const busy = ref(false)
const confirming = ref<Price | null>(null)

/** The server's validation messages, keyed by field. */
const errors = computed<Record<string, string>>(() => {
    const bag: unknown = page.props.errors

    return sent.value && bag !== null && typeof bag === 'object' ? (bag as Record<string, string>) : {}
})

const editingPrice = computed(() => props.prices.find((p) => p.id === editing.value) ?? null)
const canWrite = computed(() => props.can.create || props.can.update)
const canAct = computed(() => props.can.update || props.can.delete)
const formTitle = computed(() =>
    editingPrice.value === null ? 'Neuer Preis' : `Preis bearbeiten: ${editingPrice.value.makeLabelDe}`
)
const makeError = computed(() => errors.value.makeKey ?? errors.value.makeLabelDe ?? '')

const confirmOpen = computed({
    get: () => confirming.value !== null,
    set: (open: boolean) => {
        if (!open) {
            confirming.value = null
        }
    },
})

function reset(): void {
    Object.assign(form, blank())
    editing.value = null
    sent.value = false
}

function edit(price: Price): void {
    form.make = price.makeLabelDe
    form.price = price.price
    form.active = price.active
    editing.value = price.id
    sent.value = false
    makeField.value?.focus()
}

function submit(): void {
    sent.value = true
    busy.value = true

    const options = {
        preserveScroll: true,
        onSuccess: reset,
        onFinish: () => {
            busy.value = false
        },
    }

    if (editing.value === null) {
        router.post(BASE, { ...form }, options)
    } else {
        router.patch(`${BASE}/${editing.value}`, { ...form }, options)
    }
}

function remove(): void {
    const price = confirming.value

    if (price === null) {
        return
    }

    busy.value = true

    router.delete(`${BASE}/${price.id}`, {
        preserveScroll: true,
        onSuccess: () => {
            confirming.value = null

            if (editing.value === price.id) {
                reset()
            }
        },
        onFinish: () => {
            busy.value = false
        },
    })
}
</script>

<template>
    <Head title="RDKS-Sensorpreise je Marke" />

    <div class="rd__head">
        <h1 class="t-h1">RDKS-Sensorpreise je Marke</h1>
        <p class="rd__lead">
            Der Preis gilt je Sensor; an der Kasse rechnen wir ihn mit der Zahl der Kompletträder hoch. Für eine
            Marke ohne Preis bieten wir keine Sensoren an.
        </p>
    </div>

    <form v-if="canWrite" class="rd__form" :aria-busy="busy ? 'true' : undefined" @submit.prevent="submit">
        <h2 class="t-h3 rd__form-title">{{ formTitle }}</h2>

        <div class="rd__fields">
            <div class="rd__field">
                <label class="field-label" for="rd-make">Automarke <span class="field-label__req">*</span></label>
                <input
                    id="rd-make"
                    ref="makeField"
                    v-model="form.make"
                    class="field"
                    :class="{ 'field--error': makeError }"
                    type="text"
                    maxlength="64"
                    autocomplete="off"
                    list="rd-makes"
                    aria-describedby="rd-make-err"
                    :aria-invalid="makeError ? 'true' : undefined"
                />
                <datalist id="rd-makes">
                    <option v-for="make in makes" :key="make" :value="make" />
                </datalist>
                <span id="rd-make-err" class="field-error">{{ makeError }}</span>
            </div>

            <div class="rd__field">
                <label class="field-label" for="rd-price">Preis je Sensor <span class="field-label__req">*</span></label>
                <input
                    id="rd-price"
                    v-model="form.price"
                    class="field tabular"
                    :class="{ 'field--error': errors.priceCents }"
                    type="text"
                    inputmode="decimal"
                    autocomplete="off"
                    aria-describedby="rd-price-help rd-price-err"
                    :aria-invalid="errors.priceCents ? 'true' : undefined"
                />
                <p id="rd-price-help" class="field-help">{{ MONEY_HINT }}</p>
                <span id="rd-price-err" class="field-error">{{ errors.priceCents ?? '' }}</span>
            </div>

            <div class="rd__checks">
                <label class="check">
                    <input v-model="form.active" type="checkbox" />
                    Aktiv
                </label>
                <span class="field-error">{{ errors.active ?? '' }}</span>
            </div>
        </div>

        <div class="rd__actions">
            <button class="btn btn--primary" type="submit" :disabled="busy">Speichern</button>
            <button v-if="editing !== null" class="btn btn--secondary" type="button" @click="reset">Abbrechen</button>
        </div>
    </form>

    <div class="rd__box">
        <table v-if="prices.length > 0" class="table table--rows rd__table">
            <thead>
                <tr>
                    <th scope="col">Automarke</th>
                    <th scope="col" class="num">Preis je Sensor</th>
                    <th scope="col">Aktiv</th>
                    <th v-if="canAct" scope="col"><span class="visually-hidden">Aktionen</span></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="price in prices" :key="price.id" :aria-current="editing === price.id ? 'true' : undefined">
                    <td data-label="Automarke">
                        <span class="rd__make">{{ price.makeLabelDe }}</span>
                        <span class="micro quiet rd__key">{{ keyNote(price.makeKey) }}</span>
                    </td>
                    <td data-label="Preis je Sensor" class="num tabular">{{ price.price }}</td>
                    <td data-label="Aktiv">
                        <span class="tag" :class="price.active ? 'tag--ok' : 'tag--unknown'">
                            {{ price.active ? 'Aktiv' : 'Inaktiv' }}
                        </span>
                    </td>
                    <td v-if="canAct" data-label="Aktionen">
                        <div class="rd__row-actions">
                            <button v-if="can.update" class="btn btn--secondary btn--sm" type="button" @click="edit(price)">
                                Bearbeiten<span class="visually-hidden">: {{ price.makeLabelDe }}</span>
                            </button>
                            <button v-if="can.delete" class="btn btn--ghost btn--sm" type="button" @click="confirming = price">
                                Löschen<span class="visually-hidden">: {{ price.makeLabelDe }}</span>
                            </button>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>

        <div v-else class="state rd__empty">
            <p class="state__title">{{ EMPTY_TEXT }}</p>
        </div>
    </div>

    <Dialog v-model:open="confirmOpen" title="Preis löschen" :description="CONFIRM_TEXT">
        <template #actions>
            <button class="btn btn--secondary" type="button" @click="confirming = null">Abbrechen</button>
            <button class="btn btn--primary rd__confirm" type="button" :disabled="busy" @click="remove">
                Löschen
            </button>
        </template>
    </Dialog>
</template>

<style scoped>
.rd__head {
    margin-bottom: var(--sp-24);
}

.rd__lead {
    margin-top: var(--sp-4);
    max-width: 54ch;
    color: var(--c-ink-2);
}

.rd__form {
    margin-bottom: var(--sp-32);
    padding: var(--sp-20) var(--sp-24);
    background: var(--c-surface);
    border: 1px solid var(--c-line);
    border-radius: var(--r-tile);
}

.rd__form-title {
    margin-bottom: var(--sp-16);
}

.rd__fields {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-16);
    align-items: start;
}

.rd__field {
    min-width: 0;
}

.rd__checks {
    display: flex;
    flex-wrap: wrap;
    gap: 0 var(--sp-16);
}

.rd__checks .field-error {
    flex-basis: 100%;
}

.rd__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
    margin-top: var(--sp-16);
}

.rd__box {
    background: var(--c-surface);
    border: 1px solid var(--c-line);
    border-radius: var(--r-tile);
    overflow: hidden;
}

.rd__make {
    display: block;
    font-weight: 600;
}

.rd__key {
    display: block;
    max-width: 54ch;
}

.rd__row-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

.rd__empty {
    padding: var(--sp-32) var(--sp-24);
}

.rd__empty .state__title {
    max-width: 54ch;
}

@media (min-width: 900px) {
    .rd__fields {
        grid-template-columns: minmax(0, 2fr) minmax(0, 1.4fr) auto;
    }

    .rd__checks {
        padding-top: var(--sp-24);
    }
}

/* Below 900px each row is a block, every value labelled with its column name. */
@media (max-width: 899px) {
    .rd__table thead {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
    }

    .rd__table,
    .rd__table tbody,
    .rd__table tr,
    .rd__table td {
        display: block;
    }

    .rd__table tr {
        padding: var(--sp-12) var(--sp-16);
        border-bottom: 1px solid var(--c-line);
    }

    .rd__table td {
        display: grid;
        grid-template-columns: 120px minmax(0, 1fr);
        gap: var(--sp-12);
        height: auto;
        padding: var(--sp-4) 0;
        border: 0;
        text-align: left;
    }

    .rd__table td::before {
        content: attr(data-label);
        font-size: var(--fs-small);
        color: var(--c-ink-2);
    }
}
</style>
