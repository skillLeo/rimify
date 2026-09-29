import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Sparkline from './Sparkline.vue'

/*
 * The sparkline's geometry: the line starts at zero, a missing day is a gap and not a dip, the last
 * known point carries the marker at its true height, and a series too short to be a curve draws
 * nothing rather than a dot pretending to be a trend.
 */

function points(d: string): number[][] {
    return [...d.matchAll(/[ML]\s*([\d.]+)[, ]\s*([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])])
}

describe('Sparkline', () => {
    it('draws nothing for fewer than two days or no value at all', () => {
        expect(mount(Sparkline, { props: { values: [5] } }).find('svg').exists()).toBe(false)
        expect(mount(Sparkline, { props: { values: [null, null] } }).find('svg').exists()).toBe(false)
    })

    it('runs from the first day to the last across the drawing, with zero on the baseline', () => {
        const d = mount(Sparkline, { props: { values: [0, 10, 5] } }).find('path').attributes('d') ?? ''
        const all = points(d)

        expect(all[0]?.[0]).toBeCloseTo(3)
        expect(all[0]?.[1]).toBeCloseTo(37) // height 40 minus the 3 px pad: zero sits on the baseline
        expect(d).toContain('197')
    })

    it('leaves a gap for a day without a value, instead of drawing it as zero', () => {
        const d = mount(Sparkline, { props: { values: [4, null, 4] } }).find('path').attributes('d') ?? ''

        // Two separate pieces: each defined run starts with its own move-to.
        expect((d.match(/M/g) ?? []).length).toBe(2)
    })

    it('puts the marker on the last known point, at its height', () => {
        const marker = mount(Sparkline, { props: { values: [0, 10, null] } }).find('.spark__marker')

        expect(marker.attributes('style')).toContain('left: 50%')
        expect(marker.attributes('style')).toContain('top: 7.5%')
    })

    it('is decoration beside its figure, hidden from a screen reader', () => {
        expect(mount(Sparkline, { props: { values: [1, 2] } }).find('.spark').attributes('aria-hidden')).toBe('true')
    })
})
