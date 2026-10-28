import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, test, type Page } from '../fixtures'
import { ABNAHME, CARS, PRODUCT, consent } from './support'

/*
 * Human QA Part C (HUMAN-QA-FULL.md §6): the journeys a customer takes, done the way a person does them — the wrong way
 * too — at 1440 and 390, with a picture of every step under storage/qa-evidence/part-c/ (not in the repository) and each
 * step's outcome in steps-<width>.json for the ledger. What a test of ours already proves is not repeated here; this is
 * the reading and the doing it wrong. Run: `--grep @journey`.
 */

const OUT = 'storage/qa-evidence/part-c'
mkdirSync(OUT, { recursive: true })

type Step = { journey: string; step: string; ok: boolean; saw: string; ms?: number; shot?: string }
const steps: Step[] = []

async function step(page: Page, journey: string, name: string, width: string, run: () => Promise<{ ok: boolean; saw: string }>): Promise<void> {
    const started = Date.now()
    let outcome: { ok: boolean; saw: string }

    try {
        outcome = await run()
    } catch (error) {
        outcome = { ok: false, saw: (error as Error).message.split('\n')[0] ?? 'error' }
    }

    const shot = `${OUT}/${journey}-${name}-${width}.png`.replace(/[^\w./-]+/g, '_')
    await page.screenshot({ path: shot }).catch(() => undefined)
    steps.push({ journey, step: name, ...outcome, ms: Date.now() - started, shot })
}

const width = (info: { project: { name: string } }): string => (info.project.name.includes('390') ? '390' : '1440')

test.afterAll(async ({ browserName }, info) => {
    writeFileSync(`${OUT}/steps-${browserName}-${width(info)}-${info.workerIndex}.json`, JSON.stringify(steps, null, 1))
})

test.beforeEach(async ({ context }) => {
    await consent(context, ABNAHME)
})

test('HSN/TSN as people type them: lower case, spaces, a leading zero dropped, eight characters, a number that does not exist @journey', async ({ page }, info) => {
    const w = width(info)
    const tries = [
        { name: 'valid', hsn: '0005', tsn: 'Z90' },
        { name: 'lower-case', hsn: '0005', tsn: 'z90' },
        { name: 'spaces', hsn: ' 0005 ', tsn: ' Z9 0' },
        { name: 'zero-dropped', hsn: '5', tsn: 'Z90' },
        { name: 'eight-characters', hsn: '0005', tsn: 'Z9012345' },
        { name: 'unknown', hsn: '9999', tsn: 'ZZZ' },
    ]

    for (const t of tries) {
        await page.goto(`${ABNAHME}/`, { waitUntil: 'networkidle' })
        // The desktop hero or the phone's panel; by role, so the fields of a tab out of view are not found.
        const hero = w === '390' ? page.locator('.vpanel').first() : page.getByRole('region', { name: 'Felgen, die an dein Auto dürfen.' })
        await hero.getByRole('tab', { name: 'HSN/TSN' }).click()
        await hero.getByRole('textbox', { name: 'HSN (Feld 2.1)' }).fill(t.hsn)
        await hero.getByRole('textbox', { name: 'TSN (Feld 2.2)' }).fill(t.tsn)
        await hero.getByRole('textbox', { name: 'TSN (Feld 2.2)' }).press('Tab')
        await page.waitForTimeout(800)

        await step(page, 'hsn-tsn', t.name, w, async () => {
            const text = (await hero.textContent()) ?? ''
            const found = /Felge|Felgen mit Gutachten|BMW/.test(text)
            const said = /HSN|TSN|nicht gefunden|vier Ziffern|drei Zeichen/.test(text)

            // A typing slip is either understood or explained beside the field — never a silent nothing.
            return { ok: found || said, saw: text.replace(/\s+/g, ' ').slice(0, 300) }
        })
    }
})

test('the basket as a person uses it: 1, 2 and 4 rims, the amount changed, a line removed, the same rim twice, a second tab @journey', async ({ page, context }, info) => {
    const w = width(info)

    await page.goto(`${ABNAHME}${PRODUCT}?fahrzeug=${CARS.e90.key}`, { waitUntil: 'networkidle' })
    // As a person does it: press, read the window, close it, and only then go on.
    const add = async (): Promise<void> => {
        await Promise.all([page.waitForResponse((r) => new URL(r.url()).pathname === '/warenkorb' && r.request().method() === 'POST'), page.locator('button.pdp__add').click()])
        await expect(page.locator('.addp')).toBeVisible()
        await page.locator('.addp').getByRole('button', { name: 'Weiter einkaufen' }).click()
        await expect(page.locator('.addp')).toHaveCount(0)
    }
    // „n × unit = total“ as the basket line prints it, checked against itself: whatever the price, the sum is right.
    const lineAdds = async (): Promise<{ ok: boolean; saw: string }> => {
        const text = ((await page.locator('main').textContent()) ?? '').replace(/\s+/g, ' ')
        const m = /(\d+) × ([\d.]+,\d{2})/.exec(text)
        const euros = (s: string): number => Number(s.replace(/\./g, '').replace(',', '.'))
        const total = m ? (Number(m[1]) * euros(m[2]!)).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.') : 'none'

        return { ok: m !== null && text.includes(`${total}`), saw: `${m?.[0] ?? 'no line'} → ${total} · ${text.slice(0, 160)}` }
    }

    for (const n of [1, 2]) {
        const shown = Number(await page.locator('.pdp__amount output').textContent())
        const button = page.getByRole('button', { name: n > shown ? 'Anzahl erhöhen' : 'Anzahl verringern' })

        for (let i = 0; i < Math.abs(n - shown); i++) {
            await button.click()
        }
    }

    await add()
    await page.goto(`${ABNAHME}/warenkorb`, { waitUntil: 'networkidle' })
    await step(page, 'basket', 'two-rims', w, lineAdds)

    // The same rim again from the product page: one line with four, never two lines of two.
    await page.goto(`${ABNAHME}${PRODUCT}?fahrzeug=${CARS.e90.key}`, { waitUntil: 'networkidle' })
    for (let i = 0; i < 2; i++) {
        await page.getByRole('button', { name: 'Anzahl verringern' }).click()
    }
    await add()
    await page.goto(`${ABNAHME}/warenkorb`, { waitUntil: 'networkidle' })
    // One line holding both adds, never two lines of the same rim.
    await step(page, 'basket', 'same-rim-twice', w, async () => {
        const lines = await page.locator('main').getByRole('button', { name: 'Entfernen' }).count()
        const sum = await lineAdds()

        return { ok: lines === 1 && sum.ok, saw: ` line(s) · ${sum.saw}` }
    })

    // A second tab sees the same basket.
    const other = await context.newPage()
    await other.goto(`${ABNAHME}/warenkorb`, { waitUntil: 'networkidle' })
    await step(other, 'basket', 'second-tab', w, async () => {
        const mine = (await page.locator('main').textContent())?.replace(/\s+/g, ' ')
        const theirs = (await other.locator('main').textContent())?.replace(/\s+/g, ' ')

        return { ok: mine === theirs, saw: (theirs ?? '').slice(0, 200) }
    })
    await other.close()

    // Remove the line: the basket says it is empty and offers a way on.
    await page.locator('main').getByRole('button', { name: 'Entfernen' }).first().click()
    await step(page, 'basket', 'removed', w, async () => {
        // As long as a person would look: the line goes, then the basket says so.
        await expect(page.locator('main')).toContainText(/leer/i, { timeout: 10_000 })
        const text = (await page.locator('main').textContent()) ?? ''

        return { ok: /leer/i.test(text) && (await page.locator('main a[href]').count()) > 0, saw: text.replace(/\s+/g, ' ').slice(0, 200) }
    })
})

test('every link from the home page, with a car and without: broken ones, redirect chains, English among the German @journey', async ({ page, request }, info) => {
    test.setTimeout(600_000)
    test.skip(width(info) !== '1440', 'the crawl runs once')

    const report: { start: string; broken: string[]; chains: string[]; english: string[]; pages: number } = { start: '', broken: [], chains: [], english: [], pages: 0 }
    const ENGLISH = /\b(Error|Not found|Loading|Submit|Cancel|Close|Back|Next|Previous|Search|Page not found|Something went wrong|undefined|null|NaN)\b/

    for (const start of ['/', `/felgen?fahrzeug=${CARS.e90.key}`]) {
        const seen = new Set<string>()
        const queue = [start]

        while (queue.length > 0 && seen.size < 120) {
            const path = queue.shift() as string

            if (seen.has(path)) {
                continue
            }

            seen.add(path)
            const head = await request.get(`${ABNAHME}${path}`, { maxRedirects: 0 })

            if (head.status() >= 300 && head.status() < 400) {
                const to = head.headers().location ?? ''
                const next = await request.get(new URL(to, ABNAHME).toString(), { maxRedirects: 0 })

                if (next.status() >= 300 && next.status() < 400) {
                    report.chains.push(`${path} → ${to} → ${next.headers().location}`)
                }

                continue
            }

            if (head.status() >= 400) {
                report.broken.push(`${head.status()} ${path}`)
                continue
            }

            if (!(head.headers()['content-type'] ?? '').includes('text/html')) {
                continue
            }

            await page.goto(`${ABNAHME}${path}`, { waitUntil: 'domcontentloaded' })
            const text = (await page.locator('body').innerText().catch(() => '')) ?? ''
            const english = ENGLISH.exec(text)

            if (english) {
                report.english.push(`${path}: „${english[0]}“`)
            }

            const links = await page.locator('a[href^="/"]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute('href') ?? ''))

            for (const href of links) {
                const clean = href.split('#')[0] ?? ''

                if (clean !== '' && !clean.startsWith('/admin') && !clean.startsWith('/storage') && !seen.has(clean)) {
                    queue.push(clean)
                }
            }
        }

        report.pages += seen.size
        report.start += `${start} (${seen.size}) `
    }

    writeFileSync(`${OUT}/crawl.json`, JSON.stringify(report, null, 1))
    expect(report.broken, 'broken links').toEqual([])
})
