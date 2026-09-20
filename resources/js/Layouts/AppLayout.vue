<script setup lang="ts">
/**
 * The storefront frame: header, page, footer, and the bottom bar on a phone.
 *
 * The burger sheet and the vehicle panel live here rather than in the header so that `Esc` has one
 * owner and focus returns to one place — a sheet that traps focus and a sheet that loses it are
 * equally broken, and both are the kind of thing that only shows up under a keyboard.
 */

import { Link } from '@inertiajs/vue3'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import BottomNav from '../Components/Chrome/BottomNav.vue'
import Icon from '../Components/Art/Icon.vue'
import SiteFooter from '../Components/Chrome/SiteFooter.vue'
import SiteHeader from '../Components/Chrome/SiteHeader.vue'
import Toast from '../Components/Chrome/Toast.vue'
import { resolveHref, useMenus, useShared } from '../composables/useShared'

withDefaults(defineProps<{ title?: string }>(), { title: undefined })

const shared = useShared()
const menus = useMenus()

const menuOpen = ref(false)
const vehicleOpen = ref(false)

const sheetItems = computed(() =>
    menus.value.header.map((item) => ({
        ...item,
        target: resolveHref(item.href, item.behaviour, shared.value.vehicle !== null, '/felgen'),
    }))
)

function closeAll(): void {
    menuOpen.value = false
    vehicleOpen.value = false
}

function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
        closeAll()
    }
}

// The listener is attached in onMounted, never at module scope: the SSR pass has no `document`,
// and a layout that reaches for one there takes the whole first render down.
onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

// Any navigation closes whatever is open — otherwise a sheet survives the page beneath it.
watch(() => shared.value.routeName, closeAll)
</script>

<template>
    <div class="shell">
        <a class="skip-link" href="#inhalt">Zum Inhalt springen</a>

        <SiteHeader @open-menu="menuOpen = true" @open-vehicle="vehicleOpen = true" />

        <main id="inhalt" class="shell__main" :class="{ 'has-bnav': shared.isMobile }">
            <slot />
        </main>

        <SiteFooter />

        <!-- Gated on the server-side device split rather than hidden with CSS: the desktop page
             should not ship markup it can never show, and `isMobile` is already decided before
             the first byte. -->
        <BottomNav v-if="shared.isMobile" />

        <!-- The burger sheet: full height, the same items as the desktop nav. -->
        <template v-if="menuOpen">
            <div class="scrim" @click="closeAll" />
            <div class="sheet sheet--menu" role="dialog" aria-modal="true" aria-label="Menü">
                <div class="sheet__grab" />
                <div class="between">
                    <span class="t-h3">Menü</span>
                    <button class="hdr__icon sheet__close" type="button" aria-label="Schließen" @click="closeAll">
                        <Icon name="close" :size="24" />
                    </button>
                </div>
                <nav class="sheet__nav">
                    <Link v-for="item in sheetItems" :key="item.label" :href="item.target" class="sheet__link">
                        {{ item.label }}
                        <Icon name="chevron-right" :size="20" />
                    </Link>
                </nav>
            </div>
        </template>

        <!-- The vehicle panel. Two actions, both of which the customer can reverse. -->
        <template v-if="vehicleOpen && shared.vehicle">
            <div class="scrim" @click="closeAll" />
            <div class="sheet" role="dialog" aria-modal="true" aria-label="Fahrzeug">
                <div class="sheet__grab" />
                <span class="micro">Gewähltes Fahrzeug</span>
                <p class="t-h3 sheet__vehicle">{{ shared.vehicle.label }}</p>
                <p class="data">{{ shared.vehicle.keyNumbers }} · {{ shared.vehicle.buildWindow }}</p>
                <div class="sheet__actions">
                    <Link href="/felgen-suchen" class="btn btn--primary btn--block">Fahrzeug ändern</Link>
                    <Link
                        href="/fahrzeug"
                        method="delete"
                        as="button"
                        class="btn btn--secondary btn--block"
                    >
                        Fahrzeug entfernen
                    </Link>
                </div>
            </div>
        </template>

        <Toast />
    </div>
</template>

<style scoped>
.shell {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

.shell__main {
    flex: 1;
    min-width: 0;
}

.sheet--menu {
    max-height: 100vh;
    height: 100%;
    border-radius: 0;
}

.sheet__close {
    color: var(--ink);
}

.sheet__nav {
    display: grid;
    margin-top: var(--s4);
}

.sheet__link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 56px;
    color: var(--ink);
    font-size: 17px;
    font-weight: 700;
    text-decoration: none;
    border-bottom: 1px solid var(--line-s);
}

.sheet__vehicle {
    margin: var(--s2) 0 4px;
}

.sheet__actions {
    display: grid;
    gap: var(--s2);
    margin-top: var(--s5);
}
</style>
