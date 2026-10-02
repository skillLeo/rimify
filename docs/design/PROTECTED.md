# Protected elements

The signature elements of RIMIFY. None of them is removed, replaced, simplified or swapped for a placeholder
as a side effect of another task (CLAUDE.md, "Placeholder imagery and protected elements"). A rule that seems
to require it is a question for the operator, not a licence. Changing one is its own task, agreed with the
operator, and this file changes in the same commit.

`e2e/protected.spec.ts` checks each one at 1440 and 390 — a structural assertion that says in words what is
missing, and a screenshot baseline beside it. Removing an element fails the suite.

| # | Element | Where | What it is | Why it exists | Introduced |
|---|---|---|---|---|---|
| P1 | **The hero wheels** | `Components/Home/HomeHero.vue`, `Components/Mobile/Home/HeroFrame.vue`, `calloutSlots.ts` | **Two** real photographs of a wheel we sell — today the Borbet DB8GT2 in Schwarz matt (leading) and Bronze matt (behind it, to the right, 0,8 of its size on the desktop and 0,78 on the phone, on the same axle line — the same wheel further back), the client's official pictures — cut out (`bare`), rolling in from the right once on load, the second 160 ms after the first: 1,6 picture widths on the desktop, 1,15 on the phone, turning by distance ÷ radius about its own axle, `--d-roll` 1600 ms, `--ease-roll` cubic-bezier(0.5, 1, 0.89, 1), fading in over the first 15 %. Reduced motion and no JavaScript: both stand at rest. The callouts belong to the leading wheel only: on the desktop the Mittenlochbohrung top left, the Lochkreis top right above the second wheel, the KBA stamp below with a vertical leg; they draw once both wheels stand. The caption names the product and both finishes — **no price and no link to the product** (the client's #4, agreed by the operator on 02.10.2026, D-108); the spec line is the configuration's values, from the stamp on the photograph (KBA 53841: 8,5J × 18). | The moment the client reacted to most: one real wheel, with the document's numbers on it, is the whole promise of the shop in one picture — and two show the two finishes before anything is clicked. | `bfde61c0` (stage), `70c8cae3` (photograph, roll-in), `263278a8` (first photograph), Borbet DB8GT2 photographs `94418abf`; the second wheel on the operator's decision of 01.10.2026 (this change) |
| P2 | **Studio light** | `.hero-studio`, `.hero-contact` in both hero components | The pool of light the wheel stands in and the one contact shadow under it that travels with the roll and never turns. | Makes a cut-out read as an object on a floor instead of a sticker. | `bfde61c0` |
| P3 | **The callouts** | `SpecCallout.vue`, `calloutSlots.ts` | Leaders drawn in after the roll to what a front view shows: the Lochkreis (dashed ring), the cap over the Mittenlochbohrung, the KBA stamp — only when the photographed stamp is the configuration's number. The stamp's box stands on the stamp's side. | The numbers belong to the picture; a spec table beside a photograph proves nothing. | `70c8cae3` |
| P4 | **The numbers section's photograph** | `Components/Home/RimCode*.vue`, `rimCode.ts` | *Was die Zahlen auf einer Felge bedeuten*: the hero wheel's photograph first, marking Maulweite, Zoll, Lochkreis, Mittenlochbohrung and KBA where you press them; the cross-section (*Schnittzeichnung, schematisch, nicht maßstäblich*) second, for the ET. | A photograph shows where a value is on a real wheel; the drawing shows what no photograph can. | `01afd199` (section), `94418abf` (photograph first, width and diameter marked) |
| P5 | **Textmarker and stamp** | `Components/Home/GutachtenStory.vue` (and the phone's) | The Gutachten excerpt whose rows are highlighted stroke by stroke as the three steps scroll by, and the *Freigegeben* stamp that lands after step 3. | Shows in five seconds what "the Gutachten names your car" means. | `bfde61c0` |
| P6 | **The turning Komplettrad** | `Components/Home/KomplettradBand.vue` | The dark band's wheel illustration, turning two full turns with the scroll (CSS `view()` timeline, still under reduced motion). | The one dark band; the only motion that follows the reader. | `5890edec` |
| P7 | **The calculator's visual** | `Components/Ui/ClearanceDrawing.vue` (`lib/felgenGeometry` `rearScene`) and `Components/Home/FitmentCalculator.vue` on `/felgenrechner`, the teaser `RimCodeTeaser.vue` on the homepage | The clearance drawing that morphs between the old and the new size, with the tolerance light: the rear view of a wheel in its arch, the old wheel dashed and the new one solid, the edge-shift arrows under them — and since the client's #11 the new wheel as a wheel, its disc on the mounting face, its centre plane, **ET** from the centre plane to the face and the **Maulweite** edge to edge, written beside their lines and moving with the wheel; beside it the wheel's middle from outside with the **Lochkreis** and the **Mittenlochbohrung** (schematic, 5 × 112 named as an example). | The fourth signature moment: the difference between two sizes, seen rather than read. | `bfde61c0`, page `c67b7957`, #11 (this change) |
| P8 | **The live count** | `HeroSelector.vue` (`useFitmentCount`), the hero's figures in `GutachtenStory` | *N passende Felgen anzeigen* as the car is chosen; the counts of Gutachten, cars and wheels. | Every figure is a query, never a claim. | `bfde61c0` |
| P9 | **The coverage matrix** | `Pages/Admin/Abdeckung/Index.vue` | Makes × rim sizes, what the documents cover, and the Nachträge whose base is missing. | The operator's one view of where the shop can answer and where it cannot. | `53d8aad9` |

## What changed since approval (audit of 28.09.2026)

| Element | Change | Commit | By |
|---|---|---|---|
| Hero light pass (`.hero-sweep`) | Removed when the photographed roll-in replaced the static stage | `70c8cae3` (22.09.) | The accuracy brief of 22.09. |
| 3D hero wheel (WebGL) | Taken out of the hero; the viewer code stays unused | `70c8cae3` (22.09.) | The accuracy brief of 22.09. |
| Calculator visual on the homepage | Replaced by the numbers section; the calculator moved to `/felgenrechner` behind a teaser | `c67b7957`, `01afd199` (22.09.) | The accuracy brief of 22.09. (D9) |
| Hero photograph and numbers-section photograph | Replaced by a line drawing labelled *Symbolbild* when the demo catalogue left the storefront | `0b9fd246` (27.09.) | Side effect of the review release §2 — restored in `94418abf` with the Borbet DB8GT2 photographs |
| Textmarker and stamp, Komplettrad turn, live count, tile hover and compare | Unchanged | — | — |
| The band behind the hero (P1, P2), the story (P5) and the numbers section (P4) | Its tone from neutral grey `--c-band` to the pale blue-grey `--c-band-blue`; the elements themselves — photographs, roll, studio light, callouts, strokes, stamp — unchanged, and their baselines still match | the #32 commit (02.10.) | The client's #32, in the change-list brief |
| Hero caption (P1) | The price („ab … · pro Felge“ with its PAngV line) and the link to the product taken out; the product's name, both finishes, the spec line and every photograph, roll and callout unchanged | the #4 commit (02.10.) | The client's #4, agreed by the operator in the change-list brief; `e2e/protected.spec.ts` now fails if a price or a product link returns |
| Calculator drawing (P7) | Added to, nothing taken away: the new wheel's disc, screws and centre plane, the ET and Maulweite dimensions with their labels on the sheet, the wheel's middle from outside with the Lochkreis and the Mittenlochbohrung, a fourth key line (*Felgenmitte*). The morph, both wheels, the arrows and their labels, the face, strut and fender unchanged; the P7 baselines renewed | the #11 commit (02.10.) | The client's #11, ordered by the operator in the change-list brief („Redraw the illustration … showing ET, Maulweite and the bolt circle“) |

## The full homepage audit (01.10.2026)

The operator's request after the preview showed the outline and no numbers section for days. Code first — every
change to the homepage since its approval, including the ones that were improvements — then what the **data** on the
preview switched off, which no code review sees.

| What | Change | Commit | Why |
|---|---|---|---|
| Hero 3D wheel (WebGL) and light sweep | Replaced by the photographed wheel rolling in, with measured callouts | `70c8cae3`, `825ce000` (22.09.) | A stand-in photograph under the product's name was confidently wrong |
| Hero studio light (P2) | Unchanged | — | — |
| Calculator on the homepage (P7) | Moved to `/felgenrechner`; the homepage first kept a teaser with three results | `c67b7957` (22.09.) | The calculator outgrew a homepage section |
| Calculator teaser | Replaced by „Was die Zahlen auf einer Felge bedeuten" with the „Größen vergleichen" card to the Felgenrechner; it renders only while the hero has a product | `01afd199` (22.09.) | The accuracy brief (D9) |
| Hero photograph, numbers photograph | Line drawing *Symbolbild* when the demo catalogue left the storefront; brought back on the Borbet DB8GT2 | `0b9fd246` (27.09.), `94418abf` (28.09.) | Side effect of the review release §2 — the overreach this file exists to stop |
| Trust strip (promises) | Phone number, reply time, delivery promises and the PDF download retired; a guard test keeps them out | `26a272ce`, `06d3f298` (22.09.) | Unconfirmed claims (ACCURACY D5, D7) |
| „Beliebt" shelf | Renamed for what it counts (approvals), up to eight wheels | `742295ec` (22.09.) | No sales data behind „beliebt" |
| Komplettrad band (P6) | Photograph of somebody's wheel replaced by a generated illustration, still turning with the scroll | `5890edec` (22.09.) | The photograph was not a Komplettrad we sell |
| Brand wall | Official one-colour logos, every brand shown, greyed without stock, a closing link | `e230d542`, `06b8af2d`, `c816190b`, `3f6293c3` (22.09.) | Review rounds one and two |
| „Sag mir Bescheid" | Offered only where outgoing mail works; on the preview (mail to the log) the forms offer the e-mail address | `981db967` (22.09.) | A double opt-in that cannot arrive |
| Service block | Invented phone and WhatsApp removed; hours Mo–Fr 9:00–17:00 Uhr | `74633d3f` (22.09.) | The client gave no phone |
| FAQ | Content editable in the admin, groups in order; the look unchanged | `e8d20560`, `b1bee4d8` (26.09.) | Admin › Inhalte |
| Textmarker and stamp (P5), live count (P8), tile hover, compare | Unchanged in code | — | — |

**On the preview, switched off by data, not code:**

| What the client saw | Cause | Since | Fixed |
|---|---|---|---|
| Hero: the outline instead of the DB8GT2 rolling in; no numbers section, no „Größen vergleichen" | The hero setting still named a demo model; GoldenRecordSeeder (release seed v5) claimed the hero only where none was chosen, ContentSeeder then cleared the demo choice — no hero product | the deploy of release seed v5 | D-089: the seeder replaces a choice that is no real wheel (release seed v7); `rimify:smoke` now fails on the host without the hero photograph or the numbers section |
| An empty shelf (0 tiles, so no tile hover and no compare), the Gutachten story's figures at 0 Gutachten · 0 Fahrzeuge · 0 Felgen, and no wheel to count for a chosen car — measured on the preview on 01.10.2026; „Schnell finden" keeps its 7 sizes and 13 brands | No published wheel: the demo catalogue never reaches the storefront, and the DB8GT2 waits for its Gutachten and a price | `0b9fd246` (27.09.) | When the three Gutachten are released and the DB8GT2 is priced and published (MEINE-SCHRITTE) |
