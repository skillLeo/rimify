# Visual fidelity suite

Measures every storefront and admin screen against the design prototype in `design-reference/`,
at both device widths, and fails when a screen drifts. The comments in this directory refer to the
numbered sections below.

## §1 Why screens drift

Two causes, and the suite is built against both:

1. **Guessing.** A screen rebuilt from a written description rather than from the design's own
   markup and runtime will be close, never identical.
2. **"The same" as an opinion.** Without a number, a reviewer and a developer can both be right
   and still disagree. Every gate here is a measurement.

## §2 The reference copy

`design-reference/` holds the prototype verbatim: 17 desktop and 17 mobile page shells plus the
shared runtime (`shared/*.js`, `tokens.css`, `components.css`). Both device directories must
contain the same screens. Nothing can be captured until this copy is complete.

## §3 Capturing the reference

```bash
npm run design:serve      # serves design-reference/ on :5500
npm run visual:capture    # writes baselines, DOM signatures, HARs and _rendered/ DOM
```

Baselines come **only** from the prototype, never from the Laravel page.

## §4 Fixtures

`/__fixture/{case}` puts a Laravel page into the exact state its prototype counterpart was captured
in (vehicle chosen or not, admin signed in or not). It is registered only when `APP_ENV` is `local`
or `testing`. `case-routes.json` maps each case to its route and state. `design-reference/_rendered/`
is the rendered DOM each screen is ported from.

## §5 Porting

Markup is ported element-for-element from the rendered DOM. The design's runtime ships unmodified
in `public/prototype/shared/`; any correction lives in a separate, reviewable file beside it.

## §6 The two gates

- **Gate A — pixels.** At most 0.5% of pixels may differ, and page height must match exactly.
- **Gate B — DOM signature.** Tag, classes, visible text and structural attributes must match
  element-for-element. `href` is exempt (static file names versus real routes) but link count and
  order are still compared; `src` is normalised to the photograph it shows.

## §7 Cases and order

One case per screen per viewport (desktop 1440 × 900, mobile 390 × 844), plus the Startseite with
a vehicle selected at both widths: 36 cases. Startseite first, then the storefront, then the admin
panel.

## §8 Standing rules

- When a case fails, fix the cause. Never raise the threshold.
- Never regenerate a baseline from the Laravel page.
- An allowlist entry is only for genuinely unreproducible content, with a written reason.

## §9 Acceptance

All 36 cases green, with at most five allowlist entries.

```bash
php artisan serve         # the application on :8000
npm run visual            # runs both gates
npm run visual:report     # writes tests/visual/report.html
```
