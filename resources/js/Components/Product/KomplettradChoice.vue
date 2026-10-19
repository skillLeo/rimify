<script setup lang="ts">
/**
 * The Komplettrad in the purchase panel (the client's #18): with „Kompletträder“ chosen, the tyres the verdict permits on
 * the chosen size, one of them chosen — or the one sentence saying why there are none, always with a way forward. The
 * page's own button adds the set; nothing here posts.
 *
 * Nothing here decides anything. The server chose the tyres (`TyreEligibility`, R-13), priced them (`KomplettradPricer`)
 * and formatted every figure (R-10); this component prints strings and hands an id to the page. The basket checks the
 * combination again on the server whatever was shown (R-11).
 *
 * The EU tyre label (Regulation (EU) 2020/740) stands with each tyre near its price as its three classes, and in full
 * for the tyre chosen — the label itself, never a class the regulation does not know.
 *
 * The refusal code is never rendered — it only picks which routes forward make sense: the selector when the car is
 * missing, the papers form when the tyres wait for the car's figures (D-286), the contact form when a person has to
 * look at it.
 */

import { Link, usePage } from '@inertiajs/vue3'
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { withUnit } from '../../format'
import { contactHref } from '../../lib/contact'
import { focusPapersForm } from '../../lib/papersForm'
import Icon from '../Ui/Icon.vue'
import TyreLabel from '../Ui/TyreLabel.vue'
import type { KomplettradOfferProp, KomplettradOptionsProp, KomplettradTyreProp, TyreClass } from '../../types/pages'

const page = usePage()

const props = withDefaults(
    defineProps<{
        offer: KomplettradOfferProp
        /** The Wuchtgewichte colours and the RDKS question (#15); null without a car, and then nothing to choose. */
        options?: KomplettradOptionsProp | null
    }>(),
    { options: null }
)

/** The tyre chosen; the page keeps it, so a size change can choose again. */
const tyreId = defineModel<number | null>({ default: null })
/** The Wuchtgewichte colour chosen (#15). */
const colourId = defineModel<number | null>('colourId', { default: null })
/** The RDKS answer (#15): unanswered until the visitor answers — the checkout asks then, never a guess either way. */
const rdks = defineModel<'ja' | 'nein' | null>('rdks', { default: null })

/* The tyre's price per wheel with the colour chosen, as the server priced it; the default colour's where none is. */
function perWheel(tyre: KomplettradTyreProp): string {
    return tyre.prices?.find((p) => p.colourId === colourId.value)?.perWheel ?? tyre.perWheel
}

const tpms = computed(() => props.options?.tpms ?? null)

/* Whether the visitor may write to us about a sensor price: beside the notice that no price is entered. */
const tpmsAskHref = computed(() => contactHref({ subject: 'Preis für RDKS-Sensoren', from: page.url }))

function swatchStyle(hex: string | null): Record<string, string> | undefined {
    return hex ? { '--swatch': hex } : undefined
}

/* What the server refuses everything else with, should it ever send neither tyres nor a sentence. */
const FALLBACK_REFUSAL = 'Passende Reifen für diese Größe können wir dir gerade nicht anbieten. Die Felge allein kannst du bestellen.'

/* Four tyres in sight; the rest one press away, so the basket button never drifts below a long list. */
const SHOWN = 4

const refusal = computed(() => props.offer.refusal ?? (props.offer.tyres.length === 0 ? FALLBACK_REFUSAL : null))

const forward = computed(() => {
    const code = props.offer.refusalCode ?? null

    return {
        vehicle: code === 'NO_VEHICLE' || code === 'VERDICT_RESTORED',
        // The tyres wait for the car's own figures: the way on is the customer's, in the panel — not a message to us.
        papers: code === 'TYRES_AWAIT_PAPERS',
        contact: code !== 'NO_VEHICLE' && code !== 'TYRES_AWAIT_PAPERS',
    }
})

/* „Schreib uns“: the contact form (#26), with this page as the way back. */
const askHref = computed(() => contactHref({ subject: 'Frage zum Komplettrad', from: page.url }))

const TYRE_CLASSES: readonly string[] = ['A', 'B', 'C', 'D', 'E']
const NOISE_CLASSES: readonly string[] = ['A', 'B', 'C']

function isTyreClass(value: string | null): value is TyreClass {
    return value !== null && TYRE_CLASSES.includes(value)
}

function isNoiseClass(value: string | null): value is 'A' | 'B' | 'C' {
    return value !== null && NOISE_CLASSES.includes(value)
}

interface EuLabel {
    fuel: TyreClass
    wet: TyreClass
    noiseDb: number
    noiseClass: 'A' | 'B' | 'C'
    snowGrip: boolean | null
    iceGrip: boolean | null
    eprelId: string
    title: string
}

/* A label with a class the regulation does not know is not shown; it is never "corrected". */
function labelOf(tyre: KomplettradTyreProp): EuLabel | null {
    const label = tyre.label

    if (label === null || !isTyreClass(label.fuel) || !isTyreClass(label.wetGrip) || label.noiseDb === null || !isNoiseClass(label.noiseClass)) {
        return null
    }

    return {
        fuel: label.fuel,
        wet: label.wetGrip,
        noiseDb: label.noiseDb,
        noiseClass: label.noiseClass,
        snowGrip: label.snowGrip,
        iceGrip: label.iceGrip,
        eprelId: label.eprelId,
        title: `${tyre.brandName} ${tyre.name} · ${tyre.sizeLabel}`,
    }
}

const cards = computed(() => props.offer.tyres.map((tyre) => ({ tyre, label: labelOf(tyre) })))

const expanded = ref(false)
const shownCards = computed(() => {
    if (expanded.value || cards.value.length <= SHOWN) {
        return cards.value
    }

    // The chosen tyre stays in sight even where it is not among the first four.
    const first = cards.value.slice(0, SHOWN)
    const chosen = cards.value.find((card) => card.tyre.id === tyreId.value)

    return chosen && !first.includes(chosen) ? [...first.slice(0, SHOWN - 1), chosen] : first
})

const chosenLabel = computed(() => cards.value.find((card) => card.tyre.id === tyreId.value)?.label ?? null)

/* „Alle Reifen zeigen“ goes once pressed: the focus moves to the first tyre it revealed, never to the page. */
const rows = useTemplateRef<HTMLElement>('rows')

async function expand(): Promise<void> {
    expanded.value = true
    await nextTick()
    rows.value?.querySelectorAll<HTMLInputElement>('input[type="radio"]')[SHOWN]?.focus()
}
</script>

<template>
    <div class="kc">
        <!-- One sentence and a way forward: never an empty panel and never a dead end. -->
        <div v-if="refusal" class="notice kc__refusal">
            <Icon name="info" :size="20" />
            <div>
                <p class="kc__refusal-text">{{ refusal }}</p>
                <p v-if="forward.vehicle || forward.papers || forward.contact" class="kc__routes">
                    <Link v-if="forward.vehicle" href="/felgen-suchen" class="btn btn--secondary btn--sm">Fahrzeug wählen</Link>
                    <button v-if="forward.papers" class="btn btn--secondary btn--sm" type="button" @click="focusPapersForm">Werte eintragen</button>
                    <Link v-if="forward.contact" :href="askHref" class="link kc__mail">Schreib uns</Link>
                </p>
            </div>
        </div>

        <!-- The tyres as one ruled list (D-132): a radio on the left, the price in a column on the right. -->
        <fieldset v-else class="kc__group">
            <legend class="label kc__legend">Reifen</legend>
            <!-- The minimum as a sentence, never a bare number pair (komplettrad.md §8.1). -->
            <p v-if="offer.minSentence" class="small muted kc__min">{{ offer.minSentence }}</p>

            <ul ref="rows" class="kc__rows" role="list">
                <li v-for="card in shownCards" :key="card.tyre.id">
                    <label class="kc-row" :class="{ 'kc-row--on': card.tyre.id === tyreId }">
                        <input v-model="tyreId" class="kc-row__radio" type="radio" name="kc-tyre" :value="card.tyre.id">
                        <span class="kc-row__body">
                            <span class="kc-row__name"><span class="kc-row__brand">{{ card.tyre.brandName }}</span> {{ card.tyre.name }}</span>
                            <span class="kc-row__meta">{{ card.tyre.seasonLabel }} · <span class="data">{{ card.tyre.sizeLabel }}</span></span>
                            <span v-if="card.label" class="kc-row__eu num">
                                Kraftstoffeffizienz {{ card.label.fuel }} · Nasshaftung {{ card.label.wet }} · {{ withUnit(card.label.noiseDb, 'dB') }} ({{ card.label.noiseClass }})
                            </span>
                        </span>
                        <span class="kc-row__price">
                            <span class="kc-row__amount num">{{ perWheel(card.tyre) }}</span>
                            <span class="kc-row__per">pro Rad</span>
                        </span>
                    </label>
                </li>
            </ul>

            <button v-if="cards.length > SHOWN && !expanded" type="button" class="link kc__more" @click="expand">
                Alle {{ cards.length }} Reifen zeigen
            </button>

            <!-- The full EU label for the tyre chosen, only where it carries a verified one (ACCURACY D7). -->
            <TyreLabel v-if="chosenLabel" v-bind="chosenLabel" class="kc__label" />
        </fieldset>

        <!-- The Wuchtgewichte (#15): the colours the admin keeps active, as the page's own colour buttons. -->
        <fieldset v-if="!refusal && options && options.colours.length > 0" class="kc__group">
            <legend class="label kc__legend">Wuchtgewichte</legend>
            <p class="small muted kc__hint">Die Gewichte sitzen innen an der Felge. Such dir die Farbe aus, die dir besser gefällt.</p>
            <div class="kc__swatches">
                <label v-for="colour in options.colours" :key="colour.id" class="kc-swatch" :class="{ 'kc-swatch--on': colour.id === colourId }">
                    <input v-model="colourId" class="visually-hidden" type="radio" name="kc-weights" :value="colour.id">
                    <span class="kc-swatch__dot" data-qa-ignore :style="swatchStyle(colour.swatchHex)" aria-hidden="true" />
                    <span class="kc-swatch__name">{{ colour.name }}</span>
                    <span class="kc-swatch__price num">
                        <template v-if="colour.surchargeCents === 0">ohne Aufpreis</template>
                        <template v-else>+ {{ colour.surcharge }} pro Rad</template>
                    </span>
                </label>
            </div>
        </fieldset>

        <!--
            RDKS sensors (#15), the basket's own question. Not answered for the visitor: the checkout asks where nobody has.
            No valve is offered or described here: the admin holds none, and which valves a wheel may take is the
            Gutachten's to say (the DB8GT2's asks for metal screw valves where no sensor is fitted) — its conditions say it.
        -->
        <fieldset v-if="!refusal && tpms" class="kc__group">
            <legend class="label kc__legend">RDKS-Sensoren</legend>
            <p class="small muted kc__hint">
                Misst dein Auto den Reifendruck mit Sensoren in den Rädern, brauchen auch die neuen Räder Sensoren. Ob das so ist,
                steht in der Betriebsanleitung.
            </p>
            <p v-if="!tpms.available && tpms.notice" class="notice kc__tpms-notice">
                <span>{{ tpms.notice }} <Link :href="tpmsAskHref" class="link">Zum Kontaktformular</Link></span>
            </p>
            <div class="kc__opts">
                <label v-if="tpms.available" class="kc-opt" :class="{ 'kc-opt--on': rdks === 'ja' }">
                    <input v-model="rdks" class="visually-hidden" type="radio" name="kc-rdks" value="ja">
                    <span class="kc-opt__name">Mit RDKS-Sensoren</span>
                    <span class="kc-opt__price num">+ {{ tpms.yesTotal }}<template v-if="tpms.line"> ({{ tpms.line }})</template></span>
                    <span class="kc-opt__sub">Wir setzen die Sensoren gleich mit ein.</span>
                    <span class="kc-opt__check" aria-hidden="true"><Icon name="check" :size="20" /></span>
                </label>
                <label class="kc-opt" :class="{ 'kc-opt--on': rdks === 'nein' }">
                    <input v-model="rdks" class="visually-hidden" type="radio" name="kc-rdks" value="nein">
                    <span class="kc-opt__name">Ohne RDKS-Sensoren</span>
                    <span class="kc-opt__price">ohne Aufpreis</span>
                    <span class="kc-opt__check" aria-hidden="true"><Icon name="check" :size="20" /></span>
                </label>
            </div>
        </fieldset>
    </div>
</template>

<style scoped>
/* The groups 24 px apart, as the panel's own; inside a group, 8. */
.kc {
    display: grid;
    gap: var(--sp-24);
}

.kc__refusal-text {
    margin: 0;
}

.kc__routes {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-12) var(--sp-16);
    align-items: center;
    margin: var(--sp-12) 0 0;
}

.kc__group {
    display: grid;
    gap: var(--sp-8);
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
}

.kc__legend {
    margin-bottom: var(--sp-8);
}

.kc__min,
.kc__hint,
.kc__tpms-notice {
    margin: 0;
}

/* ── Tyres: one ruled list ──────────────────────────────────────────────────── */

.kc__rows {
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--c-line);
}

.kc-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: var(--sp-4) var(--sp-12);
    align-items: start;
    min-height: 56px;
    padding-block: var(--sp-12);
    border-bottom: 1px solid var(--c-line);
    cursor: pointer;
}

.kc-row__radio {
    width: 18px;
    height: 18px;
    margin: 3px 0 0;
    accent-color: var(--c-blue);
}

.kc-row:has(:focus-visible) {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

.kc-row:active {
    background: var(--c-band);
}

.kc-row__body {
    display: grid;
    gap: var(--sp-4);
    min-width: 0;
}

.kc-row__name {
    font-weight: 600;
    color: var(--c-ink);
}

.kc-row__brand {
    font-weight: 400;
    color: var(--c-ink-2);
}

.kc-row__meta,
.kc-row__eu,
.kc-row__per {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.kc-row__price {
    display: grid;
    justify-items: end;
    text-align: right;
}

.kc-row__amount {
    font-weight: 600;
    color: var(--c-ink);
    white-space: nowrap;
}

.kc__more {
    justify-self: start;
    min-height: 44px;
}

/* The label as wide as the list above it, never a ragged right edge. */
.kc__label {
    width: 100%;
}

/* ── Wuchtgewichte: the page's colour buttons ────────────────────────────────── */

.kc__swatches {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

.kc-swatch {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-8);
    min-height: 44px;
    padding-inline: var(--sp-12);
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
    background: var(--c-surface);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
    cursor: pointer;
}

.kc-swatch--on {
    border-color: var(--c-ink);
    color: var(--c-ink);
}

.kc-swatch:has(:focus-visible) {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

/* The colour itself is catalogue data, not a design value: it arrives as a custom property from the row. */
.kc-swatch__dot {
    flex: none;
    width: 16px;
    height: 16px;
    border: 1px solid var(--c-line);
    border-radius: var(--r-round);
    background: var(--swatch, var(--c-band));
}

.kc-swatch__name {
    font-weight: 600;
}

/* ── RDKS: two tiles, the mode choice's ──────────────────────────────────────── */

/* `auto-fit`: a single tile takes the row rather than a narrow column with its words broken. */
.kc__opts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
    gap: var(--sp-8);
}

.kc-opt {
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
    transition: border-color var(--d-1) var(--ease-std);
}

.kc-opt--on {
    padding: calc(var(--sp-12) - 1px) calc(var(--sp-40) - 1px) calc(var(--sp-12) - 1px) calc(var(--sp-16) - 1px);
    border: 2px solid var(--c-blue);
}

.kc-opt:has(:focus-visible) {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

.kc-opt:active {
    background: var(--c-band);
}

@media (hover: hover) and (pointer: fine) {
    .kc-opt:hover,
    .kc-swatch:hover {
        border-color: var(--c-ink-3);
    }

    .kc-opt--on:hover {
        border-color: var(--c-blue);
    }

    .kc-swatch--on:hover {
        border-color: var(--c-ink);
    }
}

.kc-opt__name {
    font-weight: 600;
    color: var(--c-ink);
}

.kc-opt__price,
.kc-opt__sub {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.kc-opt__check {
    position: absolute;
    top: var(--sp-12);
    right: var(--sp-12);
    display: none;
    color: var(--c-blue);
}

.kc-opt--on .kc-opt__check {
    display: inline-flex;
}

/* On a narrow phone the price goes under the name rather than squeezing it. */
@media (max-width: 379px) {
    .kc-row {
        grid-template-columns: auto minmax(0, 1fr);
    }

    .kc-row__price {
        grid-column: 2;
        justify-items: start;
        text-align: left;
    }
}
</style>

