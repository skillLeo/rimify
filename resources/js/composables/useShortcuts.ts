/**
 * The keyboard shortcuts of the shell: `/` focuses the search, Ctrl/⌘+K opens the palette, `?`
 * opens the help. None of them fires while the visitor is typing in a field, and none fires
 * while a dialog is open — Esc belongs to the dialog then.
 */

import { onBeforeUnmount, onMounted } from 'vue'

export interface ShortcutHandlers {
    onSearch(): void
    onPalette(): void
    onHelp(): void
}

/** True when the key event came from something that takes typing. */
export function isTyping(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
        return false
    }

    if (target.isContentEditable) {
        return true
    }

    const tag = target.tagName

    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

/** Which handler, if any, a key event maps to. Exposed for the unit test. */
export function shortcutFor(event: KeyboardEvent): keyof ShortcutHandlers | null {
    if (isTyping(event.target)) {
        // The palette is the one shortcut that also works inside a field, as in every editor.
        return (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' ? 'onPalette' : null
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        return 'onPalette'
    }

    if (event.ctrlKey || event.metaKey || event.altKey) {
        return null
    }

    if (event.key === '/') {
        return 'onSearch'
    }

    if (event.key === '?') {
        return 'onHelp'
    }

    return null
}

export function useShortcuts(handlers: ShortcutHandlers): void {
    function onKeydown(event: KeyboardEvent): void {
        if (document.querySelector('[role="dialog"][data-state="open"]') !== null && !(event.ctrlKey || event.metaKey)) {
            return
        }

        const handler = shortcutFor(event)

        if (handler === null) {
            return
        }

        event.preventDefault()
        handlers[handler]()
    }

    onMounted(() => document.addEventListener('keydown', onKeydown))
    onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
}
