<script setup lang="ts">
/**
 * The way from the explainer to the calculator (ACCURACY.md D9): one card, one link. The whole
 * card is the target; the title is the link's name. It sits on the opposite tone of its section —
 * a band on the surface, the surface on a band — never with a border or a shadow.
 */

import { Link } from '@inertiajs/vue3'
import Icon from '../Ui/Icon.vue'
</script>

<template>
    <div class="rc-teaser">
        <div class="rc-teaser__body">
            <h3 class="h4 rc-teaser__title">
                <Link href="/felgenrechner" class="rc-teaser__link" prefetch>Größe vergleichen</Link>
            </h3>
            <p class="body muted rc-teaser__text">Abrollumfang und Tacho – für deine aktuelle und eine neue Größe gerechnet.</p>
        </div>
        <Icon class="rc-teaser__icon" name="arrow-right" :size="24" />
    </div>
</template>

<style scoped>
.rc-teaser {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--sp-16);
    min-height: 44px;
    padding: var(--sp-24);
    border-radius: var(--r-tile);
    background: var(--c-band);
    color: var(--c-ink);
}

.band .rc-teaser {
    background: var(--c-surface);
}

.rc-teaser__body {
    display: grid;
    flex: 1 1 auto;
    gap: var(--sp-4);
    min-width: 0;
}

.rc-teaser__link {
    color: var(--c-ink);
    text-decoration: none;
}

/* The whole card is the link's target. */
.rc-teaser__link::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: var(--r-tile);
}

.rc-teaser__text {
    max-width: 54ch;
    hyphens: auto;
}

.rc-teaser__icon {
    flex: none;
    color: var(--c-ink-2);
}

@media (hover: hover) and (pointer: fine) {
    .rc-teaser:hover .rc-teaser__link {
        text-decoration: underline;
        text-underline-offset: 3px;
    }

    .rc-teaser:hover .rc-teaser__icon {
        color: var(--c-blue);
    }
}

.rc-teaser:active .rc-teaser__icon {
    color: var(--c-blue-press);
}
</style>
