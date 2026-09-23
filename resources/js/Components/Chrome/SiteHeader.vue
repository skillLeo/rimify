<script setup lang="ts">
/**
 * The header. Above it, on a desktop, a utility line that scrolls away; the header itself is 64px,
 * sticky, and never changes height — once the page has scrolled under it, it gains a hairline and
 * nothing else. On a phone it is 56px: the wordmark, then the search, the vehicle and the menu,
 * which carries the destinations a desktop shows in the navigation, and the basket with its count.
 *
 * Two rules it never breaks: the navigation is never removed, and the chosen vehicle is one
 * element in one place on every route (the vehicle bar beneath, decided by the server — R-08).
 *
 * While the shop shows demonstration rows, the *Demodaten* badge (ACCURACY D4) opens the utility
 * line on a desktop and follows the wordmark below 1024 px, where that line is gone. Both sit in
 * the flow of their row, so neither can cover content at any width.
 */

import { Link, router } from '@inertiajs/vue3'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuSeparator, DropdownMenuTrigger } from 'reka-ui'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from '../Ui/Icon.vue'
import DemoBadge from './DemoBadge.vue'
import MainMenu from './MainMenu.vue'
import MegaMenu from './MegaMenu.vue'
import SearchBox from './SearchBox.vue'
import VehicleBar from './VehicleBar.vue'
import { useShell } from '../../composables/useShell'
import { useShared } from '../../composables/useShared'

const shared = useShared()
const shell = useShell()

const vehicle = computed(() => shared.value.vehicle)
const contact = computed(() => shared.value.contact)
/* The phone only when the client has given one; otherwise the e-mail is the help line. */
const telHref = computed(() => `tel:${(contact.value.phoneIntl ?? contact.value.phone ?? '').replace(/\s/g, '')}`)

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
    <div class="utility from-lg">
        <div class="container utility__row">
            <DemoBadge />
            <span>Versand aus Deutschland</span>
            <!-- The client's own words. "als PDF" returns only once a download exists (ACCURACY D7). -->
            <span>Gutachten zu jeder Felge</span>
            <span class="utility__help">
                Hilfe:
                <a v-if="contact.phone" :href="telHref" class="utility__contact num">{{ contact.phone }}</a>
                <a v-else :href="`mailto:${contact.email}`" class="utility__contact">{{ contact.email }}</a>
                <!-- The space sits inside the span: between two elements on separate lines the template drops it. -->
                <span class="quiet"> · {{ contact.hours }}</span>
            </span>
        </div>
    </div>

    <div ref="sentinel" class="sh-sentinel" aria-hidden="true" />

    <header class="site-header" :class="{ 'site-header--scrolled': scrolled }">
        <div class="container sh__bar">
            <Link href="/" class="brand" aria-label="RIMIFY – Startseite" prefetch>RIMIFY</Link>

            <!-- On a phone and a tablet the utility strip is gone, so the badge sits beside the wordmark. -->
            <DemoBadge class="until-lg sh__demo" />

            <MegaMenu class="from-lg sh__nav" />

            <div class="sh__tools">
                <SearchBox class="from-lg" />

                <!-- The vehicle on a desktop: a chip with a small menu. -->
                <DropdownMenuRoot v-if="vehicle">
                    <DropdownMenuTrigger class="chip sh__vchip from-lg">
                        <Icon name="car" :size="20" />
                        <span class="sh__vname">{{ vehicle.short }}</span>
                        <Icon name="chevron-down" :size="16" />
                    </DropdownMenuTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuContent class="popover sh__vmenu" align="end" :side-offset="8">
                            <p class="menu__label num">{{ vehicle.label }} · {{ vehicle.keyNumbers }}</p>
                            <DropdownMenuItem as-child>
                                <Link href="/felgen" class="menu__item" prefetch><Icon name="wheel" :size="20" />Passende Felgen anzeigen</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem as-child>
                                <Link href="/felgen-suchen" class="menu__item"><Icon name="car" :size="20" />Fahrzeug ändern</Link>
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

                <!-- The menu: on a phone the destinations and the basket live in it rather than in
                     a bar across the bottom of every page. -->
                <MainMenu class="until-lg" />

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
                    <span>Warenkorb</span>
                </Link>
            </div>
        </div>

        <VehicleBar />
    </header>
</template>

<style scoped>
.utility {
    height: var(--utility-h);
    background: var(--c-band);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.utility__row {
    display: flex;
    align-items: center;
    gap: var(--sp-24);
    height: 100%;
}

.utility__help {
    margin-left: auto;
}

.utility__contact {
    color: var(--c-ink);
    font-weight: 500;
    text-decoration: none;
}

@media (hover: hover) and (pointer: fine) {
    .utility__contact:hover {
        text-decoration: underline;
        text-underline-offset: 3px;
    }
}

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
    height: var(--header-h-m);
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
    margin-left: auto;
}

.sh__vchip {
    max-width: 220px;
    min-height: 40px;
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

@media (min-width: 1024px) {
    .sh__bar {
        height: var(--header-h);
        gap: var(--sp-24);
    }
}
</style>

<!-- The vehicle menu is rendered in a portal, out of reach of a scoped attribute. -->
<style>
.sh__vmenu {
    min-width: 280px;
}
</style>
