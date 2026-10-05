<script setup lang="ts">
/**
 * The selector panel of the phone homepage (H2): the camera first, then the two routes to a
 * vehicle — Marke & Modell as native selects, or HSN/TSN — with the live count under the fields
 * and the primary button carrying it. With a vehicle already chosen, the panel names it and
 * offers the listing instead of asking again.
 *
 * Three things it never does: guess between two vehicles behind one key pair (R-01), claim a
 * count it could not load, or leave a failure without a way forward (R-09).
 *
 * The scan hands the photo to `Components/Home/DocumentScan.vue`, loaded only on the tap. While
 * that component does not exist in the build, the button still opens the camera and then sends
 * the visitor to the HSN/TSN fields, so nothing here depends on it.
 */

import { Link, router, usePage } from '@inertiajs/vue3'
import { computed, defineAsyncComponent, nextTick, ref, useId, watch, type Component } from 'vue'
import DocFacsimile from '../../Art/DocFacsimile.vue'
import Icon from '../../Ui/Icon.vue'
import Skeleton from '../../Ui/Skeleton.vue'
import BottomSheet from '../BottomSheet.vue'
import { decimal, passendeAnzeigen } from '../../../format'
import { ZERO_LABEL, zeroSentence } from '../../../lib/zeroState'
import { useShared } from '../../../composables/useShared'
import { contactHref } from '../../../lib/contact'
import { cleanHsn, cleanTsn, HSN_LENGTH, splitKeys, TSN_LENGTH, useVehiclePicker, type VariantRow } from '../../../composables/mobile/useVehiclePicker'
import type { DocVariant } from '../../../art'
import type { LookupResult, MakeOption } from '../../../types/pages'
import type { GarageVehicle } from '../../../types/rimify'

const props = withDefaults(
    defineProps<{
        makes: MakeOption[]
        /** F1 for the chosen vehicle (`fitmentCount.count`); null without one or while unknown. */
        total?: number | null
        /** No wheel published at all: the chosen car's 0 then says the shop is still empty (`fitmentCount.shopEmpty`). */
        shopEmpty?: boolean
        garage?: GarageVehicle[]
    }>(),
    { total: null, shopEmpty: false, garage: () => [] }
)

const shared = useShared()
const page = usePage<{ lookup?: LookupResult | null; keyNumbersClosed?: string | null }>()
/* No vehicle dataset yet (KeyNumberSearch): the key-number route and the camera say so, and lead to Marke & Modell. */
const keysClosed = computed(() => page.props.keyNumbersClosed ?? null)
const vehicle = computed(() => shared.value.vehicle)
const contact = computed(() => shared.value.contact)
const lookup = computed(() => page.props.lookup ?? null)

/*
 * The third way forward (R-09) and the line under a failed request: the phone when the client has
 * given one, otherwise the contact form with the key numbers that found nothing in its subject
 * (#26) — never an invented number. The sentence still names the address, to read and copy.
 */
const reach = computed(() => {
    const { phone, phoneIntl, email } = contact.value
    // The pair as the miss line shows it: what is typed, else what the server looked up.
    const hsn = picker.hsn.value || lookup.value?.hsn
    const tsn = picker.tsn.value || lookup.value?.tsn

    return phone
        ? { href: `tel:${(phoneIntl ?? phone).replace(/\s/g, '')}`, label: `Anrufen: ${phone}`, sentence: `ruf uns an: ${phone}`, form: false }
        : {
              href: contactHref({ subject: hsn && tsn ? `Fahrzeug nicht gefunden: HSN ${hsn} · TSN ${tsn}` : null, from: page.url }),
              label: 'Schreib uns',
              sentence: `schreib uns: ${email}`,
              form: true,
          }
})
/* The zero notice's way to ask, where no mail can confirm a subscription (F2). */
const askHref = computed(() => contactHref({ subject: 'Felge für mein Fahrzeug gesucht', from: page.url }))
/*
 * No car in the shop at all — an emptied test environment: said under the Marke field, with the one way on that works,
 * as /felgen-suchen says it (VehicleSelector); and nothing leads to Marke & Modell, which has nothing to offer.
 */
const noCars = computed(() => props.makes.length === 0)
const emptyHref = computed(() => contactHref({ subject: 'Mein Fahrzeug ist nicht dabei', from: page.url }))

const picker = useVehiclePicker()
const uid = useId()

/* ── The scan ──────────────────────────────────────────────────────────────── */

const scanModules = import.meta.glob<{ default: Component }>('../../Home/DocumentScan.vue')
const scanLoader = scanModules['../../Home/DocumentScan.vue']
const DocumentScan = scanLoader ? defineAsyncComponent(scanLoader) : null

const fileInput = ref<HTMLInputElement | null>(null)
const scanFile = ref<File | null>(null)
const scanOpen = ref(false)
const scanUnavailable = ref(false)
const hsnField = ref<HTMLInputElement | null>(null)
const tsnField = ref<HTMLInputElement | null>(null)

function openCamera(): void {
    fileInput.value?.click()
}

async function onFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0] ?? null
    input.value = ''

    if (file === null) {
        return
    }

    if (DocumentScan === null) {
        // No recogniser in this build: the fields are the way, with the caret already in HSN.
        scanUnavailable.value = true
        picker.route.value = 'keys'
        await nextTick()
        hsnField.value?.focus()

        return
    }

    scanFile.value = file
    scanOpen.value = true
}

async function onScanResult(result: { hsn: string; tsn: string }): Promise<void> {
    scanOpen.value = false
    picker.route.value = 'keys'
    picker.hsn.value = cleanHsn(result.hsn)
    picker.tsn.value = cleanTsn(result.tsn)
    await nextTick()
    hsnField.value?.focus()
}

async function onScanFailed(): Promise<void> {
    scanOpen.value = false
    scanUnavailable.value = true
    picker.route.value = 'keys'
    await nextTick()
    hsnField.value?.focus()
}

/* ── Keys ──────────────────────────────────────────────────────────────────── */

const hsnError = ref('')
const tsnError = ref('')
const helpOpen = ref(false)
const doc = ref<DocVariant>('neu')
const candidate = ref<number | null>(null)

/** A pair typed, pasted or put in by the keyboard fills both fields (splitKeys); four characters move the caret on. */
function onHsn(event: Event): void {
    takeKeys(event.target as HTMLInputElement, (event.target as HTMLInputElement).value)
}

function onHsnPaste(event: ClipboardEvent): void {
    takeKeys(event.target as HTMLInputElement, event.clipboardData?.getData('text') ?? '')
}

function takeKeys(field: HTMLInputElement, raw: string): void {
    const keys = splitKeys(raw)

    picker.hsn.value = keys.hsn
    // The field shows what was kept, also when the kept part did not change („0005“ + „/582“).
    field.value = keys.hsn
    hsnError.value = ''

    if (keys.tsn !== null) {
        picker.tsn.value = keys.tsn
        tsnError.value = ''
    }

    if (keys.hsn.length === HSN_LENGTH) {
        tsnField.value?.focus()
    }
}

function onTsn(event: Event): void {
    picker.tsn.value = cleanTsn((event.target as HTMLInputElement).value)
    tsnError.value = ''
}

function validateHsn(): void {
    hsnError.value = picker.hsn.value !== '' && !/^\d{4}$/.test(picker.hsn.value) ? 'Die HSN hat vier Ziffern – führende Nullen gehören dazu.' : ''
}

function validateTsn(): void {
    tsnError.value = picker.tsn.value !== '' && picker.tsn.value.length !== TSN_LENGTH ? 'Die TSN sind die ersten drei Zeichen aus Feld 2.2 – Ziffern oder Buchstaben.' : ''
}

async function retypeKeys(): Promise<void> {
    picker.hsn.value = ''
    picker.tsn.value = ''
    candidate.value = null
    await nextTick()
    hsnField.value?.focus()
}

async function focusHsn(): Promise<void> {
    picker.route.value = 'keys'
    await nextTick()
    hsnField.value?.focus()
}

watch(
    () => picker.count.value.status,
    () => {
        candidate.value = null
    }
)

/* ── Guided ────────────────────────────────────────────────────────────────── */

function variantLabel(v: VariantRow): string {
    const power = v.powerPs === null ? null : `${decimal(Math.round(v.powerPs * 0.7355), 0)} kW`
    // Feld K's range tells apart the halves a Gutachten splits one car into, where no key numbers do yet — and
    // it stands where a closed select and the picker wheel still show it, in place of the unknown build window.
    const parts = [v.variant, power, v.approvalShort ?? v.buildWindow].filter((p): p is string => p !== null && p !== '')

    return `${parts.join(' · ')}${v.needsReview ? ' (unvollständige Daten)' : ''}`
}

const chosenApproval = computed(() => picker.variants.value.find((v) => v.id === picker.variantId.value)?.approval ?? null)

/* ── The count and the button ──────────────────────────────────────────────── */

const count = computed(() => picker.count.value)
const zero = computed(() => count.value.status === 'ready' && count.value.count === 0)

const canSubmit = computed(() => {
    if (zero.value) {
        return false
    }

    if (picker.chosenId.value !== null) {
        return true
    }

    // The count service is down but the keys are complete: the server can still resolve them.
    return picker.route.value === 'keys' && picker.keysComplete.value && count.value.status === 'failed'
})

const buttonLabel = computed(() => {
    if (zero.value) {
        return ZERO_LABEL
    }

    if (count.value.status === 'ready') {
        return passendeAnzeigen(count.value.count)
    }

    return canSubmit.value ? 'Passende Felgen anzeigen' : 'Fahrzeug wählen'
})

const submitting = ref(false)

function pick(id: number): void {
    submitting.value = true
    router.post(
        '/fahrzeug',
        { fahrzeug: id },
        {
            onFinish: () => {
                submitting.value = false
            },
        }
    )
}

/*
 * No car yet: the button waits in the brand's light blue, announced as unavailable but pressable, and a press leads
 * to the field that is missing (the client's #1, D-109). No wheels, a pair not found or a request on its way stay
 * truly disabled: pressing could not help there.
 */
const waiting = computed(
    () => !canSubmit.value && !zero.value && !submitting.value && count.value.status !== 'not_found' && count.value.status !== 'ambiguous'
)

function guide(): void {
    const field = (suffix: string): HTMLElement | null => document.getElementById(`${uid}-${suffix}`)
    // A field that can take focus now: a list loading or failed leaves its select disabled.
    const usable = (el: HTMLElement | null): el is HTMLElement => el !== null && !(el as HTMLSelectElement).disabled
    let target: HTMLElement | null

    if (picker.route.value === 'guided') {
        const order = [field('marke'), field('modell'), field('fahrzeug')]
        const missing = [picker.make.value === '', picker.model.value === '', true]
        // The first missing field that can be used; while a later list loads or failed, the last one that can.
        target = order.find((el, i) => missing[i] && usable(el)) ?? [...order].reverse().find(usable) ?? null
    } else {
        target = field(picker.hsn.value.length === HSN_LENGTH ? 'tsn' : 'hsn')
    }

    target?.scrollIntoView({ block: 'center', behavior: 'auto' })
    target?.focus({ preventScroll: true })
}

/* The two tabs are one stop with the arrow keys between them, as the desktop's tabs are (WAI-ARIA tabs). */
function onTabKey(event: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        return
    }

    event.preventDefault()
    const next: 'guided' | 'keys' = event.key === 'Home' ? 'guided' : event.key === 'End' ? 'keys' : picker.route.value === 'guided' ? 'keys' : 'guided'
    picker.route.value = next
    void nextTick(() => document.getElementById(`${uid}-tab-${next}`)?.focus())
}

function submit(): void {
    if (waiting.value) {
        guide()

        return
    }

    if (!canSubmit.value) {
        return
    }

    if (picker.chosenId.value !== null) {
        pick(picker.chosenId.value)

        return
    }

    submitting.value = true
    router.post(
        '/fahrzeug/schluesselnummern',
        { hsn: picker.hsn.value, tsn: picker.tsn.value },
        {
            preserveScroll: true,
            onFinish: () => {
                submitting.value = false
            },
        }
    )
}

function removeVehicle(): void {
    router.delete('/fahrzeug', { preserveScroll: true })
}

/* ── Zero wheels: the notify form (F2) ─────────────────────────────────────── */

const notifyEmail = ref('')
const notifyState = ref<'idle' | 'busy' | 'done' | 'failed'>('idle')
const notifyError = ref('')

/** Laravel's XSRF cookie, decoded, as the `X-XSRF-TOKEN` header the JSON endpoint checks. */
function xsrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)

    return match?.[1] ? decodeURIComponent(match[1]) : ''
}

/*
 * `POST /api/v1/fitment/notify`: 202 means the confirmation mail is on its way; 422 names the
 * field; anything else is the honest line with the way to reach us.
 */
async function notify(): Promise<void> {
    if (notifyEmail.value.trim() === '' || count.value.status !== 'ready') {
        return
    }

    notifyState.value = 'busy'
    notifyError.value = ''

    try {
        const response = await fetch('/api/v1/fitment/notify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN': xsrfToken(),
            },
            credentials: 'same-origin',
            body: JSON.stringify({ email: notifyEmail.value.trim(), fahrzeug: count.value.vehicle.id }),
        })

        if (response.status === 202) {
            notifyState.value = 'done'

            return
        }

        if (response.status === 422) {
            const body = (await response.json()) as { errors?: Record<string, string[]> }
            notifyError.value = body.errors?.email?.[0] ?? body.errors?.fahrzeug?.[0] ?? ''
        }

        notifyState.value = 'failed'
    } catch {
        notifyState.value = 'failed'
    }
}

const totalLabel = computed(() => (props.total === null ? null : decimal(props.total, 0)))
</script>

<template>
    <!-- With a vehicle: the panel names it and offers the listing. -->
    <div v-if="vehicle" class="vpanel vpanel--vehicle">
        <span class="label">Dein Fahrzeug</span>
        <p class="h3">{{ vehicle.label }}</p>
        <!-- Feld K first where it is what tells the car apart; the unknown build window then says nothing. -->
        <p class="small num muted">{{ vehicle.approval ?? `${vehicle.keyNumbers} · ${vehicle.buildWindow}` }}</p>
        <!-- Zero is a state, not a gap: the sentence here, the 0 on the button (the brief of 05.10.2026, §2). -->
        <p v-if="total === 0" class="small vpanel__count">{{ zeroSentence(shopEmpty) }}</p>
        <p v-else-if="totalLabel !== null" class="small num vpanel__count">
            <strong>{{ totalLabel }}</strong> {{ total === 1 ? 'Felge' : 'Felgen' }} mit Gutachten für {{ vehicle.label }}
        </p>
        <Link href="/felgen" class="btn btn--primary btn--lg btn--block vpanel__go" data-primary prefetch>
            {{ total === 0 ? ZERO_LABEL : total !== null ? passendeAnzeigen(total) : 'Passende Felgen anzeigen' }}
        </Link>
        <div class="vpanel__links">
            <Link href="/felgen-suchen" class="link">Fahrzeug ändern</Link>
            <button class="link" type="button" @click="removeVehicle">Fahrzeug entfernen</button>
        </div>
    </div>

    <div v-else class="vpanel">
        <!-- The camera, above everything: the fastest route for anyone holding their papers. It reads the key numbers,
             so it waits with them while no vehicle dataset is loaded (KeyNumberSearch). -->
        <template v-if="!keysClosed">
            <button class="btn btn--secondary btn--block m-press" type="button" @click="openCamera">
                <Icon name="camera" :size="20" />
                Fahrzeugschein fotografieren
            </button>
            <input
                ref="fileInput"
                class="visually-hidden"
                type="file"
                accept="image/*"
                capture="environment"
                tabindex="-1"
                aria-hidden="true"
                @change="onFile"
            >
            <p class="small quiet vpanel__scan-note">Die Erkennung läuft auf deinem Gerät. Das Foto wird nicht hochgeladen.</p>
            <p v-if="scanUnavailable" class="notice vpanel__notice" role="status">
                Wir konnten HSN und TSN nicht lesen. Trag sie bitte von Hand ein.
            </p>
        </template>

        <div class="tabs__list" role="tablist" aria-label="Fahrzeug wählen">
            <button
                :id="`${uid}-tab-guided`"
                class="tabs__trigger"
                type="button"
                role="tab"
                :aria-selected="picker.route.value === 'guided'"
                :tabindex="picker.route.value === 'guided' ? 0 : -1"
                :aria-controls="`${uid}-panel-guided`"
                :data-state="picker.route.value === 'guided' ? 'active' : 'inactive'"
                @keydown="onTabKey"
                @click="picker.route.value = 'guided'"
            >
                Marke &amp; Modell
            </button>
            <button
                :id="`${uid}-tab-keys`"
                class="tabs__trigger"
                type="button"
                role="tab"
                :aria-selected="picker.route.value === 'keys'"
                :tabindex="picker.route.value === 'keys' ? 0 : -1"
                :aria-controls="`${uid}-panel-keys`"
                :data-state="picker.route.value === 'keys' ? 'active' : 'inactive'"
                @keydown="onTabKey"
                @click="picker.route.value = 'keys'"
            >
                HSN/TSN
            </button>
        </div>

        <!-- Both panels stay in the DOM and share one cell, the inactive one invisible: the panel is as tall as the
             taller of the two, so a tab switch moves nothing below it (the client's #7, D-112). -->
        <div class="vpanel__panels">
            <!-- Route one: three native selects, so the OS picker opens. -->
            <div :id="`${uid}-panel-guided`" class="vpanel__fields" :data-state="picker.route.value === 'guided' ? 'active' : 'inactive'" role="tabpanel" :aria-labelledby="`${uid}-tab-guided`">
                <div class="form-field">
                    <label class="form-field__label" :for="`${uid}-marke`">Marke</label>
                    <select :id="`${uid}-marke`" v-model="picker.make.value" class="input" autocomplete="off">
                        <option value="">z. B. BMW</option>
                        <option v-for="m in makes" :key="m.make" :value="m.make">{{ m.make }}</option>
                    </select>
                    <p v-if="noCars" class="form-field__help vpanel__no-cars">
                        Hier ist noch kein Fahrzeug hinterlegt. <Link class="link" :href="emptyHref">Schreib uns, welches Auto du fährst</Link>.
                    </p>
                </div>

                <div class="form-field">
                    <label class="form-field__label" :for="`${uid}-modell`">Modell</label>
                    <select
                        :id="`${uid}-modell`"
                        v-model="picker.model.value"
                        class="input"
                        autocomplete="off"
                        :disabled="picker.make.value === '' || picker.modelsLoading.value || picker.modelsFailed.value"
                        :aria-busy="picker.modelsLoading.value ? 'true' : undefined"
                    >
                        <option value="">{{ picker.modelsLoading.value ? 'Wird geladen …' : 'z. B. 3er Coupé' }}</option>
                        <option v-for="m in picker.models.value" :key="m.model" :value="m.model">{{ m.model }}</option>
                    </select>
                    <!-- A network failure, not a typing error: the line appears only when it has something to say. -->
                    <p v-if="picker.modelsFailed.value" class="form-field__error">
                        Die Modelle lassen sich gerade nicht laden.
                        <Link :href="`/felgen-suchen?marke=${encodeURIComponent(picker.make.value)}`" class="link small">Auf der Fahrzeugseite weitermachen</Link>
                    </p>
                </div>

                <div class="form-field">
                    <label class="form-field__label" :for="`${uid}-fahrzeug`">Fahrzeug</label>
                    <select
                        :id="`${uid}-fahrzeug`"
                        v-model.number="picker.variantId.value"
                        class="input"
                        autocomplete="off"
                        :disabled="picker.model.value === '' || picker.variantsLoading.value || picker.variantsFailed.value"
                        :aria-busy="picker.variantsLoading.value ? 'true' : undefined"
                    >
                        <option :value="null">{{ picker.variantsLoading.value ? 'Wird geladen …' : 'Variante, Baujahr, kW' }}</option>
                        <!-- Incomplete data is said, not refused: the wheel is answered from its Gutachten, and the
                             tyres wait for the papers (R-03 as amended) — as /felgen-suchen offers the same cars. -->
                        <option v-for="v in picker.variants.value" :key="v.id" :value="v.id">{{ variantLabel(v) }}</option>
                    </select>
                    <p v-if="picker.variantsFailed.value" class="form-field__error">Die Varianten lassen sich gerade nicht laden.</p>
                    <!-- The whole Feld K line under the select once a variant is picked: the option has room for its range only. -->
                    <p v-else-if="chosenApproval" class="form-field__help num">{{ chosenApproval }}</p>
                </div>
            </div>

            <!-- Route two: the key numbers off the Zulassungsbescheinigung. -->
            <div :id="`${uid}-panel-keys`" class="vpanel__fields" :data-state="picker.route.value === 'keys' ? 'active' : 'inactive'" role="tabpanel" :aria-labelledby="`${uid}-tab-keys`">
                <!-- No vehicle dataset yet (KeyNumberSearch): one sentence and the way that works, never fields that find nothing. -->
                <div v-if="keysClosed" class="notice vpanel__notice vpanel__closed">
                    <p>{{ keysClosed }}</p>
                    <button v-if="!noCars" class="link" type="button" @click="picker.route.value = 'guided'">Marke &amp; Modell wählen</button>
                </div>
                <template v-else>
                    <div class="vpanel__keys">
                        <div class="form-field">
                            <label class="form-field__label" :for="`${uid}-hsn`">HSN (Feld 2.1)</label>
                            <input
                                :id="`${uid}-hsn`"
                                ref="hsnField"
                                class="input input--code num"
                                type="text"
                                inputmode="numeric"
                                autocomplete="off"
                                enterkeyhint="next"
                                :value="picker.hsn.value"
                                :aria-invalid="hsnError ? 'true' : undefined"
                                :aria-describedby="`${uid}-keys-error`"
                                @input="onHsn"
                                @paste.prevent="onHsnPaste"
                                @blur="validateHsn"
                                @keydown.enter.prevent="tsnField?.focus()"
                            >
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" :for="`${uid}-tsn`">TSN (Feld 2.2)</label>
                            <input
                                :id="`${uid}-tsn`"
                                ref="tsnField"
                                class="input input--code"
                                type="text"
                                autocapitalize="characters"
                                :maxlength="TSN_LENGTH"
                                autocomplete="off"
                                enterkeyhint="go"
                                :value="picker.tsn.value"
                                :aria-invalid="tsnError ? 'true' : undefined"
                                :aria-describedby="`${uid}-keys-error`"
                                @input="onTsn"
                                @blur="validateTsn"
                                @keydown.enter.prevent="submit"
                            >
                        </div>
                    </div>
                    <p :id="`${uid}-keys-error`" class="form-field__error">{{ hsnError || tsnError }}</p>
                    <button class="link small vpanel__help" type="button" @click="helpOpen = true">Wo finde ich HSN und TSN?</button>

                    <!-- Several vehicles behind one pair: a confirmation, never a guess (R-01). -->
                    <div v-if="count.status === 'ambiguous'" class="vpanel__chooser">
                        <p class="h4">{{ count.rows.length }} Fahrzeuge passen zu {{ picker.hsn.value }}/{{ picker.tsn.value }} – welches ist deins?</p>
                        <label v-for="row in count.rows" :key="row.id" class="check">
                            <input v-model="candidate" type="radio" :name="`${uid}-kandidat`" :value="row.id">
                            <span>{{ row.label }}</span>
                        </label>
                        <button class="btn btn--secondary btn--block" type="button" :disabled="candidate === null" @click="candidate !== null && picker.resolveAmbiguity(candidate)">
                            Dieses Fahrzeug wählen
                        </button>
                        <button class="link small" type="button" @click="retypeKeys">Andere Nummern eingeben</button>
                    </div>

                    <!-- Nothing found: what was typed stays, and three ways forward (R-09). -->
                    <div v-if="count.status === 'not_found' || lookup?.status === 'not_found'" class="notice vpanel__notice">
                        <Icon name="warning" :size="20" />
                        <div class="vpanel__miss">
                            <p>Zu {{ picker.hsn.value || lookup?.hsn }}/{{ picker.tsn.value || lookup?.tsn }} haben wir die Daten für dieses Fahrzeug noch nicht hinterlegt.</p>
                            <button class="link" type="button" @click="focusHsn">Nochmal prüfen</button>
                            <button class="link" type="button" @click="picker.route.value = 'guided'">Über Marke &amp; Modell wählen</button>
                            <component :is="reach.form ? Link : 'a'" class="link num" :href="reach.href">{{ reach.label }}</component>
                        </div>
                    </div>
                </template>
            </div>
        </div>

        <!-- The live count (F1). -->
        <div class="vpanel__count" aria-live="polite">
            <Skeleton v-if="count.status === 'loading'" width="60%" height="var(--lh-small)" />
            <p v-else-if="count.status === 'failed'" class="small muted">Die Anzahl lässt sich gerade nicht laden.</p>
            <p v-else-if="count.status === 'ready' && count.count > 0" class="small num">
                <strong>{{ decimal(count.count, 0) }}</strong> {{ count.count === 1 ? 'Felge' : 'Felgen' }} mit Gutachten für {{ count.vehicle.label }}
            </p>

            <!-- Zero wheels (F2): said plainly, with the one thing we can offer. -->
            <div v-else-if="zero" class="notice vpanel__zero">
                <div>
                    <p>{{ zeroSentence(count.status === 'ready' && count.shopEmpty === true) }}</p>
                    <!-- Only where outgoing mail is configured: otherwise the confirmation would never arrive (F2). -->
                    <p v-if="shared.notifyByMail !== true" class="small muted">
                        <Link class="link" :href="askHref">Schreib uns</Link> – wir sehen nach, was es dafür gibt.
                    </p>
                    <template v-else-if="notifyState === 'done'">
                        <p class="small muted">Danke. Bestätige bitte den Link in der E-Mail, die wir dir gerade geschickt haben.</p>
                    </template>
                    <form v-else class="vpanel__notify" @submit.prevent="notify">
                        <p class="small muted">Sag uns deine E-Mail-Adresse – wir melden uns, sobald ein Gutachten dein Fahrzeug nennt.</p>
                        <div class="form-field">
                            <label class="form-field__label" :for="`${uid}-mail`">E-Mail-Adresse</label>
                            <input :id="`${uid}-mail`" v-model="notifyEmail" class="input" type="email" autocomplete="email" inputmode="email" enterkeyhint="send" required>
                            <p class="form-field__error">
                                <template v-if="notifyState === 'failed'">{{ notifyError || `Das hat nicht geklappt. Versuch es bitte noch einmal oder ${reach.sentence}.` }}</template>
                            </p>
                        </div>
                        <button class="btn btn--secondary btn--block" type="submit" :aria-busy="notifyState === 'busy' ? 'true' : undefined">Bescheid geben</button>
                        <p class="micro quiet">Du bekommst zuerst eine Bestätigungsmail. Abmelden geht jederzeit mit einem Klick.</p>
                    </form>
                </div>
            </div>
        </div>

        <!-- No car yet: light blue, aria-disabled, and a press leads to the missing field (#1, D-109). -->
        <button
            class="btn btn--primary btn--lg btn--block vpanel__go"
            :class="{ 'vpanel__go--waiting': waiting }"
            type="button"
            data-primary
            :disabled="!waiting && (!canSubmit || submitting)"
            :aria-disabled="waiting ? 'true' : undefined"
            :aria-busy="submitting ? 'true' : undefined"
            @click="submit"
        >
            {{ buttonLabel }}
        </button>

        <!-- Saved vehicles (F7). -->
        <div v-if="garage.length" class="vpanel__garage">
            <span class="label">Zuletzt gewählt:</span>
            <div class="chip-row">
                <button v-for="entry in garage" :key="entry.id" class="chip m-press" type="button" :aria-label="entry.range ? `${entry.label} · ${entry.range}` : entry.label" @click="pick(entry.id)">{{ entry.short }}<span v-if="entry.range" class="vpanel__chip-range num"> · {{ entry.range }}</span></button>
            </div>
        </div>
    </div>

    <!-- Where the key numbers are: the document, both editions. -->
    <BottomSheet id="hsn-hilfe" v-model:open="helpOpen" title="Wo finde ich HSN und TSN?">
        <div class="chip-row vpanel__doc-toggle" role="group" aria-label="Ausgabe des Fahrzeugscheins">
            <button class="chip" type="button" :aria-pressed="doc === 'neu'" @click="doc = 'neu'">Neue Zulassungsbescheinigung</button>
            <button class="chip" type="button" :aria-pressed="doc === 'alt'" @click="doc = 'alt'">Alter Fahrzeugschein</button>
        </div>
        <div class="vpanel__doc">
            <DocFacsimile :variant="doc" :width="350" />
        </div>
        <p class="small muted">Die HSN steht in Feld 2.1, die TSN sind die ersten drei Zeichen von Feld 2.2 deiner Zulassungsbescheinigung Teil I.</p>
    </BottomSheet>

    <!-- The scan, when the recogniser is part of the build. -->
    <BottomSheet v-if="DocumentScan" id="scan" v-model:open="scanOpen" title="Fahrzeugschein" snap="half">
        <component :is="DocumentScan" v-if="scanFile" :file="scanFile" @result="onScanResult" @failed="onScanFailed" @close="scanOpen = false" />
    </BottomSheet>
</template>

<style scoped>
.vpanel {
    display: grid;
    gap: var(--sp-12);
    padding: var(--sp-16);
    border-radius: var(--r-tile);
    background: var(--c-surface);
    box-shadow: var(--e-2);
}

/* One cell for both routes (#7, D-112): the taller sets the height; the inactive one is out of sight, out of the tab
   order and out of the accessibility tree. */
.vpanel__panels {
    display: grid;
}

.vpanel__panels > .vpanel__fields {
    grid-area: 1 / 1;
    min-width: 0;
}

.vpanel__panels > .vpanel__fields[data-state='inactive'] {
    visibility: hidden;
}

/* Waiting for a car (#1, D-109): the brand's light blue, the words in blue — 6,4 : 1 — never greyed out. */
.vpanel__go--waiting,
.vpanel__go--waiting:active {
    border-color: var(--c-blue-tint);
    background: var(--c-blue-tint);
    color: var(--c-blue);
    transform: none;
}

.vpanel--vehicle {
    gap: var(--sp-8);
}

.vpanel__scan-note {
    margin-top: calc(-1 * var(--sp-4));
}

.vpanel__fields {
    display: grid;
    gap: var(--sp-12);
}

.vpanel__keys {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: var(--gutter);
}

.vpanel__help {
    justify-self: start;
    min-height: 44px;
}

.vpanel__count {
    min-height: var(--lh-small);
}

.vpanel__count strong {
    color: var(--c-ink);
    font-weight: 600;
}

.vpanel__links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8) var(--sp-24);
}

.vpanel__links .link {
    min-height: 44px;
}

.vpanel__chooser {
    display: grid;
    gap: var(--sp-8);
    padding-top: var(--sp-8);
}

.vpanel__chooser .link {
    justify-self: start;
    min-height: 44px;
}

.vpanel__notice {
    align-items: flex-start;
}

/* The key-number route while no vehicle dataset is loaded: the sentence, then the way that works. */
.vpanel__closed {
    display: grid;
    justify-items: start;
    gap: var(--sp-8);
}

.vpanel__miss {
    display: grid;
    gap: var(--sp-4);
    justify-items: start;
}

.vpanel__miss .link {
    min-height: 44px;
}

.vpanel__zero > div,
.vpanel__notify {
    display: grid;
    gap: var(--sp-12);
}

.vpanel__garage {
    display: grid;
    gap: var(--sp-8);
    padding-top: var(--sp-4);
}

/* Feld K's range beside the name, quieter: what tells two halves of one car apart. */
/* Quieter than the name, never darker (a disabled chip's name is --c-ink-3), and never broken inside. */
.vpanel__chip-range {
    color: var(--c-ink-2);
    font-weight: 400;
    white-space: nowrap;
}

.chip:disabled .vpanel__chip-range,
.chip[aria-pressed='true'] .vpanel__chip-range {
    color: inherit;
}

/* Name and range on two lines where the row is narrow, never squeezed into each other. */
.chip:has(.vpanel__chip-range) {
    flex-wrap: wrap;
    justify-content: flex-start;
    row-gap: 0;
    column-gap: var(--sp-4);
    padding-block: var(--sp-4);
    text-align: start;
}

.vpanel__doc-toggle {
    margin-bottom: var(--sp-16);
}

.vpanel__doc {
    margin-bottom: var(--sp-16);
    overflow-x: auto;
}
</style>
