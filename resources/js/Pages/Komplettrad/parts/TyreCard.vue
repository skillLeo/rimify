<script setup lang="ts">
/**
 * One tyre as a tile (the Gutachten rework §9): its picture or a neutral outline, maker and model, season, the size with load index and
 * speed symbol — per axle where front and rear differ —, the EU label in short, the price for the set and per tyre, and whether it can
 * be delivered. The whole tile is the choice, a radio of the list, chosen as every tile of the shop is: a 2 px blue border and the check,
 * no tint (D-132). „Details“ opens everything about it without choosing it. Tiles of one row line up from the price down.
 */

import { ref } from 'vue'
import Icon from '../../../Components/Ui/Icon.vue'
import Picture from '../../../Components/Ui/Picture.vue'
import SeasonMark from '../../../Components/Ui/SeasonMark.vue'
import TyreSilhouette from '../../../Components/Ui/TyreSilhouette.vue'
import { entryLineOrNone } from '../../../fitment/papers'
import { withUnit } from '../../../format'
import type { TyreCardView } from '../komplettradFlow'

/* `papersExempt`: where the document frees the papers (§ 15 FZV) the size asks for the Abnahme alone, and the card says so, as the verdict does. */
defineProps<{ card: TyreCardView; chosen: boolean; papersExempt?: boolean }>()

const emit = defineEmits<{ choose: []; details: [] }>()

/* A photograph that does not load: the neutral outline, never a broken image with its text spilling out. */
const failed = ref(false)
</script>

<template>
    <div class="tc" :class="{ 'tc--on': chosen }" :data-tyre-card="card.key">
        <label class="tc__pick">
            <input class="visually-hidden" type="radio" name="kr-tyre" :checked="chosen" @change="emit('choose')">
            <span class="tc__picture" @error.capture="failed = true">
                <Picture v-if="card.photos[0] && !failed" :image="card.photos[0]" :alt="String(card.photos[0].alt ?? '')" sizes="(min-width: 600px) 355px, 112px" />
                <TyreSilhouette v-else />
            </span>

            <span class="tc__body">
                <span class="tc__brand" translate="no">{{ card.brands.join(' · ') }}</span>
                <span v-if="card.name" class="tc__model" translate="no">{{ card.name }}</span>
                <SeasonMark :season="card.season" />

                <span class="tc__sizes">
                    <!-- The spaces said out loud: Vue drops one that ends a template, and „vorne225/35“ is no size. -->
                    <span v-for="side in card.sides" :key="`${side.axle}-${side.size}`" class="tc__size">
                        <span v-if="side.axle" class="tc__axle">{{ side.axle }}</span>{{ side.axle ? ' ' : '' }}<span v-if="side.line" translate="no">{{ side.line }}</span>{{ side.line ? ' ' : '' }}<span class="tc__figure" translate="no">{{ side.size }}</span>
                    </span>
                </span>

                <span v-for="side in card.sides.filter((s) => s.eu)" :key="`eu-${side.axle}-${side.size}`" class="tc__label">
                    <span v-if="side.axle && card.sides.length > 1" class="tc__label-axle">{{ side.axle }}</span>
                    <span class="tc__label-item"><Icon name="fuel" :size="16" /> Kraftstoff {{ side.eu!.fuel }}</span>
                    <span class="tc__label-item"><Icon name="rain" :size="16" /> Nässe {{ side.eu!.wet }}</span>
                    <span class="tc__label-item"><Icon name="sound" :size="16" /> {{ withUnit(side.eu!.noiseDb, 'dB') }}</span>
                    <span v-if="side.eu!.snowGrip" class="tc__label-item"><Icon name="snow" :size="16" /> Schnee</span>
                </span>

                <span v-if="card.answer?.entry" class="tc__entry">{{ entryLineOrNone(true, papersExempt === true) }}</span>

                <span class="tc__price">
                    <span class="tc__set" translate="no">{{ card.set }}</span>
                    <span class="tc__each">{{ card.unit }} · {{ card.each }}</span>
                </span>

                <span class="tc__stock">{{ card.isDemo ? 'Beispielsortiment' : 'Verfügbar' }}</span>
                <span class="btn btn--secondary tc__choice">{{ chosen ? 'Ausgewählt' : 'Auswählen' }}</span>
            </span>

            <span class="tc__check" aria-hidden="true"><Icon name="check" :size="20" /></span>
        </label>

        <button class="link tc__details" type="button" @click="emit('details')">Details<span class="visually-hidden"> zu {{ card.brands.join(' ') }} {{ card.name }}</span></button>
    </div>
</template>

<style scoped>
.tc {
    position: relative;
    display: grid;
    grid-template-rows: 1fr auto;
    min-width: 0;
    border: 1px solid var(--c-line);
    border-radius: var(--r-tile);
    background: var(--c-surface);
    transition: border-color var(--d-1) var(--ease-std);
}

.tc--on {
    margin: -1px;
    border: 2px solid var(--c-blue);
}

/* The tile's own control only: „Details“ draws its own ring. */
.tc:has(.tc__pick :focus-visible) {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

@media (hover: hover) and (pointer: fine) {
    .tc:hover {
        border-color: var(--c-ink-3);
    }

    .tc--on:hover {
        border-color: var(--c-blue);
    }
}

.tc__pick {
    display: grid;
    grid-template-rows: auto 1fr;
    gap: var(--sp-12);
    border-radius: var(--r-tile);
    cursor: pointer;
}

.tc__pick:active .tc__body {
    background: var(--c-band);
}

/* The well runs to the tile's edge, as on a rim's tile. */
.tc__picture {
    position: relative;
    display: grid;
    place-items: center;
    aspect-ratio: 4 / 3;
    max-width: 100%;
    overflow: hidden;
    border-radius: var(--r-tile) var(--r-tile) 0 0;
    background: var(--c-band);
}

.tc__picture :deep(.tyre-silhouette) {
    width: 45%;
}

/* The picture fills the well, and the photograph shows whole in it: a square one sized to its content ran 25 % past a 4:3 well. */
.tc__picture :deep(.picture) {
    position: absolute;
    inset: 0;
}

.tc__picture :deep(.picture img) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.tc__body {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--sp-4);
    min-width: 0;
    padding: 0 var(--sp-16) var(--sp-8);
}

.tc__brand {
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.tc__model {
    font-weight: 600;
    overflow-wrap: anywhere;
}

.tc__sizes {
    display: grid;
    gap: 0;
    margin-top: var(--sp-4);
}

/* „vorne“ and „hinten“ take one width: the two sizes start on one line. */
.tc__axle {
    min-width: calc(6 * var(--ch-text));
}

.tc__size {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0 var(--sp-4);
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.tc__figure {
    color: var(--c-ink);
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

.tc__label {
    display: flex;
    flex-wrap: wrap;
    gap: 0 var(--sp-8);
    color: var(--c-ink-2);
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    font-variant-numeric: tabular-nums;
}

.tc__label-axle {
    flex-basis: 100%;
}

.tc__label-item {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-4);
    min-height: 24px;
}

.tc__entry {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

/* From here down every tile of a row lines up, whatever stands above. */
.tc__price {
    display: grid;
    margin-top: auto;
    padding-top: var(--sp-8);
}

.tc__set {
    font-size: var(--fs-h4);
    line-height: var(--lh-h4);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}

.tc__each {
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-variant-numeric: tabular-nums;
}

.tc__stock {
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.tc__choice {
    align-self: stretch;
    margin-top: var(--sp-8);
}

.tc--on .tc__choice {
    border-color: var(--c-blue);
    color: var(--c-blue);
}

.tc__check {
    position: absolute;
    top: var(--sp-12);
    right: var(--sp-12);
    display: none;
    color: var(--c-blue);
}

.tc--on .tc__check {
    display: inline-flex;
}

.tc__details {
    justify-self: start;
    min-height: 44px;
    margin: 0 var(--sp-16) var(--sp-4);
    font-size: var(--fs-small);
}

/* On a phone the picture beside the facts: stacked, one tile ran 551 px and the list a long way past the next step. */
@media (max-width: 599px) {
    .tc__pick {
        grid-template-rows: none;
        grid-template-columns: 112px minmax(0, 1fr);
        gap: var(--sp-12);
        padding: var(--sp-12) var(--sp-12) 0;
    }

    .tc__picture {
        align-self: start;
        aspect-ratio: 1;
        border-radius: var(--r-tile);
    }

    .tc__picture :deep(.tyre-silhouette) {
        width: 60%;
    }

    .tc__body {
        padding: 0;
    }

    .tc__details {
        margin-left: calc(112px + 2 * var(--sp-12));
    }
}
</style>
