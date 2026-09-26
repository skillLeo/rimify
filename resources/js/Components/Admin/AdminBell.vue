<script setup lang="ts">
/**
 * The bell: what happened that this person should know about (docs/admin/rest-build-plan.md, step 1).
 *
 * The number comes with every page from the server (`admin.notifications.unread`), so it is right in
 * the first frame and never jumps after hydration; useAlertCount keeps a fresher one when the bell
 * has read it, or when Back restored a page with an old count. The list is fetched when the bell
 * opens — the newest eight, read or not — and a list already shown stays while it is refreshed.
 *
 * Choosing an unread alert marks it read; one with a page then opens that page, as an ordinary visit
 * so an editor with unsaved changes still asks first. A read alert without a page leads to the
 * centre, where the whole history is. The keyboard lands on the newest alert, never on
 * „Alle als gelesen markieren“, which is not offered until the list it would clear is on screen.
 */

import { Link, router } from '@inertiajs/vue3'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuSeparator, DropdownMenuTrigger } from 'reka-ui'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from './AdminIcon.vue'
import { useAdmin } from '../../composables/admin/useAdmin'
import { fetchLatest, useAlertCount } from '../../composables/admin/useAlertCount'
import type { AdminAlertItem } from '../../types/admin'

const CENTRE = '/admin/benachrichtigungen'
const SIGN_IN = '/admin/anmelden'

const admin = useAdmin()
const count = useAlertCount()

const open = ref(false)
const state = ref<'idle' | 'loading' | 'ready' | 'failed' | 'signed-out'>('idle')
const items = ref<AdminAlertItem[]>([])

/** Opened from the keyboard: the newest alert takes the focus once it is there. */
let byKeyboard = false
let request: AbortController | null = null

const unread = computed(() => count.live.value ?? admin.value.notifications.unread)

/** A role that can receive no alert gets no bell — unless something already sits in it. */
const shown = computed(() => admin.value.notifications.offered || (unread.value ?? 0) > 0)

/** The badge: nothing at zero or when unknown, `99+` past ninety-nine. */
const badge = computed(() => {
    const n = unread.value

    return n === null || n === 0 ? null : n > 99 ? '99+' : String(n)
})

const label = computed(() => {
    const n = unread.value

    if (n === null || n === 0) {
        return 'Benachrichtigungen'
    }

    return n === 1 ? 'Benachrichtigungen, 1 ungelesen' : `Benachrichtigungen, ${n > 99 ? 'über 99' : n} ungelesen`
})

/** Said aloud when the list settles: the menu's own items are read as they are reached. */
const announcement = computed(() => {
    if (!open.value) {
        return ''
    }

    return {
        idle: '',
        loading: 'Benachrichtigungen werden geladen.',
        ready: items.value.length === 0 ? 'Noch keine Benachrichtigungen.' : '',
        failed: 'Die Benachrichtigungen konnten nicht geladen werden.',
        'signed-out': 'Deine Anmeldung ist abgelaufen.',
    }[state.value]
})

async function load(): Promise<void> {
    request?.abort()
    const mine = new AbortController()
    request = mine

    // A list already on screen stays while it is refreshed; only an empty menu shows the skeleton.
    if (state.value !== 'ready') {
        state.value = 'loading'
    }

    const answer = await fetchLatest(mine.signal)

    // A slower, older answer never overwrites a newer one.
    if (request !== mine) {
        return
    }

    if (answer.status === 'ok') {
        items.value = answer.items
        count.remember(answer.unread)
        state.value = 'ready'
        await focusNewest()
    } else {
        state.value = answer.status
    }
}

async function focusNewest(): Promise<void> {
    if (!byKeyboard || !open.value) {
        return
    }

    await nextTick()
    // Only one bell's menu is ever open, so the open menu is this one.
    const first = document.querySelector<HTMLElement>('[data-bell-menu] .adm-bellitem')
    first?.focus()
}

function onOpen(value: boolean): void {
    open.value = value

    if (value) {
        void load()
    } else {
        request?.abort()
        request = null
        byKeyboard = false
    }
}

function onTriggerKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        byKeyboard = true
    }
}

function choose(item: AdminAlertItem): void {
    if (item.read) {
        // Nothing to mark: the alert's page, or the centre with the whole history.
        router.visit(item.href ?? CENTRE)

        return
    }

    router.post(`${CENTRE}/${item.id}/gelesen`, { bleiben: true }, {
        preserveScroll: true,
        preserveState: true,
        // Then the page, as its own visit: it opens at its top, and unsaved changes still ask first.
        onSuccess: () => {
            if (item.href !== null) {
                router.visit(item.href)
            }
        },
    })
}

function readAll(): void {
    router.post(`${CENTRE}/gelesen`, {}, { preserveScroll: true, preserveState: true })
}

/*
 * The topbar's bell and the phone app bar's bell are two instances; only one is on screen. An open
 * menu whose bell is hidden by a resize across 768 px would float in a corner, so it closes.
 */
let wide: MediaQueryList | null = null
const close = (): void => onOpen(false)

onMounted(() => {
    wide = window.matchMedia('(min-width: 768px)')
    wide.addEventListener('change', close)
})

onBeforeUnmount(() => {
    wide?.removeEventListener('change', close)
    request?.abort()
})
</script>

<template>
    <DropdownMenuRoot v-if="shown" :open="open" @update:open="onOpen">
        <DropdownMenuTrigger class="adm-iconbtn adm-bell" :aria-label="label" @keydown="onTriggerKey" @pointerdown="byKeyboard = false">
            <Icon name="bell" :size="20" />
            <span v-if="badge" class="adm-bell__count" aria-hidden="true">{{ badge }}</span>
        </DropdownMenuTrigger>
        <span class="visually-hidden" role="status">{{ announcement }}</span>
        <DropdownMenuPortal>
            <DropdownMenuContent class="adm-menu adm-alerts" data-bell-menu align="end" :side-offset="8">
                <DropdownMenuLabel class="adm-alerts__head">
                    <span class="adm-alerts__title">Benachrichtigungen</span>
                    <span v-if="badge" class="adm-alerts__unread">{{ unread === 1 ? '1 ungelesen' : `${badge} ungelesen` }}</span>
                </DropdownMenuLabel>

                <!-- Two alerts' worth, at their real size, so the menu does not jump when they land. -->
                <div v-if="state === 'loading' || state === 'idle'" class="adm-alerts__state" aria-hidden="true">
                    <span v-for="n in 2" :key="n" class="adm-alerts__skel">
                        <span class="skeleton adm-skel__bar" />
                        <span class="skeleton adm-skel__bar adm-skel__bar--sub" />
                    </span>
                </div>

                <template v-else-if="state === 'failed'">
                    <DropdownMenuLabel class="adm-alerts__note adm-alerts__state">Die Benachrichtigungen konnten nicht geladen werden.</DropdownMenuLabel>
                    <DropdownMenuItem class="adm-menu__item" @select.prevent="load">Erneut versuchen</DropdownMenuItem>
                </template>

                <template v-else-if="state === 'signed-out'">
                    <DropdownMenuLabel class="adm-alerts__note adm-alerts__state">Deine Anmeldung ist abgelaufen.</DropdownMenuLabel>
                    <DropdownMenuItem as-child>
                        <a :href="SIGN_IN" class="adm-menu__item">Neu anmelden</a>
                    </DropdownMenuItem>
                </template>

                <DropdownMenuLabel v-else-if="items.length === 0" class="adm-alerts__note adm-alerts__state">
                    Noch nichts. Sobald etwas passiert, das du wissen musst, steht es hier.
                </DropdownMenuLabel>

                <template v-else>
                    <DropdownMenuItem
                        v-for="item in items"
                        :key="item.id"
                        class="adm-bellitem"
                        :class="{ 'adm-bellitem--unread': !item.read }"
                        @select="choose(item)"
                    >
                        <span class="adm-bellitem__dot" aria-hidden="true" />
                        <span class="adm-bellitem__body">
                            <span class="adm-bellitem__title">
                                <span v-if="!item.read" class="visually-hidden">Ungelesen: </span>{{ item.title }}
                            </span>
                            <span v-if="item.detail" class="adm-bellitem__detail">{{ item.detail }}</span>
                            <time class="adm-bellitem__time" :datetime="item.iso ?? undefined">
                                {{ item.dayLabel === 'Heute' ? item.time : `${item.dayLabel}, ${item.time}` }}
                            </time>
                        </span>
                    </DropdownMenuItem>
                </template>

                <DropdownMenuSeparator class="adm-menu__sep" />

                <!-- Only once the list it would clear is on screen: never the first thing Enter reaches. -->
                <DropdownMenuItem v-if="unread && state === 'ready' && items.length" class="adm-menu__item" @select="readAll">
                    <Icon name="check" :size="20" />
                    Alle als gelesen markieren
                </DropdownMenuItem>
                <DropdownMenuItem as-child>
                    <Link :href="CENTRE" class="adm-menu__item">
                        <Icon name="bell" :size="20" />
                        Alle Benachrichtigungen
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenuPortal>
    </DropdownMenuRoot>
</template>
