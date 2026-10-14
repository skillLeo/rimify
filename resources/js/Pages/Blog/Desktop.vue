<script setup lang="ts">
/**
 * The Blog (the client's #10, D-230): every published article, newest first, at /blog — where the footer's „Blog“
 * leads. Quiet like the articles themselves: the title, one line on what is here, then each article with its lead and
 * its reading time. The words are the articles' own (Inhalte › Seiten); nothing here is HTML.
 */

import { Head, Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import Icon from '../../Components/Ui/Icon.vue'
import { useShared } from '../../composables/useShared'

defineOptions({ layout: AppLayout })

defineProps<{
    articles: { slug: string; title: string; teaser: string; minutes: number; href: string; date: string | null }[]
}>()

const DESCRIPTION = 'Artikel rund um Felge, Reifen und Gutachten, verständlich erklärt – etwa wo HSN und TSN stehen und was die Einpresstiefe bedeutet.'

const shared = useShared()
const canonical = computed(() => (typeof shared.value.canonical === 'string' ? shared.value.canonical : ''))
</script>

<template>
    <Head>
        <title>Blog</title>
        <meta name="description" :content="DESCRIPTION">
        <meta property="og:type" content="website" head-key="og:type">
        <meta property="og:site_name" content="RIMIFY" head-key="og:site_name">
        <meta property="og:locale" content="de_DE" head-key="og:locale">
        <meta property="og:title" content="Blog – RIMIFY" head-key="og:title">
        <meta property="og:description" :content="DESCRIPTION" head-key="og:description">
        <meta v-if="canonical" property="og:url" :content="canonical" head-key="og:url">
    </Head>

    <section class="container blog" aria-labelledby="blog-title">
        <header class="blog__head">
            <h1 id="blog-title" class="h1 blog__title">Blog</h1>
            <p class="body-l blog__lead">Artikel rund um Felge, Reifen und Gutachten.</p>
        </header>

        <ol v-if="articles.length > 0" class="blog__list">
            <li v-for="article in articles" :key="article.slug" class="blog__item">
                <h2 class="h3 blog__name">
                    <Link :href="article.href" class="blog__link" prefetch>{{ article.title }}</Link>
                </h2>
                <p v-if="article.teaser" class="blog__teaser">{{ article.teaser }}</p>
                <p class="small muted num blog__meta">
                    <Icon name="clock" :size="16" />
                    {{ article.minutes }} Min. Lesezeit<template v-if="article.date"> · {{ article.date }}</template>
                </p>
            </li>
        </ol>
        <p v-else class="muted">Noch ist kein Artikel veröffentlicht.</p>
    </section>
</template>

<style scoped>
.blog {
    padding-block: var(--sp-48) var(--sp-96);
}

.blog__head {
    display: grid;
    gap: var(--sp-12);
    max-width: 54ch;
    margin-bottom: var(--sp-40);
}

.blog__title {
    text-wrap: balance;
}

.blog__lead {
    color: var(--c-ink-2);
}

.blog__list {
    display: grid;
    gap: var(--sp-32);
    max-width: 64ch;
    margin: 0;
    padding: 0;
    list-style: none;
}

.blog__item {
    display: grid;
    gap: var(--sp-8);
    padding-top: var(--sp-24);
    border-top: 1px solid var(--c-line);
}

.blog__name {
    margin: 0;
    text-wrap: balance;
}

.blog__link {
    color: var(--c-ink);
    text-decoration: none;
}

.blog__link:hover,
.blog__link:focus-visible {
    text-decoration: underline;
}

.blog__teaser {
    margin: 0;
    color: var(--c-ink-2);
}

.blog__meta {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-8);
    margin: 0;
}

@media (min-width: 1024px) {
    .blog {
        padding-block: var(--sp-64) var(--sp-128);
    }
}
</style>
