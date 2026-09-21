<script setup lang="ts">
/**
 * The Gutachten story on a phone (H4, signature moment 2 "Textmarker"), static: three blocks,
 * each with its own crop of the example document in that step's state — the type columns
 * marked, then the whole row, then the row with its tyre sizes and the verdict stamp. Nothing
 * scrolls, nothing animates; the marker is already on the paper.
 *
 * The document is fictional (a made-up test centre, made-up approval numbers) and says so. It
 * is the one place on the site where an Auflage may appear as a code, because that is what a
 * Gutachten looks like — the steps beside it write the answer out in sentences (R-15).
 */

import { computed } from 'vue'
import VerdictBadge from '../../Ui/VerdictBadge.vue'
import { decimal } from '../../../format'
import type { HomeStats } from '../../../types/pages'

const props = withDefaults(defineProps<{ stats?: HomeStats | null }>(), { stats: null })

const facts = computed(() => {
    const s = props.stats

    if (s === null || s.gutachten <= 0 || s.variants <= 0 || s.wheels <= 0) {
        return null
    }

    return `${decimal(s.gutachten, 0)} Gutachten · ${decimal(s.variants, 0)} Fahrzeugvarianten · ${decimal(s.wheels, 0)} Felgen mit Gutachten`
})

/*
 * The example document, verbatim from the desktop story (`Components/Home/GutachtenStory.vue`,
 * `EXAMPLE_ROWS`) — the desktop keeps its rows inline, so they are copied here until they live in
 * a module both documents import (docs/mobile/REQUESTS.md). Every row is fictional; row 4 is the
 * one the story marks.
 */
interface DocRow {
    maker: string
    trade: string
    type: string
    approval: string
    tyres: string
    conditions: string
}

const EXAMPLE_ROWS: readonly DocRow[] = [
    { maker: 'Audi', trade: 'A4 Avant', type: 'B8', approval: 'e1*2001/116*0430*', tyres: '235/40 R18, 245/40 R18', conditions: 'A02' },
    { maker: 'VW', trade: 'Golf VII', type: '5G', approval: 'e1*2007/46*0300*', tyres: '225/40 R18, 225/45 R17', conditions: '–' },
    { maker: 'Mercedes-Benz', trade: 'C-Klasse', type: 'W205', approval: 'e1*2007/46*0402*', tyres: '225/45 R17, 245/40 R18', conditions: 'A11' },
    { maker: 'BMW', trade: '3er Coupé', type: '346C', approval: 'e1*2001/116*0136*', tyres: '225/40 R18, 225/45 R17', conditions: '–' },
    { maker: 'Škoda', trade: 'Octavia', type: '5E', approval: 'e11*2007/46*0122*', tyres: '225/45 R17, 225/40 R18', conditions: 'K1a' },
    { maker: 'Ford', trade: 'Focus', type: 'DEH', approval: 'e13*2007/46*0350*', tyres: '215/45 R17, 235/35 R19', conditions: 'A02' },
    { maker: 'Opel', trade: 'Astra', type: 'K', approval: 'e1*2007/46*0519*', tyres: '225/45 R17, 225/40 R18', conditions: '–' },
    { maker: 'Seat', trade: 'Leon', type: '5F', approval: 'e9*2007/46*0141*', tyres: '225/40 R18, 225/45 R17', conditions: 'A11' },
    { maker: 'VW', trade: 'Passat', type: '3G', approval: 'e1*2007/46*0396*', tyres: '235/45 R17, 235/40 R18', conditions: 'K1a' },
]

const TARGET = 3

/* The crop shows rows 3–5 (the marked row in the middle) with one tyre size each: the columns are 318 px wide at 390. */
const rows = EXAMPLE_ROWS.slice(TARGET - 1, TARGET + 2).map((row) => ({ ...row, tyre: row.tyres.split(',')[0]?.trim() ?? row.tyres }))

const STEPS = [
    {
        n: 1,
        title: 'Fahrzeug eindeutig erkennen',
        text: 'Aus Marke, Modell und Variante – oder aus HSN und TSN – bestimmen wir die Typgenehmigung deines Fahrzeugs. Stehen zwei Fahrzeuge hinter einem Schlüssel, fragen wir nach, statt zu raten.',
        strokes: [1],
        stamp: false,
    },
    {
        n: 2,
        title: 'Gutachten abgleichen',
        text: 'Wir suchen die Zeile, in der genau dein Fahrzeug steht – mit der Felgengröße, der Einpresstiefe und den Reifengrößen, die dort freigegeben sind.',
        strokes: [2, 3],
        stamp: false,
    },
    {
        n: 3,
        title: 'Klare Antwort',
        text: 'Du bekommst eine von vier Antworten: freigegeben, mit Auflagen, nicht freigegeben oder unbekannt. Nennt das Gutachten Auflagen, schreiben wir sie aus:',
        strokes: [1, 2, 3],
        stamp: true,
    },
]

/*
 * The strokes, in the crop's own coordinates: x in thousandths of the table width, y in CSS px
 * (one heading row and three body rows of 28 px; row 4 is the middle one, centred at y 70).
 * Columns: Hersteller 0–22 % · Typ 22–33 · Genehmigungsnr. 33–63 · Reifengrößen 63–86 · Auflagen 86–100.
 * Each starts a few px before its cell and ends a few after, with a slight wave — a hand, not a rule.
 */
const STROKES: Record<number, string> = {
    1: 'M 214 69 C 320 67.5 500 72 638 70',
    2: 'M -6 70.5 C 250 68.5 700 72.5 1008 69.5',
    3: 'M 624 69 C 750 71 900 67.5 1008 70',
}
</script>

<template>
    <div class="story">
        <p v-if="facts" class="body num muted story__facts">{{ facts }}</p>

        <ol class="story__steps">
            <li v-for="step in STEPS" :key="step.n" class="story__step">
                <h3 class="h3 story__title"><span class="story__n num">{{ step.n }}</span> {{ step.title }}</h3>

                <figure class="doc doc--crop" role="img" aria-label="Beispiel eines Gutachten-Auszugs; die Zeile des gewählten Fahrzeugs ist markiert">
                    <div class="doc__head">
                        <span class="doc__title">Teilegutachten Nr. 12-3456 (Beispiel)</span>
                        <span class="doc__page">Seite 4 von 12</span>
                    </div>
                    <p class="doc__issuer">Technischer Dienst Musterstadt · Auszug aus Abschnitt 4: Verwendungsbereich</p>

                    <div class="doc__table-wrap">
                        <table class="doc__table">
                            <thead>
                                <tr>
                                    <th class="doc__c1">Hersteller</th>
                                    <th class="doc__c2">Typ</th>
                                    <th class="doc__c3">Genehmigungsnr.</th>
                                    <th class="doc__c4">Reifengrößen</th>
                                    <th class="doc__c5">Auflagen</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="row in rows" :key="row.type">
                                    <td>{{ row.maker }}</td>
                                    <td>{{ row.type }}</td>
                                    <td>{{ row.approval }}</td>
                                    <td>{{ row.tyre }}</td>
                                    <td>{{ row.conditions }}</td>
                                </tr>
                            </tbody>
                        </table>

                        <svg class="marker" viewBox="0 0 1000 112" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                            <defs>
                                <linearGradient :id="`marker-ink-${step.n}`" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1000" y2="0">
                                    <stop offset="0%" class="marker__stop marker__stop--a" />
                                    <stop offset="45%" class="marker__stop marker__stop--b" />
                                    <stop offset="100%" class="marker__stop marker__stop--c" />
                                </linearGradient>
                            </defs>
                            <template v-for="n in step.strokes" :key="n">
                                <path :d="STROKES[n]" class="marker__stroke" :stroke="`url(#marker-ink-${step.n})`" />
                                <path :d="STROKES[n]" class="marker__stroke marker__stroke--echo" :stroke="`url(#marker-ink-${step.n})`" transform="translate(0 1)" />
                            </template>
                        </svg>

                        <span v-if="step.stamp" class="doc__stamp">
                            <VerdictBadge status="PERMITTED" size="lg" />
                        </span>
                    </div>

                    <figcaption class="micro quiet doc__caption">Gutachten-Auszug (Beispiel)</figcaption>
                </figure>

                <p class="body muted story__text">{{ step.text }}</p>

                <div v-if="step.stamp" class="story__example">
                    <VerdictBadge status="CONDITIONAL" />
                    <ul class="story__conditions small">
                        <li>Die Verwendung ist nur mit Reifen der Größe 225/40 R18 zulässig.</li>
                        <li>Die Änderung ist in die Fahrzeugpapiere einzutragen.</li>
                    </ul>
                </div>
            </li>
        </ol>
    </div>
</template>

<style scoped>
.story__facts {
    margin-top: var(--sp-12);
}

.story__steps {
    display: grid;
    gap: var(--sp-40);
    margin-top: var(--sp-32);
}

.story__step {
    display: grid;
    gap: var(--sp-16);
}

.story__n {
    color: var(--c-ink-3);
}

.story__text {
    hyphens: auto;
}

/* ── The paper ─────────────────────────────────────────────────────────────── */

.doc {
    position: relative;
    padding: var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-surface);
    box-shadow: var(--e-2);
    color: var(--c-ink);
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    font-stretch: 85%;
    font-variant-numeric: tabular-nums;
}

/* A crop is 318 px wide at 390: the condensed width keeps every heading and number whole. */
.doc--crop {
    font-stretch: 75%;
}

.doc__head {
    display: flex;
    justify-content: space-between;
    gap: var(--sp-8);
    font-weight: 600;
}

.doc__issuer {
    padding-bottom: var(--sp-8);
    margin-bottom: var(--sp-4);
    border-bottom: 1px solid var(--c-line);
    color: var(--c-ink-2);
}

/* The marker blends with this group only, not with the whole page behind it. */
.doc__table-wrap {
    position: relative;
    isolation: isolate;
}

.doc__table {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
}

.doc__table th,
.doc__table td {
    height: 28px;
    padding: 0 2px 0 0;
    text-align: left;
    vertical-align: middle;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border-bottom: 1px solid var(--c-line);
}

.doc__table th {
    font-weight: 500;
    color: var(--c-ink-2);
    border-bottom-color: var(--c-line-2);
}

/* 318 px at 390: Hersteller must hold "Mercedes-Benz" and Auflagen its own heading, whole. */
.doc__c1 { width: 22%; }
.doc__c2 { width: 11%; }
.doc__c3 { width: 30%; }
.doc__c4 { width: 23%; }
.doc__c5 { width: 14%; }

.doc__caption {
    display: block;
    margin-top: var(--sp-12);
}

/* ── The marker ────────────────────────────────────────────────────────────── */

.marker {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
    mix-blend-mode: multiply;
}

.marker__stroke {
    fill: none;
    stroke-width: 22px;
    stroke-linecap: butt;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
}

.marker__stroke--echo {
    opacity: 0.6;
}

.marker__stop {
    stop-color: var(--c-marker);
}

.marker__stop--a { stop-opacity: 0.78; }
.marker__stop--b { stop-opacity: 0.96; }
.marker__stop--c { stop-opacity: 0.82; }

.doc__stamp {
    position: absolute;
    right: 0;
    bottom: calc(-1 * var(--sp-8));
    z-index: var(--z-raised);
    display: inline-flex;
    transform: rotate(-4deg);
    transform-origin: center;
}

/* ── The example in step 3 ─────────────────────────────────────────────────── */

.story__example {
    display: grid;
    gap: var(--sp-8);
    justify-items: start;
}

.story__conditions {
    padding-left: var(--sp-16);
    list-style: disc;
    color: var(--c-ink-2);
}
</style>
