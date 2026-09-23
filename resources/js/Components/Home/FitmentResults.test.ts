import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'
import { NNBSP, withUnit } from '../../format'
import { felgenModel, type WheelSetup } from '../../lib/felgenGeometry'
import FitmentResults from './FitmentResults.vue'

const mm = (value: string) => withUnit(value, 'mm')
const pct = (value: string) => withUnit(value, '%')
const kmh = (value: string) => withUnit(value, 'km/h')

const current: WheelSetup = { widthIn: 7.5, diameterIn: 17, etMm: 45, tyreWidthMm: 225, aspect: 45 }
const next: WheelSetup = { widthIn: 8.5, diameterIn: 19, etMm: 35, tyreWidthMm: 225, aspect: 35 }

const RULE = `der häufig genannten Faustregel von ${pct('−2,5')} bis ${pct('+1,5')} (keine gesetzliche Grenze)`
const R39 = `Der Tacho darf nie weniger anzeigen als die tatsächliche Geschwindigkeit, höchstens ${pct('10')} + ${kmh('4')} mehr (UN-Regelung Nr. 39).`
const ADJUST = 'Dann kann eine Tachoangleichung nötig werden – das steht im Gutachten.'
const IMPLAUSIBLE = 'Diese Reifenbreite und diese Maulweite gehören so nicht zusammen – prüf die Angaben.'

/** Words that would make arithmetic sound like a verdict (ACCURACY.md D8, §6; brief W6). */
const VERDICT = /zulässig|passt|legal|eintragungsfrei|toleranz|ohne gewähr|freigegeben|erlaubt|\bok\b/i

let mounted: VueWrapper[] = []

function mountResults(a: WheelSetup | null, b: WheelSetup = next, withDrawing = false): VueWrapper {
    const wrapper = mount(FitmentResults, {
        props: { result: a === null ? null : felgenModel(a, b) },
        slots: withDrawing ? { drawing: () => h('div', { class: 'the-drawing' }, 'Zeichnung') } : {},
    })
    mounted.push(wrapper)

    return wrapper
}

function block(wrapper: VueWrapper, key: string) {
    return wrapper.find(`[data-result="${key}"]`)
}

function say(wrapper: VueWrapper, key: string): string {
    return block(wrapper, key).find('.calc-result__say').text()
}

/** Every text node that carries a digit but no `translate="no"` around it. */
function unprotectedFigures(root: Element): string[] {
    const out: string[] = []

    const walk = (node: Node): void => {
        if (node.nodeType === 3) {
            const text = node.textContent ?? ''

            if (/\d/.test(text) && node.parentElement?.closest('[translate="no"]') === null) {
                out.push(text)
            }

            return
        }

        node.childNodes.forEach(walk)
    }

    walk(root)

    return out
}

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
})

describe('FitmentResults', () => {
    it('answers in a plain sentence first, then the figures: position, size, speedometer', () => {
        const wrapper = mountResults(current)

        expect(wrapper.findAll('.calc-result > .label').map((l) => l.text())).toEqual(['Lage der Felge', 'Radgröße', 'Tacho'])

        expect(say(wrapper, 'lage')).toBe(
            `Die neue Felge steht rechnerisch ${mm('23')} weiter außen – näher am Kotflügel. Die Innenkante rückt rechnerisch ${mm('3')} näher ans Federbein.`
        )
        expect(block(wrapper, 'lage').find('.calc-result__sub').text()).toBe(`Felge 7,5J · ET${NNBSP}45 → 8,5J · ET${NNBSP}35`)

        expect(say(wrapper, 'groesse')).toBe(`Das Rad wird rechnerisch ${mm('6')} größer im Durchmesser (${pct('+0,91')}).`)
        expect(block(wrapper, 'groesse').find('.calc-result__sub').text()).toBe(`Außendurchmesser rechnerisch ${mm('634')} → ${mm('640')} · Abrollumfang ${pct('+0,91')}`)

        expect(say(wrapper, 'tacho')).toBe(
            `Zeigt der Tacho ${kmh('100')}, fährst du rechnerisch ${kmh('100,9')} – ${kmh('0,9')} mehr als mit der bisherigen Größe.`
        )
        expect(block(wrapper, 'tacho').find('[data-say="direction"]').text()).toBe('Bei gleicher Geschwindigkeit zeigt der Tacho also weniger an als bisher.')
        expect(block(wrapper, 'tacho').find('[data-say="r39"]').text()).toBe(R39)
        expect(block(wrapper, 'tacho').find('[data-say="tachoangleichung"]').text()).toBe(ADJUST)
    })

    it('puts the drawing under the position sentence, before the figures', () => {
        const wrapper = mountResults(current, next, true)
        const children = block(wrapper, 'lage').element.children
        const order = Array.from(children).map((c) => (c.querySelector('.the-drawing') !== null ? 'drawing' : c.className))

        expect(order.indexOf('drawing')).toBe(2)
        expect(order[1]).toContain('calc-result__say')
        expect(order[3]).toContain('calc-result__sub')
    })

    it('says weiter innen, kleiner and weniger the other way round (−), without the Tachoangleichung line', () => {
        // 8J ET 45 → 8J ET 60 and 215/45 R17: 15 mm inboard, 9 mm smaller.
        const wrapper = mountResults(
            { widthIn: 8, diameterIn: 17, etMm: 45, tyreWidthMm: 225, aspect: 45 },
            { widthIn: 8, diameterIn: 17, etMm: 60, tyreWidthMm: 215, aspect: 45 }
        )

        expect(say(wrapper, 'lage')).toBe(
            `Die neue Felge steht rechnerisch ${mm('15')} weiter innen – weiter weg vom Kotflügel. Die Innenkante rückt rechnerisch ${mm('15')} näher ans Federbein.`
        )
        expect(say(wrapper, 'groesse')).toBe(`Das Rad wird rechnerisch ${mm('9')} kleiner im Durchmesser (${pct('−1,42')}).`)
        expect(say(wrapper, 'tacho')).toBe(
            `Zeigt der Tacho ${kmh('100')}, fährst du rechnerisch ${kmh('98,6')} – ${kmh('1,4')} weniger als mit der bisherigen Größe.`
        )
        expect(block(wrapper, 'tacho').find('[data-say="direction"]').text()).toBe('Bei gleicher Geschwindigkeit zeigt der Tacho also mehr an als bisher.')
        expect(block(wrapper, 'tacho').find('[data-say="tachoangleichung"]').exists()).toBe(false)
    })

    it('says that nothing changes when nothing changes (0)', () => {
        const wrapper = mountResults(current, current)

        expect(say(wrapper, 'lage')).toBe('Die Außenkante bleibt rechnerisch, wo sie ist. Die Innenkante bleibt rechnerisch, wo sie ist.')
        expect(say(wrapper, 'groesse')).toBe(`Der Durchmesser bleibt rechnerisch gleich (${pct('±0,00')}).`)
        expect(say(wrapper, 'tacho')).toBe(`Zeigt der Tacho ${kmh('100')}, fährst du rechnerisch ${kmh('100,0')} – genauso schnell wie mit der bisherigen Größe.`)
        expect(block(wrapper, 'groesse').attributes('data-faustregel')).toBe('inside')
        expect(block(wrapper, 'tacho').find('[data-say="direction"]').text()).toBe('Rechnerisch ändert sich die Tachoanzeige nicht.')
        expect(block(wrapper, 'tacho').find('[data-say="tachoangleichung"]').exists()).toBe(false)
    })

    it('carries no verdict colour: no light, no verdict component, only the neutral scale', () => {
        const wrapper = mountResults(current)

        expect(wrapper.find('.light').exists()).toBe(false)
        expect(wrapper.find('[class*="light--"]').exists()).toBe(false)
        expect(wrapper.find('.verdict').exists()).toBe(false)
        expect(wrapper.find('[data-status]').exists()).toBe(false)
        expect(wrapper.findAll('.rule')).toHaveLength(1)
        expect(wrapper.find('.rule').attributes('aria-hidden')).toBe('true')
    })

    it('places the mark on the neutral scale where the printed percentage lies, the Faustregel as a band', () => {
        const wrapper = mountResults(current)
        const style = (selector: string) => wrapper.find(selector).attributes('style') ?? ''

        // −5 % … +5 %: the band from −2,5 (25 %) to +1,5 (65 %), zero at 50 %, +0,91 at 59,1 %.
        expect(style('.rule__band')).toContain('left: 25%')
        expect(style('.rule__band')).toContain('width: 40%')
        expect(style('.rule__zero')).toContain('left: 50%')
        expect(style('.rule__mark')).toContain('left: 59.1%')
        expect(block(wrapper, 'groesse').find('.rule__text').text()).toBe(`Die Änderung liegt innerhalb ${RULE}.`)

        // Far outside the scale the mark rests at its end.
        const small = mountResults(current, { widthIn: 6, diameterIn: 13, etMm: 45, tyreWidthMm: 155, aspect: 55 })
        expect(small.find('.rule__mark').attributes('style')).toContain('left: 0%')
    })

    it('says above or below the rule of thumb, which is no legal limit', () => {
        const above = mountResults(current, { widthIn: 7, diameterIn: 15, etMm: 45, tyreWidthMm: 195, aspect: 70 })
        expect(block(above, 'groesse').attributes('data-faustregel')).toBe('above')
        expect(block(above, 'groesse').find('.rule__text').text()).toBe(`Die Änderung liegt über ${RULE}.`)

        const below = mountResults(current, { widthIn: 7.5, diameterIn: 17, etMm: 45, tyreWidthMm: 205, aspect: 40 })
        expect(block(below, 'groesse').attributes('data-faustregel')).toBe('below')
        expect(block(below, 'groesse').find('.rule__text').text()).toBe(`Die Änderung liegt unter ${RULE}.`)
    })

    it('prints the golden −19,99 % and 80,0 km/h for 155/45 R17 → 145/35 R14, without judging it', () => {
        // 5,5J for the 145 tyre: on 6J (152,4 mm, 1,051 × 145) the pairing itself is flagged.
        const wrapper = mountResults(
            { widthIn: 6, diameterIn: 17, etMm: 45, tyreWidthMm: 155, aspect: 45 },
            { widthIn: 5.5, diameterIn: 14, etMm: 45, tyreWidthMm: 145, aspect: 35 }
        )

        expect(say(wrapper, 'groesse')).toContain(pct('−19,99'))
        expect(say(wrapper, 'tacho')).toContain(kmh('80,0'))
        expect(block(wrapper, 'groesse').attributes('data-faustregel')).toBe('below')
    })

    it('reads a dash for every answer and draws no scale while there is nothing valid to compute', () => {
        const wrapper = mountResults(null)

        expect(wrapper.findAll('.calc-result__say').map((v) => v.text())).toEqual(['–', '–', '–'])
        expect(wrapper.find('.rule').exists()).toBe(false)
        expect(wrapper.find('[data-faustregel]').exists()).toBe(false)
        // The quoted rule stays; it is not a result.
        expect(block(wrapper, 'tacho').text()).toContain(R39)
    })

    it('says in one sentence that a tyre and its rim do not belong together — and shows no drawing and no figure', () => {
        // 5,5J (139,7 mm) with a 305 tyre on the new side.
        const wrapper = mountResults(current, { widthIn: 5.5, diameterIn: 19, etMm: 35, tyreWidthMm: 305, aspect: 30 }, true)

        expect(wrapper.findAll('.calc-result')).toHaveLength(1)
        expect(block(wrapper, 'implausible').find('.label').text()).toBe('Neu')
        expect(block(wrapper, 'implausible').find('.calc-result__say').text()).toBe(IMPLAUSIBLE)
        expect(wrapper.find('.the-drawing').exists()).toBe(false)
        expect(wrapper.find('.rule').exists()).toBe(false)
        expect(wrapper.text()).not.toMatch(/\d/)

        const both = mountResults({ ...current, widthIn: 12, tyreWidthMm: 135 }, { widthIn: 5.5, diameterIn: 19, etMm: 35, tyreWidthMm: 305, aspect: 30 })
        expect(block(both, 'implausible').find('.label').text()).toBe('Aktuell und Neu')
    })

    it('keeps the translator off every figure: each value sits in translate="no"', () => {
        const cases: [WheelSetup, WheelSetup][] = [
            [current, next],
            [current, current],
            [current, { widthIn: 7, diameterIn: 15, etMm: -10, tyreWidthMm: 195, aspect: 70 }],
        ]

        for (const [a, b] of cases) {
            const wrapper = mountResults(a, b)

            expect(unprotectedFigures(wrapper.element)).toEqual([])
        }

        const values = mountResults(current)
            .findAll('[translate="no"]')
            .map((v) => v.text())
        expect(values).toEqual(expect.arrayContaining([mm('23'), pct('+0,91'), kmh('100,9'), '8,5J', `ET${NNBSP}45`, pct('−2,5'), kmh('4')]))
    })

    it('never states a verdict of its own, whatever the sizes', () => {
        const cases: [WheelSetup | null, WheelSetup][] = [
            [current, next],
            [current, { widthIn: 7, diameterIn: 15, etMm: 45, tyreWidthMm: 195, aspect: 70 }],
            [current, { widthIn: 6, diameterIn: 13, etMm: 45, tyreWidthMm: 155, aspect: 55 }],
            [current, current],
            [current, { widthIn: 5.5, diameterIn: 19, etMm: 35, tyreWidthMm: 305, aspect: 30 }],
            [null, next],
        ]

        for (const [a, b] of cases) {
            expect(mountResults(a, b).text()).not.toMatch(VERDICT)
        }
    })
})
