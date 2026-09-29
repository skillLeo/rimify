/** `2024-03-12` → `12.03.2024`; anything that is not an ISO date is shown as it is. */
export function toGermanDate(iso: string | null | undefined): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '')

    return match ? `${match[3]}.${match[2]}.${match[1]}` : (iso ?? '')
}

/** `12.3.2024` → `2024-03-12`; '' stays ''; null where the text is not a date that exists. */
export function fromGermanDate(text: string): string | null {
    const value = text.trim()

    if (value === '') {
        return ''
    }

    const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value)

    if (!match) {
        return null
    }

    const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])]
    const date = new Date(Date.UTC(year, month - 1, day))

    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
        return null
    }

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
