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
        now: 'Für jede neue Felge ist die Radtypenbezeichnung Pflicht. Felgen, die schon vorher angelegt waren, lassen sich weiter speichern; die Felgenliste sammelt sie unter „Radtypenbezeichnung: Fehlt noch“, damit du sie nachtragen kannst.',
        state: 'erledigt',
    },
    {
        nr: 205,
        wish: 'Feld „Typenbezeichnung“ in „Radtypenbezeichnung“ umbenennen und in den Produktnamen aufnehmen',
        now: 'Das Feld heißt jetzt „Radtypenbezeichnung“ und gehört zum Namen der Felge – im Shop wie im Admin.',
        state: 'erledigt',
    },
    {
        nr: 206,
        wish: 'Die Radtypenbezeichnung zusammen mit Marke und Modell im Felgennamen',
        now: 'Im Shop heißt jede Felge jetzt Marke, Modell und Radtypenbezeichnung, etwa „BORBET Havanna HA 8018“ – auf den Karten, der Produktseite, im Warenkorb, in neuen Bestellungen und im RIMIFY-Check. So findet ein Kunde die Felge im Gutachten wieder.',
        state: 'erledigt',
    },
    {
        nr: 207,
        wish: 'Keinen Lagerbestand als Zahl, nur „verfügbar“ und „nicht verfügbar“',
        now: 'Statt einer Zahl hat jede Größe „Verfügbar“ oder „Nicht verfügbar“. Bei „Nicht verfügbar“ lässt sie sich nicht kaufen, und der Shop sagt das; die Mengenauswahl und die Kasse zählen keine Felgen mehr. Die alte Zahl bleibt gespeichert, wird aber nicht mehr gelesen.',
        state: 'erledigt',
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
        now: 'Der Titel setzt sich von selbst aus Marke, Modell und Radtypenbezeichnung zusammen. Unter „Titel im Shop“ kannst du ihn anders schreiben; dann bleibt er so, auch wenn sich Modell oder Radtypenbezeichnung später ändern. Liste und Formular zeigen dann „Titel weicht ab“, und der zusammengesetzte Titel ist einen Klick entfernt.',
        state: 'erledigt',
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
    201: 'Vehicles › „Neues Fahrzeug“: a car typed from its registration certificate, stored as checked by hand and in the vehicle selector at once. Without the axle loads the form says what that means before saving, and the car waits under „Zur Prüfung“ until they are entered.',
    202: 'Your demo file is not with us, so the import reads any CSV or Excel file: you map its columns the first time, and it remembers the mapping per source. A dry run shows the counts first (new, changed, refused); only then do you import. A car is recognised by HSN, TSN and variant; cars typed by hand or from a Gutachten are never overwritten. No bolt circle needed. Please send us your demo file so we can check the mapping against it.',
    203: 'With 201: every field of your list, each labelled with its number in the papers (2.1, 2.2, D.1, D.3, D.2, K, P.2, 8.1, 8.2, T).',
    204: 'Required for every new rim. Rims saved before keep saving, and the rim list gathers them under „Radtypenbezeichnung: Fehlt noch“ so you can fill it in.',
    205: 'Renamed to „Radtypenbezeichnung“ and part of the rim’s name, in the shop and in the admin.',
    206: 'In the shop every rim is now brand + model + Radtypenbezeichnung (e.g. „BORBET Havanna HA 8018“) — on cards, the product page, the basket, new orders and the RIMIFY-Check — so a customer can find it in the Gutachten.',
    207: 'Each size is „Verfügbar“ or „Nicht verfügbar“ instead of a count. Not available: it cannot be bought, and the shop says so; the quantity selector and the checkout count no rims any more. The old count stays stored and is no longer read.',
    208: 'Each Gutachten has a „Bereifungskombinationen“ section: you enter the list as printed (number, front, rear, page), and from then on the shop offers only those pairs. Conditions per axle are entered with each tyre size and its axle; codes are typed as printed, brackets included: 0), R), 13), 16a). We still need to confirm with you whether your document lists three or four combinations.',
    209: 'Beside each tyre size, load index and speed symbol now have two fields of their own: the load index as a number, the symbol from the list L to (Y). A size pasted as the Gutachten prints it („245/35 R19 93Y“) splits into the fields by itself, and a front-and-rear pair becomes two lines. Both are checked when you save and again at release.',
    210: 'Not built yet — with the EU tyre label fields from the start.',
    211: 'Not built yet: an editor with building blocks — a table with header cells, an image with required alt text, a quote — instead of free HTML, which could put someone else\'s code on the site.',
    212: 'The blog page /blog lists every published article, newest first, linked from the footer. Two guides are published; the third — ABE, Teilegutachten, ECE — appears once the law firm has checked it.',
    213: 'The title composes itself from brand, model and Radtypenbezeichnung. A title typed otherwise under „Titel im Shop“ stays, even when the parts change later, and is flagged „Titel weicht ab“ with the composed title one click away.',
    214: 'Not built yet. Ratings only where real reviews exist; shipping and returns once your details for them are in.',
    215: 'Solved differently: the table now appears only on a Gutachten that, according to the details entered, prints one — there the release requires it. Everywhere else it is folded to one line, „Keine Tabelle hinterlegt“. We did not remove it: on a document that prints one, like ABE 55255, it decides which tyres are permitted on cars with a top speed above 210 km/h.',
    216: 'The shop now tells the browser and the host not to store any of its pages. Every change to the catalogue applies at once, including the vehicle list, the counts and the search. A page the Back button shows again checks with the shop and reloads if anything changed.',
    217: 'Not done yet: we need your answer on who issues the invoice and whether the shop keeps a copy.',
    218: 'Checked, including with a forged signature: an order from the shop opens only with the link from its e-mail, in the browser that placed it, or in the customer account. The link is signed and valid for twelve months; after that, the page sends a new one to the order\'s e-mail address on request. Someone who knows only the number sees the same page as for a number that does not exist. Only the preview\'s example orders open by number: they belong to no real customer and are removed with the demo data.',
}
