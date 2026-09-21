/**
 * The shell's own state — the palette and the shortcut help — shared between the header, the
 * footer and the layout without a global store: whoever opens the palette from the footer link
 * opens the same palette the header's search icon opens.
 */

import { inject, provide, ref, type InjectionKey, type Ref } from 'vue'

export interface ShellStore {
    readonly paletteOpen: Ref<boolean>
    readonly helpOpen: Ref<boolean>
    readonly vehicleOpen: Ref<boolean>
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
