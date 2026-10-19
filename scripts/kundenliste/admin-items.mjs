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
        now: 'Statt einer Zahl hat jede Größe „Verfügbar“ oder „Nicht verfügbar“. Bei „Nicht verfügbar“ lässt sie sich nicht kaufen, und der Shop sagt das. Felgen werden nicht mehr gezählt: Die Mengenauswahl richtet sich nach keinem Bestand, und eine Bestellung bucht nichts ab. Eine Stückzahl aus der Lieferantendatei wird beim Import zu „Verfügbar“ (ab 1) oder „Nicht verfügbar“ (0). Die alte Zahl bleibt gespeichert, der Shop nutzt sie nicht mehr.',
        state: 'erledigt',
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
        now: 'Ein Artikel besteht jetzt aus Bausteinen, in beliebiger Reihenfolge: Abschnitt, Bild, Tabelle, Zitat. Ein Bild lädst du direkt im Artikel hoch. Es wird in unserem Speicher abgelegt und braucht eine Bildbeschreibung für Screenreader. Eine Tabelle tippst du Zelle für Zelle, mit Spaltenköpfen, 2 bis 6 Spalten. Freies HTML gibt es bewusst nicht: Darüber könnte fremder Code auf die Seite gelangen. Fehlt etwas, zeigt die Prüfung vor dem Veröffentlichen die Stelle.',
        state: 'anders gelöst',
    },
    {
        nr: 212,
        wish: 'Eine Blogseite, auf der alle Artikel stehen (für Admin und Besucher)',
        now: 'Unter /blog stehen alle veröffentlichten Artikel, neueste zuerst, und der Footer führt hin. Zwei Ratgeber sind veröffentlicht; der dritte – ABE, Teilegutachten, ECE – erscheint erst nach der Prüfung durch die Kanzlei.',
        state: 'erledigt',
        commits: ['c6ae0bfe'],
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
        now: 'Jede Felgenseite trägt im Kopf ihre strukturierten Daten für Google (JSON-LD): die Felge mit Marke, Namen, Beschreibung und Fotos, darunter jede Größe und Farbe als eigenes Produkt mit Artikelnummer, EAN, Preis und Verfügbarkeit. Bewertungen stehen nur darin, wo Käufer echte abgegeben haben, die Versandkosten, sobald du sie unter Einstellungen › Verkäufer & Versand eingetragen hast. Die Lieferzeit steht noch nicht darin: Google will Bearbeitungs- und Versandzeit getrennt, die Einstellungen kennen eine Spanne. Rückgaberegeln kommen hinein, sobald deine Angaben dazu da sind. Beispielfelgen bekommen keine.',
        state: 'erledigt',
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
        now: 'Noch nicht umgesetzt: Wir brauchen deine Antwort, wer die Rechnung ausstellt und ob der Shop eine Kopie behält, damit die Rechnungsnummern nur aus einem System kommen. Die Bestellbestätigung zeigt weiter Netto, Steuersatz, Steuer und Brutto.',
        state: 'Rückfrage',
    },
    {
        nr: 218,
        wish: 'Bestätigungslink unsicher: fortlaufende Nummer wie /bestellung/RMF-2026-XXXX – stattdessen Hash oder UUID, und befristet',
        now: 'Geprüft, auch mit gefälschter Signatur: Eine Bestellung aus dem Shop öffnet sich nur mit dem Link aus der Mail, im Browser, in dem sie aufgegeben wurde, oder im Kundenkonto. Der Link ist signiert und gilt zwölf Monate; danach schickt die Seite auf Wunsch einen neuen an die E-Mail-Adresse der Bestellung. Wer nur die Nummer kennt, sieht dieselbe Seite wie bei einer Nummer, die es nicht gibt. Mit der Nummer öffnen sich nur die Beispielbestellungen der Vorschau: Hinter ihnen steht kein echter Kunde, und sie verschwinden mit den Demodaten.',
        state: 'kein Fehler',
        pictures: false,
        commits: ['e4c2c0cd', 'cee57bf8'],
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
    207: 'Each size is now „Verfügbar“ or „Nicht verfügbar“ instead of a stock count: an unavailable size cannot be bought and the shop says so, an order books nothing off, and a quantity in the supplier file becomes „Verfügbar“ (1 or more) or „Nicht verfügbar“ (0) on import.',
    208: 'Each Gutachten has a „Bereifungskombinationen“ section where you enter the combinations as printed (number, front, rear, page), and the shop then offers only those pairs, with conditions per axle entered under each tyre size and codes typed as printed, such as 0), R), 13), 16a); we still need you to confirm whether your document lists three or four combinations.',
    209: 'Beside each tyre size, load index and speed symbol have fields of their own, a size pasted as the Gutachten prints it („245/35 R19 93Y“) splits into them by itself, and both are checked when you save and again at release.',
    210: 'Catalogue › Reifen holds each tyre as one size of one profile with its EU tyre label, price and availability, a tyre goes into a complete wheel only while it is available and its label is complete, and one click lists the tyres whose label is still incomplete.',
    211: 'Solved differently: an article is built from blocks in any order — section, image (uploaded into our own storage, with a description for screen readers), table (2 to 6 columns, typed cell by cell) and quote — with deliberately no free HTML, which could put someone else’s code on the site.',
    212: 'The blog at /blog lists every published article, newest first, and is linked from the footer; two guides are published, and the third (ABE, Teilegutachten, ECE) appears once the law firm has checked it.',
    213: 'The title composes itself from brand, model and Radtypenbezeichnung; a title typed otherwise under „Titel im Shop“ stays, the rim list flags it „Titel weicht ab“, and in the form the composed title is one click away.',
    214: 'Every rim page carries structured data for Google (JSON-LD), each size and colour a product of its own with SKU, EAN, price and availability, ratings only from real reviews and the shipping cost once you have entered it under Einstellungen › Verkäufer & Versand; delivery time and returns are not in it yet.',
    215: 'Solved differently: the table is shown, and required at release, only on a Gutachten that according to its entered details prints one — like ABE 55255, where it decides the tyres for cars above 210 km/h — and everywhere else it folds to one line, „Keine Tabelle hinterlegt“.',
    216: 'The shop tells the browser and the host not to store its pages, so every change to the catalogue applies at once, and a page brought back with the Back button checks with the shop and reloads if anything changed.',
    217: 'Not done yet: we need your answer on who issues the invoice and whether the shop keeps a copy.',
    218: 'Checked, also with a forged signature: an order opens only with the signed link from its e-mail (valid twelve months, then renewed to the order’s address on request), in the browser that placed it or in the customer account, and a bare order number shows the same page as one that does not exist; only the preview’s example orders open by number, and they go with the demo data.',
}
