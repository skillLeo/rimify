import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue')

    return {
        useForm: (initial: Record<string, unknown>) =>
            reactive({ ...initial, errors: {}, processing: false, post: vi.fn(), clearErrors: vi.fn(), reset: vi.fn() }),
    }
})

vi.mock('../../../Layouts/AdminLayout.vue', () => ({ default: {} }))

const { default: Bestaetigen } = await import('./Index.vue')

/*
 * „Passwort bestätigen“ says why it asks, as the server worked it out from where the person is going (the admin
 * audit's F-12): before a refund it does not claim the screen holds the shop's keys.
 */
describe('Admin › Passwort bestätigen', () => {
    it('says the reason it was given, then how long the password holds', () => {
        const wrapper = mount(Bestaetigen, {
            props: { minutes: 15, weiter: '/admin/bestellungen/7', reason: 'Eine Erstattung lässt sich nicht zurücknehmen.' },
            global: { stubs: { AdminPage: { props: ['title', 'context'], template: '<div><p data-context>{{ context }}</p><slot /></div>' } } },
        })

        expect(wrapper.find('[data-context]').text()).toBe('Eine Erstattung lässt sich nicht zurücknehmen. Die Bestätigung gilt danach 15 Minuten.')
        expect(wrapper.text()).not.toContain('Zugänge des Shops')
    })
})
