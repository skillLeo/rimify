# RIMIFY – Fragen an die Kanzlei

Stand: 19.10.2026. Für die Kanzlei, die RIMIFY berät. Verfasst von SkillLeo, dem Entwickler des Shops, im Auftrag des
Mandanten. Mit „wir“ ist in diesem Schreiben SkillLeo gemeint.

RIMIFY verkauft Felgen und Kompletträder an Privatkunden in Deutschland. Der Shop zeigt nur Felgen, die ein Gutachten
(ABE, Teilegutachten oder ECE-Genehmigung) für das gewählte Fahrzeug freigibt. Zu fünf Punkten benötigen wir Ihre
Antwort, bevor der Shop in Betrieb geht. Im Anhang stehen die übrigen Punkte, die bereits bei Ihnen liegen, damit Ihre
Antwort alles abdeckt.

Zu jedem Punkt beschreiben wir, was der Shop heute tut; das ist stets die vorsichtigere Lesart. Bitte bestätigen Sie
diese Lesart, korrigieren Sie sie oder nennen Sie die zutreffende Frist bzw. den zutreffenden Wortlaut. Die Verweise
mit # beziehen sich auf die Nummern unserer Fragenliste (`docs/client-questions.md`).

---

## 1 · Aufbewahrung von Rechnungen, Gutschriften und Bestelldaten (#36)

**Was der Shop speichert.** Bestellungen, Rechnungen und Gutschriften werden unbefristet gespeichert, ebenso jede
Meldung von Stripe über einen Zahlungsvorgang. Rechnungen sind ab ihrer Ausstellung unveränderlich, Meldungen von Stripe
ab ihrem Eingang; das stellen Trigger in der Datenbank technisch sicher. Zu jeder Bestellposition gehört
ein Prüfnachweis: die Begründung, warum die Felge für das Fahrzeug zulässig war, mit dem zugrunde gelegten Gutachten und
den Werten, nach denen die Zulässigkeit beurteilt wurde. Der Prüfnachweis ist ebenso unveränderlich wie das Protokoll
des Verwaltungsbereichs. Unbezahlte Bestellungen verfallen nach 24 Stunden; der Datensatz mit Name und Anschrift bleibt
gespeichert.

**Unser Verständnis.** Nach dem Vierten Bürokratieentlastungsgesetz beträgt die Aufbewahrungsfrist für Buchungsbelege,
also auch für Rechnungen, seit dem 01.01.2025 acht Jahre (§ 147 AO, § 14b UStG); für Bücher und Aufzeichnungen bleibt
es bei zehn Jahren. Bis Sie die Frist bestätigen, nennt unsere Übersicht der Dienstleister und Speicherfristen nur
diese beiden Vorschriften und keine Frist.

**Bitte beantworten Sie:**

1. Welche Aufbewahrungsfrist gilt für Rechnungen und Gutschriften, und wann beginnt sie?
2. Welche Frist gilt für die übrigen Bestelldaten (Name, Anschrift, Positionen, Zahlungsvorgänge)?
3. Dürfen oder müssen die Prüfnachweise der Bestellpositionen nach Ablauf der Aufbewahrungsfrist gelöscht werden? Sie
   sind bewusst unveränderlich, weil sie belegen, was dem Kunden zur Zulässigkeit gesagt wurde. Eine Löschung würden
   wir nur auf Grundlage einer gesonderten Entscheidung umsetzen.
4. Wie lange dürfen verfallene, nie bezahlte Bestellungen mit Name und Anschrift gespeichert bleiben?

**Bis zu Ihrer Antwort:** Es wird nichts gelöscht.

---

## 2 · Zwei Sätze zur Prüfung von Bewertungen (#37, § 5b Abs. 3 UWG)

**Heute** zeigt der Shop nur Bewertungen von Käufern; jede Bewertung ist einer Bestellposition zugeordnet. Über den
Bewertungen steht: „Alle Bewertungen stammen von Kundinnen und Kunden, die diese Felge hier gekauft haben. Wir prüfen das
über die Bestellnummer.“

**Geplant** ist, bestehende Bewertungen des Mandanten zu übernehmen; umgesetzt ist das noch nicht. Jede übernommene
Gruppe erhielte einen eigenen Satz:

- neben Bewertungen aus dem Google-Profil des Shops, die in einem eigenen Block zum Shop stehen, nie bei einer Felge:
  „Diese Bewertungen stammen aus unserem Google-Profil. Wir prüfen nicht, ob unsere Kundinnen und Kunden sie geschrieben
  haben.“
- neben Bewertungen zu einer Felge, die aus dem früheren Shop übernommen werden:
  „Diese Bewertungen haben wir aus unserem früheren Shop übernommen. Ob sie von Käuferinnen und Käufern dieser Felge
  stammen, haben wir nicht geprüft.“

**Bitte bestätigen Sie** beide Sätze oder nennen Sie uns den zutreffenden Wortlaut. Teilen Sie uns außerdem mit, ob
der bestehende Satz über den Käuferbewertungen so bleiben kann.

**Hinweis:** Falls der frühere Shop geprüft hat, ob ein Bewerter die Felge gekauft hatte, trifft der zweite Satz so
nicht zu. Diese Frage richtet sich an den Mandanten.

---

## 3 · Cookies und Browser-Speicher, Eintrag für Eintrag (§ 25 TDDDG)

§ 25 TDDDG erfasst Cookies und Browser-Speicher gleichermaßen. Die Tabelle führt alles auf, was der Shop im Browser
eines Besuchers speichert. Die Spalten „Unbedingt erforderlich?“ und „Begründung“ geben unsere Antwort auf die Frage,
ob der Eintrag unbedingt erforderlich ist, damit der Shop einen vom Besucher ausdrücklich gewünschten digitalen Dienst
zur Verfügung stellen kann (§ 25 Abs. 2 Nr. 2 TDDDG). Dienste für Statistik oder Werbung setzt der Shop nicht ein.

| Name | Art | Zweck | Dauer | Unbedingt erforderlich? | Begründung |
|---|---|---|---|---|---|
| Sitzung und `XSRF-TOKEN` | Cookie | Warenkorb und Schutz aller Eingaben vor Anfragen fremder Seiten (CSRF-Schutz) | 120 Minuten | ja | Ohne sie gibt es keinen Warenkorb und keine sichere Bestellung. |
| `rmf_vehicle` | Cookie | Das gewählte Fahrzeug; gespeichert ist nur seine Nummer in unserer Fahrzeugliste | 90 Tage | ja | Jede Antwort des Shops wird für dieses Fahrzeug berechnet. **Offen: Dürfen es 90 Tage über den Besuch hinaus sein?** |
| `rmf_garage` | Cookie | Die letzten fünf gewählten Fahrzeuge | 90 Tage | nein | Komfortfunktion: Gewählt wird ein Fahrzeug, keine Liste. |
| `rmf_papiere` | Cookie | Werte aus der Zulassungsbescheinigung (siehe Punkt 5) für bis zu fünf Fahrzeuge; getrennt davon Karosserieform und Antriebsart, wenn der Shop danach fragt, ebenfalls für bis zu fünf Fahrzeuge | 1 Jahr | nein | Für die Antwort werden die Werte während des Besuchs gebraucht; ein Jahr und fünf Fahrzeuge gehen darüber hinaus. |
| `rmf_consent` | Cookie | Dass der Besucher den Hinweis bestätigt hat, und wann | 12 Monate | ja | Sonst erschiene der Hinweis auf jeder Seite. |
| `rmf_geraet` | Cookie | Zufällige Kennung des Browsers; die Begrenzung der Anfragen zählt nach dieser Kennung statt nach der IP-Adresse | 1 Jahr | ja | Schutz vor Missbrauch, ohne Besucher auszusperren, die sich im Mobilfunknetz eine IP-Adresse teilen. **Offen: ein Jahr oder nur die Sitzung?** |
| `rmf_view` | Cookie | Die Ansicht (Telefon oder Desktop), die ein Link mit `?view=mobile` oder `?view=desktop` festlegt; solche Links verwenden wir für Vorführungen, einen Schalter dafür hat der Shop nicht | 7 Tage | ja | Wird nur gesetzt, wenn jemand einen solchen Link öffnet und damit diese Ansicht anfordert. **Offen: 7 Tage oder nur die Sitzung?** |
| `rmf_vorschau` | Cookie | Dass das Band „Vorschau“ geschlossen wurde | 30 Tage | ja | Nur in der Testumgebung; der Live-Shop hat dieses Band nicht. |
| `__stripe_mid`, `__stripe_sid` | Cookie von Stripe | Betrugsschutz des Zahlungsdienstes | 1 Jahr, 30 Minuten | ja | Für den Betrugsschutz der Zahlung, die der Besucher an der Kasse anstößt. Stripe setzt beide selbst, sobald dort der Schritt „Zahlung“ geöffnet wird – also schon vor der Zahlung, auch wenn der Besucher dann nicht bezahlt. Stripe ist in der Datenschutzerklärung zu nennen, deren Text noch aussteht (siehe Anhang). |
| `rmf_compare` | Browser-Speicher (bleibt) | Die Felgen, die der Besucher zum Vergleich ausgewählt hat | bis der Besucher den Speicher leert | ja | Der Besucher legt sie ausdrücklich dort ab. |
| `rmf.recent-searches` | Browser-Speicher (bleibt) | Die letzten Suchen, die unter dem Suchfeld angeboten werden | bis der Besucher den Speicher leert | nein | Komfortfunktion. |
| `rmf.kasse.v1` | Browser-Speicher (bis der Tab schließt) | Eingaben an der Kasse, damit sie ein Neuladen der Seite überstehen | bis der Tab schließt | nein | Komfortfunktion; die Bestellung ist auch ohne möglich. |
| `rmf-kontakt-entwurf` | Browser-Speicher (bis der Tab schließt) | Eine begonnene Nachricht im Kontaktformular, damit sie ein Neuladen der Seite übersteht | bis der Tab schließt | nein | Komfortfunktion; die Nachricht lässt sich auch ohne senden. |
| `rmf.nav.depth` | Browser-Speicher (bis der Tab schließt) | Richtung, in die die Telefon-Ansicht beim Zurückgehen gleitet | bis der Tab schließt | nein | Eine Animation, kein Dienst. |

**Was Besucher heute lesen.** Der Hinweis lautet: „Wir verwenden Cookies, die für den Shop nötig sind – für den
Warenkorb und dein gewähltes Fahrzeug.“ Darunter steht nur die Schaltfläche „Verstanden“; eine Einwilligung holt der
Shop nicht ein. Die Tabelle auf der Seite „Datenschutz“ nennt die Cookies aus unserer Tabelle oben mit Inhalt und Dauer
und ordnet jedes als „Notwendig“ oder „Funktional“ ein; nur `rmf_vorschau` fehlt dort, weil es allein in der
Testumgebung gesetzt wird. Zwei dieser Einordnungen weichen von unserer Antwort ab: `rmf_garage` steht dort als
„Notwendig“ (oben: „nein“), `rmf_geraet` als „Funktional“ (oben: „ja“). Die Cookie-Einstellungen beschreiben die
funktionalen Cookies einzeln und verweisen für alle auf diese Tabelle. Den Browser-Speicher nennt der Shop Besuchern
bisher nicht. Nach Ihrer Antwort passen wir Hinweis, Tabelle und Cookie-Einstellungen an.

**Was daraus folgt.** Die sechs Einträge mit „nein“ erfordern nach unserer Lesart eine Einwilligung mit einer
gleichwertigen Schaltfläche „Ablehnen“ – oder sie entfallen. Drei davon (`rmf.kasse.v1`, `rmf-kontakt-entwurf`,
`rmf.nav.depth`) bleiben schon heute nur gespeichert, bis der Tab geschlossen wird; eine Beschränkung auf die Dauer des
Besuchs ist bei ihnen also kein Ausweg. Bei `rmf_papiere` käme in Betracht, nur die Werte des gewählten Fahrzeugs und
nur für die Dauer des Besuchs zu speichern – mehr braucht der Shop für seine Antwort nicht. Welchen Weg der Shop geht,
entscheidet der Mandant; die rechtliche Einordnung bitten wir Sie zu bestätigen.

**Bitte beantworten Sie:**

1. Treffen die Einordnungen „ja“ und „nein“ zu? Falls nicht: bei welchem Eintrag und aus welchem Grund?
2. Dürfen `rmf_vehicle` 90 Tage, `rmf_geraet` ein Jahr und `rmf_view` 7 Tage lang gespeichert bleiben, oder nur für
   die Dauer der Sitzung?
3. Genügt für die Einträge mit „nein“ eine Einwilligung mit gleichwertigem „Ablehnen“, oder raten Sie zum Wegfall?
4. Wäre `rmf_papiere` unbedingt erforderlich, wenn es nur die Werte des gewählten Fahrzeugs und diese nur für die
   Dauer des Besuchs speichern würde?

**Bis zu Ihrer Antwort:** Der Hinweis bleibt, wie er ist, und unsere Prüfung vor dem Start führt den Punkt als offen.
Solange dort ein Punkt zu Recht und Pflichtangaben offen ist, nimmt der Live-Shop keine Zahlung an.

---

## 4 · Erklärung zur Barrierefreiheit (BFSG)

**Die Vorfrage.** Kleinstunternehmen, die Dienstleistungen erbringen, sind vom BFSG ausgenommen. Als
Kleinstunternehmen gilt ein Unternehmen mit weniger als zehn Beschäftigten und einem Jahresumsatz oder einer
Jahresbilanzsumme von höchstens 2 Mio. €. Ob RIMIFY darunter fällt, wissen wir nicht; die Angaben dazu liefert der
Mandant.

**Falls das Gesetz gilt**, braucht der Shop eine Erklärung zur Barrierefreiheit. Den Text verfassen wir nicht selbst.
Für Ihren Entwurf nennen wir, was belegt ist:

- **Ziel:** WCAG 2.2, Stufe AA.
- **Automatische Prüfung:** Bei jedem vollständigen Testlauf prüft das Werkzeug axe-core fünfzehn Seiten des Shops –
  darunter Startseite, Felgenliste, Produktseite, Warenkorb, Kasse und Bestellbestätigung – bei 390 und 1440 Pixel
  Breite anhand der Regeln für WCAG 2.0 (Stufen A und AA) sowie WCAG 2.1 und 2.2 (Stufe AA), Farbkontraste
  eingeschlossen. Der letzte Lauf am 19.10.2026 meldete 0 Verstöße. Geprüft wird außerdem, dass keine dieser Seiten bei
  zwölf Bildschirmbreiten von 320 bis 1920 Pixel seitliches Scrollen erfordert und dass die Fehlerkonsole in drei
  Browsern leer bleibt.
- **Tastatur:** Automatisierte Browser-Tests bedienen unter anderem die Kasse, den Vergleich und die Produktseite mit
  der Tastatur. Bei 390 Pixel Breite wird geprüft, dass der Fokus mit der Tabulatortaste den Fahrzeugwähler in der
  Lesereihenfolge durchläuft.
- **Sprache:** Deutsch, in einfacher Ansprache.
- **Außerhalb unseres Einflusses:** Die Gutachten stehen als PDF-Dateien der jeweiligen Prüfstelle oder des
  Herstellers im Shop. Ob diese Dateien barrierefrei sind, haben wir nicht geprüft; ändern können wir sie nicht.
- **Kontakt für Hinweise:** info@rimify.de

**Bitte beantworten Sie:**

1. Gilt das BFSG für RIMIFY? Maßgeblich sind die Angaben des Mandanten zu Beschäftigtenzahl, Jahresumsatz und
   Jahresbilanzsumme.
2. Falls ja: Liefern Sie den Text der Erklärung, und welche Marktüberwachungsbehörde ist darin zu nennen?
3. Muss die Erklärung die PDF-Dateien Dritter als Einschränkung nennen?

---

## 5 · Werte aus der Zulassungsbescheinigung, auch im ausdruckbaren RIMIFY-Check (#38)

**Zweck.** Ob ein Reifen an einem Fahrzeug zulässig ist, hängt von den zulässigen Achslasten (Felder 8.1 und 8.2 der
Zulassungsbescheinigung Teil I) und der Höchstgeschwindigkeit (Feld T) ab. Liegen dem Shop diese Werte nicht vor,
fragt er den Kunden danach, und zwar nur nach den Werten, die für die Antwort fehlen. Auf Wunsch trägt der Kunde
außerdem die Leistung (P.2) und die Reifenangaben (15.1, 15.2) ein, und wo der Shop danach fragt, Karosserieform und
Antriebsart. Nach Name, Kennzeichen oder Fahrgestellnummer fragt der Shop dabei nie.

**Wo und wie lange die Werte gespeichert werden:**

| Ort | Dauer |
|---|---|
| Im Browser des Kunden (Cookie `rmf_papiere`) | 365 Tage ab dem letzten Eintrag; der Kunde entfernt die Werte eines Fahrzeugs mit „Werte löschen“, Karosserieform und Antriebsart mit „Meine Angaben zu Karosserieform und Antriebsart löschen“, alles zusammen durch Löschen seiner Cookies |
| Im ausdruckbaren RIMIFY-Check, wenn der Kunde einen druckt | 12 Monate, dann mit dem Check gelöscht (nächtlicher Lauf um 03:30 Uhr); gespeichert werden die Werte nur für diesen Check |
| Im Prüfnachweis einer Bestellposition, wenn der Kunde bestellt | So lange wie die Bestellung; unveränderlich, weil der Prüfnachweis belegt, nach welchen Werten die Zulässigkeit beurteilt wurde (siehe Punkt 1) |

**Rechtsgrundlage nach unserer Einordnung:** Art. 6 Abs. 1 lit. b DSGVO (Durchführung vorvertraglicher Maßnahmen auf
Anfrage des Kunden), für das Cookie § 25 Abs. 2 Nr. 2 TDDDG. In der Tabelle zu Punkt 3 haben wir das Cookie allerdings
wegen seiner Speicherdauer als nicht unbedingt erforderlich eingeordnet.

**Bitte beantworten Sie:**

1. Im Prüfnachweis gehören die Werte zur Bestellung und stehen damit neben Name und Anschrift des Kunden; dort
   behandeln wir sie als personenbezogene Daten. Sind sie es auch im Browser und im RIMIFY-Check, wo sie ohne Name,
   Kennzeichen und Fahrgestellnummer gespeichert sind?
2. Trifft die genannte Rechtsgrundlage zu?
3. Können die Fristen (Cookie 365 Tage, RIMIFY-Check 12 Monate) so bleiben, oder welche Fristen nennen Sie?
4. Können Sie in die Datenschutzerklärung aufnehmen, dass `rmf_papiere` auch Leistung (P.2), Tragfähigkeits- und
   Geschwindigkeitsindex der Reifen (15.1, 15.2) sowie Karosserieform und Antriebsart speichern kann?

---

## Anhang · Was außerdem bei Ihnen liegt

Damit Ihre Antwort alles abdeckt, folgen hier die Punkte, die Ihnen bereits bekannt sind oder für die wir Ihren Text
brauchen:

- **Die Rechtstexte selbst:** Impressum, AGB, Widerrufsbelehrung mit Muster-Widerrufsformular, Datenschutzerklärung. Der
  Shop übernimmt Ihre Texte; eigene Rechtstexte verfassen wir nicht (#10).
- **Verträge zur Auftragsverarbeitung** für den Live-Shop: mit Hostinger (Webserver, Datenbank) und mit dem Anbieter
  des Postfachs. Bei AWS und Stripe sind sie Teil der Vertragsbedingungen.
- **Der Ratgeber „ABE, Teilegutachten, ECE – der Unterschied“** erscheint erst nach Ihrer Freigabe. Seine rechtlich
  relevanten Sätze stehen wörtlich in `docs/client-questions.md` (#15–29), ebenso die der beiden anderen Ratgeber
  (#13, #14, #31–33).
- **Der Felgenrechner:** die Toleranzgrenzen für den Abrollumfang und die drei Sätze neben der Ampelanzeige (#34).
- **Das Log des Server-Renderings** wird nicht rotiert und damit unbefristet gespeichert. Es enthält Seitenpfade, keine
  Kundendaten.

---

*Grundlage dieses Schreibens ist der Stand des Codes und der Unterlagen am 19.10.2026: Übersicht der Dienstleister und
Speicherfristen (`docs/legal/VERARBEITUNG.md`), Liste der Cookies (`app/Services/Legal/CookieInventory.php`,
`docs/launch/COOKIES.md`), Prüfung vor dem Start (`rimify:go-live-check`).*
