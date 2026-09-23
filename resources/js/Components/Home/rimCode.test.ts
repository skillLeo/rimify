import { mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import type { WheelAnchors } from '../Ui/Picture.vue'
import RimCode from './RimCode.vue'
import { etSide, kbaNumber, photoFrame, photoHint, photoLabel, photoShape, rimFactsOf, rimTokens, schematicKey, type RimCodeProduct, type RimKey } from './rimCode'
import { ANCHORS, FACTS, frame, MANIFEST, PRODUCT } from './rimCode.fixtures'

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

    it('tells the reader where to look for the KBA number, and claims nothing when it is not marked', () => {
        expect(photoHint('kba', true)).toBe('Markiert: die KBA-Nummer auf dem Rad.')
        expect(photoHint('kba', false)).toBe('Auf dem Foto nicht markiert – die KBA-Nummer steht auf dem Rad selbst.')
        // The cross-section has no KBA number: the reader is never sent to a drawing that cannot show it.
        expect(photoHint('kba', false)).not.toContain('Schnittzeichnung')
    })

    it('stops pointing at the ET dimension when the cross-section does not draw one', () => {
        // The drawing carries the ET for a positive ET only; for any other value there is nothing
        // to point at, so the line says only that the photograph does not show it (CLAUDE.md §2).
        expect(photoHint('et', false, false)).toBe('Auf dem Foto nicht zu sehen.')
        expect(photoHint('et', false, false)).not.toContain('Schnittzeichnung')

        // The four the drawing always carries keep their pointer whatever the ET is.
        expect(photoHint('width', false, false)).toContain('Schnittzeichnung zeigt die Maulweite')
        expect(photoHint('diameter', false, false)).toContain('Schnittzeichnung zeigt den Felgendurchmesser')
        expect(photoHint('lk', false, false)).toContain('Schnittzeichnung zeigt den Lochkreis')
        expect(photoHint('mlb', false, false)).toContain('Schnittzeichnung zeigt die Mittenlochbohrung')
    })
})

/* ── The section itself: what choosing a value changes on the page ──────────────── */

/** The values in the order the row shows them. */
const KEYS: RimKey[] = ['width', 'diameter', 'et', 'lk', 'mlb', 'kba']

/** What a reader has in front of them for the value on show. */
interface Shown {
    /** Every value the row reports as chosen — one, ever. */
    pressed: (string | undefined)[]
    term: string
    sentence: string
    /** The line under the photograph; null when there is no photograph. */
    hint: string | null
    /** The marker on the photograph as `tag/value`; null when nothing is marked. */
    marker: string | null
    /** The dimension traced on the cross-section; null when none is. */
    dim: string | null
}

let mounted: VueWrapper[] = []

/** A pointer that hovers, or none: RimCode reads this once, on mount. */
function media(fine: boolean): void {
    vi.stubGlobal(
        'matchMedia',
        vi.fn((query: string) => ({
            matches: fine && query.includes('hover: hover'),
            media: query,
            onchange: null,
            addEventListener: () => {},
            removeEventListener: () => {},
            addListener: () => {},
            removeListener: () => {},
            dispatchEvent: () => false,
        }))
    )
}

function mountSection(product: RimCodeProduct = PRODUCT): VueWrapper {
    // The teaser is a link into the calculator and needs Inertia; it is not what this tests.
    const wrapper = mount(RimCode, { props: { product }, global: { stubs: { RimCodeTeaser: true } } })
    mounted.push(wrapper)

    return wrapper
}

function shownIn(w: VueWrapper): Shown {
    const shape = w.find('.rc-photo__shape')
    const dim = w.find('.rc-sch__dim.is-active')
    const hint = w.find('.rc-photo__hint')

    return {
        pressed: w.findAll('[data-token][aria-pressed="true"]').map((b) => b.attributes('data-token')),
        term: w.get('.rc__term').text(),
        sentence: w.get('[data-role="definition"]').text(),
        hint: hint.exists() ? hint.text() : null,
        marker: shape.exists() ? `${shape.element.tagName.toLowerCase()}/${shape.attributes('data-shape') ?? ''}` : null,
        dim: dim.exists() ? (dim.attributes('data-dim') ?? null) : null,
    }
}

async function choose(w: VueWrapper, key: RimKey): Promise<Shown> {
    await w.get(`[data-token="${key}"]`).trigger('click')

    return shownIn(w)
}

/** A pointer event as the listener sees it; happy-dom has no PointerEvent constructor to rely on. */
function pointer(el: Element, type: string): void {
    const event = new Event(type, { bubbles: true })
    Object.defineProperty(event, 'pointerType', { value: 'mouse' })
    el.dispatchEvent(event)
}

describe('RimCode', () => {
    beforeEach(() => {
        media(false)
    })

    afterEach(() => {
        mounted.forEach((w) => w.unmount())
        mounted = []
        vi.unstubAllGlobals()
    })

    it('shows the six values, with the first one already on show before anything is clicked', () => {
        const first = shownIn(mountSection())

        expect(mounted[0]?.findAll('[data-token]').map((b) => b.attributes('data-token'))).toEqual(KEYS)
        expect(first.pressed).toEqual(['width'])
        expect(first.term).toBe('Maulweite')
    })

    it('changes the term, the sentence and the highlighted element on every value', async () => {
        const w = mountSection()
        const tokens = rimTokens(FACTS)
        const seen: Shown[] = []

        for (const key of KEYS) {
            const state = await choose(w, key)
            const token = tokens.find((t) => t.key === key)
            const before = seen[seen.length - 1]

            expect(state.pressed).toEqual([key])
            expect(state.term).toBe(token?.term)
            expect(state.sentence).toBe(token?.sentence)

            // The value before this one said something else, and highlighted something else.
            if (before !== undefined) {
                expect(state.term).not.toBe(before.term)
                expect(state.sentence).not.toBe(before.sentence)
                expect(`${state.marker}|${state.dim}`).not.toBe(`${before.marker}|${before.dim}`)
            }

            seen.push(state)
        }

        // Six values, six sentences, six highlights: no value is a repeat of another.
        expect(new Set(seen.map((s) => s.term)).size).toBe(KEYS.length)
        expect(new Set(seen.map((s) => s.sentence)).size).toBe(KEYS.length)
        expect(new Set(seen.map((s) => `${s.marker}|${s.dim}`)).size).toBe(KEYS.length)
    })

    it('highlights each value on the picture that shows it, and the line says which', async () => {
        const w = mountSection()
        const f = photoFrame(MANIFEST)

        for (const key of KEYS) {
            const state = await choose(w, key)
            const shape = photoShape(key, f, '53810')

            expect(state.marker).toBe(shape === null ? null : `${shape.kind}/${key}`)
            expect(state.dim).toBe(schematicKey(key))
            expect(state.hint).toBe(photoHint(key, shape !== null))
        }

        await choose(w, 'lk')
        expect(w.get('.rc-photo__shape').classes()).toContain('rc-photo__shape--dashed')
        await choose(w, 'mlb')
        expect(w.get('.rc-photo__shape').classes()).not.toContain('rc-photo__shape--dashed')
    })

    it('boxes the stamp on the anchor the pipeline measured, labels it and traces no dimension', async () => {
        const w = mountSection()
        const state = await choose(w, 'kba')
        const stamp = ANCHORS.kba
        const box = photoShape('kba', photoFrame(MANIFEST), '53810')

        if (stamp === undefined || box === null || box.kind !== 'rect') {
            throw new Error('no measured stamp')
        }

        expect(state.term).toBe('KBA-Nummer')
        expect(state.sentence).toContain('Genehmigungszeichen')
        expect(state.sentence).toContain('Auflagen')

        const rect = w.get('rect.rc-photo__shape[data-shape="kba"]')
        const x = Number(rect.attributes('x'))
        const y = Number(rect.attributes('y'))
        const width = Number(rect.attributes('width'))
        const height = Number(rect.attributes('height'))

        // The box sits on the measured stamp, in the frame's own pixels, and stands off it on every side.
        expect(x + width / 2).toBeCloseTo(stamp.x * MANIFEST.width, 6)
        expect(y + height / 2).toBeCloseTo(stamp.y * MANIFEST.height, 6)
        expect(width).toBeGreaterThan(stamp.w * MANIFEST.width)
        expect(height).toBeGreaterThan(stamp.h * MANIFEST.height)
        expect(x).toBeCloseTo(box.x, 6)
        expect(y).toBeCloseTo(box.y, 6)
        expect(width).toBeCloseTo(box.width, 6)
        expect(height).toBeCloseTo(box.height, 6)

        expect(w.get('.rc-photo__label').text()).toBe(`KBA${NBSP}53810`)
        expect(state.hint).toBe('Markiert: die KBA-Nummer auf dem Rad.')

        // A marking, not a dimension: the cross-section traces nothing for it.
        expect(state.dim).toBeNull()
        expect(w.findAll('.rc-sch__dim.is-active')).toHaveLength(0)
    })

    it('marks nothing and claims nothing when the shown finish has no measured stamp', async () => {
        const anchors: WheelAnchors = { ...ANCHORS }
        delete anchors.kba

        const w = mountSection({ ...PRODUCT, imageManifest: { ...frame('motec', anchors), bare: frame('motec-bare', anchors), stamp: '53810' } })
        const state = await choose(w, 'kba')

        expect(state.pressed).toEqual(['kba'])
        expect(state.term).toBe('KBA-Nummer')
        expect(state.sentence).toContain('Genehmigungszeichen')
        expect(state.marker).toBeNull()
        expect(state.dim).toBeNull()
        expect(w.find('.rc-photo__label').exists()).toBe(false)
        // The photograph stays; only the claim about it goes.
        expect(w.find('figure.rc-photo').exists()).toBe(true)
        expect(state.hint).toBe('Auf dem Foto nicht markiert – die KBA-Nummer steht auf dem Rad selbst.')
    })

    it('does not box a stamp that is not the number the value explains', async () => {
        const w = mountSection({ ...PRODUCT, imageManifest: { ...MANIFEST, stamp: '53811' } })
        const state = await choose(w, 'kba')

        expect(state.marker).toBeNull()
        expect(state.hint).toBe('Auf dem Foto nicht markiert – die KBA-Nummer steht auf dem Rad selbst.')
    })

    it('shows the cross-section alone when nothing was measured on the photograph', async () => {
        const w = mountSection({ ...PRODUCT, imageManifest: frame('motec') })
        const state = await choose(w, 'kba')

        expect(w.find('.rc-photo').exists()).toBe(false)
        expect(state.pressed).toEqual(['kba'])
        expect(state.term).toBe('KBA-Nummer')
        expect(state.hint).toBeNull()
        expect(w.findAll('[data-token]')).toHaveLength(KEYS.length)
    })

    it.each([
        ['an ET of zero', `ET${NBSP}0`],
        ['a negative ET', `ET${NBSP}−12`],
        ['an ET that cannot be read', 'ET k. A.'],
    ])('never sends the reader to an ET dimension the drawing leaves out — %s', async (_case, et) => {
        const w = mountSection({ ...PRODUCT, facts: { ...FACTS, et } })
        const state = await choose(w, 'et')

        // The value keeps its chip and its sentence: only the pointer to the drawing goes.
        expect(state.pressed).toEqual(['et'])
        expect(state.term).toBe('Einpresstiefe (ET)')
        expect(state.sentence).toContain(et)

        // The drawing carries no ET dimension at all, so nothing may point at one.
        expect(w.findAll('.rc-sch__dim[data-dim="et"]')).toHaveLength(0)
        expect(state.dim).toBeNull()
        expect(state.hint).toBe('Auf dem Foto nicht zu sehen.')
        expect(state.hint).not.toContain('Schnittzeichnung')
        expect(w.get('.rc-sch__svg').attributes('aria-label')).not.toContain('Einpresstiefe')
    })

    it('keeps the pointer to the drawing for a positive ET, which it does draw', async () => {
        const w = mountSection()
        const state = await choose(w, 'et')

        expect(w.findAll('.rc-sch__dim[data-dim="et"]')).toHaveLength(1)
        expect(state.dim).toBe('et')
        expect(state.hint).toBe('Auf dem Foto nicht zu sehen – die Schnittzeichnung zeigt die Einpresstiefe.')
    })

    it('drops the value entirely when the server sends no KBA number', () => {
        const w = mountSection({ ...PRODUCT, facts: { ...FACTS, kba: null } })

        expect(w.findAll('[data-token]').map((b) => b.attributes('data-token'))).toEqual(['width', 'diameter', 'et', 'lk', 'mlb'])
        expect(w.text()).not.toContain('KBA')
    })

    it('previews a value under a mouse without choosing it, and returns to the chosen one', async () => {
        media(true)

        const w = mountSection()
        await choose(w, 'mlb')

        pointer(w.get('[data-token="kba"]').element, 'pointerenter')
        await nextTick()

        const previewing = shownIn(w)
        expect(previewing.term).toBe('KBA-Nummer')
        expect(previewing.marker).toBe('rect/kba')
        expect(previewing.hint).toBe('Markiert: die KBA-Nummer auf dem Rad.')
        // Hovering shows a value; it does not choose it.
        expect(previewing.pressed).toEqual(['mlb'])

        pointer(w.get('.rc__tokens').element, 'pointerleave')
        await nextTick()

        const back = shownIn(w)
        expect(back.term).toBe('Mittenlochbohrung')
        expect(back.marker).toBe('circle/mlb')
    })
})
