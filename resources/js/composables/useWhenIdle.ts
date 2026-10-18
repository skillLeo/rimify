/**
 * True once the browser has a moment to spare after the component mounted — for work the first frame does not need
 * (D-276). False on the server and through hydration, so the server's HTML and the hydrating client agree; then the
 * work happens in the browser's next idle period, at the latest after `timeout` ms, outside the task that hydrates the
 * page. The rail's thirty item tooltips cost about 150 ms of that task; nobody can point at one before then anyway.
 */

import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export function useWhenIdle(timeout = 1000): Ref<boolean> {
    const ready = ref(false)
    let cancel: (() => void) | null = null

    onMounted(() => {
        const go = (): void => {
            cancel = null
            ready.value = true
        }

        if (typeof window.requestIdleCallback === 'function') {
            const id = window.requestIdleCallback(go, { timeout })
            cancel = () => window.cancelIdleCallback(id)
        } else {
            const id = window.setTimeout(go, 1)
            cancel = () => window.clearTimeout(id)
        }
    })

    onBeforeUnmount(() => cancel?.())

    return ready
}
