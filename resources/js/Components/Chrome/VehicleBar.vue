<script setup lang="ts">
/**
 * The vehicle bar: one slim band under the header that names the chosen car, in one place, on
 * every route where the server says it shows. `headerMode` arrives in the first response (R-08):
 * inside the buying process the bar names the car; outside it, once the listing has been seen,
 * it also offers the way back to the matching wheels; at the checkout it is not there at all.
 */

import { Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import Icon from '../Ui/Icon.vue'
import { useShared } from '../../composables/useShared'

const shared = useShared()
const vehicle = computed(() => shared.value.vehicle)
const mode = computed(() => shared.value.headerMode)
const shown = computed(() => vehicle.value !== null && (mode.value === 'WHITE_BOX' || mode.value === 'BLUE_BAR'))
</script>

<template>
    <div v-if="shown && vehicle" class="vbar">
        <div class="container vbar__row">
            <Icon name="car" :size="20" />
            <p class="vbar__text">
                <span class="vbar__lead">Dein Fahrzeug:</span>
                <span class="vbar__name">{{ vehicle.label }}</span>
                <!-- Feld K alone where it is what tells the car apart; the unknown build window says nothing then. -->
                <span class="vbar__meta num">· {{ vehicle.approval ?? `${vehicle.buildWindow} · ${vehicle.keyNumbers}` }}</span>
            </p>
            <Link href="/felgen-suchen" class="vbar__link">Ändern</Link>
            <Link v-if="mode === 'BLUE_BAR'" href="/felgen" class="vbar__link vbar__link--cta" prefetch>Passende Felgen anzeigen</Link>
        </div>
    </div>
</template>

<style scoped>
.vbar {
    height: var(--vbar-h);
    background: var(--c-band);
    border-bottom: 1px solid var(--c-line);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.vbar__row {
    display: flex;
    align-items: center;
    gap: var(--sp-12);
    height: 100%;
}

.vbar__text {
    display: flex;
    gap: var(--sp-4);
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
}

.vbar__lead {
    color: var(--c-ink-2);
}

/* The car's name is what the bar is for: it keeps its width, and what follows it gives way — with an
   ellipsis, so a number cut short never passes for a whole one. */
.vbar__name {
    flex: none;
    font-weight: 500;
}

.vbar__meta {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--c-ink-2);
}

@media (max-width: 1023px) {
    .vbar__lead {
        display: none;
    }
}

.vbar__link {
    flex: none;
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    padding-inline: var(--sp-4);
    color: var(--c-blue);
    font-weight: 500;
    text-decoration: underline;
    text-underline-offset: 3px;
}

@media (hover: hover) and (pointer: fine) {
    .vbar__link:hover {
        color: var(--c-blue-hover);
    }
}

/* A thumb's 44 px (DIRECTION §6) in a 40 px bar: the link reaches 2 px past each edge, the bar keeps its height. */
@media (pointer: coarse) {
    .vbar__link {
        min-height: 44px;
    }
}

.vbar__link--cta {
    margin-left: auto;
}

@media (max-width: 767px) {
    .vbar__lead,
    .vbar__meta {
        display: none;
    }

    /* Alone on a phone, the name is what gives way. */
    .vbar__name {
        flex: 0 1 auto;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .vbar__link--cta {
        display: none;
    }
}
</style>
