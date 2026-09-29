import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, reactive } from 'vue'
import type { FelgenProps } from '../../types/pages'
import type { BuildProp, VehicleProp } from '../../types/rimify'

/*
 * QA „Letzte Runde (G)“, G-01 (S2) — docs/qa/BUGS.md.
 *
 * On /felgen the body style and drive the whole grid is answered for are shown only while one of them is still
 * missing (`v-if="hasVehicle && vehicle && missing?.length"`). A value read from the car's name („Touring“ → Kombi)
 * or given by the owner decides every „Passend“ on the page, but once nothing is missing the listing never says
 * so: no „Stimmt das?“, no „Ändern“ — a mis-tapped answer can be neither seen nor corrected on this page. And the
 * last answer given here unmounts the whole question box, so the keyboard falls to <body>.
 */

type VisitOptions = { onSuccess?: (page?: unknown) => void; onFinish?: (visit?: unknown) => void }

/* Reactive, as Inertia's page is: the shared `vehicle` changes with the server's answer. */
const current = reactive<{ props: Record<string, unknown> }>({ props: {} })
const post = vi.fn()

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
    router: { get: vi.fn(), post: (...args: unknown[]) => post(...args), on: vi.fn(() => () => undefined), delete: vi.fn() },
}))

const { default: Felgen } = await import('./Index.vue')

const CONTACT = { email: 'service@example.com', phone: null, phoneIntl: null, whatsapp: null, hours: 'Mo–Fr 9:00–17:00 Uhr' }

/* A car typed from a Gutachten: no body style in the data, „Touring“ in its name. */
function touring(build: BuildProp): VehicleProp {
    return {
        id: 94,
        make: 'BMW',
        model: '3er-Touring (VI)',
        variant: '3K',
        typeDesignation: '3K',
        label: 'BMW 3er-Touring (VI) 3K',
        short: 'BMW 3er-Touring (VI)',
        hsn: null,
        tsn: null,
        keyNumbers: 'HSN/TSN noch nicht hinterlegt',
        buildWindow: 'Bauzeitraum unbekannt',
        build,
    }
}

const CARD = { modelId: 1, finishId: 1 } as unknown as FelgenProps['cards'][number]

let mounted: VueWrapper[] = []

function mountListing(build: BuildProp, missing: string[]): VueWrapper {
    current.props = { vehicle: touring(build), notifyByMail: true, contact: CONTACT }
    const wrapper = mount(Felgen, {
        props: { hasVehicle: true, cards: [CARD], total: 1, facets: {}, filters: {}, page: 1, demo: false, missing },
        global: { stubs: { FilterBar: true, ProductTile: true } },
        attachTo: document.body,
    })
    mounted.push(wrapper)

    return wrapper
}

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    post.mockReset()
})

describe('G-01 · /felgen says what the grid rests on, after the question is answered too', () => {
    it('shows the body style read from the name and the drive the owner gave, each with a way to change it', () => {
        // Nothing is missing any more: every answer on the page rests on „Kombi“ (from the name) and „Hinterachse“ (the owner's).
        const wrapper = mountListing({ bodyForm: 'Kombi', bodySource: 'name', bodyWord: 'Touring', driveAxle: 'Hinterachse', driveSource: 'customer', driveWord: null }, [])
        const text = wrapper.text()
        const changers = wrapper.findAll('button').filter((b) => /ändern/i.test(`${b.attributes('aria-label') ?? ''} ${b.text()}`))

        expect(text).toContain('Kombi')
        expect(text).toContain('Heckantrieb')
        expect(changers.length).toBeGreaterThanOrEqual(2)
    })

    it('keeps the keyboard in the answer when the last question on the page is answered', async () => {
        const asked: BuildProp = { bodyForm: 'Kombi', bodySource: 'name', bodyWord: 'Touring', driveAxle: null, driveSource: null, driveWord: null }
        const wrapper = mountListing(asked, ['driveAxle'])
        const option = wrapper.findAll('#bf-driveAxle .bf__option').find((o) => o.text().includes('Heckantrieb'))

        expect(option).toBeDefined()
        ;(option!.element as HTMLButtonElement).focus()
        await option!.trigger('click')

        // The server's answer: the drive is given, nothing is missing — Inertia swaps the props, then calls onSuccess.
        current.props = { vehicle: touring({ ...asked, driveAxle: 'Hinterachse', driveSource: 'customer' }), notifyByMail: true, contact: CONTACT }
        await wrapper.setProps({ missing: [] })
        const options = post.mock.calls.at(-1)?.[2] as VisitOptions | undefined
        options?.onSuccess?.({})
        options?.onFinish?.({})
        await nextTick()
        await nextTick()

        expect(document.activeElement).not.toBe(document.body)
    })
})
