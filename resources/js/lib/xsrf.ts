/** Laravel's XSRF cookie, decoded, as the `X-XSRF-TOKEN` header a `fetch` to the shop is checked against. */
export function xsrfToken(): string {
    const match = /(?:^|;\s*)XSRF-TOKEN=([^;]+)/.exec(typeof document === 'undefined' ? '' : document.cookie)

    return match?.[1] ? decodeURIComponent(match[1]) : ''
}
