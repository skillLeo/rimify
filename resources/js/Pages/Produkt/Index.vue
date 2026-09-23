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
 * Beneath the purchase panel the page offers the same size as a Komplettrad — only the tyres the
 * verdict permits, priced on the server, or the one sentence saying why there are none. The offer
 * travels inside the configuration, so a size change swaps it in the same commit as the price.
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

import { Head, Link, useForm } from '@inertiajs/vue3'
import { DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import FitmentPanel from '../../Components/Product/FitmentPanel.vue'
import KomplettradOffer from '../../Components/Product/KomplettradOffer.vue'
import ProductPhoto from '../../Components/Product/ProductPhoto.vue'
import Icon from '../../Components/Ui/Icon.vue'
import Picture, { type ImageView } from '../../Components/Ui/Picture.vue'
import ValueText from '../../Components/Ui/ValueText.vue'
import { useConfigurator } from '../../composables/useConfigurator'
import { useShared } from '../../composables/useShared'
import { decimal, withUnit } from '../../format'
import type { ProduktConfig, ProduktProps } from '../../types/pages'

defineOptions({ layout: AppLayout })

/** The load rating per wheel travels with each configuration; null where none is verified. */
type RatedConfig = ProduktConfig & { maxLoadKg?: number | null }

const props = defineProps<ProduktProps & { demo?: boolean }>()

const shared = useShared()
const config = useConfigurator(() => props.configs, props.finishes[0]?.id ?? 0)

const finish = computed(() => props.finishes.find((f) => f.id === config.finishId.value) ?? null)
const selected = computed(() => config.selected.value)

/* The finish's photographs: the front view (the manifest itself), then its other angles. */
const shots = computed<ImageView[]>(() => {
    const image = finish.value?.image ?? null

    if (image === null) {
        return []
    }

    const { views = [], ...front } = image

    return [{ ...front, label: 'Ansicht von vorn' }, ...views]
})
const shotIndex = ref(0)
const shot = computed(() => shots.value[shotIndex.value] ?? null)
const shotAlt = computed(() => `${props.product.brandName} ${props.product.modelName} in ${finish.value?.name ?? ''}, ${shot.value?.label ?? ''}`)

// Another finish starts on its own front view.
watch(
    () => config.finishId.value,
    () => {
        shotIndex.value = 0
    }
)

/* The large view of the photograph on screen. */
const zoomOpen = ref(false)

const basket = useForm({
    kind: 'WHEEL' as const,
    wheelConfigId: 0,
    quantity: 4,
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

    return 'In den Warenkorb'
})

function addToBasket(): void {
    if (selected.value === null || !canBuy.value) {
        return
    }

    basket.wheelConfigId = selected.value.id
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
                    <p v-if="product.rating !== null && product.ratingCount > 0" class="stars pdp__rating">
                        <span class="stars__glyph" aria-hidden="true">★</span>
                        <span class="tabular"><ValueText :text="product.ratingLabel ?? ''" /></span>
                    </p>

                    <div class="pdp__block">
                        <span class="micro">Farbe · <span translate="no">{{ finish?.name }}</span></span>
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
                                     value, so it arrives as a custom property from the row. -->
                                <span class="pdp__dot" :style="item.hex ? { '--swatch': item.hex } : undefined" />
                                <span translate="no">{{ item.name }}</span>
                            </button>
                        </div>
                    </div>

                    <!-- `#groessen`: where the compare page's "Größe wählen" lands. -->
                    <div id="groessen" class="pdp__block">
                        <span class="micro">Durchmesser (<span translate="no">Zoll</span>)</span>
                        <div class="chip-row pdp__chips">
                            <button
                                v-for="size in config.sizes.value"
                                :key="size.diameter"
                                class="chip"
                                :class="{
                                    'chip--on': selected?.id === size.config.id,
                                    'chip--blocked': size.blocked,
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
                        <p v-if="config.sizes.value.some((s) => s.blocked)" class="t-small quiet pdp__note">
                            Durchgestrichene Größen sind für dein Fahrzeug nicht freigegeben.
                        </p>
                    </div>

                    <FitmentPanel class="pdp__fit" :verdict="selected?.verdict ?? null" :vehicle="shared.vehicle">
                        <Link v-if="!hasVehicle" href="/felgen-suchen" class="btn btn--secondary btn--sm pdp__fit-cta">
                            Fahrzeug wählen
                        </Link>
                    </FitmentPanel>

                    <div class="pdp__price">
                        <p class="price price--lg" translate="no">{{ selected?.price ?? config.fromPrice.value }}</p>
                        <p class="price-note">für 4 Felgen, inkl. MwSt., zzgl. Versand</p>
                        <span class="tag pdp__stock" :class="stockTone">{{ stockLabel }}</span>
                        <p v-if="demo" class="t-small pdp__demo">
                            Beispielsortiment: Diese Felge kannst du dir ansehen und in den Warenkorb
                            legen, bestellen kannst du sie noch nicht.
                        </p>
                    </div>

                    <!-- `#felgen-kaufen`: where the Komplettrad section's "Nur die Felgen bestellen" lands. -->
                    <div id="felgen-kaufen" ref="buyButton">
                        <button
                            class="btn btn--primary btn--block btn--lg pdp__add"
                            type="button"
                            :disabled="!canBuy || basket.processing"
                            @click="addToBasket"
                        >
                            {{ buyLabel }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- The same size as a Komplettrad: only what the verdict permits, priced on the
                 server, or one sentence and a way forward. Absent only in fixtures. -->
            <KomplettradOffer
                v-if="selected && selected.komplettrad"
                class="pdp__komplettrad"
                :offer="selected.komplettrad"
                :wheel-config-id="selected.id"
                :contact-email="shared.contact.email"
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
        </div>
    </section>

    <!-- The phone's sticky bar: price and the one action, once the main button is off screen. -->
    <div v-if="!buyVisible && selected" class="stickybar pdp__sticky">
        <div class="pdp__sticky-price">
            <p class="price" translate="no">{{ selected.price }}</p>
            <p class="price-note">für 4 Felgen, inkl. MwSt., zzgl. Versand</p>
        </div>
        <button
            class="btn btn--primary pdp__sticky-btn"
            type="button"
            :disabled="!canBuy || basket.processing"
            @click="addToBasket"
        >
            {{ buyLabel }}
        </button>
    </div>
</template>

<style scoped>
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

    /* The desktop panel keeps its button in view already; the bar is for phones. */
    .pdp__sticky {
        display: none;
    }
}
</style>
