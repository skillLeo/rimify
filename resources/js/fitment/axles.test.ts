import { describe, expect, it } from 'vitest'
import { sizesByAxle } from './axles'

/* The admin audit's F-06: where the rear differs, both axles are named — never the rear alone. */
describe('sizesByAxle', () => {
    it('names both axles where the rear takes other sizes', () => {
        expect(sizesByAxle(['225/40 R18'], ['225/40 R18', '255/35 R18'])).toBe('vorn 225/40 R18 · hinten 225/40 R18, 255/35 R18')
    })

    it('says one list where both axles take the same, or the rear names none', () => {
        expect(sizesByAxle(['225/40 R18', '235/35 R18'], ['225/40 R18', '235/35 R18'])).toBe('225/40 R18, 235/35 R18')
        expect(sizesByAxle(['225/40 R18'], [])).toBe('225/40 R18')
    })
})
