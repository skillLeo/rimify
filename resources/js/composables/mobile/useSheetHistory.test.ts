import { beforeEach, describe, expect, it, vi } from 'vitest'
import { openSheetCount, SHEET_STATE_KEY, stripSheetState, useSheetHistory } from './useSheetHistory'

function pop(state: unknown = null): PopStateEvent {
    const event = new PopStateEvent('popstate', { state })

    return event
}

describe('useSheetHistory', () => {
    beforeEach(() => {
        stripSheetState()
        window.history.replaceState({ page: { component: 'X' } }, '', '/')
    })

    it('pushes one entry that copies the Inertia state and marks the sheet', () => {
        const sheet = useSheetHistory('a', () => undefined)
        const before = window.history.length

        sheet.open()

        expect(window.history.length).toBe(before + 1)
        expect((window.history.state as Record<string, unknown>)[SHEET_STATE_KEY]).toBe('a')
        expect((window.history.state as Record<string, unknown>).page).toEqual({ component: 'X' })
        expect(openSheetCount()).toBe(1)
    })

    it('does not push twice for the same sheet', () => {
        const sheet = useSheetHistory('b', () => undefined)
        sheet.open()
        const length = window.history.length
        sheet.open()

        expect(window.history.length).toBe(length)
    })

    it('swallows the user\'s back and closes the sheet instead of letting Inertia see it', () => {
        const onBack = vi.fn()
        const inertia = vi.fn()
        const sheet = useSheetHistory('c', onBack)
        sheet.open()

        window.addEventListener('popstate', inertia)
        window.dispatchEvent(pop({ page: { component: 'X' } }))
        window.removeEventListener('popstate', inertia)

        expect(onBack).toHaveBeenCalledTimes(1)
        expect(inertia).not.toHaveBeenCalled()
        expect(openSheetCount()).toBe(0)
    })

    it('resolves a programmatic close when its own pop arrives', async () => {
        const onBack = vi.fn()
        const sheet = useSheetHistory('d', onBack)
        sheet.open()

        const closing = sheet.close()
        window.dispatchEvent(pop({ page: { component: 'X' } }))
        await closing

        expect(onBack).not.toHaveBeenCalled()
        expect(openSheetCount()).toBe(0)
    })

    it('settles a close whose pop never arrives', async () => {
        vi.useFakeTimers()
        const sheet = useSheetHistory('e', () => undefined)
        sheet.open()

        const closing = sheet.close()
        vi.advanceTimersByTime(500)
        await closing

        expect(openSheetCount()).toBe(0)
        vi.useRealTimers()
    })

    it('strips the marker in place before a navigation', () => {
        const sheet = useSheetHistory('f', () => undefined)
        sheet.open()

        stripSheetState()

        expect(openSheetCount()).toBe(0)
        expect(SHEET_STATE_KEY in (window.history.state as Record<string, unknown>)).toBe(false)
        expect((window.history.state as Record<string, unknown>).page).toEqual({ component: 'X' })
    })

    it('ignores a pop when no sheet is open', () => {
        const inertia = vi.fn()
        window.addEventListener('popstate', inertia)
        window.dispatchEvent(pop({ page: { component: 'X' } }))
        window.removeEventListener('popstate', inertia)

        expect(inertia).toHaveBeenCalledTimes(1)
    })
})
