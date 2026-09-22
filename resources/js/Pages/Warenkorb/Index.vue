<script setup lang="ts">
/**
 * The basket.
 *
 * Every line is re-priced and re-verified on the server at every render. A line that has stopped
 * being available or permitted is MARKED, never dropped, and a line with Auflagen carries them as
 * full sentences here — this is the last place to read them before money changes hands (R-15).
 *
 * One line layout for every width: from 900px the quantity and the price move into columns beside
 * the article; below that they sit on a row under it. The summary follows the lines on a phone and
 * sits beside them from 1200px — it never floats over the page.
 *
 * The quantity stepper floors at 1. Taking a line out is its own, labelled action, so a tap on
 * "−" can never make a line disappear.
 *
 * Every line is a wheel (D6). A line from the demo range says so and stays in the basket, and the
 * way to the Kasse stays open so the flow can be reviewed: the server refuses the order there
 * (ACCURACY.md D4). While no shipping price is configured, shipping is named, not priced, and it
 * is not in the total.
 */

import { Head, Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import Icon from '../../Components/Art/Icon.vue'
import ProductPhoto from '../../Components/Product/ProductPhoto.vue'
import { useBasket } from '../../composables/useBasket'
import { useShared } from '../../composables/useShared'
import type { BasketLine, BasketTotals } from '../../types/rimify'

defineOptions({ layout: AppLayout, inheritAttrs: false })

const props = defineProps<{
    lines: (BasketLine & { demo?: boolean })[]
    totals: BasketTotals & { shippingConfigured?: boolean }
}>()

const basket = useBasket()
const shared = useShared()
const vehicle = computed(() => shared.value.vehicle)

/** A line that is sold out or no longer sellable for the chosen car blocks the way to the Kasse. */
const blocked = computed(() =>
    props.lines.some((line) => !line.inStock || (line.verdict !== null && line.verdict !== undefined && !line.verdict.sellable))
)

/** Any line from the demo range: the summary says the order cannot be placed yet. */
const hasDemo = computed(() => props.lines.some((line) => line.demo !== false))

/** No shipping price has been given yet: fails closed, the figure is left out rather than guessed. */
const shippingOpen = computed(() => props.totals.shippingConfigured !== true)

const VERDICT_TONE: Record<string, string> = {
    PERMITTED: 'tag--ok',
    CONDITIONAL: 'tag--warn',
    NOT_PERMITTED: 'tag--danger',
    UNKNOWN: 'tag--unknown',
}
</script>

<template>
    <Head title="Warenkorb" />

    <section class="section-dense">
        <div class="wrap">
            <div class="cart__head">
                <h1 class="t-h1">Warenkorb</h1>
                <p v-if="lines.length > 0" class="cart__count">
                    <span class="tabular">{{ totals.count }}</span> Artikel
                    <template v-if="vehicle">
                        für {{ vehicle.label }} <span class="data">({{ vehicle.keyNumbers }})</span>
                    </template>
                </p>
            </div>

            <div v-if="lines.length > 0" class="cart">
                <div class="cart__lines">
                    <ul class="bl" aria-label="Artikel im Warenkorb">
                        <li v-for="line in lines" :key="line.key" class="bl__line">
                            <div class="bl__thumb">
                                <ProductPhoto
                                    :spokes="line.art.spokes ?? 5"
                                    :finish="line.art.finish ?? 'graphite'"
                                    :size="96"
                                    :note="false"
                                />
                            </div>

                            <div class="bl__main">
                                <p class="bl__brand">{{ line.brandName }}</p>
                                <p class="bl__title">
                                    <Link v-if="line.slug" :href="`/felgen/${line.slug}`" class="bl__link">
                                        {{ line.title }}
                                    </Link>
                                    <template v-else>{{ line.title }}</template>
                                </p>
                                <p class="bl__sub">{{ line.subtitle }}</p>
                                <p v-if="line.sizeLabel" class="data bl__size">{{ line.sizeLabel }}</p>

                                <p v-if="!line.inStock || line.verdict || line.demo !== false" class="bl__flags">
                                    <span v-if="line.demo !== false" class="tag tag--unknown">Beispielsortiment</span>
                                    <span v-if="!line.inStock" class="tag tag--danger">Nicht mehr verfügbar</span>
                                    <span
                                        v-if="line.verdict"
                                        class="tag"
                                        :class="VERDICT_TONE[line.verdict.status] ?? 'tag--unknown'"
                                    >
                                        {{ line.verdict.label }}
                                    </span>
                                </p>

                                <!-- Auflagen in full, never a badge on its own. -->
                                <ul
                                    v-if="line.verdict && line.verdict.conditions.length"
                                    class="bl__conditions"
                                >
                                    <li v-for="condition in line.verdict.conditions" :key="condition">
                                        {{ condition }}
                                    </li>
                                </ul>

                                <!-- Marked, not dropped: say what changed and offer both ways out. -->
                                <div
                                    v-if="line.verdict && !line.verdict.sellable"
                                    class="bl__blocked"
                                    :class="{ 'bl__blocked--unknown': line.verdict.status !== 'NOT_PERMITTED' }"
                                >
                                    <!-- UNKNOWN keeps its own, neutral sentence: no document is not a refusal. -->
                                    <p v-if="line.verdict.status === 'NOT_PERMITTED'">
                                        Diese Felge ist für dein aktuelles Fahrzeug nicht mehr freigegeben.
                                    </p>
                                    <p v-else>Für diese Kombination liegt uns kein Gutachten vor.</p>
                                    <Link href="/felgen-suchen" class="bl__blocked-link">Anderes Fahrzeug wählen</Link>
                                </div>
                            </div>

                            <div class="bl__qty">
                                <span class="visually-hidden" :id="`qty-${line.key}`">Menge</span>
                                <div class="bl__stepper" role="group" :aria-labelledby="`qty-${line.key}`">
                                    <button
                                        class="bl__step"
                                        type="button"
                                        aria-label="Menge verringern"
                                        :disabled="line.quantity <= 1"
                                        @click="basket.setQuantity(line.key, line.quantity - 1)"
                                    >
                                        <Icon name="minus" :size="20" />
                                    </button>
                                    <span class="bl__n tabular" aria-live="polite">{{ line.quantity }}</span>
                                    <button
                                        class="bl__step"
                                        type="button"
                                        aria-label="Menge erhöhen"
                                        :disabled="line.quantity >= 99"
                                        @click="basket.setQuantity(line.key, line.quantity + 1)"
                                    >
                                        <Icon name="plus" :size="20" />
                                    </button>
                                </div>
                                <button class="btn btn--quiet bl__remove" type="button" @click="basket.remove(line.key)">
                                    <Icon name="trash" :size="20" />
                                    Entfernen
                                </button>
                            </div>

                            <div class="bl__price">
                                <p class="bl__total tabular">{{ line.lineTotal }}</p>
                                <p class="bl__unit">
                                    <span class="tabular">{{ line.quantity }} × {{ line.unitPrice }}</span>
                                </p>
                            </div>
                        </li>
                    </ul>

                    <p class="price-legal cart__legal">Alle Preise inkl. MwSt., zzgl. Versand.</p>
                </div>

                <aside class="card cart__summary" aria-labelledby="cart-sum">
                    <h2 id="cart-sum" class="t-h3">Deine Bestellung</h2>

                    <dl class="sum">
                        <div class="sum__row">
                            <dt>Zwischensumme</dt>
                            <dd class="tabular">{{ totals.subtotal }}</dd>
                        </div>
                        <div class="sum__row">
                            <dt>Versand</dt>
                            <dd v-if="shippingOpen" class="sum__word sum__open">wird noch festgelegt</dd>
                            <dd v-else-if="totals.freeShipping" class="sum__word">Kostenlos</dd>
                            <dd v-else class="tabular">{{ totals.shipping }}</dd>
                        </div>
                        <div class="sum__row sum__row--total">
                            <dt>Gesamt</dt>
                            <dd class="tabular">{{ totals.total }}</dd>
                        </div>
                    </dl>
                    <p v-if="shippingOpen" class="price-legal">
                        inkl. {{ totals.tax }} MwSt. · Versandkosten werden noch festgelegt
                    </p>
                    <p v-else class="price-legal">inkl. {{ totals.tax }} MwSt. und Versand</p>

                    <!-- The demo range may be walked through to the Kasse; the order is refused there. -->
                    <p v-if="hasDemo" class="cart__demo">
                        Dein Warenkorb enthält Felgen aus unserem Beispielsortiment. Du kannst dir die
                        Kasse ansehen, bestellen kannst du sie noch nicht.
                    </p>

                    <!-- Fails closed: a line that cannot be sold stops the checkout, and says why. -->
                    <template v-if="blocked">
                        <p class="cart__stop">
                            Entferne zuerst die markierte Position – sie ist nicht lieferbar oder für
                            dein Fahrzeug nicht freigegeben.
                        </p>
                        <button class="btn btn--primary btn--block btn--lg cart__go" type="button" disabled>
                            Zur Kasse
                        </button>
                    </template>
                    <Link v-else href="/kasse" class="btn btn--primary btn--block btn--lg cart__go">Zur Kasse</Link>
                </aside>
            </div>

            <!-- Empty: name the situation and the one step that fills it. -->
            <div v-else class="state">
                <Icon name="cart" :size="24" />
                <p class="state__title">Dein Warenkorb ist noch leer.</p>
                <p class="t-body">
                    Wähle dein Fahrzeug – wir zeigen dir anschließend nur Felgen, die dafür
                    freigegeben sind.
                </p>
                <Link v-if="vehicle" href="/felgen" class="btn btn--primary">
                    Felgen für {{ vehicle.short }} ansehen
                </Link>
                <Link v-else href="/felgen-suchen" class="btn btn--primary">Fahrzeug wählen</Link>
            </div>
        </div>
    </section>
</template>

<style scoped>
.cart__head {
    margin-bottom: var(--space-5);
}

.cart__count {
    margin-top: var(--space-2);
    color: var(--ink2);
}

.cart {
    display: grid;
    gap: var(--space-6);
    align-items: start;
}

.cart__lines {
    min-width: 0;
}

/* ── Lines ────────────────────────────────────────────────────────────────── */

.bl {
    margin: 0;
    padding: 0;
    list-style: none;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
}

.bl__line {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    grid-template-areas:
        'thumb main'
        'qty   qty'
        'price price';
    gap: var(--space-3) var(--space-4);
    padding: var(--space-4);
}

.bl__line + .bl__line {
    border-top: 1px solid var(--line);
}

.bl__thumb {
    grid-area: thumb;
    display: grid;
    place-items: center;
    width: 72px;
    height: 72px;
    background: var(--field);
    border-radius: var(--radius-sm);
    overflow: hidden;
}

.bl__main {
    grid-area: main;
    min-width: 0;
}

.bl__brand {
    font-size: var(--text-small);
    font-weight: 700;
    color: var(--ink2);
}

.bl__title {
    font-weight: 700;
}

.bl__link {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--ink);
    text-decoration: none;
}

@media (hover: hover) and (pointer: fine) {
    .bl__link:hover {
        color: var(--blue);
        text-decoration: underline;
    }
}

.bl__sub {
    color: var(--ink2);
}

.bl__size {
    margin-top: var(--space-1);
}

.bl__flags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-2);
}

.bl__conditions {
    display: grid;
    gap: var(--space-1);
    margin: var(--space-2) 0 0;
    padding-left: var(--space-4);
    color: var(--ink);
    max-width: 60ch;
}

.bl__qty {
    grid-area: qty;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
}

.bl__stepper {
    display: inline-flex;
    align-items: center;
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
}

.bl__step {
    display: inline-grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    background: transparent;
    border: 0;
    color: var(--ink);
    cursor: pointer;
    transition: background-color var(--duration-instant) var(--ease-standard);
}

@media (hover: hover) and (pointer: fine) {
    .bl__step:hover:not(:disabled) {
        background: var(--band);
    }
}

.bl__step:disabled {
    color: var(--ink3);
    cursor: not-allowed;
}

.bl__n {
    min-width: 3ch;
    font-family: var(--mono);
    font-weight: 500;
    text-align: center;
}

.bl__remove {
    color: var(--ink2);
}

.bl__price {
    grid-area: price;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
    padding-top: var(--space-3);
    border-top: 1px solid var(--line-s);
}

.bl__total {
    font-family: var(--mono);
    font-weight: 700;
    order: 2;
}

.bl__unit {
    font-size: var(--text-small);
    color: var(--ink2);
    order: 1;
}

.cart__legal {
    margin-top: var(--space-3);
}

/* ── Summary ──────────────────────────────────────────────────────────────── */

.sum {
    margin: var(--space-4) 0 var(--space-2);
}

.sum__row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
    padding-block: var(--space-2);
}

.sum__row dt {
    color: var(--ink2);
}

.sum__row dd {
    margin: 0;
    font-family: var(--mono);
    font-weight: 500;
    text-align: right;
}

.sum__row dd.sum__word {
    font-family: var(--sans);
    font-weight: 700;
}

.sum__row dd.sum__open {
    font-weight: 500;
    color: var(--ink2);
}

.cart__demo {
    margin-top: var(--space-4);
    font-size: var(--text-small);
    color: var(--ink2);
}

.bl__blocked {
    margin-top: var(--space-2);
    color: var(--danger);
    font-weight: 700;
}

.bl__blocked--unknown {
    color: var(--ink2);
}

.bl__blocked-link {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    font-weight: 700;
}

.cart__stop {
    margin-top: var(--space-4);
    font-size: var(--text-small);
    color: var(--ink2);
}

.sum__row--total {
    margin-top: var(--space-2);
    padding-top: var(--space-3);
    border-top: 2px solid var(--border-strong);
}

.sum__row--total dt,
.sum__row--total dd {
    color: var(--ink);
    font-size: var(--text-h3);
    font-weight: 700;
}

.cart__go {
    margin-top: var(--space-5);
}

/* From 900px the quantity and price take their own columns beside the article. */
@media (min-width: 900px) {
    .bl__line {
        grid-template-columns: 96px minmax(0, 1fr) auto 160px;
        grid-template-areas: 'thumb main qty price';
        align-items: start;
        padding: var(--space-5);
    }

    .bl__thumb {
        width: 96px;
        height: 96px;
    }

    .bl__qty {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-2);
    }

    .bl__price {
        display: block;
        padding-top: 0;
        border-top: 0;
        text-align: right;
    }

    .bl__unit {
        margin-top: var(--space-1);
    }
}

@media (min-width: 1200px) {
    .cart {
        grid-template-columns: minmax(0, 1fr) 360px;
        gap: var(--space-7);
    }

    .cart__summary {
        position: sticky;
        top: calc(var(--header-h) + var(--space-5));
    }
}
</style>
