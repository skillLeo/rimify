import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import QualityList from './QualityList.vue'

/*
 * „Datenqualität“ for the Katalog role: every Felge with something missing, each gap named in a word —
 * and said to a screen reader as what is missing, not as a row of loose tags.
 */

describe('QualityList', () => {
    const rows = [
        { key: 'wc-1', title: 'BBS CH-R', detail: '8,5J × 19 · ET 35 · Satin Black', missing: ['Preis', 'Foto', 'Traglast'] },
        { key: 'wc-2', title: 'OZ Ultraleggera', detail: '8J × 18 · ET 45', missing: ['Gewicht'] },
    ]

    it('names each Felge, its size, and what is missing', () => {
        const items = mount(QualityList, { props: { rows } }).findAll('.ql__row')

        expect(items).toHaveLength(2)
        expect(items[0]!.find('.ql__title').text()).toBe('BBS CH-R')
        expect(items[0]!.find('.ql__detail').text()).toBe('8,5J × 19 · ET 35 · Satin Black')
        expect(items[0]!.findAll('.adm-tag').map((t) => t.text())).toEqual(['Preis', 'Foto', 'Traglast'])
        expect(items[1]!.findAll('.adm-tag').map((t) => t.text())).toEqual(['Gewicht'])
    })

    it('says „Es fehlt“ before the gaps, for whoever cannot see the tags', () => {
        expect(mount(QualityList, { props: { rows } }).find('.ql__missing .visually-hidden').text()).toBe('Es fehlt:')
    })
})
