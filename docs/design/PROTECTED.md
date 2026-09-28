# Protected elements

The signature elements of RIMIFY. None of them is removed, replaced, simplified or swapped for a placeholder
as a side effect of another task (CLAUDE.md, "Placeholder imagery and protected elements"). A rule that seems
to require it is a question for the operator, not a licence. Changing one is its own task, agreed with the
operator, and this file changes in the same commit.

`e2e/protected.spec.ts` checks each one at 1440 and 390 — a structural assertion that says in words what is
missing, and a screenshot baseline beside it. Removing an element fails the suite.

| # | Element | Where | What it is | Why it exists | Introduced |
|---|---|---|---|---|---|
| P1 | **The hero wheel** | `Components/Home/HomeHero.vue`, `Components/Mobile/Home/HeroFrame.vue`, `calloutSlots.ts` | A real photograph of a wheel we sell — today the Borbet DB8GT2, the client's official picture — cut out (`bare`), rolling in from the right once on load: 1,6 picture widths on the desktop, 1,15 on the phone, turning by distance ÷ radius about its own axle, `--d-roll` 1600 ms, `--ease-roll` cubic-bezier(0.5, 1, 0.89, 1), fading in over the first 15 %. Reduced motion and no JavaScript: it stands at rest. The caption names the product; the spec line is the configuration's values. | The moment the client reacted to most: one real wheel, with the document's numbers on it, is the whole promise of the shop in one picture. | `bfde61c0` (stage), `70c8cae3` (photograph, roll-in), `263278a8` (first photograph), Borbet DB8GT2 photographs: the hero-restore commit |
| P2 | **Studio light** | `.hero-studio`, `.hero-contact` in both hero components | The pool of light the wheel stands in and the one contact shadow under it that travels with the roll and never turns. | Makes a cut-out read as an object on a floor instead of a sticker. | `bfde61c0` |
| P3 | **The callouts** | `SpecCallout.vue`, `calloutSlots.ts` | Leaders drawn in after the roll to what a front view shows: the Lochkreis (dashed ring), the cap over the Mittenlochbohrung, the KBA stamp — only when the photographed stamp is the configuration's number. The stamp's box stands on the stamp's side. | The numbers belong to the picture; a spec table beside a photograph proves nothing. | `70c8cae3` |
| P4 | **The numbers section's photograph** | `Components/Home/RimCode*.vue`, `rimCode.ts` | *Was die Zahlen auf einer Felge bedeuten*: the hero wheel's photograph first, marking Maulweite, Zoll, Lochkreis, Mittenlochbohrung and KBA where you press them; the cross-section (*Schnittzeichnung, schematisch, nicht maßstäblich*) second, for the ET. | A photograph shows where a value is on a real wheel; the drawing shows what no photograph can. | `01afd199` (section), the hero-restore commit (photograph first, width and diameter marked) |
| P5 | **Textmarker and stamp** | `Components/Home/GutachtenStory.vue` (and the phone's) | The Gutachten excerpt whose rows are highlighted stroke by stroke as the three steps scroll by, and the *Freigegeben* stamp that lands after step 3. | Shows in five seconds what "the Gutachten names your car" means. | `bfde61c0` |
| P6 | **The turning Komplettrad** | `Components/Home/KomplettradBand.vue` | The dark band's wheel illustration, turning two full turns with the scroll (CSS `view()` timeline, still under reduced motion). | The one dark band; the only motion that follows the reader. | `5890edec` |
| P7 | **The calculator's visual** | `Components/Home/FitmentCalculator.vue` on `/felgenrechner`, the teaser `RimCodeTeaser.vue` on the homepage | The clearance drawing that morphs between the old and the new size, with the tolerance light. | The fourth signature moment: the difference between two sizes, seen rather than read. | `bfde61c0`, page `c67b7957` |
| P8 | **The live count** | `HeroSelector.vue` (`useFitmentCount`), the hero's figures in `GutachtenStory` | *N passende Felgen anzeigen* as the car is chosen; the counts of Gutachten, cars and wheels. | Every figure is a query, never a claim. | `bfde61c0` |
| P9 | **The coverage matrix** | `Pages/Admin/Abdeckung/Index.vue` | Makes × rim sizes, what the documents cover, and the Nachträge whose base is missing. | The operator's one view of where the shop can answer and where it cannot. | `53d8aad9` |

## What changed since approval (audit of 28.09.2026)

| Element | Change | Commit | By |
|---|---|---|---|
| Hero light pass (`.hero-sweep`) | Removed when the photographed roll-in replaced the static stage | `70c8cae3` (22.09.) | The accuracy brief of 22.09. |
| 3D hero wheel (WebGL) | Taken out of the hero; the viewer code stays unused | `70c8cae3` (22.09.) | The accuracy brief of 22.09. |
| Calculator visual on the homepage | Replaced by the numbers section; the calculator moved to `/felgenrechner` behind a teaser | `c67b7957`, `01afd199` (22.09.) | The accuracy brief of 22.09. (D9) |
| Hero photograph and numbers-section photograph | Replaced by a line drawing labelled *Symbolbild* when the demo catalogue left the storefront | `0b9fd246` (27.09.) | Side effect of the review release §2 — restored with the Borbet DB8GT2 photographs |
| Textmarker and stamp, Komplettrad turn, live count, tile hover and compare | Unchanged | — | — |
