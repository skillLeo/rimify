import { expect, type BrowserContext, type Locator, type Page } from '@playwright/test'
import { propsOf, send as sendAs } from '../teardown'
import { signIn, waitForApp } from './faq-support'

/*
 * Shared steps of the Gespeicherte Ansichten / Spaltenwahl bug tests (SV-xx, docs/qa/BUGS.md).
 *
 * These tests write to the signed-in super-admin's account, through the app's own endpoints, and
 * put it back: every view they make is named „QA-…" and deleted again (soft delete, as the page's
 * own „Löschen" does), and the list's columns are set back to the default. cleanUp runs before and
 * after every test, so a test that failed half-way leaves nothing behind for the next.
 */

/** Where the SV tests leave their evidence. Relative to the project root, where Playwright runs. */
export const SHOTS = 'docs/qa/shots/sv'

export const PREFIX = 'QA-'
export const LIST = '/admin/bestellungen'
export const DEFAULT_COLUMNS = ['nummer', 'datum', 'kunde', 'summe', 'zahlung', 'versand']

/** One entry of the page's `views.items` (ListViews::for). */
export interface ViewItem {
    id: number
    name: string
    href: string
    mine: boolean
}

export const bar = (page: Page): Locator => page.getByRole('navigation', { name: 'Ansichten' })

/** The props of the page as the server first sent them — read after a full load, never after a visit. */
async function initialProps(page: Page): Promise<{ views?: { items: ViewItem[] } }> {
    return page.evaluate(() => {
        const data = document.querySelector('script[data-page="app"]')?.textContent ?? document.querySelector<HTMLElement>('#app')?.dataset.page

        return data ? (JSON.parse(data) as { props: { views?: { items: ViewItem[] } } }).props : {}
    })
}

/** This person's own „QA-…" views, as the list shows them now. Opens the list (a full load). */
export async function myViews(page: Page): Promise<ViewItem[]> {
    await page.goto(LIST, { waitUntil: 'networkidle' })

    return ((await initialProps(page)).views?.items ?? []).filter((view) => view.mine && view.name.startsWith(PREFIX))
}

/**
 * A request sent the way the app's own background saves are (preferences.ts): same origin, the
 * XSRF header, JSON. A redirect is not followed and comes back as 302; a refusal is Laravel's 422.
 */
export async function send(page: Page, method: 'POST' | 'PATCH' | 'DELETE', url: string, body?: unknown): Promise<number> {
    return page.evaluate(
        async ({ method, url, body }) => {
            const token = decodeURIComponent(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/.exec(document.cookie)?.[1] ?? '')
            const response = await fetch(url, {
                method,
                credentials: 'same-origin',
                redirect: 'manual',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': token,
                },
                body: body === undefined ? undefined : JSON.stringify(body),
            })

            return response.type === 'opaqueredirect' ? 302 : response.status
        },
        { method, url, body }
    )
}

/** Saves views exactly as the dialog does (POST /admin/ansichten) and returns them as the list shows them. */
export async function createViews(page: Page, views: { name: string; query: Record<string, string> }[]): Promise<ViewItem[]> {
    for (const { name, query } of views) {
        expect(name.startsWith(PREFIX), 'rig: every view a test makes is a „QA-…" view').toBe(true)
        expect(await send(page, 'POST', '/admin/ansichten', { list: 'bestellungen', name, query, role_id: null }), `rig: „${name}" is saved`).toBe(302)
    }

    const mine = await myViews(page)

    return views.map(({ name }) => {
        const view = mine.find((v) => v.name === name)
        expect(view, `rig: „${name}" is in the bar`).toBeDefined()

        return view as ViewItem
    })
}

/**
 * Deletes every „QA-…" view of this person and puts the list's own columns back — by request, never through the page
 * (e2e/teardown.ts: cleanup never navigates). The views are read from the list's HTML over the same session.
 */
export async function cleanUp(context: BrowserContext): Promise<void> {
    const props = await propsOf<{ views?: { items: ViewItem[] } }>(context, LIST)

    for (const view of (props?.views?.items ?? []).filter((v) => v.mine && v.name.startsWith(PREFIX))) {
        await sendAs(context, 'DELETE', `/admin/ansichten/${view.id}`)
    }

    await sendAs(context, 'PATCH', '/admin/ansicht', { list: 'bestellungen', columns: DEFAULT_COLUMNS })
}

/** Signed in, at `width` × `height`, with no „QA-…" views and the default columns. */
export async function start(page: Page, width: number, height = 900): Promise<void> {
    await page.setViewportSize({ width, height })
    await signIn(page)
    await cleanUp(page.context())
}

export async function open(page: Page, href: string): Promise<void> {
    await page.goto(href, { waitUntil: 'networkidle' })
    await waitForApp(page)
}

/** Whether an element lies wholly inside the visible part of another (a scrolling row, the window). */
export async function inside(inner: Locator, outer: Locator | { width: number }): Promise<{ ok: boolean; detail: string }> {
    const box = await inner.boundingBox()
    const frame = 'width' in outer ? { x: 0, width: outer.width } : await outer.boundingBox()

    if (!box || !frame) {
        return { ok: false, detail: 'no box' }
    }

    const ok = box.x >= frame.x - 1 && box.x + box.width <= frame.x + frame.width + 1

    return { ok, detail: `${Math.round(box.x)}–${Math.round(box.x + box.width)} px in ${Math.round(frame.x)}–${Math.round(frame.x + frame.width)} px` }
}

/** Whether the keyboard focus is inside the views bar (tabs, the view's menu button, its actions). */
export async function focusInBar(page: Page): Promise<{ inBar: boolean; on: string }> {
    return page.evaluate(() => {
        const el = document.activeElement

        if (!el || el === document.body || el === document.documentElement) {
            return { inBar: false, on: '<body>' }
        }

        return { inBar: el.closest('.lv') !== null, on: `<${el.tagName.toLowerCase()}> "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 50)}"` }
    })
}
