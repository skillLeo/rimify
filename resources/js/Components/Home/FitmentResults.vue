<script setup lang="ts">
/**
 * The results of the Felgenrechner (ACCURACY.md §6, brief W6): three blocks separated by hairlines —
 * never boxes — *Lage der Felge*, *Radgröße*, *Tacho*. Each says its answer first, in one plain
 * German sentence, large; the figures follow, smaller. Every figure comes from the `FelgenModel` of
 * `lib/felgenGeometry`, every sentence from `lib/felgenSentences`, and the drawing (the `drawing`
 * slot) sits under the position sentence it illustrates.
 *
 * It is arithmetic and says so: millimetres are whole and *rechnerisch*, percentages have two
 * decimals. Nothing here is a verdict. There is no green, amber or red anywhere (C5): the rolling
 * circumference carries a neutral scale against the *häufig genannte Faustregel*, which the copy
 * calls what it is — no legal limit. The speedometer rule is quoted, not applied. What applies to a
 * car stays with its papers and the wheel's Gutachten or ABE. Every figure is kept away from the
 * browser's translator (`ValueText`).
 *
 * With `result` null (the form holds an impossible ET) every answer reads a dash and no scale is
 * drawn: a number nobody computed is never shown. When a tyre and its rim do not belong together
 * the whole comparison is one sentence and nothing else — no drawing, no figure.
 */

import { computed } from 'vue'
import ValueText from '../Ui/ValueText.vue'
import { withUnit } from '../../format'
import { FAUSTREGEL_MAX_PERCENT, FAUSTREGEL_MIN_PERCENT, signedText, type FaustregelPosition, type FelgenModel } from '../../lib/felgenGeometry'
import {
    IMPLAUSIBLE,
    innerSentence,
    outerSentence,
    R39_NOTE,
    sizeFigures,
    sizeSentence,
    speedoAdjust,
    speedoDirection,
    speedSentence,
} from '../../lib/felgenSentences'
import { etLabel, jLabel, SIDES } from '../../lib/rechner'

const props = defineProps<{ result: FelgenModel | null }>()

defineSlots<{ drawing?: () => unknown }>()

const DASH = '–'

/* The rule of thumb as it is usually written, with one decimal: −2,5 % bis +1,5 %. */
const RULE = `der häufig genannten Faustregel von ${withUnit(signedText(FAUSTREGEL_MIN_PERCENT, 1), '%')} bis ${withUnit(signedText(FAUSTREGEL_MAX_PERCENT, 1), '%')} (keine gesetzliche Grenze)`

const RULE_SENTENCE: Record<FaustregelPosition, string> = {
    inside: `Die Änderung liegt innerhalb ${RULE}.`,
    above: `Die Änderung liegt über ${RULE}.`,
    below: `Die Änderung liegt unter ${RULE}.`,
}

const EDGE_NOTE =
    'Rechnerisch aus Felgenbreite und Einpresstiefe, auf ganze Millimeter gerundet. Ob Rad und Reifen frei laufen, hängt von Radhaus, Fahrwerk und Bremse ab – die Bedingungen nennt das Gutachten der Felge.'

/* The neutral scale: −5 % … +5 %, the Faustregel as a band, the value as a mark (clamped at the ends). */
const SCALE_MIN = -5
const SCALE_MAX = 5

function onScale(percent: number): number {
    const f = (Math.min(Math.max(percent, SCALE_MIN), SCALE_MAX) - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)

    return Math.round(f * 1000) / 10
}

const BAND = { left: `${onScale(FAUSTREGEL_MIN_PERCENT)}%`, width: `${onScale(FAUSTREGEL_MAX_PERCENT) - onScale(FAUSTREGEL_MIN_PERCENT)}%` }
const ZERO = { left: `${onScale(0)}%` }

/** The sides whose tyre and rim do not belong together, named as the form names them. */
const implausible = computed(() => {
    const sides = props.result?.implausible ?? []

    return sides.length === 0 ? null : SIDES.filter((s) => sides.includes(s.key)).map((s) => s.label).join(' und ')
})

const lage = computed(() => {
    const r = props.result

    if (r === null) {
        return { say: [DASH], figures: null, note: null }
    }

    const { current, next } = r.input

    return {
        say: [outerSentence(r), innerSentence(r)],
        figures: `Felge ${jLabel(current.widthIn)} · ${etLabel(current.etMm)} → ${jLabel(next.widthIn)} · ${etLabel(next.etMm)}`,
        note: EDGE_NOTE,
    }
})

const size = computed(() => {
    const r = props.result

    if (r === null || r.faustregel === null) {
        return { say: DASH, figures: null, rule: null, position: null, mark: null }
    }

    return {
        say: sizeSentence(r),
        figures: sizeFigures(r),
        rule: RULE_SENTENCE[r.faustregel],
        position: r.faustregel,
        mark: { left: `${onScale(r.shownPercent)}%` },
    }
})

const tacho = computed(() => {
    const r = props.result

    if (r === null) {
        return { say: DASH, direction: null, adjust: null }
    }

    return { say: speedSentence(r), direction: speedoDirection(r), adjust: speedoAdjust(r) }
})
</script>

<template>
    <div class="calc-results">
        <div v-if="implausible" class="calc-result" data-result="implausible">
            <p class="label">{{ implausible }}</p>
            <p class="calc-result__say">{{ IMPLAUSIBLE }}</p>
        </div>

        <template v-else>
            <div class="calc-result" data-result="lage">
                <p class="label">Lage der Felge</p>
                <p class="calc-result__say">
                    <template v-for="(sentence, i) in lage.say" :key="i">{{ i > 0 ? ' ' : '' }}<ValueText :text="sentence" /></template>
                </p>
                <div v-if="$slots.drawing" class="calc-result__drawing"><slot name="drawing" /></div>
                <p v-if="lage.figures" class="small muted calc-result__sub"><ValueText :text="lage.figures" /></p>
                <p v-if="lage.note" class="small quiet calc-result__sub calc-result__sub--prose">{{ lage.note }}</p>
            </div>

            <div class="calc-result" data-result="groesse" :data-faustregel="size.position ?? undefined">
                <p class="label">Radgröße</p>
                <p class="calc-result__say"><ValueText :text="size.say" /></p>
                <p v-if="size.figures" class="small muted calc-result__sub"><ValueText :text="size.figures" /></p>
                <template v-if="size.rule && size.mark">
                    <div class="rule" aria-hidden="true">
                        <span class="rule__axis" />
                        <span class="rule__band" :style="BAND" />
                        <span class="rule__zero" :style="ZERO" />
                        <span class="rule__mark" :style="size.mark" />
                    </div>
                    <p class="small muted calc-result__sub calc-result__sub--prose rule__text"><ValueText :text="size.rule" /></p>
                </template>
            </div>

            <div class="calc-result" data-result="tacho">
                <p class="label">Tacho</p>
                <p class="calc-result__say"><ValueText :text="tacho.say" /></p>
                <p v-if="tacho.direction" class="small muted calc-result__sub" data-say="direction">{{ tacho.direction }}</p>
                <p class="small quiet calc-result__sub calc-result__sub--prose" data-say="r39"><ValueText :text="R39_NOTE" /></p>
                <p v-if="tacho.adjust" class="small muted calc-result__sub calc-result__sub--prose" data-say="tachoangleichung">{{ tacho.adjust }}</p>
            </div>
        </template>
    </div>
</template>

<style scoped>
/* The answer: a whole sentence, large, in ink — the figures under it are smaller and quieter. */
.calc-result__say {
    max-width: 40ch;
    margin: 0;
    color: var(--c-ink);
    font-size: var(--fs-body-l);
    line-height: var(--lh-body-l);
    font-weight: 500;
    text-wrap: pretty;
}

.calc-result__drawing {
    margin-block: var(--sp-12) var(--sp-4);
    min-width: 0;
}

.calc-result__sub--prose {
    max-width: 54ch;
    hyphens: auto;
}

/* The neutral scale: a hairline axis, the Faustregel as a band, zero as a tick, the value as a mark.
   Ink and line colours only — no verdict colour in the calculator (C5). */
.rule {
    position: relative;
    height: var(--sp-16);
    max-width: 240px;
    margin-top: var(--sp-4);
}

.rule__axis,
.rule__band,
.rule__zero,
.rule__mark {
    position: absolute;
}

.rule__axis {
    top: 50%;
    right: 0;
    left: 0;
    border-top: 1px solid var(--c-line-2);
}

.rule__band {
    top: calc(50% - 2px);
    height: 4px;
    background-color: var(--c-line-2);
}

.rule__zero {
    top: 25%;
    height: 50%;
    border-left: 1px solid var(--c-ink-3);
}

.rule__mark {
    top: 0;
    width: 2px;
    height: 100%;
    margin-left: -1px;
    background-color: var(--c-ink);
}
</style>
