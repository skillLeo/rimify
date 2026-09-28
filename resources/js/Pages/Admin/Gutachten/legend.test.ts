import { describe, expect, it } from 'vitest'
import { looksLikeCode, splitLegend } from './legend'

/*
 * The legend split (step 4): codes of both real Borbet documents open an entry, a wrapped line continues
 * the sentence before it, and a German sentence word is never taken for a code.
 */

describe('splitLegend', () => {
    it('splits the Rheinland legend at its codes and joins the wrapped lines', () => {
        const pasted = [
            'A01 Nach dem Anbau ist das Fahrzeug unverzüglich einem amtlich anerkannten',
            'Sachverständigen vorzuführen.',
            'A12 Die Verwendung von Schneeketten ist nicht zulässig.',
            'Cpe Nur für Fahrzeuge mit Karosserieform Coupé.',
            'K1c Radabdeckung an der Hinterachse durch Umbördeln herstellen.',
            'T88 Reifen mit Tragfähigkeitskennzahl 88 nur bis 1120 kg Achslast.',
            '140 Tragfähigkeit beachten.',
        ].join('\n')

        expect(splitLegend(pasted)).toEqual([
            { code: 'A01', text: 'Nach dem Anbau ist das Fahrzeug unverzüglich einem amtlich anerkannten Sachverständigen vorzuführen.' },
            { code: 'A12', text: 'Die Verwendung von Schneeketten ist nicht zulässig.' },
            { code: 'Cpe', text: 'Nur für Fahrzeuge mit Karosserieform Coupé.' },
            { code: 'K1c', text: 'Radabdeckung an der Hinterachse durch Umbördeln herstellen.' },
            { code: 'T88', text: 'Reifen mit Tragfähigkeitskennzahl 88 nur bis 1120 kg Achslast.' },
            { code: '140', text: 'Tragfähigkeit beachten.' },
        ])
    })

    it('reads the Austria legend, whose codes end in a letter', () => {
        const entries = splitLegend('11A Abnahme erforderlich.\n76O Nacharbeit am Radlauf.\nYDM Kombination vorn/hinten.\nBDC Hinweis.')

        expect(entries.map((e) => e.code)).toEqual(['11A', '76O', 'YDM', 'BDC'])
    })

    it('never takes a sentence word for a code', () => {
        expect(looksLikeCode('Die')).toBe(false)
        expect(looksLikeCode('Für')).toBe(false)
        expect(looksLikeCode('Lim')).toBe(true)
        expect(splitLegend('A14 Der Reifen muss\nDie Kennzeichnung tragen.')).toEqual([{ code: 'A14', text: 'Der Reifen muss Die Kennzeichnung tragen.' }])
    })

    it('ignores text before the first code and empty lines', () => {
        expect(splitLegend('Auflagen und Hinweise\n\nA01 Abnahme.')).toEqual([{ code: 'A01', text: 'Abnahme.' }])
    })
})
