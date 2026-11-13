import { beforeEach, describe, expect, it, vi } from 'vitest'

const visits: Array<{ options: Record<string, unknown>; cancelled: boolean }> = []

vi.mock('@inertiajs/vue3', () => ({
    router: {
        reload: vi.fn((options: Record<string, unknown>) => {
            const visit = { options, cancelled: false }
            visits.push(visit)
            ;(options.onCancelToken as (token: { cancel: () => void }) => void)({ cancel: () => (visit.cancelled = true) })
        }),
    },
}))

const { freshReload } = await import('./freshReload')

/* The step-5 race of 13.11.2026: an older reload's answer must never land after a newer one's. */
describe('freshReload', () => {
    beforeEach(() => {
        visits.length = 0
    })

    it('calls off the reload before it under the same name, and only that one', () => {
        freshReload('schritt-5', { only: ['document'] })
        freshReload('vorschau', { only: ['preview'] })
        freshReload('schritt-5', { only: ['document'] })

        expect(visits.map((v) => [v.options.only, v.cancelled])).toEqual([
            [['document'], true],
            [['preview'], false],
            [['document'], false],
        ])
    })

    it('forgets a reload once it is answered, and still says so to whoever asked', () => {
        const finished = vi.fn()
        freshReload('codes', { only: ['conditions'], onFinish: finished })
        ;(visits[0]!.options.onFinish as (visit: unknown) => void)({})
        freshReload('codes', { only: ['conditions'] })

        expect(finished).toHaveBeenCalledTimes(1)
        // The first was answered before the second began: nothing to call off.
        expect(visits[0]!.cancelled).toBe(false)
    })
})

describe('cancelReload', () => {
    beforeEach(() => {
        visits.length = 0
    })

    it('calls off the reload on its way when a save makes it old, and nothing when none is', async () => {
        const { cancelReload } = await import('./freshReload')

        cancelReload('schritt-5')
        freshReload('schritt-5', { only: ['document'] })
        cancelReload('schritt-5')

        expect(visits.map((v) => v.cancelled)).toEqual([true])
    })
})
