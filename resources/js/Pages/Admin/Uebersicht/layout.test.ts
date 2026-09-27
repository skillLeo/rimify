import { describe, expect, it } from 'vitest'
import { MID, place, WIDE, type Slot } from './layout'

/*
 * The Übersicht's grid: the brief's spans where every card is there, and no half-empty band where a
 * role lacks one.
 */

const SALES: Slot[] = ['revenue', 'today', 'verdicts', 'topWheels', 'health', 'coverage', 'demand', 'orders', 'todo', 'activity']

describe('the Übersicht grid', () => {
    it('gives a selling role the brief\'s spans, every row twelve', () => {
        expect(place(SALES, WIDE)).toEqual({
            revenue: 8,
            today: 4,
            verdicts: 5,
            topWheels: 4,
            health: 3,
            coverage: 7,
            demand: 5,
            orders: 12,
            todo: 8,
            activity: 4,
        })
    })

    it('widens the last card of a row a role cannot fill', () => {
        // Katalog: no revenue, no coverage — Heute takes its row, Top-Felgen and Systemzustand close theirs.
        expect(place(['today', 'topWheels', 'health', 'quality', 'todo'], WIDE)).toEqual({ today: 4, topWheels: 4, health: 4, quality: 12, todo: 12 })
    })

    it('stacks two by two between 900 and 1279', () => {
        expect(place(SALES, MID)).toEqual({
            revenue: 12,
            today: 6,
            verdicts: 6,
            topWheels: 6,
            health: 6,
            coverage: 12,
            demand: 12,
            orders: 12,
            todo: 6,
            activity: 6,
        })
    })

    it('never lets a row run past twelve or stop short of it', () => {
        const spans = place(SALES, WIDE)
        let used = 0

        for (const slot of SALES) {
            used += spans[slot] ?? 0
            expect(used).toBeLessThanOrEqual(12 * Math.ceil(used / 12))
        }

        expect(used % 12).toBe(0)
    })
})
