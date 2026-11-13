import { describe, expect, it, vi } from 'vitest'
import { continueUpload, type PartUploadOptions, UploadRefused, UploadStalled, uploadInParts } from './partUpload'

/*
 * D-462 (the client's request H): a vehicle file goes to the server in parts the server sizes, and a dropped connection
 * never starts the file over — the server says what it holds, and only the rest is sent.
 */

type Call = { url: string; offset: number | null; size: number | null }

function json(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

/** A server that holds what it is sent in turn, and answers 409 with what it holds otherwise. */
function server(options: { part: number; held?: number; fail?: (call: Call, n: number) => Response | 'drop' | null; lose?: (call: Call, n: number) => boolean }) {
    let held = options.held ?? 0
    let n = 0
    const calls: Call[] = []

    const fetcher = vi.fn(async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
        const href = String(url)
        const body = init?.body
        const offset = body instanceof FormData ? Number(body.get('offset')) : null
        const part = body instanceof FormData ? (body.get('part') as Blob) : null
        const call = { url: href, offset, size: part?.size ?? null }
        calls.push(call)
        n++

        const forced = options.fail?.(call, n) ?? null

        if (forced === 'drop') {
            throw new TypeError('Failed to fetch')
        }

        if (forced) {
            return forced
        }

        if (href.endsWith('/hochladen')) {
            return json(201, { id: 7, part: options.part, held: 0, href: '/admin/fahrzeuge/import/7' })
        }

        if (href.endsWith('/teil')) {
            if (offset !== held) {
                return json(409, { held })
            }

            held += part?.size ?? 0

            // Written, but the answer never arrives.
            if (options.lose?.(call, n)) {
                throw new TypeError('Failed to fetch')
            }

            return json(200, { held })
        }

        return json(200, { href: '/admin/fahrzeuge/import/7' })
    })

    return { fetcher, calls, held: () => held }
}

function opts(file: Blob, fetcher: typeof fetch, progress?: (sent: number, total: number) => void): PartUploadOptions {
    return {
        file,
        start: { url: '/admin/fahrzeuge/import/hochladen', body: { quelle: 'import_kba' }, name: 'fahrzeuge.csv' },
        partUrl: (id) => `/admin/fahrzeuge/import/${id}/teil`,
        finishUrl: (id) => `/admin/fahrzeuge/import/${id}/fertig`,
        onProgress: progress,
        fetcher,
        wait: () => Promise.resolve(),
    }
}

describe('a file in parts', () => {
    it('announces the file, sends it in the parts the server asks for, and marks it complete', async () => {
        const file = new Blob(['x'.repeat(2500)])
        const { fetcher, calls } = server({ part: 1000 })
        const seen: number[] = []

        const done = await uploadInParts(opts(file, fetcher as unknown as typeof fetch, (sent) => seen.push(sent)))

        expect(done).toEqual({ id: 7, href: '/admin/fahrzeuge/import/7' })
        expect(calls.map((c) => [c.url.split('/').pop(), c.offset, c.size])).toEqual([
            ['hochladen', null, null],
            ['teil', 0, 1000],
            ['teil', 1000, 1000],
            ['teil', 2000, 500],
            ['fertig', null, null],
        ])
        expect(seen).toEqual([0, 1000, 2000, 2500])
    })

    it('goes on from what the server holds when a part was out of turn, and sends again what got no answer', async () => {
        const file = new Blob(['y'.repeat(3000)])
        // The second part is written but its answer lost: sent again, the server answers 409 with what it holds. The third
        // part's request drops before it arrives: sent again from the same place.
        const { fetcher, calls, held } = server({ part: 1000, lose: (call, n) => n === 3, fail: (call, n) => (n === 5 ? 'drop' : null) })

        await uploadInParts(opts(file, fetcher as unknown as typeof fetch))

        expect(calls.filter((c) => c.url.endsWith('/teil')).map((c) => c.offset)).toEqual([0, 1000, 1000, 2000, 2000])
        expect(held()).toBe(3000)
    })

    it('stops after five tries without an answer, and says where it stopped so it can go on', async () => {
        const file = new Blob(['z'.repeat(2000)])
        const { fetcher, calls } = server({ part: 1000, fail: (call) => (call.offset === 1000 ? 'drop' : null) })

        const stalled = await uploadInParts(opts(file, fetcher as unknown as typeof fetch)).catch((error: unknown) => error)

        expect(stalled).toBeInstanceOf(UploadStalled)
        expect(stalled).toMatchObject({ id: 7, held: 1000, part: 1000 })
        expect(calls.filter((c) => c.offset === 1000)).toHaveLength(5)

        // Taken up again on a server that holds the first part: only the rest is sent.
        const again = server({ part: 1000, held: 1000 })
        const resumed = await continueUpload(opts(file, again.fetcher as unknown as typeof fetch), { id: 7, part: 1000, held: 1000 })

        expect(resumed.href).toBe('/admin/fahrzeuge/import/7')
        expect(again.calls.filter((c) => c.url.endsWith('/teil')).map((c) => c.offset)).toEqual([1000])
        expect(again.held()).toBe(2000)
    })

    it('hands the server’s refusal over in its own words, field by field', async () => {
        const file = new Blob(['a'])
        const { fetcher } = server({
            part: 1000,
            fail: (call) => (call.url.endsWith('/hochladen') ? json(422, { errors: { quelle: ['Bitte wähl, woher die Fahrzeugdaten kommen.'] } }) : null),
        })

        const refused = await uploadInParts(opts(file, fetcher as unknown as typeof fetch)).catch((error: unknown) => error)

        expect(refused).toBeInstanceOf(UploadRefused)
        expect((refused as UploadRefused).errors).toEqual({ quelle: 'Bitte wähl, woher die Fahrzeugdaten kommen.' })
    })
})
