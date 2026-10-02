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
import { computed, ref, watch } from 'vue'
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

/* ── The car ─────────────────────────────────────────────────────────────────── */

/* The selector is open with no car, after „Ändern“, and while the visitor drills through makes. */
const changing = ref(false)
const choosingVehicle = computed(() => vehicle.value === null || changing.value || props.selectedMake !== null)

/* ── The wheel: each choice a visit, so the address carries the question ─────── */

const wheelQuery = computed(() => ({ hersteller: props.chosen.brand, felge: props.chosen.wheel, groesse: props.chosen.size }))

/* Where the selector sends the visitor once the car is chosen: back here, with the wheel already chosen. */
const returnTo = computed(() => {
    const query = new URLSearchParams(
        Object.entries(wheelQuery.value).filter((entry): entry is [string, string | number] => entry[1] !== null).map(([k, v]) => [k, String(v)])
    ).toString()

    return query === '' ? '/rimify-check' : `/rimify-check?${query}`
})

function visit(query: Record<string, string | number | null>): void {
    const clean = Object.fromEntries(Object.entries(query).filter((entry): entry is [string, string | number] => entry[1] !== null && entry[1] !== ''))

    router.get('/rimify-check', clean, { preserveScroll: true, preserveState: true })
}

function onBrand(event: Event): void {
    visit({ hersteller: (event.target as HTMLSelectElement).value })
}

function onWheel(event: Event): void {
    visit({ hersteller: props.chosen.brand, felge: (event.target as HTMLSelectElement).value })
}

function onSize(event: Event): void {
    visit({ ...wheelQuery.value, groesse: Number((event.target as HTMLSelectElement).value) })
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

// A new answer brings its own tyres and options: the first tyre, the default colour, the answer already given.
watch(
    () => props.answer,
    () => {
        tyreId.value = offer.value?.tyres[0]?.id ?? null
        colourId.value = options.value?.colours.find((c) => c.isDefault)?.id ?? options.value?.colours[0]?.id ?? null
        rdks.value = options.value?.tpms.choice ?? null
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

const canBuy = computed(() => {
    const current = config.value

    if (current === null || !sellable.value || !current.inStock) {
        return false
    }

    return isSet.value ? tyre.value !== null && current.stockQty >= (offer.value?.quantity ?? 4) : true
})

const buyLabel = computed(() => {
    if (basket.processing) {
        return 'Wird hinzugefügt …'
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
        ? `Von dieser Felge haben wir nur noch ${current.stockQty} auf Lager – ein Komplettrad-Satz braucht ${needed}.`
        : null
})

const addError = computed(() => basket.errors.tyreVariantId ?? basket.errors.wheelConfigId ?? basket.errors.rdks ?? basket.errors.quantity ?? null)

/* A refusal belongs to the choice it was made under: another answer, mode, tyre or colour starts clean (PDP-09). */
watch([() => props.answer, mode, tyreId, colourId], () => basket.clearErrors())

/* „Jetzt kaufen“: exactly this combination into the basket, then the basket. */
function buy(): void {
    const current = config.value

    if (current === null || !canBuy.value || basket.processing) {
        return
    }

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
                router.visit('/warenkorb')
            }
        },
    })
}

const productHref = computed(() => {
    const answer = props.answer

    return answer === null ? '/felgen' : `/felgen/${answer.product.slug}?ausfuehrung=${answer.product.finishId}`
})

/* Why there is nothing to buy, in the verdict's own terms; the panel beside it says the rest. */
const noSale = computed(() => {
    switch (config.value?.verdict?.status) {
        case 'NOT_PERMITTED':
            return 'In dieser Größe ist die Felge für dein Auto nicht freigegeben – deshalb bieten wir sie dir dafür nicht an.'
        default:
            return 'Eine Freigabe dieser Felge für dein Auto können wir nicht belegen – deshalb bieten wir sie dir dafür nicht an.'
    }
})

const askHref = computed(() =>
    contactHref({ subject: props.answer ? `RIMIFY-Check: ${props.answer.product.brandName} ${props.answer.product.modelName}` : 'RIMIFY-Check', from: page.url })
)

/* The page's address is the answer: whoever opens it sees this car, this wheel, this size. */
async function copyLink(): Promise<void> {
    try {
        await navigator.clipboard.writeText(window.location.href)
        toast.show({ text: 'Link kopiert – wer ihn öffnet, sieht genau diese Antwort.' })
    } catch {
        toast.show({ text: 'Kopieren ging gerade nicht. Die Adresse oben im Browser führt zu genau dieser Antwort.', icon: 'info' })
    }
}

/*
 * What a result can say. Four states, never a yes/no, and "no document" is not "not permitted"
 * (R-07) — so the page explains the difference before anyone meets it.
 */
const STATES: { status: VerdictStatus; text: string }[] = [
    {
        status: 'PERMITTED',
        text: 'Das Gutachten deckt dein Fahrzeug in dieser Größe ab. Wir nennen die Gutachten-Nummer und ob eine Eintragung nötig ist.',
    },
    {
        status: 'CONDITIONAL',
        text: 'Zulässig unter Bedingungen aus dem Gutachten, etwa nur mit bestimmten Radschrauben. Jede Auflage steht als ganzer Satz da.',
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
                Wähl dein Auto und die Felge. Du bekommst eine Antwort für dein Auto und genau diese Felge – mit dem Gutachten,
                seinen Auflagen und der Seite, auf der es steht.
            </p>

            <div class="chk__pick">
                <!-- 1 · The car. -->
                <section class="chk__step" aria-labelledby="chk-car-h">
                    <h2 id="chk-car-h" class="chk__step-h">Dein Auto</h2>

                    <div v-if="!choosingVehicle && vehicle" class="chk__car">
                        <div class="chk__car-text">
                            <p class="chk__vehicle">{{ vehicle.label }}</p>
                            <p class="data">{{ vehicle.approval ?? `${vehicle.keyNumbers} · ${vehicle.buildWindow}` }}</p>
                        </div>
                        <button class="btn btn--quiet" type="button" @click="changing = true">
                            Ändern<span class="visually-hidden"> (Fahrzeug)</span>
                        </button>
                    </div>

                    <VehicleSelector
                        v-else
                        :makes="makes"
                        :models="models"
                        :variants="variants"
                        :selected-make="selectedMake"
                        :selected-model="selectedModel"
                        base-path="/rimify-check"
                        :base-query="wheelQuery"
                        :return-to="returnTo"
                        compact
                    />
                </section>

                <!-- 2 · The wheel: Hersteller, Felge, Ausführung und Größe. -->
                <section class="chk__step" aria-labelledby="chk-wheel-h">
                    <h2 id="chk-wheel-h" class="chk__step-h">Deine Felge</h2>

                    <div class="chk__fields">
                        <div class="form-field">
                            <label class="form-field__label" for="chk-brand">Hersteller</label>
                            <select id="chk-brand" class="input" :value="chosen.brand ?? ''" @change="onBrand">
                                <option value="" disabled>Hersteller wählen</option>
                                <option v-for="brand in wheelBrands" :key="brand.slug" :value="brand.slug">{{ brand.name }}</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" for="chk-wheel">Felge</label>
                            <select id="chk-wheel" class="input" :value="chosen.wheel ?? ''" :disabled="wheelModels.length === 0" @change="onWheel">
                                <option value="" disabled>{{ chosen.brand ? 'Felge wählen' : 'Zuerst den Hersteller' }}</option>
                                <option v-for="model in wheelModels" :key="model.slug" :value="model.slug">{{ model.name }}</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" for="chk-size">Ausführung und Größe</label>
                            <select id="chk-size" class="input" :value="chosen.size ?? ''" :disabled="wheelSizes.length === 0" @change="onSize">
                                <option value="" disabled>{{ chosen.wheel ? 'Größe wählen' : 'Zuerst die Felge' }}</option>
                                <option v-for="size in wheelSizes" :key="size.id" :value="size.id">{{ size.label }}</option>
                            </select>
                        </div>
                    </div>

                    <!-- A shared link that outlived its wheel or its size: said, with the way on. -->
                    <p v-if="notFound" class="notice chk__lost" role="status">
                        <Icon name="info" :size="20" />
                        <span>{{ notFound === 'wheel' ? 'Die Felge aus dem Link gibt es bei uns nicht mehr. Wähl einen Hersteller und eine andere Felge.' : 'Die Größe aus dem Link gibt es bei dieser Felge nicht mehr. Wähl eine der Größen oben.' }}</span>
                    </p>
                </section>
            </div>

            <!-- 3 · The answer, for exactly this pair. -->
            <section v-if="answer && config && vehicle" id="antwort" class="chk__answer" aria-labelledby="chk-answer-h">
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
                                :disabled="!canBuy"
                                :aria-busy="basket.processing ? 'true' : undefined"
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

/* The two choices side by side from 900, the car first, on the page's columns; one under the other below. */
.chk__pick {
    display: grid;
    gap: var(--sp-32) var(--gutter);
    margin-top: var(--sp-32);
}

@media (min-width: 900px) {
    .chk__pick {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        align-items: start;
    }
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

.chk__answer {
    display: grid;
    gap: var(--sp-16);
    margin-top: var(--sp-48);
    scroll-margin-top: calc(var(--header-h) + var(--vbar-h) + var(--sp-16));
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
