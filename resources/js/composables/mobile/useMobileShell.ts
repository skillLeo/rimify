/**
 * The phone shell's own state, provided by MobileLayout and read by its parts: which overlay is
 * open, whether a sticky action bar has taken the tab bar's place, whether the page runs as an
 * installed app. Every open sheet registers a closer here, so one call closes them all before a
 * navigation.
 */

import { computed, inject, provide, ref, type ComputedRef, type InjectionKey, type Ref } from 'vue'
import { useVisualViewport } from './useVisualViewport'

export interface MobileShell {
    readonly searchOpen: Ref<boolean>
    readonly vehicleOpen: Ref<boolean>
    /** A page that mounts a StickyActionBar sets this; the tab bar steps aside. */
    readonly stickyBar: Ref<boolean>
    readonly keyboardOpen: Readonly<Ref<boolean>>
    readonly standalone: Ref<boolean>
    readonly tabBarVisible: ComputedRef<boolean>
    /** Feature-detected, 8 ms, add-to-cart only. Never more. */
    haptic(): void
    registerSheet(close: () => void): () => void
    closeSheets(): void
}

const KEY: InjectionKey<MobileShell> = Symbol('mobile-shell')

export function provideMobileShell(options: { tabBar: Ref<boolean> }): MobileShell {
    const viewport = useVisualViewport()
    const closers = new Set<() => void>()

    const store: MobileShell = {
        searchOpen: ref(false),
        vehicleOpen: ref(false),
        stickyBar: ref(false),
        keyboardOpen: viewport.keyboardOpen,
        standalone: ref(false),
        tabBarVisible: computed(() => options.tabBar.value && !store.stickyBar.value && !viewport.keyboardOpen.value),
        haptic: () => {
            if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
                navigator.vibrate(8)
            }
        },
        registerSheet: (close) => {
            closers.add(close)

            return () => closers.delete(close)
        },
        closeSheets: () => {
            store.searchOpen.value = false
            store.vehicleOpen.value = false

            for (const close of closers) {
                close()
            }
        },
    }

    provide(KEY, store)

    return store
}

/**
 * Whether an Inertia `before` event announces a real navigation. A prefetch (fired on a row's
 * `pointerdown`) and a partial reload go through the same event, and neither may close a sheet:
 * a sheet that closes on the press swallows the click that was meant for its row.
 */
export function isNavigationVisit(visit: { prefetch?: boolean; only?: string[]; except?: string[]; preserveState?: boolean }): boolean {
    if (visit.prefetch) {
        return false
    }

    return (visit.only?.length ?? 0) === 0 && (visit.except?.length ?? 0) === 0
}

export function useMobileShell(): MobileShell {
    const store = inject(KEY)

    if (store === undefined) {
        throw new Error('useMobileShell() needs provideMobileShell() in MobileLayout')
    }

    return store
}
