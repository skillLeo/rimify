<script setup lang="ts">
/**
 * Einstellungen › Zubehörpreise › Wuchtgewichte-Farben.
 *
 * The colours a customer can pick for the balance weights of a Komplettrad, and what each costs per
 * wheel. One form serves a new colour and an existing one: `Bearbeiten` loads the row into it and
 * marks the row, `Abbrechen` empties it again. The money field edits the German string the server
 * sent and posts it back as typed — the server parses it (Money::fromGerman) and refuses anything
 * ambiguous; nothing on this page multiplies cents.
 *
 * Every write is authorised on the server (R-11). `can` only decides what is drawn: a role that may
 * not write sees the list, and the page says once that it is read-only. Deleting asks first, naming
 * the colour, because orders keep the colour they were sold with and the storefront refuses
 * Kompletträder once no active colour is left.
 */

import { router, usePage } from '@inertiajs/vue3'
import { computed, reactive, ref } from 'vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminSectionTabs from '../../../Components/Admin/AdminSectionTabs.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import { ZUBEHOER_TABS } from '../../../Components/Admin/sectionTabs'
import { stampHeaders } from '../../../composables/admin/useDirtyForm'
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

const BASE = '/admin/zubehoerpreise/wuchtgewichte'

const EMPTY_TEXT = 'Noch keine Farbe angelegt. Solange können Kundinnen und Kunden kein Komplettrad bestellen.'
const MONEY_HINT = 'Preis in Euro, mit Komma – zum Beispiel 49,00.'
const MOUNTING_HINT = 'Preis je Rad, mit Komma – zum Beispiel 19,90. Leer lassen heißt: noch nicht festgelegt.'
const MOUNTING_OPEN = 'Solange hier nichts steht, können Kundinnen und Kunden keine Kompletträder bestellen. Felgen allein sind davon nicht betroffen.'

function blank(): ColourForm {
    return { nameDe: '', swatchHex: '', surcharge: '0,00', isDefault: false, active: true, sortOrder: 0 }
}

const page = usePage()
const form = reactive<ColourForm>(blank())
const nameField = ref<HTMLInputElement | null>(null)
/** The id being edited, or null while the form makes a new colour. */
const editing = ref<number | null>(null)
/* The colour as its form opened on (EditStamp, the admin audit's F-25): sent with the save. */
const editingStamp = ref<string | undefined>(undefined)
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
const mountingError = computed(() => (mountingSent.value ? (bag.value.mountingCents ?? bag.value.mounting ?? '') : ''))

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
const formTitle = computed(() => (editingColour.value === null ? 'Neue Farbe' : `Farbe bearbeiten: ${editingColour.value.nameDe}`))
/** The page's one primary action says what it does: make a colour, or keep the edit. */
const submitLabel = computed(() => (editing.value === null ? 'Farbe anlegen' : 'Änderungen speichern'))

const context = computed(() => {
    const total = props.colours.length
    const active = props.colours.filter((c) => c.active).length
    const fee = props.mounting.cents === null ? 'Montagepreis nicht festgelegt' : `Montage ${props.mounting.typed} je Rad`

    return total === 0 ? `Noch keine Farbe · ${fee}` : `${total} ${total === 1 ? 'Farbe' : 'Farben'}, davon ${active} aktiv · ${fee}`
})

const confirmOpen = computed({
    get: () => confirming.value !== null,
    set: (open: boolean) => {
        if (!open) {
            confirming.value = null
        }
    },
})

/** What deleting this colour does, in the sentence the confirmation needs. */
const confirmBody = computed(() => {
    const colour = confirming.value
    const lastActive = colour !== null && colour.active && props.colours.filter((c) => c.active).length === 1
    const kept = 'Bestellungen behalten die Farbe, mit der sie verkauft wurden.'

    return lastActive ? `${kept} Danach ist keine aktive Farbe mehr übrig – Kompletträder lassen sich dann nicht bestellen.` : kept
})

/** The admin's own hex, or the neutral chip from the class when there is none. */
function swatchStyle(hex: string | null): Record<string, string> | undefined {
    return /^#[0-9A-Fa-f]{6}$/.test(hex ?? '') ? { backgroundColor: hex as string } : undefined
}

function reset(): void {
    Object.assign(form, blank())
    editing.value = null
    editingStamp.value = undefined
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
    editingStamp.value = colour.stamp
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
        // The colour as it was when its form opened: changed meanwhile, the save is refused (EditStamp, F-25).
        router.patch(`${BASE}/${editing.value}`, { ...form }, { ...options, headers: stampHeaders(editingStamp.value) })
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
    <AdminPage title="Zubehörpreise" :context="context" :read-only="!canWrite">
        <AdminSectionTabs label="Zubehörpreise" :items="ZUBEHOER_TABS" />

        <p class="adm-note wg__lead">
            Die Farbe wählen Kundinnen und Kunden im Warenkorb, je Komplettrad. Der Aufpreis gilt je Rad; die
            Standardfarbe bekommt jedes Komplettrad, solange nichts anderes gewählt ist.
        </p>

        <!-- The one fee every Komplettrad carries. Its own form, so saving a price never depends on
             the colour form being filled in, and clearing it is a save like any other. -->
        <section v-if="can.update" class="adm-section" aria-labelledby="wg-fee-title">
            <form class="wg__form wg__form--fee" :aria-busy="mountingBusy ? 'true' : undefined" @submit.prevent="saveMounting">
                <h2 id="wg-fee-title" class="adm-section__title wg__form-title">Montage und Auswuchten</h2>

                <div class="form-field">
                    <label class="form-field__label" for="wg-mounting">Preis je Rad</label>
                    <div class="adm-inline">
                        <input
                            id="wg-mounting"
                            v-model="mounting.typed"
                            class="input wg__num"
                            :class="{ 'input--error': mountingError }"
                            type="text"
                            inputmode="decimal"
                            autocomplete="off"
                            maxlength="32"
                            aria-describedby="wg-mounting-help wg-mounting-err"
                            :aria-invalid="mountingError ? 'true' : undefined"
                        >
                        <button class="btn btn--secondary" type="submit" :disabled="mountingBusy">Montagepreis speichern</button>
                    </div>
                    <p id="wg-mounting-help" class="form-field__help">{{ MOUNTING_HINT }}</p>
                    <p id="wg-mounting-err" class="form-field__error">{{ mountingError }}</p>
                </div>

                <p v-if="props.mounting.cents === null" class="adm-note wg__fee-open">{{ MOUNTING_OPEN }}</p>
            </form>
        </section>

        <section v-if="canWrite" class="adm-section" aria-labelledby="wg-form-title">
            <form class="wg__form" :aria-busy="busy ? 'true' : undefined" @submit.prevent="submit">
                <h2 id="wg-form-title" class="adm-section__title wg__form-title">{{ formTitle }}</h2>
                <!-- Changed meanwhile elsewhere (EditStamp): nothing was saved, and what was typed stays. -->
                <p v-if="errors._stamp" class="adm-alert" role="alert">{{ errors._stamp }}</p>

                <div class="adm-fields wg__fields">
                    <div class="form-field">
                        <label class="form-field__label" for="wg-name">Bezeichnung</label>
                        <input
                            id="wg-name"
                            ref="nameField"
                            v-model="form.nameDe"
                            class="input"
                            :class="{ 'input--error': errors.nameDe || errors.slug }"
                            type="text"
                            maxlength="64"
                            autocomplete="off"
                            aria-required="true"
                            aria-describedby="wg-name-err"
                            :aria-invalid="errors.nameDe || errors.slug ? 'true' : undefined"
                        >
                        <p id="wg-name-err" class="form-field__error">{{ errors.nameDe ?? errors.slug ?? '' }}</p>
                    </div>

                    <div class="form-field">
                        <label class="form-field__label" for="wg-hex">Farbwert (Hex, optional)</label>
                        <div class="wg__hex">
                            <span class="wg__swatch" :style="swatchStyle(form.swatchHex)" aria-hidden="true" />
                            <input
                                id="wg-hex"
                                v-model="form.swatchHex"
                                class="input"
                                :class="{ 'input--error': errors.swatchHex }"
                                type="text"
                                placeholder="#C8CCD2"
                                maxlength="7"
                                autocomplete="off"
                                spellcheck="false"
                                aria-describedby="wg-hex-err"
                                :aria-invalid="errors.swatchHex ? 'true' : undefined"
                            >
                        </div>
                        <p id="wg-hex-err" class="form-field__error">{{ errors.swatchHex ?? '' }}</p>
                    </div>

                    <div class="form-field">
                        <label class="form-field__label" for="wg-surcharge">Aufpreis je Rad</label>
                        <input
                            id="wg-surcharge"
                            v-model="form.surcharge"
                            class="input wg__num wg__money"
                            :class="{ 'input--error': errors.surchargeCents }"
                            type="text"
                            inputmode="decimal"
                            autocomplete="off"
                            aria-describedby="wg-surcharge-help wg-surcharge-err"
                            :aria-invalid="errors.surchargeCents ? 'true' : undefined"
                        >
                        <p id="wg-surcharge-help" class="form-field__help">{{ MONEY_HINT }}</p>
                        <p id="wg-surcharge-err" class="form-field__error">{{ errors.surchargeCents ?? '' }}</p>
                    </div>

                    <div class="form-field adm-fields__narrow">
                        <label class="form-field__label" for="wg-sort">Reihenfolge</label>
                        <input
                            id="wg-sort"
                            v-model.number="form.sortOrder"
                            class="input wg__num"
                            :class="{ 'input--error': errors.sortOrder }"
                            type="number"
                            min="0"
                            max="9999"
                            step="1"
                            aria-describedby="wg-sort-err"
                            :aria-invalid="errors.sortOrder ? 'true' : undefined"
                        >
                        <p id="wg-sort-err" class="form-field__error">{{ errors.sortOrder ?? '' }}</p>
                    </div>

                    <div class="adm-fields__checks wg__checks">
                        <label class="check">
                            <input v-model="form.isDefault" type="checkbox">
                            Standardfarbe
                        </label>
                        <label class="check">
                            <input v-model="form.active" type="checkbox">
                            Aktiv
                        </label>
                        <p class="form-field__error">{{ errors.isDefault ?? errors.active ?? '' }}</p>
                    </div>
                </div>

                <div class="adm-fields__actions">
                    <button class="btn btn--primary" type="submit" :disabled="busy">{{ submitLabel }}</button>
                    <button v-if="editing !== null" class="btn btn--secondary" type="button" @click="reset">Abbrechen</button>
                </div>
            </form>
        </section>

        <section class="adm-section" aria-labelledby="wg-list-title">
            <div class="adm-section__head">
                <h2 id="wg-list-title" class="adm-section__title">Farben</h2>
            </div>

            <div v-if="colours.length > 0" class="adm-panel">
                <table class="adm-table wg__table">
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
                                <span class="wg__name">
                                    <span class="wg__swatch" :style="swatchStyle(colour.swatchHex)" aria-hidden="true" />
                                    <span>
                                        <span class="adm-table__key">{{ colour.nameDe }}</span>
                                        <span v-if="colour.demo" class="adm-tag adm-tag--neutral adm-demo">Demodaten</span>
                                        <span class="adm-table__sub">{{ colour.slug }}</span>
                                    </span>
                                </span>
                            </td>
                            <td data-label="Farbwert (Hex)" class="wg__hexcell" data-phone="hide">{{ colour.swatchHex ?? '–' }}</td>
                            <td data-label="Aufpreis je Rad" class="num">{{ colour.surcharge }}</td>
                            <td data-label="Standardfarbe">
                                <span v-if="colour.isDefault" class="wg__yes">
                                    <Icon name="check" :size="20" />
                                    <span class="visually-hidden">Standardfarbe</span>
                                </span>
                                <span v-else class="wg__no">
                                    <span aria-hidden="true">–</span>
                                    <span class="visually-hidden">keine Standardfarbe</span>
                                </span>
                            </td>
                            <td data-label="Aktiv" data-phone="status">
                                <template v-if="colour.active">Aktiv</template>
                                <span v-else class="adm-tag adm-tag--neutral">Inaktiv</span>
                            </td>
                            <td data-label="Reihenfolge" class="num">{{ colour.sortOrder }}</td>
                            <td v-if="canAct" data-label="Aktionen">
                                <div class="adm-table__actions">
                                    <button v-if="can.update" class="btn btn--secondary btn--sm" type="button" @click="edit(colour)">
                                        Bearbeiten<span class="visually-hidden">: {{ colour.nameDe }}</span>
                                    </button>
                                    <button v-if="can.delete" class="btn btn--secondary btn--sm adm-btn--danger" type="button" @click="confirming = colour">
                                        Löschen<span class="visually-hidden">: {{ colour.nameDe }}</span>
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
            :title="`Farbe „${confirming?.nameDe ?? ''}“ löschen?`"
            :body="confirmBody"
            :busy="busy"
            @confirm="remove"
        />
    </AdminPage>
</template>

<style scoped>
.wg__lead {
    margin-bottom: var(--sp-24);
}

/* A form sits on the page under its heading, one column (§8.2), no card around it. */
.wg__form {
    max-width: var(--adm-form-max);
}

.wg__form-title {
    margin-bottom: var(--sp-16);
}

.wg__fee-open {
    max-width: 54ch;
    margin-top: var(--sp-12);
}

/* A price is a few characters wide; a field the width of the form invites a sentence. */
.wg__money {
    max-width: 22ch;
}

.wg__num {
    font-variant-numeric: tabular-nums;
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
    border: 1px solid var(--c-line-2);
    border-radius: var(--r-round);
    background: var(--c-band);
}

.wg__name {
    display: flex;
    align-items: center;
    gap: var(--sp-12);
}

.wg__hexcell {
    font-variant-numeric: tabular-nums;
    color: var(--c-ink-2);
}

/* A fact, not a success: the tick is ink, like the text around it. */
.wg__yes {
    display: inline-flex;
    color: var(--c-ink);
}

.wg__no {
    color: var(--c-ink-3);
}
</style>
