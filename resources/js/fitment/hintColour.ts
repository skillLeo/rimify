/**
 * The colour a code gives the shop's „Mit Auflagen“ hint (the client's item 23; Rot since his round of 08.11.2026, §6, D-439). How it
 * looks, never what it says: the server decides the hint from the codes (FitmentVerdict::hintColour), the admin only chooses per code.
 */

export type HintColour = 'green' | 'yellow' | 'red'

/** In the order staff choose from, quiet to loud. */
export const HINT_COLOURS: readonly { value: HintColour; label: string }[] = [
    { value: 'green', label: 'Grün' },
    { value: 'yellow', label: 'Gelb' },
    { value: 'red', label: 'Rot' },
]

export function hintColourLabel(colour: string | null | undefined): string {
    return HINT_COLOURS.find((c) => c.value === colour)?.label ?? 'Grün'
}
