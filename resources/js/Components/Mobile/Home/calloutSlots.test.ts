import { describe, expect, it } from 'vitest'
import { NNBSP } from '../../../format'
import { assignSlots, DEFAULT_TARGETS, DESKTOP_FRAME, mapTarget, PHONE_FRAME, phoneTargets, SHORT_LABEL, slotFor } from './calloutSlots'

describe('calloutSlots', () => {
    it('knows a slot by what its label says, in either spelling the server has used', () => {
        expect(slotFor('Felgengröße')).toBe('widthDiameter')
        expect(slotFor('Breite × Durchmesser')).toBe('widthDiameter')
        expect(slotFor('Einpresstiefe')).toBe('offset')
        expect(slotFor('ET')).toBe('offset')
        expect(slotFor('Lochkreis')).toBe('boltCircle')
        expect(slotFor('LK')).toBe('boltCircle')
        expect(slotFor('Mittenlochbohrung')).toBe('centreBore')
        expect(slotFor('MLB')).toBe('centreBore')
        expect(slotFor('Farbe')).toBeNull()
    })

    it('puts every shipped value on its slot by label, whatever the order shipped', () => {
        const out = assignSlots([
            { label: 'Lochkreis', value: '5/112' },
            { label: 'Breite × Durchmesser', value: `8${NNBSP}J × 18` },
            { label: 'Mittenlochbohrung', value: `66,6${NNBSP}mm` },
            { label: 'Einpresstiefe', value: 'ET 35' },
        ])

        expect(out.map((s) => s.key)).toEqual(['boltCircle', 'widthDiameter', 'centreBore', 'offset'])
        expect(out[1]?.value).toBe(`8${NNBSP}J × 18`)
    })

    it('gives a label no pattern knows the next free slot, and drops a fifth value', () => {
        const out = assignSlots([
            { label: 'Einpresstiefe', value: 'ET 35' },
            { label: 'Eins', value: '1' },
            { label: 'Zwei', value: '2' },
            { label: 'Drei', value: '3' },
            { label: 'Vier', value: '4' },
        ])

        expect(out.map((s) => `${s.key}:${s.value}`)).toEqual(['offset:ET 35', 'widthDiameter:1', 'boltCircle:2', 'centreBore:3'])
    })

    it('shortens the two values under the frame to LK and MLB', () => {
        expect(SHORT_LABEL.boltCircle).toBe('LK')
        expect(SHORT_LABEL.centreBore).toBe('MLB')
    })

    it('maps a target through the wheel box: identity within one frame, the phone frame from the desktop one', () => {
        expect(mapTarget({ tx: 35, ty: 11 }, DESKTOP_FRAME, DESKTOP_FRAME)).toEqual({ tx: 35, ty: 11 })

        // The rim lip at ten o'clock and the hub face, as calibrated in hero-wheel.json.
        expect(mapTarget({ tx: 35, ty: 11 }, DESKTOP_FRAME, PHONE_FRAME)).toEqual({ tx: 34, ty: 12 })
        expect(mapTarget({ tx: 59, ty: 41 }, DESKTOP_FRAME, PHONE_FRAME)).toEqual({ tx: 60, ty: 41 })

        // The wheel's centre stays the centre: it is the same point in both frames.
        const centre = mapTarget({ tx: 50, ty: 42.75 }, DESKTOP_FRAME, PHONE_FRAME)
        expect(centre.tx).toBe(50)
        expect(Math.abs(centre.ty - 43)).toBeLessThanOrEqual(1)
    })

    it('takes the manifest targets when there are some and the calibrated defaults otherwise', () => {
        const defaults = phoneTargets(undefined)
        expect(Object.keys(defaults).sort()).toEqual(['boltCircle', 'centreBore', 'offset', 'widthDiameter'])
        expect(defaults.widthDiameter).toEqual(mapTarget(DEFAULT_TARGETS.widthDiameter, DESKTOP_FRAME, PHONE_FRAME))

        const own = phoneTargets({ offset: { tx: 50, ty: 42.75 } })
        expect(own.offset.tx).toBe(50)
        expect(own.widthDiameter).toEqual(defaults.widthDiameter)
    })
})
