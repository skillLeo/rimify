/** How long a confirmation stays on screen. Long enough to read three words twice. */
export const TOAST_MS = 4000

/** The confirmation a response flashed, or null when it flashed none. */
export function toastFrom(props: Record<string, unknown> | undefined | null): string | null {
    const flash = props?.flash

    if (flash === null || typeof flash !== 'object') {
        return null
    }

    const toast = (flash as { toast?: unknown }).toast

    return typeof toast === 'string' && toast.trim() !== '' ? toast : null
}
