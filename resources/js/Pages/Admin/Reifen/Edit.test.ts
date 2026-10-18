import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { AdminReifenEditProps, TyreRecordProp } from '../../../types/admin/reifen'

vi.mock('@inertiajs/vue3', () => ({ router: { delete: vi.fn() } }))
vi.mock('../../../Layouts/AdminLayout.vue', () => ({ default: {} }))
vi.mock('../../../composables/admin/useDirtyForm', async () => {
    const { reactive, computed, ref } = await import('vue')

    return {
        useDirtyForm: (initial: Record<string, unknown>) => {
            const form = reactive({
                ...initial,
                errors: {},
                processing: false,
                transform: () => form,
                defaults: () => form,
                reset: () => form,
                clearErrors: () => form,
            })

            return { form, dirty: computed(() => false), saving: computed(() => false), failed: ref(false), save: vi.fn(), discard: vi.fn(), leaving: ref(false), stay: vi.fn(), leave: vi.fn() }
        },
    }
})

const { default: Edit } = await import('./Edit.vue')

const OPTIONS: AdminReifenEditProps['options'] = {
    seasons: [
        { value: 'sommer', label: 'Sommerreifen' },
        { value: 'winter', label: 'Winterreifen' },
        { value: 'ganzjahres', label: 'Ganzjahresreifen' },
    ],
    speedSymbols: ['T', 'H', 'V', 'W', 'Y', '(Y)'],
    classes: ['A', 'B', 'C', 'D', 'E'],
    noiseClasses: ['A', 'B', 'C'],
}

function saved(over: Partial<TyreRecordProp> = {}): TyreRecordProp {
    return {
        id: 7, brandId: 3, name: 'Grip 7', season: 'sommer', width: '225', aspect: '45', diameter: '18', loadIndex: '95', speedSymbol: 'Y',
        fuel: 'B', wet: 'A', noiseDb: '71', noiseClass: 'B', snow: false, ice: false, eprelId: '381090', price: '129,00', available: true,
        demo: false, fullTitle: 'Prüfreifen Grip 7 225/45 R18 95Y', offered: true, missingLabel: [], updated: '19.10.2026, 01:10', ...over,
    }
}

function page(props: Partial<AdminReifenEditProps> = {}) {
    return mount(Edit, {
        props: {
            tyre: null,
            template: null,
            brands: [{ value: 3, label: 'Prüfreifen' }],
            options: OPTIONS,
            can: { create: true, edit: true, delete: true },
            ...props,
        },
        global: {
            stubs: {
                AdminPage: { props: ['title', 'context', 'more', 'readOnly'], template: '<div><h1>{{ title }}</h1><p data-context>{{ context }}</p><slot /></div>' },
                AdminSaveBar: { template: '<div data-savebar />' },
                AdminConfirm: true,
            },
        },
    })
}

/*
 * His admin item 10 (D-302): one tyre size with its EU label — the label as the shop will print it, the two pictograms
 * answered „Ja“ or „Nein“, and above the form whether the shop offers the tyre now (D-301, D-303).
 */
describe('Katalog › Reifen › one tyre', () => {
    it('shows the label as the shop prints it once its four figures are typed, the snowflake only for „Ja“ @admin-210', async () => {
        const wrapper = page()

        expect(wrapper.find('.tyre-label').exists()).toBe(false)
        expect(wrapper.find('.rf-preview__empty').text()).toContain('sobald Kraftstoffeffizienz, Nasshaftung')

        await wrapper.find('#rf-fuel').setValue('B')
        await wrapper.find('#rf-wet').setValue('A')
        await wrapper.find('#rf-noise').setValue('71')
        await wrapper.find('#rf-noise-class').setValue('B')

        const label = wrapper.find('.tyre-label')
        expect(label.exists()).toBe(true)
        expect(label.text()).toContain('Kraftstoffeffizienz')
        expect(label.text()).not.toContain('Schneegriffigkeit')

        await wrapper.findAll('input[name="rf-snow"]')[0]?.setValue(true)

        expect(wrapper.find('.tyre-label').text()).toContain('Schneegriffigkeit')
        expect(wrapper.find('.tyre-label').text()).not.toContain('Eisgriffigkeit')

        // The EPREL link follows the number as it changes — it was once read only when the label first appeared.
        await wrapper.find('#rf-eprel').setValue('381090')
        expect(wrapper.find('a[href="https://eprel.ec.europa.eu/qr/381090"]').exists()).toBe(true)
        await wrapper.find('#rf-eprel').setValue('381091')
        expect(wrapper.find('a[href="https://eprel.ec.europa.eu/qr/381091"]').exists()).toBe(true)
    })

    it('writes the size as the tyre’s wall prints it once every part is there @admin-210', async () => {
        const wrapper = page()

        await wrapper.find('#rf-width').setValue('225')
        await wrapper.find('#rf-aspect').setValue('45')
        await wrapper.find('#rf-diameter').setValue('18')
        await wrapper.find('#rf-load').setValue('95')
        expect(wrapper.find('.rf-size-preview').exists()).toBe(false)

        await wrapper.find('#rf-speed').setValue('Y')
        expect(wrapper.find('.rf-size-preview').text()).toBe('225/45 R18 95Y')
    })

    it('says above the form why a saved tyre is not offered: what its label still lacks @admin-210', () => {
        const wrapper = page({ tyre: saved({ offered: false, eprelId: '', ice: null, missingLabel: ['Eisgriffigkeit', 'EPREL-Nummer'] }) })

        expect(wrapper.find('.rf-state__verdict').text()).toBe('Wird nicht angeboten')
        expect(wrapper.find('.rf-state').text()).toContain('Noch nicht eingetragen: Eisgriffigkeit, EPREL-Nummer.')
        // Unanswered is not „Nein“: neither radio is chosen.
        expect(wrapper.findAll<HTMLInputElement>('input[name="rf-ice"]').map((r) => r.element.checked)).toEqual([false, false])
    })

    it('says a saved tyre is offered, and where @admin-210', () => {
        const wrapper = page({ tyre: saved() })

        expect(wrapper.find('h1').text()).toBe('Prüfreifen Grip 7 225/45 R18 95Y')
        expect(wrapper.find('.rf-state__verdict').text()).toBe('Wird angeboten')
        expect(wrapper.find('.rf-state').text()).toContain('auf Felgen, deren Gutachten diese Reifengröße für das Fahrzeug des Kunden freigibt')
    })

    it('shows a demonstration tyre without a way to change it @admin-210', () => {
        const wrapper = page({ tyre: saved({ demo: true, offered: true, missingLabel: [] }) })

        expect(wrapper.find('[data-savebar]').exists()).toBe(false)
        expect(wrapper.find('.rf-state__verdict').text()).toBe('Aus den Demodaten')
        expect(wrapper.find<HTMLInputElement>('#rf-name').element.readOnly).toBe(true)
    })

    it('starts „Weitere Größe“ from the brand, profile and season it was given @admin-210', () => {
        const wrapper = page({ template: { brandId: 3, name: 'Grip 7', season: 'winter' } })

        expect(wrapper.find<HTMLInputElement>('#rf-name').element.value).toBe('Grip 7')
        expect(wrapper.find<HTMLSelectElement>('#rf-season').element.value).toBe('winter')
        expect(wrapper.find<HTMLInputElement>('#rf-width').element.value).toBe('')
        expect(wrapper.find('[data-context]').text()).toBe('Weitere Größe von Prüfreifen Grip 7')
    })
})
