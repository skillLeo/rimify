<script setup lang="ts">
/**
 * One tyre as a tile (the Gutachten rework §9): its picture or a neutral outline, maker and model, season, the size with load index and
 * speed symbol — per axle where front and rear differ —, the EU label in short, the price for the set and per tyre, and whether it can
 * be delivered. The whole tile is the choice, a radio of the list, chosen as every tile of the shop is: a 2 px blue border and the check,
 * no tint (D-132). „Details“ opens everything about it without choosing it.
 */

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
</script>

<template>
    <div class="tc" :class="{ 'tc--on': chosen }" :data-tyre-card="card.key">
        <label class="tc__pick">
            <input class="visually-hidden" type="radio" name="kr-tyre" :checked="chosen" @change="emit('choose')">
            <span class="tc__picture">
                <Picture v-if="card.photos[0]" :image="card.photos[0]" :alt="String(card.photos[0].alt ?? '')" sizes="(min-width: 768px) 200px, 40vw" />
                <TyreSilhouette v-else :px="120" />
            </span>

            <span class="tc__body">
                <span class="tc__brand" translate="no">{{ card.brands.join(' · ') }}</span>
                <span v-if="card.name" class="tc__model" translate="no">{{ card.name }}</span>
                <SeasonMark :season="card.season" />

                <span class="tc__sizes">
                    <span v-for="side in card.sides" :key="`${side.axle}-${side.size}`" class="tc__size">
                        <template v-if="side.axle">{{ side.axle }} </template><template v-if="side.line"><span translate="no">{{ side.line }}</span> </template><span class="tc__figure" translate="no">{{ side.size }}</span>
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
                <span class="tc__choice">{{ chosen ? 'Ausgewählt' : 'Auswählen' }}</span>
            </span>

            <span class="tc__check" aria-hidden="true"><Icon name="check" :size="20" /></span>
        </label>

        <button class="tc__details" type="button" @click="emit('details')">Details<span class="visually-hidden"> zu {{ card.brands.join(' ') }} {{ card.name }}</span></button>
    </div>
</template>

<style scoped>
.tc {
    position: relative;
    display: grid;
    align-content: start;
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

.tc:has(:focus-visible) {
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
    gap: var(--sp-12);
    padding: var(--sp-16);
    cursor: pointer;
}

.tc__picture {
    display: grid;
    place-items: center;
    aspect-ratio: 4 / 3;
    max-width: 100%;
    overflow: hidden;
    border-radius: var(--r-control);
    background: var(--c-band);
}

.tc__picture :deep(img) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.tc__body {
    display: grid;
    gap: var(--sp-4);
    min-width: 0;
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
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.tc__figure {
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

.tc__price {
    display: grid;
    margin-top: var(--sp-8);
}

.tc__set {
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
    margin-top: var(--sp-8);
    color: var(--c-blue);
    font-weight: 600;
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
</style>
