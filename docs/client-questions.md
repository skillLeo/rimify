# Questions for the client

Everything on the site that asserts a fact the shop has not confirmed is listed here. Until an item
is confirmed, the site either shows nothing in its place or shows the neutral wording noted below.

## Service and contact

1. **Federal state for public holidays — still open.** The live "Jetzt erreichbar" status uses the
   public holidays of Nordrhein-Westfalen (`DE-NW`). That was assumed from a placeholder phone
   number which has since been removed, so the assumption has no basis left. Please tell us the
   federal state the office is in, or the exact holiday calendar the shop follows.
2. **Opening hours — answered.** Mo–Fr 9–17. The site shows `Mo–Fr 9:00–17:00 Uhr` and the status
   line closes at 17:00. Please say if Saturday hours or a lunch break ever apply.
3. **Phone and WhatsApp — answered: none.** The client has given no phone number and no WhatsApp,
   so the site shows neither; every place that offered a call now offers `info@rimify.de` instead.
   Should a number be published later, it is set in the environment (`RIMIFY_CONTACT_PHONE`,
   `RIMIFY_CONTACT_PHONE_INTL`, `RIMIFY_CONTACT_WHATSAPP`) and appears everywhere at once.

**Fitting partners — still open.** The "Montage in deiner Nähe" section stays switched off
(`RIMIFY_FEATURE_PARTNERS`) until the client names real fitting partners, or confirms there are none
at launch.

## Kompletträder — answered 2026-09-23

The client's team answered in their group; every point below is a decision, not an assumption, and
supersedes the defaults recorded in `docs/specs/komplettrad.md` §11 where the two differ.

- **A set is** rim + tyre + balance weights + optionally an RDKS sensor. Nobody can tell from vehicle
  data which car has RDKS, so **the checkout asks the customer** — no data source is to be invented.
- **RDKS price: a default per sensor plus exceptions per make.** Their example: `15,00 €` default,
  `50,00 €` Porsche. This replaces D-030's fail-closed "no price, no offer" for unknown makes: the
  default is the answer, and only the default being unset leaves the shop silent. Real figures are
  explicitly *not* final ("the real values are not important right now").
- **Shipping: methods the admin creates**, each `{ name, price, description }` — their example:
  Standard `10,00 €`, Premium `30,00 €`. This replaces the single `RIMIFY_SHIPPING_COST_CENTS`
  environment value, and with it the shipping half of the order refusal.
- **Assembly and repacking (Montage und Wuchten): one fixed price, configurable in the admin.**
  This answers D-032, which had it blocking every set; the value moves from config to the database.
- **Balance-weight colours: Silber and Schwarz to start, configurable, no surcharge** (confirms
  D-031 and D-037).
- **Customer-supplied sensors: not accepted.** No "I send my own" path is to be built.
- **Valves belong to the rim** and are never billed separately (confirms D-041). One team member
  still owes an explicit yes; until then nothing in the shop mentions valves.
- **Mixed sizes front and rear must be orderable online.** This **reverses D-035**, which refused a
  staggered set and pointed the customer at e-mail. It becomes its own step: per-axle sizes through
  offer, basket and order, each axle checked against the document separately.
- **Legal texts: placeholders for now**, explicitly approved. The five `/rechtliches/*` pages already
  say which text is outstanding (D-024); nothing else changes until the Kanzlei delivers.
- **Pace: iteration by iteration, no rush**, and they want to see the plan before the next step.
  Roadmap for review: <https://claude.ai/artifact/2zaBfDWb8Us9rRnceeJFdC>.

Still open from this round: winter tyres (a speed symbol below the car's top speed with the sticker
in the car — the engine refuses such a tyre today), and what "Premium" shipping promises, since the
description is the client's own text.

## Navigation

4. **Bottom navigation on phones.** The design foresees *Start · Felgen · Check · Warenkorb · Konto*.
   There is no customer account yet, so the fifth item is *Kontakt* until accounts exist. Please
   confirm whether customer accounts are planned for launch.
5. **Categories in the main navigation.** Only categories with products appear: *Felgen* and
   *RIMIFY-Check* today. *Kompletträder*, *Reifen*, *Marken* and *Ratgeber* appear as soon as the
   catalogue and the guides carry them. Please confirm which categories RIMIFY sells at launch.

## Promises on the homepage

The four titles under the hero are the client's. The line under each promises nothing beyond its
title; please confirm every line, or replace it with the wording the shop can stand behind.

6. **Garantierte Passgenauigkeit** — *Jede Felge, die wir dir zeigen, steht mit deinem Fahrzeug im
   Gutachten.* (What does the guarantee cover if a wheel does not fit — return, refund, exchange?)
7. **Gutachten zu jeder Felge** — *Das Gutachten oder die ABE liegt jeder Bestellung als PDF bei.*
8. **Montiert und gewuchtet** — *Kompletträder verlassen unser Haus fertig montiert und gewuchtet.*
   (Is this done in-house, and for every complete wheel?)
9. **Express-Versand aus Deutschland** — *Lagerware geht innerhalb von 1–2 Werktagen raus.*
   (Please confirm the lead time, the carrier and whether "Express" is a paid option.)

## Legal texts

10. Impressum, Datenschutzerklärung, AGB, Widerrufsbelehrung and the Barrierefreiheitserklärung
    need the client's lawyer's text. The site links to them; it never writes them.
11. Statements about law in the guides (HSN/TSN, ABE vs Teilegutachten vs ECE, Einpresstiefe) are
    written for a lay reader and marked for review; please have them checked before launch.

## Photography and brands

12. See `docs/phase0/ASSET-REQUEST.md` for the photographs, logos and marks the site needs.

## Ratgeber – Aussagen zum Recht, bitte prüfen

The three guides in `database/seeders/content/ratgeber.php` are written for a lay reader and
deliberately cautious. Every sentence below touches law, an authority or an approval procedure and
is quoted verbatim; please confirm each one, correct it, or strike it. Until then the guides stay
unpublished. Item 11 above is the summary; this is the list.

**HSN und TSN finden**

13. „Die Zulassungsbescheinigung Teil I ist das Dokument, das früher Fahrzeugschein hieß.“ (Is this
    equivalence acceptable as stated, or should the guide say the Fahrzeugschein was replaced?)
14. „Achslast und Höchstgeschwindigkeit entscheiden mit darüber, welche Tragfähigkeit und welches
    Geschwindigkeitssymbol die Reifen brauchen und was das Gutachten für dein Fahrzeug freigibt.“
    (Rule for the minimum load index and speed symbol; please confirm the wording.)

**ABE, Teilegutachten, ECE – der Unterschied**

15. „Sie unterscheiden sich darin, wer sie ausstellt und was du nach dem Anschrauben noch tun musst.“
16. „Für Felgen wird sie vom Kraftfahrt-Bundesamt erteilt.“ (Issuing authority for a wheel ABE.)
17. „In vielen Fällen reicht es, die ABE im Fahrzeug mitzuführen und die Auflagen einzuhalten.“ (What
    an ABE exempts the owner from; "in vielen Fällen" is deliberate, not "immer".)
18. „Sie nennt für jedes Fahrzeug, ob eine Abnahme durch eine Prüfstelle und eine Eintragung in die
    Fahrzeugpapiere nötig sind.“ (Is it correct that the ABE itself states this per vehicle?)
19. „Ein Teilegutachten stellt ein Prüflabor oder ein technischer Dienst aus.“ (Issuer.)
20. „Anders als die ABE ist es allein noch keine Erlaubnis.“ (Legal status of a Teilegutachten.)
21. „Mit einem Teilegutachten muss die Änderung an deinem Fahrzeug von einer Prüfstelle abgenommen
    werden.“ (When an Abnahme is required.)
22. „Danach wird die Änderung in die Fahrzeugpapiere eingetragen. Erst dann ist die Felge an deinem
    Fahrzeug freigegeben.“ (When the Eintragung is required and what it completes.)
23. „Vor der Abnahme solltest du mit der Felge nicht auf öffentlichen Straßen unterwegs sein.“ (Written
    as advice, not as a prohibition. Should the trip to the Prüfstelle be mentioned as the exception?)
24. „Die ECE-Genehmigung ist eine internationale Genehmigung nach den Regelungen der
    Wirtschaftskommission der Vereinten Nationen für Europa.“ (Nature of the ECE approval; the
    regulation number is deliberately not named.)
25. „Eine Felge mit ECE-Genehmigung trägt ein eingeprägtes Prüfzeichen.“ (Marking on the wheel.)
26. „Die ECE-Genehmigung wird in Deutschland anerkannt, sie gilt aber nur für die Fahrzeuge und Größen,
    die im zugehörigen Dokument stehen.“ (Recognition in Germany and its scope.)
27. „Ob eine Eintragung nötig ist, hängt wie bei der ABE von den Angaben und den Auflagen im Dokument
    ab.“ (Eintragung under an ECE approval.)
28. „Typische Auflagen betreffen die Reifengröße, den Abstand zur Karosserie oder Bauteile, die
    angepasst werden müssen.“ (Examples only; please confirm they are representative.)
29. „Eintragung heißt: Die Änderung wird in die Zulassungsbescheinigung Teil I aufgenommen. Dafür nimmt
    eine Prüfstelle die Änderung ab und stellt eine Bescheinigung aus, mit der du zur Zulassungsstelle
    gehst.“ (The Eintragung procedure in two sentences; deadlines and fees are deliberately omitted.)
30. Not law, but a promise the shop must be able to keep: „Welches Dokument das ist, siehst du bei der
    Felge, ebenso die Auflagen und ob eine Eintragung nötig ist. Das Dokument selbst kannst du auf der
    Produktseite herunterladen.“ (Same commitment as item 7 and the homepage feature panel.)

**Einpresstiefe (ET) verständlich erklärt**

31. „Genau deshalb steht in jedem Gutachten, welche ET für welches Fahrzeug freigegeben ist.“ (Is
    "jedem" defensible, or should it read "im Gutachten"?)
32. „Eine ET, die dort nicht steht, ist für dieses Fahrzeug nicht freigegeben, auch wenn sie nur wenige
    Millimeter abweicht. Einen Toleranzbereich, den du selbst festlegen könntest, gibt es nicht.“ (No
    tolerance outside the document.)
33. „Das gilt auch für Distanzscheiben. Sie verändern die wirksame ET, und ob sie zusammen mit einer
    bestimmten Felge verwendet werden dürfen, muss ebenfalls in einem Dokument stehen.“ (Spacers need
    their own approval; please confirm the guide may say this at all, or whether spacers should not be
    mentioned.)

**Felgenrechner – die Toleranzampel (Homepage H8 und /felgenrechner)**

34. The calculator shows a green, amber or red light on the change of the *Abrollumfang*
    (rolling circumference ≈ Ø × π × 0,97). The thresholds are a practitioner's rule of thumb
    from the tyre trade, not a figure from a regulation, and need legal review:
    - green for −2,5 % … +1,5 %;
    - red below −12,7 %, derived from the speedometer rule (ECE R39 / § 57 StVZO: the indicated
      speed may never be below the real speed and at most 10 % + 4 km/h above it — at an indicated
      100 km/h the real speed must be at least 96 / 1,1 = 87,3 km/h, i.e. −12,7 %, even from an
      exactly calibrated speedometer);
    - amber everywhere else.

    The three sentences next to the light, please confirm or amend:
    - „Innerhalb der üblichen Toleranz von −2,5 % bis +1,5 %.“
    - „Kleiner als die übliche Toleranz (−2,5 % bis +1,5 %). Der Tacho zeigt dann mehr an als
      bisher – ob das passt, steht in der Freigabe.“ / „Größer als die übliche Toleranz (−2,5 % bis
      +1,5 %). Der Tacho zeigt dann weniger an als bisher – zu wenig darf er nie anzeigen. Ob das
      noch passt, steht in der Freigabe.“
    - „So viel kleiner darf der Abrollumfang nicht sein: Der Tacho würde mehr als 10 % + 4 km/h zu
      viel anzeigen.“

    Every surface of the calculator carries: „Rechenwerte ersetzen kein Gutachten – ob eine
    Kombination zulässig ist, steht im Gutachten. Alle Angaben ohne Gewähr; verbindlich sind
    Fahrzeugschein bzw. CoC und die Reifenfreigabe.“ (Is „Reifenfreigabe“ the right term for the
    manufacturer's tyre release, or should it read „Reifenfreigabe des Herstellers“?)
