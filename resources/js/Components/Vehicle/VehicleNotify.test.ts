import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const current: { props: Record<string, unknown> } = { props: {} }

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
}))

const { default: VehicleNotify } = await import('./VehicleNotify.vue')

const fetchMock = vi.fn()
let mounted: VueWrapper[] = []

function respond(status: number, body: unknown = {}): void {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))
}

async function submit(wrapper: VueWrapper, email = 'kunde@example.de'): Promise<void> {
    await wrapper.find('input[type="email"]').setValue(email)
    await wrapper.find('form').trigger('submit')
    await flushPromises()
}

beforeEach(() => {
    // Fixture only — the shop's address lives in config/rimify.php; a reserved example domain.
    current.props = { notifyByMail: true, contact: { email: 'service@example.com', phone: null, phoneIntl: null, whatsapp: null, hours: 'Mo–Fr 9:00–17:00 Uhr' } }
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    vi.unstubAllGlobals()
})

function mountNotify(): VueWrapper {
    const wrapper = mount(VehicleNotify, { props: { vehicleId: 7, vehicleLabel: 'BMW 3er' } })
    mounted.push(wrapper)

    return wrapper
}

describe('VehicleNotify — the listing\'s empty state uses the real F2 endpoint', () => {
    it('offers the shop\'s e-mail address instead of a form while outgoing mail is off', () => {
        current.props = { ...current.props, notifyByMail: false }
        const wrapper = mountNotify()

        expect(wrapper.find('form').exists()).toBe(false)
        expect(wrapper.text()).not.toContain('Bestätigungsmail')
        expect(wrapper.find('a[href="mailto:service@example.com"]').exists()).toBe(true)
        expect(wrapper.text()).toContain('BMW 3er')
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('posts the address and the vehicle to /api/v1/fitment/notify and thanks on 202', async () => {
        respond(202)
        const wrapper = mountNotify()

        expect(wrapper.text()).toContain('sobald ein Gutachten deinen BMW 3er nennt')
        await submit(wrapper, ' kunde@example.de ')

        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
        expect(url).toBe('/api/v1/fitment/notify')
        expect(init.method).toBe('POST')
        expect(JSON.parse(init.body as string)).toEqual({ email: 'kunde@example.de', fahrzeug: 7 })
        expect(wrapper.find('[role="status"]').text()).toContain('Danke')
        expect(wrapper.find('form').exists()).toBe(false)
    })

    it('names the field the server rejected, in its own German words', async () => {
        respond(422, { errors: { email: ['Das sieht nicht nach einer E-Mail-Adresse aus.'] } })
        const wrapper = mountNotify()

        await submit(wrapper, 'nope')

        expect(wrapper.find('.field-error').text()).toBe('Das sieht nicht nach einer E-Mail-Adresse aus.')
        expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
    })

    it('offers the e-mail address when the request fails, never a dead end', async () => {
        fetchMock.mockRejectedValueOnce(new Error('offline'))
        const wrapper = mountNotify()

        await submit(wrapper)

        expect(wrapper.find('.field-error').text()).toContain('schreib uns: service@example.com')
        expect(wrapper.find('form').exists()).toBe(true)
    })

    it('sends nothing without an address', async () => {
        const wrapper = mountNotify()

        await wrapper.find('form').trigger('submit')
        await flushPromises()

        expect(fetchMock).not.toHaveBeenCalled()
    })
})
