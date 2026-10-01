# RIMIFY zum Ausprobieren

**https://rimify.skillleo.com**

Das ist die Testumgebung von RIMIFY mit dem aktuellen Stand. Du kannst den ganzen Weg gehen, vom Fahrzeug bis zur
Bestellung, mit einer echten Felge, der BORBET DB8GT2, und ihren echten Gutachten. Dabei fließt kein Geld, und es wird
nichts verschickt.

## In fünf Minuten einmal durch

1. **Fahrzeug wählen.** Stell auf der Startseite unter „Marke & Modell“ nacheinander **BMW**, **X3** und **X83** ein
   und klick auf den Knopf darunter. Er zählt schon, wie viele Felgen zu deinem X3 passen.
2. **Die Felge öffnen.** Klick unter „Felgen“ auf die **BORBET DB8GT2**. Oben steht jetzt, ob sie für deinen X3
   freigegeben ist.
3. **19 Zoll wählen.** Dann steht dort: *Mit Auflagen freigegeben für BMW X3 X83*. Eine Zeile darunter fasst zusammen,
   was das Gutachten verlangt. Über „alle Auflagen im Wortlaut“ kommst du zu jeder Auflage als ganzem Satz, zu den
   Schrauben, den zulässigen Reifengrößen und den Hinweisen.
4. **Das Gutachten öffnen.** „Gutachten öffnen (PDF, Seite …)“ zeigt dir die ABE 55255 genau auf der Seite, auf der
   dein X3 steht.
5. **18 Zoll wählen.** Jetzt stützt sich die Antwort auf den Nachtrag zur ABE 53841. Achte auf die Zeile **„Keine
   Berichtigung der Fahrzeugpapiere nötig (§ 15 FZV).“** Sie geht auf Punkt 10 der ABE 53841 zurück: Die
   Zulassungsbescheinigung muss für diese Felge nicht berichtigt werden. Die Abnahme durch einen Prüfer verlangt das
   Gutachten trotzdem – auch das steht dort, in einer eigenen Zeile.
6. **In den Warenkorb und bezahlen.** Leg eine Größe in den Warenkorb, geh zur Kasse, gib eine Adresse ein und bezahl
   mit Karte:
   - Kartennummer **4242 4242 4242 4242**
   - Ablaufdatum: ein beliebiges Datum in der Zukunft, z. B. 12/34
   - Sicherheitscode: drei beliebige Ziffern, z. B. 123

   Das ist eine Testkarte, es wird nichts abgebucht. Danach siehst du die Bestellbestätigung mit der Rechnung.
7. **Die Bestellung im Admin finden.** Melde dich unter https://rimify.skillleo.com/admin/anmelden als
   `verkauf@rimify.test` mit dem Passwort `rimify-review-2026` an. Unter **Verkauf › Bestellungen** steht deine
   Bestellung und bei jeder Position der **Prüfnachweis**: die Freigabe genau so, wie sie beim Kauf galt. Er bleibt
   so gespeichert, auch wenn sich das Gutachten später ändert.

## Die drei Zugänge zum Admin

Jeder Zugang zeigt im Admin etwas anderes. Das Passwort ist bei allen dreien `rimify-review-2026`.

| Rolle | Anmeldung | Was sie sieht |
|---|---|---|
| Verkauf | `verkauf@rimify.test` | Bestellungen und Erstattungen, den Umsatz in der Übersicht |
| Lager | `lager@rimify.test` | Felgen, Größen, Preise, Bestände, Fotos; Gutachten und Fahrzeuge nur lesend |
| Admin | `admin@rimify.test` | Alles, auch Gutachten, Einstellungen und System |

## Deine Rückmeldung

Im Admin findest du unten in der Seitenleiste **„Rückmeldung geben“**, auf dem Handy unter „Mehr“. Klick darauf,
während du auf der Seite bist, um die es geht, und schreib einen Satz dazu. Die Seite, ein Bildschirmfoto und die
Angaben zu deinem Gerät schickt RIMIFY von selbst mit.

## Was bewusst noch nicht fertig ist

- **Die Fahrzeugdaten mit HSN und TSN.** Die Gutachten nennen Fahrzeuge nach ihrer Typgenehmigung, nicht nach HSN und
  TSN. Um beides zu verbinden, braucht es einen Fahrzeugdatensatz, der noch gekauft werden muss. Bis dahin wählst du
  das Fahrzeug über Marke und Modell.
- **Die Anlagen 1 bis 15 zur ABE 53841.** Uns liegt nur Anlage 16 vor, der Teil für BMW. Bei einem Fahrzeug aus den
  anderen Anlagen sagt der Shop deshalb: „Für dieses Fahrzeug liegt uns die entsprechende Anlage des Gutachtens noch
  nicht vor.“ Nie „nicht freigegeben“.
- **Die Rechtstexte.** AGB, Widerrufsbelehrung und Datenschutzerklärung kommen von deiner Kanzlei. Bis dahin stehen
  dort Platzhalter, die als solche gekennzeichnet sind.
- **Deine Firmendaten, Versandkosten und Lieferzeit.** Die trägst du selbst im Admin ein, unter **Einstellungen ›
  Verkäufer & Versand** (Zugang `admin@rimify.test`). Bis dahin nennt das Impressum uns als Betreiber dieser
  Testumgebung.
