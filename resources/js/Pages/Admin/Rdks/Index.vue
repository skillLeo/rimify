<script setup lang="ts">
/**
 * Einstellungen › Zubehörpreise › RDKS-Sensorpreise je Marke.
 *
 * What one tyre-pressure sensor costs for one car make — per sensor, never per set: the checkout
 * multiplies by the number of Komplettrad wheels and shows `4 × 49,00 €`. The default price is the
 * rule; the rows are its exceptions. A make with neither is a make whose price nobody has confirmed,
 * and the checkout says so rather than charging a number.
 *
 * The make is free text with a datalist of the makes the vehicle table holds. The server keys it
 * (MakeName::key) so `VW`, `vw` and `Volkswagen` are one make, and the table shows that key beside
 * the label. The money field edits the German string the server sent and posts it back as typed;
 * the server parses it and refuses anything ambiguous. Every write is authorised on the server
 * (R-11); `can` only decides what is drawn.
 */

import { router, usePage } from '@inertiajs/vue3'
import { computed, reactive, ref } from 'vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminSectionTabs from '../../../Components/Admin/AdminSectionTabs.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import { ZUBEHOER_TABS } from '../../../Components/Admin/sectionTabs'
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

const BASE = '/admin/zubehoerpreise/rdks'

const EMPTY_TEXT = 'Noch kein Preis hinterlegt. Wir fragen RDKS-Sensoren an der Kasse zwar ab, können sie aber für keine Marke berechnen.'
const MONEY_HINT = 'Preis in Euro, mit Komma – zum Beispiel 49,00.'
const DEFAULT_HINT = 'Preis je Sensor, mit Komma – zum Beispiel 15,00. Leer lassen heißt: kein Standardpreis.'
const DEFAULT_OPEN =
    'Ohne Standardpreis bieten wir RDKS-Sensoren nur für die Marken unten an. Allen anderen sagen wir an der Kasse, dass wir den Preis noch nicht haben.'

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

/** Everything the server said about the last request, whichever form sent it. */
const bag = computed<Record<string, string>>(() => {
    const raw: unknown = page.props.errors

    return raw !== null && typeof raw === 'object' ? (raw as Record<string, string>) : {}
})

/** The server's validation messages, keyed by field. */
const errors = computed<Record<string, string>>(() => (sent.value ? bag.value : {}))

/* ── The default price: the rule, with the rows below as its exceptions (§13, D-030) ── */

const fallback = reactive({ typed: props.default.typed })
const defaultSent = ref(false)
const defaultBusy = ref(false)

/** Two forms share one error bag, so each only shows messages for a request it sent itself. */
const defaultError = computed(() => (defaultSent.value ? (bag.value.priceCents ?? bag.value.price ?? '') : ''))

function saveDefault(): void {
    defaultSent.value = true
    defaultBusy.value = true

    router.put(
        `${BASE}/standard`,
        { price: fallback.typed },
        {
            preserveScroll: true,
            onFinish: () => {
                defaultBusy.value = false
            },
        }
    )
}

const editingPrice = computed(() => props.prices.find((p) => p.id === editing.value) ?? null)
const canWrite = computed(() => props.can.create || props.can.update)
const canAct = computed(() => props.can.update || props.can.delete)
const formTitle = computed(() => (editingPrice.value === null ? 'Neuer Preis' : `Preis bearbeiten: ${editingPrice.value.makeLabelDe}`))
/** The page's one primary action says what it does: add a make's price, or keep the edit. */
const submitLabel = computed(() => (editing.value === null ? 'Preis anlegen' : 'Änderungen speichern'))
const makeError = computed(() => errors.value.makeKey ?? errors.value.makeLabelDe ?? '')

const context = computed(() => {
    const total = props.prices.length
    const rule = props.default.cents === null ? 'kein Standardpreis' : `Standard ${props.default.typed} je Sensor`

    return `${total === 0 ? 'Noch keine Marke' : `${total} ${total === 1 ? 'Marke' : 'Marken'} mit eigenem Preis`} · ${rule}`
})

const confirmOpen = computed({
    get: () => confirming.value !== null,
    set: (open: boolean) => {
        if (!open) {
            confirming.value = null
        }
    },
})

/** What the checkout does for this make once its own price is gone. */
const confirmBody = computed(() =>
    props.default.cents === null
        ? 'An der Kasse können wir für diese Marke dann keine Sensoren mehr berechnen.'
        : `An der Kasse gilt für diese Marke dann der Standardpreis von ${props.default.typed} je Sensor.`
)

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
    <AdminPage title="Zubehörpreise" :context="context" :read-only="!canWrite">
        <AdminSectionTabs label="Zubehörpreise" :items="ZUBEHOER_TABS" />

        <p class="adm-note rd__lead">
            Der Preis gilt je Sensor; an der Kasse rechnen wir ihn mit der Zahl der Kompletträder hoch. Für eine Marke
            ohne Preis bieten wir keine Sensoren an.
        </p>

        <!-- The rule, above its exceptions: what a make with no row of its own is charged. -->
        <section v-if="can.update" class="adm-section" aria-labelledby="rd-default-title">
            <form class="rd__form rd__form--default" :aria-busy="defaultBusy ? 'true' : undefined" @submit.prevent="saveDefault">
                <h2 id="rd-default-title" class="adm-section__title rd__form-title">Standardpreis je Sensor</h2>

                <div class="form-field">
                    <label class="form-field__label" for="rd-default">Gilt für jede Marke ohne eigenen Preis</label>
                    <div class="adm-inline">
                        <input
                            id="rd-default"
                            v-model="fallback.typed"
                            class="input rd__num"
                            :class="{ 'input--error': defaultError }"
                            type="text"
                            inputmode="decimal"
                            autocomplete="off"
                            maxlength="32"
                            aria-describedby="rd-default-help rd-default-err"
                            :aria-invalid="defaultError ? 'true' : undefined"
                        >
                        <button class="btn btn--secondary" type="submit" :disabled="defaultBusy">Standardpreis speichern</button>
                    </div>
                    <p id="rd-default-help" class="form-field__help">{{ DEFAULT_HINT }}</p>
                    <p id="rd-default-err" class="form-field__error">{{ defaultError }}</p>
                </div>

                <p v-if="props.default.cents === null" class="adm-note rd__default-open">{{ DEFAULT_OPEN }}</p>
            </form>
        </section>

        <section v-if="canWrite" class="adm-section" aria-labelledby="rd-form-title">
            <form class="rd__form" :aria-busy="busy ? 'true' : undefined" @submit.prevent="submit">
                <h2 id="rd-form-title" class="adm-section__title rd__form-title">{{ formTitle }}</h2>

                <div class="adm-fields rd__fields">
                    <div class="form-field">
                        <label class="form-field__label" for="rd-make">Automarke</label>
                        <input
                            id="rd-make"
                            ref="makeField"
                            v-model="form.make"
                            class="input"
                            :class="{ 'input--error': makeError }"
                            type="text"
                            maxlength="64"
                            autocomplete="off"
                            list="rd-makes"
                            aria-required="true"
                            aria-describedby="rd-make-err"
                            :aria-invalid="makeError ? 'true' : undefined"
                        >
                        <datalist id="rd-makes">
                            <option v-for="make in makes" :key="make" :value="make" />
                        </datalist>
                        <p id="rd-make-err" class="form-field__error">{{ makeError }}</p>
                    </div>

                    <div class="form-field">
                        <label class="form-field__label" for="rd-price">Preis je Sensor</label>
                        <input
                            id="rd-price"
                            v-model="form.price"
                            class="input rd__num rd__money"
                            :class="{ 'input--error': errors.priceCents }"
                            type="text"
                            inputmode="decimal"
                            autocomplete="off"
                            aria-required="true"
                            aria-describedby="rd-price-help rd-price-err"
                            :aria-invalid="errors.priceCents ? 'true' : undefined"
                        >
                        <p id="rd-price-help" class="form-field__help">{{ MONEY_HINT }}</p>
                        <p id="rd-price-err" class="form-field__error">{{ errors.priceCents ?? '' }}</p>
                    </div>

                    <div class="adm-fields__checks rd__checks">
                        <label class="check">
                            <input v-model="form.active" type="checkbox">
                            Aktiv
                        </label>
                        <p class="form-field__error">{{ errors.active ?? '' }}</p>
                    </div>
                </div>

                <div class="adm-fields__actions">
                    <button class="btn btn--primary" type="submit" :disabled="busy">{{ submitLabel }}</button>
                    <button v-if="editing !== null" class="btn btn--secondary" type="button" @click="reset">Abbrechen</button>
                </div>
            </form>
        </section>

        <section class="adm-section" aria-labelledby="rd-list-title">
            <div class="adm-section__head">
                <h2 id="rd-list-title" class="adm-section__title">Preise je Marke</h2>
            </div>

            <div v-if="prices.length > 0" class="adm-panel">
                <table class="adm-table">
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
                                <span class="adm-table__key">{{ price.makeLabelDe }}</span>
                                <span class="adm-table__sub rd__key">{{ keyNote(price.makeKey) }}</span>
                            </td>
                            <td data-label="Preis je Sensor" class="num">{{ price.price }}</td>
                            <td data-label="Aktiv" data-phone="status">
                                <template v-if="price.active">Aktiv</template>
                                <span v-else class="adm-tag adm-tag--neutral">Inaktiv</span>
                            </td>
                            <td v-if="canAct" data-label="Aktionen">
                                <div class="adm-table__actions">
                                    <button v-if="can.update" class="btn btn--secondary btn--sm" type="button" @click="edit(price)">
                                        Bearbeiten<span class="visually-hidden">: {{ price.makeLabelDe }}</span>
                                    </button>
                                    <button v-if="can.delete" class="btn btn--secondary btn--sm adm-btn--danger" type="button" @click="confirming = price">
                                        Löschen<span class="visually-hidden">: {{ price.makeLabelDe }}</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <AdminState v-else kind="empty" :text="EMPTY_TEXT" />
        </section>

        <AdminConfirm
            v-model:open="confirmOpen"
            :title="`Preis für ${confirming?.makeLabelDe ?? ''} löschen?`"
            :body="confirmBody"
            :busy="busy"
            @confirm="remove"
        />
    </AdminPage>
</template>

<style scoped>
.rd__lead {
    margin-bottom: var(--sp-24);
}

/* A form sits on the page under its heading, one column (§8.2), no card around it. */
.rd__form {
    max-width: var(--adm-form-max);
}

.rd__form-title {
    margin-bottom: var(--sp-16);
}

.rd__default-open {
    max-width: 54ch;
    margin-top: var(--sp-12);
}

/* A price is a few characters wide; a field the width of the form invites a sentence. */
.rd__money {
    max-width: 22ch;
}

.rd__num {
    font-variant-numeric: tabular-nums;
}

.rd__key {
    max-width: 54ch;
}
</style>
