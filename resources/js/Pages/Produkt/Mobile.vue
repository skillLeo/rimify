<script setup lang="ts">
/**
 * The product page on a phone.
 *
 * The one structural difference: once the main panel scrolls away, a sticky bar pins above the
 * bottom nav carrying the price, the fitment status and `In den Warenkorb`. The legal status must
 * never be separated from the button that acts on it, and on a 390px screen that separation
 * happens by scrolling rather than by layout.
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

    return selected.verdict === null || selected.verdict.sellable
})

const statusTag = computed(() => {
    const verdict = config.selected.value?.verdict ?? null

    if (verdict === null) {
        return config.selected.value?.inStock
            ? { label: 'Auf Lager', cls: 'tag--ok' }
            : { label: 'Ausverkauft', cls: 'tag--danger' }
    }

    switch (verdict.status) {
        case 'PERMITTED':
            return { label: 'Freigegeben', cls: 'tag--ok' }
        case 'CONDITIONAL':
            return { label: 'Mit Auflagen', cls: 'tag--warn' }
        case 'NOT_PERMITTED':
            return { label: 'Nicht freigegeben', cls: 'tag--danger' }
        default:
            return { label: 'Keine Angabe', cls: 'tag--unknown' }
    }
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

    <section class="section mpdp">
        <div class="wrap">
            <div class="well mpdp__well">
                <span class="well__shadow" />
                <span class="well__art">
                    <Wheel
                        :spokes="product.spokes"
                        :finish="finish?.artFinish ?? 'graphite'"
                        :size="360"
                    />
                </span>
            </div>

            <span class="micro mpdp__brand">{{ product.brandName }}</span>
            <h1 class="t-h2 mpdp__title">{{ product.modelName }}</h1>
            <p v-if="product.ratingLabel" class="stars">
                <span class="stars__glyph" aria-hidden="true">★</span>
                <span class="tabular">{{ product.ratingLabel }}</span>
            </p>

            <div class="mpdp__block">
                <span class="micro">Farbe</span>
                <div class="chip-row mpdp__row">
                    <button
                        v-for="item in finishes"
                        :key="item.id"
                        class="chip"
                        :class="{ 'chip--on': item.id === config.finishId.value }"
                        type="button"
                        :aria-pressed="item.id === config.finishId.value"
                        @click="config.selectFinish(item.id)"
                    >
                        {{ item.name }}
                    </button>
                </div>
            </div>

            <div class="mpdp__block">
                <span class="micro">Verfügbare Größen</span>
                <div class="chip-row mpdp__row">
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
                <p v-if="config.sizes.value.some((s) => s.blocked)" class="quiet mpdp__blockednote">
                    Durchgestrichene Größen sind für dein Fahrzeug nicht freigegeben.
                </p>
            </div>

            <div v-if="config.selected.value" class="panel--ground mpdp__specs">
                <div class="mpdp__spec">
                    <span class="micro">Maß</span>
                    <span class="data">{{ config.selected.value.sizeLabel }}</span>
                </div>
                <div class="mpdp__spec">
                    <span class="micro">Lochkreis</span>
                    <span class="data">{{ config.selected.value.boltPattern }}</span>
                </div>
                <div class="mpdp__spec">
                    <span class="micro">Mittenlochbohrung</span>
                    <span class="data">{{ config.selected.value.centreBore }}</span>
                </div>
            </div>

            <FitmentPanel
                class="mpdp__fit"
                :verdict="config.selected.value?.verdict ?? null"
                :vehicle="shared.vehicle"
            >
                <Link
                    v-if="!hasVehicle"
                    href="/felgen-suchen"
                    class="btn btn--secondary btn--block mpdp__fit-cta"
                >
                    Fahrzeug wählen
                </Link>
            </FitmentPanel>
        </div>
    </section>

    <!-- Price, legal status and action travel together. -->
    <div class="stickybar mpdp__bar">
        <div class="mpdp__barprice">
            <span class="price price--sm">{{ config.selected.value?.price ?? '' }}</span>
            <span class="tag" :class="statusTag.cls">{{ statusTag.label }}</span>
        </div>
        <button
            class="btn btn--primary mpdp__baradd"
            type="button"
            :disabled="!canBuy || basket.processing"
            @click="addToBasket"
        >
            In den Warenkorb
        </button>
    </div>
</template>

<style scoped>
.mpdp {
    padding-bottom: calc(var(--bottomnav-h) + 88px);
}

.mpdp__well {
    border-radius: var(--radius-md);
}

.mpdp__brand {
    margin-top: var(--space-4);
}

.mpdp__title {
    margin: 2px 0 var(--space-2);
}

.mpdp__block {
    margin-top: var(--space-4);
}

.mpdp__row {
    margin-top: var(--space-2);
}

.mpdp__blockednote {
    margin: var(--space-2) 0 0;
    font-size: 13px;
}

.mpdp__specs {
    display: grid;
    gap: var(--space-2);
    margin-top: var(--space-4);
}

.mpdp__spec {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
}

.mpdp__fit {
    margin-top: var(--space-4);
}

.mpdp__fit-cta {
    margin-top: var(--space-3);
}

.mpdp__barprice {
    display: grid;
    gap: 2px;
}

.mpdp__baradd {
    margin-left: auto;
}
</style>
