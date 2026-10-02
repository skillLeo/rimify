<script setup lang="ts">
/**
 * The Komplettrad in the purchase panel (the client's #18): with „Komplettrad“ chosen, the tyres the verdict permits on
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
 * missing, the contact form when a person has to look at it.
 */

import { Link, usePage } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import { contactHref } from '../../lib/contact'
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
const FALLBACK_REFUSAL = 'Passende Reifen für diese Größe haben wir gerade nicht vorrätig. Die Felge allein kannst du bestellen.'

/* Four tyres in sight; the rest one press away, so the basket button never drifts below a long list. */
const SHOWN = 4

const refusal = computed(() => props.offer.refusal ?? (props.offer.tyres.length === 0 ? FALLBACK_REFUSAL : null))

const forward = computed(() => {
    const code = props.offer.refusalCode ?? null

    return {
        vehicle: code === 'NO_VEHICLE' || code === 'VERDICT_RESTORED',
        contact: code !== 'NO_VEHICLE',
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
</script>

<template>
    <div class="kc">
        <!-- One sentence and a way forward: never an empty panel and never a dead end. -->
        <div v-if="refusal" class="notice kc__refusal">
            <Icon name="info" :size="20" />
            <div>
                <p class="kc__refusal-text">{{ refusal }}</p>
                <p v-if="forward.vehicle || forward.contact" class="kc__routes">
                    <Link v-if="forward.vehicle" href="/felgen-suchen" class="btn btn--secondary btn--sm">Fahrzeug wählen</Link>
                    <Link v-if="forward.contact" :href="askHref" class="link kc__mail">Schreib uns</Link>
                </p>
            </div>
        </div>

        <fieldset v-else class="kc__tyres">
            <legend class="micro">Reifen</legend>
            <!-- The minimum as a sentence, never a bare number pair (komplettrad.md §8.1). -->
            <p v-if="offer.minSentence" class="small muted kc__min">{{ offer.minSentence }}</p>

            <div class="kc__list">
                <label v-for="card in shownCards" :key="card.tyre.id" class="kc-tile" :class="{ 'kc-tile--on': card.tyre.id === tyreId }">
                    <input v-model="tyreId" class="visually-hidden" type="radio" name="kc-tyre" :value="card.tyre.id">
                    <span class="kc-tile__body">
                        <span class="kc-tile__name"><span class="kc-tile__brand">{{ card.tyre.brandName }}</span> {{ card.tyre.name }}</span>
                        <span class="kc-tile__meta">{{ card.tyre.seasonLabel }} · <span class="data">{{ card.tyre.sizeLabel }}</span></span>
                        <span v-if="card.label" class="kc-tile__eu num">
                            Kraftstoffeffizienz {{ card.label.fuel }} · Nasshaftung {{ card.label.wet }} · {{ card.label.noiseDb }}&nbsp;dB ({{ card.label.noiseClass }})
                        </span>
                    </span>
                    <span class="kc-tile__price">
                        <span class="kc-tile__amount num">{{ perWheel(card.tyre) }}</span>
                        <span class="kc-tile__per">je Rad</span>
                    </span>
                    <span class="kc-tile__check" aria-hidden="true"><Icon name="check" :size="20" /></span>
                </label>
            </div>

            <button v-if="cards.length > SHOWN && !expanded" type="button" class="link kc__more" @click="expanded = true">
                Alle {{ cards.length }} Reifen zeigen
            </button>

            <!-- The full EU label for the tyre chosen, only where it carries a verified one (ACCURACY D7). -->
            <TyreLabel v-if="chosenLabel" v-bind="chosenLabel" class="kc__label" />
        </fieldset>

        <!-- The Wuchtgewichte (#15): the colours the admin keeps active, each set priced with it on the server. -->
        <fieldset v-if="!refusal && options && options.colours.length > 0" class="kc__group">
            <legend class="micro">Wuchtgewichte</legend>
            <p class="small muted kc__hint">Die Gewichte sitzen innen an der Felge. Such dir die Farbe aus, die dir besser gefällt.</p>
            <div class="kc__opts">
                <label v-for="colour in options.colours" :key="colour.id" class="kc-opt" :class="{ 'kc-opt--on': colour.id === colourId }">
                    <input v-model="colourId" class="visually-hidden" type="radio" name="kc-weights" :value="colour.id">
                    <span class="kc-opt__swatch" data-qa-ignore :style="swatchStyle(colour.swatchHex)" aria-hidden="true" />
                    <span class="kc-opt__name">{{ colour.name }}</span>
                    <span class="kc-opt__price num">
                        <template v-if="colour.surchargeCents === 0">ohne Aufpreis</template>
                        <template v-else>+ {{ colour.surcharge }} je Rad</template>
                    </span>
                    <span class="kc-opt__check" aria-hidden="true"><Icon name="check" :size="20" /></span>
                </label>
            </div>
        </fieldset>

        <!--
            RDKS sensors (#15), the basket's own question. Not answered for the visitor: the checkout asks where nobody has.
            No valve is offered or described here: the admin holds none, and which valves a wheel may take is the
            Gutachten's to say (the DB8GT2's asks for metal screw valves where no sensor is fitted) — its conditions say it.
        -->
        <fieldset v-if="!refusal && tpms" class="kc__group">
            <legend class="micro">RDKS-Sensoren</legend>
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
                    <span class="kc-opt__price num">{{ tpms.yesTotal }}<template v-if="tpms.line"> · {{ tpms.line }}</template></span>
                    <span class="kc-opt__sub">Wir setzen die Sensoren gleich mit ein.</span>
                    <span class="kc-opt__check" aria-hidden="true"><Icon name="check" :size="20" /></span>
                </label>
                <label class="kc-opt" :class="{ 'kc-opt--on': rdks === 'nein' }">
                    <input v-model="rdks" class="visually-hidden" type="radio" name="kc-rdks" value="nein">
                    <span class="kc-opt__name">Ohne Sensoren</span>
                    <span class="kc-opt__price num">0,00&nbsp;€</span>
                    <span class="kc-opt__check" aria-hidden="true"><Icon name="check" :size="20" /></span>
                </label>
            </div>
        </fieldset>
    </div>
</template>

<style scoped>
.kc {
    display: grid;
    gap: var(--sp-12);
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

.kc__tyres {
    display: grid;
    gap: var(--sp-8);
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
}

.kc__min {
    margin: 0;
}

.kc__list {
    display: grid;
    gap: var(--sp-8);
}

/* The whole tile is the control; the radio stays for the keyboard and the screen reader (the basket's tiles). */
.kc-tile {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--sp-4) var(--sp-16);
    align-items: start;
    min-height: 64px;
    padding: var(--sp-12) var(--sp-40) var(--sp-12) var(--sp-16);
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
    background: var(--c-surface);
    cursor: pointer;
    transition:
        border-color var(--d-1) var(--ease-std),
        background-color var(--d-1) var(--ease-std);
}

.kc-tile--on {
    padding: calc(var(--sp-12) - 1px) calc(var(--sp-40) - 1px) calc(var(--sp-12) - 1px) calc(var(--sp-16) - 1px);
    border: 2px solid var(--c-blue);
    background: var(--c-blue-tint);
}

.kc-tile:focus-within {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

@media (hover: hover) and (pointer: fine) {
    .kc-tile:hover {
        border-color: var(--c-ink-3);
    }

    .kc-tile--on:hover {
        border-color: var(--c-blue);
    }
}

.kc-tile__body {
    display: grid;
    gap: var(--sp-4);
    min-width: 0;
}

.kc-tile__name {
    font-weight: 600;
    color: var(--c-ink);
}

.kc-tile__brand {
    font-weight: 400;
    color: var(--c-ink-2);
}

.kc-tile__meta,
.kc-tile__eu,
.kc-tile__per {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.kc-tile__price {
    display: grid;
    justify-items: end;
    text-align: right;
}

.kc-tile__amount {
    font-weight: 600;
    color: var(--c-ink);
    white-space: nowrap;
}

.kc-tile__check {
    position: absolute;
    top: var(--sp-12);
    right: var(--sp-12);
    display: none;
    color: var(--c-blue);
}

.kc-tile--on .kc-tile__check {
    display: inline-flex;
}

.kc__more {
    justify-self: start;
    min-height: 44px;
}

/* ── Wuchtgewichte and RDKS (#15): the same tiles, two or three to a row ─────────── */

.kc__group {
    display: grid;
    gap: var(--sp-8);
    min-width: 0;
    margin: var(--sp-8) 0 0;
    padding: 0;
    border: 0;
}

.kc__hint {
    margin: 0;
}

.kc__tpms-notice {
    margin: 0;
}

/* `auto-fit`: a single tile takes the row rather than a narrow column with its words broken. */
.kc__opts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr));
    gap: var(--sp-8);
}

.kc-opt {
    position: relative;
    display: grid;
    align-content: start;
    gap: var(--sp-4);
    min-height: 64px;
    padding: var(--sp-12) var(--sp-40) var(--sp-12) var(--sp-12);
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
    background: var(--c-surface);
    cursor: pointer;
    transition:
        border-color var(--d-1) var(--ease-std),
        background-color var(--d-1) var(--ease-std);
}

.kc-opt--on {
    padding: calc(var(--sp-12) - 1px) calc(var(--sp-40) - 1px) calc(var(--sp-12) - 1px) calc(var(--sp-12) - 1px);
    border: 2px solid var(--c-blue);
    background: var(--c-blue-tint);
}

.kc-opt:focus-within {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

@media (hover: hover) and (pointer: fine) {
    .kc-opt:hover {
        border-color: var(--c-ink-3);
    }

    .kc-opt--on:hover {
        border-color: var(--c-blue);
    }
}

/* The colour itself is catalogue data, not a design value: it arrives as a custom property from the row. */
.kc-opt__swatch {
    width: 24px;
    height: 24px;
    border: 1px solid var(--c-line);
    border-radius: var(--r-round);
    background: var(--swatch, var(--c-band));
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

.kc__label {
    margin-top: var(--sp-8);
}

/* On a narrow phone the price goes under the name rather than squeezing it. */
@media (max-width: 379px) {
    .kc-tile {
        grid-template-columns: minmax(0, 1fr);
    }

    .kc-tile__price {
        justify-items: start;
        text-align: left;
    }
}
</style>
