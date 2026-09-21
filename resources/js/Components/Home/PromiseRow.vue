<script setup lang="ts">
/**
 * H3 · The promise row: four facts the shop stands behind, read in one glance. One hairline above,
 * no boxes, no cards, no numbers — the wording comes from the page's content block, so the client
 * confirms each line without a deployment (docs/design/sections/home.md §H3).
 */

import Icon from '../Ui/Icon.vue'
import { isIconName, type IconName } from '../../icons'

defineProps<{ promises: { title: string; text: string; icon: string }[] }>()

/* The icon name is content; a name the set does not know falls back to the plain check. */
function iconOf(name: string): IconName {
    return isIconName(name) ? name : 'check'
}
</script>

<template>
    <section id="h3" class="promises" data-section="H3" aria-labelledby="h3-heading">
        <h2 id="h3-heading" class="visually-hidden">Was wir zusagen</h2>
        <div class="container">
            <ul class="grid promises__list">
                <li v-for="promise in promises" :key="promise.title" class="promise">
                    <span class="promise__icon"><Icon :name="iconOf(promise.icon)" :size="20" /></span>
                    <div class="promise__text">
                        <p class="body promise__title">{{ promise.title }}</p>
                        <p class="small muted">{{ promise.text }}</p>
                    </div>
                </li>
            </ul>
        </div>
    </section>
</template>

<style scoped>
.promises {
    padding-block: var(--sp-24);
    border-top: 1px solid var(--c-line);
}

.promises__list {
    row-gap: var(--sp-20);
}

/* Phone widths: the icon sits above the title so two narrow columns carry the line. */
.promise {
    grid-column: span 2;
    display: grid;
    gap: var(--sp-8);
    min-width: 0;
}

.promise__icon {
    display: inline-flex;
    align-items: center;
    height: var(--lh-body);
    color: var(--c-ink-2);
}

.promise__text {
    min-width: 0;
    hyphens: auto;
}

.promise__title {
    font-weight: 600;
}

@media (min-width: 768px) {
    .promises__list {
        row-gap: var(--sp-24);
    }

    .promise {
        grid-column: span 4;
        grid-template-columns: 20px minmax(0, 1fr);
        gap: var(--sp-12);
        align-items: start;
    }
}

@media (min-width: 1024px) {
    .promises {
        padding-block: var(--sp-32);
    }

    .promise {
        grid-column: span 3;
    }
}
</style>
