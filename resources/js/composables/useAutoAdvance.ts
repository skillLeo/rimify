/**
 * The HSN field moves on to the TSN by itself after its fourth digit — one tap fewer on a touch screen. A keyboard user
 * presses Tab there out of habit, and that Tab left the empty TSN for the next control: the TSN was typed into nothing
 * (Human QA, HQ-31). The first Tab right after the move stays on the TSN while it is empty; any other key, a Tab once
 * something is typed, Shift+Tab and leaving the field all end the hold.
 */
export interface AutoAdvance {
    /** Call when the focus was moved on by itself. */
    moved(): void
    /** The next field's keydown. */
    keydown(event: KeyboardEvent): void
    /** The next field's blur. */
    reset(): void
}

export function useAutoAdvance(): AutoAdvance {
    let held = false

    return {
        moved(): void {
            held = true
        },
        keydown(event: KeyboardEvent): void {
            const empty = (event.target as HTMLInputElement | null)?.value === ''

            if (held && event.key === 'Tab' && !event.shiftKey && empty) {
                event.preventDefault()
            }

            held = false
        },
        reset(): void {
            held = false
        },
    }
}
