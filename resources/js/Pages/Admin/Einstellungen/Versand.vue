<script setup lang="ts">
/**
 * Einstellungen › Versand (VersandartenController, D-449): the shipping methods the checkout offers. One form serves a new
 * method and an existing one: „Bearbeiten“ loads the row into it, „Abbrechen“ empties it again. Prices are posted as typed
 * — the server reads them (Money::fromGerman) and refuses anything ambiguous; nothing on this page multiplies cents.
 *
 * A method is never deleted: an order keeps its own copy of what it was sent by, and a method no longer wanted is switched
 * off. The order of the list is the order the checkout offers them in; the cheapest active one is what the customer gets
 * until they choose another, and what the product page names. Every write is authorised on the server (R-11).
 */

import { router, usePage } from '@inertiajs/vue3'
import { computed, reactive, ref } from 'vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

interface Method {
    id: number
    name: string
    description: string
    price: string
    priceTyped: string
    freeFrom: string | null
    freeFromTyped: string
    minDays: number
    maxDays: number
    deliveryTime: string
    countries: string[]
    productTypes: string[]
    active: boolean
    demo: boolean
}

const props = defineProps<{
    methods: Method[]
    countries: Record<string, string>
    productTypes: Record<string, string>
    /** The product page's line now: the cheapest active method for rims. */
    productLine: string | null
    /** While no method was saved: the `.env` line that stands as one. */
    fromEnv: string | null
    canEdit: boolean
}>()

interface MethodForm {
    name: string
    description: string
    price: string
    free_from: string
    min_days: number | ''
    max_days: number | ''
    countries: string[]
    product_types: string[]
    active: boolean
}

const BASE = '/admin/einstellungen/versand'

function blank(): MethodForm {
    return { name: '', description: '', price: '', free_from: '', min_days: '', max_days: '', countries: Object.keys(props.countries), product_types: [], active: true }
}

const page = usePage()
const form = reactive<MethodForm>(blank())
const nameField = ref<HTMLInputElement | null>(null)
/** The id being edited, or null while the form makes a new method. */
const editing = ref<number | null>(null)
/** True once a request went out from this form: only then do the server's messages belong to it. */
const sent = ref(false)
const busy = ref(false)

const errors = computed<Record<string, string>>(() => {
    const raw: unknown = page.props.errors

    return sent.value && raw !== null && typeof raw === 'object' ? (raw as Record<string, string>) : {}
})

const editingMethod = computed(() => props.methods.find((m) => m.id === editing.value) ?? null)
const formTitle = computed(() => (editingMethod.value === null ? 'Neue Versandart' : `Versandart bearbeiten: ${editingMethod.value.name}`))
const submitLabel = computed(() => (editing.value === null ? 'Versandart anlegen' : 'Änderungen speichern'))
const active = computed(() => props.methods.filter((m) => m.active).length)

const context = computed(() => {
    const total = props.methods.length

    return total === 0 ? 'Noch keine Versandart' : `${total} ${total === 1 ? 'Versandart' : 'Versandarten'}, davon ${active.value} aktiv`
})

/** What a method ships, in the list's words: every product, or the ones it names. */
function shipsLabel(method: Method): string {
    return method.productTypes.length === 0 ? 'Alles' : method.productTypes.map((t) => props.productTypes[t] ?? t).join(', ')
}

function reset(): void {
    Object.assign(form, blank())
    editing.value = null
    sent.value = false
}

function edit(method: Method): void {
    Object.assign(form, {
        name: method.name,
        description: method.description,
        price: method.priceTyped,
        free_from: method.freeFromTyped,
        min_days: method.minDays,
        max_days: method.maxDays,
        countries: [...method.countries],
        product_types: [...method.productTypes],
        active: method.active,
    })
    editing.value = method.id
    sent.value = false
    nameField.value?.focus()
}

function submit(): void {
    sent.value = true
    busy.value = true
    const options = { preserveScroll: true, onSuccess: reset, onFinish: () => (busy.value = false) }

    if (editing.value === null) {
        router.post(BASE, { ...form }, options)
    } else {
        router.put(`${BASE}/${editing.value}`, { ...form }, options)
    }
}

/** „Aktivieren“ / „Deaktivieren“ from the list: the row as it stands, the one switch turned. */
function toggle(method: Method): void {
    sent.value = true
    busy.value = true
    router.put(
        `${BASE}/${method.id}`,
        {
            name: method.name,
            description: method.description,
            price: method.priceTyped,
            free_from: method.freeFromTyped,
            min_days: method.minDays,
            max_days: method.maxDays,
            countries: method.countries,
            product_types: method.productTypes,
            active: !method.active,
        },
        { preserveScroll: true, onFinish: () => (busy.value = false) }
    )
}

/** „Nach oben“ / „Nach unten“: the whole order, sent as one list. */
function move(method: Method, by: -1 | 1): void {
    const ids = props.methods.map((m) => m.id)
    const from = ids.indexOf(method.id)
    const to = from + by

    if (to < 0 || to >= ids.length) {
        return
    }

    const [moved] = ids.splice(from, 1)
    ids.splice(to, 0, moved as number)
    sent.value = true
    busy.value = true
    router.put(`${BASE}/reihenfolge`, { ids }, { preserveScroll: true, onFinish: () => (busy.value = false) })
}
</script>

<template>
    <AdminPage title="Versand" :context="context" :read-only="!canEdit">
        <p class="adm-note vs__lead">
            Die Kasse bietet die aktiven Versandarten in dieser Reihenfolge an, mit Preis und Lieferzeit vor dem Bestellknopf. Bis
            jemand eine andere wählt, gilt die günstigste. Eine Versandart wird nicht gelöscht, nur ausgeschaltet: Bestellungen
            behalten, womit sie verschickt wurden.
        </p>
        <p v-if="productLine" class="vs__line"><span class="vs__line-label">Auf der Produktseite</span> {{ productLine }}</p>
        <p v-else-if="fromEnv" class="adm-note vs__line">Noch keine Versandart angelegt. Bis dahin gelten die Werte aus der .env-Datei: {{ fromEnv }}.</p>
        <p v-if="methods.length > 0 && active === 0" class="adm-alert" role="status">Keine Versandart ist aktiv. Solange nimmt der Shop keine echte Bestellung an.</p>
        <p v-if="errors.ids" class="adm-alert" role="alert">{{ errors.ids }}</p>

        <section v-if="canEdit" class="adm-section" aria-labelledby="vs-form-title">
            <form class="vs__form" :aria-busy="busy ? 'true' : undefined" novalidate @submit.prevent="submit">
                <h2 id="vs-form-title" class="adm-section__title vs__form-title">{{ formTitle }}</h2>

                <div class="adm-fields vs__fields">
                    <div class="form-field">
                        <label class="form-field__label" for="vs-name">Name</label>
                        <input id="vs-name" ref="nameField" v-model="form.name" class="input" :class="{ 'input--error': errors.name }" type="text" maxlength="80" autocomplete="off" aria-required="true" aria-describedby="vs-name-err" :aria-invalid="errors.name ? 'true' : undefined">
                        <p id="vs-name-err" class="form-field__error">{{ errors.name ?? '' }}</p>
                    </div>

                    <div class="form-field">
                        <label class="form-field__label" for="vs-price">Preis (mit MwSt.)</label>
                        <input id="vs-price" v-model="form.price" class="input vs__num vs__money" :class="{ 'input--error': errors.price }" type="text" inputmode="decimal" autocomplete="off" maxlength="32" aria-required="true" aria-describedby="vs-price-help vs-price-err" :aria-invalid="errors.price ? 'true' : undefined">
                        <p id="vs-price-help" class="form-field__help">In Euro, mit Komma – zum Beispiel 4,90. Kostenlos ist 0,00.</p>
                        <p id="vs-price-err" class="form-field__error">{{ errors.price ?? '' }}</p>
                    </div>

                    <fieldset class="form-field vs__days">
                        <legend class="form-field__label">Lieferzeit in Werktagen</legend>
                        <div class="vs__days-row">
                            <label class="vs__day">
                                <span>von</span>
                                <input id="vs-min-days" v-model.number="form.min_days" class="input vs__num" :class="{ 'input--error': errors.min_days }" type="number" min="1" max="60" step="1" aria-describedby="vs-days-help vs-days-err" :aria-invalid="errors.min_days ? 'true' : undefined">
                            </label>
                            <label class="vs__day">
                                <span>bis</span>
                                <input id="vs-max-days" v-model.number="form.max_days" class="input vs__num" :class="{ 'input--error': errors.max_days }" type="number" min="1" max="60" step="1" aria-describedby="vs-days-help vs-days-err" :aria-invalid="errors.max_days ? 'true' : undefined">
                            </label>
                        </div>
                        <p id="vs-days-help" class="form-field__help">Ab Zahlungseingang. Bei einer festen Zahl steht in beiden Feldern dieselbe.</p>
                        <p id="vs-days-err" class="form-field__error">{{ errors.min_days ?? errors.max_days ?? '' }}</p>
                    </fieldset>

                    <div class="form-field">
                        <label class="form-field__label" for="vs-free">Versandkostenfrei ab <span class="vs__optional">(optional)</span></label>
                        <input id="vs-free" v-model="form.free_from" class="input vs__num vs__money" :class="{ 'input--error': errors.free_from }" type="text" inputmode="decimal" autocomplete="off" maxlength="32" aria-describedby="vs-free-help vs-free-err" :aria-invalid="errors.free_from ? 'true' : undefined">
                        <p id="vs-free-help" class="form-field__help">Warenwert mit MwSt., ab dem diese Versandart nichts kostet. Leer: nie.</p>
                        <p id="vs-free-err" class="form-field__error">{{ errors.free_from ?? '' }}</p>
                    </div>

                    <fieldset class="form-field vs__group">
                        <legend class="form-field__label">Länder</legend>
                        <label v-for="(name, code) in countries" :key="code" class="check">
                            <input v-model="form.countries" type="checkbox" :value="code">
                            {{ name }}
                        </label>
                        <p class="form-field__help">Die Kasse liefert bisher nur nach Deutschland.</p>
                        <p class="form-field__error">{{ errors.countries ?? '' }}</p>
                    </fieldset>

                    <fieldset class="form-field vs__group">
                        <legend class="form-field__label">Gilt für <span class="vs__optional">(optional)</span></legend>
                        <label v-for="(name, type) in productTypes" :key="type" class="check">
                            <input v-model="form.product_types" type="checkbox" :value="type">
                            {{ name }}
                        </label>
                        <p class="form-field__help">Nichts angehakt: für alles. Ein Warenkorb mit Felgen und Kompletträdern braucht eine Versandart, die beides verschickt.</p>
                        <p class="form-field__error">{{ errors.product_types ?? '' }}</p>
                    </fieldset>

                    <div class="form-field vs__wide">
                        <label class="form-field__label" for="vs-description">Beschreibung <span class="vs__optional">(optional)</span></label>
                        <textarea id="vs-description" v-model="form.description" class="input vs__text" rows="2" maxlength="300" aria-describedby="vs-description-help vs-description-err" />
                        <p id="vs-description-help" class="form-field__help">Steht in der Kasse unter dem Namen, etwa „Versichert, mit Sendungsverfolgung“.</p>
                        <p id="vs-description-err" class="form-field__error">{{ errors.description ?? '' }}</p>
                    </div>

                    <div class="adm-fields__checks">
                        <label class="check">
                            <input v-model="form.active" type="checkbox">
                            In der Kasse anbieten
                        </label>
                    </div>
                </div>

                <div class="adm-fields__actions">
                    <button class="btn btn--primary" type="submit" :disabled="busy">{{ submitLabel }}</button>
                    <button v-if="editing !== null" class="btn btn--secondary" type="button" @click="reset">Abbrechen</button>
                </div>
            </form>
        </section>

        <section class="adm-section" aria-labelledby="vs-list-title">
            <div class="adm-section__head">
                <h2 id="vs-list-title" class="adm-section__title">Versandarten</h2>
            </div>

            <div v-if="methods.length > 0" class="adm-panel">
                <table class="adm-table">
                    <thead>
                        <tr>
                            <th scope="col">Name</th>
                            <th scope="col" class="num">Preis</th>
                            <th scope="col">Lieferzeit</th>
                            <th scope="col">Versandkostenfrei ab</th>
                            <th scope="col">Gilt für</th>
                            <th scope="col">Im Shop</th>
                            <th v-if="canEdit" scope="col"><span class="visually-hidden">Aktionen</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(method, i) in methods" :key="method.id" :aria-current="editing === method.id ? 'true' : undefined">
                            <td data-label="Name">
                                <span class="adm-table__key">{{ method.name }}</span>
                                <span v-if="method.demo" class="adm-tag adm-tag--neutral adm-demo">Demodaten</span>
                                <span v-if="method.description" class="adm-table__sub">{{ method.description }}</span>
                            </td>
                            <td data-label="Preis" class="num">{{ method.price }}</td>
                            <td data-label="Lieferzeit">{{ method.deliveryTime }}</td>
                            <td data-label="Versandkostenfrei ab">{{ method.freeFrom ?? '–' }}</td>
                            <td data-label="Gilt für">{{ shipsLabel(method) }}</td>
                            <td data-label="Im Shop" data-phone="status">
                                <template v-if="method.active">Aktiv</template>
                                <span v-else class="adm-tag adm-tag--neutral">Aus</span>
                            </td>
                            <td v-if="canEdit" data-label="Aktionen">
                                <div class="adm-table__actions">
                                    <button class="btn btn--secondary btn--sm" type="button" :disabled="busy" @click="edit(method)">
                                        Bearbeiten<span class="visually-hidden">: {{ method.name }}</span>
                                    </button>
                                    <button class="btn btn--secondary btn--sm" type="button" :disabled="busy" @click="toggle(method)">
                                        {{ method.active ? 'Ausschalten' : 'Einschalten' }}<span class="visually-hidden">: {{ method.name }}</span>
                                    </button>
                                    <button class="btn btn--secondary btn--sm" type="button" :disabled="busy || i === 0" @click="move(method, -1)">
                                        Nach oben<span class="visually-hidden">: {{ method.name }}</span>
                                    </button>
                                    <button class="btn btn--secondary btn--sm" type="button" :disabled="busy || i === methods.length - 1" @click="move(method, 1)">
                                        Nach unten<span class="visually-hidden">: {{ method.name }}</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <AdminState v-else kind="empty" text="Noch keine Versandart angelegt." />
        </section>
    </AdminPage>
</template>

<style scoped>
.vs__lead {
    max-width: 72ch;
    margin-bottom: var(--sp-16);
}

.vs__line {
    margin: 0 0 var(--sp-24);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink);
}

.vs__line-label {
    display: block;
    color: var(--c-ink-3);
}

/* A form sits on the page under its heading, one column, no card around it. */
.vs__form {
    max-width: var(--adm-form-max);
}

.vs__form-title {
    margin-bottom: var(--sp-16);
}

.vs__fields {
    grid-template-columns: 1fr;
}

.vs__num {
    font-variant-numeric: tabular-nums;
}

/* A price is a few characters wide; a field the width of the form invites a sentence. */
.vs__money {
    max-width: 22ch;
}

/* A group of choices reads as its label and its boxes, as every other field does: no frame of the browser's own. */
.vs__days,
.vs__group {
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
}

.vs__group {
    display: flex;
    flex-direction: column;
    gap: var(--sp-8);
}

.vs__days-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-16);
}

.vs__day {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-8);
}

.vs__day .input {
    width: 10ch;
}

.vs__optional {
    font-weight: 400;
    color: var(--c-ink-3);
}

.vs__text {
    resize: vertical;
}
</style>
