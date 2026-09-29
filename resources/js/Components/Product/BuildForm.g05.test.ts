import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import type { BuildProp } from '../../types/rimify'

/*
 * QA „Letzte Runde (G)“, G-05 (S2) — docs/qa/BUGS.md.
 *
 * Without a connection (a tunnel, a lift, a flaky phone network) a chosen body style or drive is lost without a
 * word: `router.post` gets no `onNetworkError`, the storefront registers no `networkError` handler (only the admin
 * does), and `onFinish` merely clears the turning mark. The option un-presses, the question stands as before, and
 * nothing says it was not saved or that it can be tried again.
 */

type VisitOptions = { onNetworkError?: (error: unknown) => unknown; onFinish?: (visit?: unknown) => void }

const post = vi.fn()

vi.mock('@inertiajs/vue3', () => ({ router: { post: (...args: unknown[]) => post(...args) } }))

const { default: BuildForm } = await import('./BuildForm.vue')

const NONE: BuildProp = { bodyForm: null, bodySource: null, bodyWord: null, driveAxle: null, driveSource: null, driveWord: null }

let mounted: VueWrapper[] = []

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    post.mockReset()
})

describe('G-05 · a choice that cannot be sent says so', () => {
    it('names the failure beside the question and leaves every option ready to try again', async () => {
        const wrapper = mount(BuildForm, { props: { vehicleId: 82, build: NONE, missing: ['bodyForm'] }, attachTo: document.body })
        mounted.push(wrapper)

        await wrapper.findAll('#bf-bodyForm .bf__option').find((o) => o.text() === 'Kombi')!.trigger('click')

        const options = post.mock.calls.at(-1)?.[2] as VisitOptions | undefined
        expect(options).toBeDefined()

        // What Inertia does without a network: onNetworkError, then onFinish.
        options?.onNetworkError?.(new TypeError('Failed to fetch'))
        options?.onFinish?.({})
        await nextTick()

        const alert = wrapper.find('[role="alert"]')
        expect(alert.exists()).toBe(true)
        expect(alert.text().trim()).not.toBe('')
        expect(wrapper.findAll('#bf-bodyForm .bf__option:disabled')).toHaveLength(0)
    })
})
