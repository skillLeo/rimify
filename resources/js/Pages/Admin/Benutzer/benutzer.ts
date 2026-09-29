/**
 * The sentences Team › Benutzer builds from its data, kept out of the component so each one is
 * tested on its own: the context line under the title, and what each account action does.
 *
 * Counts go through format.ts (R-10). Names are the server's; nothing here invents a figure.
 */

import { decimal } from '../../../format'
import type { BenutzerAccount, BenutzerInvitation } from '../../../types/admin/benutzer'

function count(n: number, one: string, many: string): string {
    return `${decimal(n, 0)} ${n === 1 ? one : many}`
}

/** `7 Konten · 1 Einladung offen · 1 gesperrt` — only the parts that are not zero, accounts always. */
export function contextLine(accounts: BenutzerAccount[], invitations: BenutzerInvitation[]): string {
    const open = invitations.filter((i) => !i.expired).length
    const expired = invitations.length - open
    const suspended = accounts.filter((a) => a.status === 'suspended').length

    const parts = [count(accounts.length, 'Konto', 'Konten')]

    if (open > 0) {
        parts.push(`${count(open, 'Einladung', 'Einladungen')} offen`)
    }

    if (expired > 0) {
        parts.push(`${count(expired, 'Einladung', 'Einladungen')} abgelaufen`)
    }

    if (suspended > 0) {
        parts.push(`${decimal(suspended, 0)} gesperrt`)
    }

    return parts.join(' · ')
}

export type AccountAction = 'suspend' | 'reactivate' | 'signout'

/** The confirmation's title, naming the person. */
export function actionTitle(action: AccountAction, account: BenutzerAccount): string {
    switch (action) {
        case 'suspend':
            return `${account.name} sperren?`
        case 'reactivate':
            return `${account.name} entsperren?`
        case 'signout':
            return `${account.name} überall abmelden?`
    }
}

/** What happens, in one or two sentences — the consequence, not a restatement of the button. */
export function actionBody(action: AccountAction, account: BenutzerAccount): string {
    switch (action) {
        case 'suspend':
            return `${account.name} wird auf allen Geräten abgemeldet und kann sich nicht mehr anmelden, bis jemand das Konto entsperrt. Das Konto und seine Einträge im Protokoll bleiben erhalten.`
        case 'reactivate':
            return account.role === null
                ? `${account.name} kann sich danach wieder mit dem bisherigen Passwort anmelden. Das Konto hat keine Rolle.`
                : `${account.name} kann sich danach wieder mit dem bisherigen Passwort anmelden, in der Rolle ${account.role}.`
        case 'signout':
            return `${account.name} wird auf allen Geräten abgemeldet und muss sich neu anmelden. Das Konto bleibt aktiv.`
    }
}

/** The confirming button's label. */
export function actionLabel(action: AccountAction): string {
    return { suspend: 'Sperren', reactivate: 'Entsperren', signout: 'Überall abmelden' }[action]
}

/** Where each action posts. */
export function actionUrl(action: AccountAction, account: BenutzerAccount): string {
    const path = { suspend: 'sperren', reactivate: 'entsperren', signout: 'abmelden' }[action]

    return `/admin/benutzer/${account.id}/${path}`
}
