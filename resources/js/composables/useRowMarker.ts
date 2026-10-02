import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * Where a row sits inside its positioned container — its top and its height — as the two CSS variables a highlighter
 * laid over it reads (`--mark-top`, `--mark-h`; the client's #6, D-111).
 *
 * The designed values render first, so the server's page and the first paint already show the marker on its row.
 * Once mounted the row itself is measured, and measured again whenever the row or its table changes size, so the
 * marker never drifts off its row: not at another width, not under browser zoom, not where a phone enlarges type.
 * A row's `offsetTop` counts from its offset parent — the positioned container the marker is drawn in, or the
 * table, which starts at that container's top.
 */
export function useRowMarker(row: Ref<HTMLElement | null>, designed: { top: number; height: number }): Ref<Record<string, string>> {
    const style = ref<Record<string, string>>({ '--mark-top': `${designed.top}px`, '--mark-h': `${designed.height}px` })
    let observer: ResizeObserver | undefined

    function measure(): void {
        const el = row.value

        if (el === null || el.offsetHeight === 0) {
            return
        }

        style.value = { '--mark-top': `${el.offsetTop}px`, '--mark-h': `${el.offsetHeight}px` }
    }

    onMounted(() => {
        measure()

        if (typeof ResizeObserver === 'undefined' || row.value === null) {
            return
        }

        // The row, its parent and its offset parent: a row above it growing moves it without resizing it.
        observer = new ResizeObserver(measure)

        for (const el of new Set([row.value, row.value.parentElement, row.value.offsetParent])) {
            if (el instanceof Element) {
                observer.observe(el)
            }
        }
    })

    onBeforeUnmount(() => observer?.disconnect())

    return style
}
