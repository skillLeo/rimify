/**
 * A `mailto:` link with no recipient — the address is the sender's to fill in — carrying a subject and
 * a text. RFC 6068: every line of the body ends in CRLF, and both are percent-encoded, so umlauts, „“
 * and line breaks arrive in the mail program as they were written.
 */
export function mailtoHref(subject: string, body: string): string {
    const text = body.replace(/\r?\n/g, '\r\n')

    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`
}
