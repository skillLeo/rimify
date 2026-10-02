/**
 * Where „Schreib uns“ leads: the contact form (the client's #26, D-124), never the visitor's mail program — a `mailto:`
 * link does nothing on a computer without one. The form opens with what the page knows: a subject, and the path the
 * visitor was on, so its thanks can lead back there (`/kontakt?betreff=…&von=…`). KontaktController takes the subject
 * as plain text and the path only when it is one of the shop's own.
 */

export interface ContactFields {
    subject?: string | null
    from?: string | null
}

export function contactHref(fields: ContactFields = {}): string {
    const params = new URLSearchParams()

    if (fields.subject) {
        params.set('betreff', fields.subject.slice(0, 150))
    }

    // The form itself is no way back: a link from the Kontakt page (its footer) carries no path.
    if (fields.from && fields.from.startsWith('/') && !fields.from.startsWith('//') && !/^\/kontakt(?:[/?#]|$)/.test(fields.from)) {
        params.set('von', fields.from)
    }

    const query = params.toString()

    return query === '' ? '/kontakt' : `/kontakt?${query}`
}
