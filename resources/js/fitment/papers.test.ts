import { describe, expect, it } from 'vitest'
import { ABNAHME_REQUIRED, ENTRY_REQUIRED, NO_ABNAHME, NO_ENTRY, PAPERS_EXEMPT, entryLine, entryLineOrNone, papersLine } from './papers'

/** The PHP twin's four cases (App\Domain\Fitment\Verdict\PapersWording), word for word. */
describe('papers', () => {
    it('keeps the words the shop always had where the document says nothing of § 15 FZV', () => {
        expect(entryLine(true, false)).toBe(ENTRY_REQUIRED)
        expect(entryLine(false, false)).toBeNull()
        expect(entryLineOrNone(false, false)).toBe(NO_ENTRY)
        expect(papersLine(false)).toBeNull()
    })

    it('names the Abnahme as what it is where the document frees the papers, and says so on its own line', () => {
        expect(entryLine(true, true)).toBe(ABNAHME_REQUIRED)
        expect(entryLineOrNone(false, true)).toBe(NO_ABNAHME)
        expect(papersLine(true)).toBe(PAPERS_EXEMPT)
    })

    it('keeps „§“ and its number together on one line', () => {
        expect(ABNAHME_REQUIRED).toContain('§ 19 Abs. 3 StVZO')
        expect(PAPERS_EXEMPT).toContain('§ 15 FZV')
    })
})
