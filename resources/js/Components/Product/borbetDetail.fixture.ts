import type { FitmentDetailView } from '../../types/pages'

/**
 * What the product page receives for the 18″ Nachtrag on a BMW 1K4 (pages 2, 3 and 22), shortened: the component
 * tests of the check panel and of the full Auflagen read the same answer.
 */
export const ABNAHME = 'Der vorschriftsmäßige Zustand des Fahrzeuges ist … bescheinigen zu lassen.'

export const borbetDetail: FitmentDetailView = {
    sections: [
        { title: 'Hinweise', items: [{ text: 'Zum Auswuchten der Sonderräder dürfen an der Felgeninnenseite nur Klebegewichte angebracht werden.', measures: [] }] },
        { title: 'Abnahme', items: [{ text: ABNAHME, measures: [] }] },
        {
            title: 'Arbeiten am Fahrzeug',
            items: [
                { text: 'Durch Anlegen der vorderen Radhausausschnittkanten … zu entnehmen.', measures: ['Vorderachse: von 190 bis 220 mm'] },
                { text: 'Durch Aufweiten bzw. Ausstellen der hinteren Radhäuser … zu entnehmen.', measures: ['Hinterachse: von 220 bis 270 mm · aufgeweitet um 30 mm'] },
            ],
        },
    ],
    fasteners: [
        { thread: 'Kegelbundschraube M12x1,5', label: 'Kegelbundschraube M12x1,5, Kegel 60°, Schaftlänge 30 mm', torque: '120 Nm', article: 'Set Nr. 5248', limit: 'nur bis Nachtrag 03' },
        { thread: 'Kegelbundschraube M14x1,25', label: 'Kegelbundschraube M14x1,25, Kegel 60°, Schaftlänge 30 mm', torque: '140 Nm', article: 'Set Nr. 5276', limit: 'ab Nachtrag 04' },
    ],
    tyres: [{ label: '245/35 R18', axle: 'nur Hinterachse', minimum: 'laut Gutachten mindestens 92', band: '70–250 kW' }],
    notices: ['Der Fahrzeughalter muss auf die Kontrolle des Anzugsmoments der Befestigungsmittel nach einer Wegstrecke von 50km hingewiesen werden.'],
}
