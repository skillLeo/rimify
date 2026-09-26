/**
 * Calendar days as every admin filter speaks them: the server reads ISO days (YYYY-MM-DD) as days in
 * Europe/Berlin; the page speaks German — heute, the last 7 or 30 days, or an own range typed as
 * TT.MM.JJJJ — never the browser's own date field, whose format follows the browser's language and
 * not the shop's (R-10).
 */

export type Zeitraum = '' | 'heute' | '7' | '30' | 'eigen'

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

/** The Zeitraum form for a range the server applied: a preset where it matches one, else an own range. */
export function rangeForm(von: string | null, bis: string | null, today: string): { zeitraum: Zeitraum; von: string; bis: string } {
    if (!von && !bis) {
        return { zeitraum: '', von: '', bis: '' }
    }

    for (const preset of ['heute', '7', '30'] as const) {
        const range = presetRange(preset, today)

        if (von === range.von && bis === range.bis) {
            return { zeitraum: preset, von: '', bis: '' }
        }
    }

    return { zeitraum: 'eigen', von: von ? formatGermanDay(von) : '', bis: bis ? formatGermanDay(bis) : '' }
}

/**
 * The ISO range a Zeitraum form asks for, or the German sentence that says what is wrong with an own
 * range. Empty ends are left out.
 */
export function rangeQuery(form: { zeitraum: Zeitraum; von: string; bis: string }, today: string): { query: { von?: string; bis?: string } } | { error: string } {
    if (form.zeitraum === 'heute' || form.zeitraum === '7' || form.zeitraum === '30') {
        return { query: presetRange(form.zeitraum, today) }
    }

    if (form.zeitraum !== 'eigen') {
        return { query: {} }
    }

    const von = form.von.trim() === '' ? '' : parseGermanDay(form.von)
    const bis = form.bis.trim() === '' ? '' : parseGermanDay(form.bis)

    if (von === null || bis === null) {
        return { error: 'Bitte schreib das Datum als TT.MM.JJJJ, zum Beispiel 01.09.2026.' }
    }

    if (von && bis && bis < von) {
        return { error: 'Das Enddatum liegt vor dem Anfangsdatum.' }
    }

    return { query: { ...(von ? { von } : {}), ...(bis ? { bis } : {}) } }
}
