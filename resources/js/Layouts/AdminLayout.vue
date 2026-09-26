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

import { router, usePage } from '@inertiajs/vue3'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import '../../css/admin.css'
import AdminAppBar from '../Components/Admin/AdminAppBar.vue'
import AdminBottomBar from '../Components/Admin/AdminBottomBar.vue'
import AdminHealthBanner from '../Components/Admin/AdminHealthBanner.vue'
import AdminPalette from '../Components/Admin/AdminPalette.vue'
import AdminRail from '../Components/Admin/AdminRail.vue'
import AdminRailHandle from '../Components/Admin/AdminRailHandle.vue'
import AdminTopbar from '../Components/Admin/AdminTopbar.vue'
import ShortcutsDialog from '../Components/Admin/ShortcutsDialog.vue'
import Toast from '../Components/Chrome/Toast.vue'
import { toast } from '../Components/Chrome/toast'
import { provideAdminShell, useAdmin } from '../composables/admin/useAdmin'
import { useAdminShortcuts } from '../composables/admin/useAdminShortcuts'
import { RAIL, clampWidth, fits, labelMode, type RailState } from '../composables/admin/railResize'
import { railResizing } from '../composables/admin/railResizing'
import { isNavigationVisit, provideMobileShell } from '../composables/mobile/useMobileShell'
import { stripSheetState } from '../composables/mobile/useSheetHistory'

const admin = useAdmin()
const page = usePage()

// The phone's parts are the product's own (BottomSheet, ListRow); they need the mobile shell, which
// also publishes the visible viewport and the keyboard inset the save bar and palette ride on.
const mobile = provideMobileShell()

const paletteOpen = ref(false)
const shortcutsOpen = ref(false)
const railCollapsed = ref(admin.value.preferences.railCollapsed)
const railWidth = ref(clampWidth(admin.value.preferences.railWidth))

// The server's answer wins whenever it arrives — another tab may have changed it — but never in the
// middle of a drag.
watch(
    () => admin.value.preferences.railCollapsed,
    (value) => {
        if (!railResizing.value) {
            railCollapsed.value = value
        }
    }
)
watch(
    () => admin.value.preferences.railWidth,
    (value) => {
        if (!railResizing.value) {
            railWidth.value = clampWidth(value)
        }
    }
)

/*
 * The window's width, known only in a browser. The content keeps 960 px: where the window has no
 * room for the rail at its width beside that, the rail is collapsed by the window (not by choice).
 * On the server nothing is forced; app.blade.php collapses it before the first paint where the window
 * is too narrow, and this starts from the same answer, so the first frame never jumps.
 */
/** The shell's own width — the page without whatever scrollbar it has: the content's 960 px are measured against this. */
function pageWidth(): number {
    return document.querySelector<HTMLElement>('.adm')?.clientWidth || document.documentElement.clientWidth
}

const viewport = ref<number | null>(typeof document === 'undefined' ? null : pageWidth())
const railForced = computed(() => viewport.value !== null && viewport.value >= RAIL.resizableFrom && !fits(railWidth.value, viewport.value))
const railShown = computed(() => railCollapsed.value || railForced.value)

let viewportFrame = 0

function onViewport(): void {
    if (viewportFrame === 0) {
        viewportFrame = requestAnimationFrame(() => {
            viewportFrame = 0
            viewport.value = pageWidth()
        })
    }
}

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
function sendRail(): void {
    void fetch('/admin/ansicht', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': xsrfToken(),
        },
        body: JSON.stringify({ rail: railCollapsed.value ? 'collapsed' : 'open', width: railWidth.value }),
    }).catch(() => undefined)
}

/*
 * Saved on the account, so the rail is the same on any machine — at most once a second while it
 * moves (`soon`), and once more the moment it stops (`now`).
 */
let saveTimer: ReturnType<typeof setTimeout> | undefined
let savePending = false

function saveRail(now: boolean): void {
    if (now) {
        clearTimeout(saveTimer)
        saveTimer = undefined
        savePending = false
        sendRail()

        return
    }

    if (saveTimer !== undefined) {
        savePending = true

        return
    }

    sendRail()
    saveTimer = setTimeout(() => {
        saveTimer = undefined

        if (savePending) {
            savePending = false
            saveRail(false)
        }
    }, RAIL.saveEveryMs)
}

/*
 * Collapse, expand and the reset take 180 ms; a drag never animates. The grid changes at once and the
 * content area slides from where it was — a transform, never an animated width (DIRECTION §5) — and
 * with reduced motion it simply moves.
 */
const work = ref<HTMLElement | null>(null)

function slide(apply: () => void): void {
    const el = work.value

    if (el === null || typeof el.animate !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        apply()

        return
    }

    const before = el.getBoundingClientRect().left
    apply()

    void nextTick(() => {
        const delta = before - el.getBoundingClientRect().left

        if (Math.abs(delta) < 1) {
            return
        }

        const style = getComputedStyle(document.documentElement)
        const duration = Number.parseFloat(style.getPropertyValue('--adm-d-rail')) || 180

        el.animate([{ transform: `translateX(${delta}px)` }, { transform: 'none' }], {
            duration,
            easing: style.getPropertyValue('--ease-out').trim() || 'ease-out',
        })
    })
}

function setRail(state: RailState, options: { animate?: boolean; save?: 'now' | 'soon' } = {}): void {
    const apply = (): void => {
        railCollapsed.value = state.collapsed
        railWidth.value = state.width
    }

    if (options.animate) {
        slide(apply)
    } else {
        apply()
    }

    if (options.save) {
        saveRail(options.save === 'now')
    }
}

function toggleRail(): void {
    setRail({ collapsed: !railCollapsed.value, width: railWidth.value }, { animate: true, save: 'now' })
}

const shell = {
    paletteOpen,
    shortcutsOpen,
    railCollapsed,
    toggleRail,
    rail: { width: railWidth, shown: railShown, forced: railForced, resizing: railResizing, set: setRail },
}

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
    window.addEventListener('resize', onViewport)
    unbind.push(
        () => window.removeEventListener('resize', onViewport),
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
            lastAsync = event.detail.visit.async === true
        }),
        router.on('httpException', (event) => {
            const headers = event.detail.response.headers as Record<string, string | undefined>
            const answer = event.detail.response.data as { component?: unknown } | undefined

            if (headers['x-inertia']) {
                // A background reload — the Übersicht's charts, a list's counts — answered with another
                // page (the shop's error page for a query that failed) must not replace the page the
                // reader is on: the page keeps what it has and says, where it waited, that it failed.
                if (lastAsync && typeof answer?.component === 'string' && answer.component !== page.component) {
                    event.preventDefault()
                    toast.show({ text: failureMessage(undefined), icon: 'info' })
                }

                // Otherwise a page is a page: the admin's own refusal or not-found (Admin/Fehler).
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

/** Whether the last visit was a background reload (deferred props, polling) rather than a navigation. */
let lastAsync = false

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
    cancelAnimationFrame(viewportFrame)
    unbind.forEach((off) => off())
})
</script>

<template>
    <a class="adm-skip" href="#inhalt">Zum Inhalt springen</a>

    <!-- One custom property drives the rail's width (--rail-w); the stored width is in the first frame. -->
    <div
        class="adm"
        :data-rail="railShown ? 'collapsed' : 'open'"
        :data-rail-forced="railForced ? '' : undefined"
        :data-labels="labelMode(railWidth)"
        :data-resizing="railResizing ? '' : undefined"
        :data-busy="busy ? '' : undefined"
        :style="{ '--rail-w': `${railWidth}px` }"
    >
        <AdminRail />
        <AdminRailHandle />

        <div ref="work" class="adm-work">
            <AdminAppBar />
            <AdminTopbar />
            <!-- Only for the shop closed or a queue dead for an hour; everything else is the rail's quiet line. -->
            <AdminHealthBanner />

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
