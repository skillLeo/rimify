import { type APIRequestContext, type BrowserContext } from '@playwright/test'

/*
 * Teardown by request — the operator's rule of 17.10.2026 („THIRD TIME. THE CLASS IS CLEANUP.“): **cleanup never
 * navigates.** A hook or fixture that drives the browser after the body has finished can race a locator that has not
 * given up yet, however generous the timeout: under load the timeout's afterEach opened the bare order list while
 * 508's check still polled, and the check read that page as the app's answer (D-263).
 *
 * So a teardown resets the server's state over requests — the context's own (`context.request`: the same session and
 * cookies as the page, never the page itself) or the plain `request` fixture — and never receives the page. The browser
 * side needs no cleanup: Playwright throws the context away after every test. `E2eTeardownTest` holds every suite to it.
 */

type Writer = BrowserContext | APIRequestContext

function requester(via: Writer): APIRequestContext {
    return 'request' in via ? via.request : via
}

async function xsrf(via: Writer): Promise<string | null> {
    if (!('cookies' in via)) {
        return null
    }

    const cookie = (await via.cookies()).find((c) => c.name === 'XSRF-TOKEN')

    return cookie === undefined ? null : decodeURIComponent(cookie.value)
}

/**
 * A write as the app's own background saves send it (preferences.ts): the session's cookies, the XSRF header, JSON. A
 * redirect is not followed and comes back as its status; a refusal is Laravel's 422; without a session, whatever the
 * server says to a guest — a teardown after a test that never signed in writes nothing.
 */
export async function send(via: Writer, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<number> {
    const token = await xsrf(via)
    const response = await requester(via).fetch(path, {
        method,
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(token === null ? {} : { 'X-XSRF-TOKEN': token }),
        },
        data: body,
        maxRedirects: 0,
    })

    return response.status()
}

/** A GET by request — for state the server keeps from a visit's own address (the Übersicht's `?zeitraum=`). Its status. */
export async function get(via: Writer, path: string): Promise<number> {
    return (await requester(via).get(path, { headers: { Accept: 'text/html' }, maxRedirects: 0 })).status()
}

/**
 * A page's props as the server sends them on a first visit, read from its HTML over a request — the script element or
 * the `data-page` attribute `@inertia` writes. Null where the page does not answer with one (no session: the sign-in).
 */
export async function propsOf<T>(via: Writer, path: string): Promise<T | null> {
    const response = await requester(via).get(path, { headers: { Accept: 'text/html' }, maxRedirects: 0 })

    if (response.status() !== 200) {
        return null
    }

    const html = await response.text()
    const script = /<script[^>]*data-page="app"[^>]*>([\s\S]*?)<\/script>/.exec(html)?.[1]
    const attribute = /<div id="app"[^>]*\sdata-page="([^"]*)"/.exec(html)?.[1]
    const json = script ?? (attribute === undefined ? null : unescapeAttribute(attribute))

    return json === null ? null : ((JSON.parse(json) as { props: T }).props ?? null)
}

/** What Blade's `{{ }}` escapes in an attribute, back: ENT_QUOTES, the ampersand last. */
function unescapeAttribute(value: string): string {
    return value.replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
}
