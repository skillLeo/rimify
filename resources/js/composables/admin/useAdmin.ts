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
import type { RailState } from './railResize'
import type { AdminHealth, AdminShared } from '../../types/admin'
import { RAIL, clampWidth } from './railResize'

const EMPTY: AdminShared = {
    can: {},
    account: null,
    nav: [],
    environment: null,
    preferences: { railCollapsed: false, railWidth: RAIL.default },
    breadcrumbs: [],
    supportEmail: null,
    notifications: { unread: null, offered: false },
    health: null,
    quickActions: [],
}

/** The urgent problem's banner, only in the shape the panel knows (maintenance, a dead queue). */
function banner(raw: unknown): AdminHealth['banner'] {
    if (raw === null || typeof raw !== 'object') {
        return null
    }

    const { key, sentence } = raw as { key?: unknown; sentence?: unknown }

    return (key === 'maintenance' || key === 'queue') && typeof sentence === 'string' ? { key, sentence } : null
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
            preferences: { railCollapsed: admin.preferences?.railCollapsed === true, railWidth: clampWidth(admin.preferences?.railWidth) },
            breadcrumbs: Array.isArray(admin.breadcrumbs) ? admin.breadcrumbs : [],
            supportEmail: typeof admin.supportEmail === 'string' ? admin.supportEmail : null,
            notifications: {
                unread: typeof admin.notifications?.unread === 'number' && admin.notifications.unread >= 0 ? admin.notifications.unread : null,
                offered: admin.notifications?.offered === true,
            },
            health:
                admin.health && (admin.health.state === 'ok' || admin.health.state === 'warn' || admin.health.state === 'bad') && typeof admin.health.sentence === 'string'
                    ? {
                          state: admin.health.state,
                          sentence: admin.health.sentence,
                          label: typeof admin.health.label === 'string' ? admin.health.label : admin.health.sentence,
                          count: typeof admin.health.count === 'string' ? admin.health.count : null,
                          href: typeof admin.health.href === 'string' ? admin.health.href : null,
                          banner: banner(admin.health.banner),
                      }
                    : null,
            quickActions: Array.isArray(admin.quickActions) ? admin.quickActions : [],
        }
    })
}

/** The rail's width and state, as the layout keeps them (AdminLayout, AdminRailHandle). */
export interface RailControl {
    /** The width in px (232–400) — while collapsed, the width it opens to. */
    width: Ref<number>
    /** Collapsed as it is shown: by choice, or by a window without room beside 960 px of content. */
    shown: ComputedRef<boolean>
    /** Collapsed by the window, whatever was chosen: nothing to open. */
    forced: ComputedRef<boolean>
    /** A drag in progress: nothing animates, and charts wait to measure until it ends. */
    resizing: Ref<boolean>
    /** A new state: `animate` for collapse, expand and reset; `save` now, or within the next second. */
    set: (state: RailState, options?: { animate?: boolean; save?: 'now' | 'soon' }) => void
}

export interface AdminShell {
    paletteOpen: Ref<boolean>
    shortcutsOpen: Ref<boolean>
    railCollapsed: Ref<boolean>
    toggleRail: () => void
    /** Absent in a component test that mounts one part on its own. */
    rail?: RailControl
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
