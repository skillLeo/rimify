<script setup lang="ts">
/**
 * The phone frame: the shop's one header (as on every page — the client's #35, D-349), page, footer, and the overlays
 * the shell owns — the vehicle sheet, the search sheet, the cookie choice, the toast. The destinations live in the
 * header's menu; nothing crosses the bottom of the screen but a page's own sticky action bar.
 *
 * A page applies it with `defineOptions({ layout: MobileLayout })` and, when it wants its title as a large h1 under the
 * header, passes it through the layout function:
 *
 *     defineOptions({ layout: (h, page) => h(MobileLayout, { title: 'Felgenrechner', large: true }, () => page) })
 *
 * The props arrive before anything renders, so the server's first frame already carries the
 * right title. Nothing here consults `window` outside `onMounted`.
 *
 * Navigation: every plain GET visit gets a view transition whose direction was decided before
 * the visit (`useNavigationDirection`); back is never animated; every open sheet closes and
 * gives its history entry back before Inertia pushes its own.
 */

import { router } from '@inertiajs/vue3'
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import BottomSheet from '../Components/Mobile/BottomSheet.vue'
import SiteHeader from '../Components/Chrome/SiteHeader.vue'
import ListRow from '../Components/Mobile/ListRow.vue'
import SearchSheet from '../Components/Mobile/SearchSheet.vue'
import CanonicalLink from '../Components/Chrome/CanonicalLink.vue'
import CookieConsent from '../Components/Chrome/CookieConsent.vue'
import PreviewRibbon from '../Components/Chrome/PreviewRibbon.vue'
import SiteFooter from '../Components/Chrome/SiteFooter.vue'
import AddedPanel from '../Components/Chrome/AddedPanel.vue'
import Toast from '../Components/Chrome/Toast.vue'
import CompareTray from '../Components/Compare/CompareTray.vue'
import { provideConsent } from '../composables/useConsent'
import { provideShell } from '../composables/useShell'
import { useShared } from '../composables/useShared'
import { useShopFeedback } from '../composables/useShopFeedback'
import { useShortcuts } from '../composables/useShortcuts'
import { useVehicleChangeHref } from '../lib/vehicleChange'
import { isNavigationVisit, provideMobileShell } from '../composables/mobile/useMobileShell'
import { installNavigationDirection, markNext } from '../composables/mobile/useNavigationDirection'
import { stripSheetState } from '../composables/mobile/useSheetHistory'

withDefaults(
    defineProps<{
        /** The page's title. Shown only with `large`; the header names no page since #35. */
        title?: string
        /** The title as the page's h1, under the header; a page that asks for it renders no second one. */
        large?: boolean
        /** Kept for the pages that still pass it: since #35 the header has no back arrow — the browser's own goes back. */
        back?: string | null
        footer?: boolean
    }>(),
    { title: undefined, large: false, back: '/', footer: true }
)

const shared = useShared()
/* The review's feedback button, for a signed-in admin only (D-142): loaded once the page is awake, never for a visitor (D-255). */
const shopFeedback = useShopFeedback(() => Boolean(shared.value.reviewer))
const frame = provideShell()
provideConsent(shared.value.consent ?? null)
const shell = provideMobileShell()
const changeHref = useVehicleChangeHref()

const vehicle = computed(() => shared.value.vehicle)

/*
 * One header on every page a phone opens (the client's #35, D-349): the shop's own, as every other page has it — the
 * wordmark, the search, the vehicle, the basket and the menu, each where it stands everywhere else. What it opens is
 * the phone shell's: the search sheet and the vehicle sheet.
 */
watch(
    () => frame.paletteOpen.value,
    (open) => {
        if (open) {
            frame.paletteOpen.value = false
            shell.searchOpen.value = true
        }
    }
)

watch(
    () => frame.vehicleOpen.value,
    (open) => {
        if (open) {
            frame.vehicleOpen.value = false
            shell.vehicleOpen.value = true
        }
    }
)

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
    <!-- The vehicle bar under the header as on every other page; where the server shows none (R-08), the offsets that
         add its height add nothing. -->
    <div
        class="mshell"
        :class="{
            'mshell--sticky': shell.stickyBar.value,
            'mshell--footer': footer,
            'mshell--vbar': vehicle !== null && (shared.headerMode === 'WHITE_BOX' || shared.headerMode === 'BLUE_BAR'),
        }"
    >
        <a class="skip-link" href="#inhalt">Zum Inhalt springen</a>

        <CanonicalLink />

        <PreviewRibbon />

        <SiteHeader />

        <!-- A page that asks for a large title gets it here, as its h1, under the header — where the phone bar carried it.
             A page without one brings its own h1. -->
        <h1 v-if="large && title" class="h2 mshell__title">{{ title }}</h1>

        <!-- Where it shows, under the header: Tab reaches it after the header, not after the whole page (PDP-10). -->
        <AddedPanel />

        <main id="inhalt" class="mshell__main">
            <slot />
        </main>

        <!-- After the page, before the footer; never while a sticky bar owns the bottom edge. -->
        <CompareTray :hidden="shell.stickyBar.value || frame.stickyBar.value" />

        <!-- The shop's one footer, as on every other page a phone opens (the client's #29, D-113). -->
        <SiteFooter v-if="footer" />

        <!-- The vehicle: its name and key numbers, then the three things one does with it. -->
        <BottomSheet v-if="vehicle" id="fahrzeug" v-model:open="vehicleSheet" title="Dein Fahrzeug">
            <p class="h4">{{ vehicle.label }}</p>
            <p class="small muted num">{{ vehicle.approval ?? `${vehicle.buildWindow} · ${vehicle.keyNumbers}` }}</p>
            <div class="mshell__vehicle-rows">
                <ListRow icon="wheel" title="Passende Felgen anzeigen" href="/felgen" manual @activate="fromVehicleSheet" />
                <ListRow icon="car" title="Fahrzeug ändern" :href="changeHref" manual @activate="fromVehicleSheet" />
                <ListRow icon="close" title="Fahrzeug entfernen" :chevron="false" @activate="removeVehicle" />
            </div>
        </BottomSheet>

        <SearchSheet />
        <CookieConsent />
        <Toast />
        <component :is="shopFeedback" v-if="shopFeedback && shared.reviewer" />
    </div>
</template>

<style scoped>
.mshell {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
}

/* No bar, no offset: sticky elements and anchor margins read the token below the shell. */
.mshell:not(.mshell--vbar) {
    --vbar-h: 0px;
}

/* The header holds still while a page slides in under it (the transitions below), as the phone bar did. */
.mshell :deep(.site-header) {
    view-transition-name: m-appbar;
}

/* The page's title under the header, where the phone bar's large title stood. */
.mshell__title {
    margin: 0;
    padding: var(--sp-8) var(--page-margin) var(--sp-16);
}

.mshell__main {
    flex: 1;
    min-width: 0;
    padding-bottom: env(safe-area-inset-bottom);
}

/* With the footer below it, the footer keeps clear of the home indicator (SiteFooter), not the page (#29). */
.mshell--footer .mshell__main {
    padding-bottom: 0;
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
