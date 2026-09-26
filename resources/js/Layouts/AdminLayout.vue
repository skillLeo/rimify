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

import { Link, router } from '@inertiajs/vue3'
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

/**
 * Who is signed in, as the server shares it — the name and the role they are wearing.
 *
 * The rail says it out loud rather than hiding it behind an avatar: on a panel where the same
 * screen shows different things to different roles, "which account am I?" is the question behind
 * half of all confusion, and it costs one line to answer permanently.
 */
const account = computed(() => {
    const admin: unknown = shared.value.admin

    if (admin === null || typeof admin !== 'object') {
        return null
    }

    const value = (admin as { account?: unknown }).account

    return value !== null && typeof value === 'object' ? (value as { name: string; email: string; role: string | null }) : null
})

const signingOut = ref(false)

function signOut(): void {
    signingOut.value = true
    router.post('/admin/abmelden', {}, { onFinish: () => (signingOut.value = false) })
}

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
            <!-- `--light` because this rail is `--ink`: the plain wordmark is `--ink` too, so it
                 was being set in near-black on near-black and simply was not there. -->
            <Link href="/admin" class="wordmark wordmark--light adm__mark">RIMIFY</Link>

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

            <!-- Who is signed in, then the two things you do with that: change how it looks, leave. -->
            <div v-if="account" class="adm__account">
                <p class="adm__account-name">{{ account.name }}</p>
                <p class="adm__account-role">{{ account.role ?? account.email }}</p>
            </div>

            <button class="adm__link adm__link--button" type="button" @click="toggleTheme">
                <Icon name="settings" :size="20" />
                {{ theme === 'dark' ? 'Helles Design' : 'Dunkles Design' }}
            </button>

            <button
                class="adm__link adm__link--button"
                type="button"
                :disabled="signingOut"
                @click="signOut"
            >
                <Icon name="close" :size="20" />
                {{ signingOut ? 'Wird abgemeldet …' : 'Abmelden' }}
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

.adm__account {
    padding: var(--space-3);
    border-top: 1px solid rgba(247, 248, 253, 0.16);
}

.adm__account-name {
    color: var(--on-dark);
    font-size: var(--text-small);
    font-weight: 700;
}

.adm__account-role {
    margin-top: 2px;
    color: var(--on-dark-2);
    font-size: var(--text-micro);
    /* An address can be longer than the rail; it wraps rather than pushing the rail wider. */
    overflow-wrap: anywhere;
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
