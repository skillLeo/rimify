<script setup lang="ts">
/**
 * The storefront frame: header, page, footer, the phone's bottom bar, and the overlays the shell
 * owns — the palette, the shortcut list, the vehicle sheet, the cookie choice, the toast.
 *
 * Everything the shell shares between its parts is provided here, so the footer's
 * "Cookie-Einstellungen" and the header's search icon open the very same dialogs. Every
 * navigation closes whatever is open, and so does the back button.
 */

import { Link, router } from '@inertiajs/vue3'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import BottomNav from '../Components/Chrome/BottomNav.vue'
import CommandPalette from '../Components/Chrome/CommandPalette.vue'
import CookieConsent from '../Components/Chrome/CookieConsent.vue'
import ShortcutsDialog from '../Components/Chrome/ShortcutsDialog.vue'
import SiteFooter from '../Components/Chrome/SiteFooter.vue'
import SiteHeader from '../Components/Chrome/SiteHeader.vue'
import Toast from '../Components/Chrome/Toast.vue'
import CompareTray from '../Components/Compare/CompareTray.vue'
import Dialog from '../Components/Ui/Dialog.vue'
import { provideConsent } from '../composables/useConsent'
import { provideShell } from '../composables/useShell'
import { useShortcuts } from '../composables/useShortcuts'
import { useShared } from '../composables/useShared'

withDefaults(defineProps<{ title?: string }>(), { title: undefined })

const shared = useShared()
const shell = provideShell()
provideConsent(shared.value.consent ?? null)

const vehicle = computed(() => shared.value.vehicle)
const vehicleSheet = computed({
    get: () => shell.vehicleOpen.value && vehicle.value !== null,
    set: (open: boolean) => {
        shell.vehicleOpen.value = open
    },
})

useShortcuts({
    onSearch: () => shell.focusSearch(),
    onPalette: () => {
        shell.paletteOpen.value = !shell.paletteOpen.value
    },
    onHelp: () => {
        shell.helpOpen.value = true
    },
})

function closeAll(): void {
    shell.paletteOpen.value = false
    shell.helpOpen.value = false
    shell.vehicleOpen.value = false
}

let stopNavigate: (() => void) | undefined

onMounted(() => {
    stopNavigate = router.on('navigate', closeAll)
})

onBeforeUnmount(() => stopNavigate?.())

function removeVehicle(): void {
    router.delete('/fahrzeug', { preserveScroll: true })
}
</script>

<template>
    <!-- The bar's height is a token; when the server shows no bar, the offsets that add it
         (sticky elements, anchor margins) must add nothing. Decided by the server-side header
         mode, so the SSR frame and the client agree (R-08). -->
    <div class="shell" :class="{ 'shell--vbar': vehicle !== null && (shared.headerMode === 'WHITE_BOX' || shared.headerMode === 'BLUE_BAR') }">
        <a class="skip-link" href="#inhalt">Zum Inhalt springen</a>

        <SiteHeader />

        <main id="inhalt" class="shell__main">
            <slot />
        </main>

        <!-- After the page, before the footer: Tab reaches it after the content. -->
        <CompareTray />

        <SiteFooter />
        <BottomNav />

        <!-- The vehicle on a phone: a sheet with the three things one does with it. -->
        <Dialog v-if="vehicle" v-model:open="vehicleSheet" variant="sheet" title="Dein Fahrzeug">
            <p class="h4">{{ vehicle.label }}</p>
            <p class="small muted num">{{ vehicle.buildWindow }} · {{ vehicle.keyNumbers }}</p>
            <div class="shell__vehicle-actions">
                <Link href="/felgen" class="btn btn--primary btn--block" prefetch>Passende Felgen anzeigen</Link>
                <Link href="/felgen-suchen" class="btn btn--secondary btn--block">Fahrzeug ändern</Link>
                <button class="btn btn--ghost btn--block" type="button" @click="removeVehicle">Fahrzeug entfernen</button>
            </div>
        </Dialog>

        <CommandPalette />
        <ShortcutsDialog />
        <CookieConsent />
        <Toast />
    </div>
</template>

<style scoped>
.shell {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
}

/* No bar, no offset: sticky elements and anchor margins read the token below the shell. */
.shell:not(.shell--vbar) {
    --vbar-h: 0px;
}

.shell__main {
    flex: 1;
    min-width: 0;
}

/* The phone's bottom bar takes the bottom edge; the page keeps clear of it. */
@media (max-width: 1023px) {
    .shell__main {
        padding-bottom: calc(var(--bottomnav-h) + env(safe-area-inset-bottom));
    }
}

.shell__vehicle-actions {
    display: grid;
    gap: var(--sp-8);
    margin-top: var(--sp-20);
}
</style>
