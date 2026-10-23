<script setup lang="ts">
/**
 * The legal pages: five sections over one route, and the text of the selected one.
 *
 * The bodies are placeholders until the client's Kanzlei supplies the text (D-024): while a page's
 * flag is on, the server sends no words, and the page shows one notice that cannot be read as the
 * text (D-319). We do not draft German legal copy: an Impressum written by a developer is a
 * liability the client carries. This page renders exactly what the `page_blocks` rows hold.
 *
 * The section list is a sticky rail beside the text from 900px and a wrapped row of links above
 * it on a phone — the same links either way, one DOM.
 */

import { Head, Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import { paragraphs } from '../../format'
import { COOKIES } from '../../legal/cookies'
import type { RechtlichesProps } from '../../types/pages'

defineOptions({ layout: AppLayout, inheritAttrs: false })

const props = defineProps<RechtlichesProps>()

const title = computed(() => props.tabs.find((t) => t.slug === props.active)?.title ?? 'Rechtliches')

/*
 * A block carries `heading` and `text` (older rows used `body`). A heading that merely repeats the
 * page title is dropped: the H1 already says it, and saying it twice reads as a template.
 */
const blocks = computed(() =>
    props.blocks.map((block) => {
        const heading = typeof block.data.heading === 'string' ? block.data.heading : null
        const text =
            typeof block.data.text === 'string'
                ? block.data.text
                : typeof block.data.body === 'string'
                  ? block.data.body
                  : ''

        return {
            id: block.id,
            heading: heading !== null && heading.trim() !== title.value ? heading : null,
            text,
        }
    })
)
</script>

<template>
    <Head :title="title" />

    <section class="section-dense">
        <div class="wrap rec">
            <nav class="rec__nav" aria-label="Rechtliches">
                <Link
                    v-for="tab in tabs"
                    :key="tab.slug"
                    :href="`/rechtliches/${tab.slug}`"
                    class="rec__link"
                    :class="{ 'rec__link--on': tab.slug === active }"
                    :aria-current="tab.slug === active ? 'page' : undefined"
                >
                    {{ tab.title }}
                </Link>
            </nav>

            <article class="rec__body">
                <h1 class="t-h1">{{ title }}</h1>

                <!--
                    The Impressum's facts from the seller data (§ 5 DDG) — the same place the invoice reads. What is not
                    given yet says so, visibly: never a guess, never the brand name standing in for the legal one.
                -->
                <section v-if="provider" class="rec__block rec__provider" aria-labelledby="rec-provider">
                    <h2 id="rec-provider" class="t-h3">Angaben gemäß § 5 DDG</h2>
                    <p v-if="provider.notice" class="t-body rec__placeholder">{{ provider.notice }}</p>
                    <p v-else-if="provider.placeholder" class="t-body rec__placeholder">
                        Platzhalter: Die folgenden Angaben sind Beispielwerte, nicht die des Betreibers. Sie werden vor dem Start ersetzt.
                    </p>
                    <p v-else-if="!provider.complete" class="t-body rec__placeholder">
                        Vorläufig: Die Angaben zum Betreiber liegen noch nicht vollständig vor und werden vor dem Start ergänzt.
                    </p>
                    <dl class="rec__facts">
                        <div v-for="row in provider.rows" :key="row.label" class="rec__fact">
                            <dt>{{ row.label }}</dt>
                            <!-- A field not given shows its marker, „[FIRMENNAME]“: never a guess (D-319). -->
                            <dd v-if="row.missing" class="rec__para rec__marker">{{ row.value }}</dd>
                            <dd v-else-if="row.value" class="rec__para">{{ row.value }}</dd>
                            <dd v-else class="rec__missing">noch nicht angegeben</dd>
                        </div>
                    </dl>
                </section>

                <!-- A placeholder's one notice, and nothing that reads like a clause: its words never reach the page (D-319). -->
                <p v-if="placeholder" class="t-body rec__placeholder">{{ notice }}</p>

                <!-- The Kanzlei's text as its paragraphs: a blank line typed in the admin is a new one. -->
                <div v-for="block in blocks" v-else :key="block.id" class="rec__block">
                    <h2 v-if="block.heading" class="t-h3">{{ block.heading }}</h2>
                    <p v-for="(paragraph, p) in paragraphs(block.text)" :key="p" class="t-body rec__para">{{ paragraph }}</p>
                </div>

                <!--
                    The cookies as facts, from the list the cookie settings show (legal/cookies.ts) — beside the
                    Kanzlei's text, never instead of it (D-024).
                -->
                <section v-if="active === 'datenschutz'" id="cookies" class="rec__block rec__cookies" aria-labelledby="rec-cookies">
                    <h2 id="rec-cookies" class="t-h3">Cookies bei RIMIFY</h2>
                    <div class="rec__table">
                        <table>
                            <thead>
                                <tr>
                                    <th scope="col">Cookie</th>
                                    <th scope="col">Art</th>
                                    <th scope="col">Was es speichert</th>
                                    <th scope="col">Laufzeit</th>
                                    <th scope="col">So löschst du es</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="cookie in COOKIES" :key="cookie.name">
                                    <th scope="row">{{ cookie.name }}</th>
                                    <td>{{ cookie.category }}</td>
                                    <td>{{ cookie.stores }}</td>
                                    <td class="rec__nowrap">{{ cookie.lifetime }}</td>
                                    <td>{{ cookie.clear }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            </article>
        </div>
    </section>
</template>

<style scoped>
.rec {
    display: grid;
    gap: var(--space-5);
}

/* Phone: the five sections as a wrapped row above the text. */
.rec__nav {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-4);
    border-bottom: 1px solid var(--line);
}

.rec__link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    /* Both ways: `AGB` is three letters and came out 36px wide, short of a thumb (DIRECTION §6). */
    min-width: 44px;
    min-height: 44px;
    color: var(--ink2);
    font-weight: 700;
    text-decoration: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: color var(--duration-instant) var(--ease-standard);
}

@media (hover: hover) and (pointer: fine) {
    .rec__link:hover {
        color: var(--ink);
    }
}

/* The current section is marked by the strong rule as well as by colour. */
.rec__link--on {
    color: var(--ink);
    border-bottom-color: var(--border-strong);
}

.rec__body {
    min-width: 0;
    max-width: 75ch;
}

.rec__block {
    margin-top: var(--space-5);
}

.rec__block h2 {
    margin-bottom: var(--space-2);
}

/* A line break inside a paragraph stays one: an address in the Impressum is one line per row. */
.rec__para {
    white-space: pre-line;
}

.rec__para + .rec__para {
    margin-top: var(--space-3);
}

.rec__placeholder {
    margin-top: var(--space-5);
    padding: var(--space-4);
    background: var(--field);
    border-radius: var(--radius-sm);
    color: var(--ink2);
}

.rec__block .rec__placeholder {
    margin-top: 0;
}

/* The provider's facts: label over value on a phone, side by side from 600px. */
.rec__facts {
    display: grid;
    gap: var(--space-3);
    margin: var(--space-3) 0 0;
}

.rec__fact {
    display: grid;
    gap: var(--space-1);
}

.rec__fact dt {
    color: var(--ink2);
    font-weight: 700;
}

.rec__fact dd {
    margin: 0;
}

.rec__missing {
    color: var(--ink2);
    font-style: italic;
}

/* A marker in place of a field not given: unmistakably not a value — the placeholder's ground, its own ink. */
.rec__marker {
    justify-self: start;
    padding: 0 var(--space-1);
    background: var(--field);
    border-radius: var(--radius-sm);
    color: var(--ink2);
    font-weight: 700;
}

@media (min-width: 600px) {
    .rec__fact {
        grid-template-columns: 220px minmax(0, 1fr);
        gap: var(--space-4);
    }
}

/* The cookie facts: a real table, scrolling inside its own box on a phone rather than squeezing a column. */
.rec__table {
    margin-top: var(--space-3);
    overflow-x: auto;
}

.rec__table table {
    min-width: 640px;
    border-collapse: collapse;
    font-size: var(--text-small);
}

.rec__table th,
.rec__table td {
    padding: var(--space-2) var(--space-3) var(--space-2) 0;
    border-bottom: 1px solid var(--line);
    text-align: left;
    vertical-align: top;
}

.rec__table thead th {
    color: var(--ink2);
    font-weight: 700;
}

.rec__table tbody th {
    font-weight: 700;
    white-space: nowrap;
}

.rec__nowrap {
    white-space: nowrap;
}

/* From 900px: a sticky rail beside the text. */
@media (min-width: 900px) {
    .rec {
        grid-template-columns: 220px minmax(0, 1fr);
        gap: var(--space-7);
        align-items: start;
    }

    .rec__nav {
        position: sticky;
        top: calc(var(--header-h) + var(--space-5));
        flex-direction: column;
        flex-wrap: nowrap;
        gap: 0;
        border-bottom: 0;
        border-left: 1px solid var(--line);
    }

    .rec__link {
        padding-left: var(--space-4);
        margin: 0 0 0 -1px;
        border-bottom: 0;
        border-left: 2px solid transparent;
    }

    .rec__link--on {
        border-left-color: var(--border-strong);
    }
}
</style>
