import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FitmentPanel from './FitmentPanel.vue'
import type { ConfigVerdict } from '../../types/pages'
import type { VehicleProp } from '../../types/rimify'

const vehicle: VehicleProp = {
    id: 3,
    make: 'BMW',
    model: '3er',
    variant: 'Coupe',
    label: 'BMW 3er Coupe',
    short: 'BMW 3er',
    hsn: '0005',
    tsn: '582',
    keyNumbers: 'HSN 0005 · TSN 582',
    buildWindow: '01/1995–12/1999',
}

function verdict(overrides: Partial<ConfigVerdict>): ConfigVerdict {
    return {
        status: 'PERMITTED',
        label: 'Freigegeben',
        sellable: true,
        requiresEntry: false,
        entryNoteDe: null,
        conditions: [],
        reason: null,
        reasonCode: null,
        document: null,
        tyreSizes: [],
        ...overrides,
    }
}

describe('FitmentPanel', () => {
    it('never tells the customer "no entry needed" about a wheel that is not permitted', () => {
        const wrapper = mount(FitmentPanel, {
            props: {
                vehicle,
                verdict: verdict({
                    status: 'NOT_PERMITTED',
                    sellable: false,
                    reason: 'Das Gutachten führt dieses Fahrzeug nicht auf.',
                }),
            },
        })

        expect(wrapper.text()).toContain('Nicht freigegeben für BMW 3er Coupe')
        expect(wrapper.text()).not.toContain('Eintragung')
        expect(wrapper.text()).toContain('Das Gutachten führt dieses Fahrzeug nicht auf.')
    })

    it('says nothing about entry for UNKNOWN, and does not dress it as a refusal', () => {
        const wrapper = mount(FitmentPanel, {
            props: { vehicle, verdict: verdict({ status: 'UNKNOWN', sellable: false }) },
        })

        expect(wrapper.text()).not.toContain('Eintragung')
        expect(wrapper.classes()).toContain('rcheck-panel--unknown')
        expect(wrapper.classes()).not.toContain('rcheck-panel--danger')
    })

    it('shows every Auflage of a CONDITIONAL verdict as a full sentence', () => {
        const wrapper = mount(FitmentPanel, {
            props: {
                vehicle,
                verdict: verdict({
                    status: 'CONDITIONAL',
                    requiresEntry: true,
                    conditions: ['Nur mit den angegebenen Radschrauben zulässig.'],
                }),
            },
        })

        expect(wrapper.text()).toContain('Mit Auflagen freigegeben für BMW 3er Coupe')
        expect(wrapper.text()).toContain('Eintragung in die Fahrzeugpapiere erforderlich.')
        expect(wrapper.find('.fit__conditions li').text()).toBe(
            'Nur mit den angegebenen Radschrauben zulässig.'
        )
    })

    it('names the document without a stray separator when the issuer is missing', () => {
        const wrapper = mount(FitmentPanel, {
            props: {
                vehicle,
                verdict: verdict({ document: { number: 'TG-123', issuer: null, kind: 'TEILEGUTACHTEN' } }),
            },
        })

        expect(wrapper.find('.fit__doc').text()).toBe('TG-123')
    })
})
