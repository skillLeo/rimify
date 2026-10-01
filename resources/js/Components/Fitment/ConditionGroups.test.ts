import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ConditionGroups from './ConditionGroups.vue'
import { entryBySize } from '../../fitment/papers'
import type { ConditionGroupsView } from '../../types/rimify'

// ABE 55255, page 5, BMW X3 X83 — the row's Auflagen for every size, each size's with that size.
const CHAINS = 'Es dürfen nur feingliedrige bzw. die lt. Betriebsanleitung/Handbuch vorgeschriebenen Schneeketten an der Hinterachse verwendet werden.'
const NO_CHAINS = 'Die Verwendung von Schneeketten ist nicht zulässig.'
const BOLTS = 'Zur Befestigung der Räder dürfen nur die mitgelieferten Befestigungsmittel Nr. S03 (siehe Seite 1) verwendet werden.'

const x3: ConditionGroupsView = {
    combination: [BOLTS],
    sizes: [
        { size: '235/45 R19', axle: 'Vorder- und Hinterachse', conditions: [CHAINS], entry: false },
        { size: '245/40 R19', axle: 'Vorder- und Hinterachse', conditions: [CHAINS], entry: false },
        { size: '255/40 R19', axle: 'Vorder- und Hinterachse', conditions: [NO_CHAINS], entry: true },
    ],
    chosen: null,
    entry: null,
}

describe('ConditionGroups', () => {
    it('says the combination’s Auflagen once, then each size with its own — never both chain sentences in one list', () => {
        const wrapper = mount(ConditionGroups, { props: { groups: x3 } })
        const blocks = wrapper.findAll('.cgroups__size')

        expect(wrapper.find('.cgroups__head').text()).toBe('Für jede zulässige Reifengröße')
        expect(wrapper.findAll('li').filter((li) => li.text() === BOLTS)).toHaveLength(1)
        expect(blocks).toHaveLength(3)
        expect(blocks[0]?.text()).toContain('Nur mit 235/45 R19')
        expect(blocks[0]?.text()).toContain(CHAINS)
        expect(blocks[0]?.text()).not.toContain(NO_CHAINS)
        expect(blocks[2]?.text()).toContain(NO_CHAINS)
        expect(blocks[2]?.text()).not.toContain(CHAINS)

        // No list anywhere holds both.
        for (const list of wrapper.findAll('ul')) {
            expect(list.text().includes(CHAINS) && list.text().includes(NO_CHAINS)).toBe(false)
        }
    })

    it('says only the chosen size’s Auflagen for a Komplettrad', () => {
        const wrapper = mount(ConditionGroups, { props: { groups: { combination: [BOLTS, NO_CHAINS], sizes: [], chosen: '255/40 R19', entry: true } } })

        expect(wrapper.find('.cgroups__head').text()).toBe('Für 255/40 R19')
        expect(wrapper.text()).toContain(NO_CHAINS)
        expect(wrapper.text()).not.toContain(CHAINS)
    })

    it('shows a plain list where the sizes do not differ, and leaves out what the page already says', () => {
        const wrapper = mount(ConditionGroups, { props: { groups: { combination: [BOLTS, 'Eintragung in die Fahrzeugpapiere erforderlich.'], sizes: [], chosen: null, entry: null }, omit: ['Eintragung in die Fahrzeugpapiere erforderlich.'] } })

        expect(wrapper.find('.cgroups__head').exists()).toBe(false)
        expect(wrapper.findAll('li').map((li) => li.text())).toEqual([BOLTS])
    })

    it('says a size without Auflagen of its own as such', () => {
        const wrapper = mount(ConditionGroups, { props: { groups: { ...x3, sizes: [...x3.sizes.slice(0, 2), { ...x3.sizes[2]!, conditions: [] }] } } })

        expect(wrapper.findAll('.cgroups__size')[2]?.text()).toContain('Keine weiteren Auflagen.')
    })
})

describe('entryBySize', () => {
    it('names the sizes that need the Abnahme and those that do not — never one answer for all', () => {
        expect(entryBySize(x3.sizes, false)).toBe('Eintragung in die Fahrzeugpapiere erforderlich mit 255/40 R19, nicht mit 235/45 R19 und 245/40 R19.')
        expect(entryBySize(x3.sizes, true)).toBe('Abnahme durch einen Prüfer erforderlich mit 255/40 R19, nicht mit 235/45 R19 und 245/40 R19.')
        expect(entryBySize(x3.sizes.map((s) => ({ ...s, entry: true })), false)).toBeNull()
        expect(entryBySize(undefined, false)).toBeNull()
    })
})
