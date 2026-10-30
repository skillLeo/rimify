// The client's second list, „Rimify Admin Changes“ (his PDF „Rimify Admin 2.0“, 18 points — rows 19 to 34 of his
// template are empty and stay so), as docs/review/ADMINLISTE.md shows it to him: numbered 201–218 for his 1–18, since his
// storefront list is 1–34, our public findings are 100+ and our admin findings 500+ (the operator's brief „THE ADMIN
// ROUND“). His wish in his words, what the admin does now in one sentence, and the state a passing test earns — with both
// pictures where the item is something to look at (`pictures: false`: an item whose answer is that nothing changes).
// Written by the same run as KUNDENLISTE (`npm run adminliste`, run.mjs --liste=admin).

export const STATES = {
    erledigt: 'umgesetzt; der Test dazu besteht, und die Bilder zeigen es',
    'anders gelöst': 'umgesetzt, aber anders als vorgeschlagen; warum, steht in der Zeile',
    'kein Fehler': 'geprüft, und es gibt nichts zu beheben – die Zeile sagt, wie geprüft wurde; der Test dazu besteht',
    Rückfrage: 'dazu brauchen wir noch eine Antwort von dir',
    offen: 'noch nicht fertig, oder der Test dazu besteht nicht – die Zeile sagt, was fehlt',
}

export const ITEMS = [
    {
        nr: 201,
        wish: 'Fahrzeug von Hand anlegen',
        now: 'Unter Fahrzeuge › „Neues Fahrzeug“ legst du ein Fahrzeug aus seiner Zulassungsbescheinigung Teil I an; es gilt als von Hand geprüft und steht sofort in der Fahrzeugauswahl. Fehlen die Achslasten, sagt das Formular vor dem Speichern, was das bedeutet, und das Fahrzeug steht unter „Zur Prüfung“, bis du sie einträgst.',
        state: 'erledigt',
    },
    {
        nr: 202,
        wish: 'Import der Fahrzeugdaten, aufgebaut auf euren Demodaten; ohne Lochkreis – das Feld bleibt leer',
        now: 'Eure Demodatei liegt uns nicht vor, deshalb liest der Import jede CSV- oder Excel-Datei: Beim ersten Mal ordnest du ihre Spalten zu, danach merkt er sich die Zuordnung je Quelle. Unter Fahrzeuge › Import zeigt der Probelauf zuerst mit Zahlen, was neu ist, was sich ändert und was abgelehnt wird; erst dann importierst du. Ein Fahrzeug erkennt der Import an HSN, TSN und Variante, und von Hand angelegte Fahrzeuge und solche aus einem Gutachten überschreibt er nie. Einen Lochkreis braucht er nicht.',
        state: 'anders gelöst',
    },
    {
        nr: 203,
        wish: 'Beim Anlegen von Hand HSN, TSN und die weiteren Fahrzeugdaten eintragen',
        now: 'Mit 201: HSN (2.1), TSN (2.2), Hersteller (D.1), Modell (D.3), Variante, Fahrzeugtyp (D.2), EG-Typgenehmigungsnummer (K), Leistung (P.2), Bauzeit, Karosserie, Antrieb, Achslasten (8.1, 8.2) und Höchstgeschwindigkeit (T) – jedes Feld mit seiner Nummer aus den Papieren.',
        state: 'erledigt',
    },
    {
        nr: 204,
        wish: '„Felgen-Typenbezeichnung“ beim Anlegen einer Felge Pflicht, nicht optional',
        now: 'Im Formular legst du keine Felge mehr ohne Radtypenbezeichnung an, und ohne sie wird keine Felge mehr veröffentlicht. Felgen von vorher und neue aus dem Lieferantenimport ohne diese Spalte lassen sich weiter speichern; die Felgenliste sammelt sie unter „Radtypenbezeichnung: Fehlt noch“, damit du sie nachtragen kannst.',
        state: 'erledigt',
    },
    {
        nr: 205,
        wish: 'Feld „Typenbezeichnung“ in „Radtypenbezeichnung“ umbenennen und in den Produktnamen aufnehmen',
        now: 'Das Feld heißt jetzt „Radtypenbezeichnung“ und gehört zum Namen der Felge – im Shop und in der Überschrift der Felge im Admin.',
        state: 'erledigt',
    },
    {
        nr: 206,
        wish: 'Die Radtypenbezeichnung zusammen mit Marke und Modell im Felgennamen',
        now: 'Im Shop heißt eine Felge jetzt Marke, Modell und Radtypenbezeichnung – auf den Karten, der Produktseite, im Warenkorb, in neuen Bestellungen und im RIMIFY-Check –, sobald ihre Radtypenbezeichnung eingetragen ist und unter „Titel im Shop“ nichts anderes steht. So findet ein Kunde die Felge im Gutachten wieder.',
        state: 'erledigt',
    },
    {
        nr: 207,
        wish: 'Keinen Lagerbestand als Zahl, nur „verfügbar“ und „nicht verfügbar“',
        now: 'Statt einer Stückzahl hat jede Größe jetzt den Status „Verfügbar“ oder „Nicht verfügbar“. Bei „Nicht verfügbar“ zeigen Karte und Produktseite „Anfrage“ statt „In den Warenkorb“. Ein Klick darauf öffnet das Kontaktformular, schon ausgefüllt mit Felge, Größe, ET und dem gewählten Fahrzeug. Felgen werden nicht mehr gezählt: Die Mengenauswahl richtet sich nach keinem Bestand, und eine Bestellung bucht nichts ab. Steht in der Lieferantendatei eine Stückzahl, wird sie beim Import zu „Verfügbar“ (ab 1) oder „Nicht verfügbar“ (0).',
        state: 'erledigt',
        commits: ['e5549e4f'],
    },
    {
        nr: 208,
        wish: 'Feste Bereifungskombinationen im Teilegutachten, mit Auflagen je Achse',
        now: 'Am Gutachten trägst du unter „Bereifungskombinationen“ die Liste ein, wie sie gedruckt ist – Nummer, vorne, hinten, Seite –, und sobald sie da ist, bietet der Shop nur diese Paare an. Die Auflagen je Achse stehen an den Reifengrößen der Zeile, jede mit ihrer Achse; die Codes nimmst du so, wie das Gutachten sie druckt, auch mit Klammer: 0), R), 13), 16a). Ob dein Gutachten drei oder vier Kombinationen nennt, klären wir noch mit dir.',
        state: 'erledigt',
        commits: ['16b758ae', '174634cb'],
        // His preview's example ABE 55255 predates the section (seeded 14.10, D-256 on 16.10): nothing is entered there, and
        // entering it takes a draft — a write. The pass checks the section and its empty state and records the list not measured.
        previewNote: 'Built and tested on our test shop. On your preview the section is there, but the example ABE 55255 predates it and has no combinations entered, and entering them needs a draft, which our tests never create there: enter your document’s combinations in a draft to see the shop offer only those.',
    },
    {
        nr: 209,
        wish: 'Getrennte Felder für Lastindex und Geschwindigkeitsindex statt eines Felds',
        now: 'Neben jeder Reifengröße stehen Lastindex und Geschwindigkeitssymbol in zwei eigenen Feldern: der Lastindex als Zahl, das Symbol aus der Liste von L bis (Y). Fügst du eine Größe so ein, wie das Gutachten sie druckt – „245/35 R19 93Y“ –, verteilen sich die Angaben beim Verlassen des Felds von selbst, und ein Paar für vorne und hinten wird zu zwei Zeilen. Geprüft werden beide beim Speichern und noch einmal bei der Freigabe.',
        state: 'erledigt',
        // The acceptance run's pass on his preview stops at every save point; this form opens only on a draft, and a draft
        // is a write there (tests/abnahme/admin.spec.ts).
        previewNote: 'Built and tested on our test shop. On your preview the two fields open only in a draft Gutachten’s entry form, and our tests create no drafts there: open one of your drafts to see them.',
    },
    {
        nr: 210,
        wish: 'Ein Bereich für Reifen im Admin: Marke, Größen, Saison … anlegen und verwalten',
        now: 'Unter Katalog › Reifen legst du jeden Reifen an, eine Größe eines Profils nach der anderen: Marke, Profil, Saison, Größe mit Lastindex und Geschwindigkeitssymbol, das EU-Reifenlabel mit Kraftstoffeffizienz, Nasshaftung, Rollgeräusch, Schnee- und Eisgriffigkeit und EPREL-Nummer, Preis und Verfügbarkeit. „Weitere Größe anlegen“ übernimmt Marke, Profil und Saison. Angeboten wird ein Reifen als Komplettrad nur, solange er verfügbar ist und sein EU-Reifenlabel vollständig eingetragen ist. Über der Liste steht, bei wie vielen Reifen am EU-Reifenlabel noch etwas fehlt; ein Klick zeigt nur diese. Einen Bestand zählt der Shop auch bei Reifen nicht mehr: Ein Reifen ist verfügbar oder nicht verfügbar, wie eine Felge.',
        state: 'erledigt',
    },
    {
        nr: 211,
        wish: 'Blog: Fotos hochladen und HTML für Abschnitte, z. B. für Tabellen',
        now: 'Ein Artikel besteht aus Bausteinen in beliebiger Reihenfolge: Abschnitt, Bild, Tabelle, Zitat und jetzt auch „HTML-Abschnitt“. Der „HTML-Abschnitt“ lässt, wie vorgeschlagen, nur eine feste Liste zu: Überschriften, Absätze, Listen, Tabellen, Links, Bilder sowie Fett- und Kursivschrift. Alles andere entfernt der Shop beim Speichern und noch einmal bei der Ausgabe, damit kein fremder Code auf die Seite kommt.',
        state: 'erledigt',
        commits: ['1c5645bd'],
    },
    {
        nr: 212,
        wish: 'Eine Blogseite, auf der alle Artikel stehen (für Admin und Besucher)',
        now: 'Der Ratgeber hat im Admin eine eigene Seite unter Inhalte › Ratgeber. Dort kannst du Artikel suchen, sortieren, anlegen, bearbeiten, veröffentlichen, zurückziehen und löschen. Alte Adressen leiten dorthin um. Unter /blog stehen alle veröffentlichten Artikel, die neuesten zuerst. Ein Link im Footer führt zu dieser Seite.',
        state: 'erledigt',
        commits: ['6e629692'],
    },
    {
        nr: 213,
        wish: 'Katalog › Felgen: der Standardtitel einer neuen Felge aus Marke, Modell und Typenbezeichnung',
        now: 'Der Titel setzt sich von selbst aus Marke, Modell und Radtypenbezeichnung zusammen. Unter „Titel im Shop“ kannst du ihn anders schreiben; dann bleibt er so, auch wenn sich Modell oder Radtypenbezeichnung später ändern. Die Felgenliste markiert ihn mit „Titel weicht ab“; im Formular übernimmst du den zusammengesetzten Titel mit einem Klick.',
        state: 'erledigt',
    },
    {
        nr: 214,
        wish: 'Für jede Felge automatisch ein Google-JSON-LD (Product)',
        pictures: false,
        now: 'Jede Felgenseite trägt im Kopf ihre strukturierten Daten für Google (JSON-LD): die Felge mit Marke, Namen, Beschreibung und Fotos, darunter jede Größe und Farbe als eigenes Produkt mit Artikelnummer, EAN, Preis und Verfügbarkeit. Bewertungen stehen nur darin, wo Käufer echte abgegeben haben, die Versandkosten, sobald du sie unter Einstellungen › Verkäufer & Versand eingetragen hast. Die Lieferzeit steht noch nicht darin: Google will Bearbeitungs- und Versandzeit getrennt, die Einstellungen kennen eine Spanne. Rückgaberegeln kommen hinein, sobald deine Angaben dazu da sind. Beispielfelgen bekommen keine. Zum Prüfen: Auf der Seite einer Felge im Admin zeigt „JSON-LD anzeigen“ genau diesen Block. Kopier ihn mit „Code kopieren“ und füg ihn in Googles Test für Rich-Suchergebnisse im Reiter „Code“ ein. Die Vorschau selbst kann Google nicht abrufen.',
        state: 'erledigt',
        commits: ['5c6511b1'],
    },
    {
        nr: 215,
        wish: 'Unter Gutachten › Dokumente die „Tragfähigkeit bei hoher Geschwindigkeit“ nicht brauchen',
        now: 'Die Tabelle erscheint nur noch bei einem Gutachten, das laut den eingetragenen Angaben eine druckt – dort verlangt die Freigabe sie. Bei allen anderen steht an ihrer Stelle eine eingeklappte Zeile, „Keine Tabelle hinterlegt“. Entfernt haben wir sie nicht: Bei einem Gutachten wie der ABE 55255, das sie druckt, entscheidet sie bei Autos mit mehr als 210 km/h Höchstgeschwindigkeit, welche Reifen zulässig sind.',
        state: 'anders gelöst',
    },
    {
        nr: 216,
        wish: 'Eine neue Felge erscheint nicht, weil der Browser alte Antworten hält – Listen und Fahrzeuge nicht zwischenspeichern',
        now: 'Der Shop weist Browser und Hoster an, keine seiner Seiten mehr zwischenzuspeichern. Jede Änderung am Katalog gilt sofort, auch für die Fahrzeugliste, die Zahlen und die Suche; eine Seite, die „Zurück“ wieder zeigt, fragt nach und lädt sich neu, wo sich etwas geändert hat.',
        state: 'erledigt',
    },
    {
        nr: 217,
        wish: 'Rechnungserstellung entfernen',
        pictures: false,
        now: 'Teil 1 ist umgesetzt: Der Shop erstellt, nummeriert und erwähnt keine eigenen Rechnungen mehr. Rechnungen, die er schon erstellt hat, bleiben lesbar. Teil 2 ist gebaut: Für jede Bestellung, die über Stripe bezahlt wird, stellt Stripe die Rechnung aus – jede Position mit 19 % MwSt. Sobald Stripe sie erstellt hat, verlinken die Bestätigungsseite und die Bestell-E-Mail darauf. Jede Nacht um 3:15 Uhr legt der Shop alle Rechnungen des Vortags als PDF in deinem S3-Speicher ab. Was in Stripe einzustellen ist und welche Angaben nach § 14 UStG dein Steuerberater klären sollte, steht in STRIPE-RECHNUNGEN.md. Zeigen können wir das auf der Vorschau, sobald dort Stripe im Testmodus angebunden und ein Bucket in Frankfurt eingerichtet ist.',
        state: 'offen',
        commits: ['8b1557d1', '06abcef1', 'cbb9eaca'],
    },
    {
        nr: 218,
        wish: 'Bestätigungslink unsicher: fortlaufende Nummer wie /bestellung/RMF-2026-XXXX – stattdessen Hash oder UUID, und befristet',
        now: 'Der Link zu einer Bestellung enthält jetzt statt der Bestellnummer eine zufällige Kennung (UUID) und ist weiterhin signiert. Ein Link mit der Bestellnummer öffnet keine Bestellung mehr. Die Bestellnummer hat überall die Form 2610-10487, auch bei Stripe. Die Suche im Admin findet sie mit und ohne Bindestrich, ebenso alte RMF-Nummern.',
        state: 'erledigt',
        pictures: false,
        commits: ['6e8848fb'],
    },
    {
        // His reply to item 8 (the operator's brief of 29.10.2026, Batch 2): a nineteenth point of his own.
        nr: 219,
        wish: 'Bereifungskombinationen je EG-Typgenehmigungsnummer einstellbar',
        now: 'Im Gutachten wählst du zuerst den Fahrzeugtyp über seine EG-Typgenehmigungsnummer und trägst dann seine Bereifungskombinationen ein. „Kombinationen kopieren von …“ übernimmt die Liste einer anderen Nummer zum Prüfen, „Auf mehrere EG-Nummern anwenden“ trägt eine Kombination bei mehreren Nummern auf einmal ein. Im Shop bekommt ein Fahrzeug die Liste der Nummer, die sein Feld K umfasst – nie weiter gefasst, als das Gutachten sie druckt; passt keine, sind seine Reifen „Noch nicht bestätigt“. Die bisherigen Listen stehen jetzt bei jeder Nummer ihres Gutachtens, markiert mit „Übernommen, bitte prüfen“; geändert hat sich dadurch kein Urteil. Auf der Vorschau zu sehen an der Beispiel-ABE 55255 mit ihren drei EG-Nummern und an deiner ABE mit der übernommenen Liste. Ein Gutachten mit zwei EG-Nummern und verschiedenen Kombinationen – auch vorne und hinten verschieden, mit „16a)“ – liegt uns nicht vor. Schick uns eines, dann tragen wir es ein.',
        state: 'erledigt',
        commits: ['0ff1e2ca'],
    },
]

/**
 * What each item does now, for his sheet's Description cell — in the language of his sheet (English), for a shop owner,
 * one sentence each like his storefront list's (the operator's brief of 19.10.2026 §4.4); the detail is in ADMINLISTE.md.
 */
export const NOTES = {
    201: 'Vehicles › „Neues Fahrzeug“ stores a car typed from its registration certificate as checked by hand and puts it in the vehicle selector at once; without its axle loads the form says before saving what that means, and the car waits under „Zur Prüfung“ until they are entered.',
    202: 'Solved differently, as your demo file is not with us: the import reads any CSV or Excel file, you map its columns once per source, a dry run shows what would be new, changed or refused before any car is imported, and cars typed by hand or taken from a Gutachten are never overwritten; please send us your demo file so we can check the mapping against it.',
    203: 'Together with 201, the form has every field of your list, each labelled with its number in the papers (2.1, 2.2, D.1, D.3, D.2, K, P.2, 8.1, 8.2, T).',
    204: 'A rim can no longer be created in the form or published without its Radtypenbezeichnung; rims saved before, and new ones from a supplier file without that column, still save and are gathered in the rim list under „Radtypenbezeichnung: Fehlt noch“ for you to fill in.',
    205: 'The field is now called „Radtypenbezeichnung“ and is part of the rim’s name, in the shop and in the rim’s heading in the admin.',
    206: 'In the shop a rim is now named brand + model + Radtypenbezeichnung — on cards, the product page, the basket, new orders and the RIMIFY-Check — once its Radtypenbezeichnung is entered and no other title is typed under „Titel im Shop“, so a customer can find it in the Gutachten.',
    207: 'Each size is now „Verfügbar“ or „Nicht verfügbar“ instead of a stock count; an unavailable size shows „Anfrage“ instead of the basket button, on its card and its page, and opens the contact form filled in with the rim, size, ET and the chosen car.',
    208: 'Each Gutachten has a „Bereifungskombinationen“ section where you enter the combinations as printed (number, front, rear, page), and the shop then offers only those pairs, with conditions per axle entered under each tyre size and codes typed as printed, such as 0), R), 13), 16a); we still need you to confirm whether your document lists three or four combinations.',
    209: 'Beside each tyre size, load index and speed symbol have fields of their own, a size pasted as the Gutachten prints it („245/35 R19 93Y“) splits into them by itself, and both are checked when you save and again at release.',
    210: 'Catalogue › Reifen holds each tyre as one size of one profile with its EU tyre label, price and availability, a tyre goes into a complete wheel only while it is available and its label is complete, and one click lists the tyres whose label is still incomplete.',
    211: 'Articles now also take an „HTML-Abschnitt“ limited to the agreed list (headings, paragraphs, lists, tables, links, images, bold, italic); everything else is removed on save and again on output.',
    212: 'The Ratgeber has its own admin page under Inhalte › Ratgeber with search, sorting, create, edit, publish, withdraw and delete; old addresses redirect there, and /blog lists every published article.',
    213: 'The title composes itself from brand, model and Radtypenbezeichnung; a title typed otherwise under „Titel im Shop“ stays, the rim list flags it „Titel weicht ab“, and in the form the composed title is one click away.',
    214: 'Every rim page carries structured data for Google (JSON-LD), each size and colour a product of its own with SKU, EAN, price and availability, ratings only from real reviews and the shipping cost once you have entered it under Einstellungen › Verkäufer & Versand; delivery time and returns are not in it yet.',
    215: 'Solved differently: the table is shown, and required at release, only on a Gutachten that according to its entered details prints one — like ABE 55255, where it decides the tyres for cars above 210 km/h — and everywhere else it folds to one line, „Keine Tabelle hinterlegt“.',
    216: 'The shop tells the browser and the host not to store its pages, so every change to the catalogue applies at once, and a page brought back with the Back button checks with the shop and reloads if anything changed.',
    217: 'Part 1 is done: the shop no longer creates, numbers or mentions its own invoices, and older ones stay readable; Stripe invoices with every line and 19 % VAT, and the daily copy to S3, come with the next release.',
    218: 'The order link now carries a random UUID and keeps its signature; a link with the order number finds nothing. Order numbers look like 2610-10487 everywhere, Stripe included, and the admin search finds them with or without the dash, old RMF numbers too.',
    219: 'Each Gutachten now takes its Bereifungskombinationen per EG-Typgenehmigungsnummer: choose the vehicle type and enter its list, copy another number’s list with „Kombinationen kopieren von …“, or put one combination on several numbers with „Auf mehrere EG-Nummern anwenden“; in the shop a car gets the list of the number its field K falls under, never more loosely than the Gutachten prints it, and „Noch nicht bestätigt“ where none does.',
}
