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
 * On a phone the price and the button follow the customer down the page once the main button has
 * scrolled away — the one persistent bar the storefront uses, because it is the page's next action.
 */

import { Head, Link, useForm } from '@inertiajs/vue3'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import FitmentPanel from '../../Components/Product/FitmentPanel.vue'
import ProductPhoto from '../../Components/Product/ProductPhoto.vue'
import { useConfigurator } from '../../composables/useConfigurator'
import { useShared } from '../../composables/useShared'
import type { ProduktProps } from '../../types/pages'

defineOptions({ layout: AppLayout })

const props = defineProps<ProduktProps>()

const shared = useShared()
const config = useConfigurator(() => props.configs, props.finishes[0]?.id ?? 0)

const finish = computed(() => props.finishes.find((f) => f.id === config.finishId.value) ?? null)
const selected = computed(() => config.selected.value)

const basket = useForm({
    kind: 'WHEEL' as const,
    wheelConfigId: 0,
    tyreVariantId: null as number | null,
    quantity: 4,
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
                <span aria-current="page">{{ product.brandName }} {{ product.modelName }}</span>
            </nav>

            <div class="pdp">
                <!-- Gallery: one frame, the finish that is selected. No thumbnail strip until
                     three real photographs exist — three drawings would claim three shots. The
                     finish is chosen once, with the swatches in the purchase panel. -->
                <div class="pdp__gallery">
                    <div class="well pdp__well">
                        <ProductPhoto
                            :spokes="product.spokes"
                            :finish="finish?.artFinish ?? 'graphite'"
                            :size="560"
                        />
                    </div>
                </div>

                <!-- The purchase panel. The H1 names the brand; no eyebrow repeats it above. -->
                <div class="pdp__buy">
                    <h1 class="t-h1">{{ product.brandName }} {{ product.modelName }}</h1>
                    <p v-if="product.typeDesignation" class="data pdp__type">Typ {{ product.typeDesignation }}</p>
                    <p v-if="product.rating !== null && product.ratingCount > 0" class="stars pdp__rating">
                        <span class="stars__glyph" aria-hidden="true">★</span>
                        <span class="tabular">{{ product.ratingLabel }}</span>
                    </p>

                    <div class="pdp__block">
                        <span class="micro">Farbe · {{ finish?.name }}</span>
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
                                {{ item.name }}
                            </button>
                        </div>
                    </div>

                    <div class="pdp__block">
                        <span class="micro">Durchmesser (Zoll)</span>
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
                                {{ size.label }}
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
                        <p class="price price--lg">{{ selected?.price ?? config.fromPrice.value }}</p>
                        <p class="price-note">für 4 Felgen, inkl. MwSt., zzgl. Versand</p>
                        <span class="tag pdp__stock" :class="selected?.inStock ? 'tag--ok' : 'tag--danger'">
                            {{ selected?.inStock ? 'Auf Lager' : 'Ausverkauft' }}
                        </span>
                    </div>

                    <div ref="buyButton">
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

            <!-- Felgendetails: the measured values, mono and right-aligned, for the size chosen above. -->
            <section v-if="selected" class="pdp__specs" aria-labelledby="pdp-specs">
                <h2 id="pdp-specs" class="t-h2">Felgendetails</h2>
                <p class="t-small quiet pdp__specs-for">Für {{ selected.fullLabel }}</p>

                <dl class="spec">
                    <div class="spec__row">
                        <dt>Größe</dt>
                        <dd class="t-mono">{{ selected.sizeLabel }}</dd>
                    </div>
                    <div class="spec__row">
                        <dt>Lochkreis</dt>
                        <dd class="t-mono">{{ selected.boltPattern }}</dd>
                    </div>
                    <div class="spec__row">
                        <dt>Mittenlochbohrung</dt>
                        <dd class="t-mono">{{ selected.centreBore }}</dd>
                    </div>
                    <div class="spec__row">
                        <dt>Einpresstiefe (ET)</dt>
                        <dd class="t-mono">{{ selected.etMm }} mm</dd>
                    </div>
                    <div v-if="weight" class="spec__row">
                        <dt>Gewicht pro Felge</dt>
                        <dd class="t-mono">{{ weight }}</dd>
                    </div>
                    <div v-if="selected.kbaNumber" class="spec__row">
                        <dt>KBA-Nummer</dt>
                        <dd class="t-mono">{{ selected.kbaNumber }}</dd>
                    </div>
                    <div class="spec__row">
                        <dt>Artikelnummer</dt>
                        <dd class="t-mono">{{ selected.sku }}</dd>
                    </div>
                </dl>

                <p v-if="product.descriptionDe" class="t-body pdp__desc">{{ product.descriptionDe }}</p>
            </section>
        </div>
    </section>

    <!-- The phone's sticky bar: price and the one action, once the main button is off screen. -->
    <div v-if="!buyVisible && selected" class="stickybar pdp__sticky">
        <div class="pdp__sticky-price">
            <p class="price">{{ selected.price }}</p>
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

.pdp__add {
    margin-top: var(--space-4);
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
