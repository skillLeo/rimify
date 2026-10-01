# Deine Änderungsliste – Stand der Umsetzung

Deine 34 Punkte aus „Rimify Changes“, in deiner Nummerierung. Zu jedem Punkt steht hier, was wir gemacht haben, in
welchem Commit und wie der Status ist. Was „erledigt“ ist, ist in der Testumgebung enthalten; welcher Stand dort gerade
läuft, steht ganz unten auf jeder Seite.

Die Status:

- **erledigt** – umgesetzt, in der Testumgebung zu sehen
- **anders gelöst** – umgesetzt, aber anders als vorgeschlagen; warum, steht in der Zeile
- **Rückfrage** – dazu brauchen wir noch eine Antwort von dir
- **offen** – noch in Arbeit

Prüfen und abhaken kannst du alles auf https://rimify.skillleo.com.

| Nr. | Was es war | Was wir gemacht haben | Commit | Status |
|---|---|---|---|---|
| 1 | „Fahrzeug wählen“ im Hero hellblau, solange kein Fahrzeug gewählt ist | | | offen |
| 2 | Header höher | | | offen |
| 3 | Leiste über dem Header entfernen | | | offen |
| 4 | Link zur Felge und Preis aus dem Hero entfernen | | | offen |
| 5 | „Felgen mit den meisten Freigaben“ → meistgekaufte Felgen | | | offen |
| 6 | Markierung „Wir lesen das Gutachten · Du bekommst die Antwort“ bei manchen Seitenverhältnissen verrutscht | | | offen |
| 7 | Hero springt beim Wechsel zwischen „Marke & Modell“, „HSN/TSN“ und „Fahrzeugschein scannen“ | | | offen |
| 8 | Fahrzeug in die Adresse (URL), damit man die Seite speichern und teilen kann | | | offen |
| 9 | Echte Beispielfelge (z. B. Motec) im drehenden Rad | | | Rückfrage |
| 10 | „Felgenrechner“ und „Blog“ im Footer verlinken | | | Rückfrage |
| 11 | Bessere Illustration im Felgenrechner (wie bei jr-wheels.com) | | | offen |
| 12 | Kontaktformular auf der Kontaktseite | | | offen |
| 13 | Warenkorb-Symbol im Handy-Header, links neben dem Menü | | | offen |
| 14 | Preis im Warenkorb versehentlich × 4 | Der Warenkorb hat richtig gerechnet: 4 × Einzelpreis. Der Fehler lag auf der Produktseite – sie zeigte den Preis für eine Felge, der Knopf legte aber ohne Hinweis vier Felgen in den Warenkorb. Jetzt steht die Anzahl neben dem Preis (siehe 17), der Preis gilt für genau diese Anzahl, und genau diese Anzahl landet im Warenkorb. Dazu eine feste Regel im Code: Ein Preis gilt immer für eine Felge, und nur an einer einzigen Stelle wird mit der Menge gerechnet. Ein Test prüft das überall, von der Kachel bis zur Rechnung und zum CSV-Export. | 23bd07eb | erledigt |
| 15 | Beim Komplettrad Wuchtgewichte, Ventile und Reifendrucksensoren anbieten, bei „Nur Felgen“ nicht | | | offen |
| 16 | Nach „In den Warenkorb“ ein Fenster, damit man leichter weiterkommt | | | offen |
| 17 | Mengenauswahl neben dem Preis, 4 vorausgewählt, Preis passt sich an | Neben dem Preis gibt es jetzt eine Mengenauswahl (− 4 +), 4 ist vorausgewählt. Der große Preis gilt für die gewählte Anzahl, darunter steht der Preis pro Felge, damit nichts verwechselt wird. Mehr als vorrätig lässt sich nicht wählen. | c3437a70 | erledigt |
| 18 | Auswahl „Nur Felgen“ / „Felgen + Reifen“, mit passenden Reifen direkt | | | offen |
| 19 | Bewertungen unter dem Felgennamen, im Admin anlegbar (z. B. 4,9 Sterne, 13 Bewertungen) | Bewertungen gibt es jetzt – aber nur echte. Nach der Zustellung bekommt jede Käuferin und jeder Käufer einmal eine E-Mail mit einem Link und bewertet die Felgen mit Sternen, auf Wunsch mit einem Satz. Unter dem Felgennamen stehen dann der Durchschnitt und die Anzahl (z. B. „4,9 (13 Bewertungen)“), auf der Seite dazu der Hinweis, wie wir die Bewertungen prüfen. Im Admin unter Verkauf › Bewertungen kannst du eine Bewertung mit Grund ausblenden und beantworten, aber nicht selbst anlegen: Erfundene Bewertungen wären irreführende Werbung (§ 5 UWG), und ein Shop muss angeben, wie er Bewertungen prüft (§ 5b UWG) – ein klassischer Abmahngrund. Solange eine Felge noch keine Bewertung hat, steht unter dem Namen, was wir belegen können: wie viele Gutachten sie hat, für wie viele Fahrzeugvarianten sie freigegeben ist, und dass die Freigabe vor dem Kauf geprüft wird. Dafür gibt es in jeder Bestellung jetzt auch „Als versendet markieren“ (mit Sendungsnummer) und „Als zugestellt markieren“. | ceab89db | anders gelöst |
| 20 | Unterschiedliche Größen vorne und hinten wählbar | Mischbereifung gibt es jetzt auf der Produktseite unter dem Komplettrad – aber nur so, wie das Gutachten es erlaubt: Angeboten werden ausschließlich die Kombinationen aus der Tabelle des Gutachtens (beim ABE 55255 die Auflage V19 auf Seite 12, 27 Einträge), und nur, wenn beide Größen für das Fahrzeug in der Zeile stehen – vorne die vordere, hinten die hintere, nie umgekehrt. Jede Achse wird mit ihrer eigenen Achslast gerechnet, die Seite nennt den Mindest-Tragfähigkeitsindex je Achse und welche Achse mehr verlangt. Vorne und hinten kommen Reifen desselben Herstellers und derselben Profilreihe, wie das Gutachten es verlangt; der Satz des Gutachtens dazu (Herstellerbestätigung im Auto mitführen) steht wörtlich daneben. Im Warenkorb stehen Vorder- und Hinterachse als zwei Zeilen (2 + 2 Kompletträder), in der Bestellung wird jede Achse getrennt festgehalten. Die Reifengrößen kann man nicht frei kombinieren. Damit das angeboten wird, braucht es die Achslasten und die Höchstgeschwindigkeit des Fahrzeugs (aus dem Fahrzeugschein) und passende Reifen im Lager – beides fehlt heute noch bei den Fahrzeugen aus dem Gutachten. | e2e23394 | erledigt |
| 21 | „Eintragung“ steht bei Felgen mit Auflagen dreimal | | | offen |
| 22 | Handy-Liste: „Vergleichen“ verdeckt „Mit Auflagen“ | | | offen |
| 23 | „Mit Auflagen“ nur gelb bei echten Auflagen (z. B. Bördeln), im Backend einstellbar | Jede Auflage eines Gutachtens hat jetzt eine Stufe, die du im Admin einstellst (Gutachten › Dokument › Auflagenverzeichnis, Spalte „Im Shop“): Hinweis (nichts zu tun, ruhig in Schwarz), Auflage (gelb) oder Nicht zulässig (rot). Sind alle Auflagen einer Felge Hinweise, steht in der Liste und auf der Produktseite „Freigegeben“ und darunter ruhig „Mit Hinweisen aus dem Gutachten“; nur echte Auflagen machen „Mit Auflagen“ gelb. Anders als vorgeschlagen gibt es keinen freien Grün/Gelb-Schalter: Eine Abnahme beim Prüfer oder Arbeit an der Karosserie, etwa das Bördeln, ist immer eine Auflage und lässt sich nicht auf Hinweis stellen – sonst könnte jemand kaufen, ohne zu wissen, dass ein Prüfer oder eine Werkstatt nötig ist. Die vorhandenen Auflagen haben wir vorbelegt (z. B. Schraubenhinweise und Schneeketten als Hinweis, Abnahme und Karosseriearbeiten als Auflage). Solange die Achslasten und die Höchstgeschwindigkeit eines Fahrzeugs nicht eingetragen sind, bleibt es bei „Mit Auflagen“, weil die Reifen dann noch zu prüfen sind. | db7cd97d | anders gelöst |
| 24 | Scrollbalken der Filter am Ende manchmal fehlerhaft | | | offen |
| 25 | Knopf „Nur die Felgen bestellen“ ohne Funktion entfernen | | | offen |
| 26 | Alle E-Mail-Knöpfe sollen zum Kontaktformular führen | | | offen |
| 27 | Zollgröße oder Marke geht verloren, wenn man danach das Fahrzeug wählt | | | offen |
| 28 | RIMIFY-Check: Fahrzeug und Felge wählen, Antwort nur für dieses Paar, dann direkt kaufen | | | offen |
| 29 | Auf dem Handy falscher Footer auf der Startseite | | | offen |
| 30 | Filter auch ohne gewähltes Fahrzeug | | | offen |
| 31 | Filter-Auswahl in der Liste auch auf dem Handy | | | offen |
| 32 | Seite etwas farbiger, z. B. hellblaue Abschnitte | | | offen |
| 33 | Startseite: mehr Blau, z. B. Symbole und der gewählte Reiter | | | offen |
| 34 | „Product Detail Page needs“ | | | Rückfrage |
