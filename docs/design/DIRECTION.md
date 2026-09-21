# RIMIFY — design direction

Binding on every screen, component and stylesheet in `resources/`. Where a Figma mock, an older
prototype or a memory of either disagrees with this document, this document wins. The tokens it
names live in `resources/css/tokens.css`; a component references a token and never writes a value
of its own. Stylelint (`npm run lint:css`) and the style inventory (`scripts/qa/style-inventory.mjs`)
enforce that by machine.

## 1 · Concept — Prüfstandard

German engineering documentation meets premium automotive retail. Calm, exact, trustworthy.
Precision is the aesthetic. The site is not decorated; it is set, the way a good type-approval
document is set: one typeface, a strict grid, numbers treated as headlines, colour only where it
carries meaning.

What makes it RIMIFY's and nobody else's is the material only RIMIFY has:

- spec callouts with thin leader lines on real wheel photography — `8,5 J × 19 · ET 35 · LK 5 × 120`;
- one verdict system, identical everywhere — *Freigegeben · Mit Auflagen · Nicht freigegeben ·
  Unbekannt*;
- the Gutachten excerpt with the customer's vehicle row highlighted;
- the offset cross-section drawing;
- typographic size tiles (*16 … 22 Zoll*).

These carry the identity. Decoration never does. If a section still reads as RIMIFY with the logo
swapped for a competitor's, the section has failed.

## 2 · Colour — neutral first, blue for action, colour only for meaning

```css
--c-ink: #0B0F14;      --c-ink-2: #3A424D;      --c-ink-3: #5F6875;       /* text: primary, secondary, tertiary */
--c-line: #E2E5E9;     --c-line-2: #C9CED5;                                /* dividers, input borders / strong */
--c-surface: #FFFFFF;  --c-band: #F3F4F6;                                  /* page, alternating band, image tiles */
--c-dark: #0B0F14;     --c-dark-2: #161B22;     --c-on-dark-2: #A9B1BC;   /* dark bands */
--c-blue: #1A44D4;     --c-blue-hover: #1638B4; --c-blue-press: #122E94;  --c-blue-tint: #E8EDFB;  /* action only */
--c-ok: #1D7A35;       --c-ok-tint: #E6F3E9;    /* Freigegeben, lieferbar */
--c-warn: #8A5700;     --c-warn-tint: #FBF0D9;  /* Mit Auflagen, knapp */
--c-bad: #B3261E;      --c-bad-tint: #FBE9E7;   /* Nicht freigegeben, Fehler */
--c-unk: #5F6875;      --c-unk-tint: #EEF0F3;   /* Unbekannt */
--c-star: #E9A800;                              /* ratings only */
```

- About 85 % of any screen is neutral, 10 % photography, 5 % blue.
- Blue means "act here": primary buttons, links, focus, the selected state. Never a background for
  mood, never a rule, never an icon that does nothing.
- Green, amber and red appear only as verdicts, stock and errors. `Unbekannt` is neutral grey so
  it can never be mistaken for a refusal.
- No tinted section backgrounds. Sections alternate `--c-surface` and `--c-band`; one dark band
  (`--c-dark`) per page at most.
- Text on dark bands is `--c-surface` (primary) and `--c-on-dark-2` (secondary). Scrims over
  photography are `--c-ink` at 40–60 % alpha; they are the only place a gradient may appear, and
  only on an element carrying `.photo-scrim` or `.band-scrim`.

## 3 · Type — one family, a real scale

**Archivo Variable**, self-hosted from `@fontsource-variable/archivo/wdth.css` (weights 100–900,
widths 62–125 %). Self-hosting is a legal point in Germany, not a preference (LG München I,
20.01.2022, Az. 3 O 17493/20). A metric-matched fallback face is generated at build time so the
swap causes no layout shift. No second family: measured values are set in the same face with
tabular figures.

| Token | ≥ 1024 px | < 1024 px | Weight / width |
|---|---|---|---|
| `--fs-display` / `--lh-display` | 64 / 68 | 40 / 44 | 700 / 112 %, tracking −0.02em |
| `--fs-h1` / `--lh-h1` | 48 / 54 | 34 / 40 | 700 / 110 % |
| `--fs-h2` / `--lh-h2` | 36 / 42 | 28 / 34 | 700 / 110 % |
| `--fs-h3` / `--lh-h3` | 24 / 30 | 21 / 28 | 600 / 100 % |
| `--fs-h4` / `--lh-h4` | 20 / 28 | 18 / 26 | 600 / 100 % |
| `--fs-body-l` / `--lh-body-l` | 18 / 28 | 17 / 26 | 400 |
| `--fs-body` / `--lh-body` | 16 / 24 | 16 / 24 | 400 |
| `--fs-small` / `--lh-small` | 14 / 20 | 14 / 20 | 400; 500 for labels |
| `--fs-micro` / `--lh-micro` | 12 / 16 | 12 / 16 | legal and captions only |

- Sentence case everywhere. No uppercase letter-spaced labels — a label is a word in `--fs-small`
  weight 500, `--c-ink-2`, above its value.
- `font-variant-numeric: tabular-nums` on every price, size, count and date.
- A number and its unit are joined with a narrow no-break space: `72,6 mm`, `189,00 €`, `ET 35`.
- Body text measures 60–72 characters; `max-width: 68ch` on running text.
- `hyphens: auto` on body text, `overflow-wrap: anywhere` inside tight tiles, `lang="de"` on the
  document. Tested with *Kraftfahrzeug-Zulassungsbescheinigung* and *Reifendruckkontrollsystem*.

## 4 · Grid, spacing, radius, elevation, layers

**Grid.** One page grid, defined once and never nested:

| Viewport | Columns | Page margin | Gutter | Content |
|---|---|---|---|---|
| ≥ 1280 px | 12 | auto (centred) | 24 | max 1296 px |
| 1024–1279 | 12 | 40 | 24 | fluid |
| 768–1023 | 8 | 32 | 20 | fluid |
| < 768 | 4 | 20 | 16 | fluid |

`.container` applies the margin and the maximum; `.grid` applies the columns and the gutter. A
component's own internal layout uses flexbox or a local grid, never a second page grid.

**Spacing.** `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96 · 128` as `--sp-4` … `--sp-128`.
Nothing else. More space around a group than within it. Section padding is `--sp-64` (mobile) to
`--sp-96` (desktop), and two neighbouring sections never share the same padding twice in a row.

**Radius.** `--r-control: 4px` for buttons, inputs, chips and badges · `--r-tile: 8px` for image
tiles, popovers, dialogs and the selector panel · `0` for full-bleed media. Fully rounded
(`--r-round`) only for radio buttons, dots and count badges — never a pill button, never a card.

**Borders.** `1px solid var(--c-line)` for inputs, dividers and tables only. Never a border and a
shadow on the same element. Content is separated with space, bands and alignment, not boxes.

**Elevation.** Exactly three shadows, and nothing else casts one:

```css
--e-1: 0 1px 0 var(--c-line);                                   /* the sticky header once scrolled */
--e-2: 0 2px 4px rgb(11 15 20 / .06), 0 8px 24px rgb(11 15 20 / .10);  /* menus, popovers, palette, the selector panel */
--e-3: 0 16px 48px rgb(11 15 20 / .22);                         /* dialogs, drawers */
```

**Layers.** `--z-sticky: 100 · --z-header: 200 · --z-dropdown: 300 · --z-overlay: 400 ·
--z-dialog: 500 · --z-toast: 600 · --z-skip: 700` for the page; `--z-base: 1 · --z-raised: 2` to
order overlapping children inside one component (a badge over a tile's image, a checkbox over its
stretched link). No other z-index exists.

## 5 · Motion — only where it explains something

```css
--d-1: 120ms;  /* hover, press */
--d-2: 200ms;  /* menus, tabs, toggles */
--d-3: 320ms;  /* dialogs, drawers, page transitions */
--d-4: 600ms;  /* the signature moments only */
--ease-out: cubic-bezier(.2, 0, 0, 1);
--ease-in: cubic-bezier(.4, 0, 1, 1);
--ease-std: cubic-bezier(.4, 0, .2, 1);
```

- Only `transform`, `opacity` and SVG `stroke-dashoffset` are animated. Never `transition: all`,
  never height, width, padding or position.
- No bounce, no springs, no staggered cascades, no parallax on text, no custom cursors, no magnetic
  buttons, no fade-up on scroll. Nothing animates by itself except the homepage's four signature
  moments (callout lines drawing in, the Gutachten highlight following the steps, the wheel turning
  with the scroll in the dark band, the cross-section morphing between values).
- `prefers-reduced-motion: reduce` → no motion; every element rests in its end state.
- A price, a stock figure or a verdict never animates. Numbers change instantly.
- Scrolling is native. No smooth-scroll library. Every anchor target carries `scroll-margin-top`
  equal to the header plus the vehicle bar.

## 6 · Interaction states — every interactive element, no exceptions

- **Hover** only inside `@media (hover: hover) and (pointer: fine)`: a colour change, an underline
  or an image swap. A card is never lifted or scaled.
- **Focus-visible:** `2px solid var(--c-blue)` outline, `2px` offset; `--c-surface` on dark bands.
  Never `outline: none` without a replacement of equal visibility.
- **Active:** the pressed colour; a button may move 1 px down, nothing more.
  `-webkit-tap-highlight-color: transparent`, with a designed `:active` state for touch.
- **Disabled:** `--c-band` fill, `--c-ink-3` text; `aria-disabled` plus a sentence saying why when
  the customer needs to know.
- **Loading:** the button keeps its width, the label gives way to a spinner, `aria-busy="true"`;
  a second submit is impossible.
- **Empty, error:** designed, in German, naming the situation and the next step. A skeleton mirrors
  the final layout exactly; a spinner never stands in for layout that is already known.
- Touch targets are at least 44 × 44 px on the phone document and at least 24 × 24 px, with
  spacing, on desktop.

## 7 · Icons, imagery, copy

**Icons.** One custom set in `resources/js/icons/`: a 24 px grid, 1.5 px stroke, square caps,
mitre joins, optically aligned to the cap height. Only what is needed — search, car, document,
check, warning, close, chevrons, arrow, cart, user, truck, wrench, phone, mail, clock, map pin,
camera, keyboard, filter, sort, info, plus, minus, compare, heart. No icon library. Payment,
shipping and WhatsApp marks come from the official brand kits and are never redrawn. An icon never
sits in a coloured tile above a heading.

**Imagery.** Real photography only. Packshots 1:1 on a seamless light grey, the same three-quarter
angle and light for every wheel; lifestyle shots of real cars in natural light, low angle, wheel in
focus, one colour grade. No AI images, no stock people, no illustrated cars, no isometric art. The
drawn SVG wheel survives only as the `onerror` fallback of a real photograph. Every image has
`width` and `height` or an aspect-ratio box; `<picture>` with AVIF → WebP → JPEG and `srcset`; the
hero image is preloaded with `fetchpriority="high"`, everything below the fold is lazy.

**Copy.** German, informal *du*, sentence case, short. Terms of art stay German and exact: Felge,
Einpresstiefe (ET), Lochkreis (LK), Mittenlochbohrung, Gutachten, ABE, Teilegutachten, ECE,
Auflagen, Eintragung, Komplettrad, Zulassungsbescheinigung Teil I, HSN, TSN, Warenkorb. Buttons say
what happens (*147 passende Felgen anzeigen*, never *Mehr erfahren*). No exclamation marks, no
emoji, no slogans, no buzzwords, and no number, rating, guarantee or partner that is not backed by
real data. An Auflage is always a full German sentence, never a code.

## 8 · Page architecture

- One component per route, `Pages/<Page>/Index.vue`, responsive from 320 to 1920 px and beyond
  through media and container queries — never duplicated markup. The server-decided `isMobile` is
  used only where the choice must be identical in the SSR output and the client: a native
  `<select>` against a combobox, the bottom nav against the mega menu.
- The header never changes height and the primary navigation is never removed. The vehicle context
  is one slim bar under the header, in one place, on every route where the server says it shows.
- Overlays, menus, tabs, accordions, comboboxes and toasts are built on Reka UI primitives (focus
  management, scroll lock, keyboard) and styled by these tokens only.
- `scrollbar-gutter: stable` and `color-scheme: light` on the document; never `100vh`
  (`100dvh`/`100svh` plus safe-area insets); every input at least 16 px; every button has a `type`;
  every form validates on blur and explains, under the field, how to fix the error.
- SSR: no `window`, `document` or `localStorage` outside `onMounted`. Zero hydration warnings.

## 9 · Gates — measured, never judged

A page is finished when, on the production build with SSR on:

1. `scripts/qa/style-inventory.mjs` reports nothing: every computed radius, shadow, family, size
   and colour on the page resolves to a token; no gradient outside the two scrims; no
   `backdrop-filter`; no `background-clip: text`; no spaced-out capitals.
2. `scripts/qa/overflow.mjs`: no horizontal overflow at 320, 360, 375, 390, 414, 430, 768, 834,
   1024, 1280, 1440 and 1920; one `<h1>`; no tap target under 44 px on the phone document.
3. `scripts/qa/console.mjs`: no errors, warnings, hydration messages or failed requests in
   Chromium, WebKit and Firefox.
4. `scripts/qa/axe.mjs`: zero violations for WCAG 2.0 A/AA, 2.1 AA and 2.2 AA.
5. Lighthouse (mobile): Performance ≥ 90 (homepage ≥ 95), Accessibility, Best Practices and SEO
   100; LCP ≤ 2.0 s, CLS ≤ 0.02, TBT ≤ 150 ms; initial JS ≤ 120 KB gzip, CSS ≤ 40 KB gzip, hero
   image ≤ 160 KB.
6. Pest, Vitest and the Playwright journeys are green; coverage does not drop.
7. A design review and an interaction review have both approved the page in writing, and the
   German copy has been passed.
8. Visual baselines of the approved page exist in `tests/visual-v2/` at 390 and 1440.

`composer verify` runs all of it.
