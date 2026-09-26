<script setup lang="ts">
/**
 * The rail — where everything in the panel is, grouped the way the client's team works.
 *
 * The tree comes from the server whole (AdminNavigation): it already leaves out every page a role
 * may not open and every page not built yet, so this component filters nothing and can never offer
 * a dead link. It draws the client's rail (DIRECTION §8a): light, labelled groups, 36 px items, the
 * tint and 2 px indicator where you are, counts as quiet figures that disappear at zero.
 *
 * Its foot (AdminRailFoot) stays put under a hairline while the navigation scrolls above it: the
 * shop's health, „Neu“, and the account with its way out.
 *
 * Collapsed it is icons with tooltips. That happens by choice from 1024 px, remembered on the
 * account so the first frame is already right, and by force at 768–1023, where there is no room to
 * honour a choice to open it — so the toggle is not offered there at all.
 */

import { Link, usePage } from '@inertiajs/vue3'
import { TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import Icon from './AdminIcon.vue'
import AdminRailFoot from './AdminRailFoot.vue'
import EnvironmentBadge from './EnvironmentBadge.vue'
import { isCurrentPage } from '../../composables/admin/currentPage'
import { useAdmin, useAdminShell } from '../../composables/admin/useAdmin'
import type { AdminNavGroup, AdminNavPage } from '../../types/admin'

const admin = useAdmin()
const shell = useAdminShell()
const page = usePage()

/** The current path, without the query: a filtered list is still the same page in the rail. */
const path = computed(() => {
    const url = page.url.replace(/[?#].*$/, '')

    return url.length > 1 ? url.replace(/\/$/, '') : url
})

function current(item: AdminNavPage): boolean {
    return isCurrentPage(item.href, path.value)
}

/** A group of one page is that page: no label saying "Übersicht" above an item saying the same. */
function labelled(group: AdminNavGroup): boolean {
    return !(group.pages.length === 1 && group.pages[0]?.label === group.label)
}

function countName(item: AdminNavPage): string {
    return item.countTone === 'bad' ? `${item.count} fehlgeschlagen` : `${item.count} offen`
}

/* 768–1023 forces the rail collapsed; the viewport is only known after mount, so until then the
   stylesheet collapses it and the tooltips simply arrive with hydration. */
const narrow = ref(false)
let media: MediaQueryList | null = null

function onMedia(): void {
    narrow.value = media?.matches ?? false
}

onMounted(() => {
    media = window.matchMedia('(min-width: 768px) and (max-width: 1023px)')
    onMedia()
    media.addEventListener('change', onMedia)
})

onBeforeUnmount(() => media?.removeEventListener('change', onMedia))

/* Collapsed as shown: by choice, by a window without room beside the content (the layout's rail
   control), or by the tablet's width. */
const collapsed = computed(() => (shell.rail?.shown.value ?? shell.railCollapsed.value) || narrow.value)

/*
 * An item whose label ends in „…“ at this width shows the whole of it in a tooltip, as the icon rail
 * does. Measured when it is pointed at or reached, not on every frame of a drag.
 */
const cut = reactive(new Set<string>())

function measure(event: Event, item: AdminNavPage): void {
    const text = (event.currentTarget as HTMLElement).querySelector<HTMLElement>('.adm-rail__text')

    if (text && text.scrollWidth > text.clientWidth) {
        cut.add(item.href)
    } else {
        cut.delete(item.href)
    }
}
</script>

<template>
    <TooltipProvider :delay-duration="150" disable-hoverable-content>
        <aside class="adm-rail">
            <div class="adm-rail__brand">
                <Link href="/admin" class="adm-wordmark adm-wordmark--full">RIMIFY</Link>
                <!-- The wordmark's own initial: the wheel is Felgen's glyph and means nothing else. -->
                <Link href="/admin" class="adm-iconbtn adm-wordmark adm-wordmark--mark" aria-label="RIMIFY – zur Übersicht">
                    <span aria-hidden="true">R</span>
                </Link>
                <EnvironmentBadge />
                <button
                    class="adm-iconbtn adm-rail__toggle"
                    type="button"
                    :aria-expanded="shell.railCollapsed.value ? 'false' : 'true'"
                    aria-controls="adm-nav"
                    aria-keyshortcuts="["
                    :aria-label="shell.railCollapsed.value ? 'Navigation ausklappen' : 'Navigation einklappen'"
                    @click="shell.toggleRail"
                >
                    <Icon :name="shell.railCollapsed.value ? 'chevron-right' : 'chevron-left'" :size="16" />
                </button>
            </div>

            <nav id="adm-nav" class="adm-rail__nav" aria-label="Hauptnavigation">
                <section
                    v-for="group in admin.nav"
                    :key="group.key"
                    class="adm-rail__group"
                    :aria-labelledby="labelled(group) ? `adm-group-${group.key}` : undefined"
                >
                    <p v-if="labelled(group)" :id="`adm-group-${group.key}`" class="adm-rail__label">
                        <span class="adm-rail__label-full">{{ group.label }}</span>
                        <span class="adm-rail__label-short" aria-hidden="true">{{ group.short || group.label }}</span>
                    </p>
                    <ul class="adm-rail__list">
                        <li v-for="item in group.pages" :key="item.href">
                            <TooltipRoot :disabled="!collapsed && !cut.has(item.href)">
                                <TooltipTrigger as-child>
                                    <Link
                                        :href="item.href"
                                        class="adm-rail__item"
                                        :aria-current="current(item) ? 'page' : undefined"
                                        :aria-label="item.count ? `${item.label}, ${countName(item)}` : undefined"
                                        @pointerenter="measure($event, item)"
                                        @focus="measure($event, item)"
                                    >
                                        <Icon :name="item.icon" :size="20" />
                                        <span class="adm-rail__text">{{ item.label }}</span>
                                        <span
                                            v-if="item.count"
                                            class="adm-rail__count"
                                            :class="{ 'adm-rail__count--bad': item.countTone === 'bad' }"
                                            aria-hidden="true"
                                        >
                                            {{ item.count > 99 ? '99+' : item.count }}
                                        </span>
                                        <span
                                            v-if="item.count"
                                            class="adm-rail__dot"
                                            :class="{ 'adm-rail__dot--bad': item.countTone === 'bad' }"
                                            aria-hidden="true"
                                        />
                                    </Link>
                                </TooltipTrigger>
                                <TooltipPortal>
                                    <TooltipContent class="adm-tooltip" side="right" :side-offset="8">
                                        {{ item.label }}<template v-if="item.count"> · {{ countName(item) }}</template>
                                    </TooltipContent>
                                </TooltipPortal>
                            </TooltipRoot>
                        </li>
                    </ul>
                </section>
            </nav>

            <AdminRailFoot :collapsed="collapsed" />
        </aside>
    </TooltipProvider>
</template>
