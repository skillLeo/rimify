/**
 * The bell's unread count when it knows better than the page (docs/admin/rest-build-plan.md, step 1).
 *
 * Every admin page arrives with `admin.notifications.unread`. Two things make that number stale:
 * the bell has just read a fresher one, and Back or Forward restored a page from the browser's
 * history, which Inertia does without asking the server — so a count read an hour ago would say
 * "3 ungelesen" again after the reader has read them all. The fresher number is kept here, once for
 * both bells (topbar and phone app bar), and dropped as soon as a page comes from the server again.
 */

import { router } from '@inertiajs/vue3'
import { ref, type Ref } from 'vue'
import type { AdminAlertItem } from '../../types/admin'

export const LATEST_URL = '/admin/benachrichtigungen/neueste'

export type LatestAnswer = { status: 'ok'; unread: number; items: AdminAlertItem[] } | { status: 'signed-out' } | { status: 'failed' }

/** A fresher count than the page's; null means the page's own is the freshest there is. */
const live: Ref<number | null> = ref(null)
let installed = false

/** The newest alerts and the unread count, straight from the server. */
export async function fetchLatest(signal?: AbortSignal): Promise<LatestAnswer> {
    try {
        const response = await fetch(LATEST_URL, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin',
            signal,
        })

        // An expired session answers 401, or is sent to the sign-in page, which is not JSON.
        if (response.status === 401 || response.status === 419 || (response.redirected && response.url.includes('/admin/anmelden'))) {
            return { status: 'signed-out' }
        }

        if (!response.ok) {
            return { status: 'failed' }
        }

        const body = (await response.json()) as { unread?: unknown; items?: unknown }

        return {
            status: 'ok',
            unread: typeof body.unread === 'number' ? body.unread : 0,
            items: Array.isArray(body.items) ? (body.items as AdminAlertItem[]) : [],
        }
    } catch {
        return { status: 'failed' }
    }
}

async function refresh(): Promise<void> {
    const answer = await fetchLatest()

    if (answer.status === 'ok') {
        live.value = answer.unread
    }
}

export function useAlertCount(): { live: Ref<number | null>; remember: (unread: number) => void } {
    if (!installed && typeof window !== 'undefined') {
        installed = true
        // A page from the server carries a fresh count of its own.
        router.on('success', () => {
            live.value = null
        })
        // Back and Forward restore a page from history, its old count included.
        window.addEventListener('popstate', () => void refresh())
    }

    return {
        live,
        remember: (unread: number) => {
            live.value = unread
        },
    }
}
