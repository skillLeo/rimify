<script setup lang="ts">
/**
 * The rail's foot: how the shop is, what you can make, and who you are — fixed at the bottom of the
 * rail under a hairline, never scrolling with the navigation above it.
 *
 *   0. Demodaten — only while demo rows exist (DemoTables): „Demodaten aktiv · 1.412 Datensätze ·
 *      entfernen“ in the warning colour, so whoever opens the admin next knows what the figures are
 *      made of. „entfernen“ — for who may (DemoDataPolicy) — asks first (AdminConfirm), then takes
 *      exactly the demo rows away, recorded in the Protokoll.
 *   1. Systemzustand — only when something is wrong: an empty foot is the healthy state. One quiet
 *      line of 32 px: the dot carries the colour, then a short label and a count in it („Warteschlange
 *      stockt · 12 Std“), the whole sentence in the tooltip. No way to dismiss it — a problem hidden
 *      is how a dead queue goes unnoticed — and it opens System › Zustand, which explains and retries.
 *      Collapsed, it is the dot alone, named by its tooltip. Polled every minute.
 *   2. „Neu“ — the quick actions (QuickActions, the same list the palette offers), and the palette's
 *      shortcut beside it.
 *   3. The profile — monogram, name, role; its menu opens upward: Profil, Benachrichtigungen,
 *      Tastenkürzel, and Abmelden last, in the failure colour, behind a hairline.
 *
 * Every menu is reka's: arrows move, Esc closes, focus returns to the row that opened it.
 */

import { Link, router } from '@inertiajs/vue3'
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuRoot,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    TooltipContent,
    TooltipPortal,
    TooltipRoot,
    TooltipTrigger,
} from 'reka-ui'
import { computed, ref } from 'vue'
import AdminConfirm from './AdminConfirm.vue'
import AdminMenuTip from './AdminMenuTip.vue'
import Icon from './AdminIcon.vue'
import Kbd from '../Ui/Kbd.vue'
import { useAdmin, useAdminShell } from '../../composables/admin/useAdmin'
import { useDemoStrip } from '../../composables/admin/useDemoStrip'
import { useHealth, useHealthBanner } from '../../composables/admin/useHealth'
import { monogram } from '../../composables/admin/monogram'

defineProps<{ collapsed: boolean }>()

const admin = useAdmin()
const shell = useAdminShell()
const health = useHealth()
const banner = useHealthBanner()

const account = computed(() => admin.value.account)
const actions = computed(() => admin.value.quickActions)
const initials = computed(() => monogram(account.value?.name))

/*
 * A name or role that ends in „…“ at this width shows the whole of it in the rail's own tooltip, as
 * the items above do — measured when the row is pointed at or reached, not on every frame of a drag.
 */
const whoCut = ref(false)

function measureWho(event: Event): void {
    const lines = (event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('.adm-foot__name, .adm-foot__role')

    whoCut.value = [...lines].some((line) => line.scrollWidth > line.clientWidth)
}

/* ── Demodaten ─────────────────────────────────────────────────────────────── */

const { demo, rows: demoRows, body: purgeBody, confirming: confirmingPurge, purging, ask: askPurge, purge: purgeDemo } = useDemoStrip()

const signingOut = ref(false)

/** A post, not a link, and not twice: while it is in flight the row says so and refuses again. */
function signOut(event: Event): void {
    event.preventDefault()

    if (signingOut.value) {
        return
    }

    signingOut.value = true
    router.post('/admin/abmelden', {}, { onFinish: () => (signingOut.value = false) })
}
</script>

<template>
    <!-- Collapsed or not is the stylesheet's call (the rail's own rule, first frame included); the
         prop only turns tooltips on and opens the menus to the side instead of upward. -->
    <div class="adm-foot">
        <!-- 0 · Demodaten: only while there are any. -->
        <TooltipRoot v-if="demo" :disabled="!collapsed">
            <TooltipTrigger as-child>
                <p class="adm-foot__demo" :tabindex="collapsed ? 0 : undefined">
                    <span class="adm-foot__demo-dot" aria-hidden="true" />
                    <span class="adm-foot__demo-text">
                        Demodaten aktiv · {{ demoRows }}<template v-if="demo.canPurge"> ·
                            <button class="adm-foot__demo-purge" type="button" @click="askPurge">entfernen</button></template>
                    </span>
                </p>
            </TooltipTrigger>
            <TooltipPortal>
                <TooltipContent class="adm-tooltip" side="right" :side-offset="8">Demodaten aktiv · {{ demoRows }}</TooltipContent>
            </TooltipPortal>
        </TooltipRoot>

        <AdminConfirm
            v-if="demo?.canPurge"
            v-model:open="confirmingPurge"
            title="Demodaten entfernen"
            :body="purgeBody"
            confirm-label="Entfernen"
            :busy="purging"
            @confirm="purgeDemo"
        />

        <!-- 1 · Systemzustand: nothing while all is well. -->
        <!-- The ambient reminder: away while the banner says the same thing (useHealthBanner). -->
        <TooltipRoot v-if="health && health.state !== 'ok' && !banner">
            <TooltipTrigger as-child>
                <component
                    :is="health.href ? Link : 'p'"
                    :href="health.href ?? undefined"
                    class="adm-foot__health"
                    :aria-label="health.sentence"
                >
                    <span class="adm-health__dot" :class="`adm-health__dot--${health.state}`" aria-hidden="true" />
                    <span class="adm-foot__label" aria-hidden="true">{{ health.label }}</span>
                    <span v-if="health.count" class="adm-foot__count" :class="`adm-foot__count--${health.state}`" aria-hidden="true">
                        · {{ health.count }}
                    </span>
                </component>
            </TooltipTrigger>
            <TooltipPortal>
                <TooltipContent class="adm-tooltip" side="right" :side-offset="8">
                    {{ collapsed ? `${health.label}${health.count ? ` · ${health.count}` : ''}` : health.sentence }}
                </TooltipContent>
            </TooltipPortal>
        </TooltipRoot>
        <!-- A change in the shop's health is said aloud once, politely. Always there, so it can speak. -->
        <span class="visually-hidden" role="status">{{ health && health.state !== 'ok' ? health.sentence : '' }}</span>

        <!-- 2 · Neu, and the way to everything -->
        <div class="adm-foot__actions">
            <!-- The tooltip wraps the menu, never the other way round (AdminMenuTip says why). -->
            <AdminMenuTip v-if="actions.length" text="Neu anlegen" :disabled="!collapsed">
                <DropdownMenuRoot>
                    <DropdownMenuTrigger class="btn btn--secondary adm-foot__new">
                        <Icon name="plus" :size="20" />
                        <span class="adm-foot__new-label">Neu</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuContent class="adm-menu" :side="collapsed ? 'right' : 'top'" align="start" :side-offset="8">
                            <DropdownMenuLabel class="adm-menu__caption">Neu anlegen</DropdownMenuLabel>
                            <DropdownMenuItem v-for="action in actions" :key="action.key" as-child>
                                <Link :href="action.href" class="adm-menu__item">
                                    <Icon :name="action.icon" :size="20" />
                                    {{ action.label }}
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenuPortal>
                </DropdownMenuRoot>
            </AdminMenuTip>

            <button
                class="adm-foot__kbd"
                type="button"
                aria-label="Suche öffnen"
                aria-keyshortcuts="Control+K Meta+K"
                @click="shell.paletteOpen.value = true"
            >
                <Kbd :keys="['K']" modifier />
            </button>
        </div>

        <!-- 3 · Who you are -->
        <AdminMenuTip v-if="account" :text="`${account.name} · ${account.role ?? account.email}`" :disabled="!collapsed && !whoCut">
            <DropdownMenuRoot>
                <DropdownMenuTrigger
                    class="adm-foot__profile"
                    :aria-label="`Konto: ${account.name}${account.role ? `, ${account.role}` : ''}`"
                    @pointerenter="measureWho"
                    @focus="measureWho"
                >
                    <span class="adm-avatar" aria-hidden="true">{{ initials }}</span>
                    <span class="adm-foot__who">
                        <span class="adm-foot__name">{{ account.name }}</span>
                        <span class="adm-foot__role">{{ account.role ?? account.email }}</span>
                    </span>
                    <Icon class="adm-foot__chevron" name="chevron-up" :size="16" />
                </DropdownMenuTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuContent class="adm-menu adm-foot__menu" :side="collapsed ? 'right' : 'top'" align="start" :side-offset="8">
                        <div class="adm-menu__head">
                            <DropdownMenuLabel class="adm-menu__name">{{ account.name }}</DropdownMenuLabel>
                            <DropdownMenuLabel class="adm-menu__meta">{{ account.email }}</DropdownMenuLabel>
                        </div>
                        <DropdownMenuSeparator class="adm-menu__sep" />
                        <DropdownMenuItem as-child>
                            <Link href="/admin/profil" class="adm-menu__item">
                                <Icon name="users" :size="20" />
                                Profil
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem as-child>
                            <Link href="/admin/benachrichtigungen" class="adm-menu__item">
                                <Icon name="bell" :size="20" />
                                Benachrichtigungen
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem as-child>
                            <Link href="/admin/profil#passwort" class="adm-menu__item">
                                <Icon name="shield" :size="20" />
                                Passwort ändern
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem class="adm-menu__item" @select="shell.shortcutsOpen.value = true">
                            <Icon name="keyboard" :size="20" />
                            Tastenkürzel
                        </DropdownMenuItem>
                        <DropdownMenuSeparator class="adm-menu__sep" />
                        <DropdownMenuItem
                            class="adm-menu__item adm-menu__item--danger"
                            :disabled="signingOut"
                            :aria-busy="signingOut ? 'true' : undefined"
                            @select="signOut"
                        >
                            <Icon name="logout" :size="20" />
                            {{ signingOut ? 'Wird abgemeldet …' : 'Abmelden' }}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenuPortal>
            </DropdownMenuRoot>
        </AdminMenuTip>
    </div>
</template>
