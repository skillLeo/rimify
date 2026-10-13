#!/usr/bin/env node
// What an acceptance run (`abnahme`) proved, per item of the client's list and per instance — read from its JSON report
// and kept in docs/review/kundenliste/: `ergebnis-vorschau.json` for a run against the preview (the only one that can
// tick his sheet, sheet.mjs), `ergebnis-eigene-instanz-abnahme.json` for a run against an instance of ours. The two are
// never merged. A run of one batch replaces only that batch's items; the others keep what an earlier run recorded.
//
//   RIMIFY_URL=… node scripts/kundenliste/abnahme-ergebnis.mjs [test-results/abnahme.json]
//
// An item has passed when every test tagged with it passed in every engine that ran — Chromium at 1440 × 900 and WebKit
// at 390 × 844 — and at least one ran. A skipped test is not a pass.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('../..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const url = (process.env.RIMIFY_URL ?? '').replace(/\/+$/, '')

if (url === '') {
    process.stderr.write('RIMIFY_URL is not set: a result without its instance is not recorded.\n')
    process.exit(1)
}

const preview = new URL(url).host === 'rimify.skillleo.com'
const instance = preview ? 'vorschau' : 'eigene-instanz'
const report = JSON.parse(readFileSync(join(ROOT, process.argv[2] ?? 'test-results/abnahme.json'), 'utf8'))
const dir = join(ROOT, 'docs', 'review', 'kundenliste')
const file = join(dir, preview ? 'ergebnis-vorschau.json' : 'ergebnis-eigene-instanz-abnahme.json')

/** @type {Map<number, {engine: string, title: string, status: string}[]>} */
const tests = new Map()

const walk = (suite) => {
    for (const spec of suite.specs ?? []) {
        const tags = [...new Set([...(spec.tags ?? []), ...(spec.title.match(/@kunde-\d{2}/g) ?? [])].map((t) => t.replace(/^@/, '')))]

        for (const test of spec.tests ?? []) {
            const status = test.status === 'skipped' ? 'skipped' : test.status === 'expected' ? 'passed' : test.status === 'flaky' ? 'flaky' : 'failed'

            for (const tag of tags) {
                const nr = Number(/^kunde-(\d{2})$/.exec(tag)?.[1])

                if (nr) {
                    tests.set(nr, [...(tests.get(nr) ?? []), { engine: test.projectName.includes('webkit') ? 'webkit 390×844' : 'chromium 1440×900', title: spec.title, status }])
                }
            }
        }
    }

    for (const child of suite.suites ?? []) {
        walk(child)
    }
}

for (const suite of report.suites ?? []) {
    walk(suite)
}

// Which build the instance runs: the preview prints it (public/build/release.json); ours is the working tree.
let commit = 'Arbeitsstand'

try {
    const stamp = await (await fetch(`${url}/build/release.json`, { headers: { 'User-Agent': 'Mozilla/5.0 (rimify abnahme)' } })).json()
    commit = stamp.commit ?? commit
} catch {
    // An instance of ours without a stamp.
}

const before = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { items: {} }
const items = { ...before.items }

for (const [nr, list] of tests) {
    const ran = list.filter((t) => t.status !== 'skipped')

    items[nr] = {
        // A flaky test passed on a retry: said, and not counted as a pass.
        passed: ran.length > 0 && ran.every((t) => t.status === 'passed'),
        engines: Object.fromEntries([...new Set(list.map((t) => t.engine))].map((e) => [e, list.filter((t) => t.engine === e).every((t) => t.status === 'passed') ? 'bestanden' : list.filter((t) => t.engine === e).map((t) => t.status).join(', ')])),
        tests: list.length,
        commit,
        at: report.stats?.startTime ?? new Date().toISOString(),
    }
}

mkdirSync(dir, { recursive: true })
writeFileSync(file, JSON.stringify({ instance, where: url, commit, at: report.stats?.startTime ?? new Date().toISOString(), items: Object.fromEntries(Object.entries(items).sort(([a], [b]) => Number(a) - Number(b))) }, null, 2) + '\n')

const numbers = [...tests.keys()].sort((a, b) => a - b)
process.stdout.write(`${instance} (${url}, Stand ${commit}): ${numbers.filter((n) => items[n].passed).length} von ${numbers.length} Punkten dieses Laufs bestanden — ${numbers.map((n) => `#${n} ${items[n].passed ? 'ok' : 'NICHT'}`).join(', ')}\n`)
