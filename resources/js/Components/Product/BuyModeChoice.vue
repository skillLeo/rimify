<script setup lang="ts">
/**
 * „Was möchtest du bestellen?“ — Nur Felgen or Kompletträder (the client's #18), two radio tiles, the whole tile the
 * control. The product page and the RIMIFY-Check (#28) ask it the same way; what follows the choice is theirs.
 *
 * Each tile says what it costs in the same words: the rims „pro Felge“, the Kompletträder „ab … pro Rad“ — figures the server
 * formatted. One selected state for every tile on the page: a 2 px blue border and the check, no tint (D-132).
 */

import Icon from '../Ui/Icon.vue'

defineProps<{
    /** `229,00 €` — one rim of the size on screen, or null before a size is known. */
    rimPrice?: string | null
    /** `533,00 €` — the lowest Komplettrad price per wheel the server offers, or null where there is none. */
    setFrom?: string | null
    /** Distinguishes two choices on one page; the radios share a name per page. */
    name?: string
}>()

const mode = defineModel<'felgen' | 'komplettrad'>({ default: 'felgen' })
</script>

<template>
    <fieldset class="bmc">
        <legend class="label bmc__legend">Was möchtest du bestellen?</legend>
        <div class="bmc__tiles">
            <label class="bmc-tile" :class="{ 'bmc-tile--on': mode === 'felgen' }">
                <input v-model="mode" class="visually-hidden" type="radio" :name="name ?? 'pdp-mode'" value="felgen">
                <span class="bmc-tile__name">Nur Felgen</span>
                <span class="bmc-tile__sub">
                    Ohne Reifen
                    <span v-if="rimPrice" class="bmc-tile__price"><span class="num" translate="no">{{ rimPrice }}</span> pro Felge</span>
                </span>
                <span class="bmc-tile__check" aria-hidden="true"><Icon name="check" :size="20" /></span>
            </label>
            <label class="bmc-tile" :class="{ 'bmc-tile--on': mode === 'komplettrad' }">
                <input v-model="mode" class="visually-hidden" type="radio" :name="name ?? 'pdp-mode'" value="komplettrad">
                <span class="bmc-tile__name">Kompletträder</span>
                <span class="bmc-tile__sub">
                    Mit Reifen, fertig montiert
                    <span v-if="setFrom" class="bmc-tile__price">ab <span class="num" translate="no">{{ setFrom }}</span> pro Rad</span>
                </span>
                <span class="bmc-tile__check" aria-hidden="true"><Icon name="check" :size="20" /></span>
            </label>
        </div>
    </fieldset>
</template>

<style scoped>
.bmc {
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
}

.bmc__legend {
    margin-bottom: var(--sp-8);
}

/* One under the other below 768: side by side, a phone left each tile 115 px and the Komplettrad line four rows. */
.bmc__tiles {
    display: grid;
    gap: var(--sp-8);
}

@media (min-width: 768px) {
    .bmc__tiles {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

/* The whole tile is the control; the radio stays for the keyboard and the screen reader. */
.bmc-tile {
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
    transition:
        border-color var(--d-1) var(--ease-std),
        background-color var(--d-1) var(--ease-std);
}

.bmc-tile--on {
    padding: calc(var(--sp-12) - 1px) calc(var(--sp-40) - 1px) calc(var(--sp-12) - 1px) calc(var(--sp-16) - 1px);
    border: 2px solid var(--c-blue);
}

/* The ring for the keyboard only: a click is not a reason to draw a second outline round a tile. */
.bmc-tile:has(:focus-visible) {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

.bmc-tile:active {
    background: var(--c-band);
}

@media (hover: hover) and (pointer: fine) {
    .bmc-tile:hover {
        border-color: var(--c-ink-3);
    }

    .bmc-tile--on:hover {
        border-color: var(--c-blue);
    }
}

.bmc-tile__name {
    font-weight: 600;
    color: var(--c-ink);
}

.bmc-tile__sub {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

/* The price on a line of its own under what the tile is, never split by the line's end („Ohne Reifen ·“ over the price). */
.bmc-tile__price {
    display: block;
    white-space: nowrap;
}

.bmc-tile__check {
    position: absolute;
    top: var(--sp-12);
    right: var(--sp-12);
    display: none;
    color: var(--c-blue);
}

.bmc-tile--on .bmc-tile__check {
    display: inline-flex;
}
</style>
