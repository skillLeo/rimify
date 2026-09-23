<script setup lang="ts">
/**
 * The phone frame: app bar, page, footer, and the overlays the shell owns — the vehicle sheet,
 * the search sheet, the cookie choice, the toast. The destinations live in the app bar's menu;
 * nothing crosses the bottom of the screen but a page's own sticky action bar.
 *
 * A page applies it with `defineOptions({ layout: MobileLayout })` and, when it needs the bar to
 * say something, passes props through the layout function:
 *
 *     defineOptions({ layout: (h, page) => h(MobileLayout, { title: 'Warenkorb', large: true }, () => page) })
 *
 * The props arrive before anything renders, so the server's first frame already carries the
 * right bar. Nothing here consults `window` outside `onMounted`.
 *
 * Navigation: every plain GET visit gets a view transition whose direction was decided before
 * the visit (`useNavigationDirection`); back is never animated; every open sheet closes and
 * gives its history entry back before Inertia pushes its own.
 */

import { router } from '@inertiajs/vue3'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import AppBar from '../Components/Mobile/AppBar.vue'
import BottomSheet from '../Components/Mobile/BottomSheet.vue'
import ListRow from '../Components/Mobile/ListRow.vue'
import MobileFooter from '../Components/Mobile/MobileFooter.vue'
import SearchSheet from '../Components/Mobile/SearchSheet.vue'
import CookieConsent from '../Components/Chrome/CookieConsent.vue'
import Toast from '../Components/Chrome/Toast.vue'
import CompareTray from '../Components/Compare/CompareTray.vue'
import { provideConsent } from '../composables/useConsent'
import { provideShell } from '../composables/useShell'
import { useShared } from '../composables/useShared'
import { useShortcuts } from '../composables/useShortcuts'
import { isNavigationVisit, provideMobileShell } from '../composables/mobile/useMobileShell'
import { installNavigationDirection, markNext } from '../composables/mobile/useNavigationDirection'
import { stripSheetState } from '../composables/mobile/useSheetHistory'

const props = withDefaults(
    defineProps<{
        title?: string
        /** An iOS-style large title that collapses into the bar. It is the page's h1. */
        large?: boolean
        /** The back arrow's destination when the session has no history; null hides it. */
        back?: string | null
        footer?: boolean
    }>(),
    { title: undefined, large: false, back: '/', footer: true }
)

/** Routes whose screens are tabs: no back arrow, search and vehicle in the bar. */
const TOP_LEVEL = new Set(['startseite', 'felgen.index', 'check.index', 'warenkorb.index'])

/** What the bar says on an inner route that passes no title of its own. */
const ROUTE_TITLES: Record<string, string> = {
    'felgen.suchen': 'Fahrzeug wählen',
    'felgen.show': 'Felge',
    'check.ergebnis': 'Ergebnis',
    'kasse.index': 'Kasse',
    'bestellung.show': 'Bestellung',
    faq: 'Fragen und Antworten',
    kontakt: 'Kontakt',
    rechtliches: 'Rechtliches',
}

const shared = useShared()
provideShell()
provideConsent(shared.value.consent ?? null)
const shell = provideMobileShell()

const vehicle = computed(() => shared.value.vehicle)

const bar = computed(() => {
    const name = shared.value.routeName ?? ''
    const top = TOP_LEVEL.has(name)

    return {
        top,
        title: props.title ?? (top ? undefined : ROUTE_TITLES[name] ?? 'RIMIFY'),
        large: props.large,
        back: props.back,
    }
})

const vehicleSheet = computed({
    get: () => shell.vehicleOpen.value && vehicle.value !== null,
    set: (open: boolean) => {
        shell.vehicleOpen.value = open
    },
})

useShortcuts({
    onSearch: () => {
        shell.searchOpen.value = true
    },
    onPalette: () => {
        shell.searchOpen.value = !shell.searchOpen.value
    },
    onHelp: () => undefined,
})

let teardown: (() => void)[] = []

onMounted(() => {
    teardown.push(installNavigationDirection())

    // Sheets close and hand their history entry back before Inertia pushes its own — on a real
    // navigation only. A row's press prefetches through the same event and must leave the sheet
    // open, or the click that follows the press lands on a closing row.
    teardown.push(
        router.on('before', (event) => {
            if (!isNavigationVisit(event.detail.visit as { prefetch?: boolean; only?: string[]; except?: string[] })) {
                return
            }

            shell.closeSheets()
            stripSheetState()
        })
    )

    const standalone = window.matchMedia('(display-mode: standalone)')
    const apply = (): void => {
        const on = standalone.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
        shell.standalone.value = on
        document.documentElement.classList.toggle('is-standalone', on)
    }
    apply()
    standalone.addEventListener('change', apply)
    teardown.push(() => standalone.removeEventListener('change', apply))

    // The service worker caches built assets, fonts and images only — never HTML or Inertia JSON.
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
        navigator.serviceWorker.register('/sw.js').catch(() => undefined)
    }
})

onBeforeUnmount(() => {
    for (const stop of teardown) {
        stop()
    }

    teardown = []
})

function removeVehicle(): void {
    shell.vehicleOpen.value = false
    router.delete('/fahrzeug', { preserveScroll: true })
}

function fromVehicleSheet(href: string | undefined): void {
    if (href) {
        markNext('forward')
        router.visit(href)
    }
}
</script>

<template>
    <div class="mshell" :class="{ 'mshell--sticky': shell.stickyBar.value }">
        <a class="skip-link" href="#inhalt">Zum Inhalt springen</a>

        <AppBar :top="bar.top" :title="bar.title" :large="bar.large" :back="bar.back">
            <template #actions>
                <slot name="bar-actions" />
            </template>
        </AppBar>

        <main id="inhalt" class="mshell__main">
            <slot />
        </main>

        <!-- After the page, before the footer; never while a sticky bar owns the bottom edge. -->
        <CompareTray :hidden="shell.stickyBar.value" />

        <MobileFooter v-if="footer" />

        <!-- The vehicle: its name and key numbers, then the three things one does with it. -->
        <BottomSheet v-if="vehicle" id="fahrzeug" v-model:open="vehicleSheet" title="Dein Fahrzeug">
            <p class="h4">{{ vehicle.label }}</p>
            <p class="small muted num">{{ vehicle.buildWindow }} · {{ vehicle.keyNumbers }}</p>
            <div class="mshell__vehicle-rows">
                <ListRow icon="wheel" title="Passende Felgen anzeigen" href="/felgen" manual @activate="fromVehicleSheet" />
                <ListRow icon="car" title="Fahrzeug ändern" href="/felgen-suchen" manual @activate="fromVehicleSheet" />
                <ListRow icon="close" title="Fahrzeug entfernen" :chevron="false" @activate="removeVehicle" />
            </div>
        </BottomSheet>

        <SearchSheet />
        <CookieConsent />
        <Toast />
    </div>
</template>

<style scoped>
.mshell {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
}

.mshell__main {
    flex: 1;
    min-width: 0;
    padding-bottom: env(safe-area-inset-bottom);
}

/* A sticky action bar is the only thing that owns the bottom edge; the page keeps clear of it. */
.mshell--sticky .mshell__main {
    padding-bottom: calc(var(--stickybar-h) + var(--sp-16) + env(safe-area-inset-bottom));
}

.mshell__vehicle-rows {
    margin: var(--sp-16) calc(-1 * var(--page-margin)) 0;
}
</style>

<!--
    Shell-wide rules that scoped styles cannot reach: press feedback for any control that asks,
    and the page transitions, which live on pseudo-elements of the document.
-->
<style>
/* Press, not hover: a tile or a button scales to .98 while the finger is down. */
.m-press {
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition: transform var(--d-1) var(--ease-std);
}

.m-press:active {
    transform: scale(0.98);
}

/* ── Page transitions ─────────────────────────────────────────────────────────
   Forward: the new screen slides in from the right while the old one shifts left and dims.
   Tab: a short cross-fade. Back: nothing — the platform's own gesture already moved the page.
   The chrome is its own group and does not move. */

html[data-nav='forward']::view-transition-old(root) {
    animation: mvt-old-out var(--d-3) var(--ease-std) both;
}

html[data-nav='forward']::view-transition-new(root) {
    animation: mvt-new-in var(--d-3) var(--ease-out) both;
}

html[data-nav='tab']::view-transition-old(root),
html[data-nav='tab']::view-transition-new(root) {
    animation-duration: var(--d-2);
}

html[data-nav='back']::view-transition-old(root),
html[data-nav='back']::view-transition-new(root) {
    animation: none;
}

::view-transition-group(m-appbar),
::view-transition-group(m-tabbar),
::view-transition-group(m-sticky),
::view-transition-old(m-appbar),
::view-transition-new(m-appbar),
::view-transition-old(m-tabbar),
::view-transition-new(m-tabbar),
::view-transition-old(m-sticky),
::view-transition-new(m-sticky) {
    animation: none;
}

::view-transition-image-pair(m-appbar),
::view-transition-image-pair(m-tabbar),
::view-transition-image-pair(m-sticky) {
    isolation: auto;
}

::view-transition-old(m-appbar),
::view-transition-old(m-tabbar),
::view-transition-old(m-sticky) {
    display: none;
}

@keyframes mvt-old-out {
    to {
        transform: translateX(-30%);
        opacity: 0.7;
    }
}

@keyframes mvt-new-in {
    from {
        transform: translateX(100%);
    }
}
</style>
