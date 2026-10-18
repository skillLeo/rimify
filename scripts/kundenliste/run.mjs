#!/usr/bin/env node
// `npm run kundenliste` (the operator's brief „THE 34“ §0): runs only the tests tagged with an item of the client's list
// — `@kunde-01` … `@kunde-34`, in the test's title, so one convention filters all three: Pest (`--filter`), Vitest
// (`-t`) and Playwright (`--grep`, 1440 × 900 and 390 × 844) — and writes docs/review/KUNDENLISTE.md from what they
// report: per item his wish, what the shop does now, the state, the tests and their result, the two pictures and the
// commits. An item without a tagged test, with a failing one or without both pictures from this run is `offen`: the table
// says so rather than rounding up.
//
//   npm run kundenliste                 everything (rebuilds the acceptance shop first, ≈ 2 min)
//   npm run kundenliste -- --skip=pest  leave a framework out (pest, vitest, playwright); its items count as not run
//   npm run kundenliste -- --report     write the table again from the last run's results and pictures, running nothing
//                                       (after items.mjs changed — its sentences, its commits); dated by that run
//   npm run kundenliste -- --only=pest  run one framework again, take the others' results and pictures from the last run
//
// His second list, the admin's (`npm run adminliste`, `--liste=admin`): the same run over the tests tagged `@admin-201` …
// `@admin-218` (admin-items.mjs), written to docs/review/ADMINLISTE.md and its CSV, its pictures under
// docs/qa/shots/adminliste/.
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import * as admin from './admin-items.mjs'
import * as kunde from './items.mjs'
import { DONE, INSTANCES, NOTES, sheetRow, toCsv } from './sheet.mjs'

/** The two lists the client gave us: his storefront list (1–34) and his admin list (201–218). */
const LISTS = {
    kunde: {
        ...kunde, NOTES, tag: 'kunde', digits: 2, pest: 'kunde-', slug: 'kundenliste', file: 'KUNDENLISTE',
        title: '# Deine Änderungsliste – Stand der Umsetzung',
    },
    admin: {
        ...admin, tag: 'admin', digits: 3, pest: 'admin-2\\d\\d', slug: 'adminliste', file: 'ADMINLISTE',
        title: '# Deine Admin-Änderungsliste – Stand der Umsetzung',
    },
}

const listName = (process.argv.find((a) => a.startsWith('--liste=')) ?? '--liste=kunde').slice(8)
const LIST = LISTS[listName]

if (LIST === undefined) {
    process.stderr.write(`no list „${listName}“: kunde or admin\n`)
    process.exit(1)
}

const { ITEMS, STATES } = LIST
const ROOT = new URL('../..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const OUT = join(ROOT, 'test-results', `${LIST.slug}-run`)
const SHOTS = `docs/qa/shots/${LIST.slug}`
const TAG = new RegExp(`@${LIST.tag}-(\\d{${LIST.digits}})\\b`, 'g')
const report = process.argv.includes('--report')
const only = new Set((process.argv.find((a) => a.startsWith('--only=')) ?? '--only=').slice(7).split(',').filter(Boolean))
const skip = new Set(report || only.size > 0 ? [] : (process.argv.find((a) => a.startsWith('--skip=')) ?? '--skip=').slice(7).split(',').filter(Boolean))

/** Runs a framework now — or not: only the last results are reported, it is skipped, or another one alone runs again. */
const live = (framework) => !report && !skip.has(framework) && (only.size === 0 || only.has(framework))

/** When the pictures were taken: now — or, where Playwright does not run again, when its last run began. */
const started = (() => {
    if (live('playwright')) {
        return Date.now()
    }

    const json = join(OUT, 'playwright.json')
    const at = existsSync(json) ? Date.parse(JSON.parse(readFileSync(json, 'utf8')).stats?.startTime ?? '') : NaN

    if (Number.isNaN(at)) {
        process.stderr.write('no Playwright result of an earlier run to take the pictures from\n')
        process.exit(1)
    }

    return at
})()

mkdirSync(OUT, { recursive: true })

/** @type {Map<number, {framework: string, name: string, project: string|null, status: 'passed'|'failed'|'skipped'}[]>} */
const results = new Map(ITEMS.map((item) => [item.nr, []]))
const ran = new Set()

function record(framework, name, project, status) {
    for (const match of name.matchAll(TAG)) {
        results.get(Number(match[1]))?.push({ framework, name: name.replace(TAG, '').replace(/\s+/g, ' ').trim(), project, status })
    }
}

function run(label, command, args, env = {}) {
    process.stdout.write(`\n== ${label}\n`)
    const result = spawnSync(command, args, { cwd: ROOT, env: { ...process.env, ...env }, stdio: 'inherit', shell: process.platform === 'win32' })

    return result.status ?? 1
}

// Pest: one run of the tagged tests, its JUnit report read back.
if (!skip.has('pest')) {
    const junit = join(OUT, 'pest.xml')

    // `kunde-`, never `@kunde-`: PHPUnit reads `@` in a filter as the start of a data set's name, so that matched nothing.
    if (live('pest')) {
        run('Pest', 'php', ['vendor/bin/pest', '--filter', LIST.pest, '--log-junit', junit])
    }

    if (existsSync(junit)) {
        ran.add('pest')
        const xml = readFileSync(junit, 'utf8')

        for (const m of xml.matchAll(/<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g)) {
            const name = /name="([^"]*)"/.exec(m[1])?.[1] ?? ''
            const body = m[3] ?? ''
            const status = /<(failure|error)\b/.test(body) ? 'failed' : /<skipped\b/.test(body) ? 'skipped' : 'passed'
            record('Pest', name.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'"), null, status)
        }
    }
}

// Vitest: the tagged component tests, its JSON report read back.
if (!skip.has('vitest')) {
    const json = join(OUT, 'vitest.json')

    if (live('vitest')) {
        run('Vitest', 'npx', ['vitest', 'run', '-t', `@${LIST.tag}-`, '--reporter=json', `--outputFile=${json}`, '--passWithNoTests'])
    }

    if (existsSync(json)) {
        ran.add('vitest')
        const report = JSON.parse(readFileSync(json, 'utf8'))

        for (const file of report.testResults ?? []) {
            for (const test of file.assertionResults ?? []) {
                const status = test.status === 'passed' ? 'passed' : test.status === 'failed' ? 'failed' : 'skipped'
                record('Vitest', test.fullName ?? test.title ?? '', null, status)
            }
        }
    }
}

// Playwright: both widths, its JSON report read back.
if (!skip.has('playwright')) {
    const json = join(OUT, 'playwright.json')

    if (live('playwright')) {
        run('Playwright', 'npx', ['playwright', 'test', '-c', 'playwright.kundenliste.config.ts', '--grep', `@${LIST.tag}-`], { KUNDENLISTE_JSON: json })
    }

    if (existsSync(json)) {
        ran.add('playwright')
        const report = JSON.parse(readFileSync(json, 'utf8'))
        const walk = (suite, titles) => {
            for (const spec of suite.specs ?? []) {
                const name = [...titles, spec.title, ...(spec.tags ?? []).map((t) => (t.startsWith('@') ? t : `@${t}`))].join(' ')

                for (const test of spec.tests ?? []) {
                    const last = (test.results ?? []).at(-1)
                    const status = test.status === 'skipped' || !last ? 'skipped' : test.status === 'expected' || test.status === 'flaky' ? 'passed' : 'failed'
                    record('Playwright', name, test.projectName ?? null, status)
                }
            }

            for (const child of suite.suites ?? []) {
                walk(child, [...titles, child.title].filter((t) => t && !t.endsWith('.spec.ts')))
            }
        }

        for (const suite of report.suites ?? []) {
            walk(suite, [])
        }
    }
}

// The pictures of this run: both widths, written after it began.
const picture = (nr, width) => {
    const path = `${SHOTS}/${String(nr).padStart(2, '0')}-${width}.png`
    const full = join(ROOT, path)

    return existsSync(full) && statSync(full).mtimeMs >= started - 1000 ? path : null
}

const OURS_FILE = join(ROOT, 'docs', 'review', LIST.slug, `ergebnis-${INSTANCES.ours}.json`)

const commit = (() => {
    // Writing the table again runs nothing: the results are the last run's, and so is the code they were proven on — not
    // whatever is checked out now.
    if (report && existsSync(OURS_FILE)) {
        return JSON.parse(readFileSync(OURS_FILE, 'utf8')).commit ?? 'unbekannt'
    }

    try {
        const sha = execFileSync('git', ['rev-parse', '--short=8', 'HEAD'], { cwd: ROOT }).toString().trim()
        // Only what the tests ran against: the shop's code and the tests — not the docs, not this table's own sentences.
        const tested = ['app', 'bootstrap', 'config', 'database', 'resources', 'routes', 'tests', 'e2e']
        const dirty = execFileSync('git', ['status', '--porcelain', '--untracked-files=no', '--', ...tested], { cwd: ROOT }).toString().trim() !== ''

        return dirty ? `${sha} mit lokalen Änderungen` : sha
    } catch {
        return 'unbekannt'
    }
})()

const rows = ITEMS.map((item) => {
    const tests = results.get(item.nr) ?? []
    const failed = tests.filter((t) => t.status === 'failed')
    const passed = tests.filter((t) => t.status === 'passed')
    const shots = { '1440': picture(item.nr, '1440'), '390': picture(item.nr, '390') }
    const missing = []

    if (tests.length === 0) missing.push('kein Test')
    if (failed.length > 0) missing.push(`${failed.length} von ${tests.length} ${tests.length === 1 ? 'Test' : 'Tests'} nicht bestanden`)
    if (tests.length > 0 && passed.length === 0 && failed.length === 0) missing.push('Tests nicht gelaufen')
    // An item whose answer is that nothing changes (`pictures: false`) has nothing to show; its test is the proof.
    if (item.pictures !== false && (!shots['1440'] || !shots['390'])) missing.push(`Bild fehlt (${['1440', '390'].filter((w) => !shots[w]).join(', ')})`)

    // A Rückfrage claims nothing done — it waits for his answer —, so it keeps its state without a test of its own.
    const state = missing.length > 0 && !(item.state === 'Rückfrage' && tests.length === 0) ? 'offen' : item.state
    const result = tests.length === 0 ? 'kein Test' : failed.length > 0 ? 'nicht bestanden' : passed.length === 0 ? 'nicht gelaufen' : `bestanden (${passed.length})`

    return { item, tests, failed, shots, missing, state, result }
})

// Every result with the instance it came from (the operator's addendum of 13.10.2026). This run is always against our
// own instance — the local acceptance shop; the preview's results are written by the acceptance run (`abnahme`), which
// is the suite that may be pointed at the site the client looks at. The two are never merged: the table shows both, and
// only the preview's can tick his sheet (sheet.mjs).
const RESULTS = join(ROOT, 'docs', 'review', LIST.slug)
const resultFile = (instance) => join(RESULTS, `ergebnis-${instance}.json`)
const readResult = (instance) => (existsSync(resultFile(instance)) ? JSON.parse(readFileSync(resultFile(instance), 'utf8')) : null)

mkdirSync(RESULTS, { recursive: true })
writeFileSync(
    resultFile(INSTANCES.ours),
    JSON.stringify(
        {
            instance: INSTANCES.ours,
            where: 'unser lokaler Abnahme-Shop (127.0.0.1)',
            commit,
            at: new Date(started).toISOString(),
            items: Object.fromEntries(rows.map((r) => [r.item.nr, { passed: r.missing.length === 0, tests: r.tests.length, failed: r.failed.length }])),
        },
        null,
        2,
    ) + '\n',
)

const preview = readResult(INSTANCES.preview)
const day = (iso) => new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Berlin' }).format(new Date(iso))
// Each item with the day and the release it was proven on there: a run of one item records only that item (#23 on a
// later release than the rest), so one date and one release for the whole column would be true of most rows, not all.
const onPreview = (nr) => {
    const result = preview?.items?.[nr]

    if (result === undefined) return 'noch nicht geprüft'

    const when = `${day(result.at ?? preview.at)}${result.commit ? `, ${result.commit}` : ''}`

    if (result.passed) return `bestanden (${when})`

    // Every test of the item skipped there (a role without credentials in the environment).
    return result.ran === 0 ? `nicht geprüft (${when})` : 'nicht bestanden'
}
const previewReleases = [...new Set(Object.values(preview?.items ?? {}).map((i) => i.commit).filter(Boolean))]

const sheet = rows.map((r) => sheetRow(r.item, { passed: r.missing.length === 0 }, preview?.items?.[r.item.nr] ?? null, LIST.NOTES))
writeFileSync(join(ROOT, 'docs', 'review', `${LIST.file}.csv`), toCsv(sheet))

const count = (state) => rows.filter((r) => r.state === state).length
const cell = (text) => String(text ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')
const frameworks = (tests) =>
    [...new Set(tests.map((t) => `${t.framework}: ${t.name}${t.project ? ` (${t.project.includes('390') ? '390' : '1440'})` : ''}`))]
        .map((t) => cell(t))
        .join('<br>')

const stamp = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' }).format(new Date(started))
const tally = Object.keys(STATES).map((state) => `${count(state)} ${state}`)
const lines = [
    LIST.title,
    '',
    `Erzeugt mit \`npm run ${LIST.slug}\` am ${stamp} Uhr, geprüft auf dem Stand ${commit}. Nichts darin ist von Hand als erledigt eingetragen: Ein Punkt ist **erledigt**, wenn sein Test besteht und die beiden Bilder zeigen, worum es geht.`,
    '',
    `**${tally.join(' · ')}**`,
    '',
    `Geprüft wurde hier auf **unserer eigenen Instanz** (ein lokaler Shop mit dem Abnahme-Satz), nicht auf deiner Vorschau. Was auf der Vorschau geprüft ist, steht in der Spalte „Auf der Vorschau“${preview ? ` (Stand ${previewReleases.join(' und ') || preview.commit}, je Punkt mit Tag und Stand)` : ''} – erst das zählt für deine Liste: ${sheet.filter((r) => r.value === DONE).length} von ${ITEMS.length}.`,
    '',
    'Die Status:',
    '',
    ...Object.entries(STATES).map(([state, meaning]) => `- **${state}** – ${meaning}`),
    '',
    `Die Bilder liegen unter \`${SHOTS}/\`: je Punkt eines am Computer (1440 Pixel breit) und eines am Handy (390 Pixel).`,
    '',
    '| Nr. | Dein Wunsch | Was es jetzt tut | Stand | Auf der Vorschau | Test | Ergebnis | Bilder | Commit |',
    '|---|---|---|---|---|---|---|---|---|',
    ...rows.map(({ item, tests, shots, missing, state, result }) =>
        [
            item.nr,
            cell(item.wish),
            cell(item.now + (item.reason ? ` ${item.reason}` : '') + (missing.length > 0 ? ` **Offen: ${missing.join('; ')}.**` : '')),
            `**${state}**`,
            onPreview(item.nr),
            frameworks(tests) || '–',
            result,
            item.pictures === false
                ? '–'
                : ['1440', '390'].map((w) => (shots[w] ? `[${w}](../qa/shots/${LIST.slug}/${shots[w].split('/').pop()})` : `${w}: –`)).join(' · '),
            cell((item.commits ?? []).join(', ') || '–'),
        ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'),
    ),
    '',
]

writeFileSync(join(ROOT, 'docs', 'review', `${LIST.file}.md`), lines.join('\n'))

const notRun = ['pest', 'vitest', 'playwright'].filter((f) => !ran.has(f))
const failedItems = rows.filter((r) => r.failed.length > 0).map((r) => r.item.nr)

process.stdout.write(
    `\n${LIST.file}.md (unsere Instanz): ${tally.join(', ')}` +
        `\n${LIST.file}.csv (zählt nur die Vorschau): ${sheet.filter((r) => r.value === DONE).length} × ${DONE}, ${sheet.filter((r) => r.value !== DONE).length} × Open` +
        (notRun.length ? ` · nicht gelaufen: ${notRun.join(', ')}` : '') +
        (failedItems.length ? ` · Tests rot bei Nr. ${failedItems.join(', ')}` : '') +
        '\n',
)

process.exit(failedItems.length > 0 || notRun.length > 0 ? 1 : 0)
