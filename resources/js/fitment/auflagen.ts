/**
 * How a listing card and a basket line show a verdict's Auflagen where room is short (D-197).
 *
 * The sentences stand in full while they are few and short — the one-line Auflagen the cards were drawn for. A real
 * Gutachten's sentences run to paragraphs (ABE 55255's V19 names 27 tyre pairings in one): printed whole, a listing card
 * was 2.500 px tall and a phone's basket 9.900. There they are counted, and the wording stands one step away — on the
 * product page for a card, unfolded in place for a basket line. No sentence is ever cut short, and the verdict's badge
 * and the papers' line stay where they are: only the long text moves.
 */

export interface Room {
    sentences: number
    characters: number
}

/** A listing card: two short sentences. */
export const CARD_ROOM: Room = { sentences: 2, characters: 160 }

/** A basket line: three sentences of ordinary length. */
export const LINE_ROOM: Room = { sentences: 3, characters: 420 }

export function fitsWhole(conditions: string[], room: Room): boolean {
    return conditions.length <= room.sentences && conditions.join(' ').length <= room.characters
}

/**
 * `9 Auflagen und Hinweise aus dem Gutachten` — the list holds both kinds — and, where the server says every one of
 * them is a Hinweis (#23), `3 Hinweise aus dem Gutachten`.
 *
 * A single sentence is `1 Auflage oder Hinweis aus dem Gutachten`: which of the two it is, neither caller is told. A
 * card counts the sentences common to every size while its badge speaks for all of them, and `notesOnly` is also false
 * for an Eintragung or an open tyre answer — so „1 Auflage“ could name a Hinweis. The count never claims a kind.
 */
export function countedDe(count: number, notesOnly = false): string {
    if (notesOnly) {
        return count === 1 ? '1 Hinweis aus dem Gutachten' : `${count} Hinweise aus dem Gutachten`
    }

    return count === 1 ? '1 Auflage oder Hinweis aus dem Gutachten' : `${count} Auflagen und Hinweise aus dem Gutachten`
}
