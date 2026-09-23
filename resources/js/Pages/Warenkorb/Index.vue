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
 * Every line is a wheel (D6). A Komplettrad is a wheel line that carries its tyre
 * (docs/specs/komplettrad.md §4.11): it prints the rim, then its components — Felge, Reifen,
 * Montage und Auswuchten, Wuchtgewichte — each with `Anzahl × Einzelpreis`, and beneath them the
 * Wuchtgewichte tiles, one whole-tile radio per colour. A component with no price yet reads
 * `wird noch festgelegt` and is left out of every figure. `Reifen entfernen` turns the line into
 * Felgen only. Everything the server refused about the line (`blockReasons`) is printed in full,
 * with `Entfernen` and `Anderes Fahrzeug wählen` as the ways out.
 *
 * A line from the demo range says so and stays in the basket, and the way to the Kasse stays open
 * so the flow can be reviewed: the server refuses the order there (ACCURACY.md D4). While no
 * shipping price is configured, shipping is named, not priced, and it is not in the total.
 */

import { Head, Link } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
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

/** The server's validation answers, shared by Inertia; `{}` in fixtures that carry none. */
const errors = computed<Record<string, string>>(() => {
    const raw = shared.value.errors

    return raw !== null && typeof raw === 'object' ? (raw as Record<string, string>) : {}
})

/** The checkout sent the customer back here with a sentence (a sensor price moved, §5.3). */
const orderError = computed(() => (typeof errors.value.order === 'string' ? errors.value.order : null))

/** The line whose Wuchtgewichte tiles were last touched: a refusal is shown there, not on every set. */
const touched = ref<string | null>(null)

function chooseColour(key: string, colourId: number): void {
    touched.value = key
    basket.setWeightColour(key, colourId)
}

/** The server's reasons why this line cannot be ordered as it stands — full sentences, empty when none. */
function reasonsOf(line: BasketLine): string[] {
    return line.blockReasons ?? []
}

/** A line that is sold out, no longer sellable for the chosen car, or marked by the server blocks the way to the Kasse. */
const blocked = computed(() =>
    props.lines.some(
        (line) =>
            !line.inStock ||
            (line.verdict !== null && line.verdict !== undefined && !line.verdict.sellable) ||
            reasonsOf(line).length > 0
    )
)

/** Any line from the demo range: the summary says the order cannot be placed yet. */
const hasDemo = computed(() => props.lines.some((line) => line.demo !== false))

/** No shipping price has been given yet: fails closed, the figure is left out rather than guessed. */
const shippingOpen = computed(() => props.totals.shippingConfigured !== true)

/** The sensors, once answered with `ja` at the checkout: in the subtotal, so they are named beside it. */
const tpmsRow = computed(() => (props.totals.tpms?.choice === 'ja' ? props.totals.tpms : null))

/** The admin's swatch, or the neutral chip where none is set — never a wrong colour. */
function swatchStyle(hex: string | null): Record<string, string> {
    return { background: hex ?? 'var(--band)' }
}

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

            <!-- What the checkout sent the customer back with: read it before the figures. -->
            <p v-if="orderError" class="cart__alert" role="alert">{{ orderError }}</p>

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
                                <p class="bl__brand">
                                    {{ line.brandName }}
                                    <span v-if="line.isSet" class="tag tag--ok bl__set-tag">{{ line.setLabel }}</span>
                                </p>
                                <p class="bl__title">
                                    <Link v-if="line.slug" :href="`/felgen/${line.slug}`" class="bl__link">
                                        {{ line.title }}
                                    </Link>
                                    <template v-else>{{ line.title }}</template>
                                </p>
                                <p class="bl__sub">{{ line.subtitle }}</p>
                                <p v-if="line.sizeLabel" class="data bl__size">{{ line.sizeLabel }}</p>

                                <!-- The tyre of a Komplettrad, read from the catalogue on every render. -->
                                <p v-if="line.tyre" class="bl__tyre">
                                    <span class="bl__tyre-name">{{ line.tyre.brandName }} {{ line.tyre.name }}</span>
                                    <span class="bl__tyre-meta">
                                        {{ line.tyre.seasonLabel }} · <span class="data">{{ line.tyre.sizeLabel }}</span>
                                    </span>
                                </p>

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
                                    v-if="line.verdict && !line.verdict.sellable && reasonsOf(line).length === 0"
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

                                <!-- What the server refused about a Komplettrad, in its own words (R-15). -->
                                <div v-if="reasonsOf(line).length > 0" class="bl__reasons" role="status">
                                    <p v-for="reason in reasonsOf(line)" :key="reason" class="bl__reason">{{ reason }}</p>
                                    <div class="bl__reasons-actions">
                                        <button class="bl__blocked-link bl__reasons-remove" type="button" @click="basket.remove(line.key)">
                                            Entfernen
                                        </button>
                                        <Link href="/felgen-suchen" class="bl__blocked-link">Anderes Fahrzeug wählen</Link>
                                    </div>
                                </div>

                                <!-- The Komplettrad, itemised: every component with its quantity and unit price. -->
                                <template v-if="line.isSet && line.components && line.components.length > 1">
                                    <dl class="bl__parts" aria-label="Bestandteile des Komplettrads">
                                        <div
                                            v-for="part in line.components"
                                            :key="part.key"
                                            class="bl__part"
                                            :class="{ 'bl__part--open': part.open }"
                                        >
                                            <dt class="bl__part-label">{{ part.label }}</dt>
                                            <dd class="bl__part-unit">
                                                <span class="tabular">{{ part.quantity }} × {{ part.unitPrice }}</span>
                                            </dd>
                                            <dd class="bl__part-total">
                                                <span v-if="part.lineTotal !== null" class="tabular">{{ part.lineTotal }}</span>
                                                <span v-else class="bl__part-open">{{ part.unitPrice }}</span>
                                            </dd>
                                        </div>
                                    </dl>

                                    <!-- The colour of the Wuchtgewichte: the whole tile is the control. -->
                                    <fieldset v-if="line.weightOptions && line.weightOptions.length > 0" class="bl__weights">
                                        <legend class="bl__weights-title">Wuchtgewichte</legend>
                                        <p class="bl__weights-hint">
                                            Die Gewichte sitzen innen an der Felge. Such dir die Farbe aus, die dir besser gefällt.
                                        </p>
                                        <div class="opt">
                                            <label
                                                v-for="option in line.weightOptions"
                                                :key="option.id"
                                                class="opt__tile"
                                                :class="{ 'opt__tile--on': line.weights?.colourId === option.id }"
                                            >
                                                <input
                                                    class="visually-hidden opt__input"
                                                    type="radio"
                                                    :name="`weights-${line.key}`"
                                                    :value="option.id"
                                                    :checked="line.weights?.colourId === option.id"
                                                    @change="chooseColour(line.key, option.id)"
                                                />
                                                <span class="opt__swatch" :style="swatchStyle(option.swatchHex)" aria-hidden="true" />
                                                <span class="opt__name">{{ option.name }}</span>
                                                <span class="opt__price tabular">
                                                    {{ option.surcharge
                                                    }}<span v-if="option.surchargeCents === 0" class="visually-hidden"> ohne Aufpreis</span>
                                                </span>
                                                <span class="opt__check" aria-hidden="true">
                                                    <Icon name="check" :size="20" />
                                                </span>
                                            </label>
                                        </div>
                                        <p v-if="touched === line.key && errors.colourId" class="field-error bl__weights-error" role="alert">
                                            {{ errors.colourId }}
                                        </p>
                                    </fieldset>
                                </template>
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
                                <div class="bl__actions">
                                    <button class="btn btn--quiet bl__remove" type="button" @click="basket.remove(line.key)">
                                        <Icon name="trash" :size="20" />
                                        Entfernen
                                    </button>
                                    <!-- Package integrity: the rims stay, the tyre goes, the price changes visibly. -->
                                    <button
                                        v-if="line.isSet"
                                        class="btn btn--quiet bl__remove-tyre"
                                        type="button"
                                        @click="basket.removeTyre(line.key)"
                                    >
                                        Reifen entfernen
                                    </button>
                                </div>
                            </div>

                            <div class="bl__price">
                                <p class="bl__total tabular">{{ line.lineTotal }}</p>
                                <p class="bl__unit">
                                    <span class="tabular">{{ line.quantity }} × {{ line.unitPrice }}</span>
                                </p>
                                <!-- A component has no price yet: the figure above is the known part, and says so. -->
                                <p v-if="line.priceOpen" class="bl__open">ohne Montage und Auswuchten – wird noch festgelegt</p>
                            </div>
                        </li>
                    </ul>

                    <p class="price-legal cart__legal">Alle Preise inkl. MwSt., zzgl. Versand.</p>
                </div>

                <aside class="card cart__summary" aria-labelledby="cart-sum">
                    <h2 id="cart-sum" class="t-h3">Deine Bestellung</h2>

                    <dl class="sum">
                        <div v-if="tpmsRow" class="sum__row sum__row--item">
                            <dt>RDKS-Sensoren ({{ tpmsRow.line }})</dt>
                            <dd class="tabular">{{ tpmsRow.total }}</dd>
                        </div>
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

/* Why the checkout sent the customer back: readable, not an error colour. */
.cart__alert {
    margin-bottom: var(--space-5);
    padding: var(--space-3) var(--space-4);
    border-left: 3px solid var(--border-strong);
    background: var(--band);
    color: var(--ink);
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
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
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

.bl__tyre {
    display: grid;
    gap: var(--space-1);
    margin-top: var(--space-2);
}

.bl__tyre-name {
    font-weight: 700;
}

.bl__tyre-meta {
    font-size: var(--text-small);
    color: var(--ink2);
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

/* ── Komplettrad: components ──────────────────────────────────────────────── */

.bl__parts {
    display: grid;
    gap: var(--space-1);
    margin: var(--space-3) 0 0;
    padding: var(--space-3) 0 0;
    border-top: 1px solid var(--line-s);
}

.bl__part {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
        'label total'
        'unit  unit';
    gap: 0 var(--space-3);
    align-items: baseline;
    font-size: var(--text-small);
}

.bl__part-label {
    grid-area: label;
    color: var(--ink);
}

.bl__part-unit {
    grid-area: unit;
    margin: 0;
    color: var(--ink2);
}

.bl__part-total {
    grid-area: total;
    margin: 0;
    font-family: var(--mono);
    font-weight: 500;
    text-align: right;
}

.bl__part--open .bl__part-label,
.bl__part--open .bl__part-unit {
    color: var(--ink3);
}

.bl__part-open {
    font-family: var(--sans);
    font-weight: 500;
    color: var(--ink3);
}

/* ── Komplettrad: the Wuchtgewichte tiles ─────────────────────────────────── */

.bl__weights {
    margin: var(--space-4) 0 0;
    padding: 0;
    border: 0;
    min-width: 0;
}

.bl__weights-title {
    padding: 0;
    font-weight: 700;
}

.bl__weights-hint {
    margin-top: var(--space-1);
    font-size: var(--text-small);
    color: var(--ink2);
    max-width: 60ch;
}

.bl__weights-error {
    display: block;
    margin-top: var(--space-2);
}

.opt {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--space-3);
    margin-top: var(--space-3);
}

/* The whole tile is the control; the radio stays for the keyboard and the screen reader. */
.opt__tile {
    position: relative;
    display: grid;
    gap: var(--space-1);
    min-height: 64px;
    padding: var(--space-3);
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    background: var(--surface);
    cursor: pointer;
    transition:
        border-color var(--duration-instant) var(--ease-standard),
        background-color var(--duration-instant) var(--ease-standard);
}

.opt__tile--on {
    padding: calc(var(--space-3) - 1px);
    border: 2px solid var(--blue);
    background: var(--wash);
}

.opt__tile:focus-within {
    outline: 2px solid var(--blue);
    outline-offset: 2px;
}

@media (hover: hover) and (pointer: fine) {
    .opt__tile:hover {
        border-color: var(--border-strong);
    }

    .opt__tile--on:hover {
        border-color: var(--blue);
    }
}

.opt__swatch {
    width: 24px;
    height: 24px;
    border: 1px solid var(--line);
    border-radius: var(--r-round);
}

.opt__name {
    font-size: var(--text-small);
    font-weight: 700;
    color: var(--ink);
}

.opt__price {
    font-size: var(--text-small);
    color: var(--ink3);
}

.opt__check {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
    display: none;
    color: var(--blue);
}

.opt__tile--on .opt__check {
    display: inline-flex;
}

/* ── Quantity, actions, price ─────────────────────────────────────────────── */

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

.bl__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
}

.bl__remove,
.bl__remove-tyre {
    color: var(--ink2);
}

.bl__price {
    grid-area: price;
    display: flex;
    flex-wrap: wrap;
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

.bl__open {
    flex: 1 1 100%;
    order: 3;
    font-size: var(--text-small);
    color: var(--ink3);
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

.sum__row--item dt {
    font-size: var(--text-small);
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

/* What the server refused about a Komplettrad: a strip on the row, with both ways out. */
.bl__reasons {
    margin-top: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--danger-w);
    border-radius: var(--radius-sm);
    color: var(--ink);
}

.bl__reason {
    font-weight: 700;
    max-width: 60ch;
}

.bl__reason + .bl__reason {
    margin-top: var(--space-1);
}

.bl__reasons-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-4);
    margin-top: var(--space-1);
}

.bl__reasons-remove {
    padding: 0;
    background: transparent;
    border: 0;
    color: var(--blue);
    cursor: pointer;
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

    .bl__actions {
        flex-direction: column;
        align-items: flex-start;
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

    .bl__open {
        margin-top: var(--space-2);
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
