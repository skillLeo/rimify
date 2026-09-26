import { afterEach, describe, expect, it } from 'vitest'
import type { AdminNavGroup } from '../../types/admin'
import { pageEntries, readRecent, recentEntries, recentKey, rememberRecent, RECENT_KEY, search } from './palette'

/*
 * What the palette finds. The rules worth pinning: German words are found however the umlaut is
 * typed, a label that starts with the query comes first, and a recent page the viewer can no longer
 * open is dropped without a word.
 */

const NAV: AdminNavGroup[] = [
    { key: 'uebersicht', label: 'Übersicht', icon: 'grid', pages: [{ label: 'Übersicht', href: '/admin', icon: 'grid', count: null, countTone: 'neutral' }] },
    {
        key: 'katalog',
        label: 'Katalog',
        icon: 'box',
        pages: [
            { label: 'Wuchtgewichte-Farben', href: '/admin/wuchtgewichte', icon: 'wrench', count: null, countTone: 'neutral' },
            { label: 'RDKS-Sensorpreise', href: '/admin/rdks-preise', icon: 'shield', count: null, countTone: 'neutral' },
        ],
    },
    {
        key: 'gutachten',
        label: 'Gutachten',
        icon: 'document',
        pages: [
            { label: 'Dokumente', href: '/admin/gutachten', icon: 'document', count: null, countTone: 'neutral' },
            { label: 'Benachrichtigungswünsche', href: '/admin/benachrichtigungen', icon: 'mail', count: 4, countTone: 'neutral' },
        ],
    },
]

const labels = (entries: { label: string }[]): string[] => entries.map((e) => e.label)

afterEach(() => window.localStorage.clear())

describe('pageEntries', () => {
    it('lists every page with its group as the sub line, the profile last, and a g shortcut where one is bound', () => {
        const entries = pageEntries(NAV, { '/admin/gutachten': 'g' })

        expect(labels(entries)).toEqual(['Übersicht', 'Wuchtgewichte-Farben', 'RDKS-Sensorpreise', 'Dokumente', 'Benachrichtigungswünsche', 'Profil'])
        expect(entries[0]?.sub).toBeNull()
        expect(entries[3]).toMatchObject({ sub: 'Gutachten', keys: ['G', 'G'], href: '/admin/gutachten' })
    })
})

describe('search', () => {
    const entries = pageEntries(NAV)

    it('finds a German word however the umlaut is typed', () => {
        expect(labels(search(entries, 'übersicht'))).toEqual(['Übersicht'])
        expect(labels(search(entries, 'ubersicht'))).toEqual(['Übersicht'])
        expect(labels(search(entries, 'Uebersicht'))).toEqual(['Übersicht'])
        expect(labels(search(entries, 'wunsche'))).toEqual(['Benachrichtigungswünsche'])
    })

    it('finds a page by its group, and needs every word typed', () => {
        expect(labels(search(entries, 'katalog'))).toEqual(['Wuchtgewichte-Farben', 'RDKS-Sensorpreise'])
        expect(labels(search(entries, 'katalog rdks'))).toEqual(['RDKS-Sensorpreise'])
    })

    it('puts a label that starts with the query before one that merely contains it', () => {
        expect(labels(search(entries, 'farben'))).toEqual(['Wuchtgewichte-Farben'])
        expect(labels(search(entries, 'd'))[0]).toBe('Dokumente')
    })

    it('returns nothing for nonsense, and everything for an empty query', () => {
        expect(search(entries, 'qqq')).toEqual([])
        expect(search(entries, '   ')).toHaveLength(entries.length)
    })
})

describe('recent pages', () => {
    it('keeps the five most recent, newest first, each once', () => {
        for (const href of ['/a', '/b', '/c', '/d', '/e', '/f', '/b']) {
            rememberRecent({ href, label: href })
        }

        expect(readRecent().map((r) => r.href)).toEqual(['/b', '/f', '/e', '/d', '/c'])
    })

    it('keeps each account\'s recent pages apart', () => {
        rememberRecent({ href: '/admin/rollen', label: 'Rollen & Rechte' }, recentKey('mara@example.test'))
        rememberRecent({ href: '/admin/gutachten', label: 'Dokumente' }, recentKey('nils@example.test'))

        expect(readRecent(recentKey('mara@example.test')).map((r) => r.href)).toEqual(['/admin/rollen'])
        expect(readRecent(recentKey('NILS@example.test')).map((r) => r.href)).toEqual(['/admin/gutachten'])
        expect(readRecent()).toEqual([])
    })

    it('reads garbage as nothing rather than throwing', () => {
        window.localStorage.setItem(RECENT_KEY, '{nope')
        expect(readRecent()).toEqual([])

        window.localStorage.setItem(RECENT_KEY, JSON.stringify([{ href: 1 }, { href: '/admin', label: 'Übersicht' }]))
        expect(readRecent()).toEqual([{ href: '/admin', label: 'Übersicht' }])
    })

    it('drops a page the viewer can no longer open, and the page they are on', () => {
        const recent = [
            { href: '/admin/gutachten', label: 'Dokumente' },
            { href: '/admin/rollen', label: 'Rollen & Rechte' },
            { href: '/admin', label: 'Übersicht' },
        ]

        expect(labels(recentEntries(recent, pageEntries(NAV), '/admin'))).toEqual(['Dokumente'])
    })
})
