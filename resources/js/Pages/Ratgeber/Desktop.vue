<script setup lang="ts">
/**
 * One guide article (H10 → /ratgeber/{slug}). Editorial and quiet: the title, the reading time,
 * the lead, then the sections as running text at a readable measure. The other two guides are
 * offered at the end — an article page that ends in nothing sends the reader back to the browser.
 */

import { Head, Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import Icon from '../../Components/Ui/Icon.vue'

defineOptions({ layout: AppLayout })

const props = defineProps<{
    guide: {
        slug: string
        title: string
        teaser: string
        minutes: number
        metaDescription: string
        blocks: { type: string; data: { heading?: string; text?: string } }[]
    }
    others: { slug: string; title: string; href: string }[]
}>()

const description = computed(() => props.guide.metaDescription || props.guide.teaser)

/** Paragraphs are separated by a blank line in the seeded text. */
function paragraphs(text: string | undefined): string[] {
    return (text ?? '')
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter((p) => p !== '')
}
</script>

<template>
    <Head>
        <title>{{ guide.title }} – Ratgeber</title>
        <meta name="description" :content="description" />
    </Head>

    <article class="container guide" aria-labelledby="guide-title">
        <header class="guide__head">
            <p class="label">Ratgeber</p>
            <h1 id="guide-title" class="h1 guide__title">{{ guide.title }}</h1>
            <p class="small muted num guide__meta">
                <Icon name="clock" :size="16" />
                {{ guide.minutes }} Min. Lesezeit
            </p>
            <p v-if="guide.teaser" class="body-l guide__lead">{{ guide.teaser }}</p>
        </header>

        <div class="prose guide__body">
            <template v-for="(block, index) in guide.blocks" :key="index">
                <h2 v-if="block.data.heading" class="h3">{{ block.data.heading }}</h2>
                <p v-for="(paragraph, p) in paragraphs(block.data.text)" :key="p">{{ paragraph }}</p>
            </template>
        </div>

        <footer class="guide__foot">
            <p class="micro quiet guide__note">
                Dieser Ratgeber erklärt Begriffe und Abläufe allgemein. Was für deine Felge gilt, steht in ihrem Gutachten.
            </p>

            <nav v-if="others.length > 0" class="guide__more" aria-labelledby="guide-more">
                <p id="guide-more" class="label">Weitere Ratgeber</p>
                <ul class="guide__list">
                    <li v-for="other in others" :key="other.slug">
                        <Link :href="other.href" class="link">{{ other.title }}</Link>
                    </li>
                </ul>
            </nav>
        </footer>
    </article>
</template>

<style scoped>
.guide {
    padding-block: var(--sp-48) var(--sp-96);
}

.guide__head {
    display: grid;
    gap: var(--sp-12);
    max-width: 54ch;
    margin-bottom: var(--sp-40);
}

.guide__title {
    text-wrap: balance;
}

.guide__meta {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-8);
}

.guide__lead {
    color: var(--c-ink-2);
}

.guide__body h2 {
    margin-top: var(--sp-32);
}

.guide__foot {
    display: grid;
    gap: var(--sp-24);
    max-width: 54ch;
    margin-top: var(--sp-48);
    padding-top: var(--sp-24);
    border-top: 1px solid var(--c-line);
}

.guide__list {
    display: grid;
    gap: var(--sp-8);
    margin: var(--sp-8) 0 0;
    padding: 0;
    list-style: none;
}

@media (min-width: 1024px) {
    .guide {
        padding-block: var(--sp-64) var(--sp-128);
    }
}
</style>
