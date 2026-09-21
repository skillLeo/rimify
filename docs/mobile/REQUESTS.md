# Mobile → main agent: requests for shared files

One bullet per request: the file, the change, and why. The mobile shell builds around each of
these until it lands.

## Answered (main agent, 2026-09-21) — adopted by the phone document

- `POST /api/v1/fitment/notify` `{ email, fahrzeug }` (Accept JSON, `X-Requested-With`,
  `X-XSRF-TOKEN` from the cookie): 202 done, 422 `errors.email[0]` / `errors.fahrzeug[0]`, else
  the phone line → `VehiclePanel.vue` `notify()`.
- `GET /ratgeber/{slug}` exists → the guides shelf links there (`#h10 a`).
- `Picture.vue` honours `image.fallback` → `HeroFrame.vue` uses the shared component.
- `SharedProps.garage`, `SharedProps.serviceStatus` (`{ open, label, until }`),
  `VehicleProp.typeDesignation` → the page reads them through `useShared()`; the local type is gone.
- `StartseiteProps.hero.sublineMobile`, `fitmentCount`, `sizes[].fitting`, `brands[].count` → the
  phone subline, the vehicle panel's count and button, struck size tiles, brand counts.
- The Blade head carries the manifest, the touch icon, the icon and the Apple metas.
- Still open, by the main agent's decision: Konto, `/komplettraeder`, the partners endpoint
  (fallbacks stay as built); DocumentScan's contract (the adapter stays).

## New

- `database/seeders/ContentSeeder.php` (the `startseite` page's `hero` block): seed `sub_mobile`
  with *Nur Felgen, deren Gutachten dein Fahrzeug nennt – mit Reifengrößen und Auflagen.*
  `StartseiteController` falls back to the desktop `sub` when the key is missing, and that
  sentence runs to five lines above the panel at 390 px (seen on the Pro Max shot with a
  vehicle). Until the block exists, `Startseite/Mobile.vue` uses the spec's phone sentence
  whenever `sublineMobile` merely echoes `subline`.

## Blade root — the PWA links (done)

- `resources/views/app.blade.php`, inside `<head>` after the `theme-color` meta. Add exactly:

  ```html
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="RIMIFY">
  ```

  Why: the manifest and the touch icon only work from the document head; `theme-color` is
  already `#0b0f14` and matches the manifest. `public/favicon.ico` is 0 bytes — the 192 px PNG
  serves as the icon until a real `.ico` exists. The service worker is registered by
  `MobileLayout.vue` on the phone document only (`/sw.js`; caches built assets, fonts, images,
  never HTML or Inertia JSON).

- `app/Http/Middleware/SecurityHeaders.php`: nothing to change — `default-src 'self'` already
  covers `manifest-src` and `worker-src`. Noted so nobody widens it.

## Routes and endpoints the phone pages need

- **Konto**: a `konto` route and a `Konto/Index` page (sign-in, orders, saved vehicles, the PWA
  install hint). The tab bar renders four tabs until it exists (`Components/Mobile/TabBar.vue`,
  `TABS`); adding `{ key: 'konto', label: 'Konto', href: '/konto', icon: 'user', routes: ['konto'] }`
  makes it five. The bar never links to a 404.
- **`POST /benachrichtigung`** `{ email, fahrzeug }` → 202, double opt-in mail (home.md H2, F2).
  `VehiclePanel.vue` posts there when a vehicle has zero wheels with a Gutachten and shows the
  spec's error line (with the phone number) on any non-2xx until it exists.
- **`GET /api/v1/partners?plz=`** → the three nearest partners (home.md H9). The phone renders
  the field and the "nicht erreichbar" notice on a non-2xx; the SVG map of Germany should be one
  shared component (`Components/Home/DeMap.vue`) so both documents draw the same border path.
- **Ratgeber**: `GET /ratgeber/{slug}` (home.md H10). The guides shelf renders the three pieces
  as static cards (title, teaser, reading time) until the route exists; then each becomes a link.
- **Kompletträder**: `GET /komplettraeder` and `felgen-suchen?ziel=komplettraeder` (home.md H7).
  The dark band's button leads to `/felgen` (with a vehicle) or `/felgen-suchen` (without) until then.
- **`popular` tab reload**: the controller reads `?beliebt=` — done; the phone reloads with
  `only: ['popular']` and `replace: true`, so the URL carries the tab. No change needed; noted.

## Props

- `resources/js/types/pages.ts` → `StartseiteProps.hero`: add `sublineMobile: string` fed from a
  `hero.sub_mobile` block, holding the short phone subline (*Nur Felgen, deren Gutachten dein
  Fahrzeug nennt – mit Reifengrößen und Auflagen.*). `Startseite/Mobile.vue` uses that sentence
  as a constant until the prop exists.
- `resources/js/types/rimify.ts` → `SharedProps`: `garage: { id, label, short }[]` and
  `serviceStatus: { open: boolean; label: string }` are shared by `Chrome::share()` but not yet
  typed; the mobile page reads them through a local type. Adding them to `SharedProps` lets
  `useShared()` carry them.
- `StartseiteProps.sizes[]`: add `fitting: number | null` (home.md H6) so a size with no
  permitted wheel for the vehicle can be shown struck rather than as a live link.

## Shared components

- `resources/js/icons/index.ts`: filled variants for the tab bar — `home-filled`, `wheel-filled`,
  `check-circle-filled`, `cart-filled`, `user-filled`. `Components/Mobile/TabIcon.vue` carries
  its own filled paths (same 24 grid) until the set has them; then it can import from the set.
- `resources/js/Components/Ui/Picture.vue`: the `<img src>` fallback is always `.jpg`;
  `images/hero-wheel.json` has `"fallback": "png"` and no JPEG. Honour the manifest's `fallback`
  extension. `Components/Mobile/Home/HeroFrame.vue` renders its own `<picture>` for the cut-out
  until then.
- `resources/js/Components/Home/DocumentScan.vue` (being built by another agent): the phone
  loads it lazily through `import.meta.glob` and assumes this contract — props `{ file: File }`,
  emits `result({ hsn, tsn })`, `failed`, `close`. If the real component differs, tell me the
  shape and I adapt `VehiclePanel.vue`.
- `resources/js/Components/Home/FitmentCalculator.vue`: on a phone the spec wants tabs
  *Aktuell · Neu* with the five fields stacked (home.md H8). The component's two fieldsets stack
  at 390 already, which is acceptable; if the tab treatment is wanted, a `layout="tabs"` prop on
  the shared component would keep one calculator for both documents.
- `resources/css/components.css`: `.sheet__grab` is 32 × 4; the phone spec asks 36 × 4. The
  mobile `BottomSheet` draws its own handle, so nothing breaks; aligning the shared value avoids
  two handle sizes on one site.

## QA tooling

- `scripts/qa/lib.mjs` `chooseVehicle()` fills `input[id^=hsn]` and clicks *Fahrzeug wählen*;
  on the phone document the HSN field sits behind the *HSN/TSN* tab and the button carries the
  count. A phone-aware branch: click `role=tab[name="HSN/TSN"]` first, then fill
  `getByLabel('HSN (Feld 2.1)')`, then click `[data-primary]`. The device-lab fixture
  (`tests/e2e/mobile/fixtures.ts`, `chooseVehicleFromHome`) does exactly that.
- `playwright.config.ts` (root): the device lab lives in its own config
  (`tests/e2e/mobile/playwright.config.ts`) so the root file stays untouched;
  `composer verify` should run both.
