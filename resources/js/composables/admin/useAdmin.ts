/**
 * The admin shell's props and state, in one place.
 *
 * `usePage().props.admin` arrives untyped (SharedProps keeps an index signature for the storefront),
 * so it is narrowed once here, with the default every reader would otherwise invent on its own. The
 * narrowing is defensive on purpose: a prop the server stops sending must render an empty rail, not
 * throw inside the layout that every admin page shares.
 *
 * The shell's own state — whether the palette or the shortcuts dialog is open, whether the rail is
 * collapsed — is provided by the layout and injected by the pieces, so the topbar's search button,
 * the ⌘K shortcut and the phone's Suche tab all open the one palette.
 */

import { usePage } from '@inertiajs/vue3'
import { computed, inject, provide, ref, type ComputedRef, type InjectionKey, type Ref } from 'vue'
import type { AdminShared } from '../../types/admin'

const EMPTY: AdminShared = {
    can: {},
    account: null,
    nav: [],
    environment: null,
    preferences: { railCollapsed: false },
    breadcrumbs: [],
    supportEmail: null,
}

export function useAdmin(): ComputedRef<AdminShared> {
    const page = usePage()

    return computed(() => {
        const raw: unknown = (page.props as Record<string, unknown>).admin

        if (raw === null || typeof raw !== 'object') {
            return EMPTY
        }

        const admin = raw as Partial<AdminShared>

        return {
            can: admin.can ?? EMPTY.can,
            account: admin.account ?? null,
            nav: Array.isArray(admin.nav) ? admin.nav : [],
            environment: admin.environment === 'local' || admin.environment === 'staging' ? admin.environment : null,
            preferences: { railCollapsed: admin.preferences?.railCollapsed === true },
            breadcrumbs: Array.isArray(admin.breadcrumbs) ? admin.breadcrumbs : [],
            supportEmail: typeof admin.supportEmail === 'string' ? admin.supportEmail : null,
        }
    })
}

export interface AdminShell {
    paletteOpen: Ref<boolean>
    shortcutsOpen: Ref<boolean>
    railCollapsed: Ref<boolean>
    toggleRail: () => void
}

const SHELL: InjectionKey<AdminShell> = Symbol('admin-shell')

export function provideAdminShell(shell: AdminShell): void {
    provide(SHELL, shell)
}

/**
 * The shell as the layout provided it. Outside the layout — a component test mounting one piece —
 * it falls back to inert state rather than throwing, so a part can be tested on its own.
 */
export function useAdminShell(): AdminShell {
    return (
        inject(SHELL, null) ?? {
            paletteOpen: ref(false),
            shortcutsOpen: ref(false),
            railCollapsed: ref(false),
            toggleRail: () => undefined,
        }
    )
}
