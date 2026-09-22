import { describe, expect, it } from 'vitest'
import { NNBSP, withUnit } from '../format'
import { felgenModel, type FelgenModel, type WheelSetup } from './felgenGeometry'
import {
    IMPLAUSIBLE,
    innerSentence,
    outerSentence,
    R39_NOTE,
    sizeFigures,
    sizeSentence,
    SPEEDO_ADJUST_NOTE,
    speedoAdjust,
    speedoDirection,
    speedSentence,
    valueParts,
} from './felgenSentences'
import { ASPECTS, DIAMETERS_IN, ET_MAX, ET_MIN, RIM_WIDTHS_IN, setupLine, TYRE_WIDTHS_MM } from './rechner'

const mm = (value: string) => withUnit(value, 'mm')
const pct = (value: string) => withUnit(value, '%')
const kmh = (value: string) => withUnit(value, 'km/h')

function setup(widthIn: number, diameterIn: number, etMm: number, tyreWidthMm: number, aspect: number): WheelSetup {
    return { widthIn, diameterIn, etMm, tyreWidthMm, aspect }
}

const current = setup(7.5, 17, 45, 225, 45)
const next = setup(8.5, 19, 35, 225, 35)

/** Words that would make arithmetic sound like a verdict (ACCURACY.md D8, §6; brief W6). */
const VERDICT = /zulässig|passt|legal|eintragungsfrei|erlaubt|toleranz|freigegeben|ohne gewähr|\bok\b/i

function all(m: FelgenModel): string[] {
    return [outerSentence(m), innerSentence(m), sizeSentence(m), sizeFigures(m), speedSentence(m), speedoDirection(m) ?? '', speedoAdjust(m) ?? '']
}

describe('the position of the new rim', () => {
    it('says how far the outer edge moves out, and the inner edge towards the strut (+)', () => {
        const m = felgenModel(current, next)

        expect(outerSentence(m)).toBe(`Die neue Felge steht rechnerisch ${mm('23')} weiter außen – näher am Kotflügel.`)
        expect(innerSentence(m)).toBe(`Die Innenkante rückt rechnerisch ${mm('3')} näher ans Federbein.`)
    })

    it('says weiter innen and weiter weg from the fender, or from the strut (−)', () => {
        // The same rim with 15 mm more ET: the whole rim 15 mm inboard.
        const inboard = felgenModel(setup(8, 18, 45, 225, 40), setup(8, 18, 60, 225, 40))
        expect(outerSentence(inboard)).toBe(`Die neue Felge steht rechnerisch ${mm('15')} weiter innen – weiter weg vom Kotflügel.`)
        expect(innerSentence(inboard)).toBe(`Die Innenkante rückt rechnerisch ${mm('15')} näher ans Federbein.`)

        // …with 15 mm less ET: 15 mm outboard, away from the strut.
        const outboard = felgenModel(setup(8, 18, 45, 225, 40), setup(8, 18, 30, 225, 40))
        expect(innerSentence(outboard)).toBe(`Die Innenkante rückt rechnerisch ${mm('15')} weiter weg vom Federbein.`)
    })

    it('says the edge stays where it is when it moves by no whole millimetre (0)', () => {
        const same = felgenModel(current, current)
        expect(outerSentence(same)).toBe('Die Außenkante bleibt rechnerisch, wo sie ist.')
        expect(innerSentence(same)).toBe('Die Innenkante bleibt rechnerisch, wo sie ist.')

        // 0,05 mm is no printed millimetre.
        const hair = felgenModel(setup(7, 17, 30, 225, 45), setup(8.5, 17, 49, 225, 45))
        expect(outerSentence(hair)).toBe('Die Außenkante bleibt rechnerisch, wo sie ist.')
        expect(innerSentence(hair)).toBe(`Die Innenkante rückt rechnerisch ${mm('38')} näher ans Federbein.`)
    })
})

describe('the size of the wheel', () => {
    it('says how much bigger (+), with the percentage in two decimals', () => {
        const m = felgenModel(current, next)

        expect(sizeSentence(m)).toBe(`Das Rad wird rechnerisch ${mm('6')} größer im Durchmesser (${pct('+0,91')}).`)
        expect(sizeFigures(m)).toBe(`Außendurchmesser rechnerisch ${mm('634')} → ${mm('640')} · Abrollumfang ${pct('+0,91')}`)
    })

    it('says how much smaller (−)', () => {
        // 215/45 R17: 625,3 mm against 634,3 mm.
        const m = felgenModel(current, setup(7.5, 17, 45, 215, 45))
        expect(sizeSentence(m)).toBe(`Das Rad wird rechnerisch ${mm('9')} kleiner im Durchmesser (${pct('−1,42')}).`)

        const golden = felgenModel(setup(6, 17, 45, 155, 45), setup(6, 14, 45, 145, 35))
        expect(sizeSentence(golden)).toBe(`Das Rad wird rechnerisch ${mm('114')} kleiner im Durchmesser (${pct('−19,99')}).`)
    })

    it('says the same size stays the same (0), and less than a millimetre as such', () => {
        expect(sizeSentence(felgenModel(current, current))).toBe(`Der Durchmesser bleibt rechnerisch gleich (${pct('±0,00')}).`)

        // 355/25 R18 is 634,7 mm: 0,4 mm more than 225/45 R17.
        const hair = felgenModel(current, setup(12, 18, 45, 355, 25))
        expect(sizeSentence(hair)).toBe(`Das Rad wird rechnerisch weniger als ${mm('1')} größer im Durchmesser (${pct('+0,06')}).`)
    })
})

describe('the speedometer', () => {
    it('says the true speed at an indicated 100 km/h and the difference to before (+)', () => {
        const m = felgenModel(current, next)

        expect(speedSentence(m)).toBe(`Zeigt der Tacho ${kmh('100')}, fährst du rechnerisch ${kmh('100,9')} – ${kmh('0,9')} mehr als mit der bisherigen Größe.`)
        expect(speedoDirection(m)).toBe('Bei gleicher Geschwindigkeit zeigt der Tacho also weniger an als bisher.')
    })

    it('says weniger for a smaller wheel (−)', () => {
        const m = felgenModel(setup(6, 17, 45, 155, 45), setup(6, 14, 45, 145, 35))

        expect(speedSentence(m)).toBe(`Zeigt der Tacho ${kmh('100')}, fährst du rechnerisch ${kmh('80,0')} – ${kmh('20,0')} weniger als mit der bisherigen Größe.`)
        expect(speedoDirection(m)).toBe('Bei gleicher Geschwindigkeit zeigt der Tacho also mehr an als bisher.')
    })

    it('says genauso schnell for the same size (0), and a difference under 0,1 km/h as such', () => {
        const same = felgenModel(current, current)
        expect(speedSentence(same)).toBe(`Zeigt der Tacho ${kmh('100')}, fährst du rechnerisch ${kmh('100,0')} – genauso schnell wie mit der bisherigen Größe.`)
        expect(speedoDirection(same)).toBe('Rechnerisch ändert sich die Tachoanzeige nicht.')

        // Find a pair on the grid whose speeds differ by less than 0,05 km/h, but not by nothing.
        let tiny: FelgenModel | null = null

        for (const d of DIAMETERS_IN) {
            for (const w of TYRE_WIDTHS_MM) {
                for (const a of ASPECTS) {
                    const m = felgenModel(current, setup(7.5, d, 45, w, a))
                    const delta = Math.abs(m.speedAt100KmH - 100)

                    if (tiny === null && delta > 0 && delta < 0.05) {
                        tiny = m
                    }
                }
            }
        }

        expect(tiny).not.toBeNull()
        expect(speedSentence(tiny as FelgenModel)).toBe(
            `Zeigt der Tacho ${kmh('100')}, fährst du rechnerisch ${kmh('100,0')} – weniger als ${kmh('0,1')} Unterschied zur bisherigen Größe.`
        )
    })

    it('adds the Tachoangleichung line only when the speedometer now reads less than before', () => {
        expect(speedoAdjust(felgenModel(current, next))).toBe(SPEEDO_ADJUST_NOTE)
        expect(SPEEDO_ADJUST_NOTE).toBe('Dann kann eine Tachoangleichung nötig werden – das steht im Gutachten.')
        expect(speedoAdjust(felgenModel(current, setup(7.5, 17, 45, 215, 45)))).toBeNull()
        expect(speedoAdjust(felgenModel(current, current))).toBeNull()

        // Over the whole grid: exactly when the printed change of circumference is positive.
        for (const d of DIAMETERS_IN) {
            for (const w of TYRE_WIDTHS_MM) {
                const m = felgenModel(current, setup(7.5, d, 45, w, 45))
                expect(speedoAdjust(m) !== null).toBe(m.shownPercent > 0)
            }
        }
    })

    it('quotes the R39 rule as it stands', () => {
        expect(R39_NOTE).toBe(`Der Tacho darf nie weniger anzeigen als die tatsächliche Geschwindigkeit, höchstens ${pct('10')} + ${kmh('4')} mehr (UN-Regelung Nr. 39).`)
    })
})

describe('no verdict', () => {
    it('never uses a verdict word, whatever the sizes', () => {
        let seed = 1

        const random = (): number => {
            seed = (seed * 16807) % 2147483647

            return seed / 2147483647
        }

        const pick = <T>(list: readonly T[]): T => list[Math.floor(random() * list.length)] as T
        const draw = (): WheelSetup =>
            setup(pick(RIM_WIDTHS_IN), pick(DIAMETERS_IN), ET_MIN + Math.floor(random() * (ET_MAX - ET_MIN + 1)), pick(TYRE_WIDTHS_MM), pick(ASPECTS))

        for (let i = 0; i < 500; i++) {
            for (const sentence of all(felgenModel(draw(), draw()))) {
                expect(sentence).not.toMatch(VERDICT)
            }
        }

        for (const fixed of [IMPLAUSIBLE, R39_NOTE, SPEEDO_ADJUST_NOTE]) {
            expect(fixed).not.toMatch(VERDICT)
        }
    })

    it('says an implausible pairing in one sentence', () => {
        expect(IMPLAUSIBLE).toBe('Diese Reifenbreite und diese Maulweite gehören so nicht zusammen – prüf die Angaben.')
    })
})

describe('valueParts: the figures a translator must leave alone', () => {
    it('finds every figure with its unit or code, and the parts join back to the sentence', () => {
        const cases: [string, string[]][] = [
            [setupLine(current), ['7,5J', '17', `ET${NNBSP}45`, '225/45 R17']],
            [`Außenkante: ${mm('23')} weiter außen`, [mm('23')]],
            [`Das Rad wird rechnerisch ${mm('6')} größer im Durchmesser (${pct('+0,91')}).`, [mm('6'), pct('+0,91')]],
            [`fährst du rechnerisch ${kmh('100,9')} – ${kmh('0,9')} mehr`, [kmh('100,9'), kmh('0,9')]],
            [`Umfang ${mm('1.993')} · ET${NNBSP}−10 · ${pct('±0,00')}`, [mm('1.993'), `ET${NNBSP}−10`, pct('±0,00')]],
            ['Teil I (Felder 15.1 und 15.2), UN-Regelung Nr. 39', ['15.1', '15.2', '39']],
            [`zwischen −30 und 70${NNBSP}mm.`, ['−30', `70${NNBSP}mm`]],
            ['Diese Reifenbreite und diese Maulweite gehören so nicht zusammen.', []],
        ]

        for (const [text, values] of cases) {
            const parts = valueParts(text)

            expect(parts.map((p) => p.text).join(''), text).toBe(text)
            expect(parts.filter((p) => p.value).map((p) => p.text), text).toEqual(values)
            // Nothing outside a figure carries a digit.
            expect(parts.filter((p) => !p.value && /\d/.test(p.text)), text).toEqual([])
        }
    })
})
