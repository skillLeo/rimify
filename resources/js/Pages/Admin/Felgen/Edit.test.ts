import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { AdminFelgeProps } from '../../../types/admin/felgen'

vi.mock('@inertiajs/vue3', () => ({
    router: { post: vi.fn(), visit: vi.fn() },
    usePage: () => ({ props: { errors: {} } }),
}))

vi.mock('../../../Layouts/AdminLayout.vue', () => ({ default: {} }))

vi.mock('../../../composables/admin/useDirtyForm', async () => {
    const { reactive } = await import('vue')

    return {
        useDirtyForm: (initial: Record<string, unknown>) => ({
            form: Object.assign(reactive({ ...structuredClone(initial), errors: {} }), { transform: vi.fn(), defaults: vi.fn(), reset: vi.fn(), clearErrors: vi.fn() }),
            save: vi.fn(),
            dirty: { value: false },
        }),
    }
})

const { default: Edit } = await import('./Edit.vue')

function props(): AdminFelgeProps {
    return {
        stamp: null,
        model: null,
        finishes: [],
        configs: [],
        documents: {},
        check: null,
        brands: [{ value: 3, label: 'Prüfrad' }],
        options: { spokes: [5, 6, 7, 10, 20], boltHoles: [4, 5], artFinishes: [{ value: 'graphite', label: 'Graphit' }], maxPhotos: 8 },
        can: { create: true, edit: true, publish: true, archive: true, import: true },
    }
}

/*
 * Suchmaschinen (the admin audit's F-03): the counters read „0 / 60“ and „0 / 155“ and turn red past them while the
 * fields take 70 and 170 — the page now says the lower figure is what search engines usually show, not a limit.
 */
describe('Felgen › Felge › Suchmaschinen', () => {
    it('says what the counters count and how much is saved', () => {
        const wrapper = mount(Edit, {
            props: props(),
            global: { stubs: { AdminPage: { template: '<div><slot /></div>' }, AdminSaveBar: true, AdminConfirm: true, FinishPhotos: true, MatrixPanel: true, SizesTable: true, Icon: true } },
        })

        expect(wrapper.find('#fe-seo-t-help').text()).toContain('Suchmaschinen zeigen meist etwa 60 Zeichen; speichern kannst du bis zu 70.')
        expect(wrapper.find('#fe-seo-d-help').text()).toBe('Suchmaschinen zeigen meist etwa 155 Zeichen; speichern kannst du bis zu 170.')
        expect(wrapper.find('#fe-seo-d').attributes('aria-describedby')).toBe('fe-seo-d-help fe-seo-d-err')
    })
})
