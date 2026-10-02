/**
 * The shell's own state — the palette and the shortcut help — shared between the header, the
 * footer and the layout without a global store: whoever opens the palette from the footer link
 * opens the same palette the header's search icon opens.
 */

import { inject, onBeforeUnmount, provide, ref, watch, type InjectionKey, type Ref } from 'vue'

export interface ShellStore {
    readonly paletteOpen: Ref<boolean>
    readonly helpOpen: Ref<boolean>
    readonly vehicleOpen: Ref<boolean>
    /** A page's own price bar holds the bottom edge: the compare tray steps aside (the product page, D-133). */
    readonly stickyBar: Ref<boolean>
    focusSearch(): void
    registerSearch(focus: () => void): void
}

const KEY: InjectionKey<ShellStore> = Symbol('shell')

export function provideShell(): ShellStore {
    let focus: (() => void) | null = null

    const store: ShellStore = {
        paletteOpen: ref(false),
        helpOpen: ref(false),
        vehicleOpen: ref(false),
        stickyBar: ref(false),
        focusSearch: () => {
            if (focus !== null) {
                focus()

                return
            }

            // No search field on this width: the palette is the search.
            store.paletteOpen.value = true
        },
        registerSearch: (fn) => {
            focus = fn
        },
    }

    provide(KEY, store)

    return store
}

export function useShell(): ShellStore {
    const store = inject(KEY)

    if (store === undefined) {
        throw new Error('useShell() needs provideShell() in the layout')
    }

    return store
}

/**
 * A page's sticky bar claims the bottom edge while `shown` is true, and gives it back when the page goes. Without a
 * layout (a component test) there is no edge to claim.
 */
export function claimBottomEdge(shown: () => boolean): void {
    const store = inject(KEY, null)

    if (store === null) {
        return
    }

    watch(shown, (on) => {
        store.stickyBar.value = on
    }, { immediate: true })

    onBeforeUnmount(() => {
        store.stickyBar.value = false
    })
}
