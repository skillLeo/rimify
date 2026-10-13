/*
 * The acceptance run's target (the operator's briefs of 13.10.2026). It is named, never guessed: RIMIFY_URL. Which
 * instance that is travels with every result, because a pass on our own seeded instance is not a pass on the preview
 * the client looks at, and no table may blur the two (scripts/kundenliste/sheet.mjs).
 *
 * Credentials come from the environment and are never printed: RIMIFY_EMAIL / RIMIFY_PASSWORD for the Super-Admin, and
 * one pair per further role. A role without a pair is not signed in, and its tests say so instead of failing.
 */

const raw = process.env.RIMIFY_URL

if (!raw) {
    throw new Error('RIMIFY_URL is not set: the acceptance run never guesses where it runs.')
}

export const BASE = raw.replace(/\/+$/, '')
export const HOST = new URL(BASE).host

/** The one address that is the client's preview. Everything else is an instance of ours. */
export const PREVIEW = HOST === 'rimify.skillleo.com'
export const INSTANCE = PREVIEW ? 'vorschau' : 'eigene-instanz'

/** What may be written where: on his preview, nothing that stays — no order, invoice, refund or Protokoll entry. */
export const MAY_WRITE = !PREVIEW

export const ROLES = {
    'super-admin': { email: 'RIMIFY_EMAIL', password: 'RIMIFY_PASSWORD' },
    shop: { email: 'RIMIFY_EMAIL_SHOP', password: 'RIMIFY_PASSWORD_SHOP' },
    gutachten: { email: 'RIMIFY_EMAIL_GUTACHTEN', password: 'RIMIFY_PASSWORD_GUTACHTEN' },
} as const

export type Role = keyof typeof ROLES

/** A storage state is a live session: tests/abnahme/.auth/ is ignored by git. */
export const statePath = (role: Role): string => `tests/abnahme/.auth/${role}.json`

export const hasCredentials = (role: Role): boolean => Boolean(process.env[ROLES[role].email] && process.env[ROLES[role].password])

/** A visitor: no state at all. */
export const VISITOR = { cookies: [], origins: [] }
