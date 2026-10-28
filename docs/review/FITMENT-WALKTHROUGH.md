# How RIMIFY decides whether a wheel fits — with your own Borbet documents

*For the meeting on the rim and tyre setup. Ten minutes to read. Every rule here is what the shop does today; where a
document is quoted, the quote is from your Borbet DB8GT2 documents as they are entered: ABE 55255 (19 inch, TÜV
Rheinland) and the Nachtrag 366-0350-21-WIRD/N1 to ABE 53841 (18 inch, TÜV Austria).*

## 1. How the shop decides, in five steps

1. **The car.** The customer gives HSN and TSN (fields 2.1 and 2.2) or picks make, model and variant. Where one HSN/TSN
   fits several variants, the shop asks which one — it never picks for them. From the papers the shop needs the permitted
   axle loads (fields 8.1 front, 8.2 rear) and the top speed (field T).
2. **The document.** The shop looks only at released Gutachten. It takes the rows that name this car — by its type, its
   approval number and, where the document prints one, its kW band — for this exact wheel: width, offset (ET) and
   diameter.
3. **The wheel's answer.** The row says whether the wheel is approved for the car, and under which Auflagen. The shop turns
   every Auflage code into the document's own sentence and says whether an Eintragung is needed. This part rests on the
   document alone; the car's axle loads do not change it.
4. **The tyres' answer.** For each tyre size the row lists, the shop works out the lowest load index and speed symbol
   that may be fitted: half the axle load per tyre, and above 210 km/h less load allowed per the document's table of tyre
   load at speed. Where the document prints its own minimum — your ABE does, as the T-codes (`T84`: „Reifen (LI 84) nur
   zulässig für Fahrzeuge mit zul. Achslasten bis 1000 kg“) — the stricter of the two counts, and the shop says which one
   it used. Without the car's axle loads or top speed the tyres stay „Noch nicht bestätigt“: the shop names the field it
   is missing and asks the customer for it.
5. **The answer shown.** The weaker of the two answers. A wheel approved with Auflagen and tyres not yet confirmed reads
   „Noch nicht bestätigt“, never „Freigegeben“. The rim can still be ordered alone, with the tyre sizes it may only be
   fitted with — unless the document itself limits it by axle load and that load is unknown. A Komplettrad is only sold
   with confirmed tyres.

## 2. Six cases from your documents

The three example cars of the acceptance set, with your DB8GT2 at 18 and 19 inch. Each answer was read from the shop on
our test instance on 28.10.2026 and worked out again by hand from the document; the pictures are in the meeting PDF.
The cars' papers on record: **E46** 320i — 8.1 880 kg, 8.2 1.020 kg, T 226 km/h · **E90** 320i — 935 kg, 1.105 kg,
222 km/h · **X3** 2.0d — 1.130 kg, 1.240 kg, 198 km/h.

### Case 1 — „Freigegeben“ (approved without Auflagen): none, with these two documents

Every row both documents print for these cars carries at least one Auflage that asks something of the customer — the
Abnahme (`A01`, page 7: „Nach Durchführung der Technischen Änderung ist das Fahrzeug unter Vorlage der vorliegenden ABE
unverzüglich einem amtlich anerkannten Sachverständigen … vorzuführen“) or work on the car. The shop therefore says
„Freigegeben mit Auflagen“ for all three, never „Freigegeben“. „Freigegeben“ appears only where every Auflage of the
answer is set to „Hinweis“ in the Auflagenverzeichnis, no Eintragung is needed and the tyres are confirmed without
Auflagen (your item 23). **By hand: agrees.**

### Case 2 — With Auflagen, one size for one axle only: E46, 19 inch (ABE 55255, page 3)

The row for the E46 names 225/35, 235/35 and 245/30 R19 for both axles and 255/30 R19 with `R03` (page 10): „Diese Reifengröße
ist nur an Achse 2 zulässig.“ The shop offers 255/30 R19 on the rear axle only, never in front, and the answer reads
„Freigegeben mit Auflagen“ with „Eintragung in die Fahrzeugpapiere erforderlich“. **By hand: agrees.**

### Case 3 — „Nicht zulässig“: none for these cars — and what the shop says instead

The shop says „Nicht zulässig“ only where a released document has a row for the car and that row leaves the size out.
Both documents name all three cars for both sizes of this wheel, so the case does not arise here. For a car that no
entered row names, the shop does not claim the document refuses it — it may well be in the PDF and not yet entered.
It says: „Dein Fahrzeug ist zu diesem Gutachten bei uns noch nicht erfasst. Sag uns dein Auto, und wir prüfen, ob das
Gutachten es nennt.“ (rule R-17: say only what is on record). **By hand: agrees.**

### Case 4 — Different sizes front and rear, from the document's own list: V19 (ABE 55255, page 12)

V19: „Bei Verwendung verschiedener Reifengrößen an Vorder- und Hinterachse sind folgende Reifenkombinationen, sofern die
Reifengrößen in der Spalte ‚Reifen' aufgeführt sind, möglich: … Nr. 2: 225/35R19 – 245/30R19, 255/30R19, 265/30R19,
305/25R19; … Nr. 6: 235/35R19 – 255/30R19, 265/30R19, 275/30R19, 315/25R19 …“

| Car | Sizes its row allows | Pairs from V19 that fit them | The shop offers |
|---|---|---|---|
| E46 | front 225/35, 235/35, 245/30 · rear also 255/30 | Nr. 2: 225/35 – 245/30 and 225/35 – 255/30 · Nr. 6: 235/35 – 255/30 (Nr. 11, 245/30 – 305/25, drops out: 305/25 is no size of this row) | the same three |
| E90 | front 225/35, 235/35 · rear also 255/30 | Nr. 2: 225/35 – 255/30 · Nr. 6: 235/35 – 255/30 | the same two |
| X3 | 235/45, 245/40, 255/40 | Nr. 8: 235/45 – 255/40 | the same one |

A Komplettrad with different sizes is sold as 2 + 2, each axle with its own minimum load index, and V19's last sentence
— one maker on every tyre, one profile per axle — is applied to the tyres offered. **By hand: agrees, all three cars.**

### Case 5 — Above 210 km/h, where the table of tyre load at speed decides

**With the table — E46, 19 inch (ABE 55255, table on page 6).** The table: a V tyre carries 97 % at 220 km/h and 94 %
at 230 km/h. The E46 is rated 226 km/h; the shop takes the 230 row, the stricter one.

| Axle | Load per tyre | ÷ 94 % | Index by calculation | The document's code | Minimum shown |
|---|---|---|---|---|---|
| Front, 880 kg | 440 kg | 468,1 kg | LI 82 (475 kg) | `T84` (page 10): „Reifen (LI 84) nur zulässig für Fahrzeuge mit zul. Achslasten bis 1000 kg“ | **84 V** — the document is stricter |
| Rear, 1.020 kg | 510 kg | 542,6 kg | LI 87 (545 kg) | `T87` (page 11): LI 87 up to 1.090 kg | **87 V** |

The shop shows exactly this, with each line of the working („Bei 226 km/h trägt ein Reifen mit Geschwindigkeitsindex V
nur 94 % seiner Last (Tabelle auf Seite 6 im Gutachten 55255) …“) and says which source it used. **By hand: agrees.**

**Without the table — E90, 18 inch (the Nachtrag 366-0350-21-WIRD/N1).** The Nachtrag, as entered, prints no such
table and refers the load index and speed symbol to the vehicle papers. For the E90 at 222 km/h the shop therefore
cannot confirm the tyres: „Zu diesem Gutachten ist keine Tragfähigkeitstabelle für hohe Geschwindigkeit hinterlegt.
Für 222 km/h können wir die Reifen deshalb nicht bestätigen.“ The rim is approved with Auflagen; the Komplettrad waits.
This is the behaviour your admin item 15 asks us to change — see Decisions below. **By hand: agrees with the rule as it
stands.**

### Case 6 — No top speed on record: E46 with field T empty

On our test instance only, the E46's top speed was removed for this check and put back afterwards. The answer turns to
„Noch nicht bestätigt“: the rim stays „Freigegeben mit Auflagen“, the tyres wait, and the shop names what it is
missing — „Für die Reifen fehlt uns die Höchstgeschwindigkeit deines Fahrzeugs (Feld T der Zulassungsbescheinigung
Teil I).“ — with a form to type it from the papers. Never a guess, never „Freigegeben“. **By hand: agrees.**

## 3. What the operator must enter, and which mistake causes which wrong answer

| Entered | Why the shop needs it | If it is wrong or missing |
|---|---|---|
| The wheel's sizes: width, ET, diameter, bolt circle, centre bore, Radtypenbezeichnung | Step 2 finds the document's rows by these | A size typed 8J instead of 8,5J matches no row: the wheel shows as not approved — a missed sale, never a wrong approval |
| The document's rows: each car (type, approval number, kW band) and each tyre size, with its codes | Step 2 and 3 | A car left out: no answer for it. A wrong kW band: the wheel offered to a car the document does not name — check every band against the page |
| The Auflagen list: every code with its sentence and its page | Step 3 shows the sentence | A code typed in a row but missing from the list stops the release: the shop refuses to release a document with an unexplained code |
| Codes that limit tyres (`T84`, `R03`, the V19 combinations) | Step 4 | Left out, the shop falls back to its own derivation: still legal, but possibly a different minimum than the document's |
| The table of tyre load at speed (your ABE 55255, page 6) | Step 4 above 210 km/h | Without it, a car faster than 210 km/h gets no confirmed tyres |
| The car's 8.1, 8.2 and T | Step 4 | Missing: the tyres read „Noch nicht bestätigt“ and the customer is asked for them; the rim alone may still be sold |

## 4. Decisions only you can make

| # | Decision | Evidence | Our recommendation |
|---|---|---|---|
| 1 | **V19's last sentence** — „Es sind nur Reifen eines Herstellers und achsweise eines Profiltyps zulässig …“ | The shop applies it as recorded: one maker on all four tyres, one profile per axle, and quotes the sentence where it limits the choice (D-336) | Keep it as the document says it; confirm the customer's wording on the product page with us |
| 2 | **Your admin item 15 — the table of tyre load at speed** | Case 5: with the table (ABE 55255) the E46's tyres are confirmed at 226 km/h; without it (the Nachtrag) the E90's cannot be at 222 km/h. Removing the table would leave every car above 210 km/h without confirmed tyres on documents that print one | Keep the table where the document prints one. For documents like the Nachtrag that refer the tyres to the vehicle papers, a separate decision: should the shop confirm tyres from the customer's own fields 15.1 / 15.2? (A change to how verdicts are made — yours to decide, then ours to build and test.) |
| 3 | **Finding 138 — a second width or ET in one diameter** | Fixed in this release: every approved width and ET of a diameter can now be chosen on the product page, each with its own answer | Check it on the preview with any wheel that has two 19-inch sizes |
| 4 | **The tyres' EU label** | A tyre is offered only once its whole EU label (classes, noise, pictograms, EPREL number) is entered (D-303) | Tell us who supplies the label data — the supplier's file, or entry by hand from EPREL |
| 5 | **Your admin item 17 — the invoice** | Still open: we need to know who issues the invoice and whether the shop keeps a copy, so invoice numbers come from one system only | Your answer decides whether the shop's invoice is switched off |
| 6 | **Your item 17 — whether 3 wheels can be ordered** | The amount can be 1 to 8, four chosen first; the price follows | Decide whether 1–3 make sense for your customers (a spare, a replacement) or whether only sets should be sold |

The other open points — the conflicts between what your lists asked and what was built or told — are in
`docs/review/EXPECTATIONS.md` („Conflicts for the meeting“) and `docs/review/QA-REPORT-CLIENT.md`.
