# RIMIFY – zum Ausprobieren

Hier ist alles, was du für die Review brauchst: der Link, deine Zugänge, ein vollständiger Durchlauf zum
Nachmachen und eine ehrliche Liste, was fertig ist und was noch nicht.

## Der Link

- **Shop:** https://rimify.skillleo.com
- **Admin:** https://rimify.skillleo.com/admin/anmelden

Das ist die Vorschau, nicht der Live-Shop. Sie läuft mit Beispieldaten: Alles, was „Demodaten“,
„Beispiel“ oder „Platzhalter“ heißt, ist erfunden – Marken, Felgen, Gutachten, Bestellungen und Zahlen.
Vor dem Start werden die Beispieldaten entfernt; deine echten Dateien kommen über den Import und die
Gutachten-Erfassung, genau wie im Durchlauf unten. Bezahlt wird hier nur mit der **Testzahlung**: Es fließt
kein Geld, und jede solche Bestellung trägt im Admin das Schild „Testbestellung“.

## Deine drei Zugänge

Jede Rolle sieht ein anderes Admin – eine andere Seitenleiste und eine andere Übersicht. Probier alle drei.

| Rolle | E-Mail | Passwort | Was sie sieht |
|---|---|---|---|
| Verkauf | `verkauf@rimify.test` | `rimify-review-2026` | Bestellungen bearbeiten und exportieren, Umsatz in der Übersicht; Felgen und Zubehörpreise nur lesend. Keine Gutachten. |
| Lager | `lager@rimify.test` | `rimify-review-2026` | Katalog: Felgen, Größen, Preise, Bestände, Fotos und Zubehörpreise; die Anfragen. Gutachten und Fahrzeuge nur lesend. Die Übersicht zeigt Lager und Datenqualität statt Umsatz. |
| Admin | `admin@rimify.test` | `rimify-review-2026` | Alles, auch Import, Rollen & Rechte, Medien und Speicher und System. |

Die drei Ansichten nebeneinander: [`docs/review/roles/`](roles/). Diese Zugänge gibt es nur auf der
Vorschau; im Live-Shop existieren sie nicht.

## Einmal durch alles: der goldene Datensatz

Eine echte Felge auf dem ganzen Weg durch RIMIFY, so wie später jede deiner Felgen: die **BORBET DB8GT2**
in 8,5J × 18 und 8,5J × 19, in Schwarz matt und Bronze matt, mit ihren beiden echten Gutachten:

- **ABE 55255** (TÜV Rheinland) für 19 Zoll, 13 Seiten;
- **Gutachten 366-0350-21-WIRD/N1** (TÜV Austria) für 18 Zoll, 24 Seiten – ein Nachtrag zur ABE 53841, die uns
  nicht vorliegt.

Beide haben wir über die normalen Gutachten-Seiten im Admin erfasst, Zeile für Zeile aus dem PDF. Sie liegen
als **Entwurf** bereit. Freigeben musst du, nachdem du beide mit dem PDF abgeglichen hast – erst dann gelten
sie im Shop.

1. **Gutachten › ABE 55255:** Leg das PDF daneben und prüf den Datensatz: die Angaben der ersten Seite, das
   Auflagenverzeichnis mit jedem Satz im Wortlaut, die Befestigungsmittel, die Hinweise und den
   Verwendungsbereich mit 70 Fahrzeugen.
2. **Vorschau im Shop:** Hier siehst du die Felge so, wie die Kundschaft sie sehen wird – noch bevor etwas
   freigegeben ist.
3. **Freigeben.** Danach dasselbe für den Nachtrag 366-0350-21-WIRD/N1 mit 55 Fahrzeugen. Oben in seinem
   Datensatz steht: „Grundgutachten ABE 53841 liegt uns nicht vor – dieser Nachtrag allein ist nicht die ganze
   Freigabe.“ Diesen Satz liest auch die Kundschaft. Unter **Gutachten › Abdeckung** erscheint er bei den
   Nachträgen ohne Grundgutachten.
4. **Katalog › Felgen › BORBET DB8GT2:** Die Felge ist ein Entwurf ohne Preis – wir haben keinen erfunden.
   Trag deinen Preis je Größe ein und veröffentliche die Felge.
5. **Im Shop:** Wähl über Marke, Modell und Variante **BMW › X3 › X83**. Die Fahrzeuge aus den Gutachten haben
   noch keine HSN/TSN; die kommen erst mit dem Fahrzeugdatensatz. Öffne dann die Felge:
   - **19 Zoll:** „Mit Auflagen freigegeben für BMW X3 X83“. Darunter steht in einer Zeile, was das Gutachten
     verlangt, und unter „alle Auflagen im Wortlaut“ folgen Abnahme, Arbeiten am Fahrzeug, die Schrauben
     Nr. S03 (M14x1,5, 140 Nm, Artikel 5284), jede Reifengröße mit Achse und Leistung und die Hinweise des
     Gutachtens. „Gutachten öffnen (PDF, Seite …)“ führt direkt zur Seite im PDF, auf der das gewählte
     Fahrzeug steht.
   - **18 Zoll:** Dasselbe aus dem Nachtrag, dazu der Hinweis auf die fehlende ABE 53841 und die Kontrolle des
     Anzugsmoments nach 50 km.
6. **Zwei Fahrzeuge unter einem Namen:** Unter **BMW › 1er-Reihe** erscheint der **1K4** zweimal. Der Nachtrag
   sieht für ihn je nach Stand seiner EG-Typgenehmigung einen anderen Schraubensatz vor. Darum nennt RIMIFY
   neben jeder Variante, was in Feld K der Zulassungsbescheinigung stehen muss:
   „Feld K: e1*2007/46*0283, *00 bis *03“ und „Feld K: e1*2007/46*0283, ab *04“.

**Was du dabei oft sehen wirst: „wissen wir nicht“.** Viele Zeilen der beiden Gutachten gelten nur für eine
bestimmte Karosserieform oder einen bestimmten Antrieb, etwa „nur Limousine“ oder „nicht für Allrad“. Solange
wir das vom Fahrzeug nicht wissen, zeigt RIMIFY bei der Felge „Keine Freigabe hinterlegt“, statt zu raten. Das
betrifft heute die meisten Fahrzeuge der beiden Gutachten. Wie wir die Kundschaft nach Karosserieform und
Antrieb fragen, klären wir mit dir.

Sobald die Felge einen Preis hat, laufen Warenkorb, Kasse mit Testzahlung und die Bestellung mit ihrem
eingefrorenen Prüfnachweis wie bei jeder anderen Felge. Die Bilder in [`GOLDEN-RECORD.md`](GOLDEN-RECORD.md)
zeigen diesen Weg noch mit dem früheren Platzhalter-Gutachten.

**Zwei Antworten zum Ausprobieren – beide gehören zum Produkt.** Bei hoher Geschwindigkeit tragen Reifen
weniger; wie viel, steht in einer Tabelle des Gutachtens. Die Beispiel-Gutachten und das Platzhalter-Gutachten
tragen die Tabelle der ABE 55255, im Admin mit „Demodaten“ markiert – sie stammt aus den Beispieldaten, nicht
aus dem jeweiligen Dokument. Wähl ein schnelles Fahrzeug (etwa den Audi RS 4 Avant B9, 280 km/h), trag unter
der Felge die Werte aus der Zulassungsbescheinigung ein, und RIMIFY rechnet dir die Reifen aus: oben die Antwort,
darunter „So haben wir gerechnet“. Ein Beispiel-Gutachten hat **absichtlich keine Tabelle**: DEMO-0007 mit den
Felgen **Stahlwerk 19 Kontur X** und **Aventin Linea 10**. Dort sagt RIMIFY bei den Reifen „Keine Freigabe
hinterlegt“ mit dem Grund – weil wir es nicht wissen. Genau das ist die Idee: lieber „wissen wir nicht“ als eine
falsche Antwort. Mit „RIMIFY-Check drucken oder teilen“ nimmst du jede Antwort vollständig mit, die Rechnung
inklusive.

**Borbet DB8GT2 in 18 Zoll – was du dort siehst, ist Absicht.** Das 18-Zoll-Gutachten (der Nachtrag von
TÜV Austria) druckt keine eigene Tabelle zur Tragfähigkeit der Reifen bei hoher Geschwindigkeit; die
19-Zoll-ABE 55255 hat sie auf Seite 6. Für ein Fahrzeug bis 210 km/h spielt das keine Rolle. Fährt es
schneller und sind 8.1, 8.2 und T eingetragen, steht bei **Reifen** „Keine Freigabe hinterlegt“ mit dem
Satz: „Das Gutachten druckt keine Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit. Für … km/h können
wir die Reifen deshalb nicht bestätigen.“ Die Felge selbst bleibt freigegeben, verkauft wird sie für so ein
Fahrzeug aber erst, wenn die Reifen bestätigt sind – lieber ein verpasster Verkauf als eine falsche Antwort. RIMIFY leiht sich die Tabelle
nie aus einem anderen Dokument. Schick uns die Seite, falls es sie zum Nachtrag gibt – dann tragen wir sie
ein, und die Antwort wird eindeutig.

## Was fertig ist – und was ehrlich noch nicht

Den Stand jeder einzelnen Seite zeigt im Admin **Review › Stand der Seiten**. Kurz:

**Fertig**

- **Shop:** Startseite, Felgen mit Filtern, Produktseite mit Freigabe für dein Fahrzeug, Komplettrad-Angebot,
  Vergleich, Felgenrechner, Warenkorb, Kasse mit Testzahlung, Bestellbestätigung – auf dem Handy wie am
  Schreibtisch.
- **Übersicht** je Rolle, **Nachfrage** (gesuchte Fahrzeuge ohne Felge).
- **Verkauf:** Bestellungen mit Suche, Filtern, gespeicherten Ansichten, Export und Prüfnachweis je Position;
  Anfragen.
- **Katalog:** Felgen anlegen und pflegen (Ausführungen, bis zu zwölf Fotos je Farbe in selbst gewählter
  Reihenfolge, Größen-Matrix, Freigabe-Check); **Marken** mit Logo-Upload für die Markenwand; Import mit
  Probelauf und Rücknahme, der sich die Spalten-Zuordnung je Lieferant merkt und abgelehnte Zeilen als
  CSV zum Korrigieren ausgibt.
- **Gutachten:** Dokumente mit Verwendungsbereich, Vorschau und Freigabe; Auflagen-Katalog; Abdeckung.
- **Fahrzeuge:** Liste, Suche nach HSN/TSN, „Zur Prüfung“ für unvollständige Fahrzeugdaten.
- **Inhalte:** Seiten, FAQ, Navigation.
- **Einstellungen:** Medien und Speicher, Rollen & Rechte, Benutzer, Protokoll, Zubehörpreise; **System**.

**Noch nicht gebaut**

- **Echte Zahlung** (Stripe) – als Nächstes; bis dahin nur die Testzahlung.
- **Bestellung bearbeiten:** Status, Versand, Rechnung, Erstattung. Die Rechnung als PDF gibt es noch nicht.
- **Kunden** als eigene Seite; **Reifen** und **Bestände** als eigene Seiten.
- **Konflikte zwischen Gutachten:** werden beim Freigeben schon erkannt und gemeldet; die Seite zum Klären folgt.
- **Fahrzeugdaten einspielen** (neue Fahrzeuge aus der KBA-Liste), **Medien** für Seiten, **Warteschlange**
  einsehen, **Auswertungen**, die Shop-Einstellungen **Allgemein, Versand, Zahlung, Rechtstexte**.
- **Von dir:** der Lieferanten-Katalog, die Gutachten-PDFs, die Rechtstexte und die Zugänge für Zahlung
  und E-Mail – und die Wahl eines **Fahrzeugdatensatzes**. Die Gutachten nennen Fahrzeuge über die
  EG-Typgenehmigungsnummer, nicht über HSN/TSN; die Brücke dazwischen ist ein Datensatz, den es zu kaufen gilt
  (KBA, TecDoc oder DAT/GT Motive). Frag jeden Anbieter nach einer Probe mit HSN, TSN und EG-Nummer samt
  Erweiterung.

## Die Rückmeldung

Unten in der Seitenleiste steht **„Rückmeldung geben“** (auf dem Handy unter „Mehr“, am Schreibtisch auch mit
der Taste **R**): Klick darauf auf genau der Seite, die du meinst. Schreib einen Satz und wähl die Art –
Fehler, Design, Text oder Wunsch; Adresse, Fenstergröße, Browser, deine Rolle und ein Bildschirmfoto
schickt RIMIFY von selbst mit. Jede Rückmeldung bekommt eine Nummer und unsere Antwort, und
`OPEN-POINTS.md` zeigt, was offen und was erledigt ist – „keine offenen Punkte“ heißt dann genau das.
