<script setup lang="ts">
/**
 * H10 · Ratgeber — "Wissen, bevor du kaufst".
 *
 * Three real articles that answer the questions the selector raises: one large, two small, each
 * a single link stretched over its block. Without a cover photograph the title steps into its
 * place — no placeholder, no drawn illustration. Reading time is what the article record says.
 */

import { Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import type { GuideTeaser } from '../../types/pages'

const props = defineProps<{ guides: GuideTeaser[] }>()

const lead = computed(() => props.guides[0] ?? null)
const rest = computed(() => props.guides.slice(1, 3))

function readingTime(minutes: number): string {
    return `${minutes} Min. Lesezeit`
}
</script>

<template>
    <section id="h10" class="guides" data-section="H10" aria-labelledby="h10-heading">
        <div class="container">
            <h2 id="h10-heading" class="h2">Wissen, bevor du kaufst</h2>

            <div class="grid guides__grid">
                <article v-if="lead" class="guide guide--lead">
                    <h3 class="h3">
                        <Link :href="`/ratgeber/${lead.slug}`" class="guide__link" prefetch>{{ lead.title }}</Link>
                    </h3>
                    <p v-if="lead.teaser" class="body muted guide__teaser">{{ lead.teaser }}</p>
                    <p class="small quiet num guide__meta">{{ readingTime(lead.minutes) }}</p>
                </article>

                <div v-if="rest.length > 0" class="guides__aside">
                    <article v-for="guide in rest" :key="guide.slug" class="guide">
                        <h3 class="h4">
                            <Link :href="`/ratgeber/${guide.slug}`" class="guide__link" prefetch>{{ guide.title }}</Link>
                        </h3>
                        <p class="small quiet num guide__meta">{{ readingTime(guide.minutes) }}</p>
                    </article>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.guides__grid {
    margin-top: var(--sp-40);
    row-gap: var(--sp-32);
}

.guide--lead,
.guides__aside {
    grid-column: 1 / -1;
    min-width: 0;
}

.guides__aside {
    display: grid;
    gap: var(--sp-32);
    align-content: start;
}

/* The whole block is the link; the title is the link's text. */
.guide {
    position: relative;
    display: grid;
    gap: var(--sp-8);
    align-content: start;
}

.guide__link {
    color: var(--c-ink);
    text-decoration: none;
}

.guide__link::after {
    content: '';
    position: absolute;
    inset: 0;
}

@media (hover: hover) and (pointer: fine) {
    .guide:hover .guide__link {
        text-decoration: underline;
        text-underline-offset: 3px;
    }
}

.guide__teaser {
    display: -webkit-box;
    max-width: 68ch;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    hyphens: auto;
}

@media (min-width: 768px) {
    .guides__aside {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        column-gap: var(--gutter);
    }
}

@media (min-width: 1024px) {
    .guide--lead {
        grid-column: 1 / span 7;
    }

    .guides__aside {
        grid-column: 9 / span 4;
        grid-template-columns: minmax(0, 1fr);
    }
}
</style>
