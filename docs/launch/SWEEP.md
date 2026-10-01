# Client-ready sweep — what is left after the S1/S2 fixes

01.10.2026 · from the copy sweeps of the admin and the shop (`606975ec`, D-091). S1 and S2 are fixed except the
four under „Needs your word“. Everything else here is S3/S4: worth doing, nothing a visitor would stop at. One line
each — the finding, then what I recommend.

## Needs your word (S1/S2 I did not change — CLAUDE.md §9)

1. **„Garantierte Passgenauigkeit“** (promise row, the client's own title; client-questions #6) — a guarantee with legal weight. Recommend „Nur Felgen mit Freigabe“; ask the client.
2. **„Express-Versand aus Deutschland“** (client's title; client-questions #9) — nobody has confirmed a delivery speed. Recommend „Versand aus Deutschland“ until he names the lead time.
3. **UNKNOWN has three names** — „Unbekannt“ (badge), „Keine Angabe“ (Check pages, server label), „Keine Freigabe hinterlegt“ (order page, product panel). Recommend one: „Keine Freigabe hinterlegt“, with the existing sentence that it is not a „nicht freigegeben“.
4. **The confirmation mail carries the placeholder AGB and Widerrufsbelehrung** — no copy change; PRESENT.md now tells the client before he orders.

## Admin — S3

- Em dash „ — “ in AdminState, SalesFigures, RoleFigures, DocumentConditionRequest → en dash „ – “ (house style).
- System › Zustand problem lines are fragments („Shop im Wartungsmodus“) beside full sentences → full sentences with a full stop.
- Felgen bulk dialog opens with „Sie sind danach im Shop“ (reads as formal address) → „Die Felgen sind danach …“.
- Felgen/Edit „dann steht dort Marke und Modell“ → „stehen“.
- „SKU“ in five places → column „Art.-Nr.“, text „Artikelnummer“ (the importer already says so).
- FinishPhotos „dieser Farbe“ → „dieser Ausführung“, the form's own word.
- Gutachten row fields „Baujahr ab/bis“, „Mindest-Lastindex“ → „Bauzeitraum ab/bis“, „Mindest-Tragfähigkeitsindex“.
- Auflagenverzeichnis hint „1120 … Feld 8.1 und 8.2“ → „1.120 … den Feldern 8.1 und 8.2 der Zulassungsbescheinigung Teil I“.
- VehicleFromDocument example ends in „…*04-...“ → drop the trailing dots.
- Bestellungen „Prüfung 1.2.0“ → „Prüfregeln, Version 1.2.0“; „was auch immer der Status sagt“ → „auch wenn der Status „Bezahlt“ zeigt“.
- Seiten editor calls every page „Artikel“ and says „Live geht sie“ → „Seite“, „Im Shop steht sie erst, wenn …“.
- Einladung „zurückgezogen“ → „widerrufen“, as Benutzer and Protokoll say.
- Bestätigen „Dein Passwort gilt danach {n} Minuten“ → „Die Bestätigung gilt …“.
- RDKS page speaks as „wir“ → „der Shop“, as every other admin page.
- ChartMenu „Als CSV“ → „Als CSV exportieren“.
- Rollen „Super-Admin hat immer alle Rechte. Sie lassen sich …“ → „Die Rolle „Super-Admin“ hat immer alle Rechte; sie lassen sich …“.
- Rückbuchungen: Stripe status `prevented` has no label → add „Abgewendet“ (a raw code would show).
- AdminErrorPage „auf unserer Seite nicht geklappt“ → „Der Server konnte das nicht speichern.“
- Übersicht „Top-Felgen nach Bestellungen“ → „Meistbestellte Felgen“.
- „Freigabe-Check“ (Felgen) → „Vor dem Veröffentlichen“ — held back while MEINE-SCHRITTE step 4 uses the name; do it after.

## Admin — S4

- „Als PDF drucken“ → „Drucken“; „Versandt am“ → „Versendet am“; „Bitte sag uns, ob …“ in five requests → „Bitte wähl, ob …“; „am Telefon“ → „am Handy“; „niemand fragte vergeblich“ → „niemand hat vergeblich gefragt“.

## Shop — S3

- Selector „Zu … haben wir die Daten für dieses Fahrzeug noch nicht hinterlegt“ / „Nochmal prüfen“ → „Zu dieser HSN/TSN haben wir noch kein Fahrzeug hinterlegt.“ / „Nummern prüfen“.
- VerdictReason for incomplete data says nothing about why → „Für diese Prüfung fehlen uns noch Daten. Bis dahin …“.
- One action, two labels: „Bescheid geben“ / „Benachrichtigen, sobald verfügbar“ → „Benachrichtigung anfordern“; „Bestätige den Link“ → „Klick auf den Link“.
- Basket and 503 „Solange kannst du …“ → „Bis dahin …“ (503 done; basket left).
- Chrome „So bist du auf der sicheren Seite.“ → drop; „Es gilt der höhere Wert.“ says it.
- Komplettrad band repeats „montiert und gewuchtet“ three times; button „für mein Fahrzeug“ → heading „Kompletträder“, button „für dein Fahrzeug“.
- Partners: „Diese Postleitzahl kennen wir nicht“ checks only the format, and promises a search that does not exist yet → „Eine Postleitzahl hat fünf Ziffern.“, drop the promise until the search exists.
- Check page „Passt diese Felge auf dein Auto?“ → „Darf diese Felge an dein Auto?“ (legal, not physical).
- 404 and empty basket ask a customer who already chose a car to choose one; 500 says nobody is told → condition the line on the car; „Wenn du nicht weiterkommst, schreib uns kurz.“
- Home FAQ fallback „beantworten wir gerade neu“ reads as a placeholder → „Hier stehen bald die häufigsten Fragen …“.
- Order page „sobald dein Paket unterwegs ist“ → „deine Lieferung“ (wheels may go by freight); the mail's „Wir melden uns mit dem Versanddatum“ promises a mail nothing sends — ask the client.
- Checkout legal line is one elliptical sentence at the pay button → two sentences; the Kanzlei should see it.
- PapersForm „Mit der zulässigen Achslast“ → „Achslasten“; „Die Werte bleiben in deinem Browser“ → say it is a cookie; „Trag sie ein“ under a button → „Wähl sie aus“.
- Unconfirmed service lines — „Wir setzen die Sensoren gleich mit ein“, „stellen wir dir persönlich zusammen“, „gleicht ein Zentrierring das aus“, „Foto folgt“ → keep until the client confirms each; drop the ones he does not.
- Karosserieform/Antrieb Auflagen may be missing from „alle Auflagen im Wortlaut“ (FitmentDetail renders five sections, ConditionKind files them under „Fahrzeug“) → check against a document that has one; that is R-15, not copy.

## Shop — S4

- Plain spaces in „9,8 kg“, „45 mm“, „280 km/h“ on the product page → withUnit(); em dashes in the ribbon and the legal placeholder → en dash.
- „die dir besser gefällt“ → „am besten“; aria „Brotkrumen“ → „Navigationspfad“; „Behalten“ → „Konto behalten“; tab „Bis 200 €“ → „Bis 200 € pro Felge“.
- Calculator „Die Einpresstiefe liegt zwischen −30 und 70 mm.“ as an error → „Gib eine Einpresstiefe zwischen −30 und 70 mm ein.“; one imperative form („wähle“) throughout.
