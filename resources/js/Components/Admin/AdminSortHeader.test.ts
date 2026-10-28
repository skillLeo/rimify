import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextSort, sortQuery } from '../../lib/adminSort'
import AdminSortHeader from './AdminSortHeader.vue'

/*
 * F-32: a sortable column heading — Reifen, Fahrzeuge — says which column orders the list and which way, to the eye and
 * to a screen reader, and a press asks for this column; the address keeps the order, left out for the plain list.
 */

function heading(sort: string, richtung: 'auf' | 'ab' = 'auf') {
    return mount(AdminSortHeader, {
        props: { label: 'Größe', column: 'groesse', sort, richtung },
        attachTo: document.createElement('tr'),
    })
}

describe('AdminSortHeader', () => {
    it('marks the column that orders the list, and which way', () => {
        expect(heading('groesse', 'auf').attributes('aria-sort')).toBe('ascending')
        expect(heading('groesse', 'ab').attributes('aria-sort')).toBe('descending')
        expect(heading('reifen').attributes('aria-sort')).toBeUndefined()
        expect(heading('groesse').find('.adm-sort__icon--on').exists()).toBe(true)
        expect(heading('reifen').find('.adm-sort__icon--on').exists()).toBe(false)
    })

    it('asks for its column when pressed', async () => {
        const wrapper = heading('reifen')

        await wrapper.find('button').trigger('click')
        expect(wrapper.emitted('sort')).toEqual([['groesse']])
        expect(wrapper.find('button').text()).toBe('Größe')
    })
})

describe('adminSort', () => {
    it('turns the same column round and starts another with its own first direction', () => {
        expect(nextSort({ sort: 'reifen', richtung: 'auf' }, 'reifen')).toEqual({ sort: 'reifen', richtung: 'ab' })
        expect(nextSort({ sort: 'reifen', richtung: 'ab' }, 'reifen')).toEqual({ sort: 'reifen', richtung: 'auf' })
        expect(nextSort({ sort: 'reifen', richtung: 'ab' }, 'preis')).toEqual({ sort: 'preis', richtung: 'auf' })
        expect(nextSort({ sort: 'fahrzeug', richtung: 'auf' }, 'freigaben', 'ab')).toEqual({ sort: 'freigaben', richtung: 'ab' })
    })

    it('leaves the plain list’s order out of the address', () => {
        const plain = { sort: 'reifen', richtung: 'auf' } as const

        expect(sortQuery(plain, plain)).toEqual({})
        expect(sortQuery({ sort: 'reifen', richtung: 'ab' }, plain)).toEqual({ sort: 'reifen', richtung: 'ab' })
    })
})
