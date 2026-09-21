<script setup lang="ts">
/**
 * The basket on a phone: cards rather than a table, and the total pinned above the bottom nav so
 * the figure the customer is deciding on is never scrolled out of view.
 */

import { Head, Link } from '@inertiajs/vue3'
import Icon from '../../Components/Art/Icon.vue'
import Tyre from '../../Components/Art/Tyre.vue'
import Wheel from '../../Components/Art/Wheel.vue'
import { useBasket } from '../../composables/useBasket'
import type { BasketProps } from '../../types/pages'

defineProps<BasketProps>()

const basket = useBasket()

const VERDICT_TONE: Record<string, string> = {
    PERMITTED: 'tag--ok',
    CONDITIONAL: 'tag--warn',
    NOT_PERMITTED: 'tag--danger',
    UNKNOWN: 'tag--unknown',
}
</script>

<template>
    <Head title="Warenkorb" />

    <section class="section mcart">
        <div class="wrap">
            <h1 class="t-h2">Warenkorb</h1>

            <div v-if="lines.length > 0" class="stack-4 mcart__lines">
                <article v-for="line in lines" :key="line.key" class="card mcart__line">
                    <span class="mcart__art">
                        <Wheel
                            v-if="line.art.kind === 'wheel'"
                            :spokes="line.art.spokes ?? 5"
                            :finish="line.art.finish ?? 'graphite'"
                            :size="80"
                        />
                        <Tyre v-else :label="line.art.label ?? ''" :size="80" />
                    </span>

                    <div class="mcart__text">
                        <span class="micro">{{ line.brandName }}</span>
                        <p class="mcart__title">{{ line.title }}</p>
                        <p class="mcart__sub">{{ line.subtitle }}</p>
                        <p v-if="line.sizeLabel" class="data">{{ line.sizeLabel }}</p>

                        <div class="mcart__flags">
                            <span v-if="!line.inStock" class="tag tag--danger">
                                Nicht mehr verfügbar
                            </span>
                            <span
                                v-if="line.verdict"
                                class="tag"
                                :class="VERDICT_TONE[line.verdict.status]"
                            >
                                {{ line.verdict.label }}
                            </span>
                        </div>

                        <div class="between mcart__foot">
                            <div class="mcart__stepper">
                                <button
                                    class="mcart__step"
                                    type="button"
                                    aria-label="Menge verringern"
                                    @click="basket.setQuantity(line.key, line.quantity - 1)"
                                >
                                    −
                                </button>
                                <span class="tabular mcart__qty">{{ line.quantity }}</span>
                                <button
                                    class="mcart__step"
                                    type="button"
                                    aria-label="Menge erhöhen"
                                    @click="basket.setQuantity(line.key, line.quantity + 1)"
                                >
                                    +
                                </button>
                            </div>
                            <strong class="tabular">{{ line.lineTotal }}</strong>
                        </div>
                    </div>
                </article>
            </div>

            <div v-else class="state">
                <Icon name="cart" :size="24" />
                <p class="state__title">Dein Warenkorb ist leer.</p>
                <Link href="/felgen-suchen" class="btn btn--primary btn--block">Fahrzeug wählen</Link>
            </div>
        </div>
    </section>

    <div v-if="lines.length > 0" class="stickybar">
        <div>
            <span class="micro">Gesamt</span>
            <p class="price price--sm">{{ totals.total }}</p>
        </div>
        <Link href="/kasse" class="btn btn--primary mcart__go">Zur Kasse</Link>
    </div>
</template>

<style scoped>
.mcart {
    padding-bottom: calc(var(--bottomnav-h) + 96px);
}

.mcart__lines {
    margin-top: var(--s4);
}

.mcart__line {
    display: flex;
    gap: var(--s3);
    padding: var(--s3);
}

.mcart__art {
    flex: none;
    width: 80px;
    height: 80px;
    display: grid;
    place-items: center;
    background: var(--ground);
    border-radius: var(--r-img);
}

.mcart__text {
    min-width: 0;
    flex: 1;
}

.mcart__title {
    margin: 2px 0 0;
    font-size: 16px;
    font-weight: 700;
}

.mcart__sub {
    margin: 0;
    font-size: 14px;
    color: var(--ink2);
}

.mcart__flags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s2);
    margin-top: 6px;
}

.mcart__foot {
    margin-top: var(--s3);
}

.mcart__stepper {
    display: inline-flex;
    align-items: center;
    gap: var(--s2);
}

.mcart__step {
    width: 44px;
    height: 44px;
    border: 1px solid var(--line);
    border-radius: var(--r-btn);
    background: var(--surface);
    font-size: 18px;
    font-weight: 700;
    color: var(--ink);
    cursor: pointer;
}

.mcart__qty {
    min-width: 2ch;
    text-align: center;
    font-weight: 700;
    color: var(--ink);
}

.mcart__go {
    margin-left: auto;
}

.stickybar .price {
    margin: 0;
}
</style>
