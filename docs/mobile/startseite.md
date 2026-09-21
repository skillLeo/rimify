# Startseite/Mobile — what was built, how it was checked

`resources/js/Pages/Startseite/Mobile.vue`, served by `DevicePage::resolve('Startseite')` to every
phone UA, with `resources/js/Components/Mobile/Home/{VehiclePanel,HeroFrame,GutachtenStory}.vue`
and `resources/js/composables/mobile/useVehiclePicker.ts`. Spec: `docs/design/sections/home.md`
(phone column), under DIRECTION and the phase-0 addendum. Same `StartseiteProps` as the desktop
document (`hero.sublineMobile`, `fitmentCount`, `sizes[].fitting`, `brands[].count` included);
`garage` and `serviceStatus` come from the shared props through `useShared()`.

## Sections, in DOM order

| ID | Built as | Tone / padding (with H9 off, as served today) |
|---|---|---|
| H2 | `h1` (34/40, `max-width: 14ch`; *Felgen, die an deinen {short} dürfen.* with a vehicle) → phone subline (17/26) → the panel → the hero frame | `--c-band`, `--sp-24` / `--sp-40` |
| H3 | four text-led items 2 × 2, icon 20 above the title, hairline above | `--c-surface`, `--sp-24` |
| H4 | `h2` + facts line (`hero.stats`, only when every count > 0) + three stacked blocks, each with its own static document crop and marker state | band, `.section` |
| H5 (+H5b) | `h2` (*Beliebt für deinen {short}* with a vehicle), tabs (partial reload of `popular` with `?beliebt=`), shelf of 8 `ProductTile`s at 62vw, *Alle Felgen ansehen* / *{total} passende Felgen anzeigen*; H5b shelf when history exists | surface, `.section--tight` |
| H6 | size shelf (96 px tiles, `.display .num` 40/44, only `count > 0`; with a vehicle the line reads *{fitting} passende Felgen* and a size with `fitting === 0` is struck — `--c-ink-3`, line-through, `aria-disabled`, not a link, never hidden), brand hairline grid 3 per row (mask logo or `.h4` wordmark, *{count} Felgen*, `aria-label` *{name}: {count} Felgen*) | band, `.section` |
| H7 | dark band: `h2`, sentence, the cut-out (`hero-wheel.json` through `KomplettradWheel.vue`) at 240 px turning 0° → −120° with the scroll (`animation-timeline: view()`, static under reduced motion), `TyreLabel` at full width, `.btn--light` | `--c-dark`, `.section--tight` (does not consume a tone slot) |
| H8 | `h2`, lead, the shared `FitmentCalculator` (two stacked fieldsets, drawing, values, honest line, *Link kopieren*) | surface, `.section` |
| H9 | only with `partners.enabled`: `h2` + *Beispieldaten* badge, PLZ field, button, the empty line | band, `.section--tight` |
| H10 | `h2`, shelf (78vw) of the three guides, each one link to `/ratgeber/{slug}` (title `.h4` and reading time; no box, no teaser) | band, `.section--tight` |
| H11 | `h2`, status line with the 8 px dot (`--c-ok` when open), four contact rows (tel, WhatsApp, mail, hours), `Accordion` of five FAQs, *Alle Fragen ansehen* | surface, `.section` |

The tone alternates over the light sections and the padding over all of them (home.md §0.3), so
with H9 off H10 is band + tight and H11 surface + section — exactly the assignment the spec
names for that case. Every section carries `id`, `data-section` and `aria-labelledby`.

## The selector panel (H2)

- *Fahrzeugschein fotografieren*: `.btn--secondary .btn--block` with the camera icon; a hidden
  `<input type="file" accept="image/*" capture="environment">` opens the camera. The photo goes to
  `Components/Home/DocumentScan.vue`, loaded lazily through `import.meta.glob` (assumed contract
  in `REQUESTS.md`); while it is not in the build, the tap switches to the HSN/TSN tab with the
  caret in HSN and says *Wir konnten HSN und TSN nicht lesen. Trag sie bitte von Hand ein.*
- Tabs *Marke & Modell · HSN/TSN* (`role="tablist"`, `.tabs__list`).
- Marke → Modell → Fahrzeug as native selects; the next list is fetched from
  `/api/v1/vehicles/models` and `/variants` (`useVehiclePicker`: every request aborts the last, a
  late answer is dropped, a failed list says so and offers `/felgen-suchen?marke=`). Variant rows
  read `{variant} · {kW} kW · {buildWindow}`; a `needsReview` row is disabled and says
  *(unvollständige Daten)* (R-03).
- HSN `inputmode="numeric"` (four digits, the caret moves on), TSN `autocapitalize="characters"`
  (three, pasted spaces stripped), `.input--code`, errors on blur (*Die HSN hat vier Ziffern.* /
  *Die TSN hat drei Zeichen.*).
- Live count (F1) from `/api/v1/fitment/count`: skeleton → *{count} Felgen mit Gutachten für
  {label}*; failed → *Die Anzahl lässt sich gerade nicht laden.* with the button still working;
  zero → the notice and the notify form (F2: `POST /api/v1/fitment/notify` with the XSRF cookie
  as header; 202 → the thank-you sentence, 422 → the field's own message, anything else → the
  line with the phone number); ambiguous → radio rows and
  *Dieses Fahrzeug wählen*, disabled until one is picked, the primary button disabled meanwhile
  (R-01); not found → the typed values stay, *Nochmal prüfen · Über Marke & Modell wählen ·
  Anrufen: {phone}* (R-09).
- Button: *Fahrzeug wählen* (disabled) → *Passende Felgen anzeigen* → *{count} passende Felgen
  anzeigen* → *Keine Felgen für dieses Fahrzeug*; submits `POST /fahrzeug` with the id, or
  `POST /fahrzeug/schluesselnummern` when the count service is down but the keys are complete.
- *Wo finde ich HSN und TSN?* opens a `BottomSheet` with `DocFacsimile` (new / old document as
  two chips) and the sentence about fields 2.1 and 2.2.
- Garage chips (*Zuletzt gewählt:*) post the saved vehicle.
- With a vehicle: *Dein Fahrzeug* · `.h3` label · key numbers · build window · the count line
  from `fitmentCount.count` (falling back to `popular.total`) · the primary link to `/felgen`
  carrying that count · *Fahrzeug ändern* · *Fahrzeug entfernen*.

## Hero frame

`HeroFrame.vue`: the cut-out (`images/hero-wheel.json` through the shared `Picture`, whose
`<img>` fallback follows the manifest's `fallback: "png"`) at 70 % of a 7 / 6 frame, on `.hero-studio` (light pool) and
`.hero-contact` (the ellipse it stands on) — the two allowlisted gradients — with two
`SpecCallout`s (the size and the offset, matched by the desktop's label regexes in
`calloutSlots.ts`, targets from the manifest mapped into the phone frame), the line *LK … · MLB …*
beneath, and the caption link (brand · model · finish, *ab {price} · pro Felge*). While
`product.symbolic` the frame names no product — no link, no brand, no price — and one `.micro`
line says *Symbolbild – Werte einer Beispielkonfiguration*. Lazy; the lines draw on `load`
(`.frame.is-ready`). `WheelOutline` at 60 % if the image fails. See `startseite-fixes.md`.

## Gutachten story

`GutachtenStory.vue`: three blocks, each a crop of the fictional *Teilegutachten Nr. 12-3456
(Beispiel)* (the desktop's rows 3–5 verbatim, one tyre size each, five columns at 18 / 10 / 36 /
24 / 12 %, 28 px rows, `--fs-micro`, `font-stretch: 75%`) with an SVG
marker overlay (`--c-marker` through an SVG gradient, `mix-blend-mode: multiply`, two wavy
strokes per highlight, 22 px, `non-scaling-stroke`): block 1 marks *Typ · Genehmigungsnr.*, block
2 the whole row and its tyre sizes, block 3 everything plus the *Freigegeben* stamp at −4°. Step 3
shows the *Mit Auflagen* badge with two full sentences. Static on the phone, as specified.

## Checks

| Check | Result |
|---|---|
| `lint:css`, `vue-tsc` | clean |
| `overflow.mjs --routes /` | clean at 320, 360, 375, 390, 414, 430, 768, 834, 1024, 1280, 1440, 1920 |
| `console.mjs --routes / --width 390` | clean in Chromium, WebKit, Firefox — no errors, no failed requests |
| `axe.mjs --routes / --width 390`, with and without `--vehicle` | zero violations |
| `style-inventory.mjs --routes / --width 390` | clean: every colour, radius, shadow, family and size resolves to a token; gradients only on `.hero-studio` / `.hero-contact` |
| Fold at 390 × 844 (Pixel-7 UA, consent made) | `h1` and the whole panel in view; primary button 692–744 px, tab bar from 788 px; button centre at 85 % of the viewport (bottom 40 %) |
| One `h1` | yes (the large-title mode is not used on this page) |
| Device lab `startseite.spec.ts` | see the run summary below |

### Interaction latency at 4× CPU (Pixel 8 / Galaxy A55 emulation, headless Chromium)

The lab's first run put the FAQ tap at 256–448 ms and the first tab tap at 200–224 ms — the
page is ~10 000 CSS px tall, and a tap in the panel relaid out and repainted everything under
it. Three changes, measured with the same taps and the same throttle by applying the CSS through
the CSSOM to the served build (two passes each, one worker):

| Configuration | HSN/TSN tab | Marke & Modell tab | Neu tab | FAQ trigger |
|---|---|---|---|---|
| as built | 168 · 120 | 144 · 120 | 176 · 88 | **264** · 176 |
| `content-visibility: auto` on H4–H10 | 120 · 80 | 56 · 96 | 72 · 96 | 192 · **216** |
| `content-visibility: auto` on H4–H11 (built) | 72 · 88 | 56 · 48 | 80 · 72 | 168 · 160 |

So `.home-below` (`content-visibility: auto; contain-intrinsic-size: auto 800px`) is on every
section from H4 down, the marker's blend group is isolated (`isolation: isolate` on the table
wrap), and the selector's two tab panels are `v-show`n rather than rebuilt. Numbers are event
durations (`PerformanceEventTiming`, `click`), which on this software-rendered emulator include
raster; a real device with a GPU is faster. The lab test now lets each tap settle before the next
and counts `click` once.

`startseite.spec.ts` covers: the fold (button above the bar and in the thumb zone at ≥ 800 px
tall; tabs in view and the button reachable on the 667 px iPhone SE and in landscape), screen
checks (overflow, 44 px targets, 12 px text), section order and rhythm, the promise row, the
camera input, HSN/TSN → count → listing → back shows the vehicle, Marke → Modell → Fahrzeug through
the selects, the ambiguous pair (1860/AAS) asking instead of guessing, the unknown pair with its
three routes, the help sheet closing on back, the popular shelf and the tab reload, verdict badges
with and without a vehicle, size and brand links, the calculator, the service block, and — on
Chromium at 4× CPU — event durations ≤ 200 ms.

Screenshots: `docs/mobile/shots/startseite/<device>.png` (fold), `<device>-full.png`,
`<device>-ambiguous.png`, `<device>-vehicle.png`, for iphone-se, iphone-16, iphone-16-pro-max,
iphone-16-landscape, pixel-8, galaxy-a55.

### Last device-lab run (six projects, 162 tests, 20,5 min, three workers)

149 passed · 5 failed · 8 skipped. The 8 skips are the two Chromium-only tests (service-worker
cache contents, 4× CPU latency) on the four WebKit projects — they run on Pixel 8 and Galaxy A55.
The 5 failures, each with its cause and fix:

| Test | Device | Cause | Fix |
|---|---|---|---|
| a sheet link navigates and the history has no dead entry | iPhone 16 Pro Max | the layout closed sheets on Inertia's `before` for a **prefetch** (fired on the row's `pointerdown`); the click then landed on a closing row and no visit was issued | `isNavigationVisit()` in `useMobileShell.ts`, unit-tested; `MobileLayout.vue` ignores prefetches and partial reloads |
| search result opens the product | iPhone 16 landscape | same cause | same fix |
| screenshots › startseite | iPhone 16 landscape | same cause (the search step) | same fix |
| interaction latency ≤ 200 ms at 4× CPU | Pixel 8, Galaxy A55 | FAQ tap 256–448 ms: the whole page relaid out under it; the test also measured the previous tap's reload | `content-visibility: auto` on H4–H11, isolated blend group, `v-show` tab panels (table above); the test lets each tap settle |

The three sheet cases passed on iPhone SE and iPhone 16 in the same run; the fixes are in source,
type-checked, linted and unit-tested, and need the coordinator's rebuild followed by
`npx playwright test -c tests/e2e/mobile/playwright.config.ts` (one worker — the config's default;
`artisan serve` is single-threaded) to be confirmed end to end.

## Not built yet, and why

- H9 renders only with the `partners` flag (off here); its endpoint and the map come later
  (main agent's decision).
- The Kompletträder button leads to `/felgen` (vehicle) or `/felgen-suchen` (none): `/komplettraeder`
  comes later. The turning cut-out is the hero's rim (`hero-wheel.json`) until `komplettrad.json`
  is the square rim-with-tyre cut-out (`REQUESTS.md`).
- The calculator keeps the shared component's two stacked fieldsets rather than *Aktuell · Neu*
  tabs; the `layout="tabs"` prop on the shared component is still absent (`REQUESTS.md`).
- The last device-lab run predates the coordinator's answers (notify endpoint, guide links, the
  shared `Picture`, the typed props) and the sheet-on-prefetch fix in `MobileLayout.vue`; those
  changes are type-checked, linted and unit-tested, and the lab
  (`npx playwright test -c tests/e2e/mobile/playwright.config.ts`, one worker — `artisan serve`
  is single-threaded) must be re-run after the coordinator's rebuild to confirm them end to end.
