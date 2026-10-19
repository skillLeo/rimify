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
import { join, resolve } from 'node:path'

const ROOT = new URL('../..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const url = (process.env.RIMIFY_URL ?? '').replace(/\/+$/, '')

if (url === '') {
    process.stderr.write('RIMIFY_URL is not set: a result without its instance is not recorded.\n')
    process.exit(1)
}

const preview = new URL(url).host === 'rimify.skillleo.com'
const instance = preview ? 'vorschau' : 'eigene-instanz'
// A report named by its full path (the evidence folder outside the repository) or relative to the project.
const report = JSON.parse(readFileSync(resolve(ROOT, process.argv[2] ?? 'test-results/abnahme.json'), 'utf8'))

/*
 * Two lists share the run: his storefront list (@kunde-NN, docs/review/kundenliste/) and his admin list (@admin-NNN,
 * docs/review/adminliste/, the admin list's preview pass — tests/abnahme/admin.spec.ts). Each tag goes to its own list's
 * file; the two are never mixed.
 */
const LISTS = [
    { slug: 'kundenliste', tag: /^kunde-(\d{2})$/ },
    { slug: 'adminliste', tag: /^admin-(\d{3})$/ },
]

/** @type {Map<string, Map<number, {engine: string, title: string, status: string}[]>>} */
const tests = new Map(LISTS.map((l) => [l.slug, new Map()]))

const walk = (suite) => {
    for (const spec of suite.specs ?? []) {
        const tags = [...new Set([...(spec.tags ?? []), ...(spec.title.match(/@(?:kunde-\d{2}|admin-\d{3})/g) ?? [])].map((t) => t.replace(/^@/, '')))]

        for (const test of spec.tests ?? []) {
            const status = test.status === 'skipped' ? 'skipped' : test.status === 'expected' ? 'passed' : test.status === 'flaky' ? 'flaky' : 'failed'

            for (const tag of tags) {
                for (const list of LISTS) {
                    const nr = Number(list.tag.exec(tag)?.[1])

                    if (nr) {
                        const byNr = tests.get(list.slug)
                        byNr.set(nr, [...(byNr.get(nr) ?? []), { engine: test.projectName.includes('webkit') ? 'webkit 390×844' : 'chromium 1440×900', title: spec.title, status }])
                    }
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

for (const list of LISTS) {
    const byNr = tests.get(list.slug)

    if (byNr.size === 0) {
        continue
    }

    const dir = join(ROOT, 'docs', 'review', list.slug)
    const file = join(dir, preview ? 'ergebnis-vorschau.json' : 'ergebnis-eigene-instanz-abnahme.json')
    const before = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { items: {} }
    const items = { ...before.items }

    for (const [nr, results] of byNr) {
        const ran = results.filter((t) => t.status !== 'skipped')

        items[nr] = {
            // A flaky test passed on a retry: said, and not counted as a pass.
            passed: ran.length > 0 && ran.every((t) => t.status === 'passed'),
            // How many ran: an item whose every test was skipped was not checked here — not passed, and not failed either.
            ran: ran.length,
            engines: Object.fromEntries([...new Set(results.map((t) => t.engine))].map((e) => [e, results.filter((t) => t.engine === e).every((t) => t.status === 'passed') ? 'bestanden' : results.filter((t) => t.engine === e).map((t) => t.status).join(', ')])),
            tests: results.length,
            commit,
            at: report.stats?.startTime ?? new Date().toISOString(),
        }
    }

    mkdirSync(dir, { recursive: true })
    writeFileSync(file, JSON.stringify({ instance, where: url, commit, at: report.stats?.startTime ?? new Date().toISOString(), items: Object.fromEntries(Object.entries(items).sort(([a], [b]) => Number(a) - Number(b))) }, null, 2) + '\n')

    const numbers = [...byNr.keys()].sort((a, b) => a - b)
    process.stdout.write(`${list.slug} · ${instance} (${url}, Stand ${commit}): ${numbers.filter((n) => items[n].passed).length} von ${numbers.length} Punkten dieses Laufs bestanden — ${numbers.map((n) => `#${n} ${items[n].passed ? 'ok' : 'NICHT'}`).join(', ')}\n`)
}
