<script setup lang="ts">
/**
 * The product page.
 *
 * Two rules govern the whole screen. First, configuration NARROWS but never rejects: a size that
 * exists but is not permitted on the chosen car is shown, disabled, with the reason — hiding it
 * would let the customer believe the wheel is not made in that size. Second, price, stock and
 * verdict change in ONE commit when a size is chosen; they come from the same config object, so
 * there is no frame in which a new price sits beside an old legal answer.
 *
 * The fitment panel sits ABOVE the basket button, never beside or below it. The legal status must
 * never be separated from the control that acts on it.
 */

import { Head, Link, useForm } from '@inertiajs/vue3'
import { computed } from 'vue'
import FitmentPanel from '../../Components/Product/FitmentPanel.vue'
import Wheel from '../../Components/Art/Wheel.vue'
import { useConfigurator } from '../../composables/useConfigurator'
import { useShared } from '../../composables/useShared'
import type { ProduktProps } from '../../types/pages'

const props = defineProps<ProduktProps>()

const shared = useShared()
const config = useConfigurator(() => props.configs, props.finishes[0]?.id ?? 0)

const finish = computed(
    () => props.finishes.find((f) => f.id === config.finishId.value) ?? null
)

const basket = useForm({
    kind: 'WHEEL' as const,
    wheelConfigId: 0,
    tyreVariantId: null as number | null,
    quantity: 4,
})

const canBuy = computed(() => {
    const selected = config.selected.value

    if (selected === null || !selected.inStock) {
        return false
    }

    // With no vehicle the wheel can still be bought — RIMIFY simply makes no claim about it.
    // With a vehicle, an unsellable verdict is a hard stop.
    return selected.verdict === null || selected.verdict.sellable
})

function addToBasket(): void {
    const selected = config.selected.value

    if (selected === null) {
        return
    }

    basket.wheelConfigId = selected.id
    basket.post('/warenkorb', { preserveScroll: true })
}
</script>

<template>
    <Head :title="`${product.brandName} ${product.modelName}`" />

    <section class="section">
        <div class="wrap pdp">
            <div class="pdp__gallery">
                <div class="well pdp__well">
                    <span class="well__shadow" />
                    <span class="well__art">
                        <Wheel
                            :spokes="product.spokes"
                            :finish="finish?.artFinish ?? 'graphite'"
                            :size="560"
                        />
                    </span>
                </div>

                <div class="pdp__thumbs">
                    <button
                        v-for="item in finishes"
                        :key="item.id"
                        class="pdp__thumb"
                        :class="{ 'pdp__thumb--on': item.id === config.finishId.value }"
                        type="button"
                        :aria-pressed="item.id === config.finishId.value"
                        :aria-label="item.name"
                        @click="config.selectFinish(item.id)"
                    >
                        <Wheel :spokes="product.spokes" :finish="item.artFinish" :size="96" />
                    </button>
                </div>
            </div>

            <div class="pdp__buy">
                <span class="micro">{{ product.brandName }}</span>
                <h1 class="t-h2 pdp__title">{{ product.modelName }}</h1>
                <p v-if="product.ratingLabel" class="stars">
                    <span class="stars__glyph" aria-hidden="true">★</span>
                    <span class="tabular">{{ product.ratingLabel }}</span>
                </p>

                <div class="pdp__block">
                    <span class="micro">Farbe</span>
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
                            <span class="pdp__dot" :style="{ background: item.hex ?? '#3A3E45' }" />
                            {{ item.name }}
                        </button>
                    </div>
                </div>

                <div class="pdp__block">
                    <span class="micro">Verfügbare Größen</span>
                    <div class="chip-row pdp__chips">
                        <button
                            v-for="size in config.sizes.value"
                            :key="size.diameter"
                            class="chip"
                            :class="{
                                'chip--on': config.selected.value?.id === size.config.id,
                                'chip--blocked': size.blocked,
                            }"
                            type="button"
                            :disabled="size.blocked"
                            :aria-pressed="config.selected.value?.id === size.config.id"
                            :title="size.reason ?? undefined"
                            @click="config.selectSize(size)"
                        >
                            {{ size.label }}
                        </button>
                    </div>

                    <!-- Shown, not hidden: it tells the customer something true about their car. -->
                    <p v-if="config.sizes.value.some((s) => s.blocked)" class="quiet pdp__blockednote">
                        Durchgestrichene Größen sind für dein Fahrzeug nicht freigegeben.
                    </p>
                </div>

                <div v-if="config.selected.value" class="panel--ground pdp__specs">
                    <dl class="pdp__spec-rows">
                        <div>
                            <dt class="micro">Maß</dt>
                            <dd class="data">{{ config.selected.value.sizeLabel }}</dd>
                        </div>
                        <div>
                            <dt class="micro">Lochkreis</dt>
                            <dd class="data">{{ config.selected.value.boltPattern }}</dd>
                        </div>
                        <div>
                            <dt class="micro">Mittenlochbohrung</dt>
                            <dd class="data">{{ config.selected.value.centreBore }}</dd>
                        </div>
                        <div v-if="config.selected.value.kbaNumber">
                            <dt class="micro">KBA-Nummer</dt>
                            <dd class="data">{{ config.selected.value.kbaNumber }}</dd>
                        </div>
                    </dl>
                </div>

                <FitmentPanel
                    class="pdp__fit"
                    :verdict="config.selected.value?.verdict ?? null"
                    :vehicle="shared.vehicle"
                >
                    <Link
                        v-if="!hasVehicle"
                        href="/felgen-suchen"
                        class="btn btn--secondary pdp__fit-cta"
                    >
                        Fahrzeug wählen
                    </Link>
                </FitmentPanel>

                <div class="pdp__price">
                    <span class="micro">{{ config.selected.value ? 'Preis' : 'ab UVP' }}</span>
                    <p class="price">
                        {{ config.selected.value?.price ?? config.fromPrice.value }}
                    </p>
                    <p class="price-note">für 4 Felgen</p>
                </div>

                <span
                    class="tag pdp__stock"
                    :class="config.selected.value?.inStock ? 'tag--ok' : 'tag--danger'"
                >
                    {{ config.selected.value?.inStock ? 'Auf Lager' : 'Ausverkauft' }}
                </span>

                <button
                    class="btn btn--primary btn--block btn--lg pdp__add"
                    type="button"
                    :disabled="!canBuy || basket.processing"
                    @click="addToBasket"
                >
                    {{ basket.processing ? 'Wird hinzugefügt …' : 'In den Warenkorb' }}
                </button>
            </div>
        </div>
    </section>
</template>

<style scoped>
.pdp {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 420px;
    gap: var(--space-7);
    align-items: start;
}

.pdp__well {
    background: linear-gradient(180deg, var(--surface) 0%, #fafbfe 100%);
    border-radius: var(--radius-md);
}

.pdp__thumbs {
    display: flex;
    gap: var(--space-2);
    margin-top: var(--space-3);
}

.pdp__thumb {
    width: 88px;
    height: 88px;
    display: grid;
    place-items: center;
    padding: 6px;
    background: var(--surface);
    border: 1px solid transparent;
    border-radius: var(--radius-lg);
    cursor: pointer;
}

.pdp__thumb--on {
    border-color: var(--blue);
}

.pdp__title {
    margin: 4px 0 var(--space-2);
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
    background: var(--ground);
    border: 1px solid transparent;
    border-radius: var(--radius-round);
    font-size: 13px;
    font-weight: 700;
    color: var(--ink2);
    cursor: pointer;
}

.pdp__swatch--on {
    border-color: var(--blue);
    color: var(--blue);
}

.pdp__dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    box-shadow: inset 0 0 0 1px rgba(14, 17, 22, 0.14);
}

.pdp__chips {
    margin-top: var(--space-2);
}

.pdp__blockednote {
    margin: var(--space-2) 0 0;
    font-size: 13px;
}

.pdp__specs {
    margin-top: var(--space-5);
}

.pdp__spec-rows {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
    margin: 0;
}

.pdp__spec-rows dd {
    margin: 2px 0 0;
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

.pdp__price .price {
    margin: 2px 0 0;
    font-size: 28px;
}

.pdp__stock {
    margin-top: var(--space-3);
}

.pdp__add {
    margin-top: var(--space-3);
}
</style>
