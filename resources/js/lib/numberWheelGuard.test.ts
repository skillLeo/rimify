import { afterEach, describe, expect, it } from 'vitest'
import { installNumberWheelGuard } from './numberWheelGuard'

/*
 * D-290: a focused number field lets go of the keyboard when the wheel turns over it, so the browser never steps it —
 * 1160 typed into 8.1 never becomes 1180 while the customer scrolls on. (The stepping itself is the browser's; the real
 * thing is proved in Chromium by e2e/number-wheel.spec.ts.)
 */
describe('installNumberWheelGuard', () => {
    let remove: () => void = () => undefined

    afterEach(() => {
        remove()
        document.body.innerHTML = ''
    })

    function field(type: string): HTMLInputElement {
        const input = document.createElement('input')
        input.type = type
        input.value = '1160'
        document.body.append(input)
        input.focus()

        return input
    }

    it('takes the keyboard off a focused number field the wheel turns over, and leaves its value alone', () => {
        remove = installNumberWheelGuard()
        const input = field('number')

        input.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 100 }))

        expect(document.activeElement).not.toBe(input)
        expect(input.value).toBe('1160')
    })

    // A zoom gesture or a sideways swipe steps nothing: the keyboard stays where it is, mid-entry.
    it('leaves the field focused for Ctrl+wheel and a sideways swipe', () => {
        remove = installNumberWheelGuard()
        const input = field('number')

        // As a browser sets it: the test DOM takes no modifier keys in a WheelEvent's init.
        const zoom = new WheelEvent('wheel', { bubbles: true, deltaY: 100 })
        Object.defineProperty(zoom, 'ctrlKey', { value: true })

        input.dispatchEvent(zoom)
        input.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaX: 100, deltaY: 0 }))

        expect(document.activeElement).toBe(input)
    })

    it('leaves alone a text field, and a number field the wheel turns elsewhere', () => {
        remove = installNumberWheelGuard()
        const text = field('text')

        text.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 100 }))
        expect(document.activeElement).toBe(text)

        const number = field('number')
        document.body.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 100 }))
        expect(document.activeElement).toBe(number)
    })
})
