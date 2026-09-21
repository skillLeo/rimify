<script setup lang="ts">
/**
 * The three results of the Felgenrechner, in the three terms a car owner argues about:
 * Abrollumfang (with the one tolerance light), Tachoabweichung, Freigängigkeit. Three blocks
 * separated by hairlines — never boxes — on the homepage teaser and on /felgenrechner alike.
 *
 * The light is the only green, amber or red on the page (DIRECTION §2). It is a status, never
 * the verdict component and never its words: the dot carries the colour, the sentence carries
 * the meaning, and the sentence always ends at the Gutachten. Nothing here says zulässig,
 * freigegeben or passt of its own accord — the copy is the specification's.
 *
 * With `result` null (the form holds an impossible ET) the three values read a dash and there
 * is no light: a number nobody computed is never shown.
 */

import { computed } from 'vue'
import { decimal, withUnit } from '../../format'
import { signedDecimal, type Comparison } from '../../lib/fitmentMath'

const props = defineProps<{ result: Comparison | null }>()

const DASH = '–'

const pct = (text: string): string => withUnit(text, '%')
const RANGE = `${pct('−2,5')} bis ${pct('+1,5')}`

const LIGHT: Record<'ok' | 'smaller' | 'larger' | 'bad', string> = {
    ok: `Innerhalb der üblichen Toleranz von ${RANGE}.`,
    smaller: `Kleiner als die übliche Toleranz (${RANGE}). Der Tacho zeigt dann mehr an als bisher – ob das passt, steht in der Freigabe.`,
    larger: `Größer als die übliche Toleranz (${RANGE}). Der Tacho zeigt dann weniger an als bisher – zu wenig darf er nie anzeigen. Ob das noch passt, steht in der Freigabe.`,
    bad: `So viel kleiner darf der Abrollumfang nicht sein: Der Tacho würde mehr als ${pct('10')} + ${withUnit(4, 'km/h')} zu viel anzeigen.`,
}

function mm(value: number): string {
    return Number.isFinite(value) ? withUnit(decimal(value, 1), 'mm') : DASH
}

function signedMm(value: number): string {
    return withUnit(signedDecimal(value, 1), 'mm')
}

/** Rounded to the shown precision first, so a value that prints as 0,0 is treated as unchanged. */
function tenth(value: number): number {
    return Math.round(value * 10) / 10
}

const abroll = computed(() => {
    const r = props.result

    if (r === null || !Number.isFinite(r.abrollDeltaPercent)) {
        return { value: DASH, sub: null, status: null, light: null }
    }

    const status = r.tolerance
    const light =
        status === 'ok' ? LIGHT.ok : status === 'bad' ? LIGHT.bad : r.abrollDeltaPercent < 0 ? LIGHT.smaller : LIGHT.larger

    return {
        value: pct(signedDecimal(r.abrollDeltaPercent, 1)),
        sub: `${mm(r.next.abrollumfangMm)} statt ${mm(r.current.abrollumfangMm)}`,
        status,
        light,
    }
})

const tacho = computed(() => {
    const r = props.result

    if (r === null || !Number.isFinite(r.speedoAt100KmH)) {
        return { value: DASH, note: null }
    }

    const real = r.speedoAt100KmH
    /* How far the needle is from the truth, measured against the speed actually driven. */
    const off = tenth((Math.abs(100 - real) / real) * 100)
    const note =
        off === 0
            ? 'Keine Abweichung gegenüber heute.'
            : `Der Tacho zeigt ${pct(decimal(off, 1))} ${real > 100 ? 'weniger' : 'mehr'} an, als du fährst.`

    return { value: withUnit(decimal(real, 1), 'km/h'), note }
})

const clearance = computed(() => {
    const r = props.result

    if (r === null) {
        return { outer: DASH, inner: DASH, sub: null }
    }

    const outer = tenth(r.outerEdgeMm)
    const inner = tenth(r.innerEdgeMm)
    const abs = (v: number) => mm(Math.abs(v))
    const outerPart = outer > 0 ? `steht ${abs(outer)} weiter außen` : outer < 0 ? `steht ${abs(outer)} weiter innen` : 'steht außen unverändert'
    const innerPart =
        inner > 0 ? `rückt ${abs(inner)} näher ans Federbein` : inner < 0 ? `rückt ${abs(inner)} vom Federbein weg` : 'bleibt innen unverändert'

    return {
        outer: `außen ${signedMm(r.outerEdgeMm)}`,
        inner: `innen ${signedMm(r.innerEdgeMm)}`,
        sub: `Die Felge ${outerPart} und ${innerPart}. Ob Reifen und Felge frei laufen, hängt von Radhaus und Fahrwerk ab – das Gutachten nennt die Bedingungen.`,
    }
})
</script>

<template>
    <div class="calc-results">
        <div class="calc-result" data-result="abrollumfang" :data-status="abroll.status ?? undefined">
            <p class="label">Abrollumfang</p>
            <p class="h3 num calc-result__value">{{ abroll.value }}</p>
            <p v-if="abroll.sub" class="small muted num calc-result__sub">{{ abroll.sub }}</p>
            <p v-if="abroll.light" class="light" :class="`light--${abroll.status}`">{{ abroll.light }}</p>
        </div>

        <div class="calc-result" data-result="tacho">
            <p class="label">Tachoabweichung</p>
            <p class="h3 num calc-result__value">{{ tacho.value }}</p>
            <p class="small muted num calc-result__sub">tatsächlich, wenn der Tacho {{ withUnit(100, 'km/h') }} anzeigt</p>
            <p v-if="tacho.note" class="small muted num calc-result__sub">{{ tacho.note }}</p>
        </div>

        <div class="calc-result" data-result="freigaengigkeit">
            <p class="label">Freigängigkeit</p>
            <p class="h3 num calc-result__value">{{ clearance.outer }}</p>
            <p class="body num calc-result__second">{{ clearance.inner }}</p>
            <p v-if="clearance.sub" class="small muted calc-result__sub calc-result__sub--prose">{{ clearance.sub }}</p>
        </div>
    </div>
</template>

<style scoped>
.calc-result__second {
    font-weight: 500;
}

.calc-result__sub--prose {
    max-width: 54ch;
    hyphens: auto;
}
</style>
