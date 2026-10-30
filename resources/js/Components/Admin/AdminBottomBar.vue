<script setup lang="ts">
/**
 * The phone's bottom bar (admin-shell.md §11.2, shell-build-plan.md): Übersicht, the first two
 * groups this role has a built page in — in the rail's order — then Suche and Mehr. So the bar
 * always has five, and Bestellungen takes the second slot by itself once its page exists.
 *
 * Suche opens the same palette as ⌘K, as a full-screen sheet. Mehr holds everything else, and the
 * account. The bar never hides on scroll; it steps aside only for the on-screen keyboard.
 */

import { Link, usePage } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import Icon from './AdminIcon.vue'
import AdminMoreSheet from './AdminMoreSheet.vue'
import { BENEATH_UEBERSICHT, isCurrentPage } from '../../composables/admin/currentPage'
import { useAdmin, useAdminShell } from '../../composables/admin/useAdmin'
import type { AdminNavGroup } from '../../types/admin'

const admin = useAdmin()
const shell = useAdminShell()
const page = usePage()

const path = computed(() => {
    const url = page.url.replace(/[?#].*$/, '')

    return url.length > 1 ? url.replace(/\/$/, '') : url
})

/** The groups that get a slot of their own; everything else is in Mehr. */
const slots = computed<AdminNavGroup[]>(() => admin.value.nav.filter((g) => g.key !== 'uebersicht').slice(0, 2))

function count(group: AdminNavGroup): { value: number; bad: boolean } | null {
    const value = group.pages.reduce((sum, p) => sum + (p.count ?? 0), 0)

    return value > 0 ? { value, bad: group.pages.some((p) => p.count && p.countTone === 'bad') } : null
}

function inGroup(group: AdminNavGroup): boolean {
    return group.pages.some((p) => isCurrentPage(p.href, path.value))
}

const moreOpen = ref(false)

/** Pages reached from the app bar rather than from Mehr: being on one is not being in Mehr. */
const OUTSIDE_MORE = ['/admin', ...BENEATH_UEBERSICHT, '/admin/benachrichtigungen']

/** Mehr is where you are when the page is one of its own. */
const inMore = computed(() => !OUTSIDE_MORE.includes(path.value) && !slots.value.some(inGroup))
</script>

<template>
    <nav class="adm-tabbar" aria-label="Hauptnavigation">
        <Link href="/admin" class="adm-tabbar__item" :aria-current="path === '/admin' ? 'page' : undefined">
            <Icon name="overview" :size="24" />
            <span class="adm-tabbar__label">Übersicht</span>
        </Link>

        <Link
            v-for="group in slots"
            :key="group.key"
            :href="group.pages[0]?.href ?? '/admin'"
            class="adm-tabbar__item"
            :aria-current="inGroup(group) ? 'page' : undefined"
            :aria-label="count(group) ? `${group.label}, ${count(group)?.value} offen` : undefined"
        >
            <span class="adm-tabbar__icon">
                <Icon :name="group.icon" :size="24" />
                <span v-if="count(group)" class="adm-tabbar__badge" :class="{ 'adm-tabbar__badge--bad': count(group)?.bad }" aria-hidden="true">
                    {{ (count(group)?.value ?? 0) > 99 ? '99+' : count(group)?.value }}
                </span>
            </span>
            <span class="adm-tabbar__label">{{ group.label }}</span>
        </Link>

        <button class="adm-tabbar__item" type="button" @click="shell.paletteOpen.value = true">
            <Icon name="search" :size="24" />
            <span class="adm-tabbar__label">Suche</span>
        </button>

        <button class="adm-tabbar__item" type="button" :aria-current="inMore ? 'page' : undefined" aria-haspopup="dialog" @click="moreOpen = true">
            <Icon name="menu" :size="24" />
            <span class="adm-tabbar__label">Mehr</span>
        </button>
    </nav>

    <!-- A slot opens its group's first page only: a group of several stays in Mehr, or its other pages were reachable
         through Suche alone — Verkauf › Nachrichten on the preview (D-365). -->
    <AdminMoreSheet v-model:open="moreOpen" :exclude="slots.filter((g) => g.pages.length === 1).map((g) => g.key)" />
</template>
