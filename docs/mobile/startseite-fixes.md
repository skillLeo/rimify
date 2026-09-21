# Startseite/Mobile — fixes from the design review

Finding numbers refer to `docs/reviews/home.md` §Findings. Only phone-owned files were touched
(`Pages/Startseite/Mobile.vue`, `Components/Mobile/Home/**`, `tests/e2e/mobile/**`, `docs/mobile/**`).
Verified with `npx vitest run resources/js/Components/Mobile resources/js/composables/mobile`
(8 files, 37 tests green), `npx stylelint` on every touched `.vue` (clean) and `npx vue-tsc --noEmit`
(clean). The device lab was not run (a later stage does, single worker).

| # | What changed | Where |
|---|---|---|
| **8 (a)** | The two frame callouts and the line beneath are matched by the same label regexes the desktop uses (*größe\|breite\|durchmesser* → `widthDiameter`, *einpress\|ET* → `offset`, *lochkreis\|LK* → `boltCircle`, *mittenloch\|MLB* → `centreBore`), with the desktop's fallback (an unknown label takes the next free slot in shipping order). The server's *Breite × Durchmesser* now renders as a callout and the line beneath reads *LK … · MLB …* only. | `resources/js/Components/Mobile/Home/calloutSlots.ts` (new: `CALLOUT_SLOTS`, `slotFor`, `assignSlots`, `SHORT_LABEL`); `HeroFrame.vue:23`, `:43-67` |
| **8 (a)** | Leader-line targets come from `hero-wheel.json` `targets` (calibrated for the desktop frame) mapped through the wheel box into the 7 / 6 phone frame, so a cut-out swap edits data, not code. | `calloutSlots.ts` (`DESKTOP_FRAME`, `PHONE_FRAME`, `mapTarget`, `phoneTargets`); `HeroFrame.vue:50` |
| **8 (b)** | `:deep(.callout-anchor) { z-index: var(--z-raised) }` — the *Einpresstiefe* box and its line paint over the wheel. | `HeroFrame.vue:160-162` |
| **8 (c)** | The `.picture { background-image: none }` override is gone; the shared `Picture` skips its placeholder for a `fallback: "png"` manifest. | `HeroFrame.vue` (former `:121-123` removed) |
| **22** | With `hero.product.symbolic`, the frame is a `div` (no link, no `aria-label`), the caption is not rendered — no brand, no model, no price — and one line `.micro .quiet` *Symbolbild – Werte einer Beispielkonfiguration* stands under the values line; the `alt` is *Symbolbild einer Felge, Ansicht von vorn*. Not symbolic: link, caption and product `alt` as before. | `HeroFrame.vue:37-39`, `:71-78`, `:95-99` |
| **12** | Crop columns 18 / 10 / 36 / 24 / 12 %, `padding-right: 2px`, `font-stretch: 75%` on `.doc--crop`, one tyre size per crop row; stroke 1 follows the new *Typ* edge (18 %). Rows are the desktop story's `EXAMPLE_ROWS` copied verbatim (rows 3–5: *Mercedes-Benz C-Klasse W205 · BMW 3er Coupé 346C · Škoda Octavia 5E*) — the desktop keeps them inline, so a shared module is requested in `REQUESTS.md`. | `resources/js/Components/Mobile/Home/GutachtenStory.vue:31-60`, `:93`, `:125-131`, `:212-214`, `:245`, `:260-264` |
| **16** | `felgen()` from `format.ts` for the size tiles, the brand cells and their `aria-label`; `passende()` (line 60) puts the adjective between the number and `felgen()`'s noun — *1 passende Felge*, *9 passende Felgen* — for the size line and the listing button. | `resources/js/Pages/Startseite/Mobile.vue:29`, `:59-60`, `:100`, `:116`, `:330`, `:333` |
| **19** | `.home-promises__item { align-content: start }`. | `Mobile.vue:488` |
| **20** | Guide tiles on the band: no background, no padding, no teaser — title `.h4` and reading time only (`min-height: 44px` keeps the target). | `Mobile.vue:400-403`, `:668-676` |
| **21** | `Kompletträder&nbsp;– montiert und gewuchtet.` | `Mobile.vue:343` |
| **27** | The `0005` / `582` placeholders are removed from the HSN and TSN fields. | `resources/js/Components/Mobile/Home/VehiclePanel.vue:424-425`, `:442-443` |
| **11** | `54ch` on the subline and the H8 lead. | `Mobile.vue:445`, `:460` |
| **4** | The lifestyle photograph is gone from H7. The phone shows the `hero-wheel.json` cut-out at 240 px, centred, `--sp-32` above and below (grid gap 16 + margin 16), with the desktop's scroll-driven turn (`@supports (animation-timeline: view())`, 0° → −120°, `entry 0% exit 100%`), `WheelOutline` in `--c-on-dark-2` on error, static at 0° under reduced motion and where the browser has no scroll timeline. No scroll listener. | `resources/js/Components/Mobile/Home/KomplettradWheel.vue` (new); `Mobile.vue:19`, `:346`, `:635-637` |
| **13** | **Not done.** `Components/Home/FitmentCalculator.vue` has no `layout` prop yet (its props are `{ prefill }` only), so the phone keeps the current mount; `layout="tabs"` goes in as soon as the shared component carries it (`REQUESTS.md`). | `Mobile.vue:367` |

## Overflow and targets

- Every shelf is unchanged (`Shelf.vue`: inner scroll container, `min-width: 0` on items); the
  new guide tile is narrower than before (no padding), the dark-band wheel is `width: 240px;
  max-width: 100%` inside the container, the crops keep `table-layout: fixed` at 100 %. Nothing
  new can widen the document.
- Targets: the guide link is `min-height: 44px` (title 26 + gap 8 + meta 20 = 54 px); the hero
  caption keeps `min-height: 44px` when rendered; with a symbolic picture the frame is no longer a
  link, so no target is lost below 44 px. Size tiles, brand cells and buttons are untouched.

## Tests added

- `Components/Mobile/Home/calloutSlots.test.ts` — the regex table, label-first assignment with the
  order fallback, the fifth value dropped, the frame mapping (rim lip 35/11 → 34/12, hub 59/41 →
  60/41, the centre stays the centre), manifest targets over defaults.
- `Components/Mobile/Home/HeroFrame.test.ts` — server labels render as two callouts and the *LK · MLB*
  line (no doubled *LK*), the product link and caption when not symbolic, no link / no brand / no
  price / the *Symbolbild* sentence when symbolic, `is-ready` on load, the outline on error with the
  callouts kept.
- `Components/Mobile/Home/GutachtenStory.test.ts` — three crops with the five headings, the verbatim
  rows 3–5 with one tyre size each, 2 / 4 / 6 marker paths, the stamp only on crop 3, codes inside
  the document only, the facts line.
- `Components/Mobile/Home/KomplettradWheel.test.ts` — lazy square cut-out at `sizes="240px"`, the
  outline on error.
- `tests/e2e/mobile/startseite.spec.ts` — size and brand counts accept `felgen()`'s narrow no-break
  space and the singular; new journeys: the hero frame (two callouts, the key line, symbolic vs.
  linked, no placeholders in HSN/TSN), the Gutachten crops (no ellipsised cell, one tyre size, the
  marked row, the stamp), the dark band (no photograph, the square cut-out ≤ 240 px), the guides
  without a teaser.
