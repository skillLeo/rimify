/**
 * A chart's own width, followed as its panel resizes, so marks and labels are drawn at their true
 * size rather than stretched. The server renders at `fallback`; the real width arrives on mount.
 */

import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

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
            const next = Math.round(entry?.contentRect.width ?? 0)

            if (next > 0) {
                width.value = Math.max(120, next)
            }
        })
        observer.observe(el.value)
    })

    onBeforeUnmount(() => observer?.disconnect())

    return { el, width }
}

/** Whether marks may animate in: never with reduced motion, and never outside a browser. */
export function mayAnimate(): boolean {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
