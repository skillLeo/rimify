<script setup lang="ts">
/**
 * /felgenrechner as an app screen, rebuilt close to the client's example on a phone (his #11; the operator's brief of
 * 29.10.2026, Batch 2): the large title in the bar — the page's h1 — then, as there, the drawing first with the two
 * answers under it, then the two blocks one under the other, the share block, the steps and the line about the papers.
 *
 * Same props and the same state as the desktop document (useEtRechner); the split is presentation only.
 */

import { Head } from '@inertiajs/vue3'
import { computed, h, type Component, type VNode } from 'vue'
import MobileLayout from '../../Layouts/MobileLayout.vue'
import EtCalculator from '../../Components/Rechner/EtCalculator.vue'
import OffsetDrawing from '../../Components/Rechner/OffsetDrawing.vue'
import RechnerShare from '../../Components/Home/RechnerShare.vue'
import ValueText from '../../Components/Ui/ValueText.vue'
import { useEtRechner } from '../../composables/useEtRechner'
import { useShared } from '../../composables/useShared'
import { DISCLAIMER } from '../../lib/rechner'
import type { FelgenrechnerProps } from '../../types/pages'

/* Inertia hands the rendered page as a VNode at runtime; its type names it a Component. */
defineOptions({
    layout: (_: unknown, page: Component): VNode =>
        h(MobileLayout, { title: 'Felgenrechner', large: true, back: '/' }, () => page as unknown as VNode),
})

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

    <div class="container rechner">
        <p class="body muted rechner__lead">{{ LEAD }}</p>

        <!-- The answer in words first, heard on every change; the drawing under it shows it. -->
        <div class="rechner__picture">
            <div class="rechner__answers" aria-live="polite">
                <p class="h4 num rechner__answer"><ValueText :text="sentences.inner" /></p>
                <p class="h4 num rechner__answer"><ValueText :text="sentences.outer" /></p>
            </div>
            <OffsetDrawing :state="state" />
        </div>

        <div class="rechner__form">
            <p v-if="prefillLine" class="small quiet rechner__prefill">{{ prefillLine }}</p>
            <EtCalculator :model-value="state" @update:model-value="update" />
        </div>

        <RechnerShare :param="shareParam" block />

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
</template>

<style scoped>
.rechner {
    display: grid;
    gap: var(--sp-32);
    padding-block: var(--sp-16) var(--sp-48);
}

.rechner__lead,
.rechner__disclaimer {
    max-width: calc(54 * var(--ch-text));
    hyphens: auto;
    hyphenate-limit-chars: 10 4 4;
}

.rechner__picture,
.rechner__form,
.rechner__about {
    display: grid;
    gap: var(--sp-12);
    min-width: 0;
}

.rechner__answers {
    display: grid;
    gap: var(--sp-4);
}

.rechner__answer,
.rechner__prefill {
    margin: 0;
}

.rechner__steps {
    display: grid;
    gap: var(--sp-8);
    margin: 0;
    padding-left: var(--sp-20);
    list-style: decimal;
}
</style>
