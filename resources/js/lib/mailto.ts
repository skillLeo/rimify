/**
 * A `mailto:` link to an address somebody typed (finding 102's sibling, D-218). An e-mail address may contain `?` and
 * `&`; written into the link as it is, `x?bcc=jemand@example.org` would open a mail with a recipient nobody in the
 * shop chose. Encoded, the whole of it is the address.
 */
export function mailtoHref(address: string): string {
    return `mailto:${encodeURIComponent(address.trim()).replace(/%40/g, '@')}`
}
