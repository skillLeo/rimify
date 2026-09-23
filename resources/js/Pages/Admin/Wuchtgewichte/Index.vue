<script setup lang="ts">
/**
 * Wuchtgewichte-Farben.
 *
 * The colours a customer can pick for the balance weights of a Komplettrad, and what each costs per
 * wheel. One form serves a new colour and an existing one: `Bearbeiten` loads the row into it and
 * marks the row, `Abbrechen` empties it again. The money field edits the German string the server
 * sent and posts it back as typed — the server parses it (Money::fromGerman) and refuses anything
 * ambiguous; nothing on this page multiplies cents.
 *
 * Every write is authorised on the server (R-11). `can` only decides what is drawn: a role that may
 * not write sees the list and nothing else. Deleting asks first, because orders keep the colour they
 * were sold with and the storefront refuses Kompletträder once no active colour is left.
 */

import { Head, router, usePage } from '@inertiajs/vue3'
import { computed, reactive, ref } from 'vue'
import Icon from '../../../Components/Art/Icon.vue'
import Dialog from '../../../Components/Ui/Dialog.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import type { AdminWuchtgewichteProps } from '../../../types/pages'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminWuchtgewichteProps>()

type Colour = AdminWuchtgewichteProps['colours'][number]

interface ColourForm {
    nameDe: string
    swatchHex: string
    surcharge: string
    isDefault: boolean
    active: boolean
    sortOrder: number | ''
}

const BASE = '/admin/wuchtgewichte'

const EMPTY_TEXT = 'Noch keine Farbe angelegt. Solange können Kundinnen und Kunden kein Komplettrad bestellen.'
const CONFIRM_TEXT = 'Farbe wirklich löschen? Bestellungen behalten die Farbe, die sie hatten.'
const MONEY_HINT = 'Preis in Euro, deutsch geschrieben – zum Beispiel 49,00.'
const MOUNTING_HINT = 'Preis je Rad, deutsch geschrieben – zum Beispiel 19,90. Leer lassen heißt: noch nicht festgelegt.'
const MOUNTING_OPEN = 'Solange hier nichts steht, können Kundinnen und Kunden keine Kompletträder bestellen. Felgen allein sind davon nicht betroffen.'

function blank(): ColourForm {
    return { nameDe: '', swatchHex: '', surcharge: '0,00', isDefault: false, active: true, sortOrder: 0 }
}

const page = usePage()
const form = reactive<ColourForm>(blank())
const nameField = ref<HTMLInputElement | null>(null)
/** The id being edited, or null while the form makes a new colour. */
const editing = ref<number | null>(null)
/** True once a request went out from this form: only then do the server's messages belong to it. */
const sent = ref(false)
const busy = ref(false)
const confirming = ref<Colour | null>(null)

/** Everything the server said about the last request, whichever form sent it. */
const bag = computed<Record<string, string>>(() => {
    const raw: unknown = page.props.errors

    return raw !== null && typeof raw === 'object' ? (raw as Record<string, string>) : {}
})

/** The server's validation messages, keyed by field. */
const errors = computed<Record<string, string>>(() => (sent.value ? bag.value : {}))

/* ── Montage und Auswuchten: one fee, its own small form (§13, D-032) ───────────── */

const mounting = reactive({ typed: props.mounting.typed })
const mountingSent = ref(false)
const mountingBusy = ref(false)

/** Two forms share one error bag, so each only shows messages for a request it sent itself. */
const mountingError = computed(() =>
    mountingSent.value ? (bag.value.mountingCents ?? bag.value.mounting ?? '') : ''
)

function saveMounting(): void {
    mountingSent.value = true
    mountingBusy.value = true

    router.put(
        `${BASE}/montage`,
        { mounting: mounting.typed },
        {
            preserveScroll: true,
            onFinish: () => {
                mountingBusy.value = false
            },
        }
    )
}

const editingColour = computed(() => props.colours.find((c) => c.id === editing.value) ?? null)
const canWrite = computed(() => props.can.create || props.can.update)
const canAct = computed(() => props.can.update || props.can.delete)
const formTitle = computed(() =>
    editingColour.value === null ? 'Neue Farbe' : `Farbe bearbeiten: ${editingColour.value.nameDe}`
)

const confirmOpen = computed({
    get: () => confirming.value !== null,
    set: (open: boolean) => {
        if (!open) {
            confirming.value = null
        }
    },
})

/** The admin's own hex, or the neutral chip from the class when there is none. */
function swatchStyle(hex: string | null): Record<string, string> | undefined {
    return /^#[0-9A-Fa-f]{6}$/.test(hex ?? '') ? { backgroundColor: hex as string } : undefined
}

function reset(): void {
    Object.assign(form, blank())
    editing.value = null
    sent.value = false
}

function edit(colour: Colour): void {
    form.nameDe = colour.nameDe
    form.swatchHex = colour.swatchHex ?? ''
    form.surcharge = colour.surcharge
    form.isDefault = colour.isDefault
    form.active = colour.active
    form.sortOrder = colour.sortOrder
    editing.value = colour.id
    sent.value = false
    nameField.value?.focus()
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
    const colour = confirming.value

    if (colour === null) {
        return
    }

    busy.value = true

    router.delete(`${BASE}/${colour.id}`, {
        preserveScroll: true,
        onSuccess: () => {
            confirming.value = null

            if (editing.value === colour.id) {
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
    <Head title="Wuchtgewichte-Farben" />

    <div class="wg__head">
        <h1 class="t-h1">Wuchtgewichte-Farben</h1>
        <p class="wg__lead">
            Die Farbe wählen Kundinnen und Kunden im Warenkorb, je Komplettrad. Der Aufpreis gilt je Rad; die
            Standardfarbe bekommt jedes Komplettrad, solange nichts anderes gewählt ist.
        </p>
    </div>

    <!-- The one fee every Komplettrad carries. Its own form, so saving a price never depends on
         the colour form being filled in, and clearing it is a save like any other. -->
    <form
        v-if="can.update"
        class="wg__form wg__form--fee"
        :aria-busy="mountingBusy ? 'true' : undefined"
        @submit.prevent="saveMounting"
    >
        <h2 class="t-h3 wg__form-title">Montage und Auswuchten</h2>

        <div class="wg__fee">
            <div class="wg__field wg__field--narrow">
                <label class="field-label" for="wg-mounting">Preis je Rad</label>
                <input
                    id="wg-mounting"
                    v-model="mounting.typed"
                    class="field tabular"
                    :class="{ 'field--error': mountingError }"
                    type="text"
                    inputmode="decimal"
                    autocomplete="off"
                    maxlength="32"
                    aria-describedby="wg-mounting-help wg-mounting-err"
                    :aria-invalid="mountingError ? 'true' : undefined"
                />
                <p id="wg-mounting-help" class="field-help">{{ MOUNTING_HINT }}</p>
                <span id="wg-mounting-err" class="field-error">{{ mountingError }}</span>
            </div>

            <button class="btn btn--primary" type="submit" :disabled="mountingBusy">Speichern</button>
        </div>

        <p v-if="props.mounting.cents === null" class="wg__fee-open small">{{ MOUNTING_OPEN }}</p>
    </form>

    <form v-if="canWrite" class="wg__form" :aria-busy="busy ? 'true' : undefined" @submit.prevent="submit">
        <h2 class="t-h3 wg__form-title">{{ formTitle }}</h2>

        <div class="wg__fields">
            <div class="wg__field">
                <label class="field-label" for="wg-name">Bezeichnung <span class="field-label__req">*</span></label>
                <input
                    id="wg-name"
                    ref="nameField"
                    v-model="form.nameDe"
                    class="field"
                    :class="{ 'field--error': errors.nameDe || errors.slug }"
                    type="text"
                    maxlength="64"
                    autocomplete="off"
                    aria-describedby="wg-name-err"
                    :aria-invalid="errors.nameDe || errors.slug ? 'true' : undefined"
                />
                <span id="wg-name-err" class="field-error">{{ errors.nameDe ?? errors.slug ?? '' }}</span>
            </div>

            <div class="wg__field">
                <label class="field-label" for="wg-hex">Farbwert (Hex)</label>
                <div class="wg__hex">
                    <span class="wg__swatch" :style="swatchStyle(form.swatchHex)" aria-hidden="true" />
                    <input
                        id="wg-hex"
                        v-model="form.swatchHex"
                        class="field"
                        :class="{ 'field--error': errors.swatchHex }"
                        type="text"
                        placeholder="#C8CCD2"
                        maxlength="7"
                        autocomplete="off"
                        spellcheck="false"
                        aria-describedby="wg-hex-err"
                        :aria-invalid="errors.swatchHex ? 'true' : undefined"
                    />
                </div>
                <span id="wg-hex-err" class="field-error">{{ errors.swatchHex ?? '' }}</span>
            </div>

            <div class="wg__field">
                <label class="field-label" for="wg-surcharge">Aufpreis je Rad</label>
                <input
                    id="wg-surcharge"
                    v-model="form.surcharge"
                    class="field tabular"
                    :class="{ 'field--error': errors.surchargeCents }"
                    type="text"
                    inputmode="decimal"
                    autocomplete="off"
                    aria-describedby="wg-surcharge-help wg-surcharge-err"
                    :aria-invalid="errors.surchargeCents ? 'true' : undefined"
                />
                <p id="wg-surcharge-help" class="field-help">{{ MONEY_HINT }}</p>
                <span id="wg-surcharge-err" class="field-error">{{ errors.surchargeCents ?? '' }}</span>
            </div>

            <div class="wg__field wg__field--narrow">
                <label class="field-label" for="wg-sort">Reihenfolge</label>
                <input
                    id="wg-sort"
                    v-model.number="form.sortOrder"
                    class="field tabular"
                    :class="{ 'field--error': errors.sortOrder }"
                    type="number"
                    min="0"
                    max="9999"
                    step="1"
                    aria-describedby="wg-sort-err"
                    :aria-invalid="errors.sortOrder ? 'true' : undefined"
                />
                <span id="wg-sort-err" class="field-error">{{ errors.sortOrder ?? '' }}</span>
            </div>

            <div class="wg__checks">
                <label class="check">
                    <input v-model="form.isDefault" type="checkbox" />
                    Standardfarbe
                </label>
                <label class="check">
                    <input v-model="form.active" type="checkbox" />
                    Aktiv
                </label>
                <span class="field-error">{{ errors.isDefault ?? errors.active ?? '' }}</span>
            </div>
        </div>

        <div class="wg__actions">
            <button class="btn btn--primary" type="submit" :disabled="busy">Speichern</button>
            <button v-if="editing !== null" class="btn btn--secondary" type="button" @click="reset">Abbrechen</button>
        </div>
    </form>

    <div class="wg__box">
        <table v-if="colours.length > 0" class="table table--rows wg__table">
            <thead>
                <tr>
                    <th scope="col">Bezeichnung</th>
                    <th scope="col">Farbwert (Hex)</th>
                    <th scope="col" class="num">Aufpreis je Rad</th>
                    <th scope="col">Standardfarbe</th>
                    <th scope="col">Aktiv</th>
                    <th scope="col" class="num">Reihenfolge</th>
                    <th v-if="canAct" scope="col"><span class="visually-hidden">Aktionen</span></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="colour in colours" :key="colour.id" :aria-current="editing === colour.id ? 'true' : undefined">
                    <td data-label="Bezeichnung">
                        <div class="wg__name">
                            <span class="wg__swatch" :style="swatchStyle(colour.swatchHex)" aria-hidden="true" />
                            <span>
                                <span class="wg__name-text">{{ colour.nameDe }}</span>
                                <span class="micro quiet wg__slug">{{ colour.slug }}</span>
                            </span>
                        </div>
                    </td>
                    <td data-label="Farbwert (Hex)" class="data">{{ colour.swatchHex ?? '–' }}</td>
                    <td data-label="Aufpreis je Rad" class="num tabular">{{ colour.surcharge }}</td>
                    <td data-label="Standardfarbe">
                        <span v-if="colour.isDefault" class="wg__yes">
                            <Icon name="check" :size="20" />
                            <span class="visually-hidden">Standardfarbe</span>
                        </span>
                        <span v-else class="quiet">
                            <span aria-hidden="true">–</span>
                            <span class="visually-hidden">keine Standardfarbe</span>
                        </span>
                    </td>
                    <td data-label="Aktiv">
                        <span class="tag" :class="colour.active ? 'tag--ok' : 'tag--unknown'">
                            {{ colour.active ? 'Aktiv' : 'Inaktiv' }}
                        </span>
                    </td>
                    <td data-label="Reihenfolge" class="num tabular">{{ colour.sortOrder }}</td>
                    <td v-if="canAct" data-label="Aktionen">
                        <div class="wg__row-actions">
                            <button v-if="can.update" class="btn btn--secondary btn--sm" type="button" @click="edit(colour)">
                                Bearbeiten<span class="visually-hidden">: {{ colour.nameDe }}</span>
                            </button>
                            <button v-if="can.delete" class="btn btn--ghost btn--sm" type="button" @click="confirming = colour">
                                Löschen<span class="visually-hidden">: {{ colour.nameDe }}</span>
                            </button>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>

        <div v-else class="state wg__empty">
            <p class="state__title">{{ EMPTY_TEXT }}</p>
        </div>
    </div>

    <Dialog v-model:open="confirmOpen" title="Farbe löschen" :description="CONFIRM_TEXT">
        <template #actions>
            <button class="btn btn--secondary" type="button" @click="confirming = null">Abbrechen</button>
            <button class="btn btn--primary wg__confirm" type="button" :disabled="busy" @click="remove">
                Löschen
            </button>
        </template>
    </Dialog>
</template>

<style scoped>
.wg__head {
    margin-bottom: var(--sp-24);
}

.wg__lead {
    margin-top: var(--sp-4);
    max-width: 54ch;
    color: var(--c-ink-2);
}

.wg__form {
    margin-bottom: var(--sp-32);
    padding: var(--sp-20) var(--sp-24);
    background: var(--c-surface);
    border: 1px solid var(--c-line);
    border-radius: var(--r-tile);
}

.wg__form-title {
    margin-bottom: var(--sp-16);
}

/* One field and its button on a line, the button aligned to the field rather than to its help text. */
.wg__fee {
    display: flex;
    flex-wrap: wrap;
    align-items: start;
    gap: var(--sp-16);
}

.wg__fee .btn {
    margin-top: calc(var(--lh-small) + var(--sp-4));
}

.wg__fee-open {
    max-width: 62ch;
    margin-top: var(--sp-12);
    color: var(--c-ink-2);
}

.wg__fields {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-16);
    align-items: start;
}

.wg__field {
    min-width: 0;
}

/* A price or a sort order is a few characters wide; a full-width field invites a sentence. */
.wg__field--narrow {
    max-width: 22ch;
}

.wg__hex {
    display: flex;
    align-items: center;
    gap: var(--sp-8);
}

.wg__swatch {
    flex: none;
    width: 20px;
    height: 20px;
    border-radius: var(--r-round);
    background: var(--c-band);
    border: 1px solid var(--c-line-2);
}

.wg__checks {
    display: flex;
    flex-wrap: wrap;
    gap: 0 var(--sp-16);
}

.wg__checks .field-error {
    flex-basis: 100%;
}

.wg__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
    margin-top: var(--sp-16);
}

.wg__box {
    background: var(--c-surface);
    border: 1px solid var(--c-line);
    border-radius: var(--r-tile);
    overflow: hidden;
}

.wg__name {
    display: flex;
    align-items: center;
    gap: var(--sp-12);
}

.wg__name-text {
    display: block;
    font-weight: 600;
}

.wg__slug {
    display: block;
}

.wg__yes {
    display: inline-flex;
    color: var(--c-ok);
}

.wg__row-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

.wg__empty {
    padding: var(--sp-32) var(--sp-24);
}

.wg__empty .state__title {
    max-width: 54ch;
}

@media (min-width: 900px) {
    .wg__fields {
        grid-template-columns: minmax(0, 2fr) minmax(0, 1.4fr) minmax(0, 1.4fr) minmax(0, 0.8fr) auto;
    }

    .wg__checks {
        padding-top: var(--sp-24);
    }
}

/* Below 900px each row is a block, every value labelled with its column name. */
@media (max-width: 899px) {
    .wg__table thead {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
    }

    .wg__table,
    .wg__table tbody,
    .wg__table tr,
    .wg__table td {
        display: block;
    }

    .wg__table tr {
        padding: var(--sp-12) var(--sp-16);
        border-bottom: 1px solid var(--c-line);
    }

    .wg__table td {
        display: grid;
        grid-template-columns: 120px minmax(0, 1fr);
        gap: var(--sp-12);
        height: auto;
        padding: var(--sp-4) 0;
        border: 0;
        text-align: left;
    }

    .wg__table td::before {
        content: attr(data-label);
        font-size: var(--fs-small);
        color: var(--c-ink-2);
    }
}
</style>
