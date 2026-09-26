import { describe, expect, it } from 'vitest'
import { activeCount, berlinToday, formFromFilters, parseGermanDay, presetRange, queryFromForm, shiftDay } from './filters'

/*
 * The Protokoll's dates: German on the page, ISO for the server, Berlin's day wherever the browser
 * is, and a typed date that is not a real day never sent at all.
 */

const TODAY = '2026-09-26'
const NONE = { person: null, bereich: null, von: null, bis: null }

describe('the day', () => {
    it('is Berlin\'s, even from a browser in Karachi at midnight UTC', () => {
        // 23:30 UTC on the 25th is already 01:30 on the 26th in Berlin (summer time).
        expect(berlinToday(new Date('2026-09-25T23:30:00Z'))).toBe('2026-09-26')
    })

    it('moves by whole days across a month and a clock change', () => {
        expect(shiftDay('2026-10-01', -1)).toBe('2026-09-30')
        expect(shiftDay('2026-10-26', -1)).toBe('2026-10-25')
    })

    it('reads TT.MM.JJJJ and refuses what is not a real day', () => {
        expect(parseGermanDay('1.9.2026')).toBe('2026-09-01')
        expect(parseGermanDay(' 01.09.2026 ')).toBe('2026-09-01')
        expect(parseGermanDay('31.02.2026')).toBeNull()
        expect(parseGermanDay('2026-09-01')).toBeNull()
    })
})

describe('the Zeitraum', () => {
    it('ends every preset today and counts today in', () => {
        expect(presetRange('heute', TODAY)).toEqual({ von: TODAY, bis: TODAY })
        expect(presetRange('7', TODAY)).toEqual({ von: '2026-09-20', bis: TODAY })
        expect(presetRange('30', TODAY)).toEqual({ von: '2026-08-28', bis: TODAY })
    })

    it('shows the server\'s filters as the preset they match, else as an own range in German', () => {
        expect(formFromFilters({ ...NONE, von: '2026-09-20', bis: TODAY }, TODAY).zeitraum).toBe('7')
        expect(formFromFilters({ ...NONE, von: '2026-09-01', bis: '2026-09-10' }, TODAY)).toMatchObject({
            zeitraum: 'eigen',
            von: '01.09.2026',
            bis: '10.09.2026',
        })
        expect(formFromFilters(NONE, TODAY).zeitraum).toBe('')
    })

    it('sends ISO days, leaves empty filters out, and never sends a range that runs backwards', () => {
        expect(queryFromForm({ person: '', bereich: 'team', zeitraum: '7', von: '', bis: '' }, TODAY)).toEqual({
            query: { bereich: 'team', von: '2026-09-20', bis: TODAY },
        })
        expect(queryFromForm({ person: '', bereich: '', zeitraum: 'eigen', von: '10.09.2026', bis: '01.09.2026' }, TODAY)).toEqual({
            error: 'Das Enddatum liegt vor dem Anfangsdatum.',
        })
        expect(queryFromForm({ person: '', bereich: '', zeitraum: 'eigen', von: '10/09/2026', bis: '' }, TODAY)).toHaveProperty('error')
        expect(queryFromForm({ person: '', bereich: '', zeitraum: '', von: '', bis: '' }, TODAY)).toEqual({ query: {} })
    })

    it('counts a date range as one filter', () => {
        expect(activeCount({ person: '3', bereich: 'team', von: '2026-09-01', bis: '2026-09-10' })).toBe(3)
        expect(activeCount(NONE)).toBe(0)
    })
})
