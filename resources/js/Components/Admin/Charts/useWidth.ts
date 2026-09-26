/**
 * A chart's own width, followed as its panel resizes, so marks and labels are drawn at their true
 * size rather than stretched. The server renders at `fallback`; the real width arrives on mount.
 *
 * While the rail is being dragged the panel changes width on every frame: the chart waits, and
 * measures once when the drag ends (railResizing).
 */

import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { railResizing } from '../../../composables/admin/railResizing'

export function useWidth(fallback = 600): { el: Ref<HTMLElement | null>; width: Ref<number> } {
    const el = ref<HTMLElement | null>(null)
    const width = ref(fallback)
    let observer: ResizeObserver | null = null

    onMounted(() => {
        if (el.value === null) {
            return
        }

        width.value = Math.max(120, Math.round(el.value.getBoundingClientRect().width)) || fallback

        if (typeof ResizeObserver === 'undefined') {
            return
        }

        observer = new ResizeObserver(([entry]) => {
            if (railResizing.value) {
                waiting = true

                return
            }

            const next = Math.round(entry?.contentRect.width ?? 0)

            if (next > 0) {
                width.value = Math.max(120, next)
            }
        })
        observer.observe(el.value)
    })

    let waiting = false

    const stop = watch(railResizing, (resizing) => {
        if (!resizing && waiting && el.value !== null) {
            waiting = false
            width.value = Math.max(120, Math.round(el.value.getBoundingClientRect().width)) || fallback
        }
    })

    onBeforeUnmount(() => {
        observer?.disconnect()
        stop()
    })

    return { el, width }
}

/** Whether marks may animate in: never with reduced motion, and never outside a browser. */
export function mayAnimate(): boolean {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
