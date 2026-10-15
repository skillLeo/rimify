<script setup lang="ts">
/**
 * The header. Nothing above it (the client's #3, D-107); 80px on a desktop (the client's #2, D-106),
 * sticky, and never changes height — once the page has scrolled under it, it gains a hairline and
 * nothing else. On a phone it is 56px: the wordmark, then the search, the vehicle and the menu,
 * which carries the destinations a desktop shows in the navigation, and the basket with its count.
 *
 * Two rules it never breaks: the navigation is never removed, and the chosen vehicle is one
 * element in one place on every route (the vehicle bar beneath, decided by the server — R-08).
 *
 * While the shop shows demonstration rows, the *Demodaten* badge (ACCURACY D4) follows the wordmark
 * at every width. It sits in the flow of the row, so it cannot cover content at any width.
 */

import { Link, router, usePage } from '@inertiajs/vue3'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuSeparator, DropdownMenuTrigger } from 'reka-ui'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from '../Ui/Icon.vue'
import CartButton from './CartButton.vue'
import DemoBadge from './DemoBadge.vue'
import MainMenu from './MainMenu.vue'
import MegaMenu from './MegaMenu.vue'
import SearchBox from './SearchBox.vue'
import VehicleBar from './VehicleBar.vue'
import { useShell } from '../../composables/useShell'
import { useShared } from '../../composables/useShared'
import { useVehicleChangeHref } from '../../lib/vehicleChange'

const shared = useShared()
const shell = useShell()
const changeHref = useVehicleChangeHref()

const vehicle = computed(() => shared.value.vehicle)
const page = usePage()
/* The basket left of the menu on a phone (#13, D-122) — not on the basket and the checkout themselves. */
const showCart = computed(() => !/^\/(warenkorb|kasse)(\/|\?|$)/.test(page.url))

/* Scrolled or not, decided by a sentinel above the header rather than a scroll listener. */
const sentinel = ref<HTMLElement | null>(null)
const scrolled = ref(false)
let observer: IntersectionObserver | undefined

onMounted(() => {
    if (sentinel.value === null) {
        return
    }

    observer = new IntersectionObserver(([entry]) => {
        scrolled.value = entry ? !entry.isIntersecting : false
    })
    observer.observe(sentinel.value)
})

onBeforeUnmount(() => observer?.disconnect())

function removeVehicle(): void {
    router.delete('/fahrzeug', { preserveScroll: true })
}
</script>

<template>
    <!-- No strip above the header any more (the client's #3, D-107): its promises stand in the promise row under
         the hero, where to ask stands under the hero's selector. -->
    <div ref="sentinel" class="sh-sentinel" aria-hidden="true" />

    <header class="site-header" :class="{ 'site-header--scrolled': scrolled }">
        <div class="container sh__bar">
            <Link href="/" class="brand" aria-label="RIMIFY – Startseite" prefetch>RIMIFY</Link>

            <!-- The Demodaten badge beside the wordmark, at every width. -->
            <DemoBadge class="sh__demo" />

            <MegaMenu class="from-lg sh__nav" />

            <div class="sh__tools">
                <SearchBox class="from-lg sh__search" />

                <!-- From 1024 to 1279 px the search is this icon, and opens the palette as on a phone: the field needs the
                     room the menu's links leave it only from 1280. -->
                <button class="icon-btn sh__search-icon" type="button" aria-label="Suche" @click="shell.paletteOpen.value = true">
                    <Icon name="search" :size="24" />
                </button>

                <!-- The vehicle on a desktop: a chip with a small menu. -->
                <DropdownMenuRoot v-if="vehicle">
                    <!-- A chosen car is a selected chip: the brand's blue (#32, D-115). -->
                    <DropdownMenuTrigger class="chip chip--on sh__vchip from-lg">
                        <Icon name="car" :size="20" />
                        <span class="sh__vname">{{ vehicle.short }}</span>
                        <Icon name="chevron-down" :size="16" />
                    </DropdownMenuTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuContent class="popover sh__vmenu" align="end" :side-offset="8">
                            <p class="menu__label num">{{ vehicle.label }} · {{ vehicle.approval ?? vehicle.keyNumbers }}</p>
                            <DropdownMenuItem as-child>
                                <Link href="/felgen" class="menu__item" prefetch><Icon name="wheel" :size="20" />Passende Felgen anzeigen</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem as-child>
                                <Link :href="changeHref" class="menu__item"><Icon name="car" :size="20" />Fahrzeug ändern</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator class="menu__separator" />
                            <DropdownMenuItem class="menu__item" @select="removeVehicle">
                                <Icon name="close" :size="20" />Fahrzeug entfernen
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenuPortal>
                </DropdownMenuRoot>
                <Link v-else href="/felgen-suchen" class="chip sh__vchip from-lg">
                    <Icon name="car" :size="20" />
                    Fahrzeug wählen
                </Link>

                <!-- On a phone: the search and the vehicle as icons. -->
                <button class="icon-btn until-lg" type="button" aria-label="Suche" @click="shell.paletteOpen.value = true">
                    <Icon name="search" :size="24" />
                </button>
                <button
                    v-if="vehicle"
                    class="icon-btn until-lg sh__vicon"
                    type="button"
                    :aria-label="`Dein Fahrzeug: ${vehicle.label}`"
                    @click="shell.vehicleOpen.value = true"
                >
                    <Icon name="car" :size="24" />
                    <span class="sh__dot" aria-hidden="true" />
                </button>
                <Link v-else href="/felgen-suchen" class="icon-btn until-lg" aria-label="Fahrzeug wählen">
                    <Icon name="car" :size="24" />
                </Link>

                <!-- The basket, left of the menu, with its count (the client's #13, D-122). -->
                <CartButton v-if="showCart" class="until-lg" />

                <!-- The menu: on a phone the destinations live in it rather than in a bar across the bottom of
                     every page. -->
                <MainMenu class="until-lg" :count-on-button="!showCart" />

                <Link
                    href="/warenkorb"
                    class="sh__cart from-lg"
                    :aria-label="shared.cartCount > 0 ? `Warenkorb, ${shared.cartCount} Artikel` : 'Warenkorb'"
                    prefetch
                >
                    <span class="sh__cart-icon">
                        <Icon name="cart" :size="24" />
                        <span v-if="shared.cartCount > 0" class="badge badge--count sh__badge" aria-hidden="true">{{ shared.cartCount }}</span>
                    </span>
                    <span class="sh__cart-label">Warenkorb</span>
                </Link>
            </div>
        </div>

        <VehicleBar />
    </header>
</template>

<style scoped>
.sh-sentinel {
    height: 1px;
    margin-top: -1px;
}

.site-header {
    position: sticky;
    top: 0;
    z-index: var(--z-header);
    background: var(--c-surface);
}

.site-header--scrolled {
    box-shadow: var(--e-1);
}

.sh__bar {
    display: flex;
    align-items: center;
    gap: var(--sp-16);
    height: var(--header-h);
}

.brand {
    flex: none;
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    font-size: var(--fs-h4);
    font-weight: 700;
    font-stretch: var(--wdth-display);
    letter-spacing: 0.04em;
    color: var(--c-ink);
    text-decoration: none;
}

.sh__nav {
    margin-left: var(--sp-8);
}

/* Close to the wordmark it qualifies: half the row's gap, which also keeps 320px clear. */
.sh__demo {
    margin-left: calc(-1 * var(--sp-8));
}

.sh__tools {
    display: flex;
    align-items: center;
    gap: var(--sp-8);
    /* It may grow narrower than its content: the search field inside gives way (SearchBox), not the window. */
    min-width: 0;
    margin-left: auto;
}

/* Only the search field gives way where the bar is full; the car and the basket keep their size. */
.sh__vchip,
.sh__cart {
    flex-shrink: 0;
}

.sh__search-icon {
    display: none;
}

.sh__vchip {
    max-width: 220px;
    /* Level with the search field and the basket beside it. */
    min-height: 44px;
    text-decoration: none;
}

.sh__vname {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.sh__vicon {
    position: relative;
}

.sh__dot {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 8px;
    height: 8px;
    border-radius: var(--r-round);
    background: var(--c-blue);
}

.sh__cart {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-12);
    min-height: 44px;
    padding-inline: var(--sp-8);
    color: var(--c-ink);
    font-weight: 500;
    text-decoration: none;
}

@media (hover: hover) and (pointer: fine) {
    .sh__cart:hover {
        text-decoration: underline;
        text-underline-offset: 3px;
    }
}

.sh__cart-icon {
    position: relative;
    display: inline-flex;
}

.sh__badge {
    position: absolute;
    top: calc(-1 * var(--sp-8));
    right: calc(-1 * var(--sp-8));
}

/* The links of the bar stay on one line: „RIMIFY-Check“ broke in two at 1024 px. */
.sh__nav :deep(a),
.sh__nav :deep(button) {
    white-space: nowrap;
}

/*
 * From 1024 to 1279 px the bar holds the wordmark, four links, the search, the car and the basket, and was 21 px wider
 * than the window: „Warenkorb“ was cut off at its right edge (the sweep of 14.10.2026). There the basket keeps its icon
 * and its count — the link names itself to a screen reader — and the word comes back from 1280. With „Häufige Fragen“
 * for „FAQ“ (the copy review) it was 29 px wider again: there the search is an icon too, and the field comes back from
 * 1280 (the gate of 15.10.2026, D-244).
 */
@media (min-width: 1024px) and (max-width: 1279.98px) {
    .sh__cart-label,
    .sh__search {
        display: none;
    }

    .sh__search-icon {
        display: inline-flex;
    }
}

@media (min-width: 1024px) {
    /* The height is the token's, 72px here (tokens.css): only the row's spacing changes. */
    .sh__bar {
        gap: var(--sp-24);
    }

    /* The wordmark in proportion to the taller bar (#2, D-106). */
    .brand {
        font-size: var(--fs-h3);
    }
}
</style>

<!-- The vehicle menu is rendered in a portal, out of reach of a scoped attribute. -->
<style>
.sh__vmenu {
    min-width: 280px;
}
</style>
