# RIMIFY zum Ausprobieren

**https://rimify.skillleo.com**

Das ist die Testumgebung von RIMIFY im aktuellen Stand. Du kannst darin den ganzen Weg gehen, vom Fahrzeug bis zur
Bestellung. Als Beispiel dient eine echte Felge mit ihren echten Gutachten: die BORBET DB8GT2. Dabei fließt kein Geld,
und es wird nichts verschickt.

Ganz unten auf jeder Seite steht, welcher Stand gerade läuft, zum Beispiel „Testumgebung · Stand e982af1a vom
01.10.2026, 21:07 Uhr“. Schick diese Zeile bitte mit, wenn du uns etwas meldest. Dann wissen wir sofort, welchen Stand
du gesehen hast.

## In fünf Minuten einmal durch

1. **Fahrzeug wählen.** Stell auf der Startseite unter „Marke & Modell“ nacheinander **BMW**, **X3** und **X83** ein
   und klick auf den Knopf darunter. Er zeigt dir schon, wie viele Felgen zu deinem X3 passen.
2. **Die Felge öffnen.** Klick unter „Felgen“ auf die **BORBET DB8GT2**. Oben steht jetzt, ob sie für deinen X3
   freigegeben ist.
3. **19 Zoll wählen.** Jetzt heißt es dort: *Mit Auflagen freigegeben für BMW X3 X83*. Darunter steht, bei welcher
   Reifengröße die Felge eingetragen werden muss: *Eintragung in die Fahrzeugpapiere erforderlich mit 255/40 R19,
   nicht mit 235/45 R19 und 245/40 R19.* Unter „alle Auflagen im Wortlaut“ findest du jede Auflage als vollständigen
   Satz, dazu die Schrauben, die zulässigen Reifengrößen und die Hinweise. Was für alle Reifengrößen gilt, steht dort
   nur einmal. Was das Gutachten nur für bestimmte Größen vorschreibt, steht unter „Nur bei …“ – etwa nur
   feingliedrige Schneeketten bei 235/45 R19 und 245/40 R19 und gar keine Schneeketten bei 255/40 R19.
4. **Das Gutachten öffnen.** Über „Gutachten öffnen (PDF, Seite …)“ kommst du direkt zu der Seite der ABE 55255, auf
   der dein X3 aufgeführt ist.
5. **18 Zoll wählen.** Die Angaben stammen jetzt aus dem Nachtrag zur ABE 53841. Achte auf die Zeile **„Keine
   Berichtigung der Fahrzeugpapiere nötig (§ 15 FZV).“** Sie geht auf Punkt 10 der ABE 53841 zurück: Die
   Zulassungsbescheinigung muss für diese Felge nicht berichtigt werden. Eine Abnahme durch einen Prüfer verlangt das
   Gutachten trotzdem – auch das steht dort, in einer eigenen Zeile.
6. **In den Warenkorb und zur Kasse.** Leg eine Größe in den Warenkorb, geh zur Kasse und gib eine Adresse ein. In der
   Testumgebung kommst du danach nicht zur Kartenzahlung, sondern auf die Seite **„Testzahlung“**. Dort legst du
   fest, wie die Zahlung ausgeht: „Zahlung erfolgreich“, „Zahlung abgelehnt“ oder „Zahlung abbrechen“. Probier ruhig
   alle drei aus. Nach „Zahlung erfolgreich“ siehst du die Bestellbestätigung mit der Rechnung.
7. **Die Bestellung im Admin finden.** Melde dich unter https://rimify.skillleo.com/admin/anmelden als
   `verkauf@rimify.test` mit dem Passwort `rimify-review-2026` an. Unter **Verkauf › Bestellungen** findest du deine
   Bestellung. Bei jeder Position steht der **Prüfnachweis**: die Freigabe genau so, wie sie beim Kauf galt. Er bleibt
   unverändert gespeichert, auch wenn sich das Gutachten später ändert. Das Gutachten ist dort nur genannt, nicht
   verlinkt, denn die Rolle Verkauf darf keine Gutachten öffnen. Angemeldet als `admin@rimify.test` ist es verlinkt.

## Dein eigener Zugang

Für dich ist ein eigener Zugang als Super-Admin angelegt, auf deinen Namen und die Adresse info@rimify.de. Den
Einladungslink bekommst du direkt von uns. Über diesen Link legst du dein Passwort selbst fest. Er gilt bis zum
08.10.2026.

## Die drei Testzugänge zum Admin

Jeder Testzugang sieht im Admin etwas anderes. Das Passwort ist bei allen dreien `rimify-review-2026`. Unten in der
Seitenleiste steht, mit welchem Zugang du gerade angemeldet bist, etwa „Testzugang Verkauf“.

| Rolle | E-Mail-Adresse | Was sie sieht |
|---|---|---|
| Verkauf | `verkauf@rimify.test` | Bestellungen und Erstattungen, dazu den Umsatz in der Übersicht |
| Lager | `lager@rimify.test` | Felgen, Größen, Preise, Bestände und Fotos; Gutachten und Fahrzeuge nur zum Ansehen |
| Admin | `admin@rimify.test` | Alles, auch Gutachten, Einstellungen und System |

## Deine Rückmeldung

Im Admin findest du unten in der Seitenleiste **„Rückmeldung geben“**, auf dem Handy unter „Mehr“. Geh auf die Seite,
um die es geht, klick darauf und schreib einen Satz dazu. Welche Seite es ist, schickt RIMIFY automatisch mit, dazu ein
Bildschirmfoto und die Angaben zu deinem Gerät.

## Was bewusst noch nicht fertig ist

- **Die Preise der DB8GT2.** Die 229,00 € für 18 Zoll und 269,00 € für 19 Zoll sind Platzhalter, ebenso der Bestand.
  Sie sind nur eingetragen, damit du bestellen kannst. Du ersetzt sie im Admin unter **Katalog › Felgen** (mit
  `admin@rimify.test` oder deinem eigenen Zugang).
- **Die Kartenzahlung.** Die Kasse ist auf Stripe ausgelegt. Sobald die Testzugangsdaten von Stripe hinterlegt sind,
  bezahlst du hier mit der Testkarte 4242 4242 4242 4242 statt über die Seite „Testzahlung“. Auch dann wird nichts
  abgebucht.
- **E-Mails.** Die Testumgebung verschickt keine E-Mails, auch keine Bestellbestätigung. Die Bestätigung siehst du
  nach dem Kauf direkt auf der Seite.
- **Die Fahrzeugdaten mit HSN und TSN.** Die Gutachten nennen Fahrzeuge nach ihrer Typgenehmigung, nicht nach HSN und
  TSN. Um beides zu verbinden, ist ein Fahrzeugdatensatz nötig, der noch gekauft werden muss. Bis dahin wählst du das
  Fahrzeug über „Marke & Modell“.
- **Die Anlagen 1 bis 15 zur ABE 53841.** Uns liegt nur Anlage 16 vor, der Teil für BMW. Bei einem Fahrzeug aus den
  anderen Anlagen steht im Shop deshalb: „Für dieses Fahrzeug liegt uns die entsprechende Anlage des Gutachtens noch
  nicht vor.“ Ein „nicht freigegeben“ zeigt der Shop in diesem Fall nie.
- **Die Rechtstexte.** AGB, Widerrufsbelehrung und Datenschutzerklärung kommen von deiner Kanzlei. Bis sie vorliegen,
  stehen dort Platzhalter, die als solche gekennzeichnet sind.
- **Deine Firmendaten, Versandkosten und Lieferzeit.** Diese trägst du selbst im Admin ein, unter **Einstellungen ›
  Verkäufer & Versand** (mit `admin@rimify.test` oder deinem eigenen Zugang). Bis dahin nennt das Impressum uns als
  Betreiber dieser Testumgebung.
