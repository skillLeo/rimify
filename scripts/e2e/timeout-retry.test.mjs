import { describe, expect, it } from 'vitest'
import { classify, exactly, failures } from './timeout-retry.mjs'

/*
 * D-458: which failures run again alone. The six waits are the six tests that failed in gate af8d4d93 on 12.11.2026,
 * their messages as Playwright's JSON report holds them (colour codes and all) — under a load of 140–440 on ten cores,
 * no test twice. The real ones are what must never run again: a wrong value, a wrong state, a page or server error, an
 * aborted navigation without a timeout, a soft assertion beside a timeout, a pass only on Playwright's own retry.
 */

const timeout = (ms) => ({ message: `\u001b[31mTest timeout of ${ms}ms exceeded.\u001b[39m` })

const waits = {
    'the Gutachten walk: out of time on a navigation': {
        status: 'timedOut',
        errors: [timeout(180000), { message: 'Error: page.goto: net::ERR_ABORTED; maybe frame was detached?\nCall log:\n  - navigating to "http://127.0.0.1:8030/admin/auflagen", waiting until "networkidle"\n' }],
    },
    'kunde-28: the answer never appeared': {
        status: 'failed',
        errors: [{ message: "Error: \u001b[2mexpect(\u001b[22m\u001b[31mlocator\u001b[39m\u001b[2m).\u001b[22mtoBeVisible\u001b[2m()\u001b[22m failed\n\nLocator: locator('#antwort')\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n  - Expect \"toBeVisible\" locator('#antwort') with timeout 15000ms\n  - waiting for locator('#antwort')\n" }],
    },
    'kunde-20: out of time waiting for the set': {
        status: 'timedOut',
        errors: [timeout(120000), { message: 'Error: page.waitForURL: Test timeout of 120000ms exceeded.\n=========================== logs ===========================\nwaiting for navigation until "load"\n============================================================' }],
    },
    'compare: out of time in an assertion': {
        status: 'timedOut',
        errors: [timeout(60000), { message: "Error: expect(locator).toBeVisible() failed\n\nLocator:  getByRole('region', { name: 'Vergleich' })\nExpected: visible\nReceived: undefined\n" }],
    },
    'PDP-01: the panel never appeared, with a message of its own': {
        status: 'failed',
        errors: [{ message: "Error: the add brought no panel\n\nexpect(locator).toBeVisible() failed\n\nLocator: locator('.addp')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n  - the add brought no panel locator('.addp') with timeout 10000ms\n  - waiting for locator('.addp')\n" }],
    },
    'kunde-04: out of time while the text was still empty': {
        status: 'timedOut',
        errors: [timeout(120000), { message: "Error: expect(locator).toContainText(expected) failed\n\nLocator: locator('#h2 .hero__stage').first().locator('.hero__spec')\nExpected substring: \"ET\"\nReceived string:    \"\"\n" }],
    },
    'a click that hit its own limit': {
        status: 'failed',
        errors: [{ message: 'TimeoutError: locator.click: Timeout 10000ms exceeded.\nCall log:\n  - waiting for getByRole(\'button\', { name: \'In den Warenkorb\' })\n' }],
    },
}

const real = {
    'a wrong text, seen for the whole wait': {
        status: 'failed',
        errors: [{ message: "Error: expect(locator).toHaveText(expected) failed\n\nLocator: locator('.verdict')\nExpected string: \"Erlaubt\"\nReceived string: \"Nicht erlaubt\"\nTimeout: 10000ms\n\nCall log:\n  - waiting for locator('.verdict')\n" }],
    },
    'an element there but hidden for the whole wait': {
        status: 'failed',
        errors: [{ message: "Error: expect(locator).toBeVisible() failed\n\nLocator: locator('.addp')\nExpected: visible\nReceived: hidden\nTimeout: 10000ms\n" }],
    },
    'a page error caught by the test': {
        status: 'failed',
        errors: [{ message: 'Error: expect(received).toEqual(expected) // deep equality\n\nExpected: []\nReceived: ["TypeError: line is undefined"]' }],
    },
    'a server error': {
        status: 'failed',
        errors: [{ message: 'Error: expect(received).toBe(expected) // Object.is equality\n\nExpected: 200\nReceived: 500' }],
    },
    'an aborted navigation without a timeout': {
        status: 'failed',
        errors: [{ message: 'Error: page.goto: net::ERR_ABORTED at http://127.0.0.1:8030/admin/gutachten/12/pdf' }],
    },
    'a soft assertion beside a timeout': {
        status: 'timedOut',
        errors: [timeout(90000), { message: 'Error: expect(received).toBeGreaterThanOrEqual(expected)\n\nExpected: >= 16\nReceived:    14' }, { message: 'Error: locator.click: Test timeout of 90000ms exceeded.' }],
    },
    'a soft page assertion that finished its wait, beside a timeout': {
        status: 'timedOut',
        errors: [timeout(60000), { message: "Error: no way to rename or delete it\n\nexpect(locator).toBeVisible() failed\n\nLocator: getByRole('button')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found" }],
    },
    'two failures, one of them a wait': {
        status: 'failed',
        errors: [{ message: 'TimeoutError: locator.click: Timeout 10000ms exceeded.' }, { message: 'Error: expect(received).toEqual(expected)' }],
    },
    'a pass only on Playwright\'s own retry': { status: 'passed', errors: [] },
    'a run stopped from outside': { status: 'interrupted', errors: [] },
    'no result at all': {},
}

describe('D-458: a failure that is only a wait', () => {
    it.each(Object.entries(waits))('runs again alone: %s', (_, result) => {
        expect(classify(result).kind).toBe('wait')
    })

    it.each(Object.entries(real))('is real and never runs again: %s', (_, result) => {
        expect(classify(result).kind).toBe('real')
    })

    it('says why in words without colour codes', () => {
        expect(classify(waits['the Gutachten walk: out of time on a navigation']).why).toBe('Test timeout of 180000ms exceeded.')
        expect(classify(waits['PDP-01: the panel never appeared, with a message of its own']).why).toBe('Error: the add brought no panel — element(s) not found')
        expect(classify(real['a wrong text, seen for the whole wait']).why).toBe('Error: expect(locator).toHaveText(expected) failed')
        expect(classify(real['a soft assertion beside a timeout']).why).toBe('out of time after another failure: Error: expect(received).toBeGreaterThanOrEqual(expected)')
    })
})

describe('the tests it reads from a report', () => {
    it('finds every test that did not pass, with its file, line, project and describe titles', () => {
        const report = {
            suites: [{
                title: 'compare.spec.ts',
                specs: [],
                suites: [{
                    title: 'compare',
                    specs: [
                        { title: 'a keyboard reaches the CTA', file: 'compare.spec.ts', line: 112, tests: [{ projectName: 'desktop-1440', status: 'unexpected', results: [waits['compare: out of time in an assertion']] }, { projectName: 'mobile-390', status: 'skipped', results: [] }] },
                        { title: 'the cap disables the fifth checkbox', file: 'compare.spec.ts', line: 126, tests: [{ projectName: 'desktop-1440', status: 'expected', results: [{ status: 'passed' }] }] },
                    ],
                }],
            }],
        }

        expect(failures(report).map(({ file, line, title, titlePath, project }) => ({ file, line, title, titlePath, project }))).toEqual([
            { file: 'compare.spec.ts', line: 112, title: 'a keyboard reaches the CTA', titlePath: ['compare', 'a keyboard reaches the CTA'], project: 'desktop-1440' },
        ])
    })

    it('selects a title by itself: every sign that means something in a pattern is escaped, a leading slash too', () => {
        const title = '/felgen is no wider than its window (320–1920 px)? „Ja“ [x] — $1 + a.b|c'

        expect(new RegExp(exactly(title)).test(title)).toBe(true)
        expect(new RegExp(exactly('a.b')).test('axb')).toBe(false)
        expect(exactly(title).startsWith('\\/')).toBe(true)
    })
})
