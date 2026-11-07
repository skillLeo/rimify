import { beforeEach, describe, expect, it, vi } from 'vitest'

const del = vi.fn()

vi.mock('@inertiajs/vue3', () => ({ router: { delete: (...args: unknown[]) => del(...args), patch: vi.fn(), post: vi.fn() } }))

describe('useBasket', () => {
    beforeEach(() => {
        del.mockClear()
        vi.useFakeTimers()
    })

    it('removes one line for a double press, and the next one on a press of its own', async () => {
        const { useBasket } = await import('./useBasket')
        const basket = useBasket()

        basket.remove('wheel:1')
        vi.advanceTimersByTime(300)
        // The next line has moved under the pointer.
        basket.remove('wheel:2')
        expect(del).toHaveBeenCalledTimes(1)

        vi.advanceTimersByTime(800)
        basket.remove('wheel:2')
        expect(del).toHaveBeenCalledTimes(2)
    })
})
