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
        now: 'Noch nicht gebaut – kommt als Nächstes, zusammen mit 203: ein Formular für ein Fahrzeug mit allem, was die Prüfung braucht.',
        state: 'offen',
    },
    {
        nr: 202,
        wish: 'Import der Fahrzeugdaten, aufgebaut auf euren Demodaten; ohne Lochkreis – das Feld bleibt leer',
        now: 'Noch nicht gebaut – kommt als Nächstes: ein Import, der zuerst einen Probelauf mit Zahlen zeigt und kein Fahrzeug überschreibt, das aus einem Gutachten stammt. Den Lochkreis braucht die Prüfung nicht: Ob eine Felge an ein Auto darf, sagt das Gutachten, nicht die Geometrie.',
        state: 'offen',
    },
    {
        nr: 203,
        wish: 'Beim Anlegen von Hand HSN, TSN und die weiteren Fahrzeugdaten eintragen',
        now: 'Noch nicht gebaut – kommt mit 201.',
        state: 'offen',
    },
    {
        nr: 204,
        wish: '„Felgen-Typenbezeichnung“ beim Anlegen einer Felge Pflicht, nicht optional',
        now: 'Noch nicht gebaut: Für neue Felgen wird die Radtypenbezeichnung Pflicht, und eine Liste zeigt die vorhandenen Felgen, bei denen sie noch fehlt.',
        state: 'offen',
    },
    {
        nr: 205,
        wish: 'Feld „Typenbezeichnung“ in „Radtypenbezeichnung“ umbenennen und in den Produktnamen aufnehmen',
        now: 'Noch nicht gebaut – kommt mit 204.',
        state: 'offen',
    },
    {
        nr: 206,
        wish: 'Die Radtypenbezeichnung zusammen mit Marke und Modell im Felgennamen',
        now: 'Noch nicht gebaut – kommt mit 204.',
        state: 'offen',
    },
    {
        nr: 207,
        wish: 'Keinen Lagerbestand als Zahl, nur „verfügbar“ und „nicht verfügbar“',
        now: 'Noch nicht gebaut: Die Zahl fällt weg. Bei „nicht verfügbar“ lässt sich die Felge nicht kaufen, und der Shop sagt das. Die Mengenauswahl richtet sich dann nicht mehr nach dem Bestand.',
        state: 'offen',
    },
    {
        nr: 208,
        wish: 'Feste Bereifungskombinationen im Teilegutachten, mit Auflagen je Achse',
        now: 'Am Gutachten trägst du unter „Bereifungskombinationen“ die Liste ein, wie sie gedruckt ist – Nummer, vorne, hinten, Seite –, und sobald sie da ist, bietet der Shop nur diese Paare an. Die Auflagen je Achse stehen an den Reifengrößen der Zeile, jede mit ihrer Achse; die Codes nimmst du so, wie das Gutachten sie druckt, auch mit Klammer: 0), R), 13), 16a). Ob dein Gutachten drei oder vier Kombinationen nennt, klären wir noch mit dir.',
        state: 'erledigt',
        commits: ['16b758ae', '174634cb'],
    },
    {
        nr: 209,
        wish: 'Getrennte Felder für Lastindex und Geschwindigkeitsindex statt eines Felds',
        now: 'Neben jeder Reifengröße stehen Lastindex und Geschwindigkeitssymbol in zwei eigenen Feldern: der Lastindex als Zahl, das Symbol aus der Liste von L bis (Y). Fügst du eine Größe so ein, wie das Gutachten sie druckt – „245/35 R19 93Y“ –, verteilen sich die Angaben beim Verlassen des Felds von selbst, und ein Paar für vorne und hinten wird zu zwei Zeilen. Geprüft werden beide beim Speichern und noch einmal bei der Freigabe.',
        state: 'erledigt',
    },
    {
        nr: 210,
        wish: 'Ein Bereich für Reifen im Admin: Marke, Größen, Saison … anlegen und verwalten',
        now: 'Noch nicht gebaut – mit den Angaben des EU-Reifenlabels von Anfang an.',
        state: 'offen',
    },
    {
        nr: 211,
        wish: 'Blog: Fotos hochladen und HTML für Abschnitte, z. B. für Tabellen',
        now: 'Noch nicht gebaut: ein Editor mit Bausteinen – Tabelle mit Spaltenköpfen, Bild mit Pflicht-Alternativtext, Zitat – statt freiem HTML, über das fremder Code auf die Seite gelangen könnte.',
        state: 'offen',
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
        now: 'Noch nicht gebaut – kommt mit 204.',
        state: 'offen',
    },
    {
        nr: 214,
        wish: 'Für jede Felge automatisch ein Google-JSON-LD (Product)',
        now: 'Noch nicht gebaut. Bewertungen kommen nur hinein, wo es echte gibt; Versandkosten und Rückgabe, sobald deine Angaben dazu da sind.',
        state: 'offen',
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

/** What each item does now, for his sheet's Description cell — in the language of his sheet (English), for a shop owner. */
export const NOTES = {
    201: 'Not built yet — next, together with 203: a form for a vehicle with everything the approval check needs.',
    202: 'Not built yet — next: an import that first does a test run and shows the numbers and never overwrites a vehicle taken from a Gutachten. The bolt circle is not needed: whether a wheel may go on a car is decided by the Gutachten, not by geometry.',
    203: 'Not built yet — comes with 201.',
    204: 'Not built yet: the field becomes required for new wheels, and a list shows the existing wheels where it is still missing.',
    205: 'Not built yet — comes with 204.',
    206: 'Not built yet — comes with 204.',
    207: 'Not built yet: the stock figure goes, „nicht verfügbar“ blocks the purchase and says so, and the quantity selector no longer follows the stock.',
    208: 'Each Gutachten has a „Bereifungskombinationen“ section: you enter the list as printed (number, front, rear, page), and from then on the shop offers only those pairs. Conditions per axle are entered with each tyre size and its axle; codes are typed as printed, brackets included: 0), R), 13), 16a). We still need to confirm with you whether your document lists three or four combinations.',
    209: 'Beside each tyre size, load index and speed symbol now have two fields of their own: the load index as a number, the symbol from the list L to (Y). A size pasted as the Gutachten prints it („245/35 R19 93Y“) splits into the fields by itself, and a front-and-rear pair becomes two lines. Both are checked when you save and again at release.',
    210: 'Not built yet — with the EU tyre label fields from the start.',
    211: 'Not built yet: an editor with building blocks — a table with header cells, an image with required alt text, a quote — instead of free HTML, which could put someone else\'s code on the site.',
    212: 'The blog page /blog lists every published article, newest first, linked from the footer. Two guides are published; the third — ABE, Teilegutachten, ECE — appears once the law firm has checked it.',
    213: 'Not built yet — comes with 204.',
    214: 'Not built yet. Ratings only where real reviews exist; shipping and returns once your details for them are in.',
    215: 'Solved differently: the table now appears only on a Gutachten that, according to the details entered, prints one — there the release requires it. Everywhere else it is folded to one line, „Keine Tabelle hinterlegt“. We did not remove it: on a document that prints one, like ABE 55255, it decides which tyres are permitted on cars with a top speed above 210 km/h.',
    216: 'The shop now tells the browser and the host not to store any of its pages. Every change to the catalogue applies at once, including the vehicle list, the counts and the search. A page the Back button shows again checks with the shop and reloads if anything changed.',
    217: 'Not done yet: we need your answer on who issues the invoice and whether the shop keeps a copy.',
    218: 'Checked, including with a forged signature: an order from the shop opens only with the link from its e-mail, in the browser that placed it, or in the customer account. The link is signed and valid for twelve months; after that, the page sends a new one to the order\'s e-mail address on request. Someone who knows only the number sees the same page as for a number that does not exist. Only the preview\'s example orders open by number: they belong to no real customer and are removed with the demo data.',
}
