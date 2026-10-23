import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, reactive } from 'vue'

/*
 * The form's state and its guard. Pinned here: nothing is sent while clean or in flight, a save
 * makes the saved values the new clean state (or clears a password form), a refused save focuses
 * the first refused field, and a visit away from a dirty form is held until somebody decides.
 */

type Handler = (event: { detail: { visit: Record<string, unknown> }; preventDefault: () => void }) => void

const handlers: Record<string, Handler> = {}
const visit = vi.fn()

interface FakeForm {
    [key: string]: unknown
    isDirty: boolean
    processing: boolean
    submit: ReturnType<typeof vi.fn>
    reset: ReturnType<typeof vi.fn>
    defaults: ReturnType<typeof vi.fn>
    clearErrors: ReturnType<typeof vi.fn>
}

let form: FakeForm

vi.mock('@inertiajs/vue3', () => ({
    useForm: (data: Record<string, unknown>) => {
        form = reactive({
            ...data,
            isDirty: false,
            processing: false,
            data: () => ({ ...data }),
            submit: vi.fn(),
            reset: vi.fn(),
            defaults: vi.fn(),
            clearErrors: vi.fn(),
        }) as FakeForm

        return form
    },
    router: {
        on: (name: string, handler: Handler) => {
            handlers[name] = handler

            return () => delete handlers[name]
        },
        visit: (...args: unknown[]) => visit(...args),
    },
}))

const { useDirtyForm } = await import('./useDirtyForm')

let mounted: VueWrapper[] = []

function mountForm(options: { resetOnSuccess?: boolean; stamp?: () => string | null } = {}): ReturnType<typeof useDirtyForm> {
    let editor!: ReturnType<typeof useDirtyForm>

    mounted.push(
        mount(
            defineComponent({
                setup() {
                    editor = useDirtyForm({ name: 'Rot' }, { method: 'put', url: '/admin/x', ...options })

                    return () => h('div')
                },
            }),
            { attachTo: document.body }
        )
    )

    return editor
}

function navigate(visitOptions: Record<string, unknown> = {}): boolean {
    let prevented = false
    handlers.before?.({
        detail: { visit: { method: 'get', async: false, prefetch: false, url: new URL('http://x.test/admin/rollen'), ...visitOptions } },
        preventDefault: () => (prevented = true),
    })

    return prevented
}

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    visit.mockReset()
    document.body.innerHTML = ''
})

describe('useDirtyForm', () => {
    it('sends nothing while clean or while a save is in flight', () => {
        const editor = mountForm()

        editor.save()
        expect(form.submit).not.toHaveBeenCalled()

        form.isDirty = true
        form.processing = true
        editor.save()
        expect(form.submit).not.toHaveBeenCalled()
    })

    it('makes what was saved the new clean state', () => {
        const editor = mountForm()
        form.isDirty = true

        editor.save()
        expect(form.submit).toHaveBeenCalledWith('put', '/admin/x', expect.any(Object))

        const options = form.submit.mock.calls[0]?.[2] as { onSuccess: () => void }
        options.onSuccess()
        expect(form.defaults).toHaveBeenCalledOnce()
        expect(form.reset).not.toHaveBeenCalled()
    })

    it('sends the stamp of the state the page was opened on with each save, and nothing without one (the admin audit’s F-25)', () => {
        let stamp = 'stand-1'
        const editor = mountForm({ stamp: () => stamp })
        form.isDirty = true

        editor.save()
        expect((form.submit.mock.calls[0]?.[2] as { headers: Record<string, string> }).headers).toEqual({ 'X-Rimify-Stand': 'stand-1' })

        // Read at each save: after a save the page carries the new state's stamp.
        stamp = 'stand-2'
        editor.save()
        expect((form.submit.mock.calls[1]?.[2] as { headers: Record<string, string> }).headers).toEqual({ 'X-Rimify-Stand': 'stand-2' })

        const unstamped = mountForm()
        form.isDirty = true
        unstamped.save()
        expect((form.submit.mock.calls[0]?.[2] as { headers: Record<string, string> }).headers).toEqual({})
    })

    it('clears a form that must not keep its values, such as a password', () => {
        const editor = mountForm({ resetOnSuccess: true })
        form.isDirty = true

        editor.save()
        ;(form.submit.mock.calls[0]?.[2] as { onSuccess: () => void }).onSuccess()
        expect(form.reset).toHaveBeenCalledOnce()
        expect(form.defaults).not.toHaveBeenCalled()
    })

    it('marks a refused save and focuses the first refused field', async () => {
        const editor = mountForm()
        document.body.insertAdjacentHTML('beforeend', '<main class="adm-page"><input id="a"><input id="b" aria-invalid="true"></main>')
        form.isDirty = true

        editor.save()
        ;(form.submit.mock.calls[0]?.[2] as { onError: () => void }).onError()
        await nextTick()

        expect(editor.failed.value).toBe(true)
        expect(document.activeElement?.id).toBe('b')

        editor.discard()
        expect(editor.failed.value).toBe(false)
        expect(form.reset).toHaveBeenCalled()
    })

    it('lets every visit through while clean, and holds one while dirty', () => {
        const editor = mountForm()

        expect(navigate()).toBe(false)

        form.isDirty = true
        expect(navigate({ method: 'put' })).toBe(false)
        expect(navigate({ prefetch: true })).toBe(false)
        expect(navigate()).toBe(true)
        expect(editor.leaving.value).toBe(true)
    })

    it('stays on Weiter bearbeiten, and goes where it was going on Änderungen verwerfen', () => {
        const editor = mountForm()
        form.isDirty = true

        navigate()
        editor.stay()
        expect(editor.leaving.value).toBe(false)
        expect(visit).not.toHaveBeenCalled()

        navigate()
        editor.leave()
        expect(form.reset).toHaveBeenCalled()
        expect(visit).toHaveBeenCalledWith('http://x.test/admin/rollen', expect.any(Object))
    })

    it('asks first when the page wants a question before the save, and sends only on a yes', () => {
        let send: (() => void) | null = null
        let editor!: ReturnType<typeof useDirtyForm>

        mounted.push(
            mount(
                defineComponent({
                    setup() {
                        editor = useDirtyForm({ rights: [] }, { method: 'put', url: '/admin/x', beforeSave: (proceed) => (send = proceed) })

                        return () => h('div')
                    },
                })
            )
        )
        form.isDirty = true

        editor.save()
        expect(form.submit).not.toHaveBeenCalled()
        expect(send).not.toBeNull()

        send!()
        expect(form.submit).toHaveBeenCalledOnce()
    })

    it('keeps words typed while a save was on its way marked as unsaved', () => {
        const editor = mountForm()
        form.isDirty = true
        editor.save()

        // The field changes after the request left: the saved state is what was sent, not this.
        form.data = () => ({ name: 'Rot und Blau' })
        ;(form.submit.mock.calls[0]?.[2] as { onSuccess: () => void }).onSuccess()

        expect(form.defaults).toHaveBeenCalledWith({ name: 'Rot' })
        expect(form.isDirty).toBe(true)
    })

    it('marks the save failed when the server or the network refuses it, and keeps what was typed', () => {
        const editor = mountForm()
        form.isDirty = true

        editor.save()
        const options = form.submit.mock.calls[0]?.[2] as { onHttpException: () => void; onNetworkError: () => void }

        options.onHttpException()
        expect(editor.failed.value).toBe(true)
        expect(form.reset).not.toHaveBeenCalled()

        editor.discard()
        options.onNetworkError()
        expect(editor.failed.value).toBe(true)
    })

    it('holds the browser Back button while dirty, and goes back on Änderungen verwerfen', () => {
        const own = { page: { url: '/admin/seiten/7' } }
        window.history.replaceState(own, '', '/admin/seiten/7')
        const editor = mountForm()
        const push = vi.spyOn(window.history, 'pushState')
        const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined)
        const router = vi.fn()
        window.addEventListener('popstate', router)

        // Clean: Back is the router's.
        window.dispatchEvent(new PopStateEvent('popstate', { state: { page: { url: '/admin/seiten' } } }))
        expect(router).toHaveBeenCalledOnce()

        // Dirty: the page goes back under the button, and the question is asked.
        form.isDirty = true
        window.dispatchEvent(new PopStateEvent('popstate', { state: { page: { url: '/admin/seiten' } } }))
        expect(router).toHaveBeenCalledOnce()
        expect(push).toHaveBeenCalledWith(own, '', expect.stringContaining('/admin/seiten/7'))
        expect(editor.leaving.value).toBe(true)

        editor.leave()
        expect(back).toHaveBeenCalledOnce()
        window.dispatchEvent(new PopStateEvent('popstate', { state: { page: { url: '/admin/seiten' } } }))
        expect(router).toHaveBeenCalledTimes(2)

        window.removeEventListener('popstate', router)
        push.mockRestore()
        back.mockRestore()
    })

    it('saves on Strg S when there is something to save', () => {
        mountForm()
        form.isDirty = true

        const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true, cancelable: true })
        window.dispatchEvent(event)

        expect(event.defaultPrevented).toBe(true)
        expect(form.submit).toHaveBeenCalledOnce()
    })
})
