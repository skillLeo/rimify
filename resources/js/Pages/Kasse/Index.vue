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
 * Nothing binding happens yet (ACCURACY.md D4): every step can be walked, and `orderRefusal` is
 * the sentence the server answers a submission with — a demo line, an unconfigured shipping
 * price, or no payment yet. It is shown above the final button, which stays disabled while it
 * stands. No carrier, no delivery time, no payment provider is named: none is confirmed (D7).
 */

import { Head, Link, router } from '@inertiajs/vue3'
import { computed, nextTick, reactive, ref } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import Icon from '../../Components/Art/Icon.vue'
import { useShared } from '../../composables/useShared'
import type { BasketLine, BasketTotals, ContactProp } from '../../types/rimify'

defineOptions({ layout: AppLayout, inheritAttrs: false })

const props = defineProps<{
    lines: (BasketLine & { demo?: boolean })[]
    totals: BasketTotals & { shippingConfigured?: boolean }
    contact: ContactProp
    /** Why an order cannot be placed right now, or null. */
    orderRefusal?: string | null
}>()

const shared = useShared()
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

const REQUIRED: [keyof typeof form, string][] = [
    ['email', 'Bitte gib deine E-Mail-Adresse an.'],
    ['name', 'Bitte gib deinen vollständigen Namen an.'],
    ['street', 'Bitte gib die Straße an.'],
    ['houseNumber', 'Bitte gib die Hausnummer an.'],
    ['zip', 'Bitte gib die PLZ an.'],
    ['city', 'Bitte gib den Ort an.'],
]

const BILLING_REQUIRED: [keyof typeof form, string][] = [
    ['billingName', 'Bitte gib den Namen für die Rechnung an.'],
    ['billingStreet', 'Bitte gib die Straße an.'],
    ['billingHouseNumber', 'Bitte gib die Hausnummer an.'],
    ['billingZip', 'Bitte gib die PLZ an.'],
    ['billingCity', 'Bitte gib den Ort an.'],
]

/** Checks the address step. Errors name the fix, and the first broken field takes the focus. */
function validateAddress(): boolean {
    for (const key of Object.keys(errors)) {
        delete errors[key]
    }

    const rules = form.billingSame ? REQUIRED : [...REQUIRED, ...BILLING_REQUIRED]

    for (const [key, message] of rules) {
        if (String(form[key]).trim() === '') {
            errors[key] = message
        }
    }

    if (!errors.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        errors.email = 'Diese E-Mail-Adresse ist unvollständig – sie braucht ein @ und eine Domain.'
    }

    if (!errors.zip && !/^\d{5}$/.test(form.zip.trim())) {
        errors.zip = 'Eine deutsche PLZ hat fünf Ziffern.'
    }

    if (!form.billingSame && !errors.billingZip && !/^\d{5}$/.test(form.billingZip.trim())) {
        errors.billingZip = 'Eine deutsche PLZ hat fünf Ziffern.'
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

/*
 * The button validates the whole checkout one last time, then asks the server, which decides
 * (R-11). While the page already knows the answer is no, the button is disabled and says why.
 */
function submit(): void {
    if (!validateAddress()) {
        goTo(1)

        return
    }

    if (!validateOptions()) {
        goTo(2)

        return
    }

    if (props.orderRefusal) {
        return
    }

    // The RDKS answer travels with the submission, so the server has one source of truth at
    // submit time (§5.3) — and only where the question was asked at all.
    const payload = tpmsApplicable.value
        ? { ...form, rdks: tpms.value?.choice ?? null }
        : { ...form }

    router.post('/kasse', payload, {
        preserveScroll: true,
        preserveState: true,
        onError: (failed: Record<string, string>) => {
            serverRefusal.value = failed.order ?? null

            for (const [key, message] of Object.entries(failed)) {
                if (key !== 'order') {
                    errors[key] = message
                }
            }

            // The question is on step 2: show the sentence where the answer is given.
            if (failed.rdks) {
                goTo(2)
            }
        },
    })
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

/** The Eintragung line, unless an Auflage on the line already says it in full. */
function showsEntry(line: BasketLine): boolean {
    return line.verdict?.requiresEntry === true && !line.verdict.conditions.some((c) => c.includes('Eintragung'))
}

const VERDICT_TONE: Record<string, string> = {
    PERMITTED: 'tag--ok',
    CONDITIONAL: 'tag--warn',
    NOT_PERMITTED: 'tag--danger',
    UNKNOWN: 'tag--unknown',
}
</script>

<template>
    <Head title="Kasse" />

    <section class="section-dense">
        <div class="wrap">
            <h1 class="t-h1">Kasse</h1>

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
                            <h2 id="ko-sum-title" class="t-h3 ko__sum-title">Deine Bestellung</h2>

                            <ul class="ko__lines">
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
                                    <p v-if="line.verdict || line.demo !== false" class="ko__line-flag">
                                        <span v-if="line.demo !== false" class="tag tag--unknown">Beispielsortiment</span>
                                        <span
                                            v-if="line.verdict"
                                            class="tag"
                                            :class="VERDICT_TONE[line.verdict.status] ?? 'tag--unknown'"
                                        >
                                            {{ line.verdict.label }}
                                        </span>
                                    </p>
                                    <p v-if="showsEntry(line)" class="ko__line-entry">
                                        Eintragung in die Fahrzeugpapiere erforderlich.
                                    </p>
                                    <ul v-if="line.verdict && line.verdict.conditions.length" class="ko__conditions">
                                        <li v-for="condition in line.verdict.conditions" :key="condition">
                                            {{ condition }}
                                        </li>
                                    </ul>
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
                            <p v-if="shippingOpen" class="price-legal">
                                inkl. {{ totals.tax }} MwSt. · Versandkosten werden noch festgelegt
                            </p>
                            <p v-else class="price-legal">inkl. {{ totals.tax }} MwSt. und Versand</p>
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
                                        />
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
                                            autocomplete="name"
                                            aria-describedby="ko-name-err"
                                            :aria-invalid="errors.name ? 'true' : undefined"
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
                                            autocomplete="address-line1"
                                            aria-describedby="ko-street-err"
                                            :aria-invalid="errors.street ? 'true' : undefined"
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
                                            autocomplete="address-line2"
                                            aria-describedby="ko-nr-err"
                                            :aria-invalid="errors.houseNumber ? 'true' : undefined"
                                        />
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
                                            maxlength="5"
                                            autocomplete="postal-code"
                                            aria-describedby="ko-zip-err"
                                            :aria-invalid="errors.zip ? 'true' : undefined"
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
                                            autocomplete="address-level2"
                                            aria-describedby="ko-city-err"
                                            :aria-invalid="errors.city ? 'true' : undefined"
                                        />
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
                                    <input v-model="form.billingSame" type="checkbox" />
                                    <span>Rechnungsadresse entspricht der Lieferadresse</span>
                                </label>

                                <div v-if="!form.billingSame" class="ko__grid ko__billing">
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
                                        />
                                        <span class="field-error">{{ errors.billingName ?? '' }}</span>
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
                                        />
                                        <span class="field-error">{{ errors.billingStreet ?? '' }}</span>
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
                                            autocomplete="billing address-line2"
                                            :aria-invalid="errors.billingHouseNumber ? 'true' : undefined"
                                        />
                                        <span class="field-error">{{ errors.billingHouseNumber ?? '' }}</span>
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
                                            maxlength="5"
                                            autocomplete="billing postal-code"
                                            :aria-invalid="errors.billingZip ? 'true' : undefined"
                                        />
                                        <span class="field-error">{{ errors.billingZip ?? '' }}</span>
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
                                        />
                                        <span class="field-error">{{ errors.billingCity ?? '' }}</span>
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
                                        Viele Autos zeigen den Reifendruck im Display an. Dafür sitzt in jedem Rad ein
                                        Sensor. Ob dein Auto das hat, steht in der Betriebsanleitung – oder du siehst es
                                        daran, ob dein Display dir den Reifendruck anzeigt.
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

                                <div class="ko__final">
                                    <p class="ko__final-total">
                                        <span>Gesamt</span>
                                        <span class="tabular">{{ totals.total }}</span>
                                    </p>
                                    <p v-if="shippingOpen" class="price-legal">
                                        inkl. {{ totals.tax }} MwSt. · Versandkosten werden noch festgelegt
                                    </p>
                                    <p v-else class="price-legal">inkl. {{ totals.tax }} MwSt. und Versand</p>

                                    <!-- §312j BGB: the button states the obligation to pay, in these words. -->
                                    <button
                                        class="btn btn--primary btn--lg btn--block ko__pay"
                                        type="submit"
                                        :disabled="Boolean(orderRefusal)"
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
                                        Für Abnahme und Eintragung berechnet die Prüfstelle eigene Gebühren.
                                    </p>
                                    <p class="t-small ko__legal-links">
                                        <Link href="/rechtliches/agb">AGB</Link>
                                        <span aria-hidden="true">·</span>
                                        <Link href="/rechtliches/widerrufsbelehrung">Widerrufsbelehrung</Link>
                                    </p>
                                </div>

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

.ko__line-entry {
    margin-top: var(--space-2);
    font-size: var(--text-small);
    font-weight: 700;
}

.ko__conditions {
    display: grid;
    gap: var(--space-1);
    margin: var(--space-2) 0 0;
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

.ko__final {
    margin-top: var(--space-5);
    padding-top: var(--space-4);
    border-top: 2px solid var(--border-strong);
}

.ko__final-total {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
    font-size: var(--text-h3);
    font-weight: 700;
}

.ko__final-total .tabular {
    font-family: var(--mono);
}

.ko__pay {
    margin-top: var(--space-4);
}

.ko__final-note {
    margin-top: var(--space-2);
}

.ko__legal-links {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-1);
}

.ko__legal-links a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
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
