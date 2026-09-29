/**
 * A chart's own width (and height, where CSS sets it), followed as its panel resizes, so marks and labels are drawn at their true
 * size rather than stretched. The server renders at `fallback`; the real width arrives on mount.
 *
 * A ResizeObserver follows the panel, its reports folded into one per frame. While the rail is being
 * dragged the panel changes width on every frame: the chart does not measure at all — its drawing
 * scales into its box through the SVG's viewBox meanwhile — and redraws once, when the drag ends
 * (railResizing).
 */

import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { railResizing } from '../../../composables/admin/railResizing'

export function useWidth(fallback = 600, fallbackHeight = 0): { el: Ref<HTMLElement | null>; width: Ref<number>; height: Ref<number> } {
    const el = ref<HTMLElement | null>(null)
    const width = ref(fallback)
    /** The box's own height, where CSS sets it (a plot's --adm-plot-h); the fallback until measured. */
    const height = ref(fallbackHeight)
    let observer: ResizeObserver | null = null
    let frame = 0
    let waiting = false

    function measure(): void {
        if (el.value !== null) {
            const box = el.value.getBoundingClientRect()
            width.value = Math.max(120, Math.round(box.width)) || fallback
            height.value = Math.round(box.height) || fallbackHeight
        }
    }

    onMounted(() => {
        if (el.value === null) {
            return
        }

        measure()

        if (typeof ResizeObserver === 'undefined') {
            return
        }

        observer = new ResizeObserver(() => {
            if (railResizing.value) {
                waiting = true

                return
            }

            if (frame === 0) {
                frame = requestAnimationFrame(() => {
                    frame = 0
                    measure()
                })
            }
        })
        observer.observe(el.value)
    })

    const stop = watch(railResizing, (resizing) => {
        if (!resizing && waiting) {
            waiting = false
            measure()
        }
    })

    onBeforeUnmount(() => {
        observer?.disconnect()
        cancelAnimationFrame(frame)
        stop()
    })

    return { el, width, height }
}

/** Whether marks may animate in: never with reduced motion, and never outside a browser. */
export function mayAnimate(): boolean {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
