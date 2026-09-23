<script setup lang="ts">
/**
 * The basket lines, shared by the cart and the checkout summary.
 *
 * Every line is re-priced on render, so a price that moved while the tab was open is corrected
 * here rather than discovered at payment. A line that has stopped being available is MARKED, never
 * dropped: silently removing it leaves the customer wondering what happened to their basket.
 */

import Icon from '../Art/Icon.vue'
import Tyre from '../Art/Tyre.vue'
import Wheel from '../Art/Wheel.vue'
import { useBasket } from '../../composables/useBasket'
import type { BasketLine } from '../../types/rimify'

withDefaults(
    defineProps<{
        lines: BasketLine[]
        /** The checkout summary is read-only: there is nothing to adjust once you are paying. */
        readonly?: boolean
    }>(),
    { readonly: false }
)

const basket = useBasket()

const VERDICT_TONE: Record<string, string> = {
    PERMITTED: 'tag--ok',
    CONDITIONAL: 'tag--warn',
    NOT_PERMITTED: 'tag--danger',
    UNKNOWN: 'tag--unknown',
}
</script>

<template>
    <table class="table table--cart">
        <thead>
            <tr>
                <th scope="col">Artikel</th>
                <th scope="col">Menge</th>
                <th scope="col" class="num">Einzelpreis</th>
                <th scope="col" class="num">Summe</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="line in lines" :key="line.key">
                <td>
                    <div class="bl__item">
                        <span class="bl__art">
                            <Wheel
                                v-if="line.art.kind === 'wheel'"
                                :spokes="line.art.spokes ?? 5"
                                :finish="line.art.finish ?? 'graphite'"
                                :size="72"
                            />
                            <Tyre v-else :label="line.art.label ?? ''" :size="72" />
                        </span>
                        <div class="bl__text">
                            <span class="micro">{{ line.brandName }}</span>
                            <p class="bl__title">{{ line.title }}</p>
                            <p class="bl__sub">{{ line.subtitle }}</p>
                            <p v-if="line.sizeLabel" class="data">{{ line.sizeLabel }}</p>

                            <div class="bl__flags">
                                <span v-if="!line.inStock" class="tag tag--danger">
                                    Nicht mehr verfügbar
                                </span>

                                <!-- Marked, never dropped. A line that has stopped being permitted
                                     must be explained where the customer can see it. -->
                                <span
                                    v-if="line.verdict"
                                    class="tag"
                                    :class="VERDICT_TONE[line.verdict.status]"
                                >
                                    {{ line.verdict.label }}
                                </span>
                            </div>

                            <ul
                                v-if="line.verdict && line.verdict.conditions.length"
                                class="bl__conditions"
                            >
                                <li v-for="c in line.verdict.conditions" :key="c">{{ c }}</li>
                            </ul>
                        </div>
                    </div>
                </td>
                <td>
                    <div v-if="!readonly" class="bl__stepper">
                        <button
                            class="bl__step"
                            type="button"
                            aria-label="Menge verringern"
                            @click="basket.setQuantity(line.key, line.quantity - 1)"
                        >
                            −
                        </button>
                        <span class="tabular bl__qty">{{ line.quantity }}</span>
                        <button
                            class="bl__step"
                            type="button"
                            aria-label="Menge erhöhen"
                            @click="basket.setQuantity(line.key, line.quantity + 1)"
                        >
                            +
                        </button>
                        <button
                            class="bl__remove"
                            type="button"
                            aria-label="Position entfernen"
                            @click="basket.remove(line.key)"
                        >
                            <Icon name="trash" :size="20" />
                        </button>
                    </div>
                    <span v-else class="tabular">{{ line.quantity }}</span>
                </td>
                <td class="num data">{{ line.unitPrice }}</td>
                <td class="num">
                    <strong class="tabular">{{ line.lineTotal }}</strong>
                </td>
            </tr>
        </tbody>
    </table>
</template>

<style scoped>
.bl__item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
}

.bl__art {
    flex: none;
    width: 72px;
    height: 72px;
    display: grid;
    place-items: center;
    background: var(--ground);
    border-radius: var(--radius-lg);
}

.bl__text {
    min-width: 0;
}

.bl__title {
    margin: 2px 0 0;
    font-size: var(--fs-body);
    font-weight: 700;
}

.bl__sub {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink2);
}

.bl__flags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: 6px;
}

.bl__conditions {
    margin: var(--space-2) 0 0;
    padding-left: var(--space-4);
    font-size: var(--fs-small);
    color: var(--ink2);
}

.bl__stepper {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
}

.bl__step {
    width: 44px;
    height: 44px;
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    background: var(--surface);
    font-size: var(--fs-h4);
    font-weight: 700;
    color: var(--ink);
    cursor: pointer;
}

.bl__qty {
    min-width: 2ch;
    text-align: center;
    font-weight: 700;
}

.bl__remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    margin-left: var(--space-2);
    background: transparent;
    border: 0;
    border-radius: var(--radius-sm);
    color: var(--ink3);
    cursor: pointer;
}

.bl__remove:hover {
    color: var(--danger);
}
</style>
