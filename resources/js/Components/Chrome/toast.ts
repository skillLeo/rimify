import type { AddedToBasket } from '../../types/rimify'

/** How long a confirmation stays on screen. Long enough to read three words twice. */
export const TOAST_MS = 4000

/** A toast with an action stays half as long again: there is a button to find. */
export const TOAST_ACTION_MS = TOAST_MS * 1.5

/** The confirmation a response flashed, or null when it flashed none. */
export function toastFrom(props: Record<string, unknown> | undefined | null): string | null {
    const flash = props?.flash

    if (flash === null || typeof flash !== 'object') {
        return null
    }

    const toast = (flash as { toast?: unknown }).toast

    return typeof toast === 'string' && toast.trim() !== '' ? toast : null
}

/** What a response put in the basket (#16), or null: the panel after an add shows it, and the toast then stays quiet. */
export function addedFrom(props: Record<string, unknown> | undefined | null): AddedToBasket | null {
    const flash = props?.flash

    if (flash === null || typeof flash !== 'object') {
        return null
    }

    const added = (flash as { added?: unknown }).added

    return added !== null && typeof added === 'object' && Array.isArray((added as AddedToBasket).lines) && (added as AddedToBasket).lines.length > 0
        ? (added as AddedToBasket)
        : null
}

/** What the client channel carries: the sentence and, optionally, one thing to do about it. */
export interface ToastMessage {
    text: string
    action?: { label: string; run: () => void }
    /** A check for a confirmation (the default); `info` for a refusal or a limit. */
    icon?: 'check-circle' | 'info'
}

type Listener = (message: ToastMessage) => void

const listeners = new Set<Listener>()

/**
 * The client channel (home-overhaul.md §2.3): a component shows a confirmation without a server
 * round trip — "zum Vergleich hinzugefügt", with *Rückgängig*. One toast at a time; a new one
 * replaces the current. Module state, so a caller needs no injection and no layout.
 */
export const toast = {
    show(message: ToastMessage): void {
        for (const listener of listeners) {
            listener(message)
        }
    },
    subscribe(listener: Listener): () => void {
        listeners.add(listener)

        return () => {
            listeners.delete(listener)
        }
    },
}
