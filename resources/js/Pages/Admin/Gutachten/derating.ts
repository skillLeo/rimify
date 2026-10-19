/**
 * The table of tyre load at speed on a Gutachten's page (his admin item 15, D-295): whole where the record says the
 * document prints one (D-277) — the release waits for it there — or where one is entered all the same; everywhere else
 * folded to one line, in finding 104's words, saying why none is asked for. Only what is on record (R-17): the answer
 * typed off the document, never what the document itself does or does not print.
 */

import type { RecordShape } from '../../../types/admin/gutachten'

type IndexSource = RecordShape['tyre_index_source']

/** Whether the section stands whole: the document prints one, as the record says — or a table is entered anyway. */
export function deratingShown(source: IndexSource, rows: number): boolean {
    return source === 'table' || rows > 0
}

/** The folded line: what is not recorded, why no table is asked for, and — while it can be entered — how to ask for it. */
export function deratingAbsent(source: IndexSource, mayEnter: boolean): string {
    const none = 'Zu diesem Gutachten ist keine Tragfähigkeitstabelle für hohe Geschwindigkeit hinterlegt.'
    const why = {
        document: 'Laut den Angaben stehen Lastindex und Geschwindigkeitssymbol bei jeder Reifengröße. Eine Tabelle erfasst du nur bei einem Gutachten, das laut den Angaben eine druckt.',
        papers: 'Laut den Angaben verweist es für Lastindex und Geschwindigkeitssymbol auf die Fahrzeugpapiere. Eine Tabelle erfasst du nur bei einem Gutachten, das laut den Angaben eine druckt.',
        table: '',
        '': 'Ob es eine druckt, gibst du unter „Angaben ändern“ an – in der Frage zu Lastindex und Geschwindigkeitssymbol.',
    }[source]
    const instead = mayEnter && (source === 'document' || source === 'papers') ? ' Druckt dieses Gutachten doch eine, wähl unter „Angaben ändern“ die Tabelle und trag sie dann hier ein.' : ''

    return `${none} ${why}${instead}`.trim()
}
