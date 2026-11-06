<script setup lang="ts">
/**
 * The Komplettrad, step by step (the Gutachten rework §9): 1 Felge — the version from the product page —, 2 Reifen, as tiles with
 * pictures, filters and more on request, 3 Extras, nothing chosen for the customer, 4 Warenkorb. The address names the step, so Back
 * goes one step back and a link opens the step it names. What was chosen stays for this version in this browser's session.
 *
 * Nothing here decides whether a tyre may be fitted: only what the server sent is a card (TyreEligibility, R-13), and the basket asks
 * the engine again on the add (R-11). Every figure is the server's.
 */

import { Head, Link, router, useForm, usePage } from '@inertiajs/vue3'
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import FitmentDetail from '../../Components/Product/FitmentDetail.vue'
import FitmentPanel from '../../Components/Product/FitmentPanel.vue'
import KomplettradRefusal from '../../Components/Product/KomplettradRefusal.vue'
import ProductPhoto from '../../Components/Product/ProductPhoto.vue'
import ConditionGroups from '../../Components/Fitment/ConditionGroups.vue'
import Icon from '../../Components/Ui/Icon.vue'
import Picture, { type ImageManifest } from '../../Components/Ui/Picture.vue'
import StepBar from '../../Components/Ui/StepBar.vue'
import { usePriceTerms } from '../../composables/usePriceTerms'
import { claimBottomEdge } from '../../composables/useShell'
import { LINE_ROOM, countedDe, fitsWhole } from '../../fitment/auflagen'
import { ABNAHME_REQUIRED, ENTRY_REQUIRED } from '../../fitment/papers'
import { useShared } from '../../composables/useShared'
import { OFFLINE_ADD } from '../../lib/basketAdd'
import { contactHref } from '../../lib/contact'
import { formatMoney } from '../../lib/num'
import AppLayout from '../../Layouts/AppLayout.vue'
import type { KomplettradOptionsProp, ProduktConfig } from '../../types/pages'
import { extrasHint, filterCards, flowSum, freeStandardColour, initialExtras, offerOf, priceBands, sortCards, type Rdks, type TyreCardView, type TyreMode, type TyreSort } from './komplettradFlow'
import TyreCard from './parts/TyreCard.vue'
import TyreDetails from './parts/TyreDetails.vue'

defineOptions({ layout: AppLayout, inheritAttrs: false })

const props = defineProps<{
    product: {
        slug: string
        brandName: string
        modelName: string
        finishId: number
        finishName: string
        image: ImageManifest | null
        art: { finish: string; spokes: number }
    }
    config: ProduktConfig
    options: KomplettradOptionsProp | null
    photos: Record<string, ImageManifest[]>
    mounting: { each: string; total: string } | null
    schritt: number | null
    /** What the basket holds already, of Kompletträder: its wheels, for the one answer on the sensors, and its lines. */
    inBasket: { wheels: number; keys: string[] }
}>()

const STEPS = ['Felge', 'Reifen', 'Extras', 'Warenkorb']
/* Six in sight; the rest one press away, so the next step never drifts below a long list. */
const FIRST = 6
/* A combination per tile while they stay short of the tyres; a paper can list dozens (ABE 55255's V19 names 27). */
const PAIR_TILES = 8

const shared = useShared()
const terms = usePriceTerms()
const page = usePage()

const offer = computed(() => offerOf(props.config, props.photos))
const tpms = computed(() => props.options?.tpms ?? null)
const colours = computed(() => props.options?.colours ?? [])
const productHref = computed(() => `/felgen/${props.product.slug}?ausfuehrung=${props.product.finishId}&groesse=${props.config.id}`)
const canGoOn = computed(() => props.config.inStock && offer.value.refusal === null)

/* ── The choices ─────────────────────────────────────────────────────────────── */

const start = initialExtras()
const colourId = ref<number | null>(start.colourId)
const rdks = ref<Rdks>(start.rdks)
const chosenKey = ref<string | null>(null)
const mode = ref<TyreMode>(offer.value.same.length > 0 ? 'same' : 'mixed')
const pairKey = ref<string | null>(offer.value.pairs.find((pair) => pair.cards.length > 0)?.key ?? offer.value.pairs[0]?.key ?? null)

const pair = computed(() => offer.value.pairs.find((item) => item.key === pairKey.value) ?? null)
/* A real Gutachten's sentences run to paragraphs (D-197): printed whole they stood 4.000 px between a phone's customer and the tyres. */
const pairConditions = computed(() => {
    const answer = pair.value?.answer

    return answer ? [...answer.combination, ...answer.sizes.flatMap((size) => size.conditions)] : []
})
const pairFolded = computed(() => !fitsWhole(pairConditions.value, LINE_ROOM))
const inMode = computed<TyreCardView[]>(() => (mode.value === 'same' ? offer.value.same : (pair.value?.cards ?? [])))
const allCards = computed<TyreCardView[]>(() => [...offer.value.same, ...offer.value.pairs.flatMap((item) => item.cards)])
const chosen = computed(() => allCards.value.find((card) => card.key === chosenKey.value) ?? null)
const colour = computed(() => colours.value.find((item) => item.id === colourId.value) ?? null)
/* Without a colour picked the sum names the one the server puts in: the free standard colour (D-355). */
const standardColour = computed(() => freeStandardColour(colours.value))
const shownColour = computed(() => colour.value ?? standardColour.value)
const extrasOpen = computed(() => extrasHint(tpms.value, rdks.value, colours.value, colourId.value))

/* ── Step 2: the list ────────────────────────────────────────────────────────── */

const filter = reactive({ seasons: [] as string[], brands: [] as string[], band: '' })
/* On a phone the filters are one press away, so the first tyre stands near the top. Only there: from 600 px up they simply stand. */
const filtersOpen = ref(false)
const filterable = computed(() => seasons.value.length > 1 || brands.value.length > 1 || bands.value.length > 0)
const filtersOn = computed(() => filter.seasons.length + filter.brands.length + (filter.band === '' ? 0 : 1))
const sort = ref<TyreSort>('preis-auf')
const all = ref(false)
const count = ref<HTMLElement | null>(null)
const detailsKey = ref<string | null>(null)
const detailsOpen = ref(false)

const bands = computed(() => priceBands(inMode.value))
const seasons = computed(() => [...new Map(inMode.value.map((card) => [card.season, card.seasonLabel])).entries()])
const brands = computed(() => [...new Set(inMode.value.flatMap((card) => card.brands))].sort((a, b) => a.localeCompare(b, 'de')))
const list = computed(() => sortCards(filterCards(inMode.value, filter, bands.value), sort.value))
const shown = computed(() => {
    if (all.value || list.value.length <= FIRST) {
        return list.value
    }

    // The tyre chosen stays in sight even where it is not among the first ones.
    const first = list.value.slice(0, FIRST)
    const own = list.value.find((card) => card.key === chosenKey.value)

    return own && !first.includes(own) ? [...first.slice(0, FIRST - 1), own] : first
})
const details = computed(() => allCards.value.find((card) => card.key === detailsKey.value) ?? null)

/* `vorne 225/35 R19 · hinten 255/30 R19`, or one size on both. */
function pairLine(item: { sameSize?: boolean; front: string; rear: string }): string {
    return item.sameSize === true ? `vorne und hinten ${item.front}` : `vorne ${item.front} · hinten ${item.rear}`
}

function toggle(values: string[], value: string): string[] {
    return values.includes(value) ? values.filter((v) => v !== value) : [...values, value]
}

function resetFilter(): void {
    Object.assign(filter, { seasons: [], brands: [], band: '' })
}

/* Filters off, and the focus where the list starts: the button that was pressed has gone with its empty list. */
function clearFilters(): void {
    resetFilter()
    void nextTick(() => count.value?.focus())
}

/* The card chosen belongs to what is on the page: another combination or Bereifung takes it back, or the old set would go in the basket unseen. */
function chooseMode(next: TyreMode): void {
    mode.value = next
    chosenKey.value = null
    resetFilter()
}

function choosePair(key: string): void {
    pairKey.value = key
    chosenKey.value = null
    resetFilter()
}

watch([filter, sort, mode, pairKey], () => {
    all.value = false
})

function openDetails(key: string): void {
    detailsKey.value = key
    detailsOpen.value = true
}

function more(): void {
    const at = shown.value.length

    all.value = true
    void nextTick(() => document.querySelectorAll<HTMLInputElement>('[data-tyre-card] input')[at]?.focus())
}

/* ── The steps, in the address ───────────────────────────────────────────────── */

/* A step needs the ones before it: without an offer there are no tyres, without a tyre no extras, without an answer on the sensors no basket. */
function allowed(to: number): number {
    if (to >= 1 && !canGoOn.value) {
        return 0
    }

    if (to >= 2 && chosen.value === null) {
        return 1
    }

    return to >= 3 && extrasOpen.value !== null ? 2 : to
}

/* From the address, on the server too: what is chosen comes from the session after hydration, and the step follows it there. */
const step = ref(allowed((props.schritt ?? 1) - 1))
const reached = ref(step.value)

/* A later step waits on its first frame until the session is read: what is chosen is known only in the browser. */
const settled = ref((props.schritt ?? 1) <= 2)

/* What moves under a step — the car removed in the header, a tyre gone from the shelf, an answer that no longer holds —: the first step that can be shown. */
watch(() => allowed(step.value), (fit) => {
    step.value = fit
})

/* A tyre no longer among what the server offers: said, and another asked for. Never a bare „Noch kein Reifen gewählt“. */
const tyreGone = ref(false)

watch(allCards, (cards) => {
    if (chosenKey.value !== null && !cards.some((card) => card.key === chosenKey.value)) {
        chosenKey.value = null
        tyreGone.value = true
    }
})

watch(chosenKey, (key) => {
    if (key !== null) {
        tyreGone.value = false
    }
})

/* An answer that has lost its ground is asked again: a colour gone, sensors with no price. Stale, they stood chosen unseen and every add was refused. */
watch([colours, tpms], () => {
    if (colourId.value !== null && !colours.value.some((item) => item.id === colourId.value)) {
        colourId.value = null
    }

    if (rdks.value === 'ja' && tpms.value?.available !== true) {
        rdks.value = null
    }
})

/* Another car: nothing chosen for the last one stands (D-408). */
watch(() => shared.value.vehicle?.id, () => {
    chosenKey.value = null
    colourId.value = null
    rdks.value = null
})

/* Back and Forward: the address's step, as far as what it needs is there. */
watch(() => props.schritt, (now) => {
    step.value = allowed((now ?? 1) - 1)
    reached.value = Math.max(reached.value, step.value)
})

/* Per version and per car: an answer given for one car is no answer for another. */
const STORE_KEY = computed(() => `rimify-komplettrad-${props.config.id}-${shared.value.vehicle?.id ?? 'ohne'}`)

function go(to: number): void {
    step.value = allowed(to)
    reached.value = Math.max(reached.value, step.value)

    const url = new URL(window.location.href)

    url.searchParams.set('schritt', String(step.value + 1))
    router.push({
        url: url.pathname + url.search,
        preserveScroll: true,
        preserveState: true,
        props: (current) => ({ ...current, schritt: step.value + 1 }),
    })
    window.scrollTo({ top: 0 })
    void nextTick(() => document.querySelector<HTMLElement>('.kf-step__title')?.focus({ preventScroll: true }))
}

/* The choices survive a reload and Back in this browser's session, for this version only. */
onMounted(() => {
    try {
        const saved = JSON.parse(sessionStorage.getItem(STORE_KEY.value) ?? 'null') as { key: string | null; mode: TyreMode; pair: string | null; colour: number | null; rdks: Rdks; seasons?: string[]; brands?: string[]; band?: string; sort?: TyreSort; reached?: number } | null

        if (saved !== null) {
            const found = allCards.value.some((card) => card.key === saved.key)

            mode.value = saved.mode === 'same' && offer.value.same.length > 0 ? 'same' : offer.value.pairs.length > 0 ? 'mixed' : 'same'
            pairKey.value = offer.value.pairs.some((item) => item.key === saved.pair) ? saved.pair : pairKey.value
            chosenKey.value = found ? saved.key : null
            tyreGone.value = saved.key !== null && !found
            colourId.value = colours.value.some((item) => item.id === saved.colour) ? saved.colour : null
            rdks.value = saved.rdks === 'nein' || (saved.rdks === 'ja' && tpms.value?.available === true) ? saved.rdks : null
            Object.assign(filter, { seasons: saved.seasons ?? [], brands: saved.brands ?? [], band: saved.band ?? '' })
            sort.value = saved.sort ?? sort.value
            reached.value = Math.max(reached.value, saved.reached ?? 0)
        }
    } catch {
        // A session that cannot be read starts the choice afresh.
    }

    // With the choices back, the step the address names, if what it needs is there.
    step.value = allowed((props.schritt ?? 1) - 1)
    reached.value = Math.max(reached.value, step.value)
    settled.value = true

    watch([chosenKey, mode, pairKey, colourId, rdks, filter, sort, reached], () => {
        try {
            sessionStorage.setItem(STORE_KEY.value, JSON.stringify({ key: chosenKey.value, mode: mode.value, pair: pairKey.value, colour: colourId.value, rdks: rdks.value, ...filter, sort: sort.value, reached: reached.value }))
        } catch {
            // Private windows may refuse storage; the steps still work, a reload just forgets.
        }
    }, { deep: true })
})

/* The next pass starts clean: nothing paid carries over from a set that is in the basket (D-408). */
function forgetChoices(): void {
    try {
        sessionStorage.removeItem(STORE_KEY.value)
    } catch {
        // Nothing stored, nothing to forget.
    }
}

/* The set on screen is a line of the basket already. */
const held = computed(() => {
    const card = chosen.value

    return card !== null && props.inBasket.keys.includes(`wheel:${props.config.id}:tyre:${card.frontTyreId}${card.rearTyreId === null ? '' : `:rear:${card.rearTyreId}`}`)
})

function otherTyre(): void {
    chosenKey.value = null
    colourId.value = null
    rdks.value = null
    forgetChoices()
    go(1)
}

/*
 * The basket holds one answer on the sensors, for all its wheels (D-411): what is answered here also goes for the wheels already in it,
 * so the step says so and prices them all. Nothing is chosen for the customer because of it.
 */
const rdksShared = computed(() => {
    const wheels = props.inBasket.wheels
    const before = tpms.value?.choice === 'ja' ? 'Mit RDKS-Sensoren' : tpms.value?.choice === 'nein' ? 'Ohne RDKS-Sensoren' : null

    if (wheels === 0) {
        return null
    }

    return before === null ? `Deine Antwort gilt auch für die ${wheels} Räder in deinem Warenkorb.` : `Für die ${wheels} Räder in deinem Warenkorb steht „${before}“. Deine Antwort hier gilt für alle Räder im Warenkorb.`
})

const rdksNote = computed(() => {
    const wheels = props.inBasket.wheels

    if (wheels === 0 || rdks.value === null) {
        return null
    }

    if (rdks.value === 'ja') {
        return `Die Sensoren für die ${wheels} Räder, die schon im Warenkorb liegen, sind in der Summe enthalten.`
    }

    return tpms.value?.choice === 'ja' ? `Ohne RDKS-Sensoren gilt auch für die ${wheels} Räder, die schon im Warenkorb liegen.` : null
})

/* ── Step 4 ──────────────────────────────────────────────────────────────────── */

const sum = computed(() => (chosen.value ? flowSum(props.config, chosen.value, props.mounting, shownColour.value, tpms.value, rdks.value, props.inBasket.wheels) : null))
const basket = useForm({
    kind: 'WHEEL' as const,
    wheelConfigId: props.config.id,
    tyreVariantId: null as number | null,
    rearTyreVariantId: null as number | null,
    weightColourId: null as number | null,
    rdks: null as 'ja' | 'nein' | null,
    quantity: 4,
    /* The car this page answers for: an add under another, chosen meanwhile in another window, is refused rather than made for it. */
    vehicleId: null as number | null,
})
const offline = ref(false)
const addError = computed(() => {
    const errors = basket.errors as Record<string, string | undefined>

    return errors.tyreVariantId ?? errors.rearTyreVariantId ?? errors.wheelConfigId ?? errors.quantity ?? errors.weightColourId ?? errors.rdks ?? (offline.value ? OFFLINE_ADD : null)
})

watch([chosenKey, colourId, rdks], () => basket.clearErrors())

function addToBasket(): void {
    const card = chosen.value

    if (card === null || basket.processing) {
        return
    }

    basket.wheelConfigId = props.config.id
    basket.tyreVariantId = card.frontTyreId
    // Two wheels per axle, each with its tyre (D-335, D-105) — or four alike.
    basket.rearTyreVariantId = card.rearTyreId
    basket.weightColourId = colourId.value
    basket.rdks = rdks.value
    basket.quantity = card.mode === 'mixed' ? offer.value.perAxle : offer.value.quantity
    basket.vehicleId = shared.value.vehicle?.id ?? null
    offline.value = false
    basket.post('/warenkorb', {
        preserveScroll: true,
        onSuccess: forgetChoices,
        onNetworkError: () => {
            offline.value = true

            return false
        },
    })
}

/* The step's bar owns the bottom edge: the compare tray steps aside for it (PDP-02). */
claimBottomEdge(() => true)

const askHref = computed(() => contactHref({ subject: `Frage zum Komplettrad: ${props.product.brandName} ${props.product.modelName}, ${props.config.sizeLabel}`, from: page.url }))
</script>

<template>
    <Head :title="`Komplettrad: ${product.brandName} ${product.modelName}`">
        <meta head-key="robots" name="robots" content="noindex">
    </Head>

    <section class="section--tight">
        <div class="container kf">
            <header class="kf-head">
                <h1 class="h1">Komplettrad<template v-if="shared.vehicle"> für {{ shared.vehicle.short }}</template></h1>
                <StepBar :steps="STEPS" :current="step" :reached="reached" label="Schritte zum Komplettrad" @go="go" />
            </header>

            <!-- A refusal of the add that came back to another step than the last. -->
            <p v-if="addError && step !== 3" class="notice notice--bad" role="alert">
                <Icon name="warning" :size="20" />
                <span>{{ addError }}</span>
            </p>

            <p v-if="!settled" class="kf-loading" role="status">Wird geladen …</p>

            <!-- 1 Felge -->
            <section v-else-if="step === 0" class="kf-step" aria-labelledby="kf-wheel-h">
                <h2 id="kf-wheel-h" class="h3 kf-step__title" tabindex="-1">Deine Felge</h2>
                <div class="kf-wheel">
                    <div class="well kf-wheel__well">
                        <Picture v-if="product.image" :image="product.image" :alt="`${product.brandName} ${product.modelName} in ${product.finishName}`" sizes="220px" />
                        <ProductPhoto v-else :spokes="product.art.spokes" :finish="product.art.finish" :size="220" :note="false" />
                    </div>
                    <div class="kf-wheel__facts">
                        <p class="kf-wheel__name" translate="no">{{ product.brandName }} {{ product.modelName }} · {{ product.finishName }}</p>
                        <p class="kf-wheel__spec" translate="no">{{ config.fullLabel }}</p>
                        <p v-if="config.priceForFour" class="kf-wheel__spec"><span translate="no">{{ config.priceForFour }}</span> für 4 Felgen</p>
                        <Link class="link kf-link" :href="productHref">Andere Ausführung wählen</Link>
                    </div>
                </div>

                <FitmentPanel v-if="shared.vehicle" class="kf-panel" :verdict="config.verdict ?? null" :vehicle="shared.vehicle" :config-id="config.id" :chosen="null" :ask-href="askHref" />

                <KomplettradRefusal v-if="offer.refusal" :sentence="offer.refusal" :code="offer.refusalCode" />

                <div class="kf-actions kf-actions--measure">
                    <button class="btn btn--primary" type="button" :disabled="!canGoOn" @click="go(1)">Weiter: Reifen <Icon name="arrow-right" :size="20" /></button>
                </div>

                <!-- What the panel's „alle Auflagen im Wortlaut“ leads to, as on the product page. -->
                <FitmentDetail v-if="config.verdict?.detail && shared.vehicle" :detail="config.verdict.detail" :vehicle-label="shared.vehicle.label" :omit="[ENTRY_REQUIRED, ABNAHME_REQUIRED]" />
            </section>

            <!-- 2 Reifen -->
            <section v-else-if="step === 1" class="kf-step" aria-labelledby="kf-tyres-h">
                <div class="kf-step__head">
                    <h2 id="kf-tyres-h" class="h3 kf-step__title" tabindex="-1">Reifen wählen</h2>
                    <p v-if="mode === 'same' && offer.minSentence" class="muted kf-measure">{{ offer.minSentence }}</p>
                    <p v-else-if="pair" class="muted kf-measure">{{ pair.minSentence }}</p>
                </div>

                <p v-if="tyreGone" class="notice notice--bad" role="alert" data-tyre-gone>
                    <Icon name="warning" :size="20" />
                    <span>Der gewählte Reifen ist gerade nicht mehr verfügbar. Wähl bitte einen anderen.</span>
                </p>

                <!-- Four alike or two and two, where the paper allows both; where it lists its combinations, one of those. -->
                <fieldset v-if="offer.same.length > 0 && offer.pairs.length > 0" class="kf-mode">
                    <legend class="label kf-mode__legend">Bereifung</legend>
                    <label class="kf-opt" :class="{ 'kf-opt--on': mode === 'same' }">
                        <input class="visually-hidden" type="radio" name="kf-mode" value="same" :checked="mode === 'same'" @change="chooseMode('same')">
                        <span class="kf-opt__name">Vorne und hinten gleich</span>
                        <span class="kf-opt__sub">4 gleiche Reifen</span>
                        <span class="kf-opt__check" aria-hidden="true"><Icon name="check" :size="20" /></span>
                    </label>
                    <label class="kf-opt" :class="{ 'kf-opt--on': mode === 'mixed' }">
                        <input class="visually-hidden" type="radio" name="kf-mode" value="mixed" :checked="mode === 'mixed'" @change="chooseMode('mixed')">
                        <span class="kf-opt__name">Vorne und hinten verschieden</span>
                        <span class="kf-opt__sub">2 vorne, 2 hinten</span>
                        <span class="kf-opt__check" aria-hidden="true"><Icon name="check" :size="20" /></span>
                    </label>
                </fieldset>
                <p v-else-if="offer.same.length > 0 && offer.mixedRefusal" class="small quiet kf-measure">Vorne und hinten verschieden: {{ offer.mixedRefusal }}</p>

                <fieldset v-if="mode === 'mixed' && offer.pairs.length > 1 && offer.pairs.length <= PAIR_TILES" class="kf-mode kf-pairs">
                    <legend class="label kf-mode__legend">Kombination aus dem Gutachten</legend>
                    <label v-for="item in offer.pairs" :key="item.key" class="kf-opt kf-pair" :class="{ 'kf-opt--on': item.key === pairKey }">
                        <input class="visually-hidden" type="radio" name="kf-pair" :value="item.key" :checked="item.key === pairKey" @change="choosePair(item.key)">
                        <span class="kf-opt__name" translate="no">{{ pairLine(item) }}</span>
                        <span class="kf-opt__sub">Kombination Nr.&nbsp;{{ item.number }}</span>
                        <span class="kf-opt__check" aria-hidden="true"><Icon name="check" :size="20" /></span>
                    </label>
                </fieldset>
                <div v-else-if="mode === 'mixed' && offer.pairs.length > PAIR_TILES" class="kf-pairlist">
                    <label class="label" for="kf-pair">Kombination aus dem Gutachten</label>
                    <select id="kf-pair" class="input" :value="pairKey" @change="choosePair(($event.target as HTMLSelectElement).value)">
                        <option v-for="item in offer.pairs" :key="item.key" :value="item.key">Nr. {{ item.number }} · {{ pairLine(item) }}</option>
                    </select>
                </div>
                <p v-else-if="mode === 'mixed' && pair" class="kf-onepair">
                    <template v-if="pair.sameSize">Vorne und hinten <span class="kf-size" translate="no">{{ pair.front }}</span></template><template v-else>Vorne <span class="kf-size" translate="no">{{ pair.front }}</span> · hinten <span class="kf-size" translate="no">{{ pair.rear }}</span></template>
                </p>
                <p v-if="mode === 'mixed' && pair" class="small quiet kf-source">Kombination Nr.&nbsp;{{ pair.number }}<template v-if="offer.sourcePage"> im Gutachten, Seite&nbsp;{{ offer.sourcePage }}</template></p>

                <p v-if="mode === 'mixed' && pair && pair.cards.length === 0" class="notice kf-noset">
                    <Icon name="info" :size="20" />
                    <span>{{ pair.noSet ?? 'Reifen für diese Kombination können wir dir gerade nicht anbieten. Die Felge allein kannst du bestellen.' }}</span>
                </p>

                <template v-if="inMode.length > 0">
                    <button v-if="filterable" class="btn btn--secondary kf-filters__toggle" type="button" aria-controls="kf-filters" :aria-expanded="filtersOpen" @click="filtersOpen = !filtersOpen">Filter<template v-if="filtersOn > 0"> ({{ filtersOn }})</template></button>
                    <div id="kf-filters" class="kf-filters" :class="{ 'kf-filters--open': filtersOpen }">
                        <div v-if="seasons.length > 1" class="kf-filter" role="group" aria-label="Saison">
                            <span class="kf-filter__label">Saison</span>
                            <button v-for="[value, label] in seasons" :key="value" class="chip" type="button" :aria-pressed="filter.seasons.includes(value)" @click="filter.seasons = toggle(filter.seasons, value)">{{ label }}</button>
                        </div>
                        <div v-if="brands.length > 1" class="kf-filter" role="group" aria-label="Marke">
                            <span class="kf-filter__label">Marke</span>
                            <button v-for="brand in brands" :key="brand" class="chip" type="button" :aria-pressed="filter.brands.includes(brand)" translate="no" @click="filter.brands = toggle(filter.brands, brand)">{{ brand }}</button>
                        </div>
                        <div v-if="bands.length > 0" class="kf-filter" role="group" aria-label="Preis für die Reifen">
                            <span class="kf-filter__label">Preis</span>
                            <button v-for="band in bands" :key="band.value" class="chip" type="button" :aria-pressed="filter.band === band.value" @click="filter.band = filter.band === band.value ? '' : band.value">{{ band.label }}</button>
                        </div>
                    </div>

                    <div class="kf-listhead">
                        <p ref="count" class="kf-count" role="status" tabindex="-1">{{ list.length === 1 ? '1 Reifen passt' : `${list.length} Reifen passen` }}</p>
                        <label class="kf-sort">
                            <span class="kf-sort__label">Sortieren</span>
                            <select v-model="sort" class="input kf-sort__select">
                                <option value="preis-auf">Preis aufsteigend</option>
                                <option value="preis-ab">Preis absteigend</option>
                                <option value="marke">Marke A–Z</option>
                            </select>
                        </label>
                    </div>

                    <div v-if="list.length > 0" class="kf-grid" role="radiogroup" aria-label="Reifen">
                        <TyreCard v-for="card in shown" :key="card.key" :card="card" :chosen="card.key === chosenKey" :papers-exempt="config.verdict?.papersExempt === true" @choose="chosenKey = card.key" @details="openDetails(card.key)" />
                    </div>
                    <p v-else class="kf-empty">
                        Kein Reifen passt zu diesen Filtern.
                        <button class="link" type="button" @click="clearFilters">Filter zurücksetzen</button>
                    </p>
                    <button v-if="list.length > shown.length" class="btn btn--secondary kf-more" type="button" @click="more">Mehr anzeigen ({{ list.length - shown.length }})</button>
                </template>

                <!-- Each axle's Auflagen under its name: both are fitted (D-335). After the tyres, folded where they run long (D-197). -->
                <component :is="pairFolded ? 'details' : 'div'" v-if="mode === 'mixed' && pair?.answer" class="kf-answer" data-set-answer>
                    <summary v-if="pairFolded" class="kf-answer__toggle">{{ countedDe(pairConditions.length) }} anzeigen</summary>
                    <p v-else class="label">Das verlangt das Gutachten je Achse</p>
                    <ConditionGroups :groups="pair.answer" />
                </component>

                <!-- The table's own conditions, quoted: what the customer must keep in the car. -->
                <figure v-if="mode === 'mixed' && offer.rules" class="kf-rules">
                    <figcaption class="label">Dazu verlangt das Gutachten<template v-if="offer.rulesPage"> (Seite&nbsp;{{ offer.rulesPage }})</template></figcaption>
                    <blockquote class="kf-quote">{{ offer.rules }}</blockquote>
                </figure>

                <div class="kf-actions">
                    <button class="btn btn--secondary kf-actions__left" type="button" @click="go(0)">Zurück</button>
                    <span class="kf-pick small" role="status">{{ chosen ? `Gewählt: ${[chosen.brands.join(' · '), chosen.name].filter(Boolean).join(' ')} · ${held ? 'liegt schon im Warenkorb' : chosen.set}` : 'Wähl zuerst einen Reifen.' }}</span>
                    <Link v-if="held" href="/warenkorb" class="btn btn--primary">Zum Warenkorb <Icon name="arrow-right" :size="20" /></Link>
                    <button v-else class="btn btn--primary" type="button" :disabled="!chosen" @click="go(2)">Weiter: Extras <Icon name="arrow-right" :size="20" /></button>
                </div>

                <TyreDetails v-model:open="detailsOpen" :card="details" :chosen="details?.key === chosenKey" @choose="chosenKey = detailsKey" />
            </section>

            <!-- 3 Extras -->
            <section v-else-if="step === 2" class="kf-step" aria-labelledby="kf-extras-h">
                <div class="kf-step__head">
                    <h2 id="kf-extras-h" class="h3 kf-step__title" tabindex="-1">Extras</h2>
                    <p class="small quiet kf-measure">
                        <template v-if="mounting">Montage und Auswuchten gehören zum Komplettrad: {{ mounting.total }} für 4 Räder (je {{ mounting.each }}). </template>
                        Extras mit Aufpreis kommen nur dazu, wenn du sie auswählst.
                    </p>
                </div>

                <fieldset v-if="colours.length > 0" class="kf-group" data-weights>
                    <legend class="label">Wuchtgewichte</legend>
                    <p class="small quiet">Die Gewichte sitzen innen an der Felge. Such dir die Farbe aus, die dir besser gefällt.<template v-if="standardColour"> Ohne Wahl setzen wir {{ standardColour.name }} ein.</template></p>
                    <div class="kf-swatches">
                        <label v-for="item in colours" :key="item.id" class="kf-swatch" :class="{ 'kf-swatch--on': item.id === colourId }">
                            <input v-model="colourId" class="visually-hidden" type="radio" name="kf-weights" :value="item.id">
                            <span class="kf-swatch__dot" data-qa-ignore :style="item.swatchHex ? { '--swatch': item.swatchHex } : undefined" aria-hidden="true" />
                            <span class="kf-swatch__name">{{ item.name }}</span>
                            <span class="kf-swatch__price">{{ item.surchargeCents === 0 ? 'ohne Aufpreis' : `+ ${item.surcharge} pro Rad` }}</span>
                            <span class="kf-swatch__check" aria-hidden="true"><Icon name="check" :size="16" /></span>
                        </label>
                    </div>
                </fieldset>

                <!--
                    The client's change of 05.11.2026: the customer answers here, Mit or Ohne, nothing preselected, and the way on waits for it.
                    No valve is offered or described: the admin holds none, and which valves a wheel may take is the Gutachten's to say.
                -->
                <fieldset v-if="tpms" class="kf-group" data-rdks>
                    <legend class="label">RDKS-Sensoren</legend>
                    <p class="small quiet">Misst dein Auto den Reifendruck mit Sensoren in den Rädern, brauchen auch die neuen Räder Sensoren. Ob das so ist, steht in der Betriebsanleitung.</p>
                    <p v-if="rdksShared" class="small" data-rdks-shared>{{ rdksShared }}</p>
                    <p v-if="!tpms.available && tpms.notice" class="notice">
                        <span>{{ tpms.notice }} <Link :href="contactHref({ subject: 'Preis für RDKS-Sensoren', from: page.url })" class="link">Zum Kontaktformular</Link></span>
                    </p>
                    <div class="kf-opts">
                        <label v-if="tpms.available" class="kf-opt" :class="{ 'kf-opt--on': rdks === 'ja' }">
                            <input v-model="rdks" class="visually-hidden" type="radio" name="kf-rdks" value="ja">
                            <span class="kf-opt__name">Mit RDKS-Sensoren</span>
                            <span class="kf-opt__price">+ {{ tpms.yesTotal }}<template v-if="tpms.line"> ({{ tpms.line }})</template></span>
                            <span class="kf-opt__sub">Wir setzen sie gleich mit ein.</span>
                            <span class="kf-opt__check" aria-hidden="true"><Icon name="check" :size="20" /></span>
                        </label>
                        <label class="kf-opt" :class="{ 'kf-opt--on': rdks === 'nein' }">
                            <input v-model="rdks" class="visually-hidden" type="radio" name="kf-rdks" value="nein">
                            <span class="kf-opt__name">Ohne RDKS-Sensoren</span>
                            <span class="kf-opt__price">ohne Aufpreis</span>
                            <span class="kf-opt__check" aria-hidden="true"><Icon name="check" :size="20" /></span>
                        </label>
                    </div>
                </fieldset>

                <div class="kf-actions kf-actions--measure">
                    <button class="btn btn--secondary kf-actions__left" type="button" @click="go(1)">Zurück</button>
                    <span v-if="extrasOpen" id="kf-rdks-hint" class="kf-pick small" role="status">{{ extrasOpen }}</span>
                    <button class="btn btn--primary" type="button" :disabled="extrasOpen !== null" :aria-describedby="extrasOpen ? 'kf-rdks-hint' : undefined" @click="go(3)">Weiter: Warenkorb <Icon name="arrow-right" :size="20" /></button>
                </div>
            </section>

            <!-- 4 Warenkorb -->
            <section v-else class="kf-step" aria-labelledby="kf-basket-h">
                <h2 id="kf-basket-h" class="h3 kf-step__title" tabindex="-1">Dein Komplettrad</h2>
                <!-- In the basket by now: the way there, never a second set under one Summe. -->
                <template v-if="chosen && held">
                    <p class="notice notice--ok kf-panel" role="status" data-held>
                        <Icon name="check" :size="20" />
                        <span>Dieses Komplettrad liegt in deinem Warenkorb.</span>
                    </p>
                    <div class="kf-actions kf-actions--measure">
                        <button class="btn btn--secondary kf-actions__left" type="button" @click="otherTyre">Anderen Reifen wählen</button>
                        <Link href="/warenkorb" class="btn btn--primary">Zum Warenkorb <Icon name="arrow-right" :size="20" /></Link>
                    </div>
                </template>
                <template v-else-if="chosen && sum">
                    <!-- With the tyre chosen, the answer for that tyre's size: its Eintragung, its Auflagen — as the basket line says them. -->
                    <FitmentPanel class="kf-panel" :verdict="config.verdict ?? null" :vehicle="shared.vehicle" :config-id="config.id" :chosen="chosen.answer" :ask-href="askHref" />

                    <div class="kf-sum">
                        <table class="kf-basket">
                            <caption class="visually-hidden">Was in den Warenkorb kommt</caption>
                            <tbody>
                                <tr v-for="line in sum.lines" :key="line.label">
                                    <th scope="row"><span class="kf-basket__cell"><span class="kf-basket__label">{{ line.label }}</span><span class="small quiet">{{ line.detail }}</span></span></th>
                                    <td>{{ line.price }}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr>
                                    <th scope="row">Summe</th>
                                    <td>{{ formatMoney(sum.totalCents) }}</td>
                                </tr>
                            </tfoot>
                        </table>
                        <p class="small quiet">{{ terms.note }}</p>
                        <p v-if="sum.open" class="small quiet">Summe ohne Montage und Auswuchten.</p>
                        <p v-if="rdksNote" class="small quiet">{{ rdksNote }}</p>
                    </div>
                    <p v-if="addError" class="notice notice--bad" role="alert">
                        <Icon name="warning" :size="20" />
                        <span>{{ addError }}</span>
                    </p>
                    <div class="kf-actions kf-actions--measure">
                        <!-- Shut while the add is on its way: its answer would bring this step back. -->
                        <button class="btn btn--secondary kf-actions__left" type="button" :disabled="basket.processing" @click="go(2)">Zurück</button>
                        <button class="btn btn--primary kf-add" type="button" :aria-busy="basket.processing ? 'true' : undefined" @click="addToBasket"><Icon name="cart" :size="20" /> {{ basket.processing ? 'Wird hinzugefügt …' : 'In den Warenkorb' }}</button>
                    </div>

                    <FitmentDetail v-if="config.verdict?.detail && shared.vehicle" :detail="config.verdict.detail" :vehicle-label="shared.vehicle.label" :omit="[ENTRY_REQUIRED, ABNAHME_REQUIRED]" />
                </template>
                <p v-else class="kf-empty">Noch kein Reifen gewählt. <button class="link" type="button" @click="go(1)">Reifen wählen</button></p>
            </section>
        </div>
    </section>
</template>

<style scoped>
.kf {
    display: grid;
    gap: var(--sp-24);
}

.kf-head {
    display: grid;
    gap: var(--sp-16);
}

/* A column, not a grid: a sticky bar in a grid stays inside its own row (.kf-actions). */
.kf-step {
    display: flex;
    flex-direction: column;
    gap: var(--sp-20);
    min-width: 0;
}

.kf-step__head {
    display: grid;
    gap: var(--sp-4);
}

.kf-step__title {
    margin: 0;
}

.kf-step__title:focus {
    outline: none;
}

.kf-measure {
    max-width: calc(54 * var(--ch-text));
    margin: 0;
    text-wrap: pretty;
}

/* One measure from the first desktop width up, 7 of the 12 columns: what belongs together ends on one edge. */
@media (min-width: 1024px) {
    .kf-mode,
    .kf-opts,
    .kf-panel,
    .kf-sum,
    .kf-actions--measure {
        max-width: calc((7 * 100% - 5 * var(--gutter)) / 12);
    }
}

.kf-wheel {
    display: grid;
    grid-template-columns: minmax(0, 220px) minmax(0, 1fr);
    gap: var(--sp-24);
    align-items: center;
}

.kf-wheel__facts {
    display: grid;
    justify-items: start;
    gap: var(--sp-8);
}

.kf-wheel__name {
    margin: 0;
    font-weight: 700;
}

.kf-wheel__spec {
    margin: 0;
    font-variant-numeric: tabular-nums;
}

.kf-link {
    min-height: 44px;
}

.kf-mode,
.kf-group {
    display: grid;
    gap: var(--sp-8);
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
}

.kf-group {
    margin-top: var(--sp-12);
}

.kf-group p {
    margin: 0;
}

.kf-mode {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
}

/* A legend's own 2 px would stand it off the text under it. */
.kf-mode legend,
.kf-group legend {
    padding: 0;
}

.kf-mode__legend {
    margin-bottom: var(--sp-4);
}

/* The shop's radio tile (BuyModeChoice): the whole tile the control, 2 px blue and the check when chosen. */
.kf-opt {
    position: relative;
    display: grid;
    align-content: start;
    gap: var(--sp-4);
    min-height: 64px;
    padding: var(--sp-12) var(--sp-40) var(--sp-12) var(--sp-16);
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
    background: var(--c-surface);
    cursor: pointer;
    transition: border-color var(--d-1) var(--ease-std), background-color var(--d-1) var(--ease-std);
}

.kf-opt--on {
    padding: calc(var(--sp-12) - 1px) calc(var(--sp-40) - 1px) calc(var(--sp-12) - 1px) calc(var(--sp-16) - 1px);
    border: 2px solid var(--c-blue);
}

.kf-opt:has(:focus-visible),
.kf-swatch:has(:focus-visible) {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

.kf-opt:active,
.kf-swatch:active {
    background: var(--c-band);
}

@media (hover: hover) and (pointer: fine) {
    .kf-opt:hover,
    .kf-swatch:hover {
        border-color: var(--c-ink-3);
    }

    .kf-opt--on:hover,
    .kf-swatch--on:hover {
        border-color: var(--c-blue);
    }
}

.kf-opt__name {
    font-weight: 600;
}

/* The price on a line of its own under what the tile is, never split by the line's end (as on BuyModeChoice). */
.kf-opt__price {
    display: block;
    font-variant-numeric: tabular-nums;
}

.kf-opt__sub {
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-variant-numeric: tabular-nums;
}

.kf-opt__check {
    position: absolute;
    top: var(--sp-12);
    right: var(--sp-12);
    display: none;
    color: var(--c-blue);
}

.kf-opt--on .kf-opt__check {
    display: inline-flex;
}

.kf-opts {
    display: grid;
    gap: var(--sp-8);
}

@media (min-width: 768px) {
    .kf-opts {
        grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
    }
}

.kf-swatches {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

.kf-swatch {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--sp-4) var(--sp-8);
    min-height: 44px;
    padding: var(--sp-8) var(--sp-12);
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
    background: var(--c-surface);
    cursor: pointer;
}

.kf-swatch--on {
    padding: calc(var(--sp-8) - 1px) calc(var(--sp-12) - 1px);
    border: 2px solid var(--c-blue);
}

.kf-swatch__dot {
    align-self: center;
    width: 16px;
    height: 16px;
    border: 1px solid var(--c-line);
    border-radius: var(--r-round);
    background: var(--swatch, var(--c-ink-2));
}

.kf-swatch__name {
    font-weight: 600;
}

.kf-swatch__price {
    color: var(--c-ink-2);
    font-size: var(--fs-small);
}

/* Its room kept, so the row does not move when a colour is chosen. */
.kf-swatch__check {
    align-self: center;
    display: inline-flex;
    margin-left: auto;
    color: var(--c-blue);
    visibility: hidden;
}

.kf-swatch--on .kf-swatch__check {
    visibility: visible;
}

.kf-pairlist {
    display: grid;
    gap: var(--sp-4);
    max-width: 100%;
}

@media (min-width: 1024px) {
    .kf-pairlist {
        max-width: calc((7 * 100% - 5 * var(--gutter)) / 12);
    }
}

.kf-onepair {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--sp-4) var(--sp-8);
    margin: 0;
}

.kf-size {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

.kf-answer {
    display: grid;
    gap: var(--sp-8);
    max-width: calc(72 * var(--ch-text));
}

.kf-answer__toggle {
    cursor: pointer;
    font-size: var(--fs-small);
    color: var(--c-blue);
    text-decoration: underline;
    text-underline-offset: 2px;
}

.kf-answer__toggle:focus-visible {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

/* Under a finger the toggle is a 44 px row, as every other control. */
@media (pointer: coarse) {
    .kf-answer__toggle {
        display: flex;
        align-items: center;
        min-height: 44px;
    }
}

.kf-noset {
    margin: 0;
}

.kf-count:focus {
    outline: none;
}

.kf-loading {
    margin: 0;
    color: var(--c-ink-2);
}

.kf-filters {
    display: grid;
    gap: var(--sp-8);
}

.kf-filters__toggle {
    display: none;
}

.kf-filter {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
}

.kf-filter__label,
.kf-sort__label {
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    font-weight: 500;
}

.kf-filter__label {
    min-width: 88px;
}

.kf-listhead {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-12);
}

.kf-count {
    margin: 0;
    font-weight: 600;
}

.kf-sort {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
    min-width: 0;
}

.kf-sort__select {
    width: auto;
    max-width: 100%;
}

.kf-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
    gap: var(--gutter);
}

@media (min-width: 600px) {
    .kf-more {
        align-self: flex-start;
    }
}

.kf-empty {
    margin: 0;
    padding: var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-band);
}

.kf-rules {
    display: grid;
    gap: var(--sp-4);
    max-width: calc(54 * var(--ch-text));
    margin: 0;
    font-size: var(--fs-small);
}

.kf-quote {
    margin: 0;
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

/* Each step's one action stays in sight, as the save bar does in the admin: on a phone the list ran 3.000 px past it. */
.kf-actions {
    position: sticky;
    bottom: 0;
    z-index: var(--z-sticky);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--sp-12);
    padding-block: var(--sp-12) calc(var(--sp-12) + env(safe-area-inset-bottom, 0px));
    border-top: 1px solid var(--c-line);
    background: var(--c-surface);
    /* A chosen tile's border and a focus ring stand a little past the column: the bar covers them. */
    outline: var(--sp-4) solid var(--c-surface);
}

.kf-actions__left {
    margin-right: auto;
}

.kf-pick {
    color: var(--c-ink-2);
}

.kf-sum {
    display: grid;
    gap: var(--sp-4);
}

.kf-sum p {
    margin: 0;
}

.kf-basket {
    width: 100%;
    border-collapse: collapse;
}

.kf-basket th,
.kf-basket td {
    padding: var(--sp-12) 0;
    border-bottom: 1px solid var(--c-line);
    text-align: left;
    vertical-align: top;
}

.kf-basket th {
    font-weight: 400;
}

.kf-basket__cell {
    display: grid;
    gap: var(--sp-4);
    overflow-wrap: anywhere;
}

.kf-basket td {
    padding-left: var(--sp-16);
    text-align: right;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

.kf-basket__label {
    font-weight: 600;
}

.kf-basket tfoot th,
.kf-basket tfoot td {
    border-bottom: 0;
    font-size: var(--fs-h4);
    font-weight: 700;
}

@media (max-width: 599px) {
    .kf-wheel {
        grid-template-columns: minmax(0, 1fr);
    }

    .kf-wheel__well {
        max-width: 220px;
    }

    .kf-filter__label {
        min-width: 100%;
    }

    .kf-swatch {
        flex: 1 1 100%;
    }

    /* The chosen tyre on its own line above the two buttons. */
    .kf-pick {
        order: -1;
        flex-basis: 100%;
    }

    .kf-actions .btn--primary {
        flex: 1;
    }

    .kf-filters__toggle {
        display: inline-flex;
        align-self: flex-start;
    }

    .kf-filters:not(.kf-filters--open) {
        display: none;
    }
}
</style>

<style>
/* What a keyboard reaches never ends up behind the step's bar. Not scoped: the page scrolls, not the flow. */
html:has(.kf) {
    scroll-padding-bottom: var(--sp-128);
}
</style>
