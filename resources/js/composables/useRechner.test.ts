import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { NNBSP, withUnit } from '../format'
import type { CalculatorPrefill } from '../lib/rechner'
import type { VehicleProp } from '../types/rimify'
import { nextStep, prefillSentence, useRechner, type Rechner, type UseRechnerOptions } from './useRechner'

const mm = (value: string) => withUnit(value, 'mm')

const vehicle: VehicleProp = {
    id: 14,
    make: 'BMW',
    model: '3er',
    variant: '330i',
    label: 'BMW 330i Limousine',
    short: 'BMW 330i',
    hsn: '0005',
    tsn: 'CKT',
    keyNumbers: 'HSN 0005 · TSN CKT',
    buildWindow: 'ab 03/2019',
}

const PREFILL: CalculatorPrefill = { widthIn: 8, diameterIn: 18, etMm: 40, tyreWidth: 235, aspect: 40 }

/** Runs the composable inside a component, as the pages do, and hands it back. */
function host(options: Partial<UseRechnerOptions> = {}): Rechner {
    let rechner: Rechner | undefined

    mount(
        defineComponent({
            setup() {
                rechner = useRechner({ prefill: () => null, vehicle: () => null, ...options })

                return () => h('div')
            },
        })
    )

    if (rechner === undefined) {
        throw new Error('useRechner did not run')
    }

    return rechner
}

beforeEach(() => {
    window.history.replaceState(null, '', '/felgenrechner')
})

afterEach(() => {
    document.body.innerHTML = ''
})

describe('useRechner', () => {
    it('says what the prefill is — the smallest size a Gutachten names, not the Serienbereifung (C3)', () => {
        const r = host({ prefill: () => PREFILL, vehicle: () => vehicle })

        expect(r.fromVehicle.value).toBe(true)
        expect(r.prefillLine.value).toBe(
            'Aktuell ist vorbelegt mit der kleinsten Größe, die ein Gutachten für deinen BMW 330i nennt – nicht unbedingt mit deiner heutigen Bereifung.'
        )
        expect(r.prefillLine.value).toBe(prefillSentence('BMW 330i'))
        expect(r.prefillLine.value).not.toContain('Serienbereifung')
        // The legacy value the homepage teaser wraps in "Serienbereifung" is never set.
        expect(r.prefillNote.value).toBeNull()
        expect(r.state.current).toEqual({ widthIn: 8, diameterIn: 18, etMm: 40, tyreWidthMm: 235, aspect: 40 })
        expect(r.state.next).toEqual(nextStep(r.state.current))
    })

    it('withdraws the prefill line on the first edit, and never prints one without both a vehicle and a prefill', () => {
        const r = host({ prefill: () => PREFILL, vehicle: () => vehicle })

        r.update({ current: { ...r.state.current }, next: { ...r.state.next, diameterIn: 20 } })
        expect(r.prefillLine.value).toBeNull()

        expect(host({ prefill: () => PREFILL }).prefillLine.value).toBeNull()
        expect(host({ vehicle: () => vehicle }).prefillLine.value).toBeNull()
        // A size the form does not offer is ignored, and so is the line.
        expect(host({ prefill: () => ({ ...PREFILL, widthIn: 7.25 }), vehicle: () => vehicle }).prefillLine.value).toBeNull()
    })

    it('re-applies a prefill that arrives later, with its line', async () => {
        const prefill = ref<CalculatorPrefill | null>(null)
        const r = host({ prefill: () => prefill.value, vehicle: () => vehicle })

        expect(r.prefillLine.value).toBeNull()
        prefill.value = PREFILL
        await nextTick()

        expect(r.state.current.diameterIn).toBe(18)
        expect(r.prefillLine.value).toBe(prefillSentence('BMW 330i'))
    })

    it('lets a shared comparison outrank the prefill, and then says nothing about a prefill', () => {
        const state = {
            current: { widthIn: 7.5, diameterIn: 17, etMm: 45, tyreWidthMm: 225, aspect: 45 },
            next: { widthIn: 8.5, diameterIn: 19, etMm: 35, tyreWidthMm: 225, aspect: 35 },
        }
        const r = host({ prefill: () => PREFILL, vehicle: () => vehicle, state })

        expect(r.state.current.diameterIn).toBe(17)
        expect(r.prefillLine.value).toBeNull()
        expect(r.shareParam.value).toBe('7.5x17-45-225-45_8.5x19-35-225-35')
    })

    it('prints the full figures in whole millimetres, marked rechnerisch, with the direction in words', () => {
        const r = host()
        const specs = Object.fromEntries(r.specs.value.map((row) => [row.key, `${row.label} | ${row.value}`]))

        expect(specs.rim).toBe('Felge | 7,5J × 17 → 8,5J × 19')
        expect(specs.et).toBe(`Einpresstiefe | ET${NNBSP}45 → ET${NNBSP}35`)
        expect(specs.diameter).toBe(`Außendurchmesser, rechnerisch | ${mm('634')} → ${mm('640')}`)
        expect(specs.circumference).toBe(`Umfang (π × Ø), rechnerisch | ${mm('1.993')} → ${mm('2.011')}`)
        expect(specs.abroll).toBe(`Abrollumfang, Änderung | ${withUnit('+0,91', '%')}`)
        expect(specs.outer).toBe(`Außenkante, rechnerisch | ${mm('23')} weiter außen`)
        expect(specs.inner).toBe(`Innenkante, rechnerisch | ${mm('3')} näher am Federbein`)

        expect(r.summaries.value.current).toBe(`7,5J × 17 · ET${NNBSP}45 · 225/45 R17 · Ø${NNBSP}rechnerisch ${mm('634')}`)
        expect(r.summaries.value.next).toBe(`8,5J × 19 · ET${NNBSP}35 · 225/35 R19 · Ø${NNBSP}rechnerisch ${mm('640')}`)

        const all = r.specs.value.map((row) => `${row.label} ${row.value}`).join(' ').toLowerCase()
        for (const word of ['zulässig', 'passt', 'legal', 'eintragungsfrei', 'toleranz', 'wirksam']) {
            expect(all, word).not.toContain(word)
        }
    })

    it('prints no computed figure for a tyre and a rim that do not belong together', () => {
        const r = host({
            state: {
                current: { widthIn: 7.5, diameterIn: 17, etMm: 45, tyreWidthMm: 225, aspect: 45 },
                next: { widthIn: 5.5, diameterIn: 19, etMm: 35, tyreWidthMm: 305, aspect: 30 },
            },
        })

        expect(r.implausible.value).toBe(true)
        expect(r.specs.value).toEqual([])
        // The customer's own figures stay; the computed diameter goes.
        expect(r.summaries.value.current).toBe(`7,5J × 17 · ET${NNBSP}45 · 225/45 R17`)
        expect(r.summaries.value.next).toBe(`5,5J × 19 · ET${NNBSP}35 · 305/30 R19`)
        // The share link still carries the comparison, so the customer can correct it.
        expect(r.shareParam.value).toBe('7.5x17-45-225-45_5.5x19-35-305-30')

        r.update({ current: { ...r.state.current }, next: { ...r.state.next, widthIn: 10.5 } })
        expect(r.implausible.value).toBe(false)
        expect(r.specs.value.length).toBeGreaterThan(0)
    })

    it('shows no model while the form is invalid, and the drawing keeps the last valid one', () => {
        const r = host()

        r.setValid(false)
        expect(r.shown.value).toBeNull()
        expect(r.result.value.outer.shownMm).toBe(23)

        r.setValid(true)
        expect(r.shown.value?.shownPercent).toBe(0.91)
    })

    it('steps up one inch, ten points of profile and half an inch of width, on the offered grid', () => {
        expect(nextStep({ widthIn: 8, diameterIn: 18, etMm: 40, tyreWidthMm: 235, aspect: 40 })).toEqual({
            widthIn: 8.5,
            diameterIn: 19,
            etMm: 40,
            tyreWidthMm: 235,
            aspect: 30,
        })
        expect(nextStep({ widthIn: 12, diameterIn: 24, etMm: 40, tyreWidthMm: 235, aspect: 25 })).toEqual({
            widthIn: 12,
            diameterIn: 24,
            etMm: 40,
            tyreWidthMm: 235,
            aspect: 25,
        })
    })

    it('keeps the width where half an inch more would no longer suit the tyre, so a prefill never opens flagged', () => {
        // 9J on a 225 tyre is 1,016 × its width; 9,5J would be 1,072.
        expect(nextStep({ widthIn: 9, diameterIn: 18, etMm: 40, tyreWidthMm: 225, aspect: 40 }).widthIn).toBe(9)

        const r = host({ prefill: () => ({ widthIn: 9, diameterIn: 18, etMm: 40, tyreWidth: 225, aspect: 40 }), vehicle: () => vehicle })
        expect(r.implausible.value).toBe(false)
    })
})
