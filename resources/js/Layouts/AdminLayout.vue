<script setup lang="ts">
/**
 * The admin frame: the rail, the topbar, and the page — the one layout every admin screen shares.
 *
 * Everything that decides what the frame shows is decided on the server and present in the first
 * frame (R-08 in spirit): the tree the rail draws, the breadcrumbs, whether the rail is collapsed,
 * which environment this is. Nothing here fetches, and nothing after hydration changes the frame's
 * shape except the viewer's own toggle.
 *
 * Items a role cannot reach are not in the tree at all; the server refuses the route regardless
 * (R-11). This is presentation, never enforcement.
 *
 * The frame is light, and only light (DIRECTION §8a): the dark rail, its white wordmark and the
 * dark-mode toggle are gone, and the account moved from the rail to the topbar's user menu.
 */

import { router } from '@inertiajs/vue3'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import '../../css/admin.css'
import AdminAppBar from '../Components/Admin/AdminAppBar.vue'
import AdminBottomBar from '../Components/Admin/AdminBottomBar.vue'
import AdminPalette from '../Components/Admin/AdminPalette.vue'
import AdminRail from '../Components/Admin/AdminRail.vue'
import AdminTopbar from '../Components/Admin/AdminTopbar.vue'
import ShortcutsDialog from '../Components/Admin/ShortcutsDialog.vue'
import Toast from '../Components/Chrome/Toast.vue'
import { toast } from '../Components/Chrome/toast'
import { provideAdminShell, useAdmin } from '../composables/admin/useAdmin'
import { useAdminShortcuts } from '../composables/admin/useAdminShortcuts'
import { isNavigationVisit, provideMobileShell } from '../composables/mobile/useMobileShell'
import { stripSheetState } from '../composables/mobile/useSheetHistory'

const admin = useAdmin()

// The phone's parts are the product's own (BottomSheet, ListRow); they need the mobile shell, which
// also publishes the visible viewport and the keyboard inset the save bar and palette ride on.
const mobile = provideMobileShell()

const paletteOpen = ref(false)
const shortcutsOpen = ref(false)
const railCollapsed = ref(admin.value.preferences.railCollapsed)

// The server's answer wins whenever it arrives — another tab may have changed it.
watch(
    () => admin.value.preferences.railCollapsed,
    (value) => (railCollapsed.value = value)
)

/** Laravel's XSRF cookie, decoded, as the `X-XSRF-TOKEN` header the request is checked against. */
function xsrfToken(): string {
    const match = /(?:^|;\s*)XSRF-TOKEN=([^;]+)/.exec(document.cookie)

    return match?.[1] ? decodeURIComponent(match[1]) : ''
}

/**
 * The rail moves at once; the choice is saved behind it with a plain background request, not an
 * Inertia visit — nothing on the page re-renders, so neither a stale toast nor a late answer to an
 * earlier click can come back. A failure costs the preference, never the page.
 */
function toggleRail(): void {
    railCollapsed.value = !railCollapsed.value

    void fetch('/admin/ansicht', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': xsrfToken(),
        },
        body: JSON.stringify({ rail: railCollapsed.value ? 'collapsed' : 'open' }),
    }).catch(() => undefined)
}

const shell = { paletteOpen, shortcutsOpen, railCollapsed, toggleRail }

provideAdminShell(shell)
useAdminShortcuts(
    shell,
    computed(() => admin.value.nav)
)

/*
 * A visit that takes longer than 300 ms turns the topbar's hairline blue (admin-shell.md §6.6).
 * Faster than that, nothing is shown — a flash of "busy" on every click reads as a slow panel.
 */
const busy = ref(false)
let busyTimer: ReturnType<typeof setTimeout> | undefined
const unbind: Array<() => void> = []

onMounted(() => {
    unbind.push(
        // An open sheet closes and hands its history entry back before a real navigation — not on the
        // prefetch a row's press fires, or the click that follows would land on a closing row.
        router.on('before', (event) => {
            if (isNavigationVisit(event.detail.visit as { prefetch?: boolean; only?: string[]; except?: string[] })) {
                mobile.closeSheets()
                stripSheetState()
            }
        }),
        router.on('start', (event) => {
            const visit = event.detail.visit

            if (visit.async || !visit.showProgress) {
                return
            }

            clearTimeout(busyTimer)
            busyTimer = setTimeout(() => (busy.value = true), 300)
        }),
        router.on('finish', (event) => {
            if (event.detail.visit.async) {
                return
            }

            clearTimeout(busyTimer)
            busy.value = false
        }),
        /*
         * A save that failed is answered with one sentence (AdminErrorPage::formFailure), never a
         * page: the page stays exactly as it is, with everything typed into it, and the sentence
         * is said. Anything else unexpected gets the same care rather than a pane of raw HTML.
         */
        router.on('start', (event) => {
            lastWrite = event.detail.visit.method !== 'get'
        }),
        router.on('httpException', (event) => {
            const headers = event.detail.response.headers as Record<string, string | undefined>

            // A page is a page: the admin's own refusal or not-found (Admin/Fehler) renders as before.
            if (headers['x-inertia']) {
                return
            }

            event.preventDefault()
            toast.show({ text: failureMessage(event.detail.response.data), icon: 'info' })
        }),
        router.on('networkError', (event) => {
            event.preventDefault()
            toast.show({ text: lastWrite ? OFFLINE_WRITE : OFFLINE_READ, icon: 'info' })
        })
    )
})

/** Whether the last visit wrote something: its failure then says nothing was saved. */
let lastWrite = false

const OFFLINE_WRITE = 'Keine Verbindung zum Server. Es wurde nichts gespeichert, deine Eingaben sind noch da. Prüf die Verbindung und versuch es noch einmal.'

const OFFLINE_READ = 'Keine Verbindung zum Server. Prüf die Verbindung und versuch es noch einmal.'

const FALLBACK_WRITE = 'Das hat nicht geklappt. Es wurde nichts gespeichert, deine Eingaben sind noch da. Versuch es gleich noch einmal.'

const FALLBACK_READ = 'Die Seite konnte nicht geladen werden. Versuch es gleich noch einmal.'

function failureMessage(data: unknown): string {
    const fallback = lastWrite ? FALLBACK_WRITE : FALLBACK_READ

    if (typeof data === 'string') {
        try {
            data = JSON.parse(data) as unknown
        } catch {
            return fallback
        }
    }

    const message = data !== null && typeof data === 'object' ? (data as { message?: unknown }).message : undefined

    return typeof message === 'string' && message !== '' ? message : fallback
}

onBeforeUnmount(() => {
    clearTimeout(busyTimer)
    unbind.forEach((off) => off())
})
</script>

<template>
    <a class="adm-skip" href="#inhalt">Zum Inhalt springen</a>

    <div class="adm" :data-rail="railCollapsed ? 'collapsed' : 'open'" :data-busy="busy ? '' : undefined">
        <AdminRail />

        <div class="adm-work">
            <AdminAppBar />
            <AdminTopbar />

            <main id="inhalt" class="adm-page" tabindex="-1">
                <slot />
            </main>
        </div>

        <AdminBottomBar />
    </div>

    <AdminPalette />
    <ShortcutsDialog />

    <!-- The confirmation a mutation flashed (`flash.toast`), announced once per response. -->
    <Toast />
</template>
