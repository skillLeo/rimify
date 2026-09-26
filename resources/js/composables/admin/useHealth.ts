/**
 * The shop's health line, kept current (the rail's foot, the phone's Mehr sheet).
 *
 * Every admin page arrives with `admin.health` from the server, so the line is right in the first
 * frame. After that it is asked for again every 60 seconds, silently: no spinner, no flicker — the
 * sentence simply changes when the answer does. A poll that fails keeps the last answer rather than
 * inventing a new one. One timer for the whole panel, however many places show the line.
 */

import { router } from '@inertiajs/vue3'
import { computed, onBeforeUnmount, onMounted, ref, type ComputedRef } from 'vue'
import { useAdmin } from './useAdmin'
import type { AdminHealth } from '../../types/admin'

export const PULSE_URL = '/admin/system/puls'
export const PULSE_MS = 60_000

const live = ref<Pick<AdminHealth, 'state' | 'sentence' | 'label' | 'count'> | null>(null)
let users = 0
let timer: ReturnType<typeof setInterval> | null = null

async function pulse(): Promise<void> {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return
    }

    try {
        const response = await fetch(PULSE_URL, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin',
        })

        if (!response.ok) {
            return
        }

        const body = (await response.json()) as { state?: unknown; sentence?: unknown; label?: unknown; count?: unknown }

        if ((body.state === 'ok' || body.state === 'warn' || body.state === 'bad') && typeof body.sentence === 'string') {
            live.value = {
                state: body.state,
                sentence: body.sentence,
                label: typeof body.label === 'string' ? body.label : body.sentence,
                count: typeof body.count === 'string' ? body.count : null,
            }
        }
    } catch {
        // Keep the last answer: a network blip is not news about the shop.
    }
}

let listening = false

export function useHealth(): ComputedRef<AdminHealth | null> {
    const admin = useAdmin()

    if (!listening && typeof window !== 'undefined') {
        listening = true
        // A page from the server carries an answer at most 30 seconds old: it replaces the polled one.
        router.on('success', () => {
            live.value = null
        })
    }

    onMounted(() => {
        users += 1

        if (timer === null) {
            timer = setInterval(() => void pulse(), PULSE_MS)
        }
    })

    onBeforeUnmount(() => {
        users -= 1

        if (users <= 0 && timer !== null) {
            clearInterval(timer)
            timer = null
            users = 0
        }
    })

    return computed(() => {
        const base = admin.value.health

        if (base === null) {
            return null
        }

        return live.value === null ? base : { ...base, ...live.value }
    })
}

/** For tests: forget the polled answer. */
export function resetHealth(): void {
    live.value = null
}
