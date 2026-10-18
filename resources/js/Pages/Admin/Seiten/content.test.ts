import { describe, expect, it } from 'vitest'
import type { PageContent, PageSchema } from '../../../types/admin/seiten'
import { blockLabel, changes, clickGuard, diff, emptyBlock, fieldId, length, move, overLimit, placeOf, repeatables } from './content'

/* The homepage and a guide, as PageSchema ships them (abridged to the fields the tests touch). */
const home: PageSchema = {
    page: [],
    blocks: [
        {
            type: 'hero',
            label: 'Einstieg',
            repeat: false,
            min: 1,
            max: 1,
            fields: [
                { key: 'headline', label: 'Überschrift', kind: 'text', required: true, max: 60 },
                { key: 'sub', label: 'Text unter der Überschrift', kind: 'textarea', required: true, max: 220 },
            ],
        },
        {
            type: 'promise_row',
            label: 'Versprechen-Zeile',
            repeat: false,
            min: 1,
            max: 1,
            fields: [],
            list: {
                key: 'items',
                label: 'Versprechen',
                itemLabel: 'Versprechen',
                one: 'ein Versprechen',
                min: 1,
                max: 4,
                fields: [
                    { key: 'icon', label: 'Symbol', kind: 'icon', required: true, max: null, options: [{ value: 'check', label: 'Haken' }] },
                    { key: 'title', label: 'Titel', kind: 'text', required: true, max: 40 },
                ],
            },
        },
    ],
}

const guide: PageSchema = {
    page: [{ key: 'title', label: 'Titel', kind: 'text', required: true, max: 90 }],
    blocks: [
        { type: 'guide_lead', label: 'Vorspann', repeat: false, min: 1, max: 1, fields: [{ key: 'teaser', label: 'Vorspann', kind: 'textarea', required: true, max: 200 }] },
        {
            type: 'prose',
            label: 'Abschnitt',
            repeat: true,
            min: 1,
            max: 30,
            fields: [
                { key: 'heading', label: 'Zwischenüberschrift', kind: 'text', required: true, max: 90 },
                { key: 'text', label: 'Text', kind: 'textarea', required: true, max: 5000 },
            ],
        },
        // The building blocks (D-306).
        {
            type: 'figure',
            label: 'Bild',
            repeat: true,
            min: 0,
            max: 12,
            fields: [
                { key: 'src', label: 'Bild', kind: 'image', required: true, max: null },
                { key: 'alt', label: 'Bildbeschreibung', kind: 'text', required: true, max: 200 },
            ],
        },
        {
            type: 'table',
            label: 'Tabelle',
            repeat: true,
            min: 0,
            max: 10,
            fields: [
                { key: 'caption', label: 'Tabellenüberschrift', kind: 'text', required: true, max: 120 },
                { key: 'head', label: 'Inhalt', kind: 'grid', required: true, max: 200 },
            ],
        },
        {
            type: 'quote',
            label: 'Zitat',
            repeat: true,
            min: 0,
            max: 10,
            fields: [{ key: 'text', label: 'Zitat', kind: 'textarea', required: true, max: 600 }],
        },
    ],
}

function homeContent(headline: string, titles: string[]): PageContent {
    return {
        title: 'Startseite',
        metaDescription: '',
        blocks: [
            { type: 'hero', data: { headline, sub: 'Unter der Überschrift.' } },
            { type: 'promise_row', data: { items: titles.map((title) => ({ icon: 'check', title })) } },
        ],
    }
}

function guideContent(title: string, headings: string[]): PageContent {
    return {
        title,
        metaDescription: '',
        blocks: [{ type: 'guide_lead', data: { teaser: 'Worum es geht.' } }, ...headings.map((heading) => ({ type: 'prose', data: { heading, text: 'Absatz.' } }))],
    }
}

describe('length', () => {
    it('counts characters the way the server does, an emoji as one', () => {
        expect(length('Felge')).toBe(5)
        expect(length('Größe 🚗')).toBe(7)
        expect(length(null)).toBe(0)
    })
})

describe('overLimit', () => {
    it('is over only past the limit, and never for a number', () => {
        const field = { key: 'headline', label: 'Überschrift', kind: 'text' as const, required: true, max: 5 }

        expect(overLimit(field, 'Felge')).toBe(false)
        expect(overLimit(field, 'Felgen')).toBe(true)
        expect(overLimit({ ...field, kind: 'number' }, 123456)).toBe(false)
    })
})

describe('changes', () => {
    it('names every changed place as the Protokoll does', () => {
        const before = homeContent('Felgen, die an dein Auto dürfen.', ['Passgenau', 'Gutachten'])
        const after = homeContent('Felgen mit Gutachten.', ['Passgenau', 'Das Gutachten', 'Montiert'])

        expect(changes(home, before, after)).toEqual(['Einstieg · Überschrift', 'Versprechen 2 · Titel', 'Versprechen 3 (neu)'])
    })

    it('says nothing when nothing changed', () => {
        const same = homeContent('Gleich', ['A'])

        expect(changes(home, same, homeContent('Gleich', ['A']))).toEqual([])
    })

    it('reads a moved, added or removed section by its place', () => {
        const before = guideContent('ET erklärt', ['Eins', 'Zwei', 'Drei'])

        expect(changes(guide, before, guideContent('ET erklärt', ['Zwei', 'Eins', 'Drei']))).toEqual([
            'Abschnitt 1 · Zwischenüberschrift',
            'Abschnitt 2 · Zwischenüberschrift',
        ])
        expect(changes(guide, before, guideContent('ET richtig lesen', ['Eins', 'Zwei']))).toEqual(['Titel', 'Abschnitt 3 (entfernt)'])
    })
})

describe('diff', () => {
    it('carries the words before and after, and a new place only its new words', () => {
        const before = homeContent('Alt', ['Passgenau'])
        const after = homeContent('Neu', ['Passgenau', 'Montiert'])

        expect(diff(home, before, after)).toEqual([
            { label: 'Einstieg · Überschrift', before: 'Alt', after: 'Neu' },
            { label: 'Versprechen 2 (neu)', before: '', after: 'Montiert' },
        ])
    })
})

describe('placeOf', () => {
    it('names the place of a publish-check error the way the diff names places', () => {
        const content = homeContent('Alt', ['Passgenau', 'Gutachten'])

        expect(placeOf(home, content.blocks, 'blocks.0.data.headline')).toBe('Einstieg · Überschrift')
        expect(placeOf(home, content.blocks, 'blocks.1.data.items.1.title')).toBe('Versprechen 2 · Titel')
        expect(placeOf(guide, guideContent('ET', ['Eins']).blocks, 'title')).toBe('Titel')
        expect(placeOf(home, content.blocks, 'blocks')).toBe('')
    })
})

describe('emptyBlock', () => {
    it('starts a section with every field present, and a list with one item', () => {
        expect(emptyBlock(guide.blocks[1]!)).toEqual({ type: 'prose', data: { heading: '', text: '' } })
        expect(emptyBlock(home.blocks[1]!)).toEqual({ type: 'promise_row', data: { items: [{ icon: 'check', title: '' }] } })
    })

    it('starts a picture without a file and a table with two columns and one row, as the server does @admin-211', () => {
        expect(emptyBlock(guide.blocks[2]!)).toEqual({ type: 'figure', data: { src: '', width: null, height: null, alt: '' } })
        expect(emptyBlock(guide.blocks[3]!)).toEqual({ type: 'table', data: { caption: '', head: ['', ''], rows: [['', '']] } })
    })
})

describe('the building blocks', () => {
    it('are the repeatable kinds, in the schema’s order @admin-211', () => {
        expect(repeatables(guide).map((block) => block.type)).toEqual(['prose', 'figure', 'table', 'quote'])
        expect(repeatables(home)).toEqual([])
    })

    it('number each kind among its own and name a table’s changed cells line by line @admin-211', () => {
        const table = (rows: string[][]): PageContent['blocks'][number] => ({ type: 'table', data: { caption: 'ET', head: ['ET', 'Wirkung'], rows } })
        const before: PageContent = { ...guideContent('ET', ['Eins']), blocks: [...guideContent('ET', ['Eins']).blocks, table([['30', 'breit']])] }
        const after: PageContent = { ...before, blocks: [...guideContent('ET', ['Eins']).blocks, table([['30', 'breiter']])] }

        expect(blockLabel(guide, after.blocks, 2)).toBe('Tabelle 1')
        expect(diff(guide, before, after)).toEqual([{ label: 'Tabelle 1 · Inhalt', before: 'ET | Wirkung\n30 | breit', after: 'ET | Wirkung\n30 | breiter' }])
        // A trailing space typed into a cell is no change, as the server stores it.
        expect(diff(guide, before, { ...before, blocks: [...guideContent('ET', ['Eins']).blocks, table([['30 ', 'breit']])] })).toEqual([])
    })

    // SEI-25: each kind among its own — a quote removed between two sections is the quote's removal, not theirs.
    it('names a removed quote as removed, and another order of the kinds as such @admin-211', () => {
        const quote = (text: string): PageContent['blocks'][number] => ({ type: 'quote', data: { text } })
        const [lead, eins, zwei] = guideContent('ET', ['Eins', 'Zwei']).blocks
        const base = guideContent('ET', [])
        const before: PageContent = { ...base, blocks: [lead!, eins!, quote('Erst die Papiere.'), zwei!] }

        expect(changes(guide, before, { ...base, blocks: [lead!, eins!, zwei!] })).toEqual(['Zitat 1 (entfernt)'])
        expect(diff(guide, before, { ...base, blocks: [lead!, quote('Erst die Papiere.'), eins!, zwei!] })).toEqual([
            { label: 'Reihenfolge der Bausteine', before: 'Vorspann, Abschnitt 1, Zitat 1, Abschnitt 2', after: 'Vorspann, Zitat 1, Abschnitt 1, Abschnitt 2' },
        ])
        expect(changes(guide, before, { ...base, blocks: [lead!, eins!, quote('Erst die Papiere.'), quote('Dann die Felge.')] })).toEqual([
            'Zitat 2 (neu)',
            'Abschnitt 2 (entfernt)',
        ])
    })

    it('names a picture by its file and a table’s row error at the table @admin-211', () => {
        const blocks: PageContent['blocks'] = [
            ...guideContent('ET', ['Eins']).blocks,
            { type: 'figure', data: { src: '/storage/blog/et/schnitt.webp', width: 1200, height: 800, alt: 'Schnitt' } },
            { type: 'table', data: { caption: 'ET', head: ['ET', ''], rows: [['30']] } },
        ]

        expect(diff(guide, { ...guideContent('ET', ['Eins']) }, { ...guideContent('ET', ['Eins']), blocks })[0]).toEqual({ label: 'Bild 1 (neu)', before: '', after: 'schnitt.webp\n\nSchnitt' })
        expect(placeOf(guide, blocks, 'blocks.3.data.rows')).toBe('Tabelle 1 · Inhalt')
        expect(placeOf(guide, blocks, 'blocks.2.data.src')).toBe('Bild 1 · Bild')
    })
})

describe('blockLabel', () => {
    it('numbers repeatable sections among themselves, not among all blocks', () => {
        const content = guideContent('ET', ['Eins', 'Zwei'])

        expect(blockLabel(guide, content.blocks, 0)).toBe('Vorspann')
        expect(blockLabel(guide, content.blocks, 2)).toBe('Abschnitt 2')
    })
})

describe('clickGuard', () => {
    it('takes one click of a double-click, and every key press @admin-211', () => {
        const settled = clickGuard()

        expect(settled(new MouseEvent('click', { detail: 1 }))).toBe(true)
        expect(settled(new MouseEvent('click', { detail: 2 }))).toBe(false)
        // A second pointer click at once — the browser counted it apart — is not taken either.
        expect(settled(new MouseEvent('click', { detail: 1 }))).toBe(false)
        // Enter on a button: focus followed the block, so a second press is a second step.
        expect(settled(new MouseEvent('click', { detail: 0 }))).toBe(true)
        expect(settled()).toBe(true)
    })
})

describe('move', () => {
    it('moves by one place and leaves the list alone at its ends', () => {
        expect(move(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c'])
        expect(move(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c'])
        expect(move(['a', 'b', 'c'], 2, 3)).toEqual(['a', 'b', 'c'])
    })
})

describe('fieldId', () => {
    it('turns a server error path into the id of its field', () => {
        expect(fieldId('blocks.1.data.items.0.title')).toBe('pg-blocks-1-data-items-0-title')
    })
})
