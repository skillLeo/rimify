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

Eine Felge, vollständig durch RIMIFY – so, wie später deine echten Daten laufen. Alles darin ist
Platzhalter („Platzhalter Probelauf“, 1,00 €, Gutachten „PLATZHALTER-GR-1“). Mit Bildern zu jedem Schritt:
[`GOLDEN-RECORD.md`](GOLDEN-RECORD.md).

1. **Katalog › Import:** Eine Lieferantendatei wird zugeordnet, im **Probelauf** Zeile für Zeile geprüft und
   erst dann importiert.
2. **Katalog › Felgen:** Die neue Felge ist ein Entwurf; der Freigabe-Check sagt, was dem Veröffentlichen
   im Weg steht. Dann veröffentlichen.
3. **Gutachten › Neues Gutachten:** PDF hochladen, Art mit KBA-Nummer, Aussteller, Seitenzahl.
4. **Verwendungsbereich:** Fahrzeug über HSN/TSN, Felgengröße, Reifengröße, Auflage als ganzer Satz und
   die Seite im Gutachten.
5. **Vorschau im Shop:** So sieht die Kundin oder der Kunde es, bevor irgendetwas freigegeben ist.
6. **Freigeben:** Erst jetzt gilt das Gutachten im Shop.
7. **Im Shop:** HSN **0588**, TSN **AKB** (Audi A3 Limousine 40 TFSI) eingeben, die Felge öffnen: „Mit Auflagen
   freigegeben für …“, die Auflage im Wortlaut und „Gutachten öffnen (PDF, Seite 2)“.
8. **Warenkorb und Kasse:** bestellen und die **Testzahlung** mit „bezahlt“ enden lassen.
9. **Verkauf › Bestellungen:** die Bestellung mit ihrem eingefrorenen Prüfnachweis – so, wie das Gutachten
   im Moment des Kaufs lautete, auch wenn es sich später ändert.

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
