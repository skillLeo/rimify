/**
 * The visual viewport: what is actually visible once the on-screen keyboard is up.
 *
 * `100dvh` does not shrink for the keyboard on either platform, so a bar pinned to the bottom of
 * the layout viewport disappears behind it. This watches `window.visualViewport`, computes the
 * keyboard inset, and writes it to two custom properties on the root (`--vv-h`, `--kb-inset`) so
 * the sticky action bar and the search sheet can follow the keyboard in CSS alone.
 *
 * One set of listeners for the whole page, however many components ask.
 */

import { onBeforeUnmount, onMounted, readonly, ref, type Ref } from 'vue'

/** A viewport that lost more than this is a viewport with a keyboard in it. */
export const KEYBOARD_THRESHOLD_PX = 150

export interface VisualViewportState {
    readonly height: Readonly<Ref<number>>
    readonly keyboardInset: Readonly<Ref<number>>
    readonly keyboardOpen: Readonly<Ref<boolean>>
}

export interface Measurement {
    height: number
    keyboardInset: number
    keyboardOpen: boolean
}

/** Pure: the keyboard inset from the two heights and the visual viewport's offset. */
export function measure(innerHeight: number, visualHeight: number, visualOffsetTop: number): Measurement {
    const inset = Math.max(0, Math.round(innerHeight - visualHeight - visualOffsetTop))

    return { height: Math.round(visualHeight), keyboardInset: inset, keyboardOpen: inset > KEYBOARD_THRESHOLD_PX }
}

const height = ref(0)
const keyboardInset = ref(0)
const keyboardOpen = ref(false)

let subscribers = 0
let detach: (() => void) | null = null

function apply(m: Measurement): void {
    height.value = m.height
    keyboardInset.value = m.keyboardInset
    keyboardOpen.value = m.keyboardOpen

    const root = document.documentElement
    root.style.setProperty('--vv-h', `${m.height}px`)
    root.style.setProperty('--kb-inset', `${m.keyboardInset}px`)
    root.classList.toggle('is-keyboard', m.keyboardOpen)
}

function attach(): () => void {
    const vv = window.visualViewport

    const update = (): void => {
        if (vv) {
            apply(measure(window.innerHeight, vv.height, vv.offsetTop))
        } else {
            apply(measure(window.innerHeight, window.innerHeight, 0))
        }
    }

    update()

    if (vv) {
        vv.addEventListener('resize', update)
        vv.addEventListener('scroll', update)
    }

    window.addEventListener('resize', update)

    return () => {
        if (vv) {
            vv.removeEventListener('resize', update)
            vv.removeEventListener('scroll', update)
        }

        window.removeEventListener('resize', update)
        document.documentElement.style.removeProperty('--vv-h')
        document.documentElement.style.removeProperty('--kb-inset')
        document.documentElement.classList.remove('is-keyboard')
    }
}

export function useVisualViewport(): VisualViewportState {
    onMounted(() => {
        if (subscribers++ === 0) {
            detach = attach()
        }
    })

    onBeforeUnmount(() => {
        if (--subscribers === 0 && detach) {
            detach()
            detach = null
        }
    })

    return { height: readonly(height), keyboardInset: readonly(keyboardInset), keyboardOpen: readonly(keyboardOpen) }
}
