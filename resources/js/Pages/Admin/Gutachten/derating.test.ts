import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DeratingTable from './DeratingTable.vue'
import { deratingAbsent, deratingShown } from './derating'

const EMPTY = { sourcePage: null, seededFrom: null, symbols: [], rows: [] }

// His admin item 15: „we don't need the whole feature for ‚Tragfähigkeit bei hoher Geschwindigkeit‘“ — not removed, but
// off his screen wherever his document prints no such table.
describe('the table of tyre load at speed on a Gutachten’s page', () => {
    it('stands whole only where the record says the document prints one — or where one is entered all the same @admin-215', () => {
        expect(deratingShown('table', 0)).toBe(true)
        expect(deratingShown('papers', 0)).toBe(false)
        expect(deratingShown('document', 0)).toBe(false)
        expect(deratingShown('', 0)).toBe(false)
        // A table entered before the question existed is never hidden.
        expect(deratingShown('papers', 10)).toBe(true)
    })

    it('folds to one line in finding 104’s words, saying why none is asked for — never what the document prints @admin-215', () => {
        expect(deratingAbsent('papers', true)).toBe(
            'Zu diesem Gutachten ist keine Tragfähigkeitstabelle für hohe Geschwindigkeit hinterlegt. Laut den Angaben verweist es für Lastindex und Geschwindigkeitssymbol auf die Fahrzeugpapiere. Eine Tabelle erfasst du nur bei einem Gutachten, das laut den Angaben eine druckt. Druckt dieses Gutachten doch eine, wähl unter „Angaben ändern“ die Tabelle und trag sie dann hier ein.'
        )
        expect(deratingAbsent('document', false)).toBe(
            'Zu diesem Gutachten ist keine Tragfähigkeitstabelle für hohe Geschwindigkeit hinterlegt. Laut den Angaben stehen Lastindex und Geschwindigkeitssymbol bei jeder Reifengröße. Eine Tabelle erfasst du nur bei einem Gutachten, das laut den Angaben eine druckt.'
        )
        expect(deratingAbsent('', true)).toBe(
            'Zu diesem Gutachten ist keine Tragfähigkeitstabelle für hohe Geschwindigkeit hinterlegt. Ob es eine druckt, gibst du unter „Angaben ändern“ an – in der Frage zu Lastindex und Geschwindigkeitssymbol.'
        )
    })

    it('says the release waits for the table only where the document prints one @admin-215', () => {
        const required = mount(DeratingTable, { props: { documentId: 1, derating: EMPTY, editable: false, pageCount: 12, required: true } })
        const optional = mount(DeratingTable, { props: { documentId: 1, derating: EMPTY, editable: false, pageCount: 12, required: false } })

        expect(required.text()).toContain('Laut den Angaben druckt dieses Gutachten eine solche Tabelle. Ohne sie ist keine Freigabe möglich')
        expect(optional.text()).not.toContain('Ohne sie ist keine Freigabe möglich')
        expect(optional.text()).not.toContain('nicht bestätigen')
    })
})
