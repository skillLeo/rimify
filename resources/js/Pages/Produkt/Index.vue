<script setup lang="ts">
/**
 * The product page.
 *
 * Two rules govern it. Configuration NARROWS but never rejects: a size that exists but is not
 * permitted on the chosen car is shown, struck through, with the reason — hiding it would let the
 * customer believe the wheel is not made in that size. And price, stock and verdict change in ONE
 * commit when a size is chosen; they come from the same config object, so there is no frame in
 * which a new price sits beside an old legal answer.
 *
 * The verdict sits directly above the basket button, never beside or below it: the legal status is
 * never separated from the control that acts on it.
 *
 * The panel asks one question before the price: Nur Felgen or Komplettrad (the client's #18). The
 * Komplettrad shows the tyres the verdict permits on the size on screen, priced on the server, or the
 * one sentence saying why there are none; the offer travels inside the configuration, so a size change
 * swaps it in the same commit as the price. Switching keeps the finish, the size, the amount of rims
 * and the tyre picked, and the one button adds whichever is chosen.
 *
 * On a phone the price and the button follow the customer down the page once the main button has
 * scrolled away — the one persistent bar the storefront uses, because it is the page's next action.
 *
 * A seeded demonstration model (`demo`) shows "Beispielbestand" rather than "Auf Lager" and says it
 * cannot be ordered yet. Its basket button stays usable, so the flow can be reviewed; the server
 * refuses the order at the checkout (ACCURACY.md D4).
 *
 * The main photograph opens large in a dialog: a button around the image, focus trapped while it
 * is open, Escape or the close button to leave, focus back on the photograph after.
 */

import { Head, Link, useForm, usePage } from '@inertiajs/vue3'
import { DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import AmountStepper from '../../Components/Product/AmountStepper.vue'
import BuyModeChoice from '../../Components/Product/BuyModeChoice.vue'
import FitmentDetail from '../../Components/Product/FitmentDetail.vue'
import FitmentPanel from '../../Components/Product/FitmentPanel.vue'
import KomplettradChoice from '../../Components/Product/KomplettradChoice.vue'
import MischbereifungOffer from '../../Components/Product/MischbereifungOffer.vue'
import ProductPhoto from '../../Components/Product/ProductPhoto.vue'
import Icon from '../../Components/Ui/Icon.vue'
import Picture, { type ImageView } from '../../Components/Ui/Picture.vue'
import ValueText from '../../Components/Ui/ValueText.vue'
import { useConfigurator } from '../../composables/useConfigurator'
import { priceTerms } from '../../composables/usePriceTerms'
import { useShared } from '../../composables/useShared'
import { claimBottomEdge } from '../../composables/useShell'
import { ABNAHME_REQUIRED, ENTRY_REQUIRED } from '../../fitment/papers'
import { decimal, withUnit } from '../../format'
import { contactHref as contactFormHref } from '../../lib/contact'
import type { ProduktConfig, ProduktProps } from '../../types/pages'

defineOptions({ layout: AppLayout })

/** The load rating per wheel travels with each configuration; null where none is verified. */
type RatedConfig = ProduktConfig & { maxLoadKg?: number | null }

const props = defineProps<ProduktProps & { demo?: boolean; acceptance?: boolean }>()

const shared = useShared()
const terms = computed(() => priceTerms(shared.value.smallBusiness === true))
const page = usePage()
/* `groesse` in the link — the RIMIFY-Check's „Alles zur Felge“ — opens the page on the size it answered (CHECK-13). */
const linkedSize = Number(new URLSearchParams((page.url ?? '').split('?')[1] ?? '').get('groesse')) || null
const config = useConfigurator(() => props.configs, props.finishes[0]?.id ?? 0, linkedSize)

const finish = computed(() => props.finishes.find((f) => f.id === config.finishId.value) ?? null)
const selected = computed(() => config.selected.value)

/**
 * GPSR's electronic address: a web address as its link, an e-mail address as text to copy — no button on the shop opens
 * a mail program (the client's #26); the maker's address is the maker's, so it cannot lead to our contact form either.
 */
function webAddress(contact: string): string | null {
    return /^https?:\/\//i.test(contact.trim()) ? contact.trim() : null
}

/* Where the maker's details are missing, a question to us goes through the contact form (#26). */
const askAboutMaker = computed(() =>
    contactFormHref({ subject: `Herstellerangaben: ${props.product.brandName} ${props.product.modelName}`, from: page.url })
)

/*
 * Finding 103: the tyres a customer wants checked by hand — the contact form with this wheel and size as the subject and
 * this page as where they wrote from; the chosen car is ticked there by itself.
 */
const askAboutTyres = computed(() =>
    contactFormHref({
        subject: `Wunschreifen prüfen: ${props.product.brandName} ${props.product.modelName}${selected.value ? `, ${selected.value.sizeLabel}` : ''}`,
        from: page.url,
    })
)

/* The finish's photographs: the front view (the manifest itself), then its other angles. */
const shots = computed<ImageView[]>(() => {
    const image = finish.value?.image ?? null

    if (image === null) {
        return []
    }

    const { views = [], ...front } = image

    return [{ ...front, label: front.label ?? 'Ansicht von vorn' }, ...views]
})
const shotIndex = ref(0)
const shot = computed(() => shots.value[shotIndex.value] ?? null)
// An uploaded photo carries the sentence the admin wrote for it; a studio shot is named by its angle.
const shotAlt = computed(() => shot.value?.alt ?? `${props.product.brandName} ${props.product.modelName} in ${finish.value?.name ?? ''}, ${shot.value?.label ?? ''}`)

/*
 * A photograph shows the wheel whose approval is stamped on it (the manifest's `stamp`). Where the size on
 * screen carries another number, the page says which size the picture is of: the Borbet DB8GT2's photographs
 * are of the 18-inch wheel (KBA 53841), and the 19-inch has its own approval, ABE 55255 (Block D, item 12).
 */
const photoNote = computed(() => {
    const stamp = finish.value?.image?.stamp
    const current = selected.value

    if (!stamp || current === null || !current.kbaNumber || current.kbaNumber === stamp) {
        return null
    }

    const pictured = props.configs.find((c) => c.kbaNumber === stamp)

    return pictured ? `Abbildung zeigt die ${decimal(pictured.diameterIn, Number.isInteger(pictured.diameterIn) ? 0 : 1)}-Zoll-Ausführung.` : null
})

/*
 * Why a size is struck through, as true as the answer behind it (R-07): „nicht freigegeben“ only where a
 * document says no; where we hold no answer for the car, that is what is said.
 */
const blockedNote = computed(() => {
    const statuses = new Set(config.sizes.value.filter((s) => s.blocked).map((s) => s.config.verdict?.status))

    if (statuses.size === 0) {
        return null
    }

    const refused = statuses.has('NOT_PERMITTED')
    const open = [...statuses].some((status) => status !== 'NOT_PERMITTED')

    if (refused && open) {
        return 'Durchgestrichene Größen sind für dein Fahrzeug nicht freigegeben, oder uns liegt für sie keine Freigabe vor.'
    }

    return refused ? 'Durchgestrichene Größen sind für dein Fahrzeug nicht freigegeben.' : 'Für durchgestrichene Größen liegt uns für dein Fahrzeug keine Freigabe vor.'
})

/*
 * Grey is not struck through (finding 103): the wheel is approved for the car and only the tyre size is unconfirmed.
 * The legend says the difference in plain words — unverified is neither forbidden nor unavailable.
 */
const unconfirmedNote = computed(() =>
    config.sizes.value.some((s) => s.unconfirmed)
        ? 'Grau markierte Größen können wir für dein Fahrzeug noch nicht bestätigen. Das heißt nicht, dass sie unzulässig sind, sondern dass uns die Unterlagen dazu fehlen.'
        : null
)

// Another finish starts on its own front view.
watch(
    () => config.finishId.value,
    () => {
        shotIndex.value = 0
    }
)

/*
 * Under the name, while the wheel has no reviews (#19, D-103): its released documents and the vehicle variants they
 * approve it for — counts the shop can prove — and that the approval is checked before the purchase. Nothing where
 * there is no document.
 */
const proofLine = computed(() => {
    const proof = props.product.proof

    if (!proof || proof.gutachten === 0) {
        return null
    }

    const documents = proof.gutachten === 1 ? '1 Gutachten' : `${decimal(proof.gutachten, 0)} Gutachten`
    const cars = proof.variants === 1 ? 'für 1 Fahrzeugvariante freigegeben' : `für ${decimal(proof.variants, 0)} Fahrzeugvarianten freigegeben`

    return `${documents} · ${cars} · Freigabe vor dem Kauf geprüft`
})

const reviews = computed(() => props.reviews ?? [])

function starsLabel(n: number): string {
    return n === 1 ? '1 von 5 Sternen' : `${n} von 5 Sternen`
}

/* The large view of the photograph on screen. */
const zoomOpen = ref(false)

const basket = useForm({
    kind: 'WHEEL' as const,
    wheelConfigId: 0,
    tyreVariantId: null as number | null,
    weightColourId: null as number | null,
    rdks: null as 'ja' | 'nein' | null,
    quantity: 4,
})

/*
 * Nur Felgen or Komplettrad (the client's #18): one choice in the panel, and switching keeps everything else — the
 * finish, the size, the amount of rims and the tyre picked. The Komplettrad shows the tyres the verdict permits on the
 * size on screen; the page's one button adds what is chosen.
 */
type Mode = 'felgen' | 'komplettrad'

const mode = ref<Mode>('felgen')
const isSet = computed(() => mode.value === 'komplettrad')
const offer = computed(() => selected.value?.komplettrad ?? null)
const tyreId = ref<number | null>(null)

// A size brings its own tyres: the one picked stays where the new size offers it too, else the first is picked.
watch(
    offer,
    (current) => {
        const ids = current?.tyres.map((t) => t.id) ?? []

        if (tyreId.value === null || !ids.includes(tyreId.value)) {
            tyreId.value = ids[0] ?? null
        }
    },
    { immediate: true }
)

const tyre = computed(() => offer.value?.tyres.find((t) => t.id === tyreId.value) ?? null)

/*
 * What goes with a Komplettrad (#15): the Wuchtgewichte colour — the admin's default preselected — and the RDKS
 * answer, preselected only where the visitor already gave one for this car's make. Nothing of it under „Nur Felgen“.
 */
const options = computed(() => props.komplettradOptions ?? null)
const colourId = ref<number | null>(options.value?.colours.find((c) => c.isDefault)?.id ?? options.value?.colours[0]?.id ?? null)
const rdks = ref<'ja' | 'nein' | null>(options.value?.tpms.choice ?? null)

/* The set's price with the colour chosen: the server's figure for that colour, the default colour's where none. */
const setPrice = computed(() => {
    const current = tyre.value

    if (current === null) {
        return null
    }

    return current.prices?.find((p) => p.colourId === colourId.value) ?? { perWheel: current.perWheel, forFour: current.forFour }
})

/* `+ 196,00 € für 4 RDKS-Sensoren` under the set's price, once the visitor said yes. */
const sensorLine = computed(() => {
    const tpms = options.value?.tpms

    return isSet.value && rdks.value === 'ja' && tpms?.available && tpms.yesTotal ? `+ ${tpms.yesTotal} für ${tpms.quantity} RDKS-Sensoren` : null
})

/* `ab 965,00 € je Rad` on the Komplettrad choice: the server's lowest figure with the colour chosen, never one the page computed. */
const setFrom = computed(() => {
    const priced = (offer.value?.tyres ?? []).map(
        (t) => t.prices?.find((p) => p.colourId === colourId.value) ?? { perWheel: t.perWheel, forFourCents: t.forFourCents }
    )

    return priced.length === 0 ? null : priced.reduce((low, p) => (p.forFourCents < low.forFourCents ? p : low)).perWheel
})

/* A refusal of the last add belongs to the choice it was made under: another mode, size, tyre or colour starts clean (PDP-09). */
watch([mode, () => selected.value?.id, tyreId, colourId], () => basket.clearErrors())

/*
 * How many rims (#17): four preselected — a car takes four — and the price beside it is the server's figure for that
 * amount (`amounts`, LinePrice, D-102): the page picks a number, it never multiplies one. The button adds exactly the
 * amount on screen; before, it added four under one rim's price without a word (the client's #14).
 */
const amount = ref(4)

const maxAmount = computed(() => {
    const offered = selected.value?.amounts?.map((a) => a.quantity) ?? []
    const top = offered.length > 0 ? Math.max(...offered) : 1

    return Math.max(1, Math.min(top, selected.value?.stockQty ?? top))
})

// A size with fewer on the shelf than the amount chosen brings the amount down to what there is.
watch(maxAmount, (max) => {
    amount.value = Math.min(Math.max(1, amount.value), max)
}, { immediate: true })

// Another amount is another choice too: a refusal about the shelf was about the amount it was made with (PDP-09).
watch(amount, () => basket.clearErrors())

const amountPrice = computed(() => selected.value?.amounts?.find((a) => a.quantity === amount.value) ?? null)

/*
 * `4 × 229,00 € = 916,00 €` (the operator's wording for the client's #17): the amount, one rim's price and the total in
 * one line, so the figure beside the stepper can never be read as one rim's. Both prices are the server's — the line
 * shows the sum, it does not compute it.
 */
const amountNote = computed(() => {
    const current = selected.value

    if (current === null || amountPrice.value === null) {
        return `pro Felge, ${terms.value.note}`
    }

    return `${amount.value} × ${current.price} = ${amountPrice.value.text}, ${terms.value.note}`
})

/*
 * The stock tag. Demo stock is example data, so it never reads as "Auf Lager" — and never in the
 * colour that means a positive answer.
 */
const stockLabel = computed(() => {
    const inStock = selected.value?.inStock === true

    if (props.demo === true) {
        return inStock ? 'Beispielbestand' : 'Beispielbestand · ausverkauft'
    }

    return inStock ? 'Auf Lager' : 'Ausverkauft'
})

const stockTone = computed(() => {
    if (props.demo === true) {
        return 'tag--unknown'
    }

    return selected.value?.inStock === true ? 'tag--ok' : 'tag--danger'
})

/*
 * The Mittenlochbohrung is not a property of the rim alone (client, 2026-09-23): the approval
 * states its own bore for the vehicle it covers, and that is the number a customer with a chosen
 * car must read. So the details carry up to two rows, each named after what it is — the document's
 * figure for this car, and the rim's own — and never one row that could be taken for both.
 *
 * `centreBore` on the verdict is null when the covering documents state no bore (`UNSTATED`) or
 * state different ones (`CONFLICTING`). Neither case borrows the rim's figure: the page says what
 * it knows and leaves the gap open (CLAUDE.md §2).
 */
const documentBore = computed(() => selected.value?.verdict?.centreBore ?? null)
const boreConflict = computed(() => selected.value?.verdict?.centreBoreSource === 'CONFLICTING')

/* With a car chosen, the rim's own figure is named as the rim's, so it cannot read as the car's. */
const rimBoreLabel = computed(() =>
    selected.value?.verdict ? 'Mittenlochbohrung der Felge' : 'Mittenlochbohrung'
)

/* `H2` — the hump designation the wheel's approval prints, where the record holds one. */
const hump = computed(() => selected.value?.hump ?? null)

/* `620 kg` — shown only for a load rating somebody has verified. */
const maxLoad = computed(() => {
    const kg = (selected.value as RatedConfig | null)?.maxLoadKg

    return typeof kg === 'number' && kg > 0 ? withUnit(decimal(kg, 0), 'kg') : null
})

const canBuy = computed(() => {
    const current = selected.value

    if (current === null || !current.inStock) {
        return false
    }

    // A Komplettrad needs a tyre the server offered — which it does only with a car and a verdict that sells — and a
    // set's worth of rims on the shelf. The server asks the fitment engine again on the add (R-11).
    if (isSet.value) {
        return tyre.value !== null && current.stockQty >= (offer.value?.quantity ?? 4)
    }

    // With no vehicle the wheel can still be bought — RIMIFY simply makes no claim about it. With a
    // vehicle, an unsellable verdict is a hard stop.
    return current.verdict === null || current.verdict.sellable
})

const buyLabel = computed(() => {
    if (basket.processing) {
        return 'Wird hinzugefügt …'
    }

    if (selected.value !== null && !selected.value.inStock) {
        return 'Ausverkauft'
    }

    if (isSet.value) {
        return tyre.value === null ? 'Komplettrad gerade nicht möglich' : 'Als Komplettrad in den Warenkorb'
    }

    return 'In den Warenkorb'
})

/* The price beside the button, and its line: a set of Kompletträder, or the rims of the amount chosen. */
const shownPrice = computed(() => {
    if (isSet.value) {
        return setPrice.value?.forFour ?? null
    }

    return amountPrice.value?.text ?? selected.value?.price ?? config.fromPrice.value
})

const shownNote = computed(() => {
    if (!isSet.value) {
        return amountNote.value
    }

    const set = offer.value?.quantity ?? 4

    return setPrice.value === null ? '' : `für ${set} Kompletträder, je Rad ${setPrice.value.perWheel}, ${terms.value.note}`
})

/* The server's refusal of an add, under whichever key it answered with: the tyre for a Komplettrad, the size for rims. */
const addError = computed(() => basket.errors.tyreVariantId ?? basket.errors.wheelConfigId ?? basket.errors.rdks ?? basket.errors.weightColourId ?? null)

function addToBasket(): void {
    // One add at a time: a second press while the first is on its way does nothing.
    if (selected.value === null || !canBuy.value || basket.processing) {
        return
    }

    basket.wheelConfigId = selected.value.id
    basket.tyreVariantId = isSet.value ? (tyre.value?.id ?? null) : null
    // The weights and the sensors go only with a Komplettrad: rims alone carry neither (#15).
    basket.weightColourId = isSet.value ? colourId.value : null
    basket.rdks = isSet.value ? rdks.value : null
    basket.quantity = isSet.value ? (offer.value?.quantity ?? 4) : amount.value
    basket.post('/warenkorb', { preserveScroll: true })
}

const weight = computed(() => {
    const grams = selected.value?.weightG

    return grams === null || grams === undefined
        ? null
        : `${(grams / 1000).toFixed(1).replace('.', ',')} kg`
})

/* The sticky bar appears only once the main button has left the screen. */
const buyButton = ref<HTMLElement | null>(null)
const buyVisible = ref(true)
let observer: IntersectionObserver | null = null

onMounted(() => {
    if (buyButton.value === null || typeof IntersectionObserver === 'undefined') {
        return
    }

    observer = new IntersectionObserver(([entry]) => {
        buyVisible.value = entry?.isIntersecting ?? true
    })
    observer.observe(buyButton.value)
})

onBeforeUnmount(() => observer?.disconnect())

/* While the bar shows, it owns the bottom edge and the compare tray steps aside (PDP-02). */
const stickyShown = computed(() => !buyVisible.value && Boolean(selected.value))
claimBottomEdge(() => stickyShown.value)
</script>

<template>
    <Head :title="`${product.brandName} ${product.modelName}`" />

    <section class="section-dense">
        <div class="wrap">
            <nav class="pdp__crumbs t-small" aria-label="Brotkrumen">
                <Link href="/">Startseite</Link>
                <span aria-hidden="true">/</span>
                <Link href="/felgen">Felgen</Link>
                <span aria-hidden="true">/</span>
                <span aria-current="page" translate="no">{{ product.brandName }} {{ product.modelName }}</span>
            </nav>

            <div class="pdp">
                <!-- Gallery: the selected finish's own studio photograph, with a thumbnail per
                     further angle — only real shots, never drawings posing as three views. A
                     finish without a photograph is drawn, alone. The finish is chosen once, with
                     the swatches in the purchase panel. -->
                <div class="pdp__gallery">
                    <div class="well pdp__well">
                        <!-- The photograph is its own button: it opens the large view. -->
                        <button
                            v-if="shot"
                            type="button"
                            class="pdp__zoom"
                            aria-haspopup="dialog"
                            :aria-label="`Foto vergrößern: ${shotAlt}`"
                            @click="zoomOpen = true"
                        >
                            <Picture
                                :key="shot.name"
                                :image="shot"
                                :alt="shotAlt"
                                sizes="(min-width: 900px) 56vw, 100vw"
                                eager
                                class="pdp__picture"
                            />
                        </button>
                        <ProductPhoto
                            v-else
                            :spokes="product.spokes"
                            :finish="finish?.artFinish ?? 'graphite'"
                            :size="560"
                        />
                    </div>

                    <div v-if="shots.length > 1" class="pdp__thumbs" role="group" aria-label="Ansichten">
                        <button
                            v-for="(view, i) in shots"
                            :key="view.name"
                            type="button"
                            class="pdp__thumb"
                            :aria-pressed="i === shotIndex"
                            :aria-label="view.label"
                            @click="shotIndex = i"
                        >
                            <Picture :image="view" alt="" sizes="72px" class="pdp__thumb-picture" />
                        </button>
                    </div>

                    <p v-if="photoNote" class="t-small quiet pdp__photo-note">{{ photoNote }}</p>

                    <!-- The large view. Reka traps the focus, closes on Escape and on the scrim,
                         and hands the focus back to the photograph. -->
                    <DialogRoot v-model:open="zoomOpen">
                        <DialogPortal>
                            <DialogOverlay class="overlay" />
                            <DialogContent class="dialog pdp-zoom" aria-describedby="">
                                <div class="dialog__head">
                                    <DialogTitle class="pdp-zoom__title">{{ shotAlt }}</DialogTitle>
                                    <DialogClose class="icon-btn dialog__close" aria-label="Schließen">
                                        <Icon name="close" :size="24" />
                                    </DialogClose>
                                </div>
                                <div class="pdp-zoom__frame">
                                    <Picture
                                        v-if="shot"
                                        :key="`zoom-${shot.name}`"
                                        :image="shot"
                                        :alt="shotAlt"
                                        sizes="(min-width: 900px) 80vw, 100vw"
                                        eager
                                        class="pdp-zoom__picture"
                                    />
                                </div>
                            </DialogContent>
                        </DialogPortal>
                    </DialogRoot>
                </div>

                <!-- The purchase panel. The H1 names the brand; no eyebrow repeats it above. -->
                <div class="pdp__buy">
                    <!-- The brand, the model and the type designation are names and codes, never
                         words: a page translator would turn them into English. -->
                    <h1 class="t-h1" translate="no">{{ product.brandName }} {{ product.modelName }}</h1>
                    <p v-if="product.typeDesignation" class="data pdp__type">Typ <ValueText :text="product.typeDesignation" whole /></p>
                    <!-- The buyers' stars, computed from their reviews alone (D-103), leading to them; until there are
                         any, what the page can prove instead — never an empty row of stars. -->
                    <a v-if="product.rating !== null && product.ratingCount > 0" href="#bewertungen" class="stars pdp__rating">
                        <span class="stars__glyph" aria-hidden="true">★</span>
                        <span class="tabular"><ValueText :text="product.ratingLabel ?? ''" /></span>
                    </a>
                    <p v-else-if="proofLine" class="t-small pdp__proof">{{ proofLine }}</p>

                    <div class="pdp__block">
                        <span class="label">Farbe · <span translate="no">{{ finish?.name }}</span></span>
                        <div class="pdp__swatches">
                            <button
                                v-for="item in finishes"
                                :key="item.id"
                                class="pdp__swatch"
                                :class="{ 'pdp__swatch--on': item.id === config.finishId.value }"
                                type="button"
                                :aria-pressed="item.id === config.finishId.value"
                                @click="config.selectFinish(item.id)"
                            >
                                <!-- The finish's real colour is catalogue data, not a design
                                     value, so it arrives as a custom property from the row — and
                                     the style inventory is told not to hold it to the palette. -->
                                <span class="pdp__dot" data-qa-ignore :style="item.hex ? { '--swatch': item.hex } : undefined" />
                                <span translate="no">{{ item.name }}</span>
                            </button>
                        </div>
                    </div>

                    <!-- `#groessen`: where the compare page's "Größe wählen" lands. -->
                    <div id="groessen" class="pdp__block">
                        <span class="label">Durchmesser (<span translate="no">Zoll</span>)</span>
                        <div class="chip-row pdp__chips">
                            <button
                                v-for="size in config.sizes.value"
                                :key="size.diameter"
                                class="chip"
                                :class="{
                                    'chip--on': selected?.id === size.config.id,
                                    'chip--blocked': size.blocked,
                                    'chip--unconfirmed': size.unconfirmed,
                                }"
                                type="button"
                                :disabled="size.blocked"
                                :aria-pressed="selected?.id === size.config.id"
                                :title="size.reason ?? undefined"
                                @click="config.selectSize(size)"
                            >
                                <!-- The number only: `title` carries the German reason a size is
                                     blocked, and a marked button would keep that untranslated too. -->
                                <span translate="no">{{ size.label }}</span>
                            </button>
                        </div>

                        <!-- Shown, not hidden: it tells the customer something true about their car. -->
                        <p v-if="blockedNote" class="t-small quiet pdp__note">{{ blockedNote }}</p>
                        <p v-if="unconfirmedNote" class="t-small quiet pdp__note" data-note="unconfirmed">{{ unconfirmedNote }}</p>
                    </div>

                    <!-- With a Komplettrad's tyre chosen, the answer for that tyre's size (#18): its Eintragung, its Auflagen. -->
                    <FitmentPanel
                        class="pdp__fit"
                        :verdict="selected?.verdict ?? null"
                        :vehicle="shared.vehicle"
                        :config-id="selected?.id ?? null"
                        :chosen="isSet ? (tyre?.answer ?? null) : null"
                        :ask-href="askAboutTyres"
                    >
                        <Link v-if="!hasVehicle" href="/felgen-suchen" class="btn btn--secondary btn--sm pdp__fit-cta">
                            Fahrzeug wählen
                        </Link>
                    </FitmentPanel>

                    <!-- Nur Felgen or Komplettrad (#18): switching keeps the finish, the size, the amount and the tyre. -->
                    <BuyModeChoice v-model="mode" class="pdp__block pdp__mode" :rim-price="selected?.price ?? null" :set-from="setFrom" />

                    <!-- The tyres the verdict permits on this size, or the sentence why there are none. -->
                    <KomplettradChoice
                        v-if="isSet && offer"
                        v-model="tyreId"
                        v-model:colour-id="colourId"
                        v-model:rdks="rdks"
                        class="pdp__block"
                        :offer="offer"
                        :options="options"
                    />

                    <div class="pdp__price">
                        <!-- The price of the amount chosen beside it, as the basket will charge it, and one rim's in the line under it.
                             A refused Komplettrad has no price; the stock and the shipping below stand all the same. -->
                        <div v-if="shownPrice" class="pdp__price-row">
                            <div>
                                <p class="price price--lg pdp__total" translate="no">{{ shownPrice }}</p>
                                <p class="price-note pdp__each">{{ shownNote }}</p>
                                <p v-if="isSet && offer?.priceOpen" class="price-note">Ohne Montage und Auswuchten – der Preis dafür steht noch nicht fest.</p>
                                <p v-if="sensorLine" class="price-note pdp__sensors">{{ sensorLine }}</p>
                            </div>
                            <AmountStepper
                                v-if="!isSet && selected && amountPrice"
                                v-model="amount"
                                class="pdp__amount"
                                label="Anzahl"
                                :min="1"
                                :max="maxAmount"
                                :disabled="!canBuy"
                            />
                        </div>
                        <!-- Einstellungen › Verkäufer & Versand: only what is given, never a placeholder (Shipping::summary). -->
                        <p v-if="shipping" class="price-note pdp__shipping">{{ shipping }}</p>
                        <span class="tag pdp__stock" :class="stockTone">{{ stockLabel }}</span>
                        <p v-if="demo" class="t-small pdp__demo">
                            Beispielsortiment: Diese Felge kannst du dir ansehen und in den Warenkorb
                            legen, bestellen kannst du sie noch nicht.
                        </p>
                        <!-- The acceptance set (rimify:demo --abnahme): demo data, ordered with the test payment only. -->
                        <p v-else-if="acceptance" class="t-small pdp__demo">
                            Demodaten zum Ausprobieren: Bestellen geht hier nur mit der Testzahlung, verschickt wird nichts.
                        </p>
                    </div>

                    <div ref="buyButton">
                        <!-- Busy, never disabled, while it sends: a disabled button drops the focus to the page (#16). -->
                        <button
                            class="btn btn--primary btn--block btn--lg pdp__add"
                            type="button"
                            :disabled="!canBuy"
                            :aria-busy="basket.processing ? 'true' : undefined"
                            @click="addToBasket"
                        >
                            {{ buyLabel }}
                        </button>
                        <p v-if="addError" class="notice notice--bad pdp__add-error" role="alert">
                            <Icon name="warning" :size="20" />
                            <span>{{ addError }}</span>
                        </p>
                    </div>
                </div>
            </div>

            <!-- What the Gutachten asks of the car, in full: the panel above gives the overview and links here. -->
            <!-- The papers' sentence is the verdict's (#21): not listed here a second time. -->
            <FitmentDetail
                v-if="selected?.verdict?.detail && shared.vehicle"
                :detail="selected.verdict.detail"
                :vehicle-label="shared.vehicle.label"
                :omit="[ENTRY_REQUIRED, ABNAHME_REQUIRED]"
            />

            <!-- Mischbereifung (#20, D-105): a Komplettrad of its own, only where the released Gutachten prints its
                 table of front/rear pairs; the server sends null everywhere else. Not under „Nur Felgen“ (#15). -->
            <MischbereifungOffer
                v-if="isSet && selected && selected.mischbereifung"
                :weight-colour-id="colourId"
                :rdks="rdks"
                class="pdp__komplettrad"
                :offer="selected.mischbereifung"
                :wheel-config-id="selected.id"
            />

            <!-- Felgendetails: the measured values, mono and right-aligned, for the size chosen above. -->
            <section v-if="selected" class="pdp__specs" aria-labelledby="pdp-specs">
                <h2 id="pdp-specs" class="t-h2">Felgendetails</h2>
                <!-- Four figures joined by separators: each is marked and unbreakable on its own,
                     so the line still wraps between them on a phone. -->
                <p class="t-small quiet pdp__specs-for">Für <ValueText :text="selected.fullLabel" /></p>

                <!-- Every `dd` is a measured value with its unit, a token or a number. The `dt`
                     beside it is the German term and stays translatable. -->
                <dl class="spec">
                    <div class="spec__row">
                        <dt>Größe</dt>
                        <dd class="t-mono" translate="no">{{ selected.sizeLabel }}</dd>
                    </div>
                    <div class="spec__row">
                        <dt>Lochkreis</dt>
                        <dd class="t-mono" translate="no">{{ selected.boltPattern }}</dd>
                    </div>
                    <!-- The bore the document states for the chosen car comes first: it is the
                         one that decides whether the wheel centres on this hub. -->
                    <div v-if="documentBore" class="spec__row spec__row--doc">
                        <dt>
                            Mittenlochbohrung für dein Fahrzeug
                            <span class="spec__hint">laut Gutachten</span>
                        </dt>
                        <dd class="t-mono" translate="no">{{ documentBore }}</dd>
                    </div>
                    <div class="spec__row">
                        <dt>{{ rimBoreLabel }}</dt>
                        <dd class="t-mono" translate="no">{{ selected.centreBore }}</dd>
                    </div>
                    <div class="spec__row">
                        <dt>Einpresstiefe (ET)</dt>
                        <dd class="t-mono" translate="no">{{ selected.etMm }} mm</dd>
                    </div>
                    <div v-if="hump" class="spec__row">
                        <dt>Hump</dt>
                        <dd class="t-mono" translate="no">{{ hump }}</dd>
                    </div>
                    <div v-if="finish" class="spec__row">
                        <dt>Farbe</dt>
                        <dd class="t-mono" translate="no">{{ finish.name }}</dd>
                    </div>
                    <div v-if="product.spokes > 0" class="spec__row">
                        <dt>Speichen</dt>
                        <dd class="t-mono" translate="no">{{ product.spokes }}</dd>
                    </div>
                    <div v-if="weight" class="spec__row">
                        <dt>Gewicht pro Felge</dt>
                        <dd class="t-mono" translate="no">{{ weight }}</dd>
                    </div>
                    <div v-if="maxLoad" class="spec__row">
                        <dt>Traglast</dt>
                        <dd class="t-mono" translate="no">{{ maxLoad }}</dd>
                    </div>
                    <div v-if="selected.kbaNumber" class="spec__row">
                        <dt>KBA-Nummer</dt>
                        <dd class="t-mono" translate="no">{{ selected.kbaNumber }}</dd>
                    </div>
                    <div class="spec__row">
                        <dt>Artikelnummer</dt>
                        <dd class="t-mono" translate="no">{{ selected.sku }}</dd>
                    </div>
                </dl>

                <!-- Two covering documents that state different bores for this car: the page names
                     neither of them, because picking one would be a guess about the figure that
                     decides whether the wheel centres on the hub (CLAUDE.md §2). -->
                <p v-if="boreConflict" class="t-small quiet pdp__specs-note">
                    Für dein Fahrzeug nennen die Gutachten unterschiedliche Mittenlochbohrungen.
                    Wir zeigen dir deshalb nur das Maß der Felge.
                </p>

                <p v-if="product.descriptionDe" class="t-body pdp__desc">{{ product.descriptionDe }}</p>
            </section>

            <!--
                The buyers' reviews (#19, D-103), only where there are some: no empty shell. § 5b Abs. 3 UWG asks a shop that
                shows reviews to say whether and how it checks them — the sentence under the heading does.
            -->
            <section v-if="reviews.length > 0" id="bewertungen" class="pdp__reviews" aria-labelledby="pdp-reviews">
                <h2 id="pdp-reviews" class="t-h2">Bewertungen</h2>
                <p v-if="product.ratingLabel" class="stars pdp__reviews-sum">
                    <span class="stars__glyph" aria-hidden="true">★</span>
                    <span class="tabular"><ValueText :text="product.ratingLabel" /></span>
                </p>
                <p class="t-small quiet pdp__reviews-check">
                    Alle Bewertungen stammen von Kundinnen und Kunden, die diese Felge hier gekauft haben. Wir prüfen das über die
                    Bestellnummer.
                </p>
                <ul class="pdp__review-list">
                    <li v-for="review in reviews" :key="review.id" class="pdp__review">
                        <p class="pdp__review-head">
                            <span class="pdp__review-stars" role="img" :aria-label="starsLabel(review.rating)">
                                <Icon v-for="n in 5" :key="n" name="star" :size="16" :class="n <= review.rating ? 'pdp__star-on' : 'pdp__star-off'" />
                            </span>
                            <span class="t-small quiet">Geprüfter Kauf<template v-if="review.at"> · {{ review.at }}</template></span>
                        </p>
                        <p v-if="review.body" class="t-body pdp__review-body">{{ review.body }}</p>
                        <p v-if="review.reply" class="t-small pdp__review-reply"><strong>Antwort von RIMIFY:</strong> {{ review.reply }}</p>
                    </li>
                </ul>
            </section>

            <!--
                GPSR (Verordnung (EU) 2023/988, Art. 19): the manufacturer as they name themselves, the responsible
                person in the EU where there is one, the product's identification and the manufacturer's safety
                information — entered per brand in Katalog › Marken, never filled in by the shop.
            -->
            <section class="pdp__gpsr" aria-labelledby="pdp-gpsr">
                <h2 id="pdp-gpsr" class="t-h3">Hersteller und Produktsicherheit</h2>
                <dl v-if="product.manufacturer" class="pdp__gpsr-list">
                    <div class="pdp__gpsr-row">
                        <dt>Hersteller</dt>
                        <dd class="pdp__gpsr-value">{{ product.manufacturer.name }}<br>{{ product.manufacturer.address }}<br><a v-if="webAddress(product.manufacturer.contact)" class="link" :href="webAddress(product.manufacturer.contact) ?? undefined" rel="noopener" target="_blank">{{ product.manufacturer.contact }}</a><span v-else translate="no">{{ product.manufacturer.contact }}</span></dd>
                    </div>
                    <div v-if="product.manufacturer.euResponsible" class="pdp__gpsr-row">
                        <dt>Verantwortliche Person in der EU</dt>
                        <dd class="pdp__gpsr-value">
                            {{ product.manufacturer.euResponsible.name }}<template v-if="product.manufacturer.euResponsible.address"><br>{{ product.manufacturer.euResponsible.address }}</template><template v-if="product.manufacturer.euResponsible.contact"><br>{{ product.manufacturer.euResponsible.contact }}</template>
                        </dd>
                    </div>
                    <div class="pdp__gpsr-row">
                        <dt>Produkt</dt>
                        <dd class="pdp__gpsr-value">
                            {{ product.brandName }} {{ product.modelName }}<template v-if="product.typeDesignation"> · Typ {{ product.typeDesignation }}</template><template v-if="selected"> · Artikelnummer {{ selected.sku }}</template>
                        </dd>
                    </div>
                    <div v-if="product.manufacturer.safetyNote" class="pdp__gpsr-row">
                        <dt>Sicherheitshinweise</dt>
                        <dd class="pdp__gpsr-value">{{ product.manufacturer.safetyNote }}</dd>
                    </div>
                </dl>
                <p v-else class="t-small quiet">
                    Die Angaben des Herstellers zu dieser Felge liegen uns noch nicht vor. Fragen dazu beantworten wir dir
                    gern – <Link :href="askAboutMaker">schreib uns</Link>.
                </p>
            </section>
        </div>
    </section>

    <!-- The sticky bar: price and the one action, once the main button is off screen — on every width (D-132). -->
    <div v-if="stickyShown" class="stickybar pdp__sticky">
        <div v-if="shownPrice" class="pdp__sticky-price">
            <p class="price" translate="no">{{ shownPrice }}</p>
            <p v-if="isSet" class="price-note">für {{ offer?.quantity ?? 4 }} Kompletträder</p>
            <p v-else class="price-note">{{ amountPrice ? (amount === 1 ? 'für 1 Felge' : `für ${amount} Felgen`) : 'pro Felge' }}</p>
        </div>
        <button
            class="btn btn--primary pdp__sticky-btn"
            type="button"
            :disabled="!canBuy"
            :aria-busy="basket.processing ? 'true' : undefined"
            @click="addToBasket"
        >
            {{ isSet && canBuy && !basket.processing ? 'In den Warenkorb' : buyLabel }}
        </button>
    </div>
</template>

<style scoped>
.pdp__gpsr {
    max-width: 75ch;
    margin-top: var(--space-7);
    padding-top: var(--space-5);
    border-top: 1px solid var(--line);
}

.pdp__gpsr-list {
    margin: var(--space-3) 0 0;
    border-top: 1px solid var(--line);
}

/* Term and value on one baseline, the value column even; stacked on a phone. */
.pdp__gpsr-row {
    display: grid;
    gap: var(--space-1);
    padding-block: var(--space-3);
    border-bottom: 1px solid var(--line);
}

.pdp__gpsr-row dt {
    color: var(--ink2);
}

.pdp__gpsr-row dd {
    margin: 0;
}

@media (min-width: 768px) {
    .pdp__gpsr-row {
        grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
        gap: var(--space-4);
        align-items: baseline;
    }
}

/* An address is lines as the manufacturer wrote them; the value is prose, not a measurement. */
.pdp__gpsr-value {
    white-space: pre-line;
}

.pdp__crumbs {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
    color: var(--ink3);
}

.pdp__crumbs a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    /* `Felgen` came out 42px wide — two short of a thumb, which is still short (DIRECTION §6). */
    min-width: 44px;
    min-height: 44px;
    color: var(--ink2);
    text-decoration: none;
}

.pdp {
    display: grid;
    gap: var(--space-6);
    align-items: start;
}

/* On a phone the frame is capped so the purchase panel is reachable without a long scroll. */
.pdp__well {
    max-width: min(100%, 56vh);
    margin-inline: auto;
}

/* The photograph fills the square well; the cut-out is framed in the pipeline, so no padding. */
.pdp__picture {
    position: absolute;
    inset: 0;
}

.pdp__picture :deep(img),
.pdp__thumb-picture :deep(img),
.pdp-zoom__picture :deep(img) {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

/* The photograph as a button: it fills the well and shows it can be enlarged. */
.pdp__zoom {
    position: absolute;
    inset: 0;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: zoom-in;
}

.pdp__zoom:focus-visible {
    outline: 2px solid var(--c-blue);
    outline-offset: -4px;
}

/* The large view: the dialog surface, as wide as the screen allows, the photograph square inside. */
.pdp-zoom {
    width: calc(100vw - 2 * var(--sp-20));
    max-width: 1080px;
    padding: var(--sp-16);
}

.pdp-zoom__title {
    font-size: var(--fs-small);
    font-weight: 500;
    color: var(--c-ink-2);
}

.pdp-zoom__frame {
    position: relative;
    width: min(100%, calc(100dvh - 2 * var(--sp-20) - 2 * var(--sp-16) - 64px));
    aspect-ratio: 1 / 1;
    margin-inline: auto;
}

.pdp-zoom__picture {
    position: absolute;
    inset: 0;
}

.pdp__thumbs {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--sp-8);
    margin-top: var(--sp-12);
}

/* Which size the photograph is of, under it: said where the size on screen is another. */
.pdp__photo-note {
    margin: var(--sp-8) 0 0;
    text-align: center;
}

.pdp__thumb {
    display: grid;
    width: 72px;
    height: 72px;
    padding: var(--sp-4);
    border: 1px solid var(--c-line);
    border-radius: var(--r-tile);
    background: var(--c-band);
    cursor: pointer;
}

.pdp__thumb[aria-pressed='true'] {
    border-color: var(--c-ink);
    outline: 1px solid var(--c-ink);
    outline-offset: -2px;
}

@media (hover: hover) and (pointer: fine) {
    .pdp__thumb:hover {
        border-color: var(--c-ink-3);
    }
}

.pdp__type {
    margin-top: var(--space-1);
}

.pdp__rating {
    margin-top: var(--space-2);
}

.pdp__block {
    margin-top: var(--space-5);
}

.pdp__swatches {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-2);
}

.pdp__swatch {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    padding-inline: var(--space-3);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    font-size: var(--text-small);
    font-weight: 700;
    color: var(--ink2);
    cursor: pointer;
}

.pdp__swatch--on {
    border-color: var(--border-strong);
    color: var(--ink);
}

/* The swatch shows the finish's catalogue colour; a finish without one falls back to neutral ink. */
.pdp__dot {
    width: 16px;
    height: 16px;
    border-radius: var(--radius-round);
    border: 1px solid var(--line);
    background: var(--swatch, var(--ink2));
}

.pdp__chips {
    margin-top: var(--space-2);
}

.pdp__note {
    margin-top: var(--space-2);
}

.pdp__fit {
    margin-top: var(--space-5);
}

.pdp__fit-cta {
    margin-top: var(--space-3);
}

.pdp__price {
    margin-top: var(--space-5);
}

.pdp__proof {
    margin: var(--space-1) 0 0;
    color: var(--ink2);
}

a.pdp__rating {
    color: inherit;
    text-decoration: none;
}

@media (hover: hover) and (pointer: fine) {
    a.pdp__rating:hover {
        text-decoration: underline;
        text-underline-offset: 3px;
    }
}

/* ── The buyers' reviews (D-103) ── */
.pdp__reviews {
    margin-top: var(--space-8);
    max-width: 880px;
}

.pdp__reviews-sum,
.pdp__reviews-check {
    margin: var(--space-2) 0 0;
}

.pdp__review-list {
    display: grid;
    margin: var(--space-4) 0 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--line);
}

.pdp__review {
    display: grid;
    gap: var(--space-2);
    padding-block: var(--space-4);
    border-bottom: 1px solid var(--line-s);
}

.pdp__review-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2) var(--space-3);
    margin: 0;
}

.pdp__review-stars {
    display: inline-flex;
    gap: 2px;
}

/* `--c-star`: ratings only (DIRECTION §2). */
.pdp__star-on {
    color: var(--c-star);
}

.pdp__star-off {
    color: var(--c-line);
}

.pdp__review-body,
.pdp__review-reply {
    margin: 0;
    max-width: 72ch;
}

.pdp__review-reply {
    padding-left: var(--space-3);
    border-left: 2px solid var(--line);
    color: var(--ink2);
}

.pdp__review-reply strong {
    color: var(--ink);
}

/* The price and how many, side by side; the stepper drops under the price when the column is narrow. */
.pdp__price-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--space-3) var(--space-5);
}

.pdp__amount {
    flex: none;
}

.pdp__stock {
    margin-top: var(--space-2);
}

.pdp__demo {
    margin-top: var(--space-2);
    color: var(--ink2);
}

.pdp__add {
    margin-top: var(--space-4);
}

.pdp__add-error {
    margin-top: var(--space-3);
}

.pdp__komplettrad {
    margin-top: var(--space-8);
}

.pdp__specs {
    margin-top: var(--space-8);
    max-width: 880px;
}

.pdp__specs-for {
    margin-top: var(--space-1);
}

.spec {
    margin: var(--space-4) 0 0;
    border-top: 1px solid var(--line);
}

.spec__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    min-height: 44px;
    padding-block: var(--space-2);
    border-bottom: 1px solid var(--line-s);
}

.spec__row dt {
    color: var(--ink2);
}

/* Which source a figure comes from, under the term it belongs to — never beside the value, where
   it would read as part of the measurement. */
.spec__hint {
    display: block;
    color: var(--ink3);
    font-size: var(--text-small);
    font-weight: 400;
}

/* The document's own figure is the row that answers the customer's question, so it carries the
   weight the rim's row does not. */
.spec__row--doc dt,
.spec__row--doc dd {
    color: var(--ink);
    font-weight: 700;
}

.pdp__specs-note {
    margin-top: var(--space-3);
}

.spec__row dd {
    margin: 0;
    text-align: right;
    color: var(--ink);
}

.pdp__desc {
    margin-top: var(--space-5);
    color: var(--ink2);
}

.pdp__sticky-price {
    flex: 1;
    min-width: 0;
}

/* A price is one figure: it never breaks across lines; the note under it may, at 320 px (PDP-03). */
.pdp__sticky-price .price {
    white-space: nowrap;
}

.pdp__sticky-btn {
    flex: none;
}

@media (min-width: 900px) {
    .pdp {
        grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
        gap: var(--space-7);
    }

    .pdp__well {
        max-width: none;
    }

    .pdp__buy {
        position: sticky;
        top: calc(var(--header-h) + var(--space-4));
    }

    /*
     * On a desktop too, once the button has left the screen (D-132): with the verdict and the Komplettrad's choices above
     * it, the button stood at 1.470 px — 2.227 px with Komplettrad — on a 900 px screen. The price and the button stand
     * at the content's right edge, under the purchase column.
     */
    .pdp__sticky {
        justify-content: flex-end;
        padding-inline: max(var(--page-margin), calc((100% - var(--content-max)) / 2));
    }

    .pdp__sticky-price {
        flex: none;
        text-align: right;
    }

    .pdp__sticky-btn {
        min-width: 240px;
    }
}
</style>
