/**
 * The admin's keyboard, bound once by the layout (docs/design/sections/admin-shell.md §10.2).
 *
 * ⌘K / Strg K opens the palette anywhere, even inside a field — it is a modifier combination and
 * steals nothing. The single keys (`/`, `[`, `?`, and the `g` sequences) fire only when focus is not
 * somewhere text is typed, so nobody navigates away mid-sentence.
 *
 * The `g` sequences go only where the viewer can actually go: a target that is not in their tree —
 * not permitted, or not built — is not bound at all, so a shortcut can never lead to a 403.
 */

import { router } from '@inertiajs/vue3'
import { onBeforeUnmount, onMounted, type ComputedRef } from 'vue'
import type { AdminNavGroup } from '../../types/admin'
import type { AdminShell } from './useAdmin'

/**
 * The second key of a `g` sequence and where it goes (admin-shell.md §10.2): either one page, or a
 * group — meaning that group's first page the viewer has, whichever that is today.
 */
export const GO_TARGETS: ReadonlyArray<{ key: string; page?: string; group?: string }> = [
    { key: 'u', page: '/admin' },
    { key: 'b', page: '/admin/bestellungen' },
    { key: 'k', group: 'katalog' },
    { key: 'f', group: 'fahrzeuge' },
    { key: 'g', page: '/admin/gutachten' },
    { key: 'e', group: 'einstellungen' },
]

/** Long enough to type two keys without hurrying; short enough that a stray letter later is not a jump. */
const SEQUENCE_MS = 1200

/** The `g` targets this viewer has, named the way the rail names them. */
export function goTargets(nav: AdminNavGroup[]): Array<{ key: string; label: string; href: string }> {
    const targets: Array<{ key: string; label: string; href: string }> = []

    for (const target of GO_TARGETS) {
        if (target.page) {
            const page = nav.flatMap((g) => g.pages).find((p) => p.href === target.page)

            if (page) {
                targets.push({ key: target.key, label: page.label, href: page.href })
            }

            continue
        }

        const group = nav.find((g) => g.key === target.group)
        const first = group?.pages[0]

        if (group && first) {
            targets.push({ key: target.key, label: group.label, href: first.href })
        }
    }

    return targets
}

/** Whether a menu or a dialog is open — reka marks both with `data-state="open"`. */
export function overlayOpen(): boolean {
    return document.querySelector('[role="menu"][data-state="open"], [role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]') !== null
}

/** Whether the keystroke belongs to something being typed. */
export function isTyping(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
        return false
    }

    return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

export function useAdminShortcuts(shell: AdminShell, nav: ComputedRef<AdminNavGroup[]>): void {
    let pendingG = 0

    function onKeydown(event: KeyboardEvent): void {
        // On a German keyboard `[` is AltGr 8, and Windows reports AltGr as Ctrl + Alt. Without this
        // the rail's own key could never be typed by the people it was built for.
        const altGr = event.getModifierState('AltGraph')
        const mod = (event.metaKey || event.ctrlKey) && !altGr
        const alt = event.altKey && !altGr

        if (mod && !alt && event.key.toLowerCase() === 'k') {
            event.preventDefault()
            shell.paletteOpen.value = true

            return
        }

        // Saving is the form's business (useDirtyForm listens for it too); the browser's "save this
        // web page" dialog is never what anybody in the admin meant.
        if (mod && !alt && event.key.toLowerCase() === 's') {
            event.preventDefault()

            return
        }

        // An open menu or dialog owns its keys (typeahead, Esc) — a letter typed into the user menu is
        // a search for a menu row, never a jump to another page. A held key is one press, not many.
        if (event.defaultPrevented || mod || event.repeat || isTyping(event.target) || shell.paletteOpen.value || shell.shortcutsOpen.value || overlayOpen()) {
            return
        }

        // `/`, `?` and `[` are read by the character they produce, whatever it took to type it: on a
        // Mac's German layout `[` is Option 5, and refusing Alt there made the key untypeable. Letters
        // are different — Option g is not g — so the `g` sequences still want no Alt.
        if (alt && !['/', '?', '['].includes(event.key)) {
            pendingG = 0

            return
        }

        if (pendingG && Date.now() - pendingG <= SEQUENCE_MS) {
            pendingG = 0
            const target = goTargets(nav.value).find((t) => t.key === event.key.toLowerCase())

            if (target) {
                event.preventDefault()
                router.visit(target.href)
            }

            return
        }

        pendingG = 0

        switch (event.key) {
            case '/':
                event.preventDefault()
                shell.paletteOpen.value = true
                break
            case '[':
                // The rail is only the viewer's to collapse from 1024 px; below it is collapsed anyway.
                if (window.matchMedia('(min-width: 1024px)').matches) {
                    event.preventDefault()
                    shell.toggleRail()
                }
                break
            case '?':
                event.preventDefault()
                shell.shortcutsOpen.value = true
                break
            case 'g':
                pendingG = Date.now()
                break
        }
    }

    onMounted(() => window.addEventListener('keydown', onKeydown))
    onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
}
