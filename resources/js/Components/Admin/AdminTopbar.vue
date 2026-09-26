<script setup lang="ts">
/**
 * The topbar: where you are, the way to anything, what happened, and help — nothing else. The
 * account lives at the foot of the rail (AdminRailFoot), where the navigation ends.
 *
 * Breadcrumbs on the left come from the server (a slug is not a label); the group is a label and
 * the current page is not a link, so nothing here goes nowhere. The search is a button that looks
 * like a field and opens the one palette that ⌘K, `/` and the phone's Suche tab also open — two
 * search affordances is how a panel ends up with two different result lists.
 *
 * The bell sits left of Hilfe: what happened that this person should know about (AdminBell).
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
import { Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import Icon from './AdminIcon.vue'
import Kbd from '../Ui/Kbd.vue'
import AdminBell from './AdminBell.vue'
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
                        <Link v-else-if="crumb.href" :href="crumb.href">{{ crumb.label }}</Link>
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

            <AdminBell />

            <DropdownMenuRoot>
                <DropdownMenuTrigger class="adm-iconbtn" aria-label="Hilfe">
                    <Icon name="help" :size="20" />
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
                                <Icon name="emails" :size="20" />
                                Hilfe per E-Mail
                            </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator class="adm-menu__sep" />
                        <DropdownMenuLabel class="adm-menu__caption">Zahlen im Menü sind so aktuell wie die Seite.</DropdownMenuLabel>
                    </DropdownMenuContent>
                </DropdownMenuPortal>
            </DropdownMenuRoot>
        </div>
    </header>
</template>
