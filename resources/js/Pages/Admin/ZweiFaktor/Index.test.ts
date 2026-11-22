import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

const posted: { url: string; data: Record<string, unknown> }[] = []

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue')

    return {
        Head: { template: '<span />' },
        Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
        useForm: (initial: Record<string, unknown>) => {
            const form: Record<string, unknown> = reactive({ ...initial, errors: {}, processing: false, clearErrors: vi.fn(), reset: vi.fn() })
            form.post = vi.fn((url: string) => posted.push({ url, data: { ...form } }))

            return form
        },
    }
})

const { default: ZweiFaktor } = await import('./Index.vue')
const { default: Anmelden } = await import('../Anmelden/Index.vue')

const SETUP = {
    stage: 'setup' as const,
    email: 'chef@rimify.test',
    required: true,
    replacing: false,
    unreadable: false,
    qr: '<svg xmlns="http://www.w3.org/2000/svg" data-qr></svg>',
    manualKey: 'ABCD EFGH IJKL MNOP QRST UVWX YZ23 4567',
}

/*
 * Bestätigung in zwei Schritten (D-514): the setup shows the QR code and the key in letters, says why it is required,
 * and leaves the Super-Admin only the way out; the codes are shown once with a way on. The sign-in's second step takes
 * a code from the app or, switched, a recovery code.
 */
describe('Admin › Bestätigung in zwei Schritten', () => {
    it('shows the QR code, the key in groups and why it is required — and only „Abmelden“ beside it', () => {
        const wrapper = mount(ZweiFaktor, { props: SETUP })

        expect(wrapper.find('h1').text()).toBe('Bestätigung in zwei Schritten einrichten')
        expect(wrapper.text()).toContain('Für Super-Admins ist sie Pflicht.')
        expect(wrapper.find('[data-qr]').exists()).toBe(true)
        expect(wrapper.find('[data-tfa-key]').text()).toBe('ABCD EFGH IJKL MNOP QRST UVWX YZ23 4567')
        expect(wrapper.find('#tfa-code').attributes('autocomplete')).toBe('one-time-code')
        expect(wrapper.text()).toContain('Abmelden')
        expect(wrapper.text()).not.toContain('Abbrechen')
    })

    it('says a key it can no longer read is to be set up again, and lets anyone else cancel', () => {
        const wrapper = mount(ZweiFaktor, { props: { ...SETUP, required: false, unreadable: true } })

        expect(wrapper.text()).toContain('Der gespeicherte Schlüssel lässt sich nicht mehr lesen.')
        expect(wrapper.find('a[href="/admin/profil#zwei-faktor"]').text()).toBe('Abbrechen')
    })

    it('shows the eight recovery codes once, with the way on', () => {
        const codes = ['abcde-fghjk', 'mnpqr-stuvw', 'xyz23-45678', 'aaaaa-bbbbb', 'ccccc-ddddd', 'eeeee-fffff', 'ggggg-hhhhh', 'jjjjj-kkkkk']
        const wrapper = mount(ZweiFaktor, { props: { stage: 'codes', codes, next: '/admin' } })

        expect(wrapper.findAll('[data-tfa-codes] li').map((li) => li.text())).toEqual(codes)
        expect(wrapper.find('a[href="/admin"]').text()).toBe('Ich habe sie aufbewahrt')
    })

    it('sends the code of the second step to its own address, and switches to a recovery code', async () => {
        posted.length = 0
        const wrapper = mount(Anmelden, { props: { stage: 'totp' } })

        expect(wrapper.find('#lg-totp').attributes('inputmode')).toBe('numeric')
        await wrapper.find('#lg-totp').setValue('123456')
        await wrapper.find('form').trigger('submit')
        expect(posted.at(-1)?.url).toBe('/admin/anmelden/code')

        await wrapper.findAll('button').find((b) => b.text().includes('Wiederherstellungscode'))?.trigger('click')
        expect(wrapper.find('label[for="lg-totp"]').text()).toBe('Wiederherstellungscode')
        expect(wrapper.find('#lg-totp').attributes('inputmode')).toBe('text')
        expect(wrapper.find('a[href="/admin/anmelden?neu=1"]').text()).toBe('Mit einem anderen Konto anmelden')
    })
})
