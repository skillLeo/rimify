/**
 * A choice about how the panel looks to this person (AdminPreferencesController), saved behind the
 * change with a plain background request: nothing on the page re-renders, so no late answer can put
 * back what was just changed. A failure costs the preference, never the page.
 */

/** Laravel's XSRF cookie, decoded, as the `X-XSRF-TOKEN` header the request is checked against. */
export function xsrfToken(): string {
    const match = /(?:^|;\s*)XSRF-TOKEN=([^;]+)/.exec(typeof document === 'undefined' ? '' : document.cookie)

    return match?.[1] ? decodeURIComponent(match[1]) : ''
}

export function savePreference(body: Record<string, unknown>): Promise<void> {
    return fetch('/admin/ansicht', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': xsrfToken(),
        },
        body: JSON.stringify(body),
    }).then(
        () => undefined,
        () => undefined
    )
}
