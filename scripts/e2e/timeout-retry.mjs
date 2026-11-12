// D-458 — a browser test that failed only by waiting runs once more, alone, after its suite; it counts as passed only if
// that run passes. Any other failure is real and runs no more; nothing runs twice; every test that ran again is listed.
//
//   node scripts/e2e/timeout-retry.mjs --config <playwright config> --report <its JSON report> --exit <the suite's exit>
//        [--out <list.md>] [--junit <pest.xml>] [--vitest <vitest.json>]
//
// `--junit` and `--vitest`: the client's lists run Pest and Vitest beside Playwright; a failure there is real, always.
// Exit 0: the suite passed, or each of its failures was a wait and passed alone. Exit 1 otherwise — a real failure (then
// nothing runs again), a test that failed alone too, or a report that is missing. The last line printed is the verdict.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'

const ANSI = /\u001b\[[0-9;]*m/g

/** The test's own time ran out — Playwright's words for it. */
const TEST_TIMEOUT = /^(?:Error: )?Test timeout of \d+ms exceeded\.?$/

/** An action or a navigation that hit its time limit: `locator.click: Timeout 10000ms exceeded.`, `page.waitForURL: Timeout …`. */
const ACTION_TIMEOUT = /^(?:\w*Error: )?(?:[a-z]\w*\.)+\w+: Timeout \d+ms exceeded/

/** The step a test was in when its time ran out: an action or a navigation, or a page closed under it. */
const INTERRUPTED_ACTION = /^(?:\w*Error: )?(?:[a-z]\w*\.)+\w+: |Target page, context or browser has been closed|frame was detached/

/** A web-first assertion — on a locator, the page or a response — with or without a message of the test's own before it. */
const PAGE_ASSERTION = /^(?:Error: )?(?:[^\n]+\n\n)?expect\((?:locator|page|response)\)\.\w+\([^)\n]*\) failed/

/** An assertion that finished its wait prints how long it waited; one interrupted by the test's time does not. */
const WAITED_OUT = /\nTimeout: \d+ms\b/

/** …and when it never found what it waited for, says so: it saw nothing, so there is nothing it saw wrong. */
const NEVER_FOUND = /\nTimeout: \d+ms\s*\n(?:Error: )?element\(s\) not found/

const plain = (text) => String(text ?? '').replace(ANSI, '').trim()
const firstLine = (text) => plain(text).split('\n').find((line) => line.trim() !== '')?.trim() ?? ''

/**
 * Why one test failed, read from its last result. A wait is: the test's own time running out (with at most the step it
 * interrupted), an action or a navigation hitting its limit, or an assertion that waited its full time for an element
 * that never appeared. An assertion that found the element but saw a different text, value, URL, count or state is a real
 * failure although it waited: what it saw is the finding. So is everything else — a page error, a server error, a closed
 * page without a timeout, a soft assertion beside a timeout.
 *
 * @param {{status?: string, errors?: {message?: string, value?: string}[]}} result
 * @returns {{kind: 'wait' | 'real', why: string}}
 */
export function classify(result) {
    const errors = (result?.errors ?? []).map((error) => plain(error?.message ?? error?.value ?? ''))

    if (result?.status === 'passed') {
        return { kind: 'real', why: 'passed only when Playwright ran it again by itself — its retries are off (D-458)' }
    }

    if (result?.status === 'timedOut') {
        const rest = errors.filter((message) => !TEST_TIMEOUT.test(message))
        const interrupted = (message) => INTERRUPTED_ACTION.test(message) || (PAGE_ASSERTION.test(message) && !WAITED_OUT.test(message))

        if (rest.length === 0 || (rest.length === 1 && interrupted(rest[0]))) {
            return { kind: 'wait', why: firstLine(errors.find((message) => TEST_TIMEOUT.test(message)) ?? 'Test timeout exceeded.') }
        }

        return { kind: 'real', why: `out of time after another failure: ${firstLine(rest.find((message) => !interrupted(message)) ?? rest[0])}` }
    }

    if (result?.status === 'failed' && errors.length === 1) {
        if (ACTION_TIMEOUT.test(errors[0])) {
            return { kind: 'wait', why: firstLine(errors[0]) }
        }

        if (PAGE_ASSERTION.test(errors[0]) && NEVER_FOUND.test(errors[0])) {
            return { kind: 'wait', why: `${firstLine(errors[0])} — element(s) not found` }
        }
    }

    return { kind: 'real', why: firstLine(errors[0]) || `status ${result?.status ?? 'unknown'}` }
}

/**
 * Every test that did not pass, with where it is declared.
 *
 * @returns {{file: string, line: number, title: string, titlePath: string[], project: string, result: object}[]}
 */
export function failures(report) {
    const found = []
    const walk = (suite, titles) => {
        for (const spec of suite.specs ?? []) {
            for (const test of spec.tests ?? []) {
                if (test.status === 'expected' || test.status === 'skipped') {
                    continue
                }

                found.push({ file: spec.file, line: spec.line, title: spec.title, titlePath: [...titles, spec.title], project: test.projectName ?? '', result: (test.results ?? []).at(-1) ?? {} })
            }
        }

        for (const child of suite.suites ?? []) {
            walk(child, child.title && !/\.(?:spec|test)\.[cm]?[jt]s$/.test(child.title) ? [...titles, child.title] : titles)
        }
    }

    for (const suite of report?.suites ?? []) {
        walk(suite, [])
    }

    return found
}

/** A title as a pattern that matches only itself; `/` is escaped too, so Playwright never reads it as `/…/flags`. */
export const exactly = (title) => title.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')

function option(name) {
    const at = process.argv.indexOf(`--${name}`)

    return at === -1 ? null : process.argv[at + 1] ?? null
}

/** Runs one test alone, as the suite would, and reads back whether it passed. */
function alone(config, rootDir, failure) {
    const dir = mkdtempSync(join(tmpdir(), 'rimify-alone-'))
    const json = join(dir, 'report.json')
    const file = relative(process.cwd(), join(rootDir, failure.file))
    const args = ['playwright', 'test', '-c', config, `--project=${failure.project}`, `--grep=${exactly(failure.title)}`, '--reporter=list,json', `${file}:${failure.line}`]
    const started = Date.now()

    process.stdout.write(`\n== alone: [${failure.project}] ${file}:${failure.line} › ${failure.title}\n`)
    spawnSync('npx', args, { stdio: 'inherit', env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: json }, shell: process.platform === 'win32' })

    const seconds = Math.round((Date.now() - started) / 1000)

    if (!existsSync(json)) {
        return { passed: false, how: `no report from the run alone (${seconds} s)` }
    }

    const again = JSON.parse(readFileSync(json, 'utf8'))
    const ran = []
    const walk = (suite) => {
        for (const spec of suite.specs ?? []) {
            for (const test of spec.tests ?? []) {
                if (spec.title === failure.title && (test.projectName ?? '') === failure.project && test.status !== 'skipped') {
                    ran.push(test)
                }
            }
        }

        for (const child of suite.suites ?? []) {
            walk(child)
        }
    }

    for (const suite of again.suites ?? []) {
        walk(suite)
    }

    if (ran.length !== 1) {
        return { passed: false, how: `the run alone found ${ran.length} such tests (${seconds} s)` }
    }

    const last = ran[0].results?.at(-1)

    return ran[0].status === 'expected'
        ? { passed: true, how: `passed in ${Math.round((last?.duration ?? 0) / 1000)} s` }
        : { passed: false, how: `failed again: ${firstLine(last?.errors?.[0]?.message) || last?.status}` }
}

function main() {
    const config = option('config')
    const reportPath = option('report')
    const out = option('out')
    const junit = option('junit')
    const vitest = option('vitest')
    const exit = Number(option('exit') ?? '1')
    const real = []

    if (config === null || reportPath === null) {
        process.stderr.write('usage: timeout-retry.mjs --config <file> --report <json> --exit <code> [--out <md>] [--junit <xml>] [--vitest <json>]\n')
        process.exit(2)
    }

    if (junit !== null) {
        const xml = existsSync(junit) ? readFileSync(junit, 'utf8') : null
        const count = xml === null ? null : (xml.match(/<(?:failure|error)\b/g) ?? []).length

        if (count === null || count > 0) {
            real.push(count === null ? `Pest: no report (${junit})` : `Pest: ${count} failed`)
        }
    }

    if (vitest !== null) {
        const report = existsSync(vitest) ? JSON.parse(readFileSync(vitest, 'utf8')) : null

        if (report === null || (report.numFailedTests ?? 0) > 0 || report.success === false) {
            real.push(report === null ? `Vitest: no report (${vitest})` : `Vitest: ${report.numFailedTests ?? '?'} failed`)
        }
    }

    if (!existsSync(reportPath)) {
        real.push(`Playwright: no report (${reportPath})`)
    }

    const report = existsSync(reportPath) ? JSON.parse(readFileSync(reportPath, 'utf8')) : { suites: [], errors: [] }
    const rootDir = report.config?.rootDir ?? process.cwd()
    const failed = failures(report)
    const judged = failed.map((failure) => ({ ...failure, ...classify(failure.result) }))

    for (const error of report.errors ?? []) {
        real.push(`Playwright, outside a test: ${firstLine(error.message)}`)
    }

    for (const failure of judged.filter((f) => f.kind === 'real')) {
        real.push(`[${failure.project}] ${failure.file}:${failure.line} › ${failure.title} — ${failure.why}`)
    }

    if (exit !== 0 && failed.length === 0 && real.length === 0) {
        real.push(`the suite ended with ${exit} and no test failed: read its log`)
    }

    const rows = []
    let verdict

    if (real.length > 0) {
        verdict = `D-458: ${real.length} real failure(s), nothing run again — ${real[0]}${real.length > 1 ? ` (+${real.length - 1})` : ''}`
    } else {
        const waits = judged.filter((f) => f.kind === 'wait')

        for (const failure of waits) {
            const outcome = alone(config, rootDir, failure)
            rows.push({ ...failure, ...outcome })
        }

        const passed = rows.filter((row) => row.passed).length
        verdict = waits.length === 0 ? 'D-458: nothing to run again' : `D-458: ${waits.length} failed only by waiting, run again alone: ${passed} passed, ${waits.length - passed} failed`
    }

    if (out !== null) {
        const lines = [`# Run again alone (D-458) — ${config}`, '', verdict, '']

        if (rows.length > 0) {
            lines.push('| Project | Test | First run | Alone |', '|---|---|---|---|')

            for (const row of rows) {
                lines.push(`| ${row.project} | ${row.file}:${row.line} › ${row.title.replace(/\|/g, '\\|')} | ${row.why.replace(/\|/g, '\\|')} | ${row.passed ? 'passed' : 'FAILED'}: ${row.how.replace(/\|/g, '\\|')} |`)
            }
        }

        for (const line of real) {
            lines.push(`- real: ${line}`)
        }

        writeFileSync(out, `${lines.join('\n')}\n`)
    }

    process.stdout.write(`\n${verdict}\n`)
    process.exit(real.length === 0 && rows.every((row) => row.passed) ? 0 : 1)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    main()
}
