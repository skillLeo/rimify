# Mobile shell — what was built, how it was checked

Owner: mobile-app-designer. Files under `resources/js/Layouts/MobileLayout.vue`,
`resources/js/Components/Mobile/**`, `resources/js/composables/mobile/**`, `public/manifest.webmanifest`,
`public/sw.js`, `public/offline.html`, `public/icons/**`, `tests/e2e/mobile/**`. Everything shared
that the shell still needs is listed in `REQUESTS.md`.

## How a page uses it

```ts
// a top-level page (the bar shows the wordmark, search and the vehicle)
defineOptions({ layout: MobileLayout })

// an inner page: back arrow, a truncated title, up to two actions in the #bar-actions slot
defineOptions({ layout: (h, page) => h(MobileLayout, { title: 'Warenkorb', large: true, back: '/felgen' }, () => page) })

// a page with a sticky action bar: mount <StickyActionBar>; the tab bar steps aside by itself
```

Layout props: `title`, `large` (28 px title under the bar that collapses into it — it is the
page's `h1`), `back` (fallback href when the session has no history; `null` hides the arrow),
`tabBar` (default true), `footer` (default true). The layout decides "top-level" from the shared
`routeName` (`startseite`, `felgen.index`, `check.index`, `warenkorb.index`) and has a title for
every other route, so a page that passes nothing still gets a correct bar in the server's first
frame. The props travel through the layout function, so they are in the SSR output — nothing is
corrected after hydration.

## The parts

| Part | File | What it does |
|---|---|---|
| App bar | `Components/Mobile/AppBar.vue` | 56 px + `env(safe-area-inset-top)`, sticky, `--e-1` once scrolled (IntersectionObserver sentinel, as the desktop header). Top-level: wordmark · search · vehicle (blue dot when set, opens the vehicle sheet). Inner: back (44 px, `goBack()`), title (`text-overflow: ellipsis`), `#actions` slot capped at two by CSS. Large title: scroll-driven `animation-timeline: scroll(root)` behind `@supports` and `prefers-reduced-motion: no-preference`, IntersectionObserver otherwise. `view-transition-name: m-appbar` so page transitions never move it. |
| Tab bar | `Components/Mobile/TabBar.vue` + `TabIcon.vue` | Four tabs (Start · Felgen · Check · Warenkorb; Konto waits for its route), 56 px + safe area, 24 px icons with a filled state, 12 px/500 labels, `aria-current="page"`, count badge (`.badge--count`) on Warenkorb. Tapping the current tab scrolls to top (smooth unless reduced motion). Prefetch on `pointerdown` (Inertia's `click` mode prefetches on `mousedown`, which on touch fires with the tap). Hidden by transform + `visibility` while the keyboard is up or a sticky bar is mounted (`shell.tabBarVisible`). |
| Bottom sheet | `Components/Mobile/BottomSheet.vue` | Reka `Dialog` for focus trap, scroll lock, Esc, backdrop, focus return, announcement. On top: a 36 × 4 handle; touch drag with `preventDefault` on the first downward `touchmove` (so the browser never starts a scroll and never fires `pointercancel`), starting from the body only at `scrollTop === 0`; close on velocity > 0,6 px/ms or > 30 % of the height; `snap="half"` rests at 50 % and expands to 92 % as a **transform** (the sheet is always 92 dvh tall) — never a height animation; `overscroll-behavior: contain`; `msheet-in`/`msheet-out` over `--d-3`/`--d-2`. One history entry per open sheet (below). |
| Sticky action bar | `Components/Mobile/StickyActionBar.vue` | Fixed to `bottom: var(--kb-inset)`, so it rides above the keyboard; `--stickybar-h`; sets `shell.stickyBar` on mount, which hides the tab bar and switches the page's bottom padding. |
| Shelf | `Components/Mobile/Shelf.vue` | Scroll-snap row, 2.2 tiles by default (`--shelf-w`, overridable per use: `62vw`, `96px`, `78vw` on the homepage per home.md §0.5), gutter gaps, scroll padding = page margin, last child snaps `end`, no scrollbar, `aria-label` on the list, optional `tabindex="0"` for a shelf of static cards (axe `scrollable-region-focusable`). Header with "Alle ansehen" or `hide-head`. |
| Search sheet | `Components/Mobile/SearchSheet.vue` | Full-screen, `height: var(--vv-h)` (visual viewport, so results are never under the keyboard), field autofocused with `inputmode="search"`/`enterkeyhint="search"`, "Abbrechen", recent searches (`useSearch` storage), "Direkt zu" actions, grouped results as rows, skeleton rows while loading, empty state with the suggestion or the next step, failure sentence. A result closes the sheet (giving its history entry back) **before** `router.visit`, so the history has no dead entry. |
| List row | `Components/Mobile/ListRow.vue` | ≥ 56 px, page margin at the sides, inset divider that starts where the text starts, chevron when it navigates, leading icon slot, `meta` at the right edge, whole row tappable, `.m-press`. With `href` it is a real `<a>` that navigates through the router (prefetch on press); `external` for `tel:`/`mailto:`/`wa.me`; `static` for plain content. |
| Footer | `Components/Mobile/MobileFooter.vue` | Service and legal rows from `menus`, "Cookie-Einstellungen" (opens the shared consent settings), the price note, the copyright. On `--c-band`: the page's one dark band belongs to the content (DIRECTION §2). |
| Vehicle sheet | in `MobileLayout.vue` | Name, build window, key numbers, three rows: *Passende Felgen anzeigen · Fahrzeug ändern · Fahrzeug entfernen*. |

Global rules in the layout's unscoped style: `.m-press` (scale .98 over `--d-1`, `touch-action:
manipulation`, transparent tap highlight) and the view transitions.

## Navigation and transitions

`composables/mobile/useNavigationDirection.ts` hooks Inertia's `before` event, sets
`<html data-nav="forward|tab|back">` and turns `visit.viewTransition` on for every plain GET visit
(not partial reloads, not prefetches, not under reduced motion). The tab bar calls `markNext('tab')`
before its visit. CSS in `MobileLayout.vue`:

- forward: `::view-transition-new(root)` slides in from `translateX(100%)` over `--d-3`;
  `::view-transition-old(root)` moves to `translateX(-30%)` and dims to 0,7;
- tab: the default cross-fade at `--d-2`;
- back: `animation: none` — and Inertia restores popstate pages quietly anyway, without a transition;
- the app bar, tab bar and sticky bar are their own named groups with `animation: none` and the old
  snapshot hidden, so the chrome stands still while the page moves.

A session depth counter (sessionStorage) tells the back arrow whether `history.back()` has
anywhere to go; otherwise it visits the fallback route. `installNavigationDirection()` runs once
from the layout's `onMounted`.

## Sheets and the back button

`composables/mobile/useSheetHistory.ts`: opening a sheet pushes one entry — a copy of the current
Inertia state plus `rmfSheet: id`. A capture-phase `popstate` listener on `window` runs before
Inertia's bubble-phase handler and calls `stopImmediatePropagation()` while a sheet is open, so
Android back and browser back close the sheet and Inertia never re-renders the page. Closing by
handle, backdrop or button pops the entry (`history.back()`, resolved on the pop, with a 400 ms
fallback). Before any real navigation the layout calls `closeSheets()` + `stripSheetState()`, which
removes the marker in place. Inertia rewrites the current entry on scroll (to save the position),
so the marker is not relied on — the module's own stack is. Tested against Inertia 3.7's popstate
handling in `useSheetHistory.test.ts` and in the lab (search, help, vehicle sheets; a sheet link
navigating and coming back with no dead entry).

One rule found by the lab: Inertia fires the same `before` event for a prefetch, and a row
prefetches on `pointerdown`. A layout that closes sheets on every `before` closes the sheet on
the press, and the click that follows lands on a closing row — the visit is never issued (seen on
the Pro Max and in landscape under load). `isNavigationVisit()` (`useMobileShell.ts`, unit-tested)
lets prefetches and partial reloads through untouched.

## Keyboard

`composables/mobile/useVisualViewport.ts` writes `--vv-h`, `--kb-inset` and `html.is-keyboard`
from `window.visualViewport` (inset > 150 px = keyboard). The tab bar hides while the keyboard is
up; the sticky bar and the search sheet follow it. The page's bottom padding does **not** change
with the keyboard — a layout shift under the thumb is worse than padding behind the keyboard.

## PWA

- `public/manifest.webmanifest`: name RIMIFY, `start_url /?source=pwa`, standalone, portrait,
  `theme_color #0b0f14` (`--c-ink`), `background_color #ffffff` (`--c-surface`), icons 192/512 and a
  maskable 512, three shortcuts to existing routes.
- `public/icons/`: the wheel glyph of the product's own icon set, white on ink, drawn as
  `rimify-mark.svg`; PNGs rendered by `docs/mobile/tools/make-icons.mjs` (sharp). No third-party mark.
- `public/sw.js`: cache-first for `/build/assets/*`, `/fonts/*`, `/icons/*`; stale-while-revalidate
  (capped at 120 entries) for `/images/*`; navigations go to the network and fall back to
  `/offline.html` only when the fetch fails; requests with `X-Inertia` and `/api/*` are never
  touched; nothing HTML is ever cached. Registered by the mobile layout on https and localhost.
- `public/offline.html`: "Du bist offline." with the tokens inlined (it must not need the network).
- The `<link rel="manifest">`, the touch icon, the icon and the Apple metas are in
  `app.blade.php` (main agent, per `REQUESTS.md`); the lab checks the files are served.
- The install hint belongs in Konto, which does not exist yet.

## Checks

Production build with SSR on, `/` on the phone document:

| Gate | Result |
|---|---|
| `npm run lint:css` on every mobile `.vue` | clean |
| `vue-tsc --noEmit` | clean for all mobile files (one unrelated error in `e2e/support.ts`) |
| `npx vitest run` | 3 new files, 17 tests, green (`useVisualViewport`, `useSheetHistory`, `useNavigationDirection`) |
| `scripts/qa/overflow.mjs --routes /` | clean at 320 … 1920 |
| `scripts/qa/console.mjs --routes / --width 390` | clean in Chromium, WebKit, Firefox |
| `scripts/qa/axe.mjs --routes / --width 390` (with and without `--vehicle`) | zero violations |
| `scripts/qa/style-inventory.mjs --routes / --width 390` | clean (`docs/mobile/style-inventory-startseite.json`) |
| Device lab `tests/e2e/mobile/playwright.config.ts` | see `startseite.md` for the run summary |

Device lab projects: iPhone SE (3rd gen), iPhone 16, iPhone 16 Pro Max, iPhone 16 landscape (all
WebKit), Pixel 8, Galaxy A55 (Chromium). `shell.spec.ts` covers: bar height and stickiness, four
44 px tabs, 12 px labels, bar flush with the viewport bottom, scroll-to-top on the current tab, a
tab switch, no overflow / no small target / no tiny text / last control clear of the bar, the
search sheet (full screen, focus, results, back closes, Abbrechen closes, a result opens the
product), the vehicle sheet (opens, three actions, back closes, a sheet link leaves no dead entry),
the PWA files, and — on Chromium — that the service worker's caches hold only assets, fonts,
images, icons and the offline page.

Screenshots for the critic: `docs/mobile/shots/shell/<device>-sheet.png`,
`<device>-search.png`, `<device>-vehicle-sheet.png`.

## Deviations, on purpose

- Four tabs, not five: Konto has no route. Never a link to a 404.
- Press feedback runs over `--d-1` (120 ms), the tab cross-fade over `--d-2` (200 ms), the slide
  over `--d-3` (320 ms): the token scale has no 80/150/280 ms, and a component never writes a
  duration of its own.
- List rows use `--page-margin` (20 px) at the sides rather than a literal 16 px, so row text
  aligns with everything else on the page grid.
- The mobile footer is light. DIRECTION allows one dark band per page and the homepage spends it
  on Kompletträder.
- The service worker is registered from the mobile layout, not `app.ts` (shared).
