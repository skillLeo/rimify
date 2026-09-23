/**
 * A `mailto:` link with a subject and a prepared body (RFC 6068).
 *
 * E-mail is the shop's one confirmed channel (docs/phase0/ACCURACY.md D5), so every route that used
 * to lead to the old contact form now opens the customer's mail program with what we would ask
 * first already written in: the vehicle, the key numbers, the result link.
 *
 * The address always comes from the `contact` prop (config/rimify.php, D-023) and never from a
 * literal. Subject and body are percent-encoded; line breaks travel as CRLF, as the RFC asks.
 */

export interface MailtoFields {
    subject?: string
    body?: string
}

export function mailtoHref(email: string, fields: MailtoFields = {}): string {
    const query = (['subject', 'body'] as const)
        .map((key) => [key, fields[key]] as const)
        .filter((entry): entry is readonly [typeof entry[0], string] => typeof entry[1] === 'string' && entry[1] !== '')
        .map(([key, value]) => `${key}=${encodeURIComponent(value.replace(/\r?\n/g, '\r\n'))}`)
        .join('&')

    return `mailto:${email.trim()}${query === '' ? '' : `?${query}`}`
}
