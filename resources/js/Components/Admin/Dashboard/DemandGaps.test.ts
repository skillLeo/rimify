import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { DemandGap } from '../../../types/admin/uebersicht'
import { mailtoHref } from '../../../Pages/Admin/Nachfrage/mailto'

/*
 * Nachfrage-Lücken on the Übersicht: ranked, each count in German with its bar against the largest,
 * who is waiting said in words, and every row opening its own row on the full list. And the request
 * e-mail, which must reach the mail program exactly as written.
 */

vi.mock('@inertiajs/vue3', () => ({
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
}))

const { default: DemandGaps } = await import('./DemandGaps.vue')

function gap(key: string, title: string, asked: number, weight: number, waiting = 0): DemandGap {
    return {
        key,
        kind: key.startsWith('k:') ? 'keys' : 'vehicle',
        title,
        detail: 'HSN 0005 · TSN ABC · 11/2017–heute',
        asked,
        waiting,
        lastAgo: 'vor 2 Std.',
        lastIso: '2026-09-27T10:00:00+00:00',
        score: asked,
        weight,
        mark: null,
        mail: { subject: `Gutachten-Anfrage: ${title}`, body: '' },
    }
}

const rows = [gap('v:12', 'BMW X3 M40i', 1240, 100, 3), gap('k:0005-ABC', 'HSN 0005 · TSN ABC', 2, 1, 1)]

describe('DemandGaps', () => {
    it('ranks the gaps in the order given, each a link to its row on the full list', () => {
        const links = mount(DemandGaps, { props: { rows } }).findAll('a')

        expect(links.map((a) => a.text())).toEqual(['BMW X3 M40i', 'HSN 0005 · TSN ABC'])
        expect(links[0]!.attributes('href')).toBe('/admin/nachfrage#gap-v-12')
        expect(links[1]!.attributes('href')).toBe('/admin/nachfrage#gap-k-0005-ABC')
    })

    it('prints each count the German way, and draws its bar to that count — never to the ranking weight', () => {
        // Ranked 2nd by weight but asked more often than the 1st: the bar says what the figure says (M1-13).
        const ranked = [gap('v:1', 'Audi A4 Avant', 12, 100), gap('v:2', 'BMW 3er Touring', 13, 60), gap('v:3', 'VW Golf', 3, 10)]
        const bars = mount(DemandGaps, { props: { rows: ranked } }).findAll('.dg__bar > span').map((bar) => bar.attributes('style'))

        expect(mount(DemandGaps, { props: { rows } }).findAll('.dg__asked')[0]!.text()).toBe('1.240× gefragt')
        expect(bars[1]).toContain('width: 100%')
        expect(bars[0]).toContain(`width: ${(12 / 13) * 100}%`)
        expect(bars[2]).toContain(`width: ${(3 / 13) * 100}%`)
    })

    it('says who is waiting in words, singular and plural', () => {
        const waiting = mount(DemandGaps, { props: { rows } }).findAll('.dg__waiting')

        expect(waiting.map((w) => w.text())).toEqual(['3 warten', '1 wartet'])
    })

    it('says nothing about waiting where nobody is', () => {
        expect(mount(DemandGaps, { props: { rows: [gap('v:1', 'Audi A4 Avant', 4, 100)] } }).find('.dg__waiting').exists()).toBe(false)
    })
})

describe('mailtoHref', () => {
    it('leaves the recipient to the sender, and encodes subject and text with CRLF line ends', () => {
        const href = mailtoHref('Gutachten-Anfrage: BMW X3 M40i', 'Guten Tag,\n\nFahrzeug: BMW X3 M40i\nMit freundlichen Grüßen')

        expect(href.startsWith('mailto:?subject=')).toBe(true)
        expect(href).toContain('subject=Gutachten-Anfrage%3A%20BMW%20X3%20M40i')
        expect(href).toContain('Guten%20Tag%2C%0D%0A%0D%0AFahrzeug')
        expect(href).toContain('Gr%C3%BC%C3%9Fen')
        expect(decodeURIComponent(href.split('&body=')[1]!)).toBe('Guten Tag,\r\n\r\nFahrzeug: BMW X3 M40i\r\nMit freundlichen Grüßen')
    })

    it('does not double a line end that is already CRLF', () => {
        expect(decodeURIComponent(mailtoHref('x', 'a\r\nb').split('&body=')[1]!)).toBe('a\r\nb')
    })
})
