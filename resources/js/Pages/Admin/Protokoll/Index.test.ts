import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, reactive } from 'vue'
import type { AdminProtokollProps, ProtokollEntry } from '../../../types/admin/protokoll'

/*
 * Protokoll (BRIEF.md §2): entries in words under day headings, a disclosure per entry for the
 * before → after and the IP, filters applied with a button, the export only where the role has it,
 * and the two empty states kept apart — an empty log is not a filter that excludes everything.
 */

const current = reactive<{ props: Record<string, unknown> }>({ props: {} })

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
    router: { get: vi.fn(), post: vi.fn(), on: vi.fn(() => () => undefined) },
}))

const { default: Page } = await import('./Index.vue')
const { router } = await import('@inertiajs/vue3')

function entry(overrides: Partial<ProtokollEntry> = {}): ProtokollEntry {
    return {
        id: 1,
        at: '26.09.2026, 14:22 Uhr',
        iso: '2026-09-26T12:22:00+00:00',
        day: '26.09.2026',
        dayLabel: 'Heute',
        time: '14:22 Uhr',
        person: 'Sabine Roth',
        area: 'Katalog',
        sentence: 'Der Preis für Montage und Auswuchten wurde geändert.',
        changes: [{ label: 'Montage und Auswuchten je Rad', before: 'nicht festgelegt', after: '19,90 €' }],
        ip: '203.0.113.9',
        ...overrides,
    }
}

function props(overrides: Partial<AdminProtokollProps> = {}): AdminProtokollProps {
    return {
        entries: [
            entry(),
            entry({
                id: 2,
                day: '25.09.2026',
                dayLabel: 'Gestern',
                time: '09:05 Uhr',
                area: 'Team',
                sentence: 'Die Rolle „Lager“ wurde gelöscht.',
                changes: [],
                ip: null,
            }),
        ],
        filters: { person: null, bereich: null, von: null, bis: null },
        options: {
            people: [{ value: '1', label: 'Sabine Roth' }],
            areas: [
                { value: 'team', label: 'Team' },
                { value: 'katalog', label: 'Katalog' },
            ],
        },
        filtered: false,
        totalAll: 2,
        pagination: { current: 1, last: 1, total: 2, prev: null, next: null },
        exportUrl: '/admin/protokoll/export',
        can: { export: true },
        ...overrides,
    }
}

let mounted: VueWrapper[] = []

function mountPage(overrides: Partial<AdminProtokollProps> = {}): VueWrapper {
    const wrapper = mount(Page, { props: props(overrides), attachTo: document.body })
    mounted.push(wrapper)

    return wrapper
}

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    current.props = {}
    vi.clearAllMocks()
})

describe('Protokoll', () => {
    it('says how many entries, and groups them under their day', () => {
        const wrapper = mountPage()

        expect(wrapper.find('.adm-page__context').text()).toBe('2 Einträge')
        expect(wrapper.findAll('.pk-day__title').map((h2) => h2.text())).toEqual(['Heute', 'Gestern'])
        expect(wrapper.text()).toContain('Der Preis für Montage und Auswuchten wurde geändert.')
        expect(wrapper.text()).toContain('Die Rolle „Lager“ wurde gelöscht.')
        expect(wrapper.find('time').attributes('datetime')).toBe('2026-09-26T12:22:00+00:00')
    })

    it('says so in the context line when a filter is in force', () => {
        const wrapper = mountPage({ filtered: true, pagination: { current: 1, last: 1, total: 1, prev: null, next: null } })

        expect(wrapper.find('.adm-page__context').text()).toBe('1 Eintrag · gefiltert')
    })

    it('opens an entry to show before → after and the IP, and says whether it is open', async () => {
        const wrapper = mountPage()
        // The whole row is the disclosure: one target, no row of blue "Details" down the edge.
        const toggle = wrapper.find('button.pk-entry__row')
        const details = wrapper.find('#pk-details-1')

        expect(toggle.attributes('aria-expanded')).toBe('false')
        expect(toggle.attributes('aria-controls')).toBe('pk-details-1')
        expect(details.isVisible()).toBe(false)

        await toggle.trigger('click')

        expect(toggle.attributes('aria-expanded')).toBe('true')
        expect(details.isVisible()).toBe(true)
        expect(details.text()).toContain('Montage und Auswuchten je Rad')
        expect(details.text()).toContain('nicht festgelegt')
        expect(details.text()).toContain('19,90 €')
        expect(details.text()).toContain('203.0.113.9')
    })

    it('offers no disclosure for an entry with nothing more to show', () => {
        const wrapper = mountPage()

        expect(wrapper.findAll('button.pk-entry__row')).toHaveLength(1)
        expect(wrapper.findAll('div.pk-entry__row')).toHaveLength(1)
        expect(wrapper.find('#pk-details-2').exists()).toBe(false)
    })

    it('offers the export as a plain download link, only to a role that may export', () => {
        const allowed = mountPage()
        const link = allowed.findAll('a').find((a) => a.text().includes('Als CSV exportieren'))

        expect(link?.attributes('href')).toBe('/admin/protokoll/export')
        expect(link?.attributes('download')).toBeDefined()

        const refused = mountPage({ exportUrl: null, can: { export: false } })

        expect(refused.text()).not.toContain('Als CSV exportieren')
    })

    it('applies the filters with the button, sending only the ones set, the dates as ISO days', async () => {
        const wrapper = mountPage()

        await wrapper.find('#pk-bereich').setValue('team')
        await wrapper.find('#pk-zeitraum').setValue('eigen')
        await wrapper.find('#pk-von').setValue('01.09.2026')

        expect(router.get).not.toHaveBeenCalled()

        await wrapper.find('form').trigger('submit')

        expect(router.get).toHaveBeenCalledWith(
            '/admin/protokoll',
            { bereich: 'team', von: '2026-09-01' },
            expect.objectContaining({ preserveState: true })
        )
    })

    it('says what is wrong with a typed date instead of sending it', async () => {
        const wrapper = mountPage()

        await wrapper.find('#pk-zeitraum').setValue('eigen')
        await wrapper.find('#pk-von').setValue('2026-09-01')
        await wrapper.find('form').trigger('submit')

        expect(router.get).not.toHaveBeenCalled()
        expect(wrapper.find('#pk-date-err').text()).toBe('Bitte schreib das Datum als TT.MM.JJJJ, zum Beispiel 01.09.2026.')
        expect(wrapper.find('#pk-von').attributes('aria-invalid')).toBe('true')
    })

    it('resets every filter at once', async () => {
        const wrapper = mountPage({ filtered: true, filters: { person: '1', bereich: 'team', von: null, bis: null } })

        expect((wrapper.find('#pk-person').element as HTMLSelectElement).value).toBe('1')

        const reset = wrapper.findAll('button').find((b) => b.text() === 'Zurücksetzen')
        await reset!.trigger('click')

        expect(router.get).toHaveBeenCalledWith('/admin/protokoll', {}, expect.anything())
    })

    it('tells an empty log from a filter that excludes everything', () => {
        const empty = mountPage({ entries: [], totalAll: 0, pagination: { current: 1, last: 1, total: 0, prev: null, next: null } })

        expect(empty.text()).toContain('Hier ist noch nichts.')
        expect(empty.find('form').exists()).toBe(false)
        expect(empty.find('.adm-page__context').text()).toBe('0 Einträge')

        const none = mountPage({
            entries: [],
            filtered: true,
            totalAll: 12,
            filters: { person: null, bereich: 'katalog', von: null, bis: null },
            pagination: { current: 1, last: 1, total: 0, prev: null, next: null },
        })

        expect(none.text()).toContain('Kein Treffer für diese Filter.')
        expect(none.text()).toContain('12 Einträge insgesamt')
        expect(none.text()).not.toContain('Hier ist noch nichts.')
    })

    it('pages with Neuere and Ältere, and says where the reader is', () => {
        const first = mountPage({ pagination: { current: 1, last: 3, total: 120, prev: null, next: '/admin/protokoll?seite=2' } })
        const nav = first.find('nav.pk-pages')

        expect(nav.text()).toContain('Seite 1 von 3')
        expect(nav.text()).not.toContain('Neuere')
        expect(nav.find('a').attributes('href')).toBe('/admin/protokoll?seite=2')
        expect(nav.find('a').text()).toContain('Ältere')

        const single = mountPage()

        expect(single.find('nav.pk-pages').exists()).toBe(false)
    })

    it('shows a filter the server refused, in its words', async () => {
        const wrapper = mountPage()

        current.props = { errors: { von: 'Das Anfangsdatum ist kein gültiger Tag.' } }
        await nextTick()

        expect(wrapper.find('.adm-alert').text()).toBe('Das Anfangsdatum ist kein gültiger Tag.')
    })
})
