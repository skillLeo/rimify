import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { AdminRollenPageProps, RollenRole } from '../../../types/admin/rollen'

vi.mock('@inertiajs/vue3', () => ({
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
    router: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
    usePage: () => ({ props: { errors: {} } }),
}))

vi.mock('../../../Layouts/AdminLayout.vue', () => ({ default: {} }))

vi.mock('../../../composables/admin/useDirtyForm', async () => {
    const { reactive } = await import('vue')

    return {
        useDirtyForm: (initial: Record<string, unknown>) => ({
            form: Object.assign(reactive({ ...structuredClone(initial), errors: {} }), { defaults: vi.fn(), reset: vi.fn(), clearErrors: vi.fn() }),
            save: vi.fn(),
            dirty: { value: false },
        }),
        stampHeaders: (stamp: string | null | undefined): Record<string, string> => (stamp ? { 'X-Rimify-Stand': stamp } : {}),
    }
})

const { default: Rollen } = await import('./Index.vue')

const role = (over: Partial<RollenRole>): RollenRole => ({
    id: 4, name: 'lager', label: 'Lager', description: null, isSystem: false, isSuperAdmin: false, users: 0, rights: [], raiseBlocked: false, ...over,
})

function page(selected: RollenRole, can: AdminRollenPageProps['can'] = { create: true, update: true, delete: true }): ReturnType<typeof mount> {
    const props: AdminRollenPageProps = {
        stamp: 's', roles: [selected], accounts: 3, modules: [], actions: [], selected: selected.id, navigation: [], grantable: null, can,
    }

    return mount(Rollen, {
        props,
        global: { stubs: { AdminPage: { template: '<div><slot /></div>' }, AdminSaveBar: true, AdminConfirm: true, Dialog: true, Icon: true, RightBox: true, RoleDiffList: true } },
    })
}

/* A rule of the admin audit, said where the person looks for „Löschen“: a role somebody holds is not deleted. */
describe('Rollen & Rechte', () => {
    it('says why a role somebody holds offers no „Löschen“, and what to do first', () => {
        expect(page(role({ users: 3 })).find('.rol__held').text()).toBe('Löschen lässt sich eine Rolle erst, wenn kein Konto sie mehr hat. Gib den 3 Konten unter Benutzer zuerst eine andere Rolle.')
        expect(page(role({ users: 1 })).find('.rol__held').text()).toContain('Gib dem Konto unter Benutzer zuerst eine andere Rolle.')
        expect(page(role({ users: 0 })).find('.rol__held').exists()).toBe(false)
        // A standard role is never deleted at all: no sentence about a way that is not open.
        expect(page(role({ users: 3, isSystem: true })).find('.rol__held').exists()).toBe(false)
    })

    it('says why a standard role offers neither „Umbenennen“ nor „Löschen“, and what stays open (the admin audit’s F-40)', () => {
        expect(page(role({ isSystem: true })).find('.rol__standard').text()).toBe('Diese Standardrolle lässt sich weder umbenennen noch löschen. Ihre Rechte und ihre Beschreibung kannst du ändern.')
        // Who may only look is not told what they could change.
        expect(page(role({ isSystem: true }), { create: false, update: false, delete: false }).find('.rol__standard').text()).toBe('Diese Standardrolle lässt sich weder umbenennen noch löschen.')
        expect(page(role({ isSystem: false })).find('.rol__standard').exists()).toBe(false)
        // Super-Admin has its own sentence: its rights never change.
        expect(page(role({ isSystem: true, isSuperAdmin: true })).find('.rol__standard').exists()).toBe(false)
    })
})
