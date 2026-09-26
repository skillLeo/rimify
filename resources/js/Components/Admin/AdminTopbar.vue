<script setup lang="ts">
/**
 * The topbar: where you are, the way to anything, and your account.
 *
 * Breadcrumbs on the left come from the server (a slug is not a label); the group is a label and
 * the current page is not a link, so nothing here goes nowhere. The search is a button that looks
 * like a field and opens the one palette that ⌘K, `/` and the phone's Suche tab also open — two
 * search affordances is how a panel ends up with two different result lists.
 *
 * The notification bell is not here yet. There is nothing behind it until notification rules land,
 * and a bell that can only ever say "nichts Neues" is decoration pretending to be a feature.
 */

import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuRoot,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from 'reka-ui'
import { computed } from 'vue'
import Icon from '../Ui/Icon.vue'
import Kbd from '../Ui/Kbd.vue'
import AdminUserMenu from './AdminUserMenu.vue'
import EnvironmentBadge from './EnvironmentBadge.vue'
import { useAdmin, useAdminShell } from '../../composables/admin/useAdmin'

const admin = useAdmin()
const shell = useAdminShell()

const crumbs = computed(() => admin.value.breadcrumbs)
</script>

<template>
    <header class="adm-topbar">
        <div class="adm-topbar__start">
            <EnvironmentBadge />
            <nav v-if="crumbs.length" class="adm-crumbs" aria-label="Brotkrumen">
                <ol>
                    <li v-for="(crumb, index) in crumbs" :key="`${index}-${crumb.label}`">
                        <Icon v-if="index > 0" class="adm-crumbs__sep" name="chevron-right" :size="16" />
                        <span v-if="index === crumbs.length - 1" aria-current="page">{{ crumb.label }}</span>
                        <a v-else-if="crumb.href" :href="crumb.href">{{ crumb.label }}</a>
                        <span v-else>{{ crumb.label }}</span>
                    </li>
                </ol>
            </nav>
        </div>

        <button
            class="adm-search adm-search--field"
            type="button"
            aria-label="Suche öffnen"
            aria-keyshortcuts="Control+K Meta+K"
            @click="shell.paletteOpen.value = true"
        >
            <Icon name="search" :size="16" />
            <span class="adm-search__label">Suchen</span>
            <span class="adm-search__kbd"><Kbd :keys="['K']" modifier /></span>
        </button>

        <div class="adm-topbar__end">
            <button
                class="adm-iconbtn adm-search--icon"
                type="button"
                aria-label="Suche öffnen"
                aria-keyshortcuts="Control+K Meta+K"
                @click="shell.paletteOpen.value = true"
            >
                <Icon name="search" :size="20" />
            </button>

            <DropdownMenuRoot>
                <DropdownMenuTrigger class="adm-iconbtn" aria-label="Hilfe">
                    <Icon name="info" :size="20" />
                </DropdownMenuTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuContent class="adm-menu" align="end" :side-offset="8">
                        <DropdownMenuItem class="adm-menu__item" @select="shell.shortcutsOpen.value = true">
                            <Icon name="keyboard" :size="20" />
                            Tastenkürzel
                        </DropdownMenuItem>
                        <!-- Only when somebody was asked to read that address; never a placeholder. -->
                        <DropdownMenuItem v-if="admin.supportEmail" as-child>
                            <a class="adm-menu__item" :href="`mailto:${admin.supportEmail}`">
                                <Icon name="mail" :size="20" />
                                Hilfe per E-Mail
                            </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator class="adm-menu__sep" />
                        <DropdownMenuLabel class="adm-menu__caption">Zahlen im Menü sind so aktuell wie die Seite.</DropdownMenuLabel>
                    </DropdownMenuContent>
                </DropdownMenuPortal>
            </DropdownMenuRoot>

            <AdminUserMenu />
        </div>
    </header>
</template>
