/**
 * Where each card of the Übersicht sits on its twelve columns (the density brief): the wide spans are
 * the brief's — Umsatz 8 / Heute 4 · Verdikte 5 / Top-Felgen 4 / Systemzustand 3 · Abdeckung 7 /
 * Nachfrage-Lücken 5 · Neueste Bestellungen 12 · Zu erledigen 8 / Letzte Aktivität 4 — and between
 * 900 and 1279 px the cards stack two by two or take the width. Below 900 every card takes the width.
 *
 * A role that lacks a card never leaves a hole: the cards fill rows of twelve in order, and a row
 * that does not reach twelve widens its last card to the edge. A band half empty reads as broken.
 */

export type Slot = 'revenue' | 'today' | 'verdicts' | 'topWheels' | 'health' | 'coverage' | 'demand' | 'orders' | 'quality' | 'todo' | 'activity'

export const WIDE: Record<Slot, number> = {
    revenue: 8,
    today: 4,
    verdicts: 5,
    topWheels: 4,
    health: 3,
    coverage: 7,
    demand: 5,
    orders: 12,
    quality: 12,
    todo: 8,
    activity: 4,
}

export const MID: Record<Slot, number> = {
    revenue: 12,
    today: 6,
    verdicts: 6,
    topWheels: 6,
    health: 6,
    coverage: 12,
    demand: 12,
    orders: 12,
    quality: 12,
    todo: 6,
    activity: 6,
}

/** The spans of these cards, in this order, filling rows of twelve with no row left short. */
export function place(slots: Slot[], spans: Record<Slot, number>): Partial<Record<Slot, number>> {
    const placed: Partial<Record<Slot, number>> = {}
    let row: Slot[] = []
    let used = 0

    const close = (): void => {
        const last = row[row.length - 1]

        if (last !== undefined && used < 12) {
            placed[last] = (placed[last] ?? 0) + 12 - used
        }

        row = []
        used = 0
    }

    for (const slot of slots) {
        const span = Math.min(12, spans[slot])

        if (used + span > 12) {
            close()
        }

        placed[slot] = span
        row.push(slot)
        used += span
    }

    close()

    return placed
}

/** A card's place as the grid reads it: its span at both widths, as custom properties. */
export function cellStyle(wide: number | undefined, mid: number | undefined): Record<string, number> {
    return { '--span-wide': wide ?? 12, '--span-mid': mid ?? 12 }
}
