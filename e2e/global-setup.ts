import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { EMPTY_SHOP_DB, SHOP_DB } from './shop'

/*
 * Every run of the suite starts from the same shop.
 *
 * The storefront specs buy in the review's sandbox — kasse.spec, PAY-01 — and a paid order keeps its wheels sold
 * (OrderPayments releases stock only for a cancelled or expired order). So each run used to leave the shop with less
 * on its shelves than the one before: a spec that passed in one run met a different shop in the next, and PAY-01
 * alone takes half a size's stock and one more. The shop's database is rebuilt from E2eShopSeeder before the run
 * instead (`composer e2e:shop`, ≈20 s; the seeder refuses any database not named `*_e2e`).
 *
 * The admin's demo set ends today (D-337, the operator's decision of 24.10.2026): before every run `demo:reanchor`
 * writes it again on today's date wherever it ends on another, so the admin specs meet their figures as on the day the
 * set was made — UEB-02 broke when the set had grown a month old. The day it ends on is handed to the specs
 * (E2E_DEMO_ANCHOR), and a spec that reads figures by the day asks the server to answer on it (e2e/bugs/ueb-support.ts
 * onDemoDay) — never on the calendar.
 *
 * The development shop the specs call DEV holds the released Borbet papers (D-427): SWEEP-01 to SWEEP-03 and EF-01 to
 * EF-03 read the cars, rows and Auflagen of ABE 55255 and of the Nachtrag to ABE 53841 there. borbetPapers() types them in
 * once per database and finds them in place on every later run.
 *
 * `E2E_KEEP_SHOP=1` skips the shop's rebuild, for a quick run of one spec that buys nothing; `E2E_KEEP_DEMO=1` the
 * reanchor, and the day the set has is handed over as it is.
 */
export default function globalSetup(): void {
    process.env.E2E_DEMO_ANCHOR = demoDay()
    borbetPapers()

    if (process.env.E2E_KEEP_SHOP === '1') {
        return
    }

    // The shop with wheels, and its twin with none published (EMPTY_SHOP).
    for (const [seeder, db] of [['E2eShopSeeder', SHOP_DB], ['E2eEmptyShopSeeder', EMPTY_SHOP_DB]] as const) {
        execFileSync(process.env.PHP_BINARY ?? 'php', ['artisan', 'migrate:fresh', '--seed', `--seeder=${seeder}`, '--force', '--no-interaction'], {
            cwd: new URL('..', import.meta.url),
            env: { ...process.env, ...db },
            stdio: 'pipe',
        })
    }
}

/**
 * The admin's demo set made to end today (unless E2E_KEEP_DEMO=1), and the day it ends on. Written again only where it
 * ends on another day: a reanchor takes about eleven minutes (675 s on 24.10.2026), so the first run of a day pays it
 * and the others start on the set that run left. A run that crosses midnight keeps its day — the specs ask for it.
 */
function demoDay(): string {
    const php = process.env.PHP_BINARY ?? 'php'
    const cwd = new URL('..', import.meta.url)
    const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date())

    // DEMO_DATA=1 for this one command: the suite's own admin database may hold the demo set — never production, which
    // DemoGuard refuses whatever the flag says.
    if (process.env.E2E_KEEP_DEMO !== '1' && anchor(php, cwd) !== today) {
        execFileSync(php, ['artisan', 'demo:reanchor', '--no-interaction'], { cwd, env: { ...process.env, DEMO_DATA: '1' }, stdio: 'pipe' })
    }

    return anchor(php, cwd)
}

/** The day the demo set in place ends on (`demo:anchor`) — empty where none is. */
function anchor(php: string, cwd: URL): string {
    try {
        return execFileSync(php, ['artisan', 'demo:anchor', '--no-interaction'], { cwd, env: process.env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
    } catch {
        return ''
    }
}

/**
 * The released Borbet papers in DEV's database: tests/E2eData types ABE 55255, ABE 53841 and the Nachtrag 366-0350-21-WIRD/N1
 * from their transcriptions (docs/gutachten) through the admin's endpoints and releases them, about a minute, once; a run
 * that finds them released leaves them. DEV's database is the one this checkout's server reads: the environment's DB_*
 * over .env's. Never where DEV names another machine's shop (E2E_BASE_URL): the suite writes nothing there. The run gets
 * no variable but its database's, so the pinned test environment meets nothing it did not pin (tests/env.php).
 */
function borbetPapers(): void {
    if (process.env.E2E_BASE_URL !== undefined) {
        return
    }

    const root = new URL('..', import.meta.url)
    const dotenv = new Map(
        readFileSync(new URL('.env', root), 'utf8')
            .split(/\r?\n/)
            .map((line) => /^(DB_[A-Z]+)=(.*)$/.exec(line))
            .filter((match): match is RegExpExecArray => match !== null)
            .map((match) => [match[1], (match[2] ?? '').replace(/^"(.*)"$/, '$1')] as const),
    )
    const value = (key: string): string => process.env[key] ?? dotenv.get(key) ?? ''
    const own = (key: string): Record<string, string> => (process.env[key] === undefined ? {} : { [key]: process.env[key] })

    execFileSync(process.env.PHP_BINARY ?? 'php', ['-d', 'memory_limit=2G', 'vendor/bin/pest', 'tests/E2eData'], {
        cwd: root,
        env: {
            ...own('PATH'),
            ...own('HOME'),
            ...own('PHP_INI_SCAN_DIR'),
            TEST_DB_HOST: value('DB_HOST'),
            TEST_DB_PORT: value('DB_PORT'),
            TEST_DB_DATABASE: value('DB_DATABASE'),
            TEST_DB_USERNAME: value('DB_USERNAME'),
            TEST_DB_PASSWORD: value('DB_PASSWORD'),
        },
        stdio: 'pipe',
    })
}
