import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, reactive, ref } from 'vue'
import type { AdminSeiteProps, PageContent } from '../../../types/admin/seiten'

/*
 * A legal page's placeholder switch (D-319): the text's flag, and on the Widerrufsbelehrung the Muster-
 * Widerrufsformular's. Each switch asks first; the text's waits — and says why — while the published words are still
 * the seeder's marker; a refusal stands beside the switches; whatever is typed and not yet saved stays in the fields.
 */

const post = vi.fn()
const inertiaProps = reactive<{ errors: Record<string, string> }>({ errors: {} })

vi.mock('@inertiajs/vue3', () => ({
    router: { post: (...args: unknown[]) => post(...args), delete: vi.fn(), on: vi.fn(() => () => undefined) },
    usePage: () => ({ props: inertiaProps }),
}))

const Nothing = defineComponent({ setup: () => () => null })

vi.mock('../../../Layouts/AdminLayout.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => slots.default?.() }) }))
vi.mock('../../../Components/Admin/AdminPage.vue', () => ({
    default: defineComponent({ setup: (_, { slots }) => () => h('main', [slots.primary?.(), slots.default?.()]) }),
}))
vi.mock('../../../Components/Admin/AdminConfirm.vue', () => ({
    default: defineComponent({
        props: { open: Boolean, title: { type: String, default: '' }, body: { type: String, default: '' }, confirmLabel: { type: String, default: '' }, busy: Boolean },
        emits: ['confirm', 'update:open'],
        setup: (props, { emit }) => () =>
            props.open
                ? h('div', { class: 'confirm' }, [
                      h('h2', { class: 'confirm__title' }, props.title),
                      h('p', { class: 'confirm__body' }, props.body),
                      h('button', { class: 'confirm__yes', onClick: () => emit('confirm') }, props.confirmLabel),
                  ])
                : null,
    }),
}))
vi.mock('../../../Components/Admin/AdminSaveBar.vue', () => ({ default: Nothing }))
vi.mock('../../../Components/Admin/AdminIcon.vue', () => ({ default: Nothing }))
vi.mock('../../../Components/Ui/Dialog.vue', () => ({ default: Nothing }))
vi.mock('../../../Components/Chrome/toast', () => ({ toast: { show: vi.fn() } }))
vi.mock('./PreviewFrame.vue', () => ({ default: Nothing }))
vi.mock('./FieldInput.vue', () => ({ default: Nothing }))
vi.mock('./GridField.vue', () => ({ default: Nothing }))
vi.mock('./ImageField.vue', () => ({ default: Nothing }))
vi.mock('./DiffList.vue', () => ({ default: Nothing }))

vi.mock('../../../composables/admin/useDirtyForm', () => ({
    useDirtyForm: (initial: PageContent) => {
        const form = reactive({ ...structuredClone(initial), errors: {}, transform: vi.fn(), defaults: vi.fn(), reset: vi.fn(), clearErrors: vi.fn() })

        return {
            form: Object.assign(form, { data: () => ({ title: form.title, metaDescription: form.metaDescription, blocks: form.blocks }) }),
            dirty: computed(() => false),
            saving: computed(() => false),
            failed: ref(false),
            save: vi.fn(),
            discard: vi.fn(),
            leaving: ref(false),
            stay: vi.fn(),
            leave: vi.fn(),
        }
    },
}))

const { default: Bearbeiten } = await import('./Bearbeiten.vue')

const MARKER = '[Rechtstext folgt von der Kanzlei — Abschnitt: Widerrufsbelehrung]'

function props(page: Partial<AdminSeiteProps['page']> = {}): AdminSeiteProps {
    const content: PageContent = { title: 'Widerrufsbelehrung', metaDescription: '', blocks: [{ type: 'legal_body', data: { heading: 'Widerrufsbelehrung', text: MARKER } }] }

    return {
        page: {
            id: 7,
            version: 3,
            slug: 'widerrufsbelehrung',
            kind: 'legal',
            group: 'Rechtliches',
            title: 'Widerrufsbelehrung',
            href: '/rechtliches/widerrufsbelehrung',
            published: true,
            publishedAt: '01.10.2026, 10:00 Uhr',
            lawyerReviewed: false,
            placeholder: true,
            markerLeft: true,
            formPlaceholder: true,
            ...page,
        },
        schema: {
            page: [],
            blocks: [
                {
                    type: 'legal_body',
                    label: 'Abschnitt',
                    repeat: true,
                    min: 1,
                    max: 40,
                    fields: [
                        { key: 'heading', label: 'Überschrift', kind: 'text', required: false, max: 120 },
                        { key: 'text', label: 'Text', kind: 'textarea', required: true, max: 20000 },
                    ],
                },
            ],
        },
        content,
        live: content,
        draft: null,
        revisions: [],
        preview: { desktop: '/vorschau/7?geraet=desktop', handy: '/vorschau/7?geraet=handy', days: 7 },
        can: { edit: true, publish: true, withdraw: false },
    }
}

afterEach(() => {
    post.mockReset()
    delete inertiaProps.errors.placeholder
})

describe('Seiten › Bearbeiten: the placeholder switch', () => {
    it('lets the text’s switch wait over the seeded marker, and says why — the form’s switch asks and sends', async () => {
        const wrapper = mount(Bearbeiten, { props: props() })
        const text = wrapper.get('#pg-switch-text')

        expect(text.text()).toBe('Platzhalter ausschalten')
        expect(text.attributes('aria-disabled')).toBe('true')
        expect(text.attributes('aria-describedby')).toBe('pg-switch-waits')
        expect(wrapper.get('#pg-switch-waits').text()).toBe(
            'Im veröffentlichten Text steht noch „[Rechtstext folgt von der Kanzlei …]“. Ersetz das in jedem Abschnitt durch den Text der Kanzlei, veröffentliche die Seite und schalte den Platzhalter danach aus.'
        )

        await text.trigger('click')
        expect(wrapper.find('.confirm').exists()).toBe(false)

        await wrapper.get('#pg-switch-form').trigger('click')
        expect(wrapper.get('.confirm__title').text()).toBe('Platzhalter beim Muster-Widerrufsformular ausschalten?')

        await wrapper.get('.confirm__yes').trigger('click')
        expect(post).toHaveBeenCalledWith(
            '/admin/seiten/7/platzhalter',
            { part: 'formular', placeholder: false },
            expect.objectContaining({ preserveState: true, preserveScroll: true })
        )
    })

    it('switches the text off over the Kanzlei’s words, after asking', async () => {
        const wrapper = mount(Bearbeiten, { props: props({ markerLeft: false, formPlaceholder: false }) })

        expect(wrapper.find('#pg-switch-waits').exists()).toBe(false)
        expect(wrapper.get('#pg-switch-form').text()).toBe('Platzhalter beim Formular einschalten')

        await wrapper.get('#pg-switch-text').trigger('click')
        expect(wrapper.get('.confirm__body').text()).toBe(
            'Besucher lesen dann den veröffentlichten Text dieser Seite. Schalte den Platzhalter nur aus, wenn dort der Text der Kanzlei steht.'
        )

        await wrapper.get('.confirm__yes').trigger('click')
        expect(post).toHaveBeenCalledWith('/admin/seiten/7/platzhalter', { part: 'text', placeholder: false }, expect.objectContaining({ preserveState: true }))
    })

    it('puts the server’s refusal beside the switches', () => {
        inertiaProps.errors.placeholder = 'Im veröffentlichten Text steht noch der Platzhalter.'
        const wrapper = mount(Bearbeiten, { props: props() })

        expect(wrapper.get('.pg__switches .adm-alert').text()).toBe('Im veröffentlichten Text steht noch der Platzhalter.')
    })

    it('has no switch on a page that is not a legal text, and none for the form outside the Widerrufsbelehrung', () => {
        expect(mount(Bearbeiten, { props: props({ kind: 'guide', slug: 'hsn-und-tsn-finden', placeholder: false, markerLeft: false, formPlaceholder: null }) }).find('.pg__switches').exists()).toBe(false)
        expect(mount(Bearbeiten, { props: props({ slug: 'agb', formPlaceholder: null }) }).find('#pg-switch-form').exists()).toBe(false)
    })

    it('shows the switch to who may read the page but not publish it as a state, without a button', () => {
        const readOnly = { ...props(), can: { edit: false, publish: false, withdraw: false } }
        const wrapper = mount(Bearbeiten, { props: readOnly })

        expect(wrapper.find('.pg__switches').exists()).toBe(true)
        expect(wrapper.find('#pg-switch-text').exists()).toBe(false)
    })
})
