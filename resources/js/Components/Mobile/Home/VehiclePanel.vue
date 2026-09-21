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
import { decimal } from '../../../format'
import { useShared } from '../../../composables/useShared'
import { cleanHsn, cleanTsn, HSN_LENGTH, TSN_LENGTH, useVehiclePicker, type VariantRow } from '../../../composables/mobile/useVehiclePicker'
import type { DocVariant } from '../../../art'
import type { LookupResult, MakeOption } from '../../../types/pages'
import type { GarageVehicle } from '../../../types/rimify'

const props = withDefaults(
    defineProps<{
        makes: MakeOption[]
        /** F1 for the chosen vehicle (`fitmentCount.count`); null without one or while unknown. */
        total?: number | null
        garage?: GarageVehicle[]
    }>(),
    { total: null, garage: () => [] }
)

const shared = useShared()
const page = usePage<{ lookup?: LookupResult | null }>()
const vehicle = computed(() => shared.value.vehicle)
const contact = computed(() => shared.value.contact)
const lookup = computed(() => page.props.lookup ?? null)

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

function onHsn(event: Event): void {
    const value = cleanHsn((event.target as HTMLInputElement).value)
    picker.hsn.value = value
    hsnError.value = ''

    if (value.length === HSN_LENGTH) {
        tsnField.value?.focus()
    }
}

function onTsn(event: Event): void {
    picker.tsn.value = cleanTsn((event.target as HTMLInputElement).value)
    tsnError.value = ''
}

function validateHsn(): void {
    hsnError.value = picker.hsn.value !== '' && !/^\d{4}$/.test(picker.hsn.value) ? 'Die HSN hat vier Ziffern.' : ''
}

function validateTsn(): void {
    tsnError.value = picker.tsn.value !== '' && picker.tsn.value.length !== TSN_LENGTH ? 'Die TSN hat drei Zeichen.' : ''
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
    const parts = [v.variant, power, v.buildWindow].filter((p): p is string => p !== null && p !== '')

    return `${parts.join(' · ')}${v.needsReview ? ' (unvollständige Daten)' : ''}`
}

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
        return 'Keine Felgen für dieses Fahrzeug'
    }

    if (count.value.status === 'ready') {
        return `${decimal(count.value.count, 0)} passende Felgen anzeigen`
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

function submit(): void {
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
 * field; anything else is the honest line with the phone number.
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
        <p class="small num muted">{{ vehicle.keyNumbers }} · {{ vehicle.buildWindow }}</p>
        <p v-if="totalLabel !== null" class="small num vpanel__count">
            <strong>{{ totalLabel }}</strong> Felgen mit Gutachten für {{ vehicle.label }}
        </p>
        <Link href="/felgen" class="btn btn--primary btn--lg btn--block vpanel__go" data-primary prefetch>
            {{ totalLabel !== null ? `${totalLabel} passende Felgen anzeigen` : 'Passende Felgen anzeigen' }}
        </Link>
        <div class="vpanel__links">
            <Link href="/felgen-suchen" class="link">Fahrzeug ändern</Link>
            <button class="link" type="button" @click="removeVehicle">Fahrzeug entfernen</button>
        </div>
    </div>

    <div v-else class="vpanel">
        <!-- The camera, above everything: the fastest route for anyone holding their papers. -->
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

        <div class="tabs__list" role="tablist" aria-label="Fahrzeug wählen">
            <button
                :id="`${uid}-tab-guided`"
                class="tabs__trigger"
                type="button"
                role="tab"
                :aria-selected="picker.route.value === 'guided'"
                :aria-controls="`${uid}-panel-guided`"
                :data-state="picker.route.value === 'guided' ? 'active' : 'inactive'"
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
                :aria-controls="`${uid}-panel-keys`"
                :data-state="picker.route.value === 'keys' ? 'active' : 'inactive'"
                @click="picker.route.value = 'keys'"
            >
                HSN/TSN
            </button>
        </div>

        <!-- Route one: three native selects, so the OS picker opens. Both panels stay in the DOM
             (`v-show`): a tab switch then hides one and shows the other instead of rebuilding fields. -->
        <div v-show="picker.route.value === 'guided'" :id="`${uid}-panel-guided`" class="vpanel__fields" role="tabpanel" :aria-labelledby="`${uid}-tab-guided`">
            <div class="form-field">
                <label class="form-field__label" :for="`${uid}-marke`">Marke</label>
                <select :id="`${uid}-marke`" v-model="picker.make.value" class="input" autocomplete="off">
                    <option value="">z. B. BMW</option>
                    <option v-for="m in makes" :key="m.make" :value="m.make">{{ m.make }}</option>
                </select>
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
                    <option v-for="v in picker.variants.value" :key="v.id" :value="v.id" :disabled="v.needsReview">{{ variantLabel(v) }}</option>
                </select>
                <p v-if="picker.variantsFailed.value" class="form-field__error">Die Varianten lassen sich gerade nicht laden.</p>
            </div>
        </div>

        <!-- Route two: the key numbers off the Zulassungsbescheinigung. -->
        <div v-show="picker.route.value === 'keys'" :id="`${uid}-panel-keys`" class="vpanel__fields" role="tabpanel" :aria-labelledby="`${uid}-tab-keys`">
            <div class="vpanel__keys">
                <div class="form-field">
                    <label class="form-field__label" :for="`${uid}-hsn`">HSN (Feld 2.1)</label>
                    <input
                        :id="`${uid}-hsn`"
                        ref="hsnField"
                        class="input input--code num"
                        type="text"
                        inputmode="numeric"
                        :maxlength="HSN_LENGTH"
                        autocomplete="off"
                        enterkeyhint="next"
                        :value="picker.hsn.value"
                        :aria-invalid="hsnError ? 'true' : undefined"
                        :aria-describedby="`${uid}-keys-error`"
                        @input="onHsn"
                        @blur="validateHsn"
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
                    <p>Zu {{ picker.hsn.value || lookup?.hsn }}/{{ picker.tsn.value || lookup?.tsn }} haben wir kein Fahrzeug gefunden.</p>
                    <button class="link" type="button" @click="focusHsn">Nochmal prüfen</button>
                    <button class="link" type="button" @click="picker.route.value = 'guided'">Über Marke &amp; Modell wählen</button>
                    <a class="link num" :href="`tel:${contact.phoneIntl.replace(/\s/g, '')}`">Anrufen: {{ contact.phone }}</a>
                </div>
            </div>
        </div>

        <!-- The live count (F1). -->
        <div class="vpanel__count" aria-live="polite">
            <Skeleton v-if="count.status === 'loading'" width="60%" height="var(--lh-small)" />
            <p v-else-if="count.status === 'failed'" class="small muted">Die Anzahl lässt sich gerade nicht laden.</p>
            <p v-else-if="count.status === 'ready' && count.count > 0" class="small num">
                <strong>{{ decimal(count.count, 0) }}</strong> Felgen mit Gutachten für {{ count.vehicle.label }}
            </p>

            <!-- Zero wheels (F2): said plainly, with the one thing we can offer. -->
            <div v-else-if="zero" class="notice vpanel__zero">
                <div>
                    <p>Für dieses Fahrzeug haben wir noch keine Felge mit Gutachten.</p>
                    <template v-if="notifyState === 'done'">
                        <p class="small muted">Danke. Bestätige bitte den Link in der E-Mail, die wir dir gerade geschickt haben.</p>
                    </template>
                    <form v-else class="vpanel__notify" @submit.prevent="notify">
                        <p class="small muted">Sag uns deine E-Mail-Adresse – wir melden uns, sobald ein Gutachten dein Fahrzeug nennt.</p>
                        <div class="form-field">
                            <label class="form-field__label" :for="`${uid}-mail`">E-Mail-Adresse</label>
                            <input :id="`${uid}-mail`" v-model="notifyEmail" class="input" type="email" autocomplete="email" inputmode="email" enterkeyhint="send" required>
                            <p class="form-field__error">
                                <template v-if="notifyState === 'failed'">{{ notifyError || `Das hat nicht geklappt. Versuch es bitte noch einmal oder ruf uns an: ${contact.phone}.` }}</template>
                            </p>
                        </div>
                        <button class="btn btn--secondary btn--block" type="submit" :aria-busy="notifyState === 'busy' ? 'true' : undefined">Bescheid geben</button>
                        <p class="micro quiet">Du bekommst zuerst eine Bestätigungsmail. Abmelden geht jederzeit mit einem Klick.</p>
                    </form>
                </div>
            </div>
        </div>

        <button
            class="btn btn--primary btn--lg btn--block vpanel__go"
            type="button"
            data-primary
            :disabled="!canSubmit || submitting"
            :aria-busy="submitting ? 'true' : undefined"
            @click="submit"
        >
            {{ buttonLabel }}
        </button>

        <!-- Saved vehicles (F7). -->
        <div v-if="garage.length" class="vpanel__garage">
            <span class="label">Zuletzt gewählt:</span>
            <div class="chip-row">
                <button v-for="entry in garage" :key="entry.id" class="chip m-press" type="button" :aria-label="entry.label" @click="pick(entry.id)">{{ entry.short }}</button>
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

.vpanel__doc-toggle {
    margin-bottom: var(--sp-16);
}

.vpanel__doc {
    margin-bottom: var(--sp-16);
    overflow-x: auto;
}
</style>
