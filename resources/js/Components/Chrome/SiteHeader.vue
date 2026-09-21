<script setup lang="ts">
/**
 * The header.
 *
 * White, sticky, one hairline, and it lifts only once the page has scrolled under it — the one
 * static-looking element allowed a shadow, because at that moment it genuinely floats above the
 * content.
 *
 * Two rules it must never break:
 *
 *  - The navigation is never removed. Choosing a vehicle changes what the pages show, not whether
 *    the customer can still reach the rest of the site.
 *  - The chosen vehicle is one chip, in one place, on every route. `headerMode` arrives from the
 *    server in the first response (R-08) and decides whether the chip is shown, never what shape
 *    it takes — a header that rearranges itself between pages reads as two different sites.
 */

import { Link } from '@inertiajs/vue3'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from '../Art/Icon.vue'
import { resolveHref, useMenus, useShared } from '../../composables/useShared'

const shared = useShared()
const menus = useMenus()

const vehicle = computed(() => shared.value.vehicle)
const showVehicle = computed(() => vehicle.value !== null && shared.value.headerMode !== 'SUPPRESSED')

const items = computed(() =>
    menus.value.header.map((item) => ({
        ...item,
        target: resolveHref(item.href, item.behaviour, vehicle.value !== null, '/felgen'),
    }))
)

defineEmits<{ (e: 'open-menu'): void; (e: 'open-vehicle'): void }>()

const lifted = ref(false)

// Passive, and it only ever flips a boolean: a scroll handler that writes layout would be the
// slowest thing on the page.
function onScroll(): void {
    lifted.value = window.scrollY > 4
}

onMounted(() => {
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
    <header class="hdr" :class="{ 'hdr--lifted': lifted }">
        <div class="hdr__bar">
            <button
                class="hdr__icon mobile-only"
                type="button"
                aria-label="Menü öffnen"
                @click="$emit('open-menu')"
            >
                <Icon name="menu" :size="24" />
            </button>

            <Link href="/" class="wordmark" aria-label="RIMIFY — Startseite">RIMIFY</Link>

            <nav class="hdr__nav" aria-label="Hauptnavigation">
                <Link
                    v-for="item in items"
                    :key="item.label"
                    :href="item.target"
                    class="hdr__link"
                    :aria-current="shared.routeName === item.routeName ? 'page' : undefined"
                >
                    {{ item.label }}
                </Link>
            </nav>

            <!-- The chosen vehicle. Same chip, same place, every route. -->
            <button
                v-if="showVehicle && vehicle"
                class="vchip desktop-only"
                type="button"
                @click="$emit('open-vehicle')"
            >
                <Icon name="wheel" :size="20" />
                <span class="vchip__name">{{ vehicle.label }}</span>
                <span class="vchip__keys">{{ vehicle.keyNumbers }}</span>
                <Icon name="chevron-down" :size="20" />
            </button>

            <Link href="/warenkorb" class="hdr__cart" aria-label="Warenkorb">
                <Icon name="cart" :size="24" />
                <span class="hdr__cart-label desktop-only">Warenkorb</span>
                <span v-if="shared.cartCount > 0" class="hdr__badge">{{ shared.cartCount }}</span>
            </Link>
        </div>

        <!-- On a phone the chip sits under the bar rather than inside it: at 390px there is no
             room for a vehicle name beside a wordmark and a basket without truncating all three. -->
        <div v-if="showVehicle && vehicle" class="hdr__vrow mobile-only">
            <button class="vchip vchip--full" type="button" @click="$emit('open-vehicle')">
                <Icon name="wheel" :size="20" />
                <span class="vchip__name">{{ vehicle.short }}</span>
                <span class="vchip__keys">{{ vehicle.keyNumbers }}</span>
                <Icon name="chevron-down" :size="20" />
            </button>
        </div>
    </header>
</template>

<style scoped>
.hdr--lifted {
    box-shadow: var(--shadow-raised);
}

.hdr__cart {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 44px;
    min-height: 44px;
    padding-inline: var(--space-2);
    margin-left: var(--space-3);
    color: var(--ink);
    font-size: var(--text-body);
    font-weight: 700;
    text-decoration: none;
}

.hdr__vrow {
    padding: 0 var(--gutter) var(--space-2);
}

.vchip {
    margin-left: var(--space-4);
}

.vchip--full {
    width: 100%;
    max-width: none;
    margin-left: 0;
}
</style>
