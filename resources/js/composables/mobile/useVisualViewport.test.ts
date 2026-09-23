import { describe, expect, it } from 'vitest'
import { KEYBOARD_THRESHOLD_PX, measure } from './useVisualViewport'

describe('useVisualViewport · measure', () => {
    it('reports no keyboard when the visual viewport fills the layout viewport', () => {
        const m = measure(844, 844, 0)

        expect(m).toEqual({ height: 844, keyboardInset: 0, keyboardOpen: false })
    })

    it('reports the keyboard once more than the threshold is gone', () => {
        const m = measure(844, 844 - KEYBOARD_THRESHOLD_PX - 1, 0)

        expect(m.keyboardOpen).toBe(true)
        expect(m.keyboardInset).toBe(KEYBOARD_THRESHOLD_PX + 1)
    })

    it('does not call the browser chrome a keyboard', () => {
        // Safari's collapsing URL bar takes ~80 px; that is not a keyboard.
        expect(measure(844, 764, 0).keyboardOpen).toBe(false)
    })

    it('accounts for the visual viewport being scrolled down (iOS)', () => {
        const m = measure(844, 500, 344)

        expect(m.keyboardInset).toBe(0)
        expect(m.keyboardOpen).toBe(false)
    })

    it('never reports a negative inset', () => {
        expect(measure(800, 844, 0).keyboardInset).toBe(0)
    })
})
