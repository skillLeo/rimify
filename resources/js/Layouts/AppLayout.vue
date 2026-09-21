<script setup lang="ts">
/**
 * The storefront frame: header, page, footer, and the two overlays the header can open.
 *
 * There is no bottom tab bar. Navigation on a phone lives in a drawer behind the menu button:
 * a fixed bar would spend a fifth of an 844px screen on chrome that is used occasionally, and the
 * product page needs the bottom edge for its price and its one real action.
 *
 * Both overlays live here rather than in the header so that Esc has one owner and focus returns
 * to one place.
 */

import { Link } from '@inertiajs/vue3'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
const anyOpen = computed(() => menuOpen.value || vehicleOpen.value)

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

// Attached on mount, never at module scope: the SSR pass has no `document`, and a layout that
// reaches for one there takes the whole first render down.
onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeydown)
    document.body.style.removeProperty('overflow')
})

// The page behind an overlay does not scroll; otherwise a flick on the scrim moves the page under
// the drawer and the customer loses their place.
watch(anyOpen, (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
})

// Any navigation closes whatever is open — otherwise a drawer survives the page beneath it.
watch(() => shared.value.routeName, closeAll)
</script>

<template>
    <div class="shell">
        <a class="skip-link" href="#inhalt">Zum Inhalt springen</a>

        <SiteHeader @open-menu="menuOpen = true" @open-vehicle="vehicleOpen = true" />

        <main id="inhalt" class="shell__main">
            <slot />
        </main>

        <SiteFooter />

        <!-- Navigation: a drawer from the edge, full height, the same items as the desktop nav. -->
        <template v-if="menuOpen">
            <div class="scrim" @click="closeAll" />
            <div class="drawer" role="dialog" aria-modal="true" aria-label="Menü">
                <div class="between">
                    <span class="t-h3">Menü</span>
                    <button class="hdr__icon" type="button" aria-label="Schließen" @click="closeAll">
                        <Icon name="close" :size="24" />
                    </button>
                </div>
                <nav class="drawer__nav">
                    <Link
                        v-for="item in sheetItems"
                        :key="item.label"
                        :href="item.target"
                        class="drawer__link"
                    >
                        {{ item.label }}
                        <Icon name="chevron-right" :size="20" />
                    </Link>
                </nav>
            </div>
        </template>

        <!-- The vehicle: a transient choice, so a sheet rather than a drawer. Two actions, both
             reversible. -->
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

.drawer__nav {
    display: grid;
    margin-top: var(--space-4);
}

.drawer__link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 56px;
    color: var(--ink);
    font-size: var(--text-lead);
    font-weight: 700;
    text-decoration: none;
    border-bottom: 1px solid var(--line-s);
}

.sheet__vehicle {
    margin: var(--space-2) 0 var(--space-1);
}

.sheet__actions {
    display: grid;
    gap: var(--space-2);
    margin-top: var(--space-5);
}
</style>
