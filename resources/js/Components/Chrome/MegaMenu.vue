<script setup lang="ts">
/**
 * The desktop navigation. Felgen opens a panel across the full width under the header — by
 * brand, by size, by make, and four wheels people buy — on hover intent or on click and Enter;
 * it closes on Esc or after the pointer has left. Every other item is a plain link. Every entry
 * in the panel leads to a real listing; a brand or size with nothing behind it is not listed.
 */

import { Link } from '@inertiajs/vue3'
import {
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuRoot,
    NavigationMenuTrigger,
    NavigationMenuViewport,
} from 'reka-ui'
import { computed } from 'vue'
import Icon from '../Ui/Icon.vue'
import { resolveHref, useMenus, useShared } from '../../composables/useShared'

const shared = useShared()
const menus = useMenus()

const items = computed(() =>
    menus.value.header.map((item) => ({
        ...item,
        target: resolveHref(item.href, item.behaviour, shared.value.vehicle !== null, '/felgen'),
        current: shared.value.routeName === item.routeName,
        mega: item.routeName === 'felgen.index',
    }))
)

const mega = computed(() => shared.value.mega)
</script>

<template>
    <NavigationMenuRoot class="nav" :delay-duration="150" :skip-delay-duration="300">
        <NavigationMenuList class="nav__list">
            <NavigationMenuItem v-for="item in items" :key="item.label">
                <template v-if="item.mega">
                    <NavigationMenuTrigger class="nav__link nav__trigger" :class="{ 'nav__link--current': item.current }">
                        {{ item.label }}
                        <Icon name="chevron-down" :size="16" class="nav__chevron" />
                    </NavigationMenuTrigger>
                    <NavigationMenuContent class="mega">
                        <div class="container mega__grid">
                            <div class="mega__col">
                                <p class="label">Nach Marke</p>
                                <ul>
                                    <li v-for="brand in mega.brands" :key="brand.href">
                                        <NavigationMenuLink as-child>
                                            <Link :href="brand.href" class="mega__link" prefetch>{{ brand.label }}</Link>
                                        </NavigationMenuLink>
                                    </li>
                                </ul>
                            </div>
                            <div class="mega__col">
                                <p class="label">Nach Größe</p>
                                <ul>
                                    <li v-for="size in mega.sizes" :key="size.href">
                                        <NavigationMenuLink as-child>
                                            <Link :href="size.href" class="mega__link" prefetch>
                                                <span class="num">{{ size.label }}</span>
                                                <span class="small quiet num">{{ size.count }} {{ size.count === 1 ? 'Modell' : 'Modelle' }}</span>
                                            </Link>
                                        </NavigationMenuLink>
                                    </li>
                                </ul>
                            </div>
                            <div class="mega__col">
                                <p class="label">Nach Fahrzeug</p>
                                <ul>
                                    <li v-for="make in mega.makes" :key="make.href">
                                        <NavigationMenuLink as-child>
                                            <Link :href="make.href" class="mega__link">{{ make.label }}</Link>
                                        </NavigationMenuLink>
                                    </li>
                                </ul>
                            </div>
                            <div class="mega__col">
                                <p class="label">Beliebt</p>
                                <ul>
                                    <li v-for="wheel in mega.popular" :key="wheel.href">
                                        <NavigationMenuLink as-child>
                                            <Link :href="wheel.href" class="mega__link" prefetch>
                                                <span>{{ wheel.label }}</span>
                                                <span class="small quiet">{{ wheel.sub }}</span>
                                            </Link>
                                        </NavigationMenuLink>
                                    </li>
                                </ul>
                                <NavigationMenuLink as-child>
                                    <Link href="/felgen" class="mega__all" prefetch>Alle Felgen ansehen <Icon name="arrow-right" :size="16" /></Link>
                                </NavigationMenuLink>
                            </div>
                        </div>
                    </NavigationMenuContent>
                </template>
                <NavigationMenuLink v-else as-child>
                    <Link :href="item.target" class="nav__link" :aria-current="item.current ? 'page' : undefined" prefetch>
                        {{ item.label }}
                    </Link>
                </NavigationMenuLink>
            </NavigationMenuItem>
        </NavigationMenuList>

        <div class="nav__viewport-wrap">
            <NavigationMenuViewport class="nav__viewport" />
        </div>
    </NavigationMenuRoot>
</template>

<!-- Not scoped: the list, the panel and its links are rendered by the menu primitive, so a scoped
     attribute would never reach them. Every selector is prefixed .nav or .mega instead. -->
<style>
.nav {
    display: flex;
    align-items: center;
    height: var(--header-h);
}

.nav__list {
    display: flex;
    align-items: center;
    gap: var(--sp-4);
    height: 100%;
}

.nav__link {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--sp-4);
    height: var(--header-h);
    padding: 0 var(--sp-12);
    border: 0;
    background: transparent;
    color: var(--c-ink-2);
    font-size: var(--fs-body);
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    transition: color var(--d-1) var(--ease-std);
}

@media (hover: hover) and (pointer: fine) {
    .nav__link:hover {
        color: var(--c-ink);
    }
}

/* The current page and an open panel are marked with a rule, not by colour alone. */
.nav__link[aria-current='page'],
.nav__link--current,
.nav__trigger[data-state='open'] {
    color: var(--c-ink);
}

.nav__link[aria-current='page']::after,
.nav__link--current::after,
.nav__trigger[data-state='open']::after {
    content: '';
    position: absolute;
    left: var(--sp-12);
    right: var(--sp-12);
    bottom: 0;
    height: 2px;
    background: var(--c-ink);
}

.nav__chevron {
    color: var(--c-ink-3);
    transition: transform var(--d-2) var(--ease-std);
}

.nav__trigger[data-state='open'] .nav__chevron {
    transform: rotate(180deg);
}

/* The panel spans the header's full width, directly beneath it. */
.nav__viewport-wrap {
    position: absolute;
    top: var(--header-h);
    left: 0;
    right: 0;
    z-index: var(--z-dropdown);
}

.nav__viewport {
    width: 100%;
    background: var(--c-surface);
    box-shadow: var(--e-2);
    overflow: hidden;
}

.nav__viewport[data-state='open'] {
    animation: fade-in var(--d-2) var(--ease-out);
}

.nav__viewport[data-state='closed'] {
    animation: fade-out var(--d-2) var(--ease-in);
}

@keyframes fade-in {
    from {
        opacity: 0;
    }
}

@keyframes fade-out {
    to {
        opacity: 0;
    }
}

.mega__grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--sp-32);
    padding-block: var(--sp-32) var(--sp-40);
}

.mega__col {
    display: grid;
    align-content: start;
    gap: var(--sp-8);
}

.mega__col ul {
    display: grid;
}

.mega__link {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-12);
    min-height: 36px;
    padding: var(--sp-4) 0;
    color: var(--c-ink);
    text-decoration: none;
}

@media (hover: hover) and (pointer: fine) {
    .mega__link:hover {
        text-decoration: underline;
        text-underline-offset: 3px;
    }
}

.mega__all {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-4);
    min-height: 36px;
    margin-top: var(--sp-8);
    color: var(--c-blue);
    font-weight: 500;
    text-decoration: none;
}

@media (hover: hover) and (pointer: fine) {
    .mega__all:hover {
        text-decoration: underline;
        text-underline-offset: 3px;
    }
}
</style>
