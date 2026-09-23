<script setup lang="ts">
/**
 * The admin frame: a black rail, a topbar, and the page.
 *
 * Items a role cannot reach are NOT rendered at all rather than rendered and disabled — a disabled
 * link still tells someone a capability exists, and the permission model says nothing here is
 * merely hidden. The rail is filtered from the server's list, and the server refuses the route
 * regardless (R-11); this is presentation, never enforcement.
 *
 * The dark layer is a token redefinition on `data-theme`, not a second stylesheet.
 */

import { Link } from '@inertiajs/vue3'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from '../Components/Art/Icon.vue'
import Toast from '../Components/Chrome/Toast.vue'
import type { IconName } from '../art'
import { useShared } from '../composables/useShared'

withDefaults(defineProps<{ title?: string }>(), { title: undefined })

const shared = useShared()
const theme = ref<'light' | 'dark'>('light')

interface RailItem {
    label: string
    href: string
    routeName: string
    icon: IconName
    /** The permission module that has to be viewable, or null for an item every signed-in admin gets. */
    module: string | null
}

// Every admin screen that exists, each behind the module the server shares as `admin.can`
// (HandleInertiaRequests, admin routes only). An item whose module is not allowed is not rendered.
const rail: RailItem[] = [
    { label: 'Dashboard', href: '/admin', routeName: 'admin.dashboard', icon: 'grid', module: null },
    { label: 'Gutachten', href: '/admin/gutachten', routeName: 'admin.gutachten.index', icon: 'document', module: 'approvals' },
    { label: 'Wuchtgewichte-Farben', href: '/admin/wuchtgewichte', routeName: 'admin.wuchtgewichte.index', icon: 'box', module: 'catalogue' },
    { label: 'RDKS-Sensorpreise', href: '/admin/rdks-preise', routeName: 'admin.rdks.index', icon: 'settings', module: 'catalogue' },
    { label: 'Rollen & Rechte', href: '/admin/rollen', routeName: 'admin.rollen.index', icon: 'lock', module: 'roles' },
    { label: 'Benachrichtigungen', href: '/admin/benachrichtigungen', routeName: 'admin.benachrichtigungen.index', icon: 'mail', module: 'approvals' },
]

/** `admin.can` as the server shares it. Anything else — absent, malformed — reads as nothing allowed. */
function canFrom(admin: unknown): Record<string, boolean> {
    if (admin === null || typeof admin !== 'object') {
        return {}
    }

    const can = (admin as { can?: unknown }).can

    if (can === null || typeof can !== 'object') {
        return {}
    }

    const out: Record<string, boolean> = {}

    for (const [module, allowed] of Object.entries(can as Record<string, unknown>)) {
        out[module] = allowed === true
    }

    return out
}

const can = computed(() => canFrom(shared.value.admin))
const items = computed(() => rail.filter((item) => item.module === null || can.value[item.module] === true))

function toggleTheme(): void {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    apply()
}

function apply(): void {
    document.documentElement.setAttribute('data-theme', theme.value)
}

// Remembered per viewer, and only as a convenience: a throwing or empty read must still render a
// working panel, which is why the default is set before the stored value is consulted.
onMounted(() => {
    try {
        const stored = window.localStorage.getItem('rmf_admin_theme')

        if (stored === 'dark' || stored === 'light') {
            theme.value = stored
        }
    } catch {
        // Private windows and blocked site data both land here. Light is a fine answer.
    }

    apply()
})

onBeforeUnmount(() => {
    try {
        window.localStorage.setItem('rmf_admin_theme', theme.value)
    } catch {
        // Nothing to do: the theme is a preference, not state the panel depends on.
    }

    document.documentElement.removeAttribute('data-theme')
})
</script>

<template>
    <div class="adm">
        <aside class="adm__side">
            <Link href="/admin" class="wordmark adm__mark">RIMIFY</Link>

            <Link
                v-for="item in items"
                :key="item.routeName"
                :href="item.href"
                class="adm__link"
                :aria-current="shared.routeName === item.routeName ? 'page' : undefined"
            >
                <Icon :name="item.icon" :size="20" />
                {{ item.label }}
            </Link>

            <div class="adm__spacer" />

            <button class="adm__link adm__link--button" type="button" @click="toggleTheme">
                <Icon name="settings" :size="20" />
                {{ theme === 'dark' ? 'Helles Design' : 'Dunkles Design' }}
            </button>
        </aside>

        <main class="adm__main">
            <div class="adm__topbar">
                <h1 v-if="title" class="t-h2 adm__title">{{ title }}</h1>
            </div>

            <slot />
        </main>

        <!-- The confirmation a mutation flashed (`flash.toast`), announced once per response. -->
        <Toast />
    </div>
</template>

<style scoped>
.adm__mark {
    font-size: var(--fs-h4);
    margin: 0 var(--space-3) var(--space-5);
}

.adm__spacer {
    flex: 1;
}

.adm__link--button {
    background: transparent;
    border: 0;
    text-align: left;
    cursor: pointer;
    width: 100%;
}

.adm__title {
    margin: 0;
}

@media (max-width: 1000px) {
    .adm__spacer {
        display: none;
    }
}
</style>
