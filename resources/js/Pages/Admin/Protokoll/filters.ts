/**
 * The Protokoll's filter form and its dates, kept apart from the page so the arithmetic is tested.
 *
 * The server filters by `von` and `bis` as ISO days (YYYY-MM-DD, read as Berlin days). The page
 * speaks German instead: a Zeitraum — heute, the last 7 or 30 days, or an own range typed as
 * TT.MM.JJJJ — never the browser's own date field, whose format follows the browser's language and
 * not the shop's (R-10).
 */

import type { ProtokollFilters } from '../../../types/admin/protokoll'

export type Zeitraum = '' | 'heute' | '7' | '30' | 'eigen'

export interface FilterForm {
    person: string
    bereich: string
    zeitraum: Zeitraum
    /** Only for `eigen`: what the person typed, TT.MM.JJJJ. */
    von: string
    bis: string
}

/** Today in Berlin as YYYY-MM-DD — the day the server reads, wherever the browser is. */
export function berlinToday(now: Date = new Date()): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

/** An ISO day moved by whole days, without a time of day to trip over a clock change. */
export function shiftDay(iso: string, days: number): string {
    const [y, m, d] = iso.split('-').map(Number)
    const date = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1))
    date.setUTCDate(date.getUTCDate() + days)

    return date.toISOString().slice(0, 10)
}

/** `01.09.2026` → `2026-09-01`; null for anything that is not a real day. */
export function parseGermanDay(text: string): string | null {
    const match = /^\s*(\d{1,2})\.(\d{1,2})\.(\d{4})\s*$/.exec(text)

    if (!match) {
        return null
    }

    const [, d, m, y] = match
    const iso = `${y}-${m!.padStart(2, '0')}-${d!.padStart(2, '0')}`
    const date = new Date(`${iso}T00:00:00Z`)

    return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso ? null : iso
}

/** `2026-09-01` → `01.09.2026`. */
export function formatGermanDay(iso: string): string {
    const [y, m, d] = iso.split('-')

    return `${d}.${m}.${y}`
}

/** The range a preset stands for, ending today. */
export function presetRange(zeitraum: Exclude<Zeitraum, '' | 'eigen'>, today: string): { von: string; bis: string } {
    const back = zeitraum === 'heute' ? 0 : Number(zeitraum) - 1

    return { von: shiftDay(today, -back), bis: today }
}

/** The form that shows the filters the server applied: a preset where they match one, else an own range. */
export function formFromFilters(filters: ProtokollFilters, today: string): FilterForm {
    const base = { person: filters.person ?? '', bereich: filters.bereich ?? '' }

    if (!filters.von && !filters.bis) {
        return { ...base, zeitraum: '', von: '', bis: '' }
    }

    for (const preset of ['heute', '7', '30'] as const) {
        const range = presetRange(preset, today)

        if (filters.von === range.von && filters.bis === range.bis) {
            return { ...base, zeitraum: preset, von: '', bis: '' }
        }
    }

    return {
        ...base,
        zeitraum: 'eigen',
        von: filters.von ? formatGermanDay(filters.von) : '',
        bis: filters.bis ? formatGermanDay(filters.bis) : '',
    }
}

/**
 * The query the form asks for, or the German sentence that says what is wrong with an own range.
 * Empty values are left out, so an unfiltered log is the bare URL.
 */
export function queryFromForm(form: FilterForm, today: string): { query: Record<string, string> } | { error: string } {
    const query: Record<string, string> = {}

    if (form.person) {
        query.person = form.person
    }

    if (form.bereich) {
        query.bereich = form.bereich
    }

    if (form.zeitraum === 'heute' || form.zeitraum === '7' || form.zeitraum === '30') {
        Object.assign(query, presetRange(form.zeitraum, today))
    }

    if (form.zeitraum === 'eigen') {
        const von = form.von.trim() === '' ? '' : parseGermanDay(form.von)
        const bis = form.bis.trim() === '' ? '' : parseGermanDay(form.bis)

        if (von === null || bis === null) {
            return { error: 'Bitte schreib das Datum als TT.MM.JJJJ, zum Beispiel 01.09.2026.' }
        }

        if (von && bis && bis < von) {
            return { error: 'Das Enddatum liegt vor dem Anfangsdatum.' }
        }

        if (von) {
            query.von = von
        }

        if (bis) {
            query.bis = bis
        }
    }

    return { query }
}

/** How many filters are on — for the phone's "Filter · 2". */
export function activeCount(filters: ProtokollFilters): number {
    return [filters.person, filters.bereich, filters.von || filters.bis].filter(Boolean).length
}
