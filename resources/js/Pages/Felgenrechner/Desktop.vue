<script setup lang="ts">
/**
 * /felgenrechner, desktop document — rebuilt close to the client's example (his #11: „replicate it as closely as
 * possible“; the operator's brief of 29.10.2026, Batch 2). As there: the drawing on the left, the two blocks on the
 * right; under the drawing the two answers in words, under everything the steps and the line about the papers. Below
 * 1024 one column in reading order: drawing, answers, blocks, share, steps, papers.
 *
 * The comparison arrives from the server: `state` when the address carried `?rechner=`, else the prefill (the smallest
 * size a Gutachten names for the chosen car — the sentence says exactly that), else his example — so the first paint
 * already shows it. Everything printed is arithmetic (lib/etRechner); nothing here judges a size (ACCURACY.md §6).
 */

import { Head, Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import EtCalculator from '../../Components/Rechner/EtCalculator.vue'
import OffsetDrawing from '../../Components/Rechner/OffsetDrawing.vue'
import RechnerShare from '../../Components/Home/RechnerShare.vue'
import ValueText from '../../Components/Ui/ValueText.vue'
import { useEtRechner } from '../../composables/useEtRechner'
import { useShared } from '../../composables/useShared'
import { DISCLAIMER } from '../../lib/rechner'
import type { FelgenrechnerProps } from '../../types/pages'

defineOptions({ layout: AppLayout })

const props = defineProps<FelgenrechnerProps>()

const shared = useShared()
const vehicle = computed(() => shared.value.vehicle)

const LEAD = 'Vergleiche deine Felge mit einer neuen: wie weit sich Innen- und Außenkante verschieben – gerechnet aus Breite, Einpresstiefe und Distanzscheibe.'

const { state, update, sentences, shareParam, prefillLine } = useEtRechner({
    prefill: () => props.prefill,
    vehicle: () => vehicle.value,
    state: props.state,
    writeUrl: true,
})
</script>

<template>
    <Head title="Felgenrechner">
        <meta name="description" :content="LEAD" head-key="description" />
    </Head>

    <section class="section rechner" aria-labelledby="rechner-title">
        <div class="container">
            <nav class="small muted rechner__crumbs" aria-label="Du bist hier">
                <ol class="rechner__crumb-list">
                    <li><Link href="/" class="rechner__crumb" prefetch>Startseite</Link></li>
                    <li aria-current="page">Felgenrechner</li>
                </ol>
            </nav>

            <h1 id="rechner-title" class="h1 rechner__title">Felgenrechner</h1>
            <p class="body-l muted rechner__lead">{{ LEAD }}</p>

            <div class="grid rechner__grid">
                <div class="rechner__picture">
                    <!-- The answer in words first, in the first screen; heard on every change. The drawing under it shows it. -->
                    <div class="rechner__answers" aria-live="polite">
                        <p class="h3 num rechner__answer"><ValueText :text="sentences.inner" /></p>
                        <p class="h3 num rechner__answer"><ValueText :text="sentences.outer" /></p>
                    </div>
                    <OffsetDrawing :state="state" />
                </div>

                <div class="rechner__form">
                    <p v-if="prefillLine" class="small quiet rechner__prefill">{{ prefillLine }}</p>
                    <EtCalculator :model-value="state" @update:model-value="update" />
                    <RechnerShare :param="shareParam" />
                </div>

                <div class="rechner__about">
                    <h2 class="h4">So rechnest du</h2>
                    <ol class="rechner__steps">
                        <li>Gib Breite und Einpresstiefe deiner aktuellen Felge ein – und die Stärke der Distanzscheibe je Rad, wenn du eine fährst.</li>
                        <li>Gib dann die Werte der neuen Felge ein.</li>
                        <li>Die zwei Zeilen über der Zeichnung und die Zeichnung selbst zeigen, wie weit sich die Innen- und die Außenkante der neuen Felge gegenüber deiner aktuellen verschieben.</li>
                    </ol>
                    <p class="small muted rechner__disclaimer"><ValueText :text="DISCLAIMER" /></p>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.rechner__crumbs {
    margin-bottom: var(--sp-16);
}

.rechner__crumb-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
    margin: 0;
    padding: 0;
    list-style: none;
}

.rechner__crumb-list li + li::before {
    content: '›';
    margin-right: var(--sp-8);
    color: var(--c-ink-3);
}

.rechner__crumb {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
}

@media (hover: hover) and (pointer: fine) {
    .rechner__crumb:hover {
        color: var(--c-ink);
    }
}

.rechner__lead {
    max-width: calc(60 * var(--ch-text));
    margin-top: var(--sp-12);
    hyphens: auto;
    hyphenate-limit-chars: 10 4 4;
}

.rechner__grid {
    row-gap: var(--sp-40);
    margin-top: var(--sp-40);
    align-items: start;
}

.rechner__picture,
.rechner__form,
.rechner__about {
    display: grid;
    grid-column: 1 / -1;
    gap: var(--sp-16);
    min-width: 0;
}

.rechner__answers {
    display: grid;
    gap: var(--sp-4);
}

.rechner__answer {
    margin: 0;
}

.rechner__prefill {
    margin: 0;
}

.rechner__steps {
    display: grid;
    gap: var(--sp-8);
    max-width: calc(54 * var(--ch-text));
    margin: 0;
    padding-left: var(--sp-20);
    list-style: decimal;
}

.rechner__disclaimer {
    max-width: calc(54 * var(--ch-text));
    hyphens: auto;
    hyphenate-limit-chars: 10 4 4;
}

/* ≥ 1024: the answers and the drawing in columns 1–7 over two rows; the two blocks, then the steps, in 8–12 — as his
   example sets the drawing beside the blocks, and nothing left empty beside the steps. */
@media (min-width: 1024px) {
    .rechner__picture {
        grid-column: 1 / span 7;
        grid-row: 1 / span 2;
        position: sticky;
        top: calc(var(--header-h) + var(--sp-16));
    }

    .rechner__form {
        grid-column: 8 / span 5;
        grid-row: 1;
    }

    .rechner__about {
        grid-column: 8 / span 5;
        grid-row: 2;
    }
}
</style>
