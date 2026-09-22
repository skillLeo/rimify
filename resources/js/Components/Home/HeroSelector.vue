<script setup lang="ts">
/**
 * H2 — the vehicle selector in the hero panel (desktop document, ≥ 768).
 *
 * Three ways in, as three tabs: Marke → Modell → Fahrzeug through type-to-filter comboboxes, the
 * two key numbers off the Zulassungsbescheinigung, and a photo of that document read on the
 * customer's own device. Whichever way, the panel shows — before anything is submitted — how many
 * wheels carry a Gutachten for the car (F1), and the primary button repeats that number.
 *
 * Three outcomes of the key-number route, none a dead end (R-09): one match writes the vehicle;
 * several matches come back from the server as a chooser (R-01: never guessed, no flag turns that
 * off); no match keeps what was typed and offers three routes forward.
 *
 * With a vehicle already chosen, the panel names it and leads to the listing.
 */

import { Link, router, useForm, usePage } from '@inertiajs/vue3'
import {
    ComboboxAnchor,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxRoot,
    ComboboxViewport,
    PopoverContent,
    PopoverPortal,
    PopoverRoot,
    PopoverTrigger,
    TabsContent,
    TabsList,
    TabsRoot,
    TabsTrigger,
} from 'reka-ui'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, useId, watch } from 'vue'
import DocFacsimile from '../Art/DocFacsimile.vue'
import Skeleton from '../Ui/Skeleton.vue'
import DocumentScan from './DocumentScan.vue'
import type { DocVariant } from '../../art'
import { useFitmentCount, type FitmentCountQuery } from '../../composables/useFitmentCount'
import { withUnit } from '../../format'
import { cleanHsn, cleanTsn, isHsn, isTsn } from '../../lib/fahrzeugschein'
import type { LookupResult, MakeOption, ModelOption, VariantOption } from '../../types/pages'
import type { SharedProps } from '../../types/rimify'

const props = defineProps<{
    selector: { makes: MakeOption[] }
}>()

type Tab = 'marke' | 'hsn' | 'scan'

const HSN_ERROR = 'Die HSN hat vier Ziffern.'
const TSN_ERROR = 'Die TSN hat drei Zeichen.'
const SCAN_FAILED = 'Wir konnten HSN und TSN nicht lesen. Trag sie bitte von Hand ein.'
const KW_PER_PS = 0.73549875

const page = usePage<SharedProps & { lookup?: LookupResult | null }>()
const vehicle = computed(() => page.props.vehicle)
const contact = computed(() => page.props.contact)
const garage = computed(() => (page.props.garage ?? []).filter((g) => g.id !== vehicle.value?.id))
/*
 * The third way forward (R-09) and the line under a failed request: the phone when the client has
 * given one, otherwise the e-mail — the same route either way, never an invented number.
 */
const reach = computed(() => {
    const phone = contact.value?.phone ?? null
    const email = contact.value?.email ?? ''

    return phone
        ? { href: `tel:${(contact.value?.phoneIntl ?? phone).replace(/\s/g, '')}`, label: `Anrufen: ${phone}`, sentence: `ruf uns an: ${phone}` }
        : { href: `mailto:${email}`, label: `Schreib uns: ${email}`, sentence: `schreib uns: ${email}` }
})

const id = useId()
const tab = ref<Tab>('marke')

/* ── Marke → Modell → Fahrzeug ───────────────────────────────────────────────── */

const make = ref<string | undefined>(undefined)
const model = ref<string | undefined>(undefined)
const variantId = ref<number | undefined>(undefined)
const models = ref<ModelOption[]>([])
const variants = ref<VariantOption[]>([])
const modelsLoading = ref(false)
const variantsLoading = ref(false)
const treeFailed = ref(false)
const modelOpen = ref(false)

let treeController: AbortController | undefined
let treeSequence = 0

async function fetchTree<T>(path: string, params: Record<string, string>, read: (json: unknown) => T): Promise<T | null> {
    treeController?.abort()
    treeController = new AbortController()
    const mine = ++treeSequence
    treeFailed.value = false

    try {
        const response = await fetch(`${path}?${new URLSearchParams(params).toString()}`, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
            signal: treeController.signal,
        })

        if (mine !== treeSequence) {
            return null
        }

        if (!response.ok) {
            treeFailed.value = true

            return null
        }

        return read(await response.json())
    } catch (error) {
        if ((error as { name?: string }).name !== 'AbortError' && mine === treeSequence) {
            treeFailed.value = true
        }

        return null
    }
}

watch(make, async (value) => {
    model.value = undefined
    variantId.value = undefined
    models.value = []
    variants.value = []

    if (value === undefined) {
        return
    }

    modelsLoading.value = true
    const list = await fetchTree('/api/v1/vehicles/models', { marke: value }, (json) => (json as { models: ModelOption[] }).models)
    modelsLoading.value = false

    if (list !== null) {
        models.value = list
        // The next step opens by itself: one choice made, the next list already showing.
        await nextTick()
        modelOpen.value = true
    }
})

watch(model, async (value) => {
    variantId.value = undefined
    variants.value = []

    if (value === undefined || make.value === undefined) {
        return
    }

    variantsLoading.value = true
    const list = await fetchTree(
        '/api/v1/vehicles/variants',
        { marke: make.value, modell: value },
        (json) => (json as { variants: VariantOption[] }).variants
    )
    variantsLoading.value = false

    if (list !== null) {
        variants.value = list
    }
})

/** `320i · 125 kW · 09/2001–02/2005`; an incomplete row says so (R-03). */
function variantLabel(v: VariantOption): string {
    const parts = [v.variant]

    if (v.powerPs !== null) {
        parts.push(withUnit(Math.round(v.powerPs * KW_PER_PS), 'kW'))
    }

    if (v.buildWindow !== '') {
        parts.push(v.buildWindow)
    }

    return parts.join(' · ') + (v.needsReview ? ' (unvollständige Daten)' : '')
}

function variantDisplay(value: unknown): string {
    const found = variants.value.find((v) => v.id === value)

    return found === undefined ? '' : variantLabel(found)
}

function stringDisplay(value: unknown): string {
    return typeof value === 'string' ? value : ''
}

/* ── HSN / TSN ───────────────────────────────────────────────────────────────── */

const hsn = ref('')
const tsn = ref('')
const hsnError = ref<string | null>(null)
const tsnError = ref<string | null>(null)
const scanFailed = ref(false)
const hsnField = ref<HTMLInputElement | null>(null)
const tsnField = ref<HTMLInputElement | null>(null)
const helpOpen = ref(false)
const doc = ref<DocVariant>('neu')

function onHsn(event: Event): void {
    hsn.value = cleanHsn((event.target as HTMLInputElement).value)
    hsnError.value = null
    scanFailed.value = false

    if (hsn.value.length === 4) {
        tsnField.value?.focus()
    }
}

function onTsn(event: Event): void {
    tsn.value = cleanTsn((event.target as HTMLInputElement).value)
    tsnError.value = null
    scanFailed.value = false
}

/** A pasted `0005 582` fills both fields; spaces never reach a field. */
function onHsnPaste(event: ClipboardEvent): void {
    const all = (event.clipboardData?.getData('text') ?? '').replace(/\s+/g, '')
    hsn.value = cleanHsn(all)
    hsnError.value = null
    scanFailed.value = false

    if (all.length > 4) {
        tsn.value = cleanTsn(all.slice(4))
        tsnError.value = null
        tsnField.value?.focus()
    }
}

function onTsnPaste(event: ClipboardEvent): void {
    tsn.value = cleanTsn(event.clipboardData?.getData('text') ?? '')
    tsnError.value = null
    scanFailed.value = false
}

function validateHsn(): boolean {
    hsnError.value = hsn.value === '' || isHsn(hsn.value) ? null : HSN_ERROR

    return hsnError.value === null
}

function validateTsn(): boolean {
    tsnError.value = tsn.value === '' || isTsn(tsn.value) ? null : TSN_ERROR

    return tsnError.value === null
}

const keysValid = computed(() => isHsn(hsn.value) && isTsn(tsn.value))

/* ── The scan (F5) ───────────────────────────────────────────────────────────── */

async function onScan(value: { hsn: string; tsn: string }): Promise<void> {
    hsn.value = value.hsn
    tsn.value = value.tsn
    hsnError.value = null
    tsnError.value = null
    scanFailed.value = false
    tab.value = 'hsn'
    await nextTick()
    hsnField.value?.focus()
}

async function onScanFailed(): Promise<void> {
    scanFailed.value = true
    tab.value = 'hsn'
    await nextTick()
    hsnField.value?.focus()
}

/* ── The live count (F1) ─────────────────────────────────────────────────────── */

const count = useFitmentCount()

const selection = computed<FitmentCountQuery | null>(() => {
    if (vehicle.value !== null) {
        return { fahrzeug: vehicle.value.id }
    }

    if (tab.value === 'marke') {
        return variantId.value === undefined ? null : { fahrzeug: variantId.value }
    }

    if (tab.value === 'hsn') {
        return keysValid.value ? { hsn: hsn.value, tsn: tsn.value } : null
    }

    return null
})

watch(
    () => JSON.stringify(selection.value),
    () => {
        if (selection.value === null) {
            count.clear()
        } else {
            count.run(selection.value)
        }
    }
)

onMounted(() => {
    if (selection.value !== null) {
        count.run(selection.value)
    }
})

const counted = computed(() => {
    const result = count.result.value

    return result !== null && result.vehicle !== null ? result : null
})

/** F2: the car is known and no published document names it. */
const zero = computed(() => counted.value !== null && counted.value.count === 0)

const buttonLabel = computed(() => {
    if (selection.value === null) {
        return 'Fahrzeug wählen'
    }

    if (zero.value) {
        return 'Keine Felgen für dieses Fahrzeug'
    }

    if (counted.value !== null && counted.value.count > 0) {
        return `${counted.value.count} passende Felgen anzeigen`
    }

    return 'Passende Felgen anzeigen'
})

/* ── Submitting ──────────────────────────────────────────────────────────────── */

const choice = useForm({ fahrzeug: 0 })
const keys = useForm({ hsn: '', tsn: '' })
const pending = computed(() => choice.processing || keys.processing)

function choose(vehicleId: number): void {
    choice.fahrzeug = vehicleId
    choice.post('/fahrzeug', { preserveScroll: true })
}

function submit(): void {
    // A pair the server has just answered "not found" is not looked up again: the three routes are the actions.
    if (pending.value || selection.value === null || zero.value || notFound.value) {
        return
    }

    if ('fahrzeug' in selection.value) {
        choose(selection.value.fahrzeug)

        return
    }

    if (!validateHsn() || !validateTsn()) {
        return
    }

    keys.hsn = hsn.value
    keys.tsn = tsn.value
    keys.post('/fahrzeug/schluesselnummern', { preserveScroll: true })
}

function remove(): void {
    router.delete('/fahrzeug', { preserveScroll: true })
}

/* ── The server's answer to a key-number lookup ──────────────────────────────── */

const lookupDismissed = ref(false)
const lookup = computed(() => (lookupDismissed.value ? null : (page.props.lookup ?? null)))
const candidate = ref<number | null>(null)

watch(
    lookup,
    (value) => {
        if (value === null) {
            return
        }

        // The typed values stay on screen, whatever the answer was.
        hsn.value = value.hsn
        tsn.value = value.tsn
        hsnError.value = null
        tsnError.value = null
        candidate.value = null
        tab.value = 'hsn'
    },
    { immediate: true }
)

const chooser = computed(() =>
    lookup.value?.status === 'ambiguous' && lookup.value.distinction !== undefined ? lookup.value.distinction : null
)

/*
 * The pair the server has just answered "not found" — regardless of whether the notice was
 * dismissed. Looking it up again would only produce the same answer, so the primary stays disabled
 * until the HSN or the TSN changes; the three routes are the actions (R-09).
 */
const answered = computed(() => page.props.lookup ?? null)
const notFound = computed(
    () => answered.value?.status === 'not_found' && hsn.value === answered.value.hsn && tsn.value === answered.value.tsn
)

/** `Höchstgeschwindigkeit 280 km/h · Achslast vorn 1.160 kg · VSN 123`: what differs, and only that. */
function candidateFacts(row: { vsn: string | null; values: Record<string, string> }): string {
    if (chooser.value === null) {
        return ''
    }

    const facts = chooser.value.attributes.map((a) => `${chooser.value?.labels[a] ?? a} ${row.values[a] ?? ''}`.trim())

    if (row.vsn !== null && row.vsn !== '') {
        facts.push(`VSN ${row.vsn}`)
    }

    return facts.join(' · ')
}

function chooseCandidate(): void {
    if (candidate.value !== null) {
        choose(candidate.value)
    }
}

async function otherNumbers(): Promise<void> {
    lookupDismissed.value = true
    await nextTick()
    hsnField.value?.focus()
}

async function checkAgain(): Promise<void> {
    lookupDismissed.value = true
    await nextTick()
    hsnField.value?.focus()
    hsnField.value?.select()
}

async function viaMake(): Promise<void> {
    lookupDismissed.value = true
    tab.value = 'marke'
}

/* ── F2: tell me when a Gutachten names my car ───────────────────────────────── */

const notify = reactive({
    email: '',
    state: 'idle' as 'idle' | 'sending' | 'sent' | 'error',
    error: null as string | null,
})

function xsrfToken(): string {
    const match = /(?:^|;\s*)XSRF-TOKEN=([^;]+)/.exec(document.cookie)

    return match?.[1] === undefined ? '' : decodeURIComponent(match[1])
}

async function sendNotify(): Promise<void> {
    if (notify.state === 'sending' || counted.value === null) {
        return
    }

    notify.state = 'sending'
    notify.error = null

    try {
        const response = await fetch('/api/v1/fitment/notify', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN': xsrfToken(),
            },
            credentials: 'same-origin',
            body: JSON.stringify({ email: notify.email.trim(), fahrzeug: counted.value.vehicle?.id }),
        })

        if (response.status === 202) {
            notify.state = 'sent'

            return
        }

        if (response.status === 422) {
            const body = (await response.json()) as { errors?: Record<string, string[]> }
            notify.error = body.errors?.email?.[0] ?? body.errors?.fahrzeug?.[0] ?? generalError()
            notify.state = 'error'

            return
        }

        notify.error = generalError()
        notify.state = 'error'
    } catch {
        notify.error = generalError()
        notify.state = 'error'
    }
}

function generalError(): string {
    return `Das hat nicht geklappt. Versuch es bitte noch einmal oder ${reach.value.sentence}.`
}

onBeforeUnmount(() => treeController?.abort())
</script>

<template>
    <!-- With a vehicle: the panel names it and leads on. No selector fields. -->
    <div v-if="vehicle" class="sel sel--vehicle">
        <p class="label">Dein Fahrzeug</p>
        <p class="h3 sel__vehicle">{{ vehicle.label }}</p>
        <p class="small num muted">{{ vehicle.keyNumbers }} · {{ vehicle.buildWindow }}</p>

        <p class="small num muted sel__count" aria-live="polite">
            <Skeleton v-if="count.loading.value" width="60%" height="var(--lh-small)" />
            <template v-else-if="count.failed.value">Die Anzahl lässt sich gerade nicht laden.</template>
            <template v-else-if="counted && counted.count > 0">
                <strong class="sel__n">{{ counted.count }}</strong> Felgen mit Gutachten für {{ vehicle.label }}
            </template>
        </p>

        <Link href="/felgen" class="btn btn--primary btn--lg btn--block sel__go" prefetch>
            {{ counted && counted.count > 0 ? `${counted.count} passende Felgen anzeigen` : 'Passende Felgen anzeigen' }}
        </Link>

        <div class="sel__vehicle-links">
            <Link href="/felgen-suchen" class="link">Fahrzeug ändern</Link>
            <button class="link" type="button" @click="remove">Fahrzeug entfernen</button>
        </div>

        <div v-if="garage.length" class="sel__garage">
            <p class="label">Zuletzt gewählt:</p>
            <div class="chip-row">
                <button v-for="g in garage" :key="g.id" class="chip" type="button" :disabled="pending" @click="choose(g.id)">
                    {{ g.short }}
                </button>
            </div>
        </div>
    </div>

    <form v-else class="sel" novalidate @submit.prevent="submit">
        <fieldset class="sel__fields" :disabled="pending">
            <TabsRoot v-model="tab" class="tabs">
                <TabsList class="tabs__list" aria-label="Fahrzeug angeben">
                    <TabsTrigger value="marke" class="tabs__trigger">Marke &amp; Modell</TabsTrigger>
                    <TabsTrigger value="hsn" class="tabs__trigger">HSN/TSN</TabsTrigger>
                    <TabsTrigger value="scan" class="tabs__trigger">Fahrzeugschein scannen</TabsTrigger>
                </TabsList>

                <!-- Marke → Modell → Fahrzeug -->
                <TabsContent value="marke" class="tabs__content">
                    <div class="sel__row sel__row--pair">
                        <div class="form-field">
                            <label class="form-field__label" :for="`${id}-marke`">Marke</label>
                            <ComboboxRoot v-model="make" class="sel__combo" open-on-click>
                                <ComboboxAnchor class="sel__anchor">
                                    <ComboboxInput
                                        :id="`${id}-marke`"
                                        class="input"
                                        placeholder="z. B. BMW"
                                        autocapitalize="off"
                                        spellcheck="false"
                                        :display-value="stringDisplay"
                                    />
                                </ComboboxAnchor>
                                <ComboboxContent class="popover sel__list" aria-label="Marken">
                                    <ComboboxViewport class="sel__viewport">
                                        <ComboboxEmpty class="sel__empty small muted">Keine Marke gefunden.</ComboboxEmpty>
                                        <ComboboxItem
                                            v-for="m in props.selector.makes"
                                            :key="m.make"
                                            :value="m.make"
                                            :text-value="m.make"
                                            class="menu__item sel__item"
                                        >
                                            <span>{{ m.make }}</span> <span class="small quiet num">{{ m.models }} Modelle</span>
                                        </ComboboxItem>
                                    </ComboboxViewport>
                                </ComboboxContent>
                            </ComboboxRoot>
                        </div>

                        <div class="form-field">
                            <label class="form-field__label" :for="`${id}-modell`">Modell</label>
                            <ComboboxRoot
                                v-model="model"
                                v-model:open="modelOpen"
                                class="sel__combo"
                                :disabled="make === undefined || modelsLoading"
                                open-on-click
                            >
                                <ComboboxAnchor class="sel__anchor">
                                    <ComboboxInput
                                        :id="`${id}-modell`"
                                        class="input"
                                        placeholder="z. B. 3er Coupé"
                                        autocapitalize="off"
                                        spellcheck="false"
                                        :disabled="make === undefined || modelsLoading"
                                        :display-value="stringDisplay"
                                    />
                                </ComboboxAnchor>
                                <ComboboxContent class="popover sel__list" aria-label="Modelle">
                                    <ComboboxViewport class="sel__viewport">
                                        <ComboboxEmpty class="sel__empty small muted">Kein Modell gefunden.</ComboboxEmpty>
                                        <ComboboxItem
                                            v-for="m in models"
                                            :key="m.model"
                                            :value="m.model"
                                            :text-value="m.model"
                                            class="menu__item sel__item"
                                        >
                                            <span>{{ m.model }}</span> <span class="small quiet num">{{ m.variants }} Varianten</span>
                                        </ComboboxItem>
                                    </ComboboxViewport>
                                </ComboboxContent>
                            </ComboboxRoot>
                        </div>
                    </div>

                    <div class="sel__row">
                        <div class="form-field">
                            <label class="form-field__label" :for="`${id}-fahrzeug`">Fahrzeug</label>
                            <ComboboxRoot
                                v-model="variantId"
                                class="sel__combo"
                                :disabled="model === undefined || variantsLoading"
                                open-on-click
                            >
                                <ComboboxAnchor class="sel__anchor">
                                    <ComboboxInput
                                        :id="`${id}-fahrzeug`"
                                        class="input"
                                        placeholder="Variante, Baujahr, kW"
                                        autocapitalize="off"
                                        spellcheck="false"
                                        :disabled="model === undefined || variantsLoading"
                                        :display-value="variantDisplay"
                                    />
                                </ComboboxAnchor>
                                <ComboboxContent class="popover sel__list" aria-label="Fahrzeuge">
                                    <ComboboxViewport class="sel__viewport">
                                        <ComboboxEmpty class="sel__empty small muted">Kein Fahrzeug gefunden.</ComboboxEmpty>
                                        <ComboboxItem
                                            v-for="v in variants"
                                            :key="v.id"
                                            :value="v.id"
                                            :text-value="variantLabel(v)"
                                            :disabled="v.needsReview"
                                            :aria-disabled="v.needsReview ? 'true' : undefined"
                                            class="menu__item sel__item num"
                                        >
                                            {{ variantLabel(v) }}
                                        </ComboboxItem>
                                    </ComboboxViewport>
                                </ComboboxContent>
                            </ComboboxRoot>
                        </div>
                    </div>

                    <p v-if="treeFailed" class="small muted sel__tree-failed" role="status">
                        Die Liste lässt sich gerade nicht laden. Versuch es bitte noch einmal oder nutze die HSN/TSN.
                    </p>
                </TabsContent>

                <!-- HSN / TSN -->
                <TabsContent value="hsn" class="tabs__content">
                    <!-- Several cars behind one pair of key numbers: a confirmation, never a guess (R-01). -->
                    <div v-if="chooser && lookup" class="sel__chooser">
                        <p class="h4">{{ chooser.rows.length }} Fahrzeuge passen zu {{ lookup.hsn }}/{{ lookup.tsn }} – welches ist deins?</p>

                        <p v-if="chooser.indistinguishable" class="small muted">
                            Die Fahrzeuge unterscheiden sich in keinem Feld, das wir anzeigen können. Die VSN aus
                            deiner Zulassungsbescheinigung hilft weiter.
                        </p>

                        <div class="sel__candidates" role="radiogroup" :aria-label="`Fahrzeuge zu ${lookup.hsn}/${lookup.tsn}`">
                            <label v-for="row in chooser.rows" :key="row.id" class="check sel__candidate">
                                <input v-model="candidate" type="radio" :name="`${id}-kandidat`" :value="row.id" />
                                <span class="sel__candidate-text">
                                    <span>{{ row.label }}</span>
                                    <span class="small num muted">{{ candidateFacts(row) }}</span>
                                </span>
                            </label>
                        </div>

                        <div class="sel__chooser-actions">
                            <button
                                class="btn btn--secondary"
                                type="button"
                                :disabled="candidate === null || pending"
                                :aria-busy="pending ? 'true' : undefined"
                                @click="chooseCandidate"
                            >
                                Dieses Fahrzeug wählen
                            </button>
                            <button class="link" type="button" @click="otherNumbers">Andere Nummern eingeben</button>
                        </div>
                    </div>

                    <template v-else>
                        <p v-if="scanFailed" class="notice sel__notice" role="alert">{{ SCAN_FAILED }}</p>

                        <div class="sel__keys">
                            <div class="form-field">
                                <label class="form-field__label" :for="`${id}-hsn`">HSN (Feld 2.1)</label>
                                <input
                                    :id="`${id}-hsn`"
                                    ref="hsnField"
                                    class="input input--code"
                                    :value="hsn"
                                    inputmode="numeric"
                                    maxlength="4"
                                    autocomplete="off"
                                    enterkeyhint="next"
                                    :aria-invalid="hsnError || keys.errors.hsn ? 'true' : undefined"
                                    :aria-describedby="`${id}-hsn-error`"
                                    @input="onHsn"
                                    @paste.prevent="onHsnPaste"
                                    @blur="validateHsn"
                                />
                                <p :id="`${id}-hsn-error`" class="form-field__error">{{ hsnError ?? keys.errors.hsn ?? '' }}</p>
                            </div>
                            <div class="form-field">
                                <label class="form-field__label" :for="`${id}-tsn`">TSN (Feld 2.2)</label>
                                <input
                                    :id="`${id}-tsn`"
                                    ref="tsnField"
                                    class="input input--code"
                                    :value="tsn"
                                    maxlength="3"
                                    autocapitalize="characters"
                                    autocomplete="off"
                                    enterkeyhint="go"
                                    :aria-invalid="tsnError || keys.errors.tsn ? 'true' : undefined"
                                    :aria-describedby="`${id}-tsn-error`"
                                    @input="onTsn"
                                    @paste.prevent="onTsnPaste"
                                    @blur="validateTsn"
                                />
                                <p :id="`${id}-tsn-error`" class="form-field__error">{{ tsnError ?? keys.errors.tsn ?? '' }}</p>
                            </div>
                        </div>

                        <PopoverRoot v-model:open="helpOpen">
                            <PopoverTrigger class="link small sel__help" type="button">Wo finde ich HSN und TSN?</PopoverTrigger>
                            <PopoverPortal>
                                <PopoverContent
                                    class="popover popover--padded sel__doc"
                                    side="bottom"
                                    align="start"
                                    :side-offset="8"
                                    :collision-padding="16"
                                    aria-label="Wo finde ich HSN und TSN?"
                                >
                                    <div class="chip-row" role="group" aria-label="Dokument">
                                        <button class="chip" type="button" :aria-pressed="doc === 'neu'" @click="doc = 'neu'">
                                            Neue Zulassungsbescheinigung
                                        </button>
                                        <button class="chip" type="button" :aria-pressed="doc === 'alt'" @click="doc = 'alt'">
                                            Alter Fahrzeugschein
                                        </button>
                                    </div>
                                    <DocFacsimile
                                        :variant="doc"
                                        :width="480"
                                        :title="doc === 'neu' ? 'Zulassungsbescheinigung Teil I mit den Feldern 2.1 und 2.2' : 'Alter Fahrzeugschein mit den Feldern 2 und 3'"
                                    />
                                    <p class="small muted sel__doc-text">
                                        Die HSN steht in Feld 2.1, die TSN sind die ersten drei Zeichen von Feld 2.2 deiner
                                        Zulassungsbescheinigung Teil I.
                                    </p>
                                </PopoverContent>
                            </PopoverPortal>
                        </PopoverRoot>

                        <!-- No match: what was typed stays, and three ways forward (R-09). -->
                        <div v-if="notFound && lookup" class="notice sel__notice sel__notfound" role="status">
                            <div>
                                <p>Zu {{ lookup.hsn }}/{{ lookup.tsn }} haben wir kein Fahrzeug gefunden.</p>
                                <ul class="sel__routes">
                                    <li><button class="link" type="button" @click="checkAgain">Nochmal prüfen</button></li>
                                    <li><button class="link" type="button" @click="viaMake">Über Marke &amp; Modell wählen</button></li>
                                    <li><a class="link" :href="reach.href">{{ reach.label }}</a></li>
                                </ul>
                            </div>
                        </div>
                    </template>
                </TabsContent>

                <!-- The photo, read on the customer's device -->
                <TabsContent value="scan" class="tabs__content">
                    <DocumentScan @confirm="onScan" @failed="onScanFailed" />
                </TabsContent>
            </TabsRoot>

            <!-- F2: the car is known and no document names it — in place of the count line. -->
            <div v-if="chooser" class="sel__count" aria-hidden="true" />

            <div v-else-if="zero && counted" class="notice sel__zero">
                <div class="sel__zero-body">
                    <p>Für dieses Fahrzeug haben wir noch keine Felge mit Gutachten.</p>
                    <!-- Only where outgoing mail is configured: otherwise the confirmation would never arrive (F2). -->
                    <p v-if="page.props.notifyByMail !== true">
                        Schreib uns gern eine E-Mail an <a class="link" :href="`mailto:${contact?.email}`">{{ contact?.email }}</a>.
                    </p>
                    <template v-else-if="notify.state !== 'sent'">
                        <p>Sag uns deine E-Mail-Adresse – wir melden uns, sobald ein Gutachten dein Fahrzeug nennt.</p>
                        <div class="form-field">
                            <label class="form-field__label" :for="`${id}-email`">E-Mail-Adresse</label>
                            <input
                                :id="`${id}-email`"
                                v-model="notify.email"
                                class="input"
                                type="email"
                                autocomplete="email"
                                :aria-invalid="notify.state === 'error' ? 'true' : undefined"
                                :aria-describedby="`${id}-email-error`"
                                @keydown.enter.prevent="sendNotify"
                            />
                            <p :id="`${id}-email-error`" class="form-field__error">{{ notify.error ?? '' }}</p>
                        </div>
                        <button
                            class="btn btn--secondary"
                            type="button"
                            :aria-busy="notify.state === 'sending' ? 'true' : undefined"
                            :disabled="notify.state === 'sending'"
                            @click="sendNotify"
                        >
                            Bescheid geben
                        </button>
                        <p class="micro quiet">Du bekommst zuerst eine Bestätigungsmail. Abmelden geht jederzeit mit einem Klick.</p>
                    </template>
                    <p v-else role="status">Danke. Bestätige bitte den Link in der E-Mail, die wir dir gerade geschickt haben.</p>
                </div>
            </div>

            <p v-else class="small num muted sel__count" aria-live="polite">
                <Skeleton v-if="count.loading.value" width="60%" height="var(--lh-small)" />
                <template v-else-if="count.failed.value">Die Anzahl lässt sich gerade nicht laden.</template>
                <template v-else-if="counted && counted.count > 0">
                    <strong class="sel__n">{{ counted.count }}</strong> Felgen mit Gutachten für {{ counted.vehicle?.label }}
                </template>
            </p>

            <!--
                While the chooser is up, its own button is the action; the primary would only repeat the lookup.
                After a not-found answer it stays disabled until the HSN or the TSN changes (R-09: the routes lead on).
            -->
            <button
                v-if="!chooser"
                class="btn btn--primary btn--lg btn--block sel__go"
                type="submit"
                :disabled="selection === null || zero || pending || notFound"
                :aria-busy="pending ? 'true' : undefined"
            >
                {{ buttonLabel }}
            </button>
        </fieldset>

        <div v-if="garage.length" class="sel__garage">
            <p class="label">Zuletzt gewählt:</p>
            <div class="chip-row">
                <button v-for="g in garage" :key="g.id" class="chip" type="button" :disabled="pending" @click="choose(g.id)">
                    {{ g.short }}
                </button>
            </div>
        </div>
    </form>
</template>

<style scoped>
.sel {
    container-type: inline-size;
    container-name: sel;
    padding: var(--sp-24);
    border-radius: var(--r-tile);
    background: var(--c-surface);
    box-shadow: var(--e-2);
}

.sel__fields {
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
}

/*
 * Three tabs need 435 px at --fs-body with --sp-24 gaps and 373 px at --fs-small with --sp-16
 * (home-overhaul.md §4.2). The dense row is decided by the panel's own width, never the viewport:
 * a viewport rule left the 1280–1287 px panel (480 wide, 432 inside) three pixels short and
 * clipped *Fahrzeugschein scannen* under the hidden scrollbar.
 */
@container sel (width < 500px) {
    .sel :deep(.tabs__list) {
        gap: var(--sp-16);
    }

    .sel :deep(.tabs__trigger) {
        font-size: var(--fs-small);
        line-height: var(--lh-small);
    }
}

.sel__row + .sel__row {
    margin-top: var(--sp-16);
}

.sel__row--pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--gutter);
}

/*
 * The combobox parts are rendered by Reka primitives behind renderless roots, so the scoped
 * attribute does not reliably reach them; they are addressed through the panel with :deep().
 */
.sel :deep(.sel__combo) {
    position: relative;
}

.sel :deep(.sel__list) {
    position: absolute;
    top: calc(100% + var(--sp-8));
    left: 0;
    right: 0;
    min-width: 0;
    max-width: none;
}

.sel :deep(.sel__viewport) {
    max-height: min(320px, 50dvh);
}

.sel :deep(.sel__item) {
    justify-content: space-between;
    gap: var(--sp-12);
}

.sel :deep(.sel__empty) {
    padding: var(--sp-12);
}

.sel__tree-failed {
    margin-top: var(--sp-12);
}

.sel__keys {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--gutter);
}

.sel :deep(.sel__help) {
    margin-top: var(--sp-8);
}

/* The help popover is portalled to <body>, outside the panel's scope. */
:global(.sel__doc) {
    display: grid;
    gap: var(--sp-16);
    width: min(528px, calc(100vw - 2 * var(--sp-20)));
    max-width: none;
}

:global(.sel__doc .sel__doc-text) {
    max-width: 48ch;
}

.sel__notice {
    margin-bottom: var(--sp-16);
}

.sel__notfound {
    margin-top: var(--sp-16);
    margin-bottom: 0;
}

.sel__routes {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8) var(--sp-16);
    margin-top: var(--sp-8);
}

.sel__chooser {
    display: grid;
    gap: var(--sp-12);
}

.sel__candidates {
    display: grid;
}

.sel__candidate {
    align-items: flex-start;
    padding-block: var(--sp-8);
    border-top: 1px solid var(--c-line);
}

.sel__candidate input {
    margin-top: 3px;
}

.sel__candidate-text {
    display: grid;
    gap: var(--sp-4);
}

.sel__chooser-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-16);
}

.sel__count {
    display: block;
    min-height: var(--lh-small);
    margin-top: var(--sp-12);
}

.sel__n {
    color: var(--c-ink);
    font-weight: 600;
}

.sel__zero {
    margin-top: var(--sp-12);
}

.sel__zero-body {
    display: grid;
    gap: var(--sp-12);
    min-width: 0;
}

.sel__zero-body .btn {
    justify-self: start;
}

.sel__go {
    margin-top: var(--sp-16);
}

.sel__garage {
    display: grid;
    gap: var(--sp-8);
    margin-top: var(--sp-16);
}

/* With a vehicle */
.sel--vehicle {
    display: grid;
    gap: var(--sp-8);
}

.sel__vehicle {
    margin: 0;
}

.sel--vehicle .sel__count {
    margin-top: var(--sp-4);
}

.sel--vehicle .sel__go {
    margin-top: var(--sp-8);
}

.sel__vehicle-links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-16);
    margin-top: var(--sp-4);
}
</style>
