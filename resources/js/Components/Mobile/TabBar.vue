<script setup lang="ts">
/**
 * The bottom tab bar: the four destinations that exist, always in reach. 56 px plus the safe
 * area, 24 px icons, 12 px labels, the current tab filled and blue, the basket carrying its count.
 * Tapping the current tab scrolls to the top. It steps aside while the keyboard is up and
 * wherever a sticky action bar takes its place (the shell decides, `tabBarVisible`).
 *
 * A fifth tab, Konto, waits for its route (docs/mobile/REQUESTS.md); the bar never links to a 404.
 *
 * Prefetch happens on press, not on click: on a touch screen `mousedown` fires with the tap, too
 * late to be worth anything, so the request starts on `pointerdown`.
 */

import { router } from '@inertiajs/vue3'
import { computed } from 'vue'
import TabIcon, { type TabIconName } from './TabIcon.vue'
import { useShared } from '../../composables/useShared'
import { useMobileShell } from '../../composables/mobile/useMobileShell'
import { markNext } from '../../composables/mobile/useNavigationDirection'

interface Tab {
    key: string
    label: string
    href: string
    icon: TabIconName
    routes: string[]
}

const TABS: readonly Tab[] = [
    { key: 'start', label: 'Start', href: '/', icon: 'home', routes: ['startseite'] },
    { key: 'felgen', label: 'Felgen', href: '/felgen', icon: 'wheel', routes: ['felgen.index', 'felgen.show', 'felgen.suchen'] },
    { key: 'check', label: 'Check', href: '/rimify-check', icon: 'check-circle', routes: ['check.index', 'check.ergebnis'] },
    { key: 'warenkorb', label: 'Warenkorb', href: '/warenkorb', icon: 'cart', routes: ['warenkorb.index', 'kasse.index', 'bestellung.show'] },
]

const shared = useShared()
const shell = useMobileShell()

const tabs = computed(() =>
    TABS.map((tab) => ({
        ...tab,
        current: tab.routes.includes(shared.value.routeName ?? ''),
        count: tab.key === 'warenkorb' ? shared.value.cartCount : 0,
    }))
)

function press(tab: Tab & { current: boolean }): void {
    if (!tab.current) {
        router.prefetch(tab.href, { method: 'get' }, { cacheFor: 30_000 })
    }
}

function go(tab: Tab & { current: boolean }, event: MouseEvent): void {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
    }

    event.preventDefault()

    if (tab.current) {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })

        return
    }

    markNext('tab')
    router.visit(tab.href)
}
</script>

<template>
    <nav class="mtab" :class="{ 'mtab--hidden': !shell.tabBarVisible.value }" aria-label="Hauptnavigation">
        <a
            v-for="tab in tabs"
            :key="tab.key"
            :href="tab.href"
            class="mtab__item"
            :class="{ 'mtab__item--current': tab.current }"
            :aria-current="tab.current ? 'page' : undefined"
            :aria-label="tab.count > 0 ? `${tab.label}, ${tab.count} Artikel` : undefined"
            @pointerdown="press(tab)"
            @click="go(tab, $event)"
        >
            <span class="mtab__icon">
                <TabIcon :name="tab.icon" :active="tab.current" />
                <span v-if="tab.count > 0" class="badge badge--count mtab__badge" aria-hidden="true">{{ tab.count }}</span>
            </span>
            <span class="mtab__label">{{ tab.label }}</span>
        </a>
    </nav>
</template>

<style scoped>
.mtab {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: var(--z-header);
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    height: calc(var(--bottomnav-h) + env(safe-area-inset-bottom));
    padding-bottom: env(safe-area-inset-bottom);
    background: var(--c-surface);
    border-top: 1px solid var(--c-line);
    transition: transform var(--d-2) var(--ease-std), visibility 0s linear 0s;
    view-transition-name: m-tabbar;
}

/* Off the bottom edge while the keyboard is up; out of the accessibility tree once it has left. */
.mtab--hidden {
    transform: translateY(100%);
    visibility: hidden;
    transition: transform var(--d-2) var(--ease-in), visibility 0s linear var(--d-2);
}

.mtab__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--sp-4);
    min-height: 44px;
    color: var(--c-ink-2);
    text-decoration: none;
    touch-action: manipulation;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    transition: transform var(--d-1) var(--ease-std);
}

.mtab__item:active {
    transform: scale(0.98);
}

.mtab__item--current {
    color: var(--c-blue);
}

@media (hover: hover) and (pointer: fine) {
    .mtab__item:hover {
        color: var(--c-ink);
    }
}

.mtab__icon {
    position: relative;
    display: inline-flex;
}

.mtab__badge {
    position: absolute;
    top: calc(-1 * var(--sp-4));
    right: calc(-1 * var(--sp-8));
}

.mtab__label {
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    font-weight: 500;
}

@media (prefers-reduced-motion: reduce) {
    .mtab,
    .mtab--hidden {
        transition: none;
    }
}
</style>
