import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { withUnit } from '../../format'
import { compare, type WheelSetup } from '../../lib/fitmentMath'
import FitmentResults from './FitmentResults.vue'

const mm = (value: string) => withUnit(value, 'mm')
const pct = (value: string) => withUnit(value, '%')
const kmh = (value: string) => withUnit(value, 'km/h')

const current: WheelSetup = { widthIn: 7.5, diameterIn: 17, etMm: 45, tyreWidthMm: 225, aspect: 45 }
const next: WheelSetup = { widthIn: 8.5, diameterIn: 19, etMm: 35, tyreWidthMm: 225, aspect: 35 }

let mounted: VueWrapper[] = []

function mountResults(a: WheelSetup | null, b: WheelSetup = next): VueWrapper {
    const wrapper = mount(FitmentResults, { props: { result: a === null ? null : compare(a, b) } })
    mounted.push(wrapper)

    return wrapper
}

function block(wrapper: VueWrapper, key: string) {
    return wrapper.find(`[data-result="${key}"]`)
}

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
})

describe('FitmentResults', () => {
    it('shows the three results for the worked example, in order, with the ok light on the Abrollumfang only', () => {
        const wrapper = mountResults(current)

        expect(wrapper.findAll('.calc-result .label').map((l) => l.text())).toEqual(['Abrollumfang', 'Tachoabweichung', 'Freigängigkeit'])
        expect(wrapper.findAll('.calc-result .h3').map((v) => v.text())).toEqual([pct('+0,9'), kmh('100,9'), `außen ${mm('+22,7')}`])

        const abroll = block(wrapper, 'abrollumfang')
        expect(abroll.find('.calc-result__sub').text()).toBe(`${mm('1.950,6')} statt ${mm('1.932,9')}`)
        expect(abroll.attributes('data-status')).toBe('ok')
        expect(abroll.find('.light').classes()).toContain('light--ok')
        expect(abroll.find('.light').text()).toBe(`Innerhalb der üblichen Toleranz von ${pct('−2,5')} bis ${pct('+1,5')}.`)

        const tacho = block(wrapper, 'tacho')
        expect(tacho.findAll('.calc-result__sub').map((s) => s.text())).toEqual([
            `tatsächlich, wenn der Tacho ${kmh('100')} anzeigt`,
            `Der Tacho zeigt ${pct('0,9')} weniger an, als du fährst.`,
        ])
        expect(tacho.find('.light').exists()).toBe(false)

        const clearance = block(wrapper, 'freigaengigkeit')
        expect(clearance.find('.calc-result__second').text()).toBe(`innen ${mm('+2,7')}`)
        expect(clearance.find('.calc-result__sub').text()).toBe(
            `Die Felge steht ${mm('22,7')} weiter außen und rückt ${mm('2,7')} näher ans Federbein. Ob Reifen und Felge frei laufen, hängt von Radhaus und Fahrwerk ab – das Gutachten nennt die Bedingungen.`
        )
        expect(clearance.find('.light').exists()).toBe(false)

        expect(wrapper.findAll('.light')).toHaveLength(1)
        expect(wrapper.find('.verdict').exists()).toBe(false)
    })

    it('lights amber for a larger tyre (7 J × 15 · 195/70, +3,1 %) and says the speedometer would then read less', () => {
        const wrapper = mountResults(current, { widthIn: 7, diameterIn: 15, etMm: 45, tyreWidthMm: 195, aspect: 70 })
        const abroll = block(wrapper, 'abrollumfang')

        expect(abroll.find('.h3').text()).toBe(pct('+3,1'))
        expect(abroll.attributes('data-status')).toBe('warn')
        expect(abroll.find('.light').classes()).toContain('light--warn')
        expect(abroll.find('.light').text()).toBe(
            `Größer als die übliche Toleranz (${pct('−2,5')} bis ${pct('+1,5')}). Der Tacho zeigt dann weniger an als bisher – zu wenig darf er nie anzeigen. Ob das noch erlaubt ist, steht in der Freigabe.`
        )
        expect(block(wrapper, 'tacho').text()).toContain('weniger an, als du fährst')
    })

    it('lights amber for a somewhat smaller tyre and says the speedometer would then read more', () => {
        const wrapper = mountResults(current, { widthIn: 7.5, diameterIn: 17, etMm: 45, tyreWidthMm: 205, aspect: 40 })
        const abroll = block(wrapper, 'abrollumfang')

        expect(abroll.attributes('data-status')).toBe('warn')
        expect(abroll.find('.light').text()).toBe(
            `Kleiner als die übliche Toleranz (${pct('−2,5')} bis ${pct('+1,5')}). Der Tacho zeigt dann mehr an als bisher – ob das erlaubt ist, steht in der Freigabe.`
        )
        expect(block(wrapper, 'tacho').text()).toContain('mehr an, als du fährst')
    })

    it('lights red for 6 J × 13 · 155/55: the speedometer would exceed 10 % + 4 km/h', () => {
        const wrapper = mountResults(current, { widthIn: 6, diameterIn: 13, etMm: 45, tyreWidthMm: 155, aspect: 55 })
        const abroll = block(wrapper, 'abrollumfang')

        expect(abroll.attributes('data-status')).toBe('bad')
        expect(abroll.find('.light').classes()).toContain('light--bad')
        expect(abroll.find('.light').text()).toBe(
            `So viel kleiner darf der Abrollumfang nicht sein: Der Tacho würde mehr als ${pct('10')} + ${kmh('4')} zu viel anzeigen.`
        )
    })

    it('reads ±0,0 %, 100,0 km/h, ±0,0 mm and no deviation when nothing changes', () => {
        const wrapper = mountResults(current, current)

        expect(wrapper.findAll('.calc-result .h3').map((v) => v.text())).toEqual([pct('±0,0'), kmh('100,0'), `außen ${mm('±0,0')}`])
        expect(block(wrapper, 'abrollumfang').attributes('data-status')).toBe('ok')
        expect(block(wrapper, 'tacho').text()).toContain('Keine Abweichung gegenüber heute.')
        expect(block(wrapper, 'freigaengigkeit').find('.calc-result__second').text()).toBe(`innen ${mm('±0,0')}`)
        expect(block(wrapper, 'freigaengigkeit').text()).toContain('steht außen unverändert und bleibt innen unverändert')
    })

    it('says the wheel moves away from the strut when the inner value is negative', () => {
        const wrapper = mountResults(current, { ...current, etMm: 30 })

        expect(block(wrapper, 'freigaengigkeit').text()).toContain(`steht ${mm('15,0')} weiter außen und rückt ${mm('15,0')} vom Federbein weg`)
    })

    it('reads a dash for every value and shows no light while there is nothing valid to compute', () => {
        const wrapper = mountResults(null)

        expect(wrapper.findAll('.calc-result .h3').map((v) => v.text())).toEqual(['–', '–', '–'])
        expect(wrapper.find('.calc-result__second').text()).toBe('–')
        expect(wrapper.find('.light').exists()).toBe(false)
        expect(wrapper.find('[data-status]').exists()).toBe(false)
    })

    it('never states a verdict of its own', () => {
        const text = mountResults(current).text().toLowerCase()

        expect(text).not.toContain('zulässig')
        expect(text).not.toContain('freigegeben')
        expect(text).not.toContain('passt')
    })
})
