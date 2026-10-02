import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, reactive } from 'vue'
import type { ContactProp } from '../../types/rimify'

/*
 * KON-01 (QA, 2026-10-02) — a send the server refuses must not erase the draft.
 *
 * D-123 promises that a draft survives a failed send — "a limit, an expired page" — in the tab's own storage, so the
 * visitor never finds the form cleared (R-09). The server answers both with the shop's error page as an Inertia
 * response (App\Services\Storefront\ErrorPage: `Fehler/Index`, status 429 from `throttle:shop-kontakt`, 419 from the
 * CSRF check). Inertia 3.7.1 (@inertiajs/core, Response.process()) handles an Inertia response with a status >= 400
 * like this: `onHttpException(response)` — it stops if that returns false — then the cancelable
 * `inertia:httpException` document event — it stops if that is prevented — then it sets the error page and, because
 * that page carries no validation errors, calls the visit's `onSuccess`. Kontakt/Index.vue's onSuccess clears the
 * draft, so the sixth message in a minute, or a message sent after the session ran out, is gone when the visitor
 * comes back to the form (Back, or „Diese Seite neu laden“ on the error page).
 *
 * `answerWithErrorPage` replays exactly that sequence against the options the page hands to `form.post`, so the test
 * holds whichever way the page is fixed (onHttpException, a listener on the event, or a check of the page in onSuccess).
 */

const current: { props: Record<string, unknown> } = { props: {} }

interface PostOptions {
    onSuccess?: (page?: unknown) => unknown
    onError?: (errors: Record<string, string>) => unknown
    onHttpException?: (response: unknown) => unknown
    onFinish?: () => unknown
}

const posted: { url: string; options: PostOptions }[] = []

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
    router: { on: vi.fn(() => () => undefined), delete: vi.fn(), visit: vi.fn() },
    useForm: <T extends Record<string, unknown>>(data: T) => {
        const initial = { ...data }
        const form = reactive({
            ...data,
            errors: {} as Record<string, string>,
            processing: false,
            transform() {
                return form
            },
            post(url: string, options: PostOptions) {
                posted.push({ url, options })
            },
            reset(...keys: string[]) {
                for (const k of keys) (form as Record<string, unknown>)[k] = initial[k]
            },
            clearErrors(...keys: string[]) {
                if (keys.length === 0) {
                    form.errors = {}
                } else {
                    for (const k of keys) delete form.errors[k]
                }

                return form
            },
            setError(key: string, value: string) {
                form.errors[key] = value

                return form
            },
        })

        return form
    },
}))

const { default: Kontakt } = await import('./Index.vue')

/* A reserved example domain; the shop's own address lives in config/rimify.php. */
const CONTACT: ContactProp = { email: 'service@example.com', phone: null, phoneIntl: null, whatsapp: null, hours: 'Mo–Fr 9:00–17:00 Uhr' }
const MESSAGE = 'Passt die Felge auch mit Winterreifen auf mein Auto?'

let mounted: VueWrapper[] = []

function mountPage(): VueWrapper {
    current.props = { contact: CONTACT, vehicle: null, notifyByMail: true }
    const wrapper = mount(Kontakt, { props: { contact: CONTACT, prefill: { subject: '', from: '/felgen/beispiel' } }, attachTo: document.body })
    mounted.push(wrapper)

    return wrapper
}

async function fill(wrapper: VueWrapper): Promise<void> {
    await wrapper.find('#kon-name').setValue('Jana Beispiel')
    await wrapper.find('#kon-email').setValue('jana@example.com')
    await wrapper.find('#kon-subject').setValue('Frage zu einer Felge')
    await wrapper.find('#kon-message').setValue(MESSAGE)
}

/** Inertia 3.7.1, Response.process(), for an Inertia response with a status >= 400 and no validation errors. */
async function answerWithErrorPage(options: PostOptions, status: number): Promise<void> {
    const errorPage = { component: 'Fehler/Index', url: '/kontakt', props: { status, errors: {} } }
    const response = { status, headers: { 'x-inertia': 'true' }, data: errorPage }

    if (options.onHttpException?.(response) !== false) {
        const proceed = document.dispatchEvent(new CustomEvent('inertia:httpException', { cancelable: true, detail: { response } }))

        if (proceed) {
            await options.onSuccess?.(errorPage)
        }
    }

    options.onFinish?.()
    await flushPromises()
}

beforeEach(() => {
    posted.length = 0
    window.sessionStorage.clear()
})

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
})

describe('KON-01 — a send the server refuses keeps the draft (D-123)', () => {
    it.each([
        [429, 'the sixth message in a minute'],
        [419, 'a message sent after the session ran out'],
    ])('keeps the words when the send is answered by the %i error page (%s)', async (status) => {
        const first = mountPage()
        await fill(first)
        await first.find('form').trigger('submit')
        expect(posted).toHaveLength(1)

        await answerWithErrorPage(posted[0]!.options, status)

        // The tab's storage still holds the words…
        const draft = JSON.parse(window.sessionStorage.getItem('rmf-kontakt-entwurf') ?? 'null') as { message?: string } | null
        expect(draft?.message).toBe(MESSAGE)

        // …and the form shows them again when the visitor comes back to it.
        first.unmount()
        mounted = []
        const again = mountPage()
        await flushPromises()

        expect((again.find('#kon-message').element as HTMLTextAreaElement).value).toBe(MESSAGE)
        expect((again.find('#kon-email').element as HTMLInputElement).value).toBe('jana@example.com')
    })
})
