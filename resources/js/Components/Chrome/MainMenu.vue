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
 *
 * „Felgen“ opens in place on the groups of the desktop's dropdown (MegaMenu), from the same shared rows, so a person finds a
 * rim by brand, size or make from here too (the client's #31). A press opens it and leaves the page; „Alle Felgen ansehen“ goes
 * to the listing. A catalogue with nothing to group keeps the plain link.
 */

import { Link, router } from '@inertiajs/vue3'
import { DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from 'reka-ui'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from '../Ui/Icon.vue'
import { isIconName, type IconName } from '../../icons'
import { useMenus, useShared } from '../../composables/useShared'
import { formatNumber } from '../../lib/num'

/*
 * DropdownMenuRoot renders no element of its own, so an attribute passed to this component has
 * nothing to land on and Vue drops it silently. `<MainMenu class="until-lg" />` therefore did
 * nothing, and the menu button stood in the desktop header beside the navigation it duplicates,
 * pushing the tools row 30px past the page at 1024. Attributes go to the trigger, which is the
 * element a caller means when it positions or hides "the menu".
 */
defineOptions({ inheritAttrs: false })

/*
 * Where the basket button stands beside the menu (#13), it carries the count; the menu button then does not, so the
 * header never shows the same number twice. Inside the menu the basket row keeps its count.
 */
const props = withDefaults(defineProps<{ countOnButton?: boolean }>(), { countOnButton: true })

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

/* The desktop's groups, in its order and its words (MegaMenu.vue); an empty one is not shown. */
const groups = computed(() => {
    const mega = shared.value.mega

    if (!mega) {
        return []
    }

    return [
        { label: 'Nach Marke', layout: 'two', rows: mega.brands.map((row) => ({ href: row.href, label: row.label, note: null as string | null, spoken: null as string | null, prefetch: true })) },
        { label: 'Nach Größe', layout: 'row', rows: mega.sizes.map((row) => ({ href: row.href, label: row.label, note: formatNumber(row.count ?? 0), spoken: row.count === 1 ? ' Modell' : ' Modelle', prefetch: true })) },
        { label: 'Nach Fahrzeug', layout: 'two', rows: mega.makes.map((row) => ({ href: row.href, label: row.label, note: null as string | null, spoken: null as string | null, prefetch: false })) },
        { label: 'Günstigste Modelle', layout: 'one', rows: mega.popular.map((row) => ({ href: row.href, label: row.label, note: row.sub ?? null, spoken: null as string | null, prefetch: true })) },
    ].filter((group) => group.rows.length > 0)
})

const open = ref(false)
const felgenOpen = ref(false)

function changed(now: boolean): void {
    open.value = now

    if (!now) {
        felgenOpen.value = false
    }
}

/*
 * Back and Forward leave it open over the other page, and a window turned past the desktop's width leaves it open with its button
 * gone: either way nothing is left to close it by. The height moves as a phone's address bar does, and is no reason.
 */
let stopListening = (): void => {}
let width = 0

function resized(): void {
    if (window.innerWidth !== width) {
        width = window.innerWidth
        changed(false)
    }
}

onMounted(() => {
    width = window.innerWidth
    const off = router.on('navigate', () => changed(false))

    window.addEventListener('resize', resized)
    stopListening = () => {
        off()
        window.removeEventListener('resize', resized)
    }
})

onBeforeUnmount(() => stopListening())

const items = computed(() => {
    const phone = menus.value.mobile_bottom
    const known = new Set(phone.map((item) => item.href))
    const rest = menus.value.header.filter((item) => !known.has(item.href))

    return [...phone, ...rest].map((item) => ({
        ...item,
        iconName: iconFor(item),
        current: item.routeName !== null && item.routeName === shared.value.routeName,
        isCart: item.routeName === 'warenkorb.index',
        opens: item.routeName === 'felgen.index' && groups.value.length > 0,
    }))
})

const cartCount = computed(() => shared.value.cartCount)
</script>

<template>
    <DropdownMenuRoot :open="open" @update:open="changed">
        <DropdownMenuTrigger
            v-bind="$attrs"
            class="icon-btn m-press mainmenu__trigger"
            :aria-label="props.countOnButton && cartCount > 0 ? `Menü, ${cartCount} Artikel im Warenkorb` : 'Menü'"
        >
            <Icon name="menu" :size="24" />
            <span v-if="props.countOnButton && cartCount > 0" class="badge badge--count mainmenu__badge" aria-hidden="true">{{ cartCount }}</span>
        </DropdownMenuTrigger>

        <DropdownMenuPortal>
            <DropdownMenuContent class="popover mainmenu" align="end" :side-offset="8" :collision-padding="8" aria-label="Hauptnavigation">
                <template v-for="item in items" :key="item.href">
                    <template v-if="item.opens">
                        <DropdownMenuItem
                            class="menu__item mainmenu__item"
                            :aria-expanded="felgenOpen"
                            :aria-current="item.current ? 'page' : undefined"
                            @select="(event: Event) => { event.preventDefault(); felgenOpen = !felgenOpen }"
                        >
                            <Icon :name="item.iconName" :size="20" />
                            <span class="mainmenu__label">{{ item.label }}</span>
                            <Icon name="chevron-down" :size="16" class="mainmenu__chevron" :class="{ 'mainmenu__chevron--open': felgenOpen }" />
                        </DropdownMenuItem>
                        <div v-if="felgenOpen" class="mainmenu__sub">
                            <!-- First: a long list's rounded edge reads as its end, and this is the way out of choosing. -->
                            <DropdownMenuItem as-child>
                                <Link href="/felgen" class="menu__item mainmenu__row mainmenu__all" prefetch>
                                    Alle Felgen ansehen
                                    <Icon name="arrow-right" :size="16" />
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuGroup v-for="group in groups" :key="group.label">
                                <DropdownMenuLabel class="mainmenu__group">{{ group.label }}</DropdownMenuLabel>
                                <div class="mainmenu__rows" :class="`mainmenu__rows--${group.layout}`">
                                    <DropdownMenuItem v-for="row in group.rows" :key="row.href" as-child>
                                        <Link :href="row.href" class="menu__item mainmenu__row" :prefetch="row.prefetch">
                                            <span class="mainmenu__label" :class="{ num: group.layout === 'row' }">{{ row.label }}</span>
                                            <span v-if="row.note" class="small quiet" :class="{ num: group.layout === 'row' }">{{ row.note }}<span v-if="row.spoken" class="visually-hidden">{{ row.spoken }}</span></span>
                                        </Link>
                                    </DropdownMenuItem>
                                </div>
                            </DropdownMenuGroup>
                        </div>
                    </template>
                    <DropdownMenuItem v-else as-child>
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
                </template>
            </DropdownMenuContent>
        </DropdownMenuPortal>
    </DropdownMenuRoot>
</template>

<style scoped>
/* It stands in the sticky header, and its id would give it the anchors' margin: the focus coming back on closing moved the page. */
.mainmenu__trigger {
    position: relative;
    scroll-margin-top: 0;
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
    overflow-wrap: anywhere;
}

.mainmenu__count {
    margin-left: var(--sp-8);
}

.mainmenu__chevron {
    flex: none;
    color: var(--c-ink-2);
    transition: transform var(--d-1) var(--ease-std);
}

.mainmenu__chevron--open {
    transform: rotate(180deg);
}

/* Under its word, as the desktop's panel is under its: indented to the labels above, so the rows read as Felgen's. */
.mainmenu__sub {
    /* The row's padding, its icon and the gap beside it. */
    --mainmenu-indent: calc(var(--sp-12) + var(--sp-20) + var(--sp-12));

    display: grid;
    gap: var(--sp-4);
    margin-bottom: var(--sp-8);
    padding-block: var(--sp-4) var(--sp-8);
    border-bottom: 1px solid var(--c-line);
}

.mainmenu__group {
    padding: var(--sp-16) var(--sp-12) 0 var(--mainmenu-indent);
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 500;
}

.mainmenu__rows {
    display: grid;
    margin-left: calc(var(--mainmenu-indent) - var(--sp-12));
}

.mainmenu__rows--two {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.mainmenu__rows--row {
    display: flex;
    flex-wrap: wrap;
}

.mainmenu__rows--row .mainmenu__label {
    flex: none;
}

.mainmenu__all {
    margin-left: calc(var(--mainmenu-indent) - var(--sp-12));
    color: var(--c-blue);
}

@media (prefers-reduced-motion: reduce) {
    .mainmenu__chevron {
        transition: none;
    }
}
</style>

<!-- The menu is rendered in a portal, out of reach of a scoped attribute. -->
<style>
/* One width, open or closed, so nothing jumps; its own scroll where the rows outgrow the window (#31). */
.mainmenu {
    width: min(400px, calc(100vw - 2 * var(--sp-20)));
    max-height: var(--reka-dropdown-menu-content-available-height);
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
}
</style>
