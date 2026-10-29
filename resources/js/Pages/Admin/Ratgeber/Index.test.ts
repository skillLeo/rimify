import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, reactive } from 'vue'
import type { AdminRatgeberProps, RatgeberArticle } from '../../../types/admin/seiten'

/*
 * Inhalte › Ratgeber (his admin item 12, D-351): the articles on a page of their own — searched, sorted by a column
 * heading, published, withdrawn and deleted from the list, each write against the version the list showed.
 */

const get = vi.fn()
const post = vi.fn()
const destroy = vi.fn()
const inertiaProps = reactive<{ errors: Record<string, string> }>({ errors: {} })

/* A visit that is recorded and then finishes, as a real one does: the page's busy state comes back. */
type Options = { onFinish?: () => void }
const finish = (record: (...args: unknown[]) => unknown, ...args: unknown[]): void => {
    record(...args)
    ;(args.at(-1) as Options | undefined)?.onFinish?.()
}

vi.mock('@inertiajs/vue3', () => ({
    router: {
        get: (...args: unknown[]) => finish(get, ...args),
        post: (...args: unknown[]) => finish(post, ...args),
        delete: (...args: unknown[]) => finish(destroy, ...args),
    },
    usePage: () => ({ props: inertiaProps }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
}))

const Nothing = defineComponent({ setup: () => () => null })
const Pass = defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) })

/* The row's menu, open: every item a button that fires its select, an as-child item its own element. */
vi.mock('reka-ui', () => ({
    DropdownMenuRoot: Pass,
    DropdownMenuPortal: Pass,
    DropdownMenuContent: Pass,
    DropdownMenuTrigger: defineComponent({ setup: (_, { slots, attrs }) => () => h('button', { ...attrs, type: 'button' }, slots.default?.()) }),
    DropdownMenuSeparator: defineComponent({ setup: () => () => h('hr') }),
    DropdownMenuItem: defineComponent({
        props: { asChild: Boolean },
        emits: ['select'],
        setup: (props, { slots, emit, attrs }) => () =>
            props.asChild ? slots.default?.() : h('button', { ...attrs, type: 'button', 'data-item': '', onClick: () => emit('select', new Event('select')) }, slots.default?.()),
    }),
}))

vi.mock('../../../Layouts/AdminLayout.vue', () => ({ default: Pass }))
vi.mock('../../../Components/Admin/AdminPage.vue', () => ({
    default: defineComponent({
        props: { title: { type: String, default: '' }, context: { type: String, default: '' } },
        setup: (props, { slots }) => () => h('main', [h('h1', props.title), h('p', { class: 'context' }, props.context), slots.primary?.(), slots.default?.()]),
    }),
}))
vi.mock('../../../Components/Admin/AdminIcon.vue', () => ({ default: Nothing }))
vi.mock('../../../Components/Ui/Dialog.vue', () => ({ default: Nothing }))
vi.mock('../../../Components/Admin/AdminConfirm.vue', () => ({
    default: defineComponent({
        props: { open: Boolean, title: { type: String, default: '' }, body: { type: String, default: '' }, confirmLabel: { type: String, default: '' }, busy: Boolean },
        emits: ['confirm', 'update:open'],
        setup: (props, { emit }) => () =>
            props.open
                ? h('div', { class: 'confirm' }, [h('h2', { class: 'confirm__title' }, props.title), h('p', { class: 'confirm__body' }, props.body), h('button', { class: 'confirm__yes', onClick: () => emit('confirm') }, props.confirmLabel)])
                : null,
    }),
}))

const { default: Ratgeber } = await import('./Index.vue')

function article(id: number, overrides: Partial<RatgeberArticle> = {}): RatgeberArticle {
    return { id, version: 2, title: `Artikel ${id}`, href: `/ratgeber/artikel-${id}`, published: true, publishedAt: '12.10.2026', changedAt: '20.10.2026', draft: null, ...overrides }
}

function props(overrides: Partial<AdminRatgeberProps> = {}): AdminRatgeberProps {
    return {
        articles: [article(1), article(3, { published: false, publishedAt: null, draft: { at: '28.10.2026, 09:12', by: 'Lea Brandt' } })],
        total: 2,
        filters: { q: '', sort: 'geaendert', richtung: 'ab' },
        can: { create: true, publish: true, delete: true },
        ...overrides,
    }
}

let mounted: VueWrapper[] = []

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    get.mockClear()
    post.mockClear()
    destroy.mockClear()
    inertiaProps.errors = {}
})

function page(p: AdminRatgeberProps = props()): VueWrapper {
    const wrapper = mount(Ratgeber, { props: p })
    mounted.push(wrapper)

    return wrapper
}

function row(wrapper: VueWrapper, title: string) {
    const found = wrapper.findAll('tbody tr').find((tr) => tr.text().includes(title))

    if (!found) {
        throw new Error(`no row ${title}`)
    }

    return found
}

function item(wrapper: VueWrapper, title: string, label: string) {
    return row(wrapper, title).findAll('[data-item]').find((b) => b.text().includes(label))
}

describe('Inhalte › Ratgeber', () => {
    it('lists each article with its editor, its address, its draft and whether it is in the shop', () => {
        const wrapper = page()

        expect(wrapper.find('h1').text()).toBe('Ratgeber')
        expect(wrapper.find('.context').text()).toBe('2 Artikel · 1 im Shop')
        expect(row(wrapper, 'Artikel 1').find('a').attributes('href')).toBe('/admin/ratgeber/1')
        expect(row(wrapper, 'Artikel 1').text()).toContain('/ratgeber/artikel-1')
        expect(row(wrapper, 'Artikel 1').text()).toContain('seit 12.10.2026')
        expect(row(wrapper, 'Artikel 3').text()).toContain('Nicht veröffentlicht')
        expect(row(wrapper, 'Artikel 3').text()).toContain('Entwurf vom 28.10.2026, 09:12 · Lea Brandt')
    })

    it('searches by the words typed, keeping the order chosen; the plain order is no parameter', async () => {
        const wrapper = page(props({ filters: { q: '', sort: 'titel', richtung: 'auf' } }))

        await wrapper.find('#rg-q').setValue('  ET  ')
        await wrapper.find('form[role="search"]').trigger('submit')

        expect(get).toHaveBeenCalledWith('/admin/ratgeber', { q: 'ET', sort: 'titel', richtung: 'auf' }, expect.anything())

        get.mockClear()
        const plain = page()
        await plain.find('#rg-q').setValue('felge')
        await plain.find('form[role="search"]').trigger('submit')
        expect(get).toHaveBeenCalledWith('/admin/ratgeber', { q: 'felge' }, expect.anything())
    })

    it('sorts by a column heading, and the other way when it is pressed again', async () => {
        const wrapper = page()
        const heading = (label: string) => wrapper.findAll('th button').find((b) => b.text().includes(label))

        await heading('Artikel')?.trigger('click')
        expect(get).toHaveBeenLastCalledWith('/admin/ratgeber', { sort: 'titel', richtung: 'auf' }, expect.anything())

        const sorted = page(props({ filters: { q: '', sort: 'titel', richtung: 'auf' } }))
        await sorted.findAll('th button').find((b) => b.text().includes('Artikel'))?.trigger('click')
        expect(get).toHaveBeenLastCalledWith('/admin/ratgeber', { sort: 'titel', richtung: 'ab' }, expect.anything())

        // Back to the list's own order: the address carries nothing.
        const changed = page(props({ filters: { q: '', sort: 'titel', richtung: 'ab' } }))
        await changed.findAll('th button').find((b) => b.text().includes('Geändert'))?.trigger('click')
        expect(get).toHaveBeenLastCalledWith('/admin/ratgeber', {}, expect.anything())
    })

    it('publishes an article that is not in the shop, against the version the list showed', async () => {
        const wrapper = page()

        expect(item(wrapper, 'Artikel 1', 'Veröffentlichen')).toBeUndefined()
        await item(wrapper, 'Artikel 3', 'Veröffentlichen')?.trigger('click')

        expect(post).toHaveBeenCalledWith('/admin/ratgeber/3/veroeffentlichen', { baseVersion: 2 }, expect.anything())
    })

    it('asks before it withdraws or deletes, and says what stays', async () => {
        const wrapper = page()

        await item(wrapper, 'Artikel 1', 'Zurückziehen')?.trigger('click')
        expect(wrapper.find('.confirm__title').text()).toBe('Artikel 1 zurückziehen?')
        await wrapper.find('.confirm__yes').trigger('click')
        expect(post).toHaveBeenCalledWith('/admin/seiten/1/zurueckziehen', { baseVersion: 2 }, expect.anything())

        await item(wrapper, 'Artikel 1', 'Löschen')?.trigger('click')
        expect(wrapper.find('.confirm__title').text()).toBe('Artikel 1 löschen?')
        expect(wrapper.find('.confirm__body').text()).toBe(
            'Der Artikel verschwindet aus dem Shop und aus dieser Liste. Seine veröffentlichten Fassungen bleiben gespeichert, seine Adresse bekommt kein anderer Artikel.'
        )
        await wrapper.find('.confirm__yes').trigger('click')
        expect(destroy).toHaveBeenCalledWith('/admin/ratgeber/1', expect.objectContaining({ data: { baseVersion: 2 } }))
    })

    it('offers only what the role may: no delete without the right, no live article deleted without the right to publish', () => {
        const none = page(props({ can: { create: true, publish: true, delete: false } }))
        expect(item(none, 'Artikel 1', 'Löschen')).toBeUndefined()
        expect(item(none, 'Artikel 3', 'Löschen')).toBeUndefined()

        const noPublish = page(props({ can: { create: true, publish: false, delete: true } }))
        expect(item(noPublish, 'Artikel 1', 'Löschen')).toBeUndefined()
        expect(item(noPublish, 'Artikel 3', 'Löschen')).toBeDefined()
        expect(item(noPublish, 'Artikel 3', 'Veröffentlichen')).toBeUndefined()
        expect(noPublish.text()).toContain('Artikel anlegen')

        expect(page(props({ can: { create: false, publish: false, delete: false } })).text()).not.toContain('Artikel anlegen')
    })

    it('says a refusal of the server above the list, and a search that finds nothing as such', () => {
        inertiaProps.errors = { article: '„Noch leer“ ist noch nicht vollständig.' }
        expect(page().find('[role="alert"]').text()).toBe('„Noch leer“ ist noch nicht vollständig.')

        const none = page(props({ articles: [], filters: { q: 'zzz', sort: 'geaendert', richtung: 'ab' } }))
        expect(none.text()).toContain('Suche zurücksetzen')
    })
})
