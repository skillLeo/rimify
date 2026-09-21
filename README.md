<div align="center">

# RIMIFY

**Alloy wheels and tyres for German cars — shown only when a type-approval document says they fit.**

Laravel 13 · Inertia v3 · Vue 3.5 with SSR · MySQL 8.4 · Pest · Vitest · Playwright

[Live preview](https://rimify.skillleo.com) · [Engineering guide](CONTRIBUTING.md) · [Decisions log](docs/decisions.md)

</div>

---

## Overview

RIMIFY is an online shop for alloy wheels (*Felgen*), tyres and complete wheels (*Komplettrad*)
for the German market. The customer tells RIMIFY which car they drive, and the shop shows **only
the wheels that are legally approved for that exact vehicle** under a German type-approval
document — an ABE, a Teilegutachten or an ECE approval.

In Germany a wheel is not compatible because it physically bolts on. It is compatible because a
specific document says so: for one vehicle variant, in one rim width and offset, with one tyre
size, and sometimes only under stated conditions (*Auflagen*). Fitting the wrong wheel costs the
driver their *Hauptuntersuchung* and their insurance cover.

So RIMIFY does not store compatibility as a product attribute. **Compatibility is a relationship
between a vehicle, a wheel configuration and an approval document**, and that relationship is the
primary object in the database. Everything the customer sees is derived from it.

> RIMIFY may be silent. RIMIFY may be cautious. RIMIFY may say it does not know.
> **RIMIFY may never be confidently wrong.**

## The customer journey

| Step | Page | What happens |
|---|---|---|
| 1 | **Startseite** `/` | Choose a vehicle, or browse by brand and marque. |
| 2 | **Fahrzeug wählen** `/felgen-suchen` | Pick make, model and variant, or enter **HSN and TSN** from the *Zulassungsbescheinigung*. When one key-number pair matches several variants, the customer chooses — the shop never guesses. |
| 3 | **Felgen** `/felgen` | Only wheels with a valid approval document for that vehicle are listed, with filters for size, brand, finish and price. |
| 4 | **Produkt** `/felgen/{model}` | Every size carries its own verdict. *Auflagen* appear as full German sentences, the Gutachten can be downloaded, and matching tyres are offered with the load index and speed symbol the car requires. |
| 5 | **Warenkorb → Kasse** | Basket, checkout and order confirmation. The fitment verdict behind each order line is frozen into an immutable record at the moment of purchase. |
| 6 | **RIMIFY-Check** `/rimify-check` | Customers who already own wheels can check them against their car. |
| — | **Admin** `/admin` | Dashboard, approval documents (*Gutachten*) with their fitments and conditions, and role-based access. |

Supporting pages: **FAQ** `/faq`, **Kontakt** `/kontakt`, **Rechtliches** `/rechtliches`.

## The fitment engine

The compatibility core lives in [`app/Domain/Fitment`](app/Domain/Fitment) and has no dependency on
HTTP, Inertia or Vue. The storefront, the product page, the RIMIFY-Check and the admin panel all
call the same service, so there is exactly one answer to "does this fit?".

- **Four-state verdict.** `PERMITTED`, `CONDITIONAL`, `NOT_PERMITTED` or `UNKNOWN` — never a
  boolean. Not knowing is reported as not knowing, not as a refusal.
- **Fails closed.** Missing documents, expired approvals, unparseable axle loads or top speeds all
  lead to a cautious answer, never an optimistic one.
- **Load index and speed symbol derivation.** The minimum load index is derived from the heavier
  axle load and the minimum speed symbol from the top speed. When the Gutachten states its own
  minimum, the stricter of the two governs and the verdict records which source applied.
- **Build windows.** `build_to IS NULL` means the model is still in production, never "today". The
  overlap logic is written once, in `RangeSql`.
- **Disambiguation.** A key-number lookup returns a collection; more than one match always leads
  to a choice step.
- **Immutable order record.** `order_line_fitments` is insert-only, enforced by database triggers,
  so the reason a wheel was sold can never be rewritten.

## Architecture

```
app/
├── Domain/
│   ├── Fitment/        compatibility engine: resolver, verdicts, derivations, repositories
│   ├── Approval/       approval-document lifecycle and supersession
│   └── Storefront/     device detection, vehicle context, header state machine
├── Http/               controllers, middleware, form requests (storefront + admin)
├── Services/Storefront catalogue payload for the storefront pages
├── Models/ · Enums/ · Support/
database/
├── migrations/{fitment,commerce,vehicle_import,integration}   grouped by bounded context
└── seeders/            reference tables, vehicle tree, catalogue, approvals, content, access
resources/
├── js/Pages/           one Inertia page per screen, each with a Desktop and a Mobile variant
├── css/                design tokens and component stylesheet
└── views/app.blade.php the document shell
public/prototype/       the storefront's interactive layer and local imagery
tests/                  Pest unit + feature tests, Playwright end-to-end, visual fidelity suite
```

**Rendering.** Pages are server-side rendered through Inertia SSR. The device split (desktop or
mobile document) and the header state are decided on the server and shipped in the first
response, so nothing shifts after hydration.

**Design system.** No utility framework: a single token file (`tokens.css`) and a component
stylesheet (`components.css`) define the whole visual language. One blue accent; green, amber and
red are reserved for fitment status and stock.

**Language.** German throughout, informal *du*. Terms of art — *Einpresstiefe, Lochkreis,
Mittenlochbohrung, Gutachten, ABE, Auflagen, Eintragung* — are never translated. Prices, sizes and
measurements are formatted the German way: `1.425,00 €`, `8,5J`, `66,6 mm`, `245/45 R18 92Y`.

## Getting started

### Requirements

- PHP 8.3 or newer with `pdo_mysql`, `mbstring`, `intl`, `gd`
- Composer 2
- Node.js 20 or newer
- MySQL 8.4 with strict mode enabled

### Installation

```bash
git clone https://github.com/skillLeo/rimify.git
cd rimify

composer install
npm ci

cp .env.example .env
php artisan key:generate
```

Set the `DB_*` values in `.env`, then create the schema and load the reference and demo data:

```bash
php artisan migrate --seed
```

### Running locally

```bash
npm run build                  # client and SSR bundles
php artisan inertia:start-ssr  # SSR server, in its own terminal
php artisan serve              # http://localhost:8000
```

For front-end work, `npm run dev` starts Vite with hot reloading.

## Quality gates

```bash
composer verify
```

Runs Pint, Larastan (level 6), Pest with coverage, `vue-tsc`, Vitest, the production build and the
Playwright suite. A change is finished only when this passes.

| Command | Purpose |
|---|---|
| `composer test` | PHP test suite |
| `npm run test` | Component tests |
| `npm run e2e` | End-to-end tests |
| `npm run visual` | Visual fidelity suite — see [`tests/visual/README.md`](tests/visual/README.md) |

Feature tests run against a real MySQL database (`rimify_test`), never SQLite: the engine relies on
triggers, CHECK constraints and window functions that SQLite would silently accept.

## Project status

**Done**

- Fitment engine with the four-state verdict, load-index and speed-symbol derivation, and
  document-over-derivation precedence
- Full schema for vehicles, catalogue, approval documents, fitments, commerce and access control
- Storefront on the live catalogue: vehicle selection by make/model or HSN/TSN, listing, product
  pages with per-size verdicts, basket
- Every storefront and admin screen in desktop and mobile variants, server-side rendered

**In progress**

- Vehicle data import from the KBA vehicle list (automated script)
- Admin workflow for entering approval documents and their fitments
- Checkout with payment and the frozen order record
- RIMIFY-Check result sharing and PDF export
- Client photography for the hero and product images

## Licence

Proprietary. Developed by SkillLeo SMC (Pvt) Ltd for RIMIFY. All rights reserved.
