import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { AdminZuruecksetzenProps } from '../../../types/admin/zuruecksetzen'

/*
 * System › Testumgebung zurücksetzen: what each level takes is shown for the one chosen, counted; a level that cannot
 * run says why and offers nothing to press; the reset waits for the typed word (AdminConfirm's), and sends the level
 * with it; the last reset can be undone after one question.
 */

const post = vi.fn()

vi.mock('@inertiajs/vue3', () => ({ router: { post: (...a: unknown[]) => post(...a) } }))

vi.mock('../../../Components/Admin/AdminPage.vue', () => ({
    default: defineComponent({
        props: { title: String, context: String },
        setup: (props, { slots }) => () => h('main', [h('h1', props.title), h('p', { class: 'ctx' }, props.context), slots.default?.()]),
    }),
}))
vi.mock('../../../Layouts/AdminLayout.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => slots.default?.() }) }))

/* The question itself is AdminConfirm's (its own tests): here only what the page asks it, and what it does on yes. */
vi.mock('../../../Components/Admin/AdminConfirm.vue', () => ({
    default: defineComponent({
        props: { open: Boolean, title: String, body: String, confirmLabel: String, confirmWord: String, busy: Boolean },
        emits: ['confirm', 'update:open'],
        setup: (props, { emit }) => () =>
            props.open
                ? h('section', { class: 'confirm', 'data-word': props.confirmWord ?? '' }, [
                      h('h2', props.title),
                      h('p', { class: 'confirm__body' }, props.body),
                      h('button', { class: 'confirm__yes', type: 'button', onClick: () => emit('confirm') }, props.confirmLabel),
                  ])
                : null,
    }),
}))

const { default: Page } = await import('./Zuruecksetzen.vue')

function props(over: Partial<AdminZuruecksetzenProps> = {}): AdminZuruecksetzenProps {
    return {
        levels: [
            {
                key: 'demo',
                label: 'Demodaten',
                removes: 'Nur die Beispieldaten.',
                keeps: 'Alles andere.',
                counts: [{ label: 'Bestellungen', count: 729 }],
                blocked: '20 Bestellungen, die nicht als Demodaten angelegt wurden, enthalten Beispielfelgen oder Beispielreifen.',
            },
            {
                key: 'shop',
                label: 'Shopdaten',
                removes: 'Felgen, Reifen, Marken, Gutachten …',
                keeps: 'Benutzer, Rollen, Einstellungen …',
                counts: [
                    { label: 'Felgen', count: 12 },
                    { label: 'Gutachten', count: 3 },
                    { label: 'Fahrzeuge', count: 76 },
                    { label: 'Bilder', count: 1061 },
                ],
                blocked: null,
            },
            { key: 'all', label: 'Alles', removes: 'Alles aus „Shopdaten“ …', keeps: 'Benutzer, Rollen …', counts: [{ label: 'Seiten', count: 11 }], blocked: null },
        ],
        last: null,
        word: 'ZURÜCKSETZEN',
        keepDays: 7,
        ...over,
    }
}

beforeEach(() => post.mockReset())

describe('System › Testumgebung zurücksetzen', () => {
    it('says first what always stays, and counts what „Shopdaten“ would take', () => {
        const wrapper = mount(Page, { props: props() })

        expect(wrapper.find('.zs-lead').text()).toBe(
            'Benutzer, Rollen, Einstellungen und das Protokoll bleiben auf jeder Stufe erhalten – nur „Demodaten“ entfernt das Demo-Team und seine Einträge. Du bleibst angemeldet.'
        )
        expect(wrapper.findAll('.zs-level__name').map((n) => n.text())).toEqual(['Demodaten', 'Shopdaten', 'Alles'])
        expect((wrapper.get('input[value="shop"]').element as HTMLInputElement).checked).toBe(true)
        expect(wrapper.findAll('.zs-counts__item').map((i) => i.text().replace(/\s+/g, ' '))).toEqual(['12 Felgen', '3 Gutachten', '76 Fahrzeuge', '1.061 Bilder'])
        expect(wrapper.get('button[type="submit"]').text()).toBe('Shopdaten zurücksetzen')
    })

    it('says why a level cannot run, and offers nothing to press for it', async () => {
        const wrapper = mount(Page, { props: props() })

        await wrapper.get('input[value="demo"]').setValue(true)

        expect(wrapper.get('.zs-blocked').text()).toBe(
            '20 Bestellungen, die nicht als Demodaten angelegt wurden, enthalten Beispielfelgen oder Beispielreifen. Nimm stattdessen „Shopdaten“.'
        )
        expect(wrapper.get('button[type="submit"]').attributes('aria-disabled')).toBe('true')

        await wrapper.get('form').trigger('submit')

        expect(wrapper.find('.confirm').exists()).toBe(false)
    })

    it('asks for the word, names what goes, and sends the level once the answer is yes', async () => {
        const wrapper = mount(Page, { props: props() })

        await wrapper.get('form').trigger('submit')

        const confirm = wrapper.get('.confirm')
        expect(confirm.attributes('data-word')).toBe('ZURÜCKSETZEN')
        expect(confirm.get('h2').text()).toBe('Shopdaten zurücksetzen')
        expect(confirm.get('.confirm__body').text()).toBe(
            'Das wird entfernt: 12\u00A0Felgen, 3\u00A0Gutachten, 76\u00A0Fahrzeuge, 1.061\u00A0Bilder. Benutzer, Rollen, Einstellungen und das Protokoll bleiben, und du bleibst angemeldet. Du kannst das Zurücksetzen 7 Tage lang rückgängig machen.'
        )

        await confirm.get('.confirm__yes').trigger('click')

        expect(post).toHaveBeenCalledTimes(1)
        expect(post.mock.calls[0]?.[0]).toBe('/admin/system/zuruecksetzen')
        expect(post.mock.calls[0]?.[1]).toEqual({ level: 'shop', confirmation: 'ZURÜCKSETZEN' })
    })

    it('shows the last reset and undoes it after one question, saying what is lost', async () => {
        const wrapper = mount(Page, {
            props: props({
                last: {
                    id: '20261004-120000-shop',
                    level: 'shop',
                    label: 'Shopdaten',
                    at: '2026-10-04T12:00:00+00:00',
                    atText: '04.10.2026, 14:00\u00A0Uhr',
                    by: 'Limix Sebastian',
                    until: '11.10.2026, 14:00\u00A0Uhr',
                    remaining: 'noch 6\u00A0Tage und 23\u00A0Stunden',
                    undone: false,
                    undoneText: null,
                    undoable: true,
                    reason: null,
                },
            }),
        })

        expect(wrapper.find('.ctx').text()).toBe('Nur in der Testumgebung, nie im Live-Shop')
        expect(wrapper.get('.zs-last .adm-note').text().replace(/\s+/g, ' ')).toBe(
            'Shopdaten, am 04.10.2026, 14:00 Uhr von Limix Sebastian. Rückgängig machen ist bis 11.10.2026, 14:00 Uhr möglich (noch 6 Tage und 23 Stunden).'
        )

        await wrapper.get('.zs-last button').trigger('click')

        const confirm = wrapper.get('.confirm')
        expect(confirm.get('h2').text()).toBe('Letztes Zurücksetzen rückgängig machen')
        expect(confirm.get('.confirm__body').text()).toContain('Was seitdem im Shop angelegt wurde, geht dabei verloren.')

        await confirm.get('.confirm__yes').trigger('click')

        expect(post.mock.calls[0]?.[0]).toBe('/admin/system/zuruecksetzen/rueckgaengig')
    })

    it('says at „Demodaten“ that the demo team goes and comes back, and that everyone else stays', async () => {
        const levels = props().levels.map((l) => (l.key === 'demo' ? { ...l, blocked: null } : l))
        const wrapper = mount(Page, {
            props: props({
                levels,
                last: {
                    id: '20261004-120000-demo',
                    level: 'demo',
                    label: 'Demodaten',
                    at: '2026-10-04T12:00:00+00:00',
                    atText: '04.10.2026, 14:00 Uhr',
                    by: 'Limix Sebastian',
                    until: '11.10.2026, 14:00 Uhr',
                    remaining: 'noch 6 Tage und 23 Stunden',
                    undone: false,
                    undoneText: null,
                    undoable: true,
                    reason: null,
                },
            }),
        })

        await wrapper.get('input[value="demo"]').setValue(true)
        await wrapper.get('form').trigger('submit')

        expect(wrapper.get('.confirm__body').text()).toBe(
            'Das wird entfernt: 729 Bestellungen. Die übrigen Benutzer und Protokolleinträge bleiben, wie sie sind, und du bleibst angemeldet. Du kannst das Zurücksetzen 7 Tage lang rückgängig machen.'
        )

        await wrapper.get('.zs-last button').trigger('click')

        expect(wrapper.findAll('.confirm__body').at(-1)?.text()).toBe(
            'Die Demodaten kommen zurück, wie sie am 04.10.2026, 14:00 Uhr waren. Was seitdem im Shop angelegt wurde, geht dabei verloren. Die übrigen Benutzer und Protokolleinträge bleiben, wie sie sind.'
        )
    })

    it('closes the way back with one sentence once the seven days are over, and offers no button', () => {
        const wrapper = mount(Page, {
            props: props({
                last: {
                    id: '20261004-120000-shop',
                    level: 'shop',
                    label: 'Shopdaten',
                    at: '2026-10-04T12:00:00+00:00',
                    atText: '04.10.2026, 14:00\u00A0Uhr',
                    by: 'Konsole (rimify:reset)',
                    until: '11.10.2026, 14:00\u00A0Uhr',
                    remaining: null,
                    undone: false,
                    undoneText: null,
                    undoable: false,
                    reason: 'Die 7 Tage sind vorbei: Dieses Zurücksetzen lässt sich nicht mehr rückgängig machen.',
                },
            }),
        })

        expect(wrapper.get('.zs-last .adm-note').text().replace(/\s+/g, ' ')).toBe(
            'Shopdaten, am 04.10.2026, 14:00 Uhr von Konsole (rimify:reset). Die 7 Tage sind vorbei: Dieses Zurücksetzen lässt sich nicht mehr rückgängig machen.'
        )
        expect(wrapper.find('.zs-last button').exists()).toBe(false)
    })
})
