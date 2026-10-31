<script setup lang="ts">
/**
 * One tyre as a tile (the brief §9): its picture, maker and model, season, the size with load index and speed symbol —
 * per axle when front and rear differ — the EU label in words, the price for the set and per tyre, and whether it can be
 * delivered. The whole tile is the choice, a radio of the list, chosen as every tile of the shop is: a 2 px blue border
 * and the check, no tint (D-132). „Details" opens everything about it without choosing it.
 */

import SeasonMark from '../../../Components/Sketch/SeasonMark.vue'
import TyrePicture from '../../../Components/Sketch/TyrePicture.vue'
import Icon from '../../../Components/Ui/Icon.vue'
import { withUnit } from '../../../format'
import { formatMoney } from '../../../lib/num'
import { setPrice, type Mode } from '../komplettradSketch'
import { deliveryText, type DemoTyre } from '../shopDemo'

defineProps<{ tyre: DemoTyre; mode: Mode; chosen: boolean }>()

const emit = defineEmits<{ choose: []; details: [] }>()
</script>

<template>
    <div class="kr-card" :class="{ 'kr-card--on': chosen }">
        <label class="kr-card__pick">
            <input class="visually-hidden" type="radio" name="kr-tyre" :checked="chosen" @change="emit('choose')">
            <TyrePicture class="kr-card__pic" :size="mode === 'mixed' && tyre.rear ? `${tyre.front.size} · ${tyre.rear.size}` : tyre.front.size" :px="120" />

            <span class="kr-card__body">
                <span class="kr-card__brand">{{ tyre.brand }}</span>
                <span class="kr-card__model">{{ tyre.model }}</span>
                <SeasonMark :season="tyre.season" />

                <span v-if="mode === 'mixed' && tyre.rear" class="kr-card__size">
                    <span>vorne {{ tyre.front.size }} {{ tyre.front.li }}{{ tyre.front.si }}</span>
                    <span>hinten {{ tyre.rear.size }} {{ tyre.rear.li }}{{ tyre.rear.si }}</span>
                </span>
                <span v-else class="kr-card__size"><span>{{ tyre.front.size }} {{ tyre.front.li }}{{ tyre.front.si }}</span></span>

                <span class="kr-label">
                    <span class="kr-label__item"><Icon name="fuel" :size="16" /> Kraftstoff {{ tyre.label.fuel }}</span>
                    <span class="kr-label__item"><Icon name="rain" :size="16" /> Nässe {{ tyre.label.wet }}</span>
                    <span class="kr-label__item"><Icon name="sound" :size="16" /> {{ withUnit(tyre.label.noiseDb, 'dB') }}</span>
                    <span v-if="tyre.label.snow" class="kr-label__item"><Icon name="snow" :size="16" /> Schnee</span>
                </span>

                <span class="kr-card__price">
                    <span class="kr-card__set">{{ formatMoney(setPrice(tyre, mode)) }}</span>
                    <span class="kr-card__each">{{ mode === 'mixed' && tyre.rear ? 'für 2 vorne und 2 hinten' : `für 4 · ${formatMoney(tyre.front.priceCents)} je Reifen` }}</span>
                </span>

                <span class="kr-card__delivery" :class="`kr-card__delivery--${tyre.delivery}`">{{ deliveryText(tyre.delivery) }}</span>
            </span>

            <span class="kr-card__check" aria-hidden="true"><Icon name="check" :size="20" /></span>
        </label>

        <button class="kr-card__details" type="button" @click="emit('details')">Details<span class="visually-hidden"> zu {{ tyre.brand }} {{ tyre.model }}</span></button>
    </div>
</template>

<style scoped>
.kr-card {
    position: relative;
    display: grid;
    align-content: start;
    border: 1px solid var(--c-line);
    border-radius: var(--r-tile);
    background: var(--c-surface);
    transition: border-color var(--d-1) var(--ease-std);
}

.kr-card--on {
    margin: -1px;
    border: 2px solid var(--c-blue);
}

.kr-card:has(:focus-visible) {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

@media (hover: hover) and (pointer: fine) {
    .kr-card:hover {
        border-color: var(--c-ink-3);
    }

    .kr-card--on:hover {
        border-color: var(--c-blue);
    }
}

.kr-card__pick {
    display: grid;
    cursor: pointer;
}

.kr-card__pick:active .kr-card__pic {
    background: var(--c-line);
}

.kr-card__pic {
    border-radius: var(--r-tile) var(--r-tile) 0 0;
}

.kr-card__body {
    display: grid;
    align-content: start;
    gap: var(--sp-8);
    padding: var(--sp-16) var(--sp-16) var(--sp-4);
}

.kr-card__brand {
    color: var(--c-ink-3);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.kr-card__model {
    margin-top: calc(var(--sp-4) * -1);
    color: var(--c-ink);
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    font-weight: 600;
}

.kr-card__size {
    display: grid;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}

.kr-label {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-4);
}

.kr-label__item {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-4);
    min-height: 26px;
    padding-inline: var(--sp-8);
    border-radius: var(--r-control);
    background: var(--c-band);
    color: var(--c-ink);
    font-size: var(--fs-small);
    font-variant-numeric: tabular-nums;
}

.kr-card__price {
    display: grid;
    margin-top: var(--sp-4);
}

.kr-card__set {
    font-size: var(--fs-h4);
    line-height: var(--lh-h4);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}

.kr-card__each {
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    font-variant-numeric: tabular-nums;
}

.kr-card__delivery {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-8);
    font-size: var(--fs-small);
}

.kr-card__delivery::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: var(--r-round);
    background: var(--c-ok);
}

.kr-card__delivery--tage::before {
    background: var(--c-warn);
}

.kr-card__delivery--anfrage::before {
    background: var(--c-ink-3);
}

.kr-card__check {
    position: absolute;
    top: var(--sp-12);
    right: var(--sp-12);
    display: none;
    color: var(--c-blue);
}

.kr-card--on .kr-card__check {
    display: inline-flex;
}

.kr-card__details {
    justify-self: start;
    min-height: 44px;
    margin: 0 var(--sp-16) var(--sp-8);
    padding: 0;
    border: 0;
    background: none;
    color: var(--c-blue);
    font: inherit;
    font-size: var(--fs-small);
    text-decoration: underline;
    cursor: pointer;
}

/* On a phone the tile lies down: picture left, facts right. */
@media (max-width: 599px) {
    .kr-card__pick {
        grid-template-columns: 104px minmax(0, 1fr);
    }

    .kr-card__pic {
        align-self: stretch;
        padding: var(--sp-8);
        border-radius: var(--r-tile) 0 0 0;
    }

    .kr-card__body {
        padding: var(--sp-12) var(--sp-40) var(--sp-4) var(--sp-12);
    }

    .kr-card__details {
        margin-left: calc(104px + var(--sp-12));
    }
}
</style>
