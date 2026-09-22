import { describe, expect, it } from 'vitest'
import { etSide, kbaNumber, photoFrame, photoHint, photoLabel, photoShape, rimFactsOf, rimTokens, schematicKey } from './rimCode'
import { ANCHORS, FACTS, frame, MANIFEST } from './rimCode.fixtures'

const NBSP = ' '

const VERDICT_WORDS = /zulässig|passt|freigegeben|legal|eintragungsfrei|erlaubt/i

describe('rimTokens', () => {
    it('reads the six values off the facts in the order a wheel is read, prefixes joined with a no-break space', () => {
        const tokens = rimTokens(FACTS)

        expect(tokens.map((t) => t.key)).toEqual(['width', 'diameter', 'et', 'lk', 'mlb', 'kba'])
        expect(tokens.map((t) => t.text)).toEqual(['8,5J', '19', `ET${NBSP}45`, `LK${NBSP}5${NBSP}×${NBSP}112`, `MLB${NBSP}66,6${NBSP}mm`, `KBA${NBSP}53810`])
        expect(tokens.map((t) => t.term)).toEqual(['Maulweite', 'Felgendurchmesser', 'Einpresstiefe (ET)', 'Lochkreis', 'Mittenlochbohrung', 'KBA-Nummer'])
    })

    it('shows the KBA token only when the server says the photographed stamp belongs to this configuration', () => {
        expect(rimTokens({ ...FACTS, kba: null }).map((t) => t.key)).not.toContain('kba')
        expect(rimTokens({ ...FACTS, kba: undefined }).map((t) => t.key)).not.toContain('kba')
        expect(rimTokens({ ...FACTS, kba: '' }).map((t) => t.key)).not.toContain('kba')
        // Not a KBA number we can explain: silent rather than wrong.
        expect(rimTokens({ ...FACTS, kba: 'KBA 5381' }).map((t) => t.key)).not.toContain('kba')
    })

    it('drops a value the server did not send instead of inventing one', () => {
        const tokens = rimTokens({ ...FACTS, centreBore: '  ', diameter: '' })

        expect(tokens.map((t) => t.key)).toEqual(['width', 'et', 'lk', 'kba'])
    })

    it('defines each value in one technical sentence from the research report, with this wheel’s value in it', () => {
        const byKey = Object.fromEntries(rimTokens(FACTS).map((t) => [t.key, t.sentence]))

        expect(byKey.width).toBe(
            'Die Maulweite ist der Abstand zwischen den Innenseiten der beiden Felgenhörner in Zoll – hier 8,5J; das „J“ bezeichnet die Form des Felgenhorns, nicht die Breite.'
        )
        expect(byKey.diameter).toBe(`Der Felgendurchmesser – hier 19${NBSP}Zoll – wird am Wulstsitz gemessen, dort, wo der Reifen aufliegt, nicht am Felgenhorn.`)
        expect(byKey.et).toContain('von der Felgenmitte bis zur Anlagefläche des Rades an der Nabe')
        expect(byKey.et).toContain('je kleiner die ET, desto weiter steht das Rad nach außen')
        expect(byKey.lk).toContain('durch die Mitten der Schraubenlöcher')
        expect(byKey.lk).toContain(`hier 5${NBSP}×${NBSP}112`)
        expect(byKey.mlb).toContain('mit der das Rad auf der Nabe zentriert wird')
        expect(byKey.mlb).toContain('Zentrierring')

        for (const sentence of Object.values(byKey)) {
            // One sentence: a single full stop, at the end.
            expect(sentence.match(/\.(\s|$)/g)).toHaveLength(1)
            expect(sentence.endsWith('.')).toBe(true)
        }
    })

    it('says what the KBA number identifies and that the car must be named with its Auflagen — never a verdict', () => {
        const kba = rimTokens(FACTS).find((t) => t.key === 'kba')?.sentence ?? ''

        expect(kba).toContain('Die KBA-Nummer 53810 auf dem Rad ist das Genehmigungszeichen der Allgemeinen Betriebserlaubnis (ABE)')
        expect(kba).toContain('Kraftfahrt-Bundesamt für genau diesen Radtyp')
        expect(kba).toContain('ob die ABE dein Fahrzeug nennt – mit den Auflagen, die sie dafür stellt')
        expect(kba).not.toMatch(VERDICT_WORDS)
        // A six-digit mark is a Teiletypgenehmigung, not an ABE (KBA PM 18/2025).
        expect(rimTokens({ ...FACTS, kba: '123456' }).find((t) => t.key === 'kba')?.sentence).toContain('Teiletypgenehmigung (TTG)')

        for (const token of rimTokens(FACTS)) {
            expect(token.sentence).not.toMatch(VERDICT_WORDS)
        }
    })

    it('does not write Zoll twice when the diameter already carries it', () => {
        expect(rimTokens({ ...FACTS, diameter: '19 Zoll' })[1]?.sentence).toContain('hier 19 Zoll –')
    })
})

describe('rimFactsOf', () => {
    it('is null without facts, so the page renders no section', () => {
        expect(rimFactsOf(null)).toBeNull()
        expect(rimFactsOf({})).toBeNull()
        expect(rimFactsOf({ facts: null })).toBeNull()
        expect(rimFactsOf({ facts: { width: '', diameter: '', et: '', boltPattern: '', centreBore: '', kba: null } })).toBeNull()
        expect(rimFactsOf({ facts: FACTS })).toBe(FACTS)
    })
})

describe('kbaNumber and etSide', () => {
    it('accepts five or six digits only', () => {
        expect(kbaNumber('53810')).toBe('53810')
        expect(kbaNumber(' 123456 ')).toBe('123456')
        expect(kbaNumber('5381')).toBeNull()
        expect(kbaNumber('KBA 53810')).toBeNull()
        expect(kbaNumber(null)).toBeNull()
    })

    it('reads the side of the Anlagefläche from the sign, and nothing from an unreadable value', () => {
        expect(etSide(`ET${NBSP}45`)).toBe('outboard')
        expect(etSide('ET 35,5')).toBe('outboard')
        expect(etSide(`ET${NBSP}−10`)).toBe('inboard')
        expect(etSide('ET -10')).toBe('inboard')
        expect(etSide('ET 0')).toBe('plane')
        expect(etSide('ET')).toBeNull()
        expect(etSide(null)).toBeNull()
    })
})

describe('photoFrame', () => {
    it('shows the shadow-free frame with the square frame’s geometry, and the stamp read off it', () => {
        const f = photoFrame(MANIFEST)

        expect(f?.image.name).toBe('motec-bare')
        expect(f?.anchors).toEqual(ANCHORS)
        expect(f?.stamp).toBe('53810')
    })

    it('falls back to the square frame’s anchors, and to the square frame without a bare one', () => {
        expect(photoFrame({ ...frame('square', ANCHORS), bare: frame('bare') })?.anchors).toEqual(ANCHORS)
        expect(photoFrame(frame('square', ANCHORS))?.image.name).toBe('square')
    })

    it('shows no photograph without measured anchors (fail closed)', () => {
        expect(photoFrame(null)).toBeNull()
        expect(photoFrame(undefined)).toBeNull()
        expect(photoFrame({ ...frame('square'), bare: frame('bare') })).toBeNull()
        expect(photoFrame(frame('square', { centre: { x: Number.NaN, y: 0.5 } }))).toBeNull()
    })
})

describe('photoShape', () => {
    const f = photoFrame(MANIFEST)

    it('draws the Lochkreis as a dashed circle through the bolt-hole centres, in the frame’s pixels', () => {
        const s = photoShape('lk', f)

        expect(s).toMatchObject({ kind: 'circle', dashed: true, label: 'Lochkreis' })
        expect(s?.kind === 'circle' && s.cx).toBeCloseTo(0.4992 * 1080, 6)
        expect(s?.kind === 'circle' && s.cy).toBeCloseTo(0.4681 * 1080, 6)
        expect(s?.kind === 'circle' && s.r).toBeCloseTo(0.0854 * 1080, 6)
    })

    it('draws the cap over the Mittenlochbohrung, labelled as what it is', () => {
        const s = photoShape('mlb', f)

        expect(s).toMatchObject({ kind: 'circle', dashed: false, label: 'hinter der Nabenkappe' })
        expect(s?.kind === 'circle' && s.r).toBeCloseTo(0.0554 * 1080, 6)
    })

    it('boxes the stamp, standing off it by half its height — only when the stamp is the number explained', () => {
        const s = photoShape('kba', f, '53810')
        const h = 0.0142 * 1080

        expect(s?.kind).toBe('rect')

        if (s?.kind !== 'rect') {
            return
        }

        expect(s.width).toBeCloseTo(0.0696 * 1080 + h, 6)
        expect(s.height).toBeCloseTo(2 * h, 6)
        expect(s.x + s.width / 2).toBeCloseTo(0.5 * 1080, 6)
        expect(s.y + s.height / 2).toBeCloseTo(0.8469 * 1080, 6)
        // The box contains the stamp.
        expect(s.x).toBeLessThan((0.5 - 0.0696 / 2) * 1080)
        expect(s.y + s.height).toBeGreaterThan((0.8469 + 0.0142 / 2) * 1080)

        expect(photoShape('kba', f, null)).toBeNull()
        expect(photoShape('kba', f, '53811')).toBeNull()
        expect(photoShape('kba', photoFrame({ ...MANIFEST, stamp: undefined }), '53810')).toBeNull()
    })

    it('marks nothing a front view does not show, and nothing without its anchor', () => {
        expect(photoShape('width', f)).toBeNull()
        expect(photoShape('diameter', f)).toBeNull()
        expect(photoShape('et', f)).toBeNull()
        expect(photoShape('lk', null)).toBeNull()
        expect(photoShape('lk', photoFrame(frame('x', { centre: ANCHORS.centre })))).toBeNull()
        expect(photoShape('mlb', photoFrame(frame('x', { centre: ANCHORS.centre, bore: { x: 0.5, y: 0.5, r: 0 } })))).toBeNull()
    })

    it('puts the label centred under the shape', () => {
        const s = photoShape('mlb', f)

        if (s === null || f === null) {
            throw new Error('no shape')
        }

        const label = photoLabel(s, f)
        expect(label.text).toBe('hinter der Nabenkappe')
        expect(label.x).toBeCloseTo(0.5, 6)
        expect(label.y).toBeCloseTo(0.4704 + 0.0554, 6)
    })
})

describe('photoHint and schematicKey', () => {
    it('points the values a front view cannot show to the cross-section', () => {
        expect(photoHint('width', false)).toBe('Auf dem Foto nicht zu sehen – die Schnittzeichnung zeigt die Maulweite.')
        expect(photoHint('et', false)).toContain('Schnittzeichnung zeigt die Einpresstiefe')
        expect(photoHint('mlb', true)).toBe('Markiert: die Nabenkappe – die Mittenlochbohrung liegt dahinter.')
        expect(photoHint('lk', false)).toContain('nicht markiert')
        expect(schematicKey('kba')).toBeNull()
        expect(schematicKey('lk')).toBe('lk')
    })
})
