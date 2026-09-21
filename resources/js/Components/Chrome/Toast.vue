<script setup lang="ts">
/**
 * The toast.
 *
 * Confirmations only — never a failure, and never a conflict. Anything the customer needs to act
 * on stays on the page as a row or a panel, because a toast that scrolls away is a message nobody
 * can go back and read. One at a time, four seconds, and the clock stops while the pointer rests
 * on it.
 *
 * It listens for server responses, not for a change in the flashed text. Watching the text missed
 * the second "Zum Warenkorb hinzugefügt." in a row (the same string is not a change), and it
 * replayed an old toast whenever the back button restored a page whose props still carried it.
 * A `success` event fires once per real response and never for a page restored from history.
 */

import { router, usePage } from '@inertiajs/vue3'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from '../Ui/Icon.vue'
import { toastFrom, TOAST_MS } from './toast'

const page = usePage()
const message = ref<string | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined
let stopListening: (() => void) | undefined

function arm(): void {
    if (timer !== undefined) {
        clearTimeout(timer)
    }

    timer = setTimeout(() => {
        message.value = null
    }, TOAST_MS)
}

function show(next: string | null): void {
    if (next === null) {
        return
    }

    message.value = next
    arm()
}

function pause(): void {
    if (timer !== undefined) {
        clearTimeout(timer)
        timer = undefined
    }
}

function dismiss(): void {
    message.value = null
    pause()
}

onMounted(() => {
    // A full page load that arrived with a flash (a non-Inertia redirect). Not on back/forward:
    // that page's flash was already shown the first time round.
    const entry = performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined

    if (entry?.type !== 'back_forward') {
        show(toastFrom(page.props))
    }

    stopListening = router.on('success', (event) => {
        show(toastFrom(event.detail.page.props))
    })
})

onBeforeUnmount(() => {
    stopListening?.()
    pause()
})
</script>

<template>
    <!-- The live region is always in the document, so a message inserted into it is announced. -->
    <div class="toast-viewport" role="status" aria-live="polite">
        <Transition name="toast">
            <div v-if="message" class="toast" @mouseenter="pause" @mouseleave="arm">
                <Icon name="check-circle" :size="20" />
                <span class="toast__text">{{ message }}</span>
                <button class="icon-btn toast__close" type="button" aria-label="Schließen" @click="dismiss">
                    <Icon name="close" :size="20" />
                </button>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
/* Leaving is faster than arriving. */
.toast-leave-active {
    animation: toast-out var(--d-2) var(--ease-in) both;
}

@keyframes toast-out {
    to {
        opacity: 0;
        transform: translateY(var(--sp-12));
    }
}
</style>
