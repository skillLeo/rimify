#!/usr/bin/env node
// Masks every credential this machine holds before it can reach a terminal or a tool's output (D-184). Pipe any command
// that may print one through it:
//
//   <command> | node scripts/dev/redact.mjs
//
// What it knows and masks, longest first:
//   - the value of every key in .env and .env.* (not .env.example) whose name says secret: PASSWORD, PWD, SECRET, TOKEN,
//     PRIVATE, CREDENTIAL, a name ending in KEY, and APP_KEY;
//   - every cell of a „Passwort“ column in docs/review/ACCOUNTS.md (the review accounts' passwords);
//   - every line of .redact, a local file of further values (one per line, never committed);
//   - anything shaped like a credential, whatever it belongs to: Stripe keys (sk_/rk_/pk_ live and test, whsec_), an
//     AWS access key id (AKIA…), a private-key block, and the value after MYSQL_PWD=, password=, secret= or token=.
//
// A value shorter than six characters is not masked by itself (it would mask ordinary words); the shapes still apply.
// The command reads its input line by line, so a long output streams through without waiting for its end.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'

export const MASK = '[verborgen]'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const SECRET_NAME = /(PASSWORD|PASSWD|PWD|SECRET|TOKEN|PRIVATE|CREDENTIAL|_KEY$|^APP_KEY$)/i

const read = (path) => {
    try {
        return existsSync(path) ? readFileSync(path, 'utf8') : ''
    } catch {
        return ''
    }
}

/** The secret values in .env-style text. */
export function fromEnv(text) {
    const values = []

    for (const line of text.split(/\r?\n/)) {
        const m = /^\s*(?:export\s+)?([A-Za-z0-9_]+)\s*=\s*(.*)$/.exec(line)

        if (m && SECRET_NAME.test(m[1])) {
            const value = m[2].trim().replace(/^(['"])(.*)\1$/, '$2')

            if (value !== '' && value !== 'null') {
                values.push(value)
            }
        }
    }

    return values
}

/** The cells of every „Passwort“ column in a Markdown file's tables. */
export function fromAccounts(text) {
    const values = []
    let column = -1

    for (const line of text.split(/\r?\n/)) {
        if (!line.trim().startsWith('|')) {
            column = -1
            continue
        }

        const cells = line.split('|').slice(1, -1).map((c) => c.trim())
        const header = cells.findIndex((c) => /^(Passwort|Kennwort|Password)$/i.test(c))

        if (header !== -1) {
            column = header
            continue
        }

        if (column === -1 || /^:?-{3,}/.test(cells[0] ?? '')) {
            continue
        }

        const value = (cells[column] ?? '').replace(/^`|`$/g, '').trim()

        if (value !== '' && value !== '–' && value !== '-') {
            values.push(value)
        }
    }

    return values
}

/** Every secret value this checkout knows of, longest first. */
export function knownSecrets(root = ROOT) {
    const files = (() => {
        try {
            return readdirSync(root).filter((name) => /^\.env(\..+)?$/.test(name) && name !== '.env.example')
        } catch {
            return []
        }
    })()

    const values = [
        ...files.flatMap((name) => fromEnv(read(join(root, name)))),
        ...fromAccounts(read(join(root, 'docs', 'review', 'ACCOUNTS.md'))),
        ...read(join(root, '.redact')).split(/\r?\n/).map((v) => v.trim()).filter(Boolean),
    ]

    return [...new Set(values.filter((v) => v.length >= 6))].sort((a, b) => b.length - a.length)
}

const SHAPES = [
    [/\b((?:sk|rk|pk)_(?:live|test)_)[A-Za-z0-9]{6,}/g, `$1${MASK}`],
    [/\b(whsec_)[A-Za-z0-9]{6,}/g, `$1${MASK}`],
    [/\bAKIA[0-9A-Z]{16}\b/g, MASK],
    [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g, MASK],
    [/\b(MYSQL_PWD|PASSWORD|PASSWD|SECRET|TOKEN)(\s*[=:]\s*)("[^"]*"|'[^']*'|\S+)/gi, `$1$2${MASK}`],
]

const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** One line with every known value and every credential shape masked. */
export function redactLine(line, secrets) {
    let out = line

    for (const secret of secrets) {
        if (out.includes(secret)) {
            out = out.replace(new RegExp(escape(secret), 'g'), MASK)
        }
    }

    for (const [pattern, replacement] of SHAPES) {
        out = out.replace(pattern, replacement)
    }

    return out
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    const secrets = knownSecrets()
    const lines = createInterface({ input: process.stdin, crlfDelay: Infinity })

    for await (const line of lines) {
        process.stdout.write(redactLine(line, secrets) + '\n')
    }
}
