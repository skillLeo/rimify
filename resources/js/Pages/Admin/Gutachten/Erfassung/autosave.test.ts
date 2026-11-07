import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAutosave } from './autosave'

/* What the interaction review of 06.11.2026 found: endless saves, the end of typing lost, a failed save dropped. */

/** A write the test answers by hand, and everything it was sent. */
function rig() {
    const sent: string[] = []
    const answers: ((ok: boolean) => void)[] = []
    const state = { text: 'a' }
    const save = createAutosave({
        content: () => state.text,
        write: () => {
            sent.push(state.text)

            return new Promise<boolean>((resolve) => answers.push(resolve))
        },
        delay: 600,
    })

    save.mark()

    return { sent, answers, state, save }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('saving as it is typed', () => {
    it('saves once per change, however often the page redraws', async () => {
        const { sent, answers, state, save } = rig()

        state.text = 'b'
        save.changed()
        await vi.advanceTimersByTimeAsync(600)
        expect(sent).toEqual(['b'])

        answers[0]!(true)
        await vi.advanceTimersByTimeAsync(0)

        // The answer brought ids and words: a redraw, and nothing to send.
        save.changed()
        await vi.advanceTimersByTimeAsync(6000)

        expect(sent).toEqual(['b'])
        expect(save.owed()).toBe(false)
    })

    it('waits for the last change, then sends only that', async () => {
        const { sent, state, save } = rig()

        for (const text of ['b', 'bc', 'bcd']) {
            state.text = text
            save.changed()
            await vi.advanceTimersByTimeAsync(300)
        }

        await vi.advanceTimersByTimeAsync(300)

        expect(sent).toEqual(['bcd'])
    })

    it('never sends two at once: what was typed during a save goes after its answer, and nothing is lost', async () => {
        const { sent, answers, state, save } = rig()

        state.text = '235/40R18'
        save.changed()
        await vi.advanceTimersByTimeAsync(600)

        // The first is on its way; the end of the size is typed, and the person moves on.
        state.text = '235/40R18 95Y'

        const leaving = save.flush()

        await vi.advanceTimersByTimeAsync(0)
        expect(sent).toEqual(['235/40R18'])

        answers[0]!(true)
        await vi.advanceTimersByTimeAsync(0)
        expect(sent).toEqual(['235/40R18', '235/40R18 95Y'])

        answers[1]!(true)

        await expect(leaving).resolves.toBe(true)
        expect(save.owed()).toBe(false)
    })

    it('keeps a failed save owed, says so to whoever moves on, and tries again', async () => {
        const { sent, answers, state, save } = rig()

        state.text = 'b'

        const first = save.flush()

        answers[0]!(false)

        await expect(first).resolves.toBe(false)
        expect(save.owed()).toBe(true)

        const second = save.flush()

        await vi.advanceTimersByTimeAsync(0)
        expect(sent).toEqual(['b', 'b'])

        answers[1]!(true)

        await expect(second).resolves.toBe(true)
        expect(save.owed()).toBe(false)
    })

    it('counts a write that threw as failed', async () => {
        const save = createAutosave({ content: () => 'b', write: () => Promise.reject(new Error('offline')), delay: 1 })

        save.mark()
        save.force()

        await expect(save.flush()).resolves.toBe(false)
        expect(save.owed()).toBe(true)
    })

    it('takes back what was said against a change once it is changed back: nothing to send, and nothing to complain of', async () => {
        const clean = vi.fn()
        const state = { text: 'a' }
        const write = vi.fn(() => Promise.resolve(false))
        const save = createAutosave({ content: () => state.text, write, delay: 600, clean })

        save.mark()
        state.text = 'not a date'
        await expect(save.flush()).resolves.toBe(false)
        expect(clean).not.toHaveBeenCalled()

        state.text = 'a'
        save.changed()

        expect(clean).toHaveBeenCalledOnce()
        expect(save.owed()).toBe(false)
        await vi.advanceTimersByTimeAsync(6000)
        expect(write).toHaveBeenCalledOnce()
    })

    it('owes nothing before anything was loaded', async () => {
        const write = vi.fn(() => Promise.resolve(true))
        const save = createAutosave({ content: () => 'not loaded', write, delay: 1 })

        save.changed()
        await vi.advanceTimersByTimeAsync(10)

        await expect(save.flush()).resolves.toBe(true)
        expect(write).not.toHaveBeenCalled()
        expect(save.owed()).toBe(false)
    })

    it('sends a chosen file though no text changed, once', async () => {
        const write = vi.fn(() => Promise.resolve(true))
        const save = createAutosave({ content: () => 'same', write, delay: 1 })

        save.mark()
        save.force()

        await expect(save.flush()).resolves.toBe(true)
        await expect(save.flush()).resolves.toBe(true)

        expect(write).toHaveBeenCalledTimes(1)
    })
})
