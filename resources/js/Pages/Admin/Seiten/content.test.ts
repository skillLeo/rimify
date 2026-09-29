import { describe, expect, it } from 'vitest'
import type { PageContent, PageSchema } from '../../../types/admin/seiten'
import { blockLabel, changes, diff, emptyBlock, fieldId, length, move, overLimit, placeOf } from './content'

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
})

describe('blockLabel', () => {
    it('numbers repeatable sections among themselves, not among all blocks', () => {
        const content = guideContent('ET', ['Eins', 'Zwei'])

        expect(blockLabel(guide, content.blocks, 0)).toBe('Vorspann')
        expect(blockLabel(guide, content.blocks, 2)).toBe('Abschnitt 2')
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
