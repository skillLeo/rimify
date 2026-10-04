<script setup lang="ts">
/**
 * RIMIFY-Check (the client's #28): one question — „Passt diese Felge auf mein Auto?“ — and one answer for one pair.
 *
 * The car on the left, the wheel on the right (Hersteller, Felge, Ausführung und Größe), and below them the answer:
 * the verdict, every Auflage, the document and the page it stands on — the product page's own RIMIFY-Check panel,
 * fed the product page's own row for that size and that car (FelgenController::answerFor), so the two pages can never
 * disagree. Then „Jetzt kaufen“ for exactly that combination, with the Komplettrad beside it.
 *
 * Everything chosen lives in the address (`fahrzeug`, `hersteller`, `felge`, `groesse`): the page is the answer
 * whoever opens the link — the one a customer sends to a friend. Choosing the car here brings the visitor back here.
 *
 * One page for every width.
 */

import { Head, Link, router, useForm, usePage } from '@inertiajs/vue3'
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import BuyModeChoice from '../../Components/Product/BuyModeChoice.vue'
import FitmentDetail from '../../Components/Product/FitmentDetail.vue'
import FitmentPanel from '../../Components/Product/FitmentPanel.vue'
import KomplettradChoice from '../../Components/Product/KomplettradChoice.vue'
import Icon from '../../Components/Ui/Icon.vue'
import VerdictBadge from '../../Components/Ui/VerdictBadge.vue'
import VehicleSelector from '../../Components/Vehicle/VehicleSelector.vue'
import { toast } from '../../Components/Chrome/toast'
import { priceTerms } from '../../composables/usePriceTerms'
import { useShared } from '../../composables/useShared'
import { ABNAHME_REQUIRED, ENTRY_REQUIRED } from '../../fitment/papers'
import { contactHref } from '../../lib/contact'
import type { CheckProps } from '../../types/pages'
import type { VerdictStatus } from '../../types/rimify'

defineOptions({ layout: AppLayout, inheritAttrs: false })

const props = defineProps<CheckProps>()

const shared = useShared()
const page = usePage()
const vehicle = computed(() => shared.value.vehicle)
const terms = computed(() => priceTerms(shared.value.smallBusiness === true))

type Query = Record<string, string | number | null | undefined>

/* ── The car ─────────────────────────────────────────────────────────────────── */

/*
 * The selector is open with no car, after „Ändern“, and while the visitor drills through makes. „Ändern“ lives in the
 * address (`aendern=1`), so every drill step and „Zurück“ keep the selector open, and the car's return address —
 * which carries no `aendern` — closes it once a car is chosen (CHECK-01, -02).
 */
const choosingVehicle = computed(() => vehicle.value === null || props.changing === true || props.selectedMake !== null)

/* ── The wheel: each choice a visit, so the address carries the question ─────── */

const wheelQuery = computed<Query>(() => ({
    hersteller: props.chosen.brand,
    felge: props.chosen.wheel,
    ausfuehrung: props.chosen.finish ?? null,
    groesse: props.chosen.size,
}))

/* What a wheel choice keeps of the car: the drill under way and „Ändern“ (CHECK-15). */
const carQuery = computed<Query>(() => ({ marke: props.selectedMake, modell: props.selectedModel, aendern: props.changing ? 1 : null }))

/* What the selector's drill steps keep: the wheel, and „Ändern“. */
const selectorQuery = computed(() => clean({ ...wheelQuery.value, aendern: props.changing ? 1 : null }))

function clean(query: Query): Record<string, string | number> {
    return Object.fromEntries(Object.entries(query).filter((entry): entry is [string, string | number] => entry[1] !== null && entry[1] !== undefined && entry[1] !== ''))
}

/* Where the selector sends the visitor once the car is chosen: back here, with the wheel already chosen. */
const returnTo = computed(() => {
    const query = new URLSearchParams(Object.entries(clean(wheelQuery.value)).map(([k, v]) => [k, String(v)])).toString()

    return query === '' ? '/rimify-check' : `/rimify-check?${query}`
})

/*
 * Each choice is a visit, a beat after the last change: the arrow keys in a closed select fire `change` on every press
 * in some browsers, and one visit and one history entry per key would answer for sizes nobody chose (CHECK-12). While
 * a visit is under way the answer below is the old one: it says so, and nothing can be bought from it (CHECK-06).
 */
const VISIT_DELAY_MS = 300
const pending = ref(false)
const offline = ref(false)
/* Bumped when a visit fails: the selects are drawn again from what is answered, never left on what was not loaded. */
const fieldsKey = ref(0)
const announce = ref('')
let visitTimer: ReturnType<typeof setTimeout> | undefined

function visit(query: Query, opts: { delay?: number; reveal?: boolean } = {}): void {
    if (visitTimer !== undefined) {
        clearTimeout(visitTimer)
    }

    pending.value = true
    offline.value = false
    visitTimer = setTimeout(() => {
        visitTimer = undefined
        router.get('/rimify-check', clean(query), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                if (opts.reveal) {
                    void nextTick(revealAnswer)
                }
            },
            onNetworkError: () => {
                offline.value = true
                fieldsKey.value++

                return false
            },
            onFinish: () => {
                pending.value = false
            },
        })
    }, opts.delay ?? VISIT_DELAY_MS)
}

onBeforeUnmount(() => {
    if (visitTimer !== undefined) {
        clearTimeout(visitTimer)
    }
})

function onBrand(event: Event): void {
    visit({ ...carQuery.value, hersteller: (event.target as HTMLSelectElement).value })
}

function onWheel(event: Event): void {
    visit({ ...carQuery.value, hersteller: props.chosen.brand, felge: (event.target as HTMLSelectElement).value })
}

function onFinishChoice(event: Event): void {
    visit({ ...carQuery.value, ...wheelQuery.value, ausfuehrung: Number((event.target as HTMLSelectElement).value) }, { reveal: true })
}

function onSize(event: Event): void {
    visit({ ...carQuery.value, ...wheelQuery.value, groesse: Number((event.target as HTMLSelectElement).value) }, { reveal: true })
}

/* „Ändern“ opens the selector, „Abbrechen“ closes it on the car already chosen (CHECK-14); at once, not after a beat. */
function changeCar(): void {
    visit({ ...wheelQuery.value, aendern: 1 }, { delay: 0 })
}

function cancelChange(): void {
    visit(wheelQuery.value, { delay: 0 })
}

/* The focus goes where the step now is: the selector's heading when it opens, „Ändern“ once a car is chosen (CHECK-11). */
const carHeading = useTemplateRef<HTMLElement>('carHeading')
const changeButton = useTemplateRef<HTMLElement>('changeButton')

watch(choosingVehicle, (open) => {
    void nextTick(() => (open ? carHeading.value : changeButton.value)?.focus())
})

/*
 * A size chosen far above the answer on a phone: the answer is brought into view and its verdict said once, the focus
 * left on the select so another size is one key away (CHECK-19).
 */
function revealAnswer(): void {
    const answer = document.getElementById('antwort')

    if (answer === null || props.answer === null) {
        return
    }

    const verdict = props.answer.config.verdict?.label ?? ''
    announce.value = ''
    void nextTick(() => {
        announce.value = `Antwort für ${props.answer?.config.sizeLabel ?? ''}: ${verdict}`.trim()
    })

    if (answer.getBoundingClientRect().top > window.innerHeight * 0.8) {
        const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
        answer.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' })
    }
}

/* ── The answer and the purchase ─────────────────────────────────────────────── */

const config = computed(() => props.answer?.config ?? null)
const sellable = computed(() => config.value?.verdict?.sellable === true)

const mode = ref<'felgen' | 'komplettrad'>('felgen')
const isSet = computed(() => mode.value === 'komplettrad')
const offer = computed(() => config.value?.komplettrad ?? null)
const options = computed(() => props.answer?.komplettradOptions ?? null)

const tyreId = ref<number | null>(null)
const colourId = ref<number | null>(null)
const rdks = ref<'ja' | 'nein' | null>(null)

/*
 * A new answer brings its own tyres and options. What was chosen stays where the new answer still offers it — a refused
 * add comes back as a new answer object too, and its refusal belongs under the choice it was made under (CHECK-08).
 */
watch(
    () => props.answer,
    () => {
        const tyres = offer.value?.tyres.map((t) => t.id) ?? []
        const colours = options.value?.colours ?? []

        if (tyreId.value === null || !tyres.includes(tyreId.value)) {
            tyreId.value = tyres[0] ?? null
        }

        if (colourId.value === null || !colours.some((c) => c.id === colourId.value)) {
            colourId.value = colours.find((c) => c.isDefault)?.id ?? colours[0]?.id ?? null
        }

        rdks.value ??= options.value?.tpms.choice ?? null
    },
    { immediate: true }
)

const tyre = computed(() => offer.value?.tyres.find((t) => t.id === tyreId.value) ?? null)

/* `ab 965,00 € je Rad`: the server's lowest figure in the colour chosen, as on the product page (PDP-13). */
const setFrom = computed(() => {
    const priced = (offer.value?.tyres ?? []).map(
        (t) => t.prices?.find((p) => p.colourId === colourId.value) ?? { perWheel: t.perWheel, forFourCents: t.forFourCents }
    )

    return priced.length === 0 ? null : priced.reduce((low, p) => (p.forFourCents < low.forFourCents ? p : low)).perWheel
})

const setPrice = computed(() => {
    const current = tyre.value

    return current === null ? null : current.prices?.find((p) => p.colourId === colourId.value) ?? { perWheel: current.perWheel, forFour: current.forFour }
})

/* The rims of a car: four, or what is on the shelf where fewer are — priced by the server for that amount. */
const rimAmount = computed(() => Math.max(1, Math.min(4, config.value?.stockQty ?? 4)))
const rimPrice = computed(() => config.value?.amounts?.find((a) => a.quantity === rimAmount.value) ?? null)

const shownPrice = computed(() => (isSet.value ? setPrice.value?.forFour ?? null : rimPrice.value?.text ?? config.value?.price ?? null))

const shownNote = computed(() => {
    if (isSet.value) {
        return setPrice.value === null ? '' : `für ${offer.value?.quantity ?? 4} Kompletträder, je Rad ${setPrice.value.perWheel}, ${terms.value.note}`
    }

    return rimAmount.value === 1 ? `für 1 Felge, ${terms.value.note}` : `für ${rimAmount.value} Felgen, je ${config.value?.price ?? ''}, ${terms.value.note}`
})

const sensorLine = computed(() => {
    const tpms = options.value?.tpms

    return isSet.value && rdks.value === 'ja' && tpms?.available && tpms.yesTotal ? `+ ${tpms.yesTotal} für ${tpms.quantity} RDKS-Sensoren` : null
})

const basket = useForm({
    kind: 'WHEEL' as const,
    wheelConfigId: 0,
    tyreVariantId: null as number | null,
    weightColourId: null as number | null,
    rdks: null as 'ja' | 'nein' | null,
    quantity: 4,
})

/* After the add, the page is on its way to the basket: nothing more is bought from it (CHECK-07). */
const leaving = ref(false)

const canBuy = computed(() => {
    const current = config.value

    // Not while another size's answer loads: the one on screen is about to be replaced (CHECK-06).
    if (current === null || !sellable.value || !current.inStock || pending.value) {
        return false
    }

    return isSet.value ? tyre.value !== null && current.stockQty >= (offer.value?.quantity ?? 4) : true
})

const buyLabel = computed(() => {
    if (basket.processing || leaving.value) {
        return 'Wird hinzugefügt …'
    }

    if (pending.value) {
        return 'Antwort wird geladen …'
    }

    if (config.value !== null && !config.value.inStock) {
        return 'Ausverkauft'
    }

    if (isSet.value && (tyre.value === null || setShort.value !== null)) {
        return 'Komplettrad gerade nicht möglich'
    }

    return 'Jetzt kaufen'
})

/* A set needs as many rims as it has wheels: fewer on the shelf, and the button says why it cannot (#28 review). */
const setShort = computed(() => {
    const current = config.value
    const needed = offer.value?.quantity ?? 4

    return isSet.value && current !== null && current.inStock && current.stockQty < needed
        ? `Von dieser Felge haben wir nur noch ${current.stockQty} Stück auf Lager – für einen Satz Kompletträder brauchen wir ${needed}.`
        : null
})

/* Without a connection the add never reached us: said under the button, nothing in the basket (CHECK-09). */
const OFFLINE_ADD = 'Keine Verbindung – es wurde nichts in den Warenkorb gelegt. Versuch es gleich noch einmal.'
const buyOffline = ref(false)

const addError = computed(
    () => basket.errors.tyreVariantId ?? basket.errors.wheelConfigId ?? basket.errors.rdks ?? basket.errors.quantity ?? (buyOffline.value ? OFFLINE_ADD : null)
)

/*
 * A refusal belongs to the choice it was made under: another size, mode, tyre or colour starts clean (PDP-09). The size,
 * not the answer object — a refusal arrives as a new answer object for the same size (CHECK-08).
 */
watch([() => props.answer?.config.id, mode, tyreId, colourId], () => {
    basket.clearErrors()
    buyOffline.value = false
})

/* „Jetzt kaufen“: exactly this combination into the basket, then the basket. */
function buy(): void {
    const current = config.value

    if (current === null || !canBuy.value || basket.processing || leaving.value) {
        return
    }

    buyOffline.value = false
    basket.wheelConfigId = current.id
    basket.tyreVariantId = isSet.value ? (tyre.value?.id ?? null) : null
    basket.weightColourId = isSet.value ? colourId.value : null
    basket.rdks = isSet.value ? rdks.value : null
    basket.quantity = isSet.value ? (offer.value?.quantity ?? 4) : rimAmount.value
    basket.post('/warenkorb', {
        preserveScroll: true,
        // Only the add's own answer — this page again — leads on to the basket; an error page stays on screen.
        onSuccess: (next) => {
            if (next.component === 'Check/Index') {
                leaving.value = true
                router.visit('/warenkorb', {
                    onNetworkError: () => {
                        leaving.value = false

                        return false
                    },
                })
            }
        },
        onNetworkError: () => {
            buyOffline.value = true

            return false
        },
    })
}

/* The product page on the size answered, not only its finish (CHECK-13). */
const productHref = computed(() => {
    const answer = props.answer

    return answer === null ? '/felgen' : `/felgen/${answer.product.slug}?ausfuehrung=${answer.product.finishId}&groesse=${answer.config.id}`
})

/* Why there is nothing to buy, in the verdict's own terms; the panel beside it says the rest. */
const noSale = computed(() => {
    switch (config.value?.verdict?.status) {
        case 'NOT_PERMITTED':
            return 'In dieser Größe ist die Felge für dein Auto nicht freigegeben, deshalb bieten wir sie dafür nicht an.'
        default:
            return 'Eine Freigabe dieser Felge für dein Auto können wir nicht belegen, deshalb bieten wir sie dafür nicht an.'
    }
})

const askHref = computed(() =>
    contactHref({ subject: props.answer ? `RIMIFY-Check: ${props.answer.product.brandName} ${props.answer.product.modelName}` : 'RIMIFY-Check', from: page.url })
)

/*
 * The page's address is the question: whoever opens it sees this car, this wheel, this size. What the visitor typed
 * from their own papers stays in their browser and is not in the link, so the toast promises the question, not the
 * whole answer (CHECK-17).
 */
async function copyLink(): Promise<void> {
    try {
        await navigator.clipboard.writeText(window.location.href)
        toast.show({ text: 'Link kopiert – er führt zu diesem Auto mit dieser Felge. Angaben aus deinen Fahrzeugpapieren stehen nicht darin.' })
    } catch {
        toast.show({ text: 'Der Link ließ sich nicht kopieren. Kopier die Adresse oben im Browser – sie führt zu diesem Auto mit dieser Felge.', icon: 'info' })
    }
}

/*
 * What a result can say. Four states, never a yes/no, and "no document" is not "not permitted"
 * (R-07) — so the page explains the difference before anyone meets it.
 */
const STATES: { status: VerdictStatus; text: string }[] = [
    {
        status: 'PERMITTED',
        text: 'Das Gutachten deckt dein Fahrzeug in dieser Größe ab. Wir nennen dir die Gutachten-Nummer und sagen, ob eine Eintragung nötig ist.',
    },
    {
        status: 'CONDITIONAL',
        text: 'Zulässig unter den Bedingungen aus dem Gutachten, etwa nur mit bestimmten Radschrauben. Jede Auflage steht ausformuliert dabei.',
    },
    {
        status: 'NOT_PERMITTED',
        text: 'Das Gutachten deckt diese Größe für dein Fahrzeug nicht ab. Steht der Grund im Gutachten, nennen wir ihn.',
    },
    {
        status: 'UNKNOWN',
        text: 'Für diese Kombination liegt uns kein Gutachten vor. Das heißt nicht, dass die Felge unzulässig ist – nur, dass wir es nicht belegen können.',
    },
]
</script>

<template>
    <Head title="RIMIFY-Check" />

    <section class="section-dense">
        <div class="container chk">
            <h1 class="t-h1">Passt diese Felge auf mein Auto?</h1>
            <p class="t-lead chk__lead">
                Wähl dein Auto und die Felge. Du bekommst eine Antwort für genau diese Kombination – mit dem Gutachten, seinen
                Auflagen und der Seite, auf der das steht.
            </p>

            <!-- While the car is being chosen the selector takes the page's width: in half of it its rows ran out (CHECK-10). -->
            <div class="chk__pick" :class="{ 'chk__pick--choosing': choosingVehicle }">
                <!-- 1 · The car. -->
                <section class="chk__step" aria-labelledby="chk-car-h">
                    <h2 id="chk-car-h" ref="carHeading" class="chk__step-h" tabindex="-1">Dein Auto</h2>

                    <div v-if="!choosingVehicle && vehicle" class="chk__car">
                        <div class="chk__car-text">
                            <p class="chk__vehicle">{{ vehicle.label }}</p>
                            <p class="data">{{ vehicle.approval ?? `${vehicle.keyNumbers} · ${vehicle.buildWindow}` }}</p>
                        </div>
                        <button ref="changeButton" class="btn btn--quiet" type="button" @click="changeCar">
                            Ändern<span class="visually-hidden"> (Fahrzeug)</span>
                        </button>
                    </div>

                    <template v-else>
                        <VehicleSelector
                            :makes="makes"
                            :models="models"
                            :variants="variants"
                            :selected-make="selectedMake"
                            :selected-model="selectedModel"
                            base-path="/rimify-check"
                            :base-query="selectorQuery"
                            :return-to="returnTo"
                            compact
                        />
                        <!-- A change of mind keeps the car already chosen (CHECK-14). -->
                        <p v-if="vehicle" class="chk__cancel">
                            <button class="link" type="button" @click="cancelChange">Abbrechen – {{ vehicle.short }} behalten</button>
                        </p>
                    </template>
                </section>

                <!-- 2 · The wheel: Hersteller, Felge, Ausführung, Größe. Each option marked `selected` on the server too, so
                     the first frame of a shared link already shows its choice (CHECK-04). -->
                <section class="chk__step" aria-labelledby="chk-wheel-h">
                    <h2 id="chk-wheel-h" class="chk__step-h">Deine Felge</h2>

                    <!-- No wheel in the shop at all (an emptied test environment): said once, instead of four empty fields. -->
                    <p v-if="wheelBrands.length === 0" class="chk__none">
                        Noch ist keine Felge im Sortiment. Sobald die ersten freigegeben sind, prüfst du sie hier.
                        <Link :href="contactHref({ subject: 'Ich suche eine Felge', from: '/rimify-check' })">Schreib uns, welche du suchst</Link>.
                    </p>

                    <div v-else :key="fieldsKey" class="chk__fields">
                        <div class="form-field">
                            <label class="form-field__label" for="chk-brand">Hersteller</label>
                            <select id="chk-brand" class="input" :value="chosen.brand ?? ''" @change="onBrand">
                                <option value="" disabled :selected="!chosen.brand">Hersteller wählen</option>
                                <option v-for="brand in wheelBrands" :key="brand.slug" :value="brand.slug" :selected="brand.slug === chosen.brand">{{ brand.name }}</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" for="chk-wheel">Felge</label>
                            <select id="chk-wheel" class="input" :value="chosen.wheel ?? ''" :disabled="wheelModels.length === 0" @change="onWheel">
                                <option value="" disabled :selected="!chosen.wheel">{{ chosen.brand ? 'Felge wählen' : 'Zuerst den Hersteller' }}</option>
                                <option v-for="model in wheelModels" :key="model.slug" :value="model.slug" :selected="model.slug === chosen.wheel">{{ model.name }}</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" for="chk-finish">Ausführung</label>
                            <select id="chk-finish" class="input" :value="chosen.finish ?? ''" :disabled="(wheelFinishes ?? []).length === 0" @change="onFinishChoice">
                                <option value="" disabled :selected="!chosen.finish">{{ chosen.wheel ? 'Ausführung wählen' : 'Zuerst die Felge' }}</option>
                                <option v-for="finish in wheelFinishes ?? []" :key="finish.id" :value="finish.id" :selected="finish.id === chosen.finish">{{ finish.name }}</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" for="chk-size">Größe</label>
                            <select id="chk-size" class="input" :value="chosen.size ?? ''" :disabled="wheelSizes.length === 0" @change="onSize">
                                <option value="" disabled :selected="!chosen.size">{{ chosen.wheel ? 'Größe wählen' : 'Zuerst die Felge' }}</option>
                                <option v-for="size in wheelSizes" :key="size.id" :value="size.id" :selected="size.id === chosen.size">{{ size.label }}</option>
                            </select>
                        </div>
                    </div>

                    <!-- A size that could not be loaded: said, the choices back on what is answered (CHECK-09). -->
                    <p v-if="offline" class="notice notice--bad chk__lost" role="alert">
                        <Icon name="warning" :size="20" />
                        <span>Keine Verbindung – deine Auswahl konnte nicht geladen werden. Versuch es gleich noch einmal.</span>
                    </p>

                    <!-- A shared link that outlived its wheel or its size: said, with the way on. -->
                    <p v-if="notFound" class="notice chk__lost" role="status">
                        <Icon name="info" :size="20" />
                        <span>{{ notFound === 'wheel' ? 'Die Felge aus dem Link gibt es bei uns nicht mehr. Wähl einen Hersteller und eine andere Felge.' : 'Diese Felge gibt es in der Größe aus dem Link nicht mehr. Wähl oben eine andere Größe.' }}</span>
                    </p>
                </section>
            </div>

            <!-- The verdict of a size just chosen, said once without moving the focus (CHECK-19). -->
            <p class="visually-hidden" role="status" aria-live="polite">{{ announce }}</p>

            <!-- 3 · The answer, for exactly this pair. -->
            <section
                v-if="answer && config && vehicle"
                id="antwort"
                class="chk__answer"
                :class="{ 'chk__answer--pending': pending }"
                aria-labelledby="chk-answer-h"
                :aria-busy="pending ? 'true' : undefined"
            >
                <!-- Named for the outline; on screen the verdict's own headline leads. -->
                <h2 id="chk-answer-h" class="visually-hidden">Die Antwort</h2>
                <p class="chk__pair">
                    <span translate="no">{{ answer.product.brandName }} {{ answer.product.modelName }}</span> ·
                    <span translate="no">{{ answer.product.finishName }}</span> ·
                    <span class="tabular chk__size" translate="no">{{ config.sizeLabel }}</span>
                    <span class="chk__for"> für {{ vehicle.label }}</span>
                </p>

                <div class="chk__answer-grid">
                    <!-- The page's own address is the link to share; the panel's freeze only prints here. -->
                    <FitmentPanel :verdict="config.verdict ?? null" :vehicle="vehicle" :config-id="config.id" issue-label="RIMIFY-Check drucken" />

                    <div class="chk__buy">
                        <template v-if="sellable">
                            <BuyModeChoice v-model="mode" name="chk-mode" :rim-price="config.price" :set-from="setFrom" />

                            <KomplettradChoice
                                v-if="isSet && offer"
                                v-model="tyreId"
                                v-model:colour-id="colourId"
                                v-model:rdks="rdks"
                                :offer="offer"
                                :options="options"
                            />

                            <div v-if="shownPrice" class="chk__price">
                                <p class="price" translate="no">{{ shownPrice }}</p>
                                <p class="price-note">{{ shownNote }}</p>
                                <p v-if="sensorLine" class="price-note">{{ sensorLine }}</p>
                            </div>

                            <button
                                class="btn btn--primary btn--block btn--lg chk__go"
                                type="button"
                                :disabled="!canBuy && !basket.processing && !leaving"
                                :aria-busy="basket.processing || leaving ? 'true' : undefined"
                                @click="buy"
                            >
                                {{ buyLabel }}
                            </button>
                            <p v-if="setShort" class="price-note chk__why">{{ setShort }}</p>
                            <p v-if="addError" class="notice notice--bad chk__error" role="alert">
                                <Icon name="warning" :size="20" />
                                <span>{{ addError }}</span>
                            </p>
                        </template>

                        <div v-else class="notice chk__nosale">
                            <Icon name="info" :size="20" />
                            <div>
                                <p class="chk__nosale-text">{{ noSale }}</p>
                                <p class="chk__nosale-go">
                                    <Link href="/felgen" class="btn btn--secondary btn--sm">Passende Felgen für {{ vehicle.short }}</Link>
                                    <Link :href="askHref" class="link">Bei uns nachfragen</Link>
                                </p>
                            </div>
                        </div>

                        <p class="chk__more">
                            <Link :href="productHref" class="link">Alles zur Felge auf der Produktseite</Link>
                            <button class="link chk__copy" type="button" @click="copyLink">Link zu dieser Antwort kopieren</button>
                        </p>
                    </div>
                </div>

                <!-- Every Auflage in the document's own words; the papers' line is the verdict's (#21). -->
                <FitmentDetail
                    v-if="config.verdict?.detail"
                    :detail="config.verdict.detail"
                    :vehicle-label="vehicle.label"
                    :omit="[ENTRY_REQUIRED, ABNAHME_REQUIRED]"
                />
            </section>

            <p v-else-if="chosen.size && !vehicle" class="notice chk__ask">
                <Icon name="info" :size="20" />
                <span>Wähl oben dein Auto – dann prüfen wir genau diese Felge dafür.</span>
            </p>
        </div>
    </section>

    <!-- What the answer can be. A list, because the four states are compared, not browsed. -->
    <section class="section band">
        <div class="container">
            <h2 class="t-h2">Vier mögliche Ergebnisse</h2>
            <!-- The badges the shop shows everywhere, in the same words (DIRECTION §1). -->
            <dl class="chk__states">
                <div v-for="state in STATES" :key="state.status" class="chk__state">
                    <dt><VerdictBadge :status="state.status" /></dt>
                    <dd class="t-body">{{ state.text }}</dd>
                </div>
            </dl>
        </div>
    </section>
</template>

<style scoped>
.chk__lead {
    max-width: 60ch;
    margin-top: var(--sp-12);
    color: var(--c-ink-2);
}

/*
 * The two choices side by side from 900, the car first, on the page's columns; one under the other below — and while the
 * car is being chosen, when the selector needs the page's width for its own columns (CHECK-10).
 */
.chk__pick {
    display: grid;
    gap: var(--sp-32) var(--gutter);
    margin-top: var(--sp-32);
}

@media (min-width: 900px) {
    .chk__pick:not(.chk__pick--choosing) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        align-items: start;
    }
}

/* The heading takes the focus when the selector opens; a ring there would only flicker. */
.chk__step-h:focus {
    outline: none;
}

.chk__cancel {
    margin: 0;
}

/* An answer being replaced: it stays readable, quieter, and nothing in it is bought (CHECK-06). */
.chk__answer--pending {
    opacity: 0.55;
    transition: opacity var(--d-1) var(--ease-std);
}

/* Each choice under a divider, on the page's white (DIRECTION §2/§4: the band's tone is for tiles, fields and chips). */
.chk__step {
    display: grid;
    gap: var(--sp-16);
    min-width: 0;
    padding-top: var(--sp-24);
    border-top: 1px solid var(--c-line);
}

.chk__step-h {
    font-size: var(--fs-h4);
    line-height: var(--lh-h4);
    font-weight: 600;
}

.chk__none {
    max-width: 62ch;
    margin: var(--sp-12) 0 0;
    color: var(--c-ink-2);
}

/* The selector's own titles sit under the step's heading, never above it in size. */
.chk__step :deep(.vsel__title) {
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    font-weight: 600;
}

.chk__car {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--sp-16);
}

.chk__car-text {
    min-width: 0;
}

.chk__vehicle {
    font-weight: 600;
}

.chk__fields {
    display: grid;
    gap: var(--sp-8);
}

/* Brought into view under the header and the vehicle bar: the phone's header is the shorter one (CHECK-22). */
.chk__answer {
    display: grid;
    gap: var(--sp-16);
    margin-top: var(--sp-48);
    scroll-margin-top: calc(var(--header-h-m) + var(--vbar-h) + var(--sp-16));
}

@media (min-width: 1024px) {
    .chk__answer {
        scroll-margin-top: calc(var(--header-h) + var(--vbar-h) + var(--sp-16));
    }
}

.chk__pair {
    color: var(--c-ink-2);
}

.chk__pair > span:first-child {
    color: var(--c-ink);
    font-weight: 600;
}

/* A size is one figure: „8,5J × 19 · ET 35“ never breaks inside itself. */
.chk__size {
    white-space: nowrap;
}

/* The verdict is what the page answers: its headline leads the answer, a step above the price beside it. */
.chk__answer :deep(.rcheck-panel__vehicle) {
    font-size: var(--fs-h3);
    line-height: var(--lh-h3);
}

/* The answer beside the purchase from 900: the verdict on seven of the page's twelve columns, the purchase on five. */
.chk__answer-grid {
    display: grid;
    gap: var(--sp-32) var(--gutter);
}

@media (min-width: 900px) {
    .chk__answer-grid {
        grid-template-columns: repeat(12, minmax(0, 1fr));
        align-items: start;
    }

    .chk__answer-grid > :first-child {
        grid-column: 1 / span 7;
    }

    .chk__answer-grid > .chk__buy {
        grid-column: 8 / span 5;
    }
}

.chk__buy {
    display: grid;
    gap: var(--sp-24);
    min-width: 0;
}

.chk__price .price-note {
    margin-top: var(--sp-4);
}

.chk__error,
.chk__ask,
.chk__why,
.chk__lost {
    margin: 0;
}

/* The reason sits with the button it explains. */
.chk__why {
    margin-top: calc(-1 * var(--sp-16));
}

.chk__ask {
    margin-top: var(--sp-32);
}

.chk__nosale-text {
    margin: 0;
}

.chk__nosale-go {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-12) var(--sp-16);
    margin: var(--sp-12) 0 0;
}

.chk__more {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8) var(--sp-24);
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.chk__more .link {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
}

.chk__states {
    margin: var(--sp-24) 0 0;
    border-top: 1px solid var(--c-line);
}

.chk__state {
    display: grid;
    gap: var(--sp-8);
    padding-block: var(--sp-16);
    border-bottom: 1px solid var(--c-line);
}

.chk__state dd {
    max-width: 54ch;
    margin: 0;
    color: var(--c-ink-2);
}

@media (min-width: 900px) {
    .chk__state {
        grid-template-columns: 240px minmax(0, 1fr);
        gap: var(--sp-24);
        align-items: baseline;
    }
}
</style>
