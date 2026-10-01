<script setup lang="ts">
/**
 * Checkout. Guest only — there are no customer accounts in this product.
 *
 * Three steps — Adresse, Optionen & Versand, Zahlung — and only the current one is on screen. The
 * stepper says which, and it never marks a step current while another step's fields are showing.
 * Every value typed survives going back and forth: the fields live in one object, not in the step.
 *
 * „Brauchst du RDKS-Sensoren?" opens the second step, and only when the basket holds a
 * Komplettrad (docs/specs/komplettrad.md §5, D-034). The answer is a server round trip: the
 * server stores it with the price it quoted and re-renders the totals with the sensor line. This
 * page prints the strings it is given — `4 × 49,00 €`, `196,00 €` — and never multiplies cents.
 * Where the make has no price, the `Ja` tile does not exist and the card says why; `Nein` and the
 * order stay open. Without an answer, `Weiter` is refused here and the order is refused on the
 * server, with the same sentence.
 *
 * `Zahlungspflichtig bestellen` is the exact wording of the final button, and it is not a style
 * choice: §312j BGB requires the button to state that the order carries an obligation to pay.
 *
 * The summary sits beside the form from 1200px, sticky, only as wide as it needs. On a phone it
 * comes first, folded to one line with the total, so the figure is known before the typing starts.
 *
 * `orderRefusal` is the sentence the server answers a submission with — a demo line, an
 * unconfigured shipping price or delivery time, or no payment yet. It is shown above the final
 * button, which stays disabled while it stands. No carrier is named: none is confirmed (D7).
 *
 * Paying (Block G). With Stripe in force the third step mounts Stripe's Express Checkout (Apple Pay,
 * Google Pay — its place is reserved at the top) and the Payment Element; Stripe.js is fetched from
 * js.stripe.com only here. „Zahlungspflichtig bestellen“ checks the element, asks the server — which
 * decides everything again, writes the order and creates the payment at its own total — and then
 * confirms in the browser. A decline is answered on this page, everything typed still here; the order
 * is paid only when Stripe's signed webhook says so, and the basket is emptied only then.
 *
 * What was typed is kept in this tab (sessionStorage) until the order is paid, so a reload, a 3-D
 * Secure detour or a declined card never loses it. Fields are checked when they are left, never
 * while typing. The PLZ offers its Ort (GeoNames); nothing typed is ever overwritten.
 */

import { Head, Link, router } from '@inertiajs/vue3'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import Icon from '../../Components/Art/Icon.vue'
import VerdictBadge from '../../Components/Ui/VerdictBadge.vue'
import ConditionGroups from '../../Components/Fitment/ConditionGroups.vue'
import { priceTerms, totalNote } from '../../composables/usePriceTerms'
import { entryLine } from '../../fitment/papers'
import { useShared } from '../../composables/useShared'
import {
    loadStripe,
    stripeAppearance,
    xsrfToken,
    type StripeElement,
    type StripeElements,
    type StripeInstance,
} from '../../composables/useStripe'
import type { BasketLine, BasketTotals, ContactProp } from '../../types/rimify'

defineOptions({ layout: AppLayout, inheritAttrs: false })

const props = defineProps<{
    lines: (BasketLine & { demo?: boolean })[]
    totals: BasketTotals & { shippingConfigured?: boolean }
    contact: ContactProp
    /** Why an order cannot be placed right now, or null. */
    orderRefusal?: string | null
    /** The review's test payment stands in for a provider: no money moves. */
    sandbox?: boolean
    /** Stripe's publishable key and mode; null while Stripe is not the driver in force. */
    payment?: { publishableKey: string; testMode: boolean } | null
    /** What this page shows, as the token the server compares at payment time (CheckoutShown). */
    shown?: string
    /** The delivery time as the operator wrote it; null until they do. */
    deliveryTime?: string | null
}>()

const shared = useShared()
const terms = computed(() => priceTerms(shared.value.smallBusiness === true))
const vehicle = computed(() => shared.value.vehicle)

type Step = 1 | 2 | 3

const STEPS: { n: Step; label: string }[] = [
    { n: 1, label: 'Adresse' },
    { n: 2, label: 'Optionen & Versand' },
    { n: 3, label: 'Zahlung' },
]

/** The RDKS block of the totals; null in fixtures written before it existed. */
const tpms = computed(() => props.totals.tpms ?? null)

/** The question is asked only of a basket with a Komplettrad (D-034). */
const tpmsApplicable = computed(() => tpms.value?.applicable === true)

/** The server's own sentence for an unanswered question — the same one it refuses the order with. */
const TPMS_UNANSWERED = 'Bitte sag uns noch, ob du RDKS-Sensoren brauchst.'

const step = ref<Step>(1)
const summaryOpen = ref(false)
const formEl = ref<HTMLFormElement | null>(null)

const form = reactive({
    email: '',
    phone: '',
    name: '',
    street: '',
    houseNumber: '',
    zip: '',
    city: '',
    billingSame: true,
    billingName: '',
    billingStreet: '',
    billingHouseNumber: '',
    billingZip: '',
    billingCity: '',
    shipping: 'standard',
})

const errors = reactive<Record<string, string>>({})

/** „Rechnung an eine andere Adresse“ — an unchecked box; the server still speaks of `billingSame`. */
const billingOther = computed({
    get: () => !form.billingSame,
    set: (other: boolean) => {
        form.billingSame = !other
    },
})

type FormKey = keyof typeof form

const REQUIRED: [FormKey, string][] = [
    ['email', 'Bitte gib deine E-Mail-Adresse an.'],
    ['name', 'Bitte gib deinen vollständigen Namen an.'],
    ['street', 'Bitte gib die Straße an.'],
    ['houseNumber', 'Bitte gib die Hausnummer an.'],
    ['zip', 'Bitte gib die PLZ an.'],
    ['city', 'Bitte gib den Ort an.'],
]

const BILLING_REQUIRED: [FormKey, string][] = [
    ['billingName', 'Bitte gib den Namen für die Rechnung an.'],
    ['billingStreet', 'Bitte gib die Straße an.'],
    ['billingHouseNumber', 'Bitte gib die Hausnummer an.'],
    ['billingZip', 'Bitte gib die PLZ an.'],
    ['billingCity', 'Bitte gib den Ort an.'],
]

const ZIP_ERROR = 'Eine deutsche PLZ hat fünf Ziffern.'

/** One field's error, or null — the same sentences the server answers with (PlaceOrderRequest). */
function fieldError(key: FormKey): string | null {
    const rule = [...REQUIRED, ...BILLING_REQUIRED].find(([k]) => k === key)
    const value = String(form[key]).trim()

    if (rule && value === '') {
        return rule[1]
    }

    // A domain ends in at least two letters after its last dot: „name@web.de.“ is refused here, as the server does.
    if (key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/.test(value)) {
        return 'Diese E-Mail-Adresse ist unvollständig – sie braucht ein @ und eine Domain.'
    }

    if ((key === 'zip' || key === 'billingZip') && !/^\d{5}$/.test(value)) {
        return ZIP_ERROR
    }

    return null
}

/** Checked when the field is left — never while typing. A field once wrong is cleared as soon as it is left right. */
function touch(key: FormKey): void {
    if (key === 'street' || key === 'billingStreet') {
        splitHouseNumber(key)
    }

    const message = fieldError(key)

    if (message === null) {
        delete errors[key]
    } else {
        errors[key] = message
    }
}

/*
 * A browser's address autofill writes „Musterstraße 12a“ into the street: the number moves into its own field,
 * where it belongs — only while that field is still empty, so nothing typed is overwritten.
 */
function splitHouseNumber(key: 'street' | 'billingStreet'): void {
    const numberKey = key === 'street' ? 'houseNumber' : 'billingHouseNumber'
    const match = /^(.*\D)\s+(\d+\s?[a-zA-Z]?(?:\s?[-/]\s?\d+\s?[a-zA-Z]?)?)$/.exec(form[key].trim())

    if (match?.[1] && match[2] && form[numberKey].trim() === '') {
        form[key] = match[1].trim()
        form[numberKey] = match[2].replace(/\s+/g, '')
        delete errors[numberKey]
    }
}

/** Checks the address step. Errors name the fix, and the first broken field takes the focus. */
function validateAddress(): boolean {
    for (const key of Object.keys(errors)) {
        delete errors[key]
    }

    // An autofilled street was never left (autofill does not focus it): its number moves here too (PAY-02).
    splitHouseNumber('street')

    if (!form.billingSame) {
        splitHouseNumber('billingStreet')
    }

    const rules = form.billingSame ? REQUIRED : [...REQUIRED, ...BILLING_REQUIRED]

    for (const [key] of rules) {
        const message = fieldError(key)

        if (message !== null) {
            errors[key] = message
        }
    }

    const first = Object.keys(errors)[0]

    if (first !== undefined) {
        void nextTick(() => formEl.value?.querySelector<HTMLElement>(`[data-key="${first}"]`)?.focus())

        return false
    }

    return true
}

function goTo(target: Step): void {
    step.value = target
    void nextTick(() => formEl.value?.querySelector<HTMLElement>('[data-step-title]')?.focus())
}

/** Refuses the step without an RDKS answer, in the server's words, and puts the question in focus. */
function validateOptions(): boolean {
    delete errors.rdks

    if (tpmsApplicable.value && tpms.value?.choice === null) {
        errors.rdks = TPMS_UNANSWERED
        void nextTick(() => formEl.value?.querySelector<HTMLElement>('[data-key="rdks"]')?.focus())

        return false
    }

    return true
}

/** The answer goes to the server, which quotes the sensor and re-renders the totals (§5.3). */
function chooseTpms(choice: 'ja' | 'nein'): void {
    delete errors.rdks

    router.patch('/kasse/rdks', { choice }, { preserveScroll: true, preserveState: true })
}

function next(): void {
    if (step.value === 1 && !validateAddress()) {
        return
    }

    if (step.value === 2 && !validateOptions()) {
        return
    }

    if (step.value < 3) {
        goTo((step.value + 1) as Step)
    }
}

/** The server's answer to a submission: why the order was not placed. */
const serverRefusal = ref<string | null>(null)

/** A press is on its way: the button waits, and a second press does nothing (the server reuses the order too). */
const paying = ref(false)

/** Stripe's own sentence for a declined or unfinished payment, in German (the Elements' locale). */
const payError = ref<string | null>(null)

/** The form as the server takes it. The RDKS answer travels only where the question was asked (§5.3). */
function payload(): Record<string, unknown> {
    return tpmsApplicable.value ? { ...form, rdks: tpms.value?.choice ?? null } : { ...form }
}

/** The whole checkout, checked one last time before anything leaves the page. */
function readyToOrder(): boolean {
    if (!validateAddress()) {
        goTo(1)

        return false
    }

    if (!validateOptions()) {
        goTo(2)

        return false
    }

    return !props.orderRefusal
}

/** A server's refusal on the page: the sentence above the button, form errors on their fields. */
function showRefusal(failed: Record<string, string>): void {
    serverRefusal.value = failed.order ?? null

    for (const [key, message] of Object.entries(failed)) {
        if (key !== 'order') {
            errors[key] = message
        }
    }

    // The question is on step 2, the address on step 1: the sentence goes where the answer is given.
    if (failed.rdks) {
        goTo(2)
    } else if (Object.keys(failed).some((key) => key !== 'order')) {
        goTo(1)
    }
}

/*
 * The button validates the whole checkout one last time, then asks the server, which decides
 * (R-11). While the page already knows the answer is no, the button is disabled and says why.
 */
function submit(): void {
    if (paying.value || !readyToOrder()) {
        return
    }

    if (stripeReady.value) {
        void payWithStripe()

        return
    }

    paying.value = true
    // What the page showed travels with the order on this path too (PAY-04): a price that moved is not ordered unseen.
    router.post('/kasse', { ...payload(), shown: props.shown ?? '' } as Record<string, string>, {
        preserveScroll: true,
        preserveState: true,
        onError: showRefusal,
        onFinish: () => {
            paying.value = false
        },
    })
}

/* ── Stripe ──────────────────────────────────────────────────────────────── */

const expressEl = ref<HTMLElement | null>(null)
const paymentEl = ref<HTMLElement | null>(null)
const stripeReady = ref(false)
/** Express Checkout offers nothing on this device: its reserved place folds away. */
const expressEmpty = ref(false)
const stripeFailed = ref(false)

let stripe: StripeInstance | null = null
let elements: StripeElements | null = null
let mounted: StripeElement[] = []

/** Asks the server for the order and its payment; the answer is a client secret, or a sentence why not. */
async function startPayment(): Promise<{ clientSecret: string; returnUrl: string } | null> {
    const response = await fetch('/kasse/zahlung', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': xsrfToken(),
        },
        body: JSON.stringify({ ...payload(), shown: props.shown ?? '' }),
    })

    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>

    if (response.ok && typeof body.clientSecret === 'string' && typeof body.returnUrl === 'string') {
        return { clientSecret: body.clientSecret, returnUrl: body.returnUrl }
    }

    if (response.status === 422 && body.errors && typeof body.errors === 'object') {
        const failed: Record<string, string> = {}

        for (const [key, messages] of Object.entries(body.errors as Record<string, unknown>)) {
            failed[key] = Array.isArray(messages) ? String(messages[0]) : String(messages)
        }

        showRefusal(failed)

        return null
    }

    serverRefusal.value =
        typeof body.refusal === 'string'
            ? body.refusal
            : 'Bezahlen ist gerade nicht möglich. Es wurde nichts abgebucht. Versuch es bitte in ein paar Minuten noch einmal.'

    // The basket is no longer what this page shows: it is shown again as it is now. What was typed stays.
    if (body.reload === true) {
        router.reload({ only: ['lines', 'totals', 'orderRefusal', 'shown', 'deliveryTime'] })
    }

    return null
}

async function confirm(clientSecret: string, returnUrl: string): Promise<void> {
    if (!stripe || !elements) {
        return
    }

    // Only a failure comes back here; a success leaves for the return address (3-D Secure on the way).
    const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: { return_url: new URL(returnUrl, window.location.origin).href },
    })

    payError.value = error?.message ?? 'Die Zahlung wurde nicht abgeschlossen. Es wurde nichts abgebucht. Versuch es noch einmal oder wähl eine andere Zahlungsart.'
}

async function payWithStripe(): Promise<void> {
    if (!elements) {
        return
    }

    paying.value = true
    payError.value = null
    serverRefusal.value = null

    try {
        // Stripe first: an incomplete card number is answered in its own field before any order exists.
        const { error } = await elements.submit()

        if (error) {
            payError.value = error.message ?? null

            return
        }

        const started = await startPayment()

        if (started) {
            await confirm(started.clientSecret, started.returnUrl)
        }
    } catch {
        payError.value = 'Die Verbindung ist abgebrochen. Es wurde nichts abgebucht – versuch es bitte noch einmal.'
    } finally {
        paying.value = false
    }
}

async function mountStripe(): Promise<void> {
    if (!props.payment || elements !== null || !paymentEl.value) {
        return
    }

    try {
        stripe ??= (await loadStripe())(props.payment.publishableKey, { locale: 'de' })
        stripeFailed.value = false
    } catch {
        stripeFailed.value = true

        return
    }

    // The step may have been left while Stripe.js was on its way.
    if (step.value !== 3 || !paymentEl.value || elements !== null) {
        return
    }

    elements = stripe.elements({
        mode: 'payment',
        amount: props.totals.totalCents,
        currency: 'eur',
        locale: 'de',
        appearance: stripeAppearance(),
    })

    const paymentElement = elements.create('payment', { layout: { type: 'accordion', defaultCollapsed: false } })
    paymentElement.on('ready', () => {
        stripeReady.value = true
    })
    paymentElement.mount(paymentEl.value)
    mounted.push(paymentElement)

    if (expressEl.value) {
        const express = elements.create('expressCheckout', {
            buttonHeight: 48,
            buttonType: { applePay: 'buy', googlePay: 'buy' },
        })

        express.on('ready', (event) => {
            const methods = event.availablePaymentMethods as Record<string, boolean> | undefined

            expressEmpty.value = !methods || !Object.values(methods).some(Boolean)
        })
        // The address was checked on the way to this step; the wallet sheet may open.
        express.on('click', (event) => {
            if (readyToOrder()) {
                ;(event.resolve as () => void)()
            }
        })
        express.on('confirm', (event) => {
            void (async () => {
                paying.value = true
                payError.value = null

                try {
                    // The deferred flow asks for the Elements' own check before any confirmation, wallets included.
                    const submitted = elements ? await elements.submit() : { error: { message: undefined } }
                    const started = submitted.error ? null : await startPayment()

                    if (started) {
                        await confirm(started.clientSecret, started.returnUrl)
                    } else {
                        ;(event.paymentFailed as (options: { reason: string }) => void)({ reason: 'fail' })
                    }
                } finally {
                    paying.value = false
                }
            })()
        })
        express.mount(expressEl.value)
        mounted.push(express)
    }
}

/* The amount the Elements show follows the server's total (the RDKS answer changes it). */
watch(
    () => props.totals.totalCents,
    (amount) => elements?.update({ amount })
)

/* The payment step's frames live in its markup: leaving the step takes them down, coming back builds them anew. */
function unmountStripe(): void {
    for (const element of mounted) {
        element.destroy()
    }

    mounted = []
    elements = null
    stripeReady.value = false
    expressEmpty.value = false
}

watch(step, (now) => {
    if (now === 3 && props.payment && !props.orderRefusal) {
        void nextTick(() => void mountStripe())
    } else {
        unmountStripe()
    }
})

onBeforeUnmount(unmountStripe)

/* ── What was typed, kept in this tab until the order is paid ────────────── */

const STORAGE_KEY = 'rmf.kasse.v1'

onMounted(() => {
    try {
        const saved = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<typeof form> | null

        if (saved && typeof saved === 'object') {
            for (const key of Object.keys(form) as FormKey[]) {
                if (typeof saved[key] === typeof form[key]) {
                    Object.assign(form, { [key]: saved[key] })
                }
            }
        }
    } catch {
        // A private window or blocked storage: the form simply starts empty.
    }
})

watch(
    form,
    () => {
        try {
            window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(form))
        } catch {
            // Storage full or blocked: nothing is lost on this page, only after a reload.
        }
    },
    { deep: true }
)

/* ── PLZ → Ort (GeoNames, CC BY 4.0) ─────────────────────────────────────── */

const places = reactive<{ zip: string[]; billingZip: string[] }>({ zip: [], billingZip: [] })

async function lookUp(zipKey: 'zip' | 'billingZip'): Promise<void> {
    const cityKey = zipKey === 'zip' ? 'city' : 'billingCity'
    const plz = form[zipKey].trim()

    places[zipKey] = []

    if (!/^\d{5}$/.test(plz)) {
        return
    }

    try {
        const response = await fetch(`/api/v1/plz/${plz}`, { headers: { Accept: 'application/json' } })
        const found = response.ok ? ((await response.json()) as { places?: string[] }).places ?? [] : []

        // The field may have moved on while the answer travelled.
        if (form[zipKey].trim() !== plz) {
            return
        }

        // Never while the customer is typing in Ort: the answer would join their letters (PAY-05).
        const typing = document.activeElement?.id === (zipKey === 'zip' ? 'ko-city' : 'ko-b-city')

        if (found.length === 1 && form[cityKey].trim() === '' && !typing) {
            form[cityKey] = found[0] ?? ''
            delete errors[cityKey]
        } else if (found.length > 1 && !found.includes(form[cityKey].trim())) {
            places[zipKey] = found.slice(0, 6)
        }
    } catch {
        // No suggestion: the customer types the Ort, as without the lookup.
    }
}

function choosePlace(zipKey: 'zip' | 'billingZip', place: string): void {
    const cityKey = zipKey === 'zip' ? 'city' : 'billingCity'

    form[cityKey] = place
    places[zipKey] = []
    delete errors[cityKey]
}

watch(() => form.zip, () => void lookUp('zip'))
watch(() => form.billingZip, () => void lookUp('billingZip'))

/* ── Hausnummer: the number pad first, letters one tap away ───────────────── */

const letters = reactive({ houseNumber: false, billingHouseNumber: false })

function allowLetters(key: 'houseNumber' | 'billingHouseNumber', id: string): void {
    letters[key] = true
    void nextTick(() => document.getElementById(id)?.focus())
}

/** A line that is sold out, not sellable for the chosen car, or marked by the server stops the checkout here too. */
const blocked = computed(() =>
    props.lines.some(
        (line) =>
            !line.inStock ||
            (line.verdict !== null && line.verdict !== undefined && !line.verdict.sellable) ||
            (line.blockReasons?.length ?? 0) > 0
    )
)

/** No shipping price has been given yet: it is named, left out of the total, and not guessed. */
const shippingOpen = computed(() => props.totals.shippingConfigured !== true)

const shippingLabel = computed(() => {
    if (shippingOpen.value) {
        return 'wird noch festgelegt'
    }

    return props.totals.freeShipping ? 'Kostenlos' : props.totals.shipping
})

/** Abnahme and Eintragung are paid to the Prüfstelle, not to us: the page says so when it applies. */
const needsEntry = computed(() => props.lines.some((line) => line.verdict?.requiresEntry === true))

/** The server's sentence; a page rendered before it existed falls back to the label and the Eintragung. */
function verdictSentence(line: BasketLine): string {
    const verdict = line.verdict

    if (!verdict) {
        return ''
    }

    const entry = entryLine(verdict.requiresEntry, verdict.papersExempt === true)

    return verdict.sentence ?? `${verdict.label}.${entry ? ` ${entry}` : ''}`
}

</script>

<template>
    <Head title="Kasse" />

    <section class="section-dense">
        <div class="wrap">
            <h1 class="t-h1">Kasse</h1>
            <p v-if="payment?.testMode" class="ko__testmode" role="note">Testmodus – es wird kein Geld abgebucht.</p>

            <div v-if="lines.length === 0" class="state">
                <Icon name="cart" :size="24" />
                <p class="state__title">Dein Warenkorb ist noch leer.</p>
                <p class="t-body">Lege zuerst eine Felge in den Warenkorb – dann geht es hier weiter.</p>
                <Link v-if="vehicle" href="/felgen" class="btn btn--primary">
                    Felgen für {{ vehicle.short }} ansehen
                </Link>
                <Link v-else href="/felgen-suchen" class="btn btn--primary">Fahrzeug wählen</Link>
            </div>

            <!-- Fails closed: a line that cannot be sold is sent back to the basket, not paid for. -->
            <div v-else-if="blocked" class="state">
                <Icon name="info" :size="24" />
                <p class="state__title">Eine Position im Warenkorb kann so nicht bestellt werden.</p>
                <p class="t-body">
                    Sie ist nicht lieferbar oder für dein Fahrzeug nicht freigegeben. Im Warenkorb
                    siehst du, welche es ist.
                </p>
                <Link href="/warenkorb" class="btn btn--primary">Zum Warenkorb</Link>
            </div>

            <template v-else>
                <!-- The stepper mirrors the one step on screen. -->
                <ol class="steps ko__steps" aria-label="Fortschritt">
                    <li
                        v-for="item in STEPS"
                        :key="item.n"
                        class="steps__item"
                        :class="{
                            'steps__item--done': item.n < step,
                            'steps__item--on': item.n === step,
                        }"
                        :aria-current="item.n === step ? 'step' : undefined"
                    >
                        <span class="steps__num">
                            <Icon v-if="item.n < step" name="check" :size="20" />
                            <template v-else>{{ item.n }}</template>
                        </span>
                        {{ item.label }}
                    </li>
                </ol>

                <div class="ko">
                    <!-- Summary: first on a phone and folded; beside the form from 1200px. -->
                    <aside class="card ko__sum" aria-labelledby="ko-sum-title">
                        <button
                            class="ko__sum-toggle"
                            type="button"
                            :aria-expanded="summaryOpen"
                            aria-controls="ko-sum-body"
                            @click="summaryOpen = !summaryOpen"
                        >
                            <span>Bestellung ansehen</span>
                            <span class="ko__sum-total tabular">{{ totals.total }}</span>
                            <span class="ko__chev" :class="{ 'ko__chev--open': summaryOpen }">
                                <Icon name="chevron-down" :size="20" />
                            </span>
                        </button>

                        <div id="ko-sum-body" class="ko__sum-body" :class="{ 'is-open': summaryOpen }">
                            <!-- On the payment step the goods stand above the button (§312j); the aside keeps the sums only. -->
                            <h2 id="ko-sum-title" class="t-h3 ko__sum-title">{{ step === 3 ? 'Summe' : 'Deine Bestellung' }}</h2>

                            <ul v-if="step < 3" class="ko__lines">
                                <li v-for="line in lines" :key="line.key" class="ko__line">
                                    <div class="ko__line-top">
                                        <span class="ko__line-name">
                                            <span class="tabular">{{ line.quantity }} ×</span>
                                            {{ line.brandName }} {{ line.title }}
                                        </span>
                                        <span class="ko__line-price tabular">{{ line.lineTotal }}</span>
                                    </div>
                                    <p class="ko__line-sub">
                                        {{ line.subtitle }}<template v-if="line.sizeLabel">
                                            · <span class="data">{{ line.sizeLabel }}</span></template
                                        >
                                    </p>
                                    <p v-if="line.demo !== false" class="ko__line-flag">
                                        <span class="tag tag--unknown">Beispielsortiment</span>
                                    </p>
                                    <!-- The verdict in one sentence on every step; its Auflagen one tap away, in full (R-15). -->
                                    <template v-if="line.verdict">
                                        <p class="ko__verdict"><VerdictBadge :status="line.verdict.status" :notes-only="line.verdict.notesOnly === true" /> <span>{{ verdictSentence(line) }}</span></p>
                                        <details v-if="line.verdict.conditions.length" class="ko__auflagen">
                                            <summary>Auflagen lesen</summary>
                                            <!-- Each tyre size's Auflagen with that size; a Komplettrad's for its tyre (ConditionGroups). -->
                                            <ConditionGroups v-if="line.verdict.conditionGroups" class="ko__groups" :groups="line.verdict.conditionGroups" />
                                            <ul v-else class="ko__conditions">
                                                <li v-for="condition in line.verdict.conditions" :key="condition">
                                                    {{ condition }}
                                                </li>
                                            </ul>
                                        </details>
                                    </template>
                                    <!-- A Komplettrad repeats its components here: the last reading before paying. -->
                                    <dl
                                        v-if="line.isSet && line.components && line.components.length > 1"
                                        class="ko__parts"
                                        aria-label="Bestandteile des Komplettrads"
                                    >
                                        <div v-for="part in line.components" :key="part.key" class="ko__part">
                                            <dt>{{ part.label }}</dt>
                                            <dd :class="{ 'ko__part--open': part.open }">
                                                <span class="tabular">{{ part.quantity }} × {{ part.unitPrice }}</span>
                                            </dd>
                                        </div>
                                    </dl>
                                </li>
                                <!-- The sensors, as the server priced them (§5.4): printed, never computed here. -->
                                <li v-if="tpms && tpms.choice === 'ja'" class="ko__line ko__line--tpms">
                                    <div class="ko__line-top">
                                        <span class="ko__line-name">RDKS-Sensoren ({{ tpms.line }})</span>
                                        <span class="ko__line-price tabular">{{ tpms.total }}</span>
                                    </div>
                                </li>
                            </ul>

                            <dl class="sum">
                                <div class="sum__row">
                                    <dt>Zwischensumme</dt>
                                    <dd class="tabular">{{ totals.subtotal }}</dd>
                                </div>
                                <div class="sum__row">
                                    <dt>Versand</dt>
                                    <dd class="tabular">{{ shippingLabel }}</dd>
                                </div>
                                <div class="sum__row sum__row--total">
                                    <dt>Gesamt</dt>
                                    <dd class="tabular">{{ totals.total }}</dd>
                                </div>
                            </dl>
                            <p class="price-legal">{{ totalNote(terms.smallBusiness, totals.tax, shippingOpen) }}</p>
                        </div>
                    </aside>

                    <form ref="formEl" class="ko__form" novalidate @submit.prevent="step === 3 ? submit() : next()">
                        <!-- Step 1 · Adresse -->
                        <template v-if="step === 1">
                            <h2 class="t-h2 ko__step-title" tabindex="-1" data-step-title>Adresse</h2>

                            <fieldset class="ko__group">
                                <legend class="t-h3">Kontakt</legend>
                                <div class="ko__grid">
                                    <div class="ko__half">
                                        <label class="field-label" for="ko-mail">
                                            E-Mail <span class="field-label__req">*</span>
                                        </label>
                                        <input
                                            id="ko-mail"
                                            v-model="form.email"
                                            data-key="email"
                                            class="field"
                                            :class="{ 'field--error': errors.email }"
                                            type="email"
                                            inputmode="email"
                                            autocomplete="email"
                                            aria-describedby="ko-mail-help ko-mail-err"
                                            :aria-invalid="errors.email ? 'true' : undefined"
                                            @blur="touch('email')"
                                        />
                                        <p id="ko-mail-help" class="field-help">
                                            Hierhin schicken wir dir Infos zu deiner Bestellung.
                                        </p>
                                        <span id="ko-mail-err" class="field-error">{{ errors.email ?? '' }}</span>
                                    </div>
                                    <div class="ko__half">
                                        <label class="field-label" for="ko-tel">Telefon</label>
                                        <input
                                            id="ko-tel"
                                            v-model="form.phone"
                                            class="field"
                                            type="tel"
                                            inputmode="tel"
                                            autocomplete="tel"
                                            aria-describedby="ko-tel-err"
                                            :aria-invalid="errors.phone ? 'true' : undefined"
                                        />
                                        <span id="ko-tel-err" class="field-error">{{ errors.phone ?? '' }}</span>
                                    </div>
                                </div>
                            </fieldset>

                            <fieldset class="ko__group">
                                <legend class="t-h3">Lieferadresse</legend>
                                <div class="ko__grid">
                                    <div class="ko__wide">
                                        <label class="field-label" for="ko-name">
                                            Vollständiger Name <span class="field-label__req">*</span>
                                        </label>
                                        <input
                                            id="ko-name"
                                            v-model="form.name"
                                            data-key="name"
                                            class="field"
                                            :class="{ 'field--error': errors.name }"
                                            autocomplete="shipping name"
                                            aria-describedby="ko-name-err"
                                            :aria-invalid="errors.name ? 'true' : undefined"
                                            @blur="touch('name')"
                                        />
                                        <span id="ko-name-err" class="field-error">{{ errors.name ?? '' }}</span>
                                    </div>
                                    <div class="ko__street">
                                        <label class="field-label" for="ko-street">
                                            Straße <span class="field-label__req">*</span>
                                        </label>
                                        <input
                                            id="ko-street"
                                            v-model="form.street"
                                            data-key="street"
                                            class="field"
                                            :class="{ 'field--error': errors.street }"
                                            autocomplete="shipping address-line1"
                                            aria-describedby="ko-street-err"
                                            :aria-invalid="errors.street ? 'true' : undefined"
                                            @blur="touch('street')"
                                        />
                                        <span id="ko-street-err" class="field-error">{{ errors.street ?? '' }}</span>
                                    </div>
                                    <div class="ko__nr">
                                        <label class="field-label" for="ko-nr">
                                            Hausnummer <span class="field-label__req">*</span>
                                        </label>
                                        <input
                                            id="ko-nr"
                                            v-model="form.houseNumber"
                                            data-key="houseNumber"
                                            class="field"
                                            :class="{ 'field--error': errors.houseNumber }"
                                            :inputmode="letters.houseNumber ? 'text' : 'numeric'"
                                            autocomplete="off"
                                            aria-describedby="ko-nr-err"
                                            :aria-invalid="errors.houseNumber ? 'true' : undefined"
                                            @blur="touch('houseNumber')"
                                        />
                                        <button
                                            v-if="!letters.houseNumber"
                                            class="ko__letters"
                                            type="button"
                                            @click="allowLetters('houseNumber', 'ko-nr')"
                                        >
                                            Buchstaben eingeben, z.&nbsp;B. 12a
                                        </button>
                                        <span id="ko-nr-err" class="field-error">{{ errors.houseNumber ?? '' }}</span>
                                    </div>
                                    <div class="ko__zip">
                                        <label class="field-label" for="ko-zip">
                                            PLZ <span class="field-label__req">*</span>
                                        </label>
                                        <input
                                            id="ko-zip"
                                            v-model="form.zip"
                                            data-key="zip"
                                            class="field tabular"
                                            :class="{ 'field--error': errors.zip }"
                                            inputmode="numeric"
                                            pattern="[0-9]*"
                                            maxlength="5"
                                            autocomplete="shipping postal-code"
                                            aria-describedby="ko-zip-err"
                                            :aria-invalid="errors.zip ? 'true' : undefined"
                                            @blur="touch('zip')"
                                        />
                                        <span id="ko-zip-err" class="field-error">{{ errors.zip ?? '' }}</span>
                                    </div>
                                    <div class="ko__city">
                                        <label class="field-label" for="ko-city">
                                            Ort <span class="field-label__req">*</span>
                                        </label>
                                        <input
                                            id="ko-city"
                                            v-model="form.city"
                                            data-key="city"
                                            class="field"
                                            :class="{ 'field--error': errors.city }"
                                            autocomplete="shipping address-level2"
                                            aria-describedby="ko-city-err"
                                            :aria-invalid="errors.city ? 'true' : undefined"
                                            @blur="touch('city')"
                                        />
                                        <div v-if="places.zip.length" class="ko__places" role="group" aria-label="Orte zu dieser PLZ">
                                            <span class="label ko__places-lead">Zu {{ form.zip }} gehören:</span>
                                            <button
                                                v-for="place in places.zip"
                                                :key="place"
                                                class="ko__place"
                                                type="button"
                                                @click="choosePlace('zip', place)"
                                            >
                                                {{ place }}
                                            </button>
                                            <span class="ko__source">Orte nach GeoNames (CC BY 4.0)</span>
                                        </div>
                                        <span id="ko-city-err" class="field-error">{{ errors.city ?? '' }}</span>
                                    </div>
                                    <div class="ko__wide">
                                        <span class="field-label">Land</span>
                                        <p class="ko__static">Deutschland</p>
                                    </div>
                                </div>
                            </fieldset>

                            <fieldset class="ko__group">
                                <legend class="t-h3">Rechnungsadresse</legend>
                                <label class="ko__check">
                                    <input v-model="billingOther" type="checkbox" />
                                    <span>Andere Rechnungsadresse</span>
                                </label>

                                <div v-if="billingOther" class="ko__grid ko__billing">
                                    <div class="ko__wide">
                                        <label class="field-label" for="ko-b-name">
                                            Vollständiger Name <span class="field-label__req">*</span>
                                        </label>
                                        <input
                                            id="ko-b-name"
                                            v-model="form.billingName"
                                            data-key="billingName"
                                            class="field"
                                            :class="{ 'field--error': errors.billingName }"
                                            autocomplete="billing name"
                                            :aria-invalid="errors.billingName ? 'true' : undefined"
                                            aria-describedby="ko-b-name-err"
                                            @blur="touch('billingName')"
                                        />
                                        <span id="ko-b-name-err" class="field-error">{{ errors.billingName ?? '' }}</span>
                                    </div>
                                    <div class="ko__street">
                                        <label class="field-label" for="ko-b-street">
                                            Straße <span class="field-label__req">*</span>
                                        </label>
                                        <input
                                            id="ko-b-street"
                                            v-model="form.billingStreet"
                                            data-key="billingStreet"
                                            class="field"
                                            :class="{ 'field--error': errors.billingStreet }"
                                            autocomplete="billing address-line1"
                                            :aria-invalid="errors.billingStreet ? 'true' : undefined"
                                            aria-describedby="ko-b-street-err"
                                            @blur="touch('billingStreet')"
                                        />
                                        <span id="ko-b-street-err" class="field-error">{{ errors.billingStreet ?? '' }}</span>
                                    </div>
                                    <div class="ko__nr">
                                        <label class="field-label" for="ko-b-nr">
                                            Hausnummer <span class="field-label__req">*</span>
                                        </label>
                                        <input
                                            id="ko-b-nr"
                                            v-model="form.billingHouseNumber"
                                            data-key="billingHouseNumber"
                                            class="field"
                                            :class="{ 'field--error': errors.billingHouseNumber }"
                                            :inputmode="letters.billingHouseNumber ? 'text' : 'numeric'"
                                            autocomplete="off"
                                            :aria-invalid="errors.billingHouseNumber ? 'true' : undefined"
                                            aria-describedby="ko-b-nr-err"
                                            @blur="touch('billingHouseNumber')"
                                        />
                                        <button
                                            v-if="!letters.billingHouseNumber"
                                            class="ko__letters"
                                            type="button"
                                            @click="allowLetters('billingHouseNumber', 'ko-b-nr')"
                                        >
                                            Buchstaben eingeben, z.&nbsp;B. 12a
                                        </button>
                                        <span id="ko-b-nr-err" class="field-error">{{ errors.billingHouseNumber ?? '' }}</span>
                                    </div>
                                    <div class="ko__zip">
                                        <label class="field-label" for="ko-b-zip">
                                            PLZ <span class="field-label__req">*</span>
                                        </label>
                                        <input
                                            id="ko-b-zip"
                                            v-model="form.billingZip"
                                            data-key="billingZip"
                                            class="field tabular"
                                            :class="{ 'field--error': errors.billingZip }"
                                            inputmode="numeric"
                                            pattern="[0-9]*"
                                            maxlength="5"
                                            autocomplete="billing postal-code"
                                            :aria-invalid="errors.billingZip ? 'true' : undefined"
                                            aria-describedby="ko-b-zip-err"
                                            @blur="touch('billingZip')"
                                        />
                                        <span id="ko-b-zip-err" class="field-error">{{ errors.billingZip ?? '' }}</span>
                                    </div>
                                    <div class="ko__city">
                                        <label class="field-label" for="ko-b-city">
                                            Ort <span class="field-label__req">*</span>
                                        </label>
                                        <input
                                            id="ko-b-city"
                                            v-model="form.billingCity"
                                            data-key="billingCity"
                                            class="field"
                                            :class="{ 'field--error': errors.billingCity }"
                                            autocomplete="billing address-level2"
                                            :aria-invalid="errors.billingCity ? 'true' : undefined"
                                            aria-describedby="ko-b-city-err"
                                            @blur="touch('billingCity')"
                                        />
                                        <div
                                            v-if="places.billingZip.length"
                                            class="ko__places"
                                            role="group"
                                            aria-label="Orte zu dieser PLZ"
                                        >
                                            <span class="label ko__places-lead">Zu {{ form.billingZip }} gehören:</span>
                                            <button
                                                v-for="place in places.billingZip"
                                                :key="place"
                                                class="ko__place"
                                                type="button"
                                                @click="choosePlace('billingZip', place)"
                                            >
                                                {{ place }}
                                            </button>
                                            <span class="ko__source">Orte nach GeoNames (CC BY 4.0)</span>
                                        </div>
                                        <span id="ko-b-city-err" class="field-error">{{ errors.billingCity ?? '' }}</span>
                                    </div>
                                </div>
                            </fieldset>

                            <div class="ko__actions">
                                <button class="btn btn--primary btn--lg" type="submit">Weiter zu Optionen &amp; Versand</button>
                            </div>
                        </template>

                        <!-- Steps 2 and 3 open with what has been entered so far, each part changeable. -->
                        <template v-else>
                            <dl class="ko__recap">
                                <div class="ko__recap-row">
                                    <dt class="micro">Lieferadresse</dt>
                                    <dd>
                                        {{ form.name }}, {{ form.street }} {{ form.houseNumber }},
                                        <span class="tabular">{{ form.zip }}</span> {{ form.city }}
                                        <span class="ko__recap-mail">{{ form.email }}</span>
                                        <span v-if="billingOther" class="ko__recap-mail">
                                            Rechnung: {{ form.billingName }}, {{ form.billingStreet }} {{ form.billingHouseNumber }},
                                            <span class="tabular">{{ form.billingZip }}</span> {{ form.billingCity }}
                                        </span>
                                    </dd>
                                    <button class="btn btn--quiet ko__change" type="button" @click="goTo(1)">
                                        Ändern<span class="visually-hidden"> (Adresse)</span>
                                    </button>
                                </div>
                                <div v-if="step === 3" class="ko__recap-row">
                                    <dt class="micro">Optionen &amp; Versand</dt>
                                    <dd>
                                        Standardversand · <span :class="{ tabular: !shippingOpen }">{{ shippingLabel }}</span>
                                        <template v-if="tpmsApplicable && tpms">
                                            <span class="ko__recap-line">
                                                <template v-if="tpms.choice === 'ja'">
                                                    RDKS-Sensoren · <span class="tabular">{{ tpms.line }}</span>
                                                </template>
                                                <template v-else>Ohne RDKS-Sensoren</template>
                                            </span>
                                        </template>
                                    </dd>
                                    <button class="btn btn--quiet ko__change" type="button" @click="goTo(2)">
                                        Ändern<span class="visually-hidden"> (Optionen &amp; Versand)</span>
                                    </button>
                                </div>
                            </dl>

                            <!-- Step 2 · Optionen & Versand -->
                            <template v-if="step === 2">
                                <h2 class="t-h2 ko__step-title" tabindex="-1" data-step-title>Optionen &amp; Versand</h2>

                                <!-- Reifendruck-Sensoren: asked here because the client asked for exactly that (D-039). -->
                                <fieldset v-if="tpmsApplicable && tpms" class="ko__group ko__rdks">
                                    <legend class="t-h3">Reifendruck-Sensoren (RDKS)</legend>
                                    <p id="ko-rdks-q" class="ko__rdks-q">Brauchst du RDKS-Sensoren?</p>
                                    <p class="t-small ko__rdks-help">
                                        Misst dein Auto den Reifendruck mit Sensoren in den Rädern, brauchen auch die
                                        neuen Räder Sensoren. Ob das so ist, steht in der Betriebsanleitung. Manche Autos
                                        warnen ganz ohne Sensoren im Rad – dann brauchst du keine.
                                    </p>

                                    <!-- No price for this make: no Ja tile at all, and the sentence says why (§5.2). -->
                                    <p v-if="!tpms.available" class="ko__rdks-notice" role="status">
                                        {{ tpms.notice }}
                                        <a :href="`mailto:${contact.email}`" class="ko__rdks-mail">{{ contact.email }}</a>
                                    </p>

                                    <div
                                        class="opt"
                                        role="radiogroup"
                                        aria-labelledby="ko-rdks-q"
                                        aria-describedby="ko-rdks-err"
                                        data-key="rdks"
                                        tabindex="-1"
                                    >
                                        <label
                                            v-if="tpms.available"
                                            class="opt__tile"
                                            :class="{ 'opt__tile--on': tpms.choice === 'ja' }"
                                        >
                                            <input
                                                class="visually-hidden opt__input"
                                                type="radio"
                                                name="rdks"
                                                value="ja"
                                                :checked="tpms.choice === 'ja'"
                                                @change="chooseTpms('ja')"
                                            />
                                            <span class="opt__name">Ja, bitte mit RDKS-Sensoren</span>
                                            <span class="opt__price tabular">{{ tpms.line }}</span>
                                            <span class="opt__sub">Wir setzen die Sensoren gleich mit ein.</span>
                                            <span class="opt__check" aria-hidden="true">
                                                <Icon name="check" :size="20" />
                                            </span>
                                        </label>
                                        <label class="opt__tile" :class="{ 'opt__tile--on': tpms.choice === 'nein' }">
                                            <input
                                                class="visually-hidden opt__input"
                                                type="radio"
                                                name="rdks"
                                                value="nein"
                                                :checked="tpms.choice === 'nein'"
                                                @change="chooseTpms('nein')"
                                            />
                                            <span class="opt__name">Nein, ich brauche keine</span>
                                            <span class="opt__price tabular">0,00&nbsp;€</span>
                                            <span class="opt__check" aria-hidden="true">
                                                <Icon name="check" :size="20" />
                                            </span>
                                        </label>
                                    </div>
                                    <span id="ko-rdks-err" class="field-error" role="alert">{{ errors.rdks ?? '' }}</span>
                                </fieldset>

                                <fieldset class="ko__group">
                                    <legend class="visually-hidden">Versandart</legend>
                                    <label class="ko__option">
                                        <input v-model="form.shipping" type="radio" name="shipping" value="standard" />
                                        <span class="ko__option-text">
                                            <span class="ko__option-name">Standardversand</span>
                                        </span>
                                        <span class="ko__option-price" :class="{ tabular: !shippingOpen }">{{ shippingLabel }}</span>
                                    </label>
                                </fieldset>

                                <div class="ko__actions">
                                    <button class="btn btn--primary btn--lg" type="submit">Weiter zur Zahlung</button>
                                    <button class="btn btn--secondary btn--lg" type="button" @click="goTo(1)">Zurück</button>
                                </div>
                            </template>

                            <!-- Step 3 · Zahlung -->
                            <template v-else>
                                <h2 class="t-h2 ko__step-title" tabindex="-1" data-step-title>Zahlung</h2>

                                <!-- The server's own answer, before anyone presses the button. -->
                                <p v-if="orderRefusal" id="ko-refusal" class="ko__refusal" role="status">
                                    {{ orderRefusal }}
                                </p>
                                <p v-else-if="sandbox" id="ko-sandbox" class="tag tag--unknown ko__sandbox">
                                    Testbestellung – im nächsten Schritt wählst du, wie die Testzahlung ausgeht. Es wird kein Geld bewegt.
                                </p>

                                <!-- Stripe: Apple Pay and Google Pay first, in a place kept for them; then every other way. -->
                                <div v-if="payment && !orderRefusal" class="ko__pay-methods">
                                    <div
                                        ref="expressEl"
                                        class="ko__express"
                                        :class="{ 'ko__express--empty': expressEmpty }"
                                        role="group"
                                        aria-label="Express-Zahlung"
                                    />
                                    <p v-if="!expressEmpty && stripeReady" class="ko__or" aria-hidden="true"><span>oder</span></p>
                                    <div ref="paymentEl" class="ko__payment" />
                                    <p v-if="!stripeReady && !stripeFailed" class="t-small quiet ko__loading" role="status">
                                        Zahlungsarten werden geladen …
                                    </p>
                                    <div v-if="stripeFailed" class="ko__refusal" role="alert">
                                        <p>
                                            Die Zahlungsarten ließen sich nicht laden. Prüf deine Internetverbindung. Wenn du einen
                                            Werbeblocker nutzt, schalte ihn für diese Seite aus – deine Angaben bleiben erhalten.
                                        </p>
                                        <button class="btn btn--secondary ko__retry" type="button" @click="mountStripe">
                                            Noch einmal laden
                                        </button>
                                    </div>
                                </div>

                                <!--
                                    §312j Abs. 2 BGB: directly above the button, what is bought, what it costs in all,
                                    the shipping and the delivery time. Each wheel repeats its verdict.
                                -->
                                <section class="ko__final" aria-labelledby="ko-final-title">
                                    <h3 id="ko-final-title" class="t-h3">Deine Bestellung</h3>
                                    <ul class="ko__essentials">
                                        <li v-for="line in lines" :key="line.key" class="ko__essential">
                                            <p class="ko__essential-top">
                                                <span class="ko__essential-name">
                                                    <span class="tabular">{{ line.quantity }} ×</span>
                                                    {{ line.isSet ? 'Komplettrad' : 'Felge' }} {{ line.brandName }} {{ line.title }}
                                                </span>
                                                <span class="ko__essential-price tabular">{{ line.lineTotal }}</span>
                                            </p>
                                            <p class="ko__essential-spec">
                                                {{ line.subtitle }}<template v-if="line.sizeLabel"> · <span class="data">{{ line.sizeLabel }}</span></template
                                                ><template v-if="line.isSet && line.tyre">
                                                    · mit {{ line.tyre.brandName }} {{ line.tyre.name }}
                                                    <span class="data">{{ line.tyre.sizeLabel }}</span></template
                                                >
                                            </p>
                                            <template v-if="line.verdict">
                                                <p class="ko__verdict"><VerdictBadge :status="line.verdict.status" :notes-only="line.verdict.notesOnly === true" /> <span>{{ verdictSentence(line) }}</span></p>
                                                <details v-if="line.verdict.conditions.length" class="ko__auflagen">
                                                    <summary>Auflagen lesen</summary>
                                                    <ConditionGroups v-if="line.verdict.conditionGroups" class="ko__groups" :groups="line.verdict.conditionGroups" />
                                                    <ul v-else class="ko__conditions">
                                                        <li v-for="condition in line.verdict.conditions" :key="condition">
                                                            {{ condition }}
                                                        </li>
                                                    </ul>
                                                </details>
                                            </template>
                                        </li>
                                        <li v-if="tpms && tpms.choice === 'ja'" class="ko__essential">
                                            <p class="ko__essential-top">
                                                <span class="ko__essential-name">RDKS-Sensoren ({{ tpms.line }})</span>
                                                <span class="ko__essential-price tabular">{{ tpms.total }}</span>
                                            </p>
                                        </li>
                                    </ul>

                                    <dl class="ko__terms">
                                        <div class="ko__term">
                                            <dt>Versand</dt>
                                            <dd :class="{ tabular: !shippingOpen }">{{ shippingLabel }}</dd>
                                        </div>
                                        <div class="ko__term">
                                            <dt>Lieferzeit</dt>
                                            <dd>{{ deliveryTime ?? 'wird noch festgelegt' }}</dd>
                                        </div>
                                        <div class="ko__term ko__term--total">
                                            <dt>Gesamt</dt>
                                            <dd class="tabular">{{ totals.total }}</dd>
                                        </div>
                                    </dl>
                                    <p class="price-legal">{{ totalNote(terms.smallBusiness, totals.tax, shippingOpen) }}</p>

                                    <p v-if="payError" class="ko__refusal ko__refusal--bad" role="alert">{{ payError }}</p>

                                    <!-- §312j Abs. 3 BGB: the button states the obligation to pay, in these words. -->
                                    <button
                                        class="btn btn--primary btn--lg btn--block ko__pay"
                                        type="submit"
                                        :disabled="Boolean(orderRefusal) || paying || (Boolean(payment) && !stripeReady)"
                                        :aria-busy="paying ? 'true' : undefined"
                                        :aria-describedby="orderRefusal ? 'ko-refusal' : undefined"
                                    >
                                        Zahlungspflichtig bestellen
                                    </button>
                                    <p v-if="serverRefusal" class="ko__refusal ko__refusal--after" role="alert">
                                        {{ serverRefusal }}
                                    </p>
                                    <!-- Only with a shipping price: until then the total is not the whole amount. -->
                                    <p v-if="!shippingOpen" class="t-small quiet ko__final-note">
                                        Von uns kommen keine weiteren Kosten dazu.
                                    </p>
                                    <p v-if="needsEntry" class="t-small quiet ko__final-note">
                                        Die Gebühren für die Abnahme und, wo nötig, die Eintragung sind nicht im Preis enthalten – sie berechnen Prüfstelle und Zulassungsstelle.
                                    </p>
                                    <!-- One sentence, the links inline: no loose separator dots when the line wraps. -->
                                    <p class="t-small ko__legal-links">
                                        Es gelten unsere <Link href="/rechtliches/agb">AGB</Link>; zu deinem Widerrufsrecht die
                                        <Link href="/rechtliches/widerrufsbelehrung">Widerrufsbelehrung</Link> mit dem
                                        <Link href="/rechtliches/widerrufsformular">Muster-Widerrufsformular</Link>, zu deinen Daten die
                                        <Link href="/rechtliches/datenschutz">Datenschutzerklärung</Link>.
                                    </p>
                                </section>

                                <div class="ko__actions">
                                    <button class="btn btn--secondary" type="button" @click="goTo(2)">Zurück</button>
                                </div>
                            </template>
                        </template>
                    </form>
                </div>
            </template>
        </div>
    </section>
</template>

<style scoped>
.ko__steps {
    margin: var(--space-5) 0 0;
    padding: 0;
    list-style: none;
}

.ko__steps .steps__num :deep(svg) {
    width: 14px;
    height: 14px;
}

.ko {
    display: grid;
    gap: var(--space-5);
    margin-top: var(--space-5);
    align-items: start;
}

/* ── Summary ──────────────────────────────────────────────────────────────── */

.ko__sum {
    min-width: 0;
    padding: 0;
}

.ko__sum-toggle {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
    min-height: 56px;
    padding: var(--space-3) var(--space-4);
    background: transparent;
    border: 0;
    color: var(--ink);
    font-weight: 700;
    text-align: left;
    cursor: pointer;
}

.ko__sum-total {
    margin-left: auto;
    font-family: var(--mono);
}

.ko__chev {
    display: inline-flex;
    color: var(--ink2);
    transition: transform var(--duration-base) var(--ease-in-out);
}

.ko__chev--open {
    transform: rotate(180deg);
}

.ko__sum-body {
    display: none;
    padding: 0 var(--space-4) var(--space-4);
}

.ko__sum-body.is-open {
    display: block;
}

.ko__sum-title {
    padding-top: var(--space-4);
    border-top: 1px solid var(--line);
}

.ko__lines {
    margin: var(--space-3) 0 0;
    padding: 0;
    list-style: none;
}

.ko__line {
    padding-block: var(--space-3);
    border-bottom: 1px solid var(--line-s);
}

.ko__line-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
}

.ko__line-name {
    min-width: 0;
    font-weight: 700;
}

.ko__line-price {
    flex: none;
    font-family: var(--mono);
    font-weight: 500;
}

.ko__line-sub {
    margin-top: var(--space-1);
    font-size: var(--text-small);
    color: var(--ink2);
}

.ko__line-flag {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-2);
}

/* Stripe in Testmodus: said once, at the top, in the warning tint the admin uses for the same fact. */
.ko__testmode {
    margin-top: var(--space-3);
    padding: var(--space-2) var(--space-4);
    background: var(--warn-w);
    color: var(--warn);
    font-size: var(--text-small);
    font-weight: 700;
}

/* The verdict in its house form (VerdictBadge, R-07), its sentence beside it. */
.ko__verdict {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1) var(--space-2);
    margin-top: var(--space-2);
    font-size: var(--text-small);
    color: var(--ink);
}

.ko__auflagen {
    margin-top: var(--space-1);
    font-size: var(--text-small);
}

.ko__auflagen summary {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--blue);
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
}

.ko__groups {
    margin-top: var(--space-2);
    font-size: var(--text-small);
}

.ko__conditions {
    display: grid;
    gap: var(--space-1);
    margin: 0;
    padding-left: var(--space-4);
    font-size: var(--text-small);
    color: var(--ink);
}

/* A Komplettrad's components, repeated in the summary. */
.ko__parts {
    display: grid;
    gap: var(--space-1);
    margin: var(--space-2) 0 0;
    font-size: var(--text-small);
}

.ko__part {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
}

.ko__part dt {
    color: var(--ink2);
}

.ko__part dd {
    margin: 0;
    font-family: var(--mono);
    font-weight: 500;
    white-space: nowrap;
}

.ko__part dd.ko__part--open {
    font-family: var(--sans);
    color: var(--ink3);
}

.sum {
    margin: var(--space-3) 0 var(--space-2);
}

.sum__row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
    padding-block: var(--space-1);
}

.sum__row dt {
    color: var(--ink2);
}

.sum__row dd {
    margin: 0;
    font-family: var(--mono);
    font-weight: 500;
}

.sum__row--total {
    margin-top: var(--space-2);
    padding-top: var(--space-3);
    border-top: 2px solid var(--border-strong);
}

.sum__row--total dt,
.sum__row--total dd {
    color: var(--ink);
    font-size: var(--text-h3);
    font-weight: 700;
}

/* ── Form ─────────────────────────────────────────────────────────────────── */

.ko__form {
    min-width: 0;
    padding: var(--space-4);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
}

.ko__step-title:focus {
    outline: none;
}

.ko__group {
    margin: var(--space-5) 0 0;
    padding: 0;
    border: 0;
    min-width: 0;
}

.ko__group legend {
    padding: 0;
    margin-bottom: var(--space-3);
}

.ko__grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 0 var(--space-3);
}

.ko__wide {
    grid-column: 1 / -1;
}

.ko__half {
    grid-column: 1 / -1;
}

.ko__street {
    grid-column: span 4;
}

.ko__nr {
    grid-column: span 2;
}

.ko__zip {
    grid-column: span 2;
}

.ko__city {
    grid-column: span 4;
}

/* Two small helpers under a field: letters for the Hausnummer, the places under a PLZ. */
.ko__letters,
.ko__place {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0;
    background: none;
    border: 0;
    color: var(--blue);
    font: inherit;
    font-size: var(--text-small);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
}

.ko__places {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 var(--space-3);
}

.ko__place {
    font-weight: 500;
}

.ko__places-lead {
    flex-basis: 100%;
    margin-top: var(--space-1);
}

/* The number pad's way out matters only where there is a number pad. */
.ko__letters {
    display: none;
}

@media (pointer: coarse) {
    .ko__letters {
        display: inline-flex;
    }
}

.ko__source {
    flex-basis: 100%;
    font-size: var(--text-micro);
    color: var(--ink3);
}

.ko__static {
    display: flex;
    align-items: center;
    min-height: 44px;
    color: var(--ink2);
}

.ko__check {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-height: 44px;
    cursor: pointer;
}

.ko__check input,
.ko__option input {
    flex: none;
    width: 18px;
    height: 18px;
    margin: 0;
    accent-color: var(--blue);
}

.ko__billing {
    margin-top: var(--space-3);
}

.ko__option {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-height: 64px;
    padding: var(--space-3) var(--space-4);
    border: 2px solid var(--border-strong);
    border-radius: var(--radius-sm);
    cursor: pointer;
}

.ko__option-text {
    min-width: 0;
}

.ko__option-name {
    display: block;
    font-weight: 700;
}

.ko__option-price {
    margin-left: auto;
    font-family: var(--mono);
    font-weight: 500;
}

/* ── RDKS ─────────────────────────────────────────────────────────────────── */

.ko__rdks-q {
    font-weight: 700;
}

.ko__rdks-help {
    margin-top: var(--space-1);
    color: var(--ink2);
    max-width: 60ch;
}

/* Fails closed, in words: readable, not an error colour. */
.ko__rdks-notice {
    margin-top: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border-left: 3px solid var(--border-strong);
    background: var(--band);
    color: var(--ink);
    max-width: 60ch;
}

.ko__rdks-mail {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    font-weight: 700;
}

.opt {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--space-3);
    margin-top: var(--space-3);
}

.opt:focus {
    outline: none;
}

/* The whole tile is the control; the radio stays for the keyboard and the screen reader. */
.opt__tile {
    position: relative;
    display: grid;
    gap: var(--space-1);
    min-height: 64px;
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    background: var(--surface);
    cursor: pointer;
    transition:
        border-color var(--duration-instant) var(--ease-standard),
        background-color var(--duration-instant) var(--ease-standard);
}

.opt__tile--on {
    padding: calc(var(--space-3) - 1px) calc(var(--space-4) - 1px);
    border: 2px solid var(--blue);
    background: var(--wash);
}

.opt__tile:focus-within {
    outline: 2px solid var(--blue);
    outline-offset: 2px;
}

@media (hover: hover) and (pointer: fine) {
    .opt__tile:hover {
        border-color: var(--border-strong);
    }

    .opt__tile--on:hover {
        border-color: var(--blue);
    }
}

.opt__name {
    padding-right: var(--space-5);
    font-weight: 700;
    color: var(--ink);
}

.opt__price {
    font-family: var(--mono);
    font-weight: 500;
    color: var(--ink);
    white-space: nowrap;
}

.opt__sub {
    font-size: var(--text-small);
    color: var(--ink2);
}

.opt__check {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
    display: none;
    color: var(--blue);
}

.opt__tile--on .opt__check {
    display: inline-flex;
}

.ko__recap {
    margin: 0 0 var(--space-5);
    border-top: 1px solid var(--line);
}

.ko__recap-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-1) var(--space-3);
    align-items: center;
    padding-block: var(--space-3);
    border-bottom: 1px solid var(--line);
}

.ko__recap-row dt {
    grid-column: 1;
}

.ko__recap-row dd {
    grid-column: 1;
    margin: 0;
}

.ko__change {
    grid-column: 2;
    grid-row: 1 / span 2;
}

.ko__recap-mail {
    display: block;
    font-size: var(--text-small);
    color: var(--ink2);
}

.ko__recap-line {
    display: block;
}

/* Why no order can be placed: a quiet, readable statement, not an error colour. */
.ko__refusal {
    margin-top: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border-left: 3px solid var(--border-strong);
    background: var(--band);
    color: var(--ink);
}

.ko__refusal--after {
    margin-top: var(--space-3);
}

.ko__sandbox {
    margin-top: var(--space-3);
    white-space: normal;
}

/* ── Paying ───────────────────────────────────────────────────────────────── */

.ko__pay-methods {
    margin-top: var(--space-4);
}

/* Kept for Apple Pay and Google Pay before Stripe answers; folded away where the device offers neither. */
.ko__express {
    min-height: 48px;
}

.ko__express--empty {
    min-height: 0;
}

.ko__or {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-block: var(--space-4);
    font-size: var(--text-small);
    color: var(--ink2);
}

.ko__or::before,
.ko__or::after {
    content: '';
    flex: 1;
    border-top: 1px solid var(--line);
}

/* The Payment Element's frame grows into this; the height keeps the page still while it loads. */
.ko__payment {
    min-height: 120px;
}

.ko__loading {
    margin-top: calc(-1 * var(--space-6));
}

.ko__retry {
    margin-top: var(--space-3);
}

.ko__final {
    margin-top: var(--space-5);
    padding-top: var(--space-4);
    border-top: 2px solid var(--border-strong);
}

.ko__essentials {
    margin: var(--space-3) 0 0;
    padding: 0;
    list-style: none;
}

.ko__essential {
    padding-block: var(--space-3);
    border-bottom: 1px solid var(--line-s);
}

.ko__essential-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
}

.ko__essential-name {
    min-width: 0;
    font-weight: 700;
}

.ko__essential-price {
    flex: none;
    font-family: var(--mono);
    font-weight: 500;
}

.ko__essential-spec {
    margin-top: var(--space-1);
    font-size: var(--text-small);
    color: var(--ink2);
}

.ko__terms {
    margin: var(--space-3) 0 var(--space-2);
}

.ko__term {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
    padding-block: var(--space-1);
}

.ko__term dt {
    color: var(--ink2);
}

.ko__term dd {
    margin: 0;
    text-align: right;
}

.ko__term dd.tabular {
    font-family: var(--mono);
    font-weight: 500;
}

.ko__term--total {
    margin-top: var(--space-2);
    padding-top: var(--space-3);
    border-top: 2px solid var(--border-strong);
}

.ko__term--total dt,
.ko__term--total dd {
    color: var(--ink);
    font-size: var(--text-h3);
    font-weight: 700;
}

.ko__refusal--bad {
    border-left-color: var(--danger);
}

.ko__pay {
    margin-top: var(--space-4);
}

.ko__final-note {
    margin-top: var(--space-2);
}

.ko__legal-links {
    margin-top: var(--space-2);
    color: var(--ink2);
    max-width: 60ch;
}

.ko__legal-links a {
    font-weight: 500;
}

.ko__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-top: var(--space-6);
}

/* On a phone the step's buttons run full width, the forward one first. */
.ko__actions .btn {
    flex: 1 1 100%;
}

/* A phone: the street takes its own row, Hausnummer and PLZ share the next — nothing squeezed to a sliver. */
@media (max-width: 639px) {
    .ko__street,
    .ko__city {
        grid-column: 1 / -1;
    }

    .ko__nr,
    .ko__zip {
        grid-column: span 3;
    }
}

@media (min-width: 640px) {
    .ko__form {
        padding: var(--space-6);
    }

    .ko__half {
        grid-column: span 3;
    }

    .ko__actions .btn {
        flex: 0 0 auto;
    }
}

@media (min-width: 1200px) {
    .ko {
        grid-template-columns: minmax(0, 1fr) 380px;
        gap: var(--space-7);
    }

    .ko__sum {
        order: 2;
        position: sticky;
        top: calc(var(--header-h) + var(--space-5));
        padding: var(--space-5);
    }

    .ko__sum-toggle {
        display: none;
    }

    .ko__sum-body,
    .ko__sum-body.is-open {
        display: block;
        padding: 0;
    }

    .ko__sum-title {
        padding-top: 0;
        border-top: 0;
    }
}
</style>
