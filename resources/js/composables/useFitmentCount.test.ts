import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { COUNT_DEBOUNCE_MS, useFitmentCount, type FitmentCountResult } from './useFitmentCount'

function result(count: number, label: string): FitmentCountResult {
    return { count, permitted: count, conditional: 0, vehicle: { id: 1, label, short: label }, ambiguous: [] }
}

describe('useFitmentCount', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.useRealTimers()
    })

    it('shows the skeleton at once and asks the server once the customer has settled', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify(result(147, 'BMW 320i')), { status: 200 }))
        vi.stubGlobal('fetch', fetchMock)

        const count = useFitmentCount()
        count.run({ hsn: '0005', tsn: '58' })
        count.run({ hsn: '0005', tsn: '582' })
        expect(count.loading.value).toBe(true)

        vi.advanceTimersByTime(COUNT_DEBOUNCE_MS - 1)
        expect(fetchMock).not.toHaveBeenCalled()

        await vi.advanceTimersByTimeAsync(1)
        await vi.runAllTimersAsync()
        await nextTick()

        expect(fetchMock).toHaveBeenCalledTimes(1)
        const [call] = fetchMock.mock.calls as unknown as [unknown[]]
        expect(String(call[0])).toBe('/api/v1/fitment/count?hsn=0005&tsn=582')
        expect(count.result.value?.count).toBe(147)
        expect(count.loading.value).toBe(false)
    })

    it('keeps the answer for the car in the form when an earlier answer arrives late', async () => {
        let resolveFirst: ((r: Response) => void) | undefined
        const fetchMock = vi
            .fn()
            .mockImplementationOnce(() => new Promise<Response>((resolve) => (resolveFirst = resolve)))
            .mockImplementationOnce(async () => new Response(JSON.stringify(result(12, 'Audi A4')), { status: 200 }))
        vi.stubGlobal('fetch', fetchMock)

        const count = useFitmentCount()
        count.run({ fahrzeug: 1 })
        await vi.advanceTimersByTimeAsync(COUNT_DEBOUNCE_MS)
        count.run({ fahrzeug: 2 })
        await vi.advanceTimersByTimeAsync(COUNT_DEBOUNCE_MS)
        await vi.runAllTimersAsync()

        resolveFirst?.(new Response(JSON.stringify(result(147, 'BMW 320i')), { status: 200 }))
        await vi.runAllTimersAsync()
        await nextTick()

        expect(count.result.value?.count).toBe(12)
        expect(String((fetchMock.mock.calls[1] as unknown[])[0])).toBe('/api/v1/fitment/count?fahrzeug=2')
    })

    it('drops a late answer after the form was cleared', async () => {
        let resolveFirst: ((r: Response) => void) | undefined
        vi.stubGlobal(
            'fetch',
            vi.fn(() => new Promise<Response>((resolve) => (resolveFirst = resolve)))
        )

        const count = useFitmentCount()
        count.run({ fahrzeug: 1 })
        await vi.advanceTimersByTimeAsync(COUNT_DEBOUNCE_MS)
        count.clear()

        resolveFirst?.(new Response(JSON.stringify(result(147, 'BMW 320i')), { status: 200 }))
        await vi.runAllTimersAsync()
        await nextTick()

        expect(count.result.value).toBeNull()
        expect(count.loading.value).toBe(false)
    })

    it('reports a failure instead of a stale number', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })))

        const count = useFitmentCount()
        count.run({ fahrzeug: 1 })
        await vi.advanceTimersByTimeAsync(COUNT_DEBOUNCE_MS)
        await vi.runAllTimersAsync()

        expect(count.failed.value).toBe(true)
        expect(count.result.value).toBeNull()
        expect(count.loading.value).toBe(false)
    })
})
