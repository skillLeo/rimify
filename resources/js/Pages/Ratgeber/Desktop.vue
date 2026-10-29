<script setup lang="ts">
/**
 * One Blog article (H10 → /ratgeber/{slug}; the client's #10, D-230). Editorial and quiet: the way back to the Blog,
 * the title, the reading time, the lead, then the sections as running text at a readable measure — with a figure (its
 * alt text required) or a table (a caption, header cells) where the article has one. Every word is printed as text,
 * never as HTML (ArticleBlocks). The other articles are offered at the end — an article page that ends in nothing
 * sends the reader back to the browser.
 */

import { Head, Link } from '@inertiajs/vue3'
import { computed, onMounted, ref } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import Icon from '../../Components/Ui/Icon.vue'
import { useShared } from '../../composables/useShared'
import { paragraphs } from '../../format'

defineOptions({ layout: AppLayout })

type Block =
    | { type: 'prose'; data: { heading?: string; text?: string } }
    | { type: 'figure'; data: { src: string; alt: string; caption?: string; width?: number | null; height?: number | null } }
    | { type: 'table'; data: { caption: string; head: string[]; rows: string[][] } }
    | { type: 'quote'; data: { text: string; source?: string } }
    /* The HTML-Abschnitt (his admin item 11, D-352): markup the server cleaned twice (ArticleHtml), the one block written as such. */
    | { type: 'html'; data: { html: string } }

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

/* A shared link's picture needs its full address: a crawler reads `/storage/…` against nothing (SEI-31). */
const shareImage = computed(() => {
    const src = image.value?.src ?? ''

    if (/^https?:\/\//i.test(src)) {
        return src
    }

    try {
        return src !== '' && canonical.value !== '' ? new URL(src, canonical.value).href : null
    } catch {
        return null
    }
})

/*
 * A picture whose file is gone is left out, never shown as a broken image (SEI-34). One that failed before the page
 * came alive is found on mounting; one that fails later says so itself.
 */
const failed = ref<Set<number>>(new Set())

function broken(index: number): void {
    failed.value = new Set(failed.value).add(index)
}

onMounted(() => {
    for (const img of document.querySelectorAll<HTMLImageElement>('.guide__figure img[data-block]')) {
        if (img.complete && img.naturalWidth === 0) {
            broken(Number(img.dataset.block))
        }
    }
})
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
        <meta v-if="image && shareImage" property="og:image" :content="shareImage" head-key="og:image">
        <meta v-if="image && shareImage" property="og:image:alt" :content="image.alt" head-key="og:image:alt">
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
                <figure v-else-if="block.type === 'figure' && !failed.has(index)" class="guide__figure">
                    <img
                        :src="block.data.src"
                        :alt="block.data.alt"
                        :width="block.data.width ?? undefined"
                        :height="block.data.height ?? undefined"
                        :data-block="index"
                        loading="lazy"
                        decoding="async"
                        @error="broken(index)"
                    >
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
                <!-- A quote with its source, when the article names one (D-306). -->
                <figure v-else-if="block.type === 'quote'" class="guide__quote">
                    <blockquote>
                        <p v-for="(paragraph, p) in paragraphs(block.data.text)" :key="p" class="body-l guide__para">{{ paragraph }}</p>
                    </blockquote>
                    <figcaption v-if="block.data.source" class="small muted">{{ block.data.source }}</figcaption>
                </figure>
                <!-- The HTML-Abschnitt (D-352): only what ArticleHtml keeps, cleaned on save and again by the server here. -->
                <!-- eslint-disable-next-line vue/no-v-html -->
                <div v-else-if="block.type === 'html'" class="guide__html" v-html="block.data.html" />
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

/*
 * The HTML-Abschnitt (D-352) in the article's own type: its headings, lists and tables as the blocks beside it set
 * theirs. A wide table scrolls inside its own box, never the page.
 */
.guide__html {
    margin: var(--sp-24) 0;
}

.guide__html :deep(h2) {
    margin-top: var(--sp-32);
}

.guide__html :deep(:is(h3, h4)) {
    margin-top: var(--sp-24);
}

.guide__html :deep(:is(ul, ol)) {
    padding-left: var(--sp-24);
}

.guide__html :deep(ul) {
    list-style: disc;
}

.guide__html :deep(ol) {
    list-style: decimal;
}

.guide__html :deep(table) {
    display: block;
    max-width: 100%;
    margin: var(--sp-24) 0;
    overflow-x: auto;
    border-collapse: collapse;
    font-variant-numeric: tabular-nums;
}

.guide__html :deep(:is(th, td)) {
    padding: var(--sp-8) var(--sp-12);
    border-bottom: 1px solid var(--c-line);
    text-align: left;
    vertical-align: top;
}

.guide__html :deep(th) {
    color: var(--c-ink-2);
    font-weight: 600;
}

.guide__html :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: var(--r-tile);
}

/* Set off by its size and a quiet rule at its edge, as the shop's other quotes — never a box, never the ink bar of an alert. */
.guide__quote {
    display: grid;
    gap: var(--sp-8);
    margin: var(--sp-24) 0;
    padding-left: var(--sp-20);
    border-left: 2px solid var(--c-line-2);
}

.guide__quote blockquote {
    display: grid;
    gap: var(--sp-16);
    margin: 0;
}

.guide__quote p {
    margin: 0;
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
