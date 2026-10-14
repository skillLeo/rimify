<script setup lang="ts">
/**
 * One Blog article (H10 → /ratgeber/{slug}; the client's #10, D-230). Editorial and quiet: the way back to the Blog,
 * the title, the reading time, the lead, then the sections as running text at a readable measure — with a figure (its
 * alt text required) or a table (a caption, header cells) where the article has one. Every word is printed as text,
 * never as HTML (ArticleBlocks). The other articles are offered at the end — an article page that ends in nothing
 * sends the reader back to the browser.
 */

import { Head, Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import Icon from '../../Components/Ui/Icon.vue'
import { useShared } from '../../composables/useShared'
import { paragraphs } from '../../format'

defineOptions({ layout: AppLayout })

type Block =
    | { type: 'prose'; data: { heading?: string; text?: string } }
    | { type: 'figure'; data: { src: string; alt: string; caption?: string; width?: number | null; height?: number | null } }
    | { type: 'table'; data: { caption: string; head: string[]; rows: string[][] } }

const props = defineProps<{
    guide: {
        slug: string
        title: string
        teaser: string
        minutes: number
        metaDescription: string
        blocks: Block[]
    }
    others: { slug: string; title: string; href: string }[]
}>()

const shared = useShared()
const description = computed(() => props.guide.metaDescription || props.guide.teaser)
const canonical = computed(() => (typeof shared.value.canonical === 'string' ? shared.value.canonical : ''))
/* The first figure of the article is its picture when it is shared; an article without one shares its words only. */
const image = computed(() => props.guide.blocks.find((b): b is Extract<Block, { type: 'figure' }> => b.type === 'figure')?.data ?? null)
</script>

<template>
    <Head>
        <title>{{ guide.title }} – Blog</title>
        <meta name="description" :content="description">
        <meta property="og:type" content="article" head-key="og:type">
        <meta property="og:site_name" content="RIMIFY" head-key="og:site_name">
        <meta property="og:locale" content="de_DE" head-key="og:locale">
        <meta property="og:title" :content="guide.title" head-key="og:title">
        <meta property="og:description" :content="description" head-key="og:description">
        <meta v-if="canonical" property="og:url" :content="canonical" head-key="og:url">
        <meta v-if="image" property="og:image" :content="image.src" head-key="og:image">
        <meta v-if="image" property="og:image:alt" :content="image.alt" head-key="og:image:alt">
    </Head>

    <article class="container guide" aria-labelledby="guide-title">
        <header class="guide__head">
            <Link href="/blog" class="label guide__back">Blog</Link>
            <h1 id="guide-title" class="h1 guide__title">{{ guide.title }}</h1>
            <p class="small muted num guide__meta">
                <Icon name="clock" :size="16" />
                {{ guide.minutes }} Min. Lesezeit
            </p>
            <p v-if="guide.teaser" class="body-l guide__lead">{{ guide.teaser }}</p>
        </header>

        <div class="prose guide__body">
            <template v-for="(block, index) in guide.blocks" :key="index">
                <template v-if="block.type === 'prose'">
                    <h2 v-if="block.data.heading" class="h3">{{ block.data.heading }}</h2>
                    <p v-for="(paragraph, p) in paragraphs(block.data.text)" :key="p" class="guide__para">{{ paragraph }}</p>
                </template>
                <figure v-else-if="block.type === 'figure'" class="guide__figure">
                    <img :src="block.data.src" :alt="block.data.alt" :width="block.data.width ?? undefined" :height="block.data.height ?? undefined" loading="lazy" decoding="async">
                    <figcaption v-if="block.data.caption" class="small muted">{{ block.data.caption }}</figcaption>
                </figure>
                <div v-else-if="block.type === 'table'" class="guide__table" role="region" :aria-label="block.data.caption" tabindex="0">
                    <table>
                        <caption>{{ block.data.caption }}</caption>
                        <thead>
                            <tr>
                                <th v-for="(cell, c) in block.data.head" :key="c" scope="col">{{ cell }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(row, r) in block.data.rows" :key="r">
                                <td v-for="(cell, c) in row" :key="c">{{ cell }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </template>
        </div>

        <footer class="guide__foot">
            <p class="micro quiet guide__note">
                Dieser Artikel erklärt Begriffe und Abläufe allgemein. Was für deine Felge gilt, steht in ihrem Gutachten.
            </p>

            <nav v-if="others.length > 0" class="guide__more" aria-labelledby="guide-more">
                <p id="guide-more" class="label">Weitere Artikel</p>
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

/* A line break the team typed inside a paragraph stays one, as on the legal pages and the FAQ. */
.guide__para {
    white-space: pre-line;
}

.guide__head {
    display: grid;
    gap: var(--sp-12);
    max-width: 54ch;
    margin-bottom: var(--sp-40);
}

.guide__back {
    justify-self: start;
    color: var(--c-ink-2);
    text-decoration: none;
}

.guide__back:hover,
.guide__back:focus-visible {
    color: var(--c-ink);
    text-decoration: underline;
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

.guide__figure {
    display: grid;
    gap: var(--sp-8);
    margin: var(--sp-24) 0;
}

.guide__figure img {
    width: 100%;
    max-width: 100%;
    height: auto;
    border-radius: var(--r-tile);
}

.guide__table {
    margin: var(--sp-24) 0;
    overflow-x: auto;
}

.guide__table table {
    width: 100%;
    border-collapse: collapse;
    font-variant-numeric: tabular-nums;
}

.guide__table caption {
    padding-bottom: var(--sp-8);
    text-align: left;
    font-weight: 600;
}

.guide__table th,
.guide__table td {
    padding: var(--sp-8) var(--sp-12);
    border-bottom: 1px solid var(--c-line);
    text-align: left;
    vertical-align: top;
}

.guide__table th {
    color: var(--c-ink-2);
    font-weight: 600;
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
