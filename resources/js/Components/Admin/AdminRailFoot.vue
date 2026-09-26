<script setup lang="ts">
/**
 * The rail's foot: how the shop is, what you can make, and who you are — fixed at the bottom of the
 * rail under a hairline, never scrolling with the navigation above it.
 *
 *   1. Systemzustand — a dot and a sentence („Alles in Ordnung“, „3 Jobs fehlgeschlagen“). The dot
 *      is never the only signal: the sentence carries the meaning, and in the collapsed rail it is
 *      the dot's name and tooltip. Opens System › Zustand for a role that may; polled every minute.
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
import Icon from './AdminIcon.vue'
import Kbd from '../Ui/Kbd.vue'
import { useAdmin, useAdminShell } from '../../composables/admin/useAdmin'
import { useHealth } from '../../composables/admin/useHealth'
import { monogram } from '../../composables/admin/monogram'

defineProps<{ collapsed: boolean }>()

const admin = useAdmin()
const shell = useAdminShell()
const health = useHealth()

const account = computed(() => admin.value.account)
const actions = computed(() => admin.value.quickActions)
const initials = computed(() => monogram(account.value?.name))

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
        <!-- 1 · Systemzustand -->
        <template v-if="health">
            <TooltipRoot :disabled="!collapsed">
                <TooltipTrigger as-child>
                    <component
                        :is="health.href ? Link : 'p'"
                        :href="health.href ?? undefined"
                        class="adm-foot__health"
                        :class="`adm-foot__health--${health.state}`"
                    >
                        <span class="adm-health__dot" :class="`adm-health__dot--${health.state}`" aria-hidden="true" />
                        <span class="adm-foot__sentence">{{ health.sentence }}</span>
                    </component>
                </TooltipTrigger>
                <TooltipPortal>
                    <TooltipContent class="adm-tooltip" side="right" :side-offset="8">{{ health.sentence }}</TooltipContent>
                </TooltipPortal>
            </TooltipRoot>
            <!-- A change in the shop's health is said aloud once, politely; the line above is its label. -->
            <span class="visually-hidden" role="status">{{ health.state === 'ok' ? '' : health.sentence }}</span>
        </template>

        <!-- 2 · Neu, and the way to everything -->
        <div class="adm-foot__actions">
            <DropdownMenuRoot v-if="actions.length">
                <TooltipRoot :disabled="!collapsed">
                    <TooltipTrigger as-child>
                        <DropdownMenuTrigger class="btn btn--secondary adm-foot__new">
                            <Icon name="plus" :size="20" />
                            <span class="adm-foot__new-label">Neu</span>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipPortal>
                        <TooltipContent class="adm-tooltip" side="right" :side-offset="8">Neu anlegen</TooltipContent>
                    </TooltipPortal>
                </TooltipRoot>
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
        <DropdownMenuRoot v-if="account">
            <DropdownMenuTrigger class="adm-foot__profile" :aria-label="`Konto: ${account.name}${account.role ? `, ${account.role}` : ''}`">
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
    </div>
</template>
