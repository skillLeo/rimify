<script setup lang="ts">
/**
 * H4 · The Gutachten story — signature moment 2, "Textmarker".
 *
 * A paper document on the left: the "Verwendungsbereich" table of a fictional Teilegutachten, set
 * small and narrow the way a type-approval document is set. On the right, three steps. As the
 * steps scroll into view, highlighter strokes mark the row of the example vehicle and, at the end,
 * the verdict stamp lands. The marker colour and its gradient exist for this one illustration
 * (docs/phase0/ADDENDUM.md §C, docs/design/sections/home.md §0.6).
 *
 * The document is an example and stays one: the marked row is always the fictional BMW row, with
 * a vehicle chosen or not. A "Beispiel" document that asserted a verdict for the customer's real
 * car — which no document here knows anything about — would be the one thing CLAUDE.md §2 forbids.
 * The row changes only when the engine hands the page a real document row for that vehicle.
 *
 * Motion is one scroll-driven timeline over the steps column where the browser has
 * `animation-timeline: view()`, so the four moments — find, mark, read the sizes, answer — play in
 * that order at every viewport height. Elsewhere two IntersectionObservers advance a `data-step`
 * attribute in the same order and CSS transitions do the rest, never flickering back. Below 1024,
 * under reduced motion, without JavaScript, and in print, the document simply rests in its end
 * state: every stroke drawn, the stamp down.
 *
 * The document is the one place on the site where an Auflage may appear as a code — it is a
 * facsimile. Everything the reader is meant to understand stands beside it, as sentences (R-15).
 */

import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import VerdictBadge from '../Ui/VerdictBadge.vue'
import { decimal } from '../../format'
import type { HomeStats } from '../../types/pages'

const props = defineProps<{
    stats: HomeStats
}>()

/* ── The document ─────────────────────────────────────────────────────────────── */

interface DocRow {
    maker: string
    trade: string
    type: string
    approval: string
    tyres: string
    conditions: string
}

/** Column widths in percent: Hersteller · Handelsbezeichnung · Typ · Genehmigungsnr. · Reifengrößen · Auflagen. */
const COLUMNS = [12, 20, 10, 22, 22, 14] as const
const HEADINGS = ['Hersteller', 'Handelsbezeichnung', 'Typ', 'Genehmigungsnr.', 'Reifengrößen', 'Auflagen'] as const

/* Every row is fictional. Row 4 is the one the story marks. */
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

/* ── The marker strokes, in the table's own coordinate space ─────────────────── */

/**
 * The SVG is stretched over the table (`preserveAspectRatio="none"`): x runs 0–1000 across the
 * table's width, y is one unit per CSS pixel of the table's designed height — a 24 px head row
 * and nine 28 px rows. `vector-effect: non-scaling-stroke` keeps the marker 22 px wide whatever
 * the table's width.
 */
const VB_W = 1000
const HEAD_H = 24
const ROW_H = 28
const VB_H = HEAD_H + EXAMPLE_ROWS.length * ROW_H
const ROW_Y = HEAD_H + TARGET * ROW_H + ROW_H / 2

const edges = COLUMNS.reduce<number[]>((acc, w) => [...acc, (acc[acc.length - 1] ?? 0) + w], [0])

/** A slightly wavy stroke from one column edge to another, starting a little before, ending a little after. */
function stroke(fromCol: number, toCol: number): string {
    const x0 = (edges[fromCol] ?? 0) * 10 - 8
    const x1 = (edges[toCol] ?? 100) * 10 + 10
    const third = (x1 - x0) / 3
    const y = ROW_Y

    return `M ${x0} ${y - 1.5} C ${(x0 + third).toFixed(1)} ${y + 1.5}, ${(x0 + 2 * third).toFixed(1)} ${y - 1.5}, ${x1} ${y + 1.2}`
}

/* Stroke 1: Typ and Genehmigungsnr. · Stroke 2: the whole row · Stroke 3: Reifengrößen and Auflagen. */
const STROKES = [stroke(2, 4), stroke(0, 6), stroke(4, 6)]

/* ── The facts line ───────────────────────────────────────────────────────────── */

/* A count of zero means the data is not there yet; the line is then absent, never "0 Gutachten". */
const facts = computed<string | null>(() => {
    const { gutachten, variants, wheels } = props.stats

    if (gutachten <= 0 || variants <= 0 || wheels <= 0) {
        return null
    }

    return `${decimal(gutachten, 0)} Gutachten · ${decimal(variants, 0)} Fahrzeugvarianten · ${decimal(wheels, 0)} Felgen mit Gutachten`
})

/* ── The steps ────────────────────────────────────────────────────────────────── */

const STEPS = [
    {
        title: 'Fahrzeug eindeutig erkennen',
        text: 'Aus Marke, Modell und Variante – oder aus HSN und TSN – bestimmen wir die Typgenehmigung deines Fahrzeugs. Stehen zwei Fahrzeuge hinter einem Schlüssel, fragen wir nach, statt zu raten.',
    },
    {
        title: 'Gutachten abgleichen',
        text: 'Wir suchen die Zeile, in der genau dein Fahrzeug steht – mit der Felgengröße, der Einpresstiefe und den Reifengrößen, die dort freigegeben sind.',
    },
    {
        title: 'Klare Antwort',
        text: 'Du bekommst eine von vier Antworten: freigegeben, mit Auflagen, nicht freigegeben oder unbekannt. Nennt das Gutachten Auflagen, schreiben wir sie aus:',
    },
] as const

const EXAMPLE_CONDITIONS = [
    'Die Verwendung ist nur mit Reifen der Größe 225/40 R18 zulässig.',
    'Die Änderung ist in die Fahrzeugpapiere einzutragen.',
]

/* ── Motion fallback: observers where the browser has no scroll-driven animations ── */

/**
 * The same order as the timeline: step 1 → stroke 1, step 2 → stroke 2, step 3 → stroke 3, and the
 * stamp once step 3 has moved on up to the top quarter of the viewport. The centre band catches
 * each step as it is read; the upper band is where step 3 is when the reader is done with it.
 */
const STATES = ['1', '2', '3', 'stamped'] as const
const CENTRE_BAND = '-40% 0px -40% 0px'
const UPPER_BAND = '0px 0px -75% 0px'

const root = ref<HTMLElement | null>(null)
const fallback = ref(false)
const reached = ref(0)
const observers: IntersectionObserver[] = []

const step = computed(() => (fallback.value && reached.value > 0 ? STATES[reached.value - 1] : undefined))

function advance(to: number): void {
    /* The highest state reached stays reached: scrolling back never undraws a stroke. */
    if (to > reached.value) {
        reached.value = to
    }
}

function observe(rootMargin: string, targets: HTMLElement[], state: (el: HTMLElement) => number): void {
    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    advance(state(entry.target as HTMLElement))
                }
            }
        },
        { rootMargin }
    )

    for (const el of targets) {
        observer.observe(el)
    }

    observers.push(observer)
}

onMounted(() => {
    if (typeof IntersectionObserver === 'undefined') {
        return
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const desktop = window.matchMedia('(min-width: 1024px)').matches
    const native = typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('animation-timeline: view()')

    if (reduced || !desktop || native || root.value === null) {
        return
    }

    const steps = [...root.value.querySelectorAll<HTMLElement>('[data-step-index]')]
    const last = steps[steps.length - 1]

    fallback.value = true
    observe(CENTRE_BAND, steps, (el) => Number(el.dataset.stepIndex))

    if (last !== undefined) {
        observe(UPPER_BAND, [last], () => STATES.length)
    }
})

onBeforeUnmount(() => observers.forEach((o) => o.disconnect()))
</script>

<template>
    <section
        id="h4"
        ref="root"
        class="story"
        :class="{ 'is-io': fallback }"
        data-section="H4"
        :data-step="step"
        aria-labelledby="h4-heading"
    >
        <div class="container">
            <div class="grid">
                <div class="story__head">
                    <h2 id="h4-heading" class="h2 story__title">Wir lesen das Gutachten. Du bekommst die Antwort.</h2>
                    <p v-if="facts" class="body num muted story__facts">{{ facts }}</p>
                </div>
            </div>

            <div class="grid story__grid">
                <div class="story__doc">
                    <!-- One image to assistive tech, not a table of cells; a figure may not carry role="img". -->
                    <div
                        class="doc"
                        role="img"
                        aria-label="Beispiel eines Gutachten-Auszugs; die Zeile des gewählten Fahrzeugs ist markiert"
                    >
                        <div class="doc__head">
                            <span class="doc__title">Teilegutachten Nr. 12-3456 (Beispiel)</span>
                            <span class="num">Seite 4 von 12</span>
                        </div>
                        <p class="doc__sub">Technischer Dienst Musterstadt · Auszug aus Abschnitt 4: Verwendungsbereich</p>

                        <div class="doc__body">
                            <div class="doc__table">
                                <div class="doc__row doc__row--head">
                                    <span v-for="heading in HEADINGS" :key="heading" class="doc__cell doc__cell--head">{{ heading }}</span>
                                </div>
                                <div v-for="(row, i) in EXAMPLE_ROWS" :key="i" class="doc__row" :class="{ 'doc__row--target': i === TARGET }">
                                    <span class="doc__cell">{{ row.maker }}</span>
                                    <span class="doc__cell">{{ row.trade }}</span>
                                    <span class="doc__cell">{{ row.type }}</span>
                                    <span class="doc__cell">{{ row.approval }}</span>
                                    <span class="doc__cell">{{ row.tyres }}</span>
                                    <span class="doc__cell">{{ row.conditions }}</span>
                                </div>
                            </div>

                            <!-- The highlighter: three strokes, each drawn twice for the uneven edge of a real marker. -->
                            <svg class="marker" :viewBox="`0 0 ${VB_W} ${VB_H}`" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                                <defs>
                                    <linearGradient id="marker-ink" gradientUnits="userSpaceOnUse" x1="0" y1="0" :x2="VB_W" y2="0">
                                        <stop offset="0%" stop-opacity="0.78" />
                                        <stop offset="45%" stop-opacity="0.96" />
                                        <stop offset="100%" stop-opacity="0.82" />
                                    </linearGradient>
                                </defs>
                                <template v-for="(d, i) in STROKES" :key="i">
                                    <path
                                        class="marker__stroke marker__stroke--echo"
                                        :class="`marker__stroke--${i + 1}`"
                                        :d="d"
                                        transform="translate(0 1)"
                                        pathLength="1"
                                        stroke="url(#marker-ink)"
                                    />
                                    <path class="marker__stroke" :class="`marker__stroke--${i + 1}`" :d="d" pathLength="1" stroke="url(#marker-ink)" />
                                </template>
                            </svg>
                        </div>

                        <p class="micro quiet doc__caption">Gutachten-Auszug (Beispiel)</p>

                        <span class="doc__stamp">
                            <VerdictBadge status="PERMITTED" size="lg" />
                        </span>
                    </div>
                </div>

                <ol class="story__steps">
                    <li v-for="(item, i) in STEPS" :key="item.title" class="story__step" :data-step-index="i + 1">
                        <span class="h2 num story__num" aria-hidden="true">{{ i + 1 }}</span>
                        <h3 class="h3 story__step-title">{{ item.title }}</h3>
                        <p class="body muted story__text">{{ item.text }}</p>

                        <div v-if="i === STEPS.length - 1" class="story__example">
                            <VerdictBadge status="CONDITIONAL" />
                            <ul class="small story__conditions">
                                <li v-for="sentence in EXAMPLE_CONDITIONS" :key="sentence">{{ sentence }}</li>
                            </ul>
                        </div>
                    </li>
                </ol>
            </div>
        </div>
    </section>
</template>

<style scoped>
/* ── Heading block ─────────────────────────────────────────────────────────── */

.story__head {
    grid-column: 1 / -1;
}

.story__title {
    max-width: 22ch;
}

.story__facts {
    margin-top: var(--sp-12);
}

.story__grid {
    margin-top: var(--sp-48);
    row-gap: var(--sp-48);
}

.story__doc,
.story__steps {
    grid-column: 1 / -1;
    min-width: 0;
}

/* ── The paper ─────────────────────────────────────────────────────────────── */

.doc {
    position: relative;
    width: 100%;
    padding: var(--sp-24);
    border-radius: var(--r-control);
    background: var(--c-surface);
    box-shadow: var(--e-2);
    color: var(--c-ink);
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    font-stretch: 85%;
    font-variant-numeric: tabular-nums;
}

.doc__head {
    display: flex;
    justify-content: space-between;
    gap: var(--sp-16);
    font-weight: 600;
}

.doc__sub {
    margin-top: var(--sp-4);
    padding-bottom: var(--sp-8);
    border-bottom: 1px solid var(--c-line);
    color: var(--c-ink-2);
}

.doc__body {
    position: relative;
    margin-top: var(--sp-12);
}

/* A grid, not a table: the rows must be exactly 28 px so the strokes land where the row is. */
.doc__table {
    display: grid;
}

.doc__row {
    display: grid;
    grid-template-columns: minmax(0, 12fr) minmax(0, 20fr) minmax(0, 10fr) minmax(0, 22fr) minmax(0, 22fr) minmax(0, 14fr);
}

.doc__cell {
    display: flex;
    align-items: center;
    height: 28px;
    min-width: 0;
    padding-right: var(--sp-4);
    border-bottom: 1px solid var(--c-line);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.doc__cell--head {
    height: 24px;
    border-bottom-color: var(--c-line-2);
    color: var(--c-ink-2);
    font-weight: 500;
}

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
    mix-blend-mode: multiply;
    pointer-events: none;
}

.marker stop {
    stop-color: var(--c-marker);
}

.marker__stroke {
    fill: none;
    stroke-width: 22px;
    stroke-linecap: butt;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
    stroke-dasharray: 1;
    stroke-dashoffset: 0;
}

.marker__stroke--echo {
    opacity: 0.6;
}

/* ── The stamp ─────────────────────────────────────────────────────────────── */

.doc__stamp {
    position: absolute;
    right: var(--sp-24);
    bottom: var(--sp-48);
    display: inline-flex;
    transform: rotate(-4deg);
    transform-origin: center;
}

/* ── The steps ─────────────────────────────────────────────────────────────── */

.story__steps {
    display: grid;
    gap: var(--sp-48);
}

.story__step {
    display: grid;
    gap: var(--sp-8);
    align-content: start;
}

.story__num {
    color: var(--c-ink-3);
}

.story__text {
    max-width: 54ch;
    hyphens: auto;
}

.story__example {
    display: grid;
    justify-items: start;
    gap: var(--sp-8);
    margin-top: var(--sp-8);
}

.story__conditions {
    padding-left: var(--sp-16);
    list-style: disc;
    color: var(--c-ink-2);
}

@media (min-width: 1024px) {
    .story__head {
        grid-column: 1 / span 8;
    }

    .story__doc {
        grid-column: 1 / span 7;
        align-self: start;
        position: sticky;
        top: calc(var(--header-h) + var(--vbar-h) + var(--sp-24));
    }

    .story__steps {
        grid-column: 9 / span 4;
        gap: var(--sp-64);
    }

    /* The column is longer than one viewport, so the four moments are apart on the timeline. */
    .story__step {
        min-height: 32vh;
    }
}

/* ── Motion: one timeline over the steps column, four consecutive slices of it ── */

@media (min-width: 1024px) {
    @supports (animation-timeline: view()) {
        .story {
            timeline-scope: --story;
        }

        .story__steps {
            view-timeline: --story block;
        }

        .marker__stroke--1 {
            animation: draw linear both;
            animation-timeline: --story;
            animation-range: cover 5% cover 25%;
        }

        .marker__stroke--2 {
            animation: draw linear both;
            animation-timeline: --story;
            animation-range: cover 30% cover 50%;
        }

        .marker__stroke--3 {
            animation: draw linear both;
            animation-timeline: --story;
            animation-range: cover 52% cover 68%;
        }

        .doc__stamp {
            animation: land linear both;
            animation-timeline: --story;
            animation-range: cover 72% cover 85%;
        }
    }
}

/* The observer fallback: the class arrives on mount, the attribute as the steps are reached — in the same order. */
.story.is-io .marker__stroke {
    stroke-dashoffset: 1;
    transition: stroke-dashoffset var(--d-3) var(--ease-out);
}

.story.is-io[data-step] .marker__stroke--1,
.story.is-io[data-step='2'] .marker__stroke--2,
.story.is-io[data-step='3'] .marker__stroke--2,
.story.is-io[data-step='3'] .marker__stroke--3,
.story.is-io[data-step='stamped'] .marker__stroke--2,
.story.is-io[data-step='stamped'] .marker__stroke--3 {
    stroke-dashoffset: 0;
}

.story.is-io .doc__stamp {
    opacity: 0;
    transform: rotate(-4deg) scale(1.08);
    transition:
        opacity var(--d-2) var(--ease-out),
        transform var(--d-2) var(--ease-out);
}

.story.is-io[data-step='stamped'] .doc__stamp {
    opacity: 1;
    transform: rotate(-4deg) scale(1);
}

@keyframes draw {
    from {
        stroke-dashoffset: 1;
    }

    to {
        stroke-dashoffset: 0;
    }
}

@keyframes land {
    from {
        opacity: 0;
        transform: rotate(-4deg) scale(1.08);
    }

    to {
        opacity: 1;
        transform: rotate(-4deg) scale(1);
    }
}

/* Motion off means motion off: the document rests in its end state. So does paper. */
@media (prefers-reduced-motion: reduce), print {
    .story .marker__stroke,
    .story.is-io .marker__stroke {
        animation: none;
        transition: none;
        stroke-dashoffset: 0;
    }

    .story .doc__stamp,
    .story.is-io .doc__stamp {
        animation: none;
        transition: none;
        opacity: 1;
        transform: rotate(-4deg) scale(1);
    }
}
</style>
