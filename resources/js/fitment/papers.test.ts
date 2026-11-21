import { describe, expect, it } from 'vitest'
import * as papers from './papers'
import { ABNAHME_REQUIRED, ENTRY_REQUIRED, PAPERS_EXEMPT, entryBySize, entryLine, papersLine, papersLines } from './papers'

/** The PHP twin's four cases (App\Domain\Fitment\Verdict\PapersWording), word for word. */
describe('papers', () => {
    it('keeps the words the shop always had where the document says nothing of § 15 FZV', () => {
        expect(entryLine(true, false)).toBe(ENTRY_REQUIRED)
        expect(entryLine(false, false)).toBeNull()
        expect(papersLine(false)).toBeNull()
    })

    it('names the Abnahme as what it is where the document frees the papers, and says so on its own line', () => {
        expect(entryLine(true, true)).toBe(ABNAHME_REQUIRED)
        expect(entryLine(false, true)).toBeNull()
        expect(papersLine(true)).toBe(PAPERS_EXEMPT)
    })

    // D-486 (the client's round of 18.11.2026, item 4): only what a code requires is said, never its opposite.
    it('never says „Keine Eintragung“ or „Keine Abnahme“, and names only the sizes that need one', () => {
        expect(Object.keys(papers)).not.toContain('NO_ENTRY')
        expect(Object.keys(papers)).not.toContain('NO_ABNAHME')
        expect(Object.keys(papers)).not.toContain('entryLineOrNone')
        expect(papersLines({ sellable: true, requiresEntry: false })).toEqual([])
        expect(papersLines({ sellable: true, requiresEntry: false, papersExempt: true })).toEqual([PAPERS_EXEMPT])
        expect(papersLines({ sellable: true, requiresEntry: true })).toEqual([ENTRY_REQUIRED])
        expect(entryBySize([{ size: '255/40 R19', entry: true }, { size: '235/45 R19', entry: false }], false)).toBe('Eintragung in die Fahrzeugpapiere erforderlich mit 255/40 R19.')
    })

    it('keeps „§“ and its number together on one line', () => {
        expect(ABNAHME_REQUIRED).toContain('§ 19 Abs. 3 StVZO')
        expect(PAPERS_EXEMPT).toContain('§ 15 FZV')
    })
})
