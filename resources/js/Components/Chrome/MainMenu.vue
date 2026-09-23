<script setup lang="ts">
/**
 * The phone's navigation, in the corner of the header.
 *
 * It replaces the bottom bar both documents used to carry. A shop is not an app: a fixed bar at
 * the bottom of every page costs a row of content, sits where the browser's own chrome already
 * is, and reads as a native app rather than a shop. The destinations are the same ones the admin
 * maintains — the phone list first, in its own order, then anything the header menu has that the
 * phone list does not, so a page can never be reachable on a desktop and missing here.
 *
 * The basket lives in it like every other destination, and its count rides the button, because a
 * phone bar that also carries a basket icon runs out of room at 390 px — five targets and a
 * wordmark do not fit, and the ones that fall off the end are the ones nobody finds. The current
 * page is marked rather than hidden, so the menu always shows where you are.
 */

import { Link } from '@inertiajs/vue3'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from 'reka-ui'
import { computed } from 'vue'
import Icon from '../Ui/Icon.vue'
import { isIconName, type IconName } from '../../icons'
import { useMenus, useShared } from '../../composables/useShared'

const shared = useShared()
const menus = useMenus()

/**
 * The admin gives the phone list its icons; the header list has none, because a desktop menu shows
 * words. Rather than draw a chevron beside a word, the known storefront routes fall back to the
 * icon they already wear elsewhere in the shop.
 */
const ROUTE_ICONS: Record<string, IconName> = {
    startseite: 'home',
    'felgen.index': 'wheel',
    'felgen.suchen': 'car',
    'check.index': 'check-circle',
    'warenkorb.index': 'cart',
    kontakt: 'mail',
    faq: 'info',
    ratgeber: 'document',
    rechtliches: 'document',
}

function iconFor(item: { icon: string | null; routeName: string | null }): IconName {
    if (item.icon !== null && isIconName(item.icon)) {
        return item.icon
    }

    return (item.routeName !== null ? ROUTE_ICONS[item.routeName] : undefined) ?? 'chevron-right'
}

const items = computed(() => {
    const phone = menus.value.mobile_bottom
    const known = new Set(phone.map((item) => item.href))
    const rest = menus.value.header.filter((item) => !known.has(item.href))

    return [...phone, ...rest].map((item) => ({
        ...item,
        iconName: iconFor(item),
        current: item.routeName !== null && item.routeName === shared.value.routeName,
        isCart: item.routeName === 'warenkorb.index',
    }))
})

const cartCount = computed(() => shared.value.cartCount)
</script>

<template>
    <DropdownMenuRoot>
        <DropdownMenuTrigger
            class="icon-btn m-press mainmenu__trigger"
            :aria-label="cartCount > 0 ? `Menü, ${cartCount} Artikel im Warenkorb` : 'Menü'"
        >
            <Icon name="menu" :size="24" />
            <span v-if="cartCount > 0" class="badge badge--count mainmenu__badge" aria-hidden="true">{{ cartCount }}</span>
        </DropdownMenuTrigger>

        <DropdownMenuPortal>
            <DropdownMenuContent class="popover mainmenu" align="end" :side-offset="8" aria-label="Hauptnavigation">
                <DropdownMenuItem v-for="item in items" :key="item.href" as-child>
                    <Link
                        :href="item.href"
                        class="menu__item mainmenu__item"
                        :aria-current="item.current ? 'page' : undefined"
                        prefetch
                    >
                        <Icon :name="item.iconName" :size="20" />
                        <span class="mainmenu__label">{{ item.label }}</span>
                        <span v-if="item.isCart && cartCount > 0" class="badge badge--count mainmenu__count">{{ cartCount }}</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenuPortal>
    </DropdownMenuRoot>
</template>

<style scoped>
.mainmenu__trigger {
    position: relative;
}

/* The count rides the button: a full basket is visible before the menu is opened. */
.mainmenu__badge {
    position: absolute;
    top: var(--sp-4);
    right: var(--sp-4);
    pointer-events: none;
}

.mainmenu__item[aria-current='page'] {
    color: var(--c-blue);
}

.mainmenu__label {
    flex: 1;
    min-width: 0;
}

.mainmenu__count {
    margin-left: var(--sp-8);
}
</style>

<!-- The menu is rendered in a portal, out of reach of a scoped attribute. -->
<style>
.mainmenu {
    min-width: 232px;
}
</style>
