# Komplettrad, Wuchtgewichte und RDKS-Sensoren — build specification

Written 2026-09-22. Status: **design, not yet implemented.** It is binding for the builders of this
feature. Where it disagrees with `CLAUDE.md`, CLAUDE.md wins. Where it disagrees with
`docs/spec/pages.md` (the Figma-derived page spec) or `docs/phase0/ACCURACY.md`, the deviation is
named explicitly in §11 with its reason.

**Client input this is built from (verbatim facts, 2026-09-22):**

- RIMIFY sells wheels alone **or** as Kompletträder with tyres. Brands are not decided yet.
- A Komplettrad = **rim + tyre + Wuchtgewichte**, and **optionally an RDKS sensor** (tyre
  pressure sensor) for cars that display tyre pressure.
- RIMIFY will not have data on which cars have RDKS. **The checkout simply asks the customer.**
- Wuchtgewichte come in different colours; the colour options must be **configurable in the admin**.
- The RDKS sensor price differs **per car make** (Porsche ≫ Volkswagen). The admin must configure
  the price per car make; the shop displays it and bills it.
- Contact: `info@rimify.de`, Mo–Fr 9–17, no phone. (Already correct in `config/rimify.php:62-69`.)

Everything this specification decides **on the client's behalf** is listed in **§11**. Read that
section with the client before building. **§12** records the one design-review finding that was
deliberately not applied, and why, so it is not re-raised during the build.

---

## 1 · Vocabulary and the one rule that shapes every decision

| Term | Meaning here |
|---|---|
| **Felge** | A `wheel_configs` row: one rim in one size, finish, ET and bolt pattern. |
| **Komplettrad** | One Felge + one mounted, balanced tyre + Wuchtgewichte, optionally an RDKS sensor. One *wheel*, not a set of four. A customer normally buys four. |
| **Satz** | Four Kompletträder. Never a database object — it is a quantity. |
| **Wuchtgewicht** | Balance weight. Colour is a customer choice, configured by the admin. |
| **RDKS** | *Reifendruckkontrollsystem*. Sensor sits in the wheel. Priced per **car make**, per **sensor**. |

> **CLAUDE.md §2.** A Komplettrad is a compatibility claim about a *tyre* as well as a rim. Every
> place where a tyre could be offered, priced or sold without a document permitting it **fails
> closed**: no offer, a German sentence saying why, and a route forward. Missing configuration
> (no mounting price, no sensor price for a make, no weight colour) is missing data — it produces a
> refusal, **never** a guessed number and never a silent `0,00 €`.

---

## 2 · Data model

### 2.1 Migration A — `database/migrations/commerce/2026_09_25_000100_create_komplettrad_option_tables.php`

```php
<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The two things the client configures for a Komplettrad: the colours a Wuchtgewicht can have, and
 * what an RDKS sensor costs for a given CAR make.
 *
 * Both tables are deliberately empty after migration. An empty `tpms_sensor_prices` means "we have
 * not been told what a sensor costs", and the checkout says exactly that rather than charging a
 * number nobody confirmed (CLAUDE.md §2).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('balance_weight_colours', function (Blueprint $table): void {
            $table->id();
            $table->string('name_de', 64)->comment('Silber — as the customer reads it');
            $table->string('slug', 64)->comment('silber — stable identifier for seeders and tests');
            // The swatch on the option tile. NULL draws a neutral chip rather than a wrong colour.
            $table->char('swatch_hex', 7)->nullable()->comment('#C8CCD2');
            // Money is integer cents plus an explicit currency, everywhere. Per WHEEL, not per set.
            $table->unsignedInteger('surcharge_cents')->default(0);
            $table->char('currency', 3)->default('EUR');
            // Exactly one active row carries this; enforced in BalanceWeightColour::makeDefault()
            // inside a transaction, because MySQL cannot express "exactly one true" as a CHECK.
            $table->boolean('is_default')->default(false);
            $table->boolean('active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->unique('slug', 'uq_weight_colour_slug');
            $table->unique('name_de', 'uq_weight_colour_name');
            $table->index(['active', 'sort_order'], 'idx_weight_colour_order');
        });

        Schema::create('tpms_sensor_prices', function (Blueprint $table): void {
            $table->id();
            // The CAR make. `vehicles.make` is free text with no FK and no write-time
            // normalisation, so the join key is a normalised slug (MakeName::key()) and the label
            // is what a human reads. 'VW', 'vw' and 'Volkswagen' all key to `volkswagen`.
            $table->string('make_key', 64);
            $table->string('make_label_de', 64)->comment('Volkswagen');
            // Per SENSOR, not per set: a customer may order one replacement wheel or four.
            $table->unsignedInteger('price_cents');
            $table->char('currency', 3)->default('EUR');
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique('make_key', 'uq_tpms_make');
            $table->index(['active', 'make_key'], 'idx_tpms_active');
        });

        // A price of zero would be a claim that sensors are free. Absence is how "unknown" is
        // stored, and absence is what fails closed.
        Constraints::add('tpms_sensor_prices', 'chk_tpms_price', '`price_cents` > 0');
        Constraints::add('tpms_sensor_prices', 'chk_tpms_currency', '`currency` = UPPER(`currency`)');
        Constraints::add(
            'tpms_sensor_prices',
            'chk_tpms_make_key',
            "REGEXP_LIKE(`make_key`, '^[a-z0-9][a-z0-9-]{0,63}$', 'c')",
        );
        Constraints::add('balance_weight_colours', 'chk_weight_colour_currency', '`currency` = UPPER(`currency`)');
        Constraints::add(
            'balance_weight_colours',
            'chk_weight_colour_hex',
            "`swatch_hex` IS NULL OR REGEXP_LIKE(`swatch_hex`, '^#[0-9A-F]{6}$', 'c')",
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('tpms_sensor_prices');
        Schema::dropIfExists('balance_weight_colours');
    }
};
```

Notes the implementer must honour:

- `Constraints::add` is the only way CHECKs are written in this codebase (`app/Support/Schema/Constraints.php`); it rewrites `REGEXP_LIKE(...,'c')` for MariaDB, which the live host runs.
- The hex CHECK is **case-sensitive** — the Form Request uppercases the value in `prepareForValidation()`.
- Soft deletes + a unique key means a deleted colour blocks re-creating the same slug. The admin
  store action therefore looks the row up `withTrashed()` and restores it instead of failing. This
  mirrors `wheel_configs.sku` and `vehicles.source_vehicle_id`, which have the same shape.
  **The slug is derived, never posted** — `Str::slug($nameDe)` in `prepareForValidation()` (§6.4).
  The column is `NOT NULL` with no default and MySQL runs in strict mode, so a `create()` that does
  not carry a slug is a 500, not a validation error. The `withTrashed()` lookup in §6.3 keys on
  that derived slug, which is what makes the restore path reachable at all.
- **Uniqueness must exclude trashed rows.** `Rule::unique` queries the table directly and does not
  apply the model's soft-delete scope, so without `->whereNull('deleted_at')` a trashed row fails
  validation before the controller can restore it, and the admin reads a message written for a
  live collision. §6.4 spells both rules out.
- **No surcharge is invented.** `surcharge_cents` defaults to `0`; the client may later charge for a
  colour without a migration (§11 D-031).

### 2.2 Migration B — `2026_09_25_000200_add_komplettrad_columns_to_commerce.php`

```php
Schema::table('orders', function (Blueprint $table): void {
    // The RDKS price is keyed on the car make, and FitmentVerdict::fromArray() rebuilds a frozen
    // verdict with make '' (FitmentVerdict.php:144). The make therefore has to be denormalised
    // onto the order like vehicle_label/hsn/tsn already are, or an order can never be explained.
    $table->string('vehicle_make')->nullable()->after('vehicle_label');
});

Schema::table('order_lines', function (Blueprint $table): void {
    // Plain ids, no FKs — exactly as wheel_config_id and tyre_variant_id are in this slice
    // (create_commerce_tables.php:20-22). The price and the description are FROZEN on the line;
    // these ids exist for reporting, not for re-reading a price.
    $table->unsignedBigInteger('balance_weight_colour_id')->nullable()->after('tyre_variant_id');
    $table->unsignedBigInteger('tpms_sensor_price_id')->nullable()->after('balance_weight_colour_id');

    $table->index('balance_weight_colour_id', 'idx_order_line_weight_colour');
    $table->index('tpms_sensor_price_id', 'idx_order_line_tpms');
});

Schema::table('tyre_variants', function (Blueprint $table): void {
    // The demo gate today only inspects wheel_models.is_demo (Basket.php:349). A Komplettrad built
    // from a demonstration tyre must be caught by the same gate (ACCURACY.md D4).
    $table->boolean('is_demo')->default(false)->after('stock_qty')->comment('seeded demo row, never real stock');
});

// Every tyre_variants row in every existing database was written by CatalogueSeeder::seedTyres()
// as demonstration data. A default of `false` would therefore silently declare the whole seeded
// tyre catalogue real the moment the column exists. Marking a genuine row demo costs a missed
// sale; the reverse sells a fabricated tyre at a fabricated price (CLAUDE.md §2).
DB::table('tyre_variants')->update(['is_demo' => true]);
```

`down()` drops the three columns in reverse order.

**The backfill is only half of it.** `CatalogueSeeder::seedTyres()` writes its six demonstration
tyres through `TyreVariant::updateOrCreate` and must carry `'is_demo' => true` in its update
attributes, or the next seeder run clears what the migration just set. Without both halves the
column defeats its own purpose: today the demo gate fires through the wheel half only, because
`CatalogueSeeder` also marks every seeded `wheel_models` row demo — so the gap is invisible until
the client's first real wheel model is published while the demonstration tyre catalogue is still
in the database, which is exactly the launch state. At that moment a Komplettrad built from a
fabricated tyre with a fabricated price and a fabricated EPREL label becomes orderable, and
`Chrome::demo()` (which reads `wheel_models` only, Chrome.php:100-106) shows no badge.

**The demo gate has two readers, not one.** `Basket::render()` (§4.5 step 9) is the basket half.
The order half is `BestellungController::isDemo()` (BestellungController.php:89-93), which
INNER-joins `order_lines.wheel_config_id → wheel_configs → wheel_models.is_demo`. A Komplettrad's
tyre sits on a separate `TYRE` line whose `wheel_config_id` is `NULL`, so that join can never see
it. It gains a second check — an `exists()` over `order_lines` joined to `tyre_variants` on
`tyre_variant_id` where `tyre_variants.is_demo` — in commit 15.

### 2.3 Models

| File | Contents |
|---|---|
| `app/Models/BalanceWeightColour.php` | `SoftDeletes`; `$fillable = ['name_de','slug','swatch_hex','surcharge_cents','currency','is_default','active','sort_order']`; casts `surcharge_cents`→`integer`, `is_default`/`active`→`boolean`, `sort_order`→`integer`. `scopeActive()`. `static function default(): ?self` — the active row with `is_default`, else the first active row by `sort_order`, else `null`. `makeDefault(): void` — inside `DB::transaction`, clears `is_default` on every other row then sets its own. |
| `app/Models/TpmsSensorPrice.php` | `SoftDeletes`; `$fillable = ['make_key','make_label_de','price_cents','currency','active']`; casts `price_cents`→`integer`, `active`→`boolean`. `static function forMake(?string $make): ?self` — `null` for a null/empty make, else `where('make_key', MakeName::key($make))->where('active', true)->first()`. |
| `app/Models/TyreVariant.php` | **Fix the existing `$fillable`**: it omits `eu_noise_class` and `eprel_id` (added by `2026_09_23_000100`), so any admin `create()`/`fill()` would silently drop them. Add both, plus the new `is_demo`, and cast `is_demo`→`boolean`. |
| `app/Models/OrderLine.php` | Add `balance_weight_colour_id`, `tpms_sensor_price_id` to `$fillable`. |
| `app/Models/Order.php` | Add `vehicle_make` to `$fillable`. |

Factories: `database/factories/BalanceWeightColourFactory.php`, `database/factories/TpmsSensorPriceFactory.php`.
`TpmsSensorPriceFactory` **must not** carry a plausible real price as its default — use
`price_cents => 1` and let every test state the figure it asserts on.

### 2.4 `App\Enums\TyreSeason`

```php
enum TyreSeason: string
{
    case Sommer = 'sommer';
    case Winter = 'winter';
    case Ganzjahres = 'ganzjahres';

    /** 'Sommer' — the qualifier used inside a frozen order-line label. */
    public function labelDe(): string;

    /** 'Sommerreifen' — the word a customer reads on a card. */
    public function longLabelDe(): string;

    /** @return list<string> */
    public static function values(): array;
}
```

The `chk_tyre_variants_season` CHECK already holds exactly these three values
(`create_catalogue_tables.php:144`). A unit test asserts `TyreSeason::values()` equals the seeded
CHECK values, following the precedent that keeps `Severity` and the engine's enum identical.

### 2.5 `App\Support\MakeName::key()` — the make join key

`MakeName::normalise()` maps `'vw' => 'VW'` but `'volkswagen' => 'Volkswagen'` (MakeName.php:21-22):
two different outputs for one manufacturer. A price keyed on the normalised label would therefore
miss half the VW fleet. Add a **second, additive** method — `normalise()` and `same()` keep their
current behaviour and their existing test.

```php
/**
 * The join key for a car make: lower case, ASCII-folded, hyphenated, with synonyms unified.
 *
 * `VW`, `vw` and `Volkswagen` all key to `volkswagen`; `Mercedes` and `Mercedes-Benz` to
 * `mercedes-benz`; `Skoda` and `Škoda` to `skoda`. It is the only key a per-make price may use.
 * `''` for an empty or unusable name, and the caller must treat `''` as "no make" (fail closed).
 */
public static function key(string $name): string;
```

Rules: trim → collapse whitespace → lower-case (mb) → apply `KEY_ALIASES` (at minimum
`vw|volkswagen → volkswagen`, `mercedes|mercedes-benz|mb → mercedes-benz`, `skoda|škoda → skoda`,
`citroen|citroën → citroen`, `vauxhall|opel → opel`) → transliterate `ä ö ü ß é ë → ae oe ue ss e e`
→ replace every remaining non `[a-z0-9]` run with `-` → trim `-` → truncate to 64.
`MakeName::key('')` and `MakeName::key('   ')` return `''`.

The admin form stores both: `make_key = MakeName::key($input)` and
`make_label_de = MakeName::normalise($input)`.

### 2.6 `App\Support\Money` — German money **input**

`docs/architecture-contract.md:211` names this file; it has never existed. It is an **input parser
only** — all output stays in `GermanFormat::money()` (R-10).

```php
final class Money
{
    /**
     * `1.425,00 €`, `1.425,00`, `1425,5`, `1425` → integer cents. NULL when the input is empty,
     * ambiguous, negative or malformed: a price nobody can read unambiguously is refused, not
     * guessed (CLAUDE.md §2).
     */
    public static function fromGerman(string $input): ?int;
}
```

Algorithm, in order:

1. Strip `€`, `EUR`, U+00A0, U+202F and ordinary spaces; trim.
2. Reject `''`, and anything containing `-` or U+2212 (no negative price on these screens).
3. Reject anything outside `[0-9.,]`.
4. Both `.` and `,` present → `.` is the thousands separator, and the **grouping is validated
   before it is stripped**: the part before the `,` must match `^\d{1,3}(\.\d{3})+$` and the part
   after must be 1 or 2 digits, else reject as ambiguous. Only then remove every `.`. Stripping
   first and checking only the decimal part would turn `1.42,00` — an admin who meant `1.425,00`
   — into a silently accepted `142,00 €`, which then goes onto a real bill through the frozen
   `order_lines.unit_price_cents`. This is the same grouping discipline step 6 applies; step 4
   simply must not forget it.
5. Only `,` present → decimal comma; 1 or 2 digits after it, else reject.
6. Only `.` present → **German writes a thousands point.** Accept only when every group after the
   first `.` is exactly 3 digits (`1.425`, `12.500`); otherwise reject as ambiguous (`49.00` could
   be 49 € or 49 cents, and we do not guess).
7. Digits only → whole euros.
8. Multiply out to integer cents with `intdiv`/string maths, never a float round-trip.

**The vector list below is the authority.** Where the prose above and a vector disagree, the vector
wins and the prose is wrong.

Unit-tested with: `'1.425,00 €'`→142500, `'1.425,00'`→142500, `'12.500,50'`→1250050,
`'1425,5'`→142550, `'1425'`→142500, `'0,99'`→99, `"49,00\u{00A0}€"`→4900,
`"49,00\u{202F}€"`→4900, `'49.00'`→null, `'1,234'`→null, `'−5,00'`→null, `'abc'`→null, `''`→null,
`'1.42,00'`→null, `'1.2345,00'`→null, `'1.4.25,00'`→null.

### 2.7 Configuration — `config/rimify.php`

```php
/*
|--------------------------------------------------------------------------
| Komplettrad
|--------------------------------------------------------------------------
|
| What mounting and balancing one wheel costs, in integer cents. The client has not given a
| figure, so it is null until an environment variable names a real one — exactly as `shipping`
| is handled. While it is null the basket shows "wird noch festgelegt" for that component,
| leaves it out of the total, and the server refuses an order containing a Komplettrad.
| The Felgen-only purchase is unaffected.
*/
'komplettrad' => [
    'mounting_per_wheel_cents' => is_numeric(env('RIMIFY_MOUNTING_PER_WHEEL_CENTS'))
        ? (int) env('RIMIFY_MOUNTING_PER_WHEEL_CENTS')
        : null,
],
```

---

## 3 · The fitment side — which tyres a verdict permits

R-13: this lives in `app/Domain/Fitment` and touches no HTTP, Inertia or Vue code. It is the only
place the question "may this tyre go on this wheel on this car" is answered, for every surface.

### 3.1 `App\Domain\Fitment\Infrastructure\EloquentTyreCatalogue`

Implements the existing, never-implemented `App\Domain\Fitment\Contracts\TyreCatalogue`.

```php
public function inSizes(array $sizes, bool $inStockOnly = true): array
```

- Empty `$sizes` → `[]`.
- One query over `tyre_variants`, `whereNull('deleted_at')`, and a bound `whereIn` over the size
  tuples: `whereIn(DB::raw('(width_mm, aspect, diameter_in)'), $tuples)` is **not** used — build
  `->where(function ($q) { foreach ($sizes as $s) { $q->orWhere(fn ($w) => $w->where('width_mm', $s->widthMm)->where('aspect', $s->aspect)->where('diameter_in', $s->diameterIn)); } })`. Every value is bound (R-14). The `idx_tyre_lookup` index covers it.
- `$inStockOnly` adds `where('stock_qty','>',0)`.
- Orders by `price_cents`, then `id`, so the offer is stable and cheapest-first.
- Maps to `TyreRecord` including `brandName`, `name`, `season`.
- Bound in `FitmentServiceProvider::register()` as a singleton and added to `provides()`.

### 3.2 `App\Domain\Fitment\Tyres\KomplettradRefusal`

A backed enum; every case carries a **full German sentence** (R-15) and none of them names a
contact detail (those are rendered from `config('rimify.contact')`; `ContactDetailsTest` fails the
build on a hard-coded address).

**Thirteen cases, and `UNKNOWN` has its own.** R-07: `UNKNOWN` is not `NOT_PERMITTED`. A single case
covering both would have to carry one sentence, and any sentence that is true of one is a false
statement about a legal fact when shown for the other. The codebase already keeps the two apart —
`VerdictStatus::labelDe()` says `Nicht freigegeben` against `Keine Angabe` (VerdictStatus.php:42-50)
and `FelgenController` logs a `CatalogueGapEvent` for `UNKNOWN` alone — and this enum keeps them
apart too.

| Case | `sentenceDe()` |
|---|---|
| `NoVehicle` | `Für ein Komplettrad brauchen wir zuerst dein Fahrzeug – erst dann wissen wir, welche Reifengrößen für dich freigegeben sind.` |
| `VerdictNotPermitted` | `Diese Felge ist für dein Fahrzeug nicht freigegeben. Ein Komplettrad können wir dir dazu deshalb nicht anbieten.` |
| `VerdictUnknown` | `Zu dieser Felge liegt uns für dein Fahrzeug kein Gutachten vor. Ein Komplettrad können wir dir deshalb nicht anbieten – schreib uns, dann prüfen wir das für dich.` |
| `VerdictRestored` | `Diese Zusammenstellung können wir dir gerade nicht neu prüfen. Bitte wähl dein Fahrzeug noch einmal aus.` |
| `NoPermittedSizes` | `Für diese Kombination nennt das Gutachten keine Reifengröße. Ein Komplettrad können wir dir deshalb nicht anbieten – die Felge allein kannst du bestellen.` |
| `NoUsableMinimum` | `Für dein Fahrzeug fehlen uns Achslast oder Höchstgeschwindigkeit. Ohne diese Werte sagen wir dir nicht, welcher Reifen passt – die Felge allein kannst du bestellen.` |
| `StaggeredLayout` | `Vorne und hinten sind für dein Fahrzeug unterschiedliche Reifengrößen freigegeben. Solche Kombinationen stellen wir dir persönlich zusammen.` |
| `TyreChoiceRestricted` | `Das Gutachten schreibt für diese Kombination bestimmte Reifen vor. Welche das sind, klären wir persönlich mit dir – die Felge allein kannst du sofort bestellen.` |
| `DiameterMismatch` | `Dieser Reifen hat nicht den Durchmesser dieser Felge.` |
| `SizeNotPermitted` | `Diese Reifengröße ist für dein Fahrzeug mit dieser Felge nicht freigegeben.` |
| `BelowMinimum` | `Dieser Reifen erfüllt die Mindestwerte für dein Fahrzeug nicht.` |
| `OutOfStock` | `Diesen Reifen haben wir gerade nicht in der benötigten Menge auf Lager.` |
| `NoTyreAvailable` | `Passende Reifen für diese Größe haben wir gerade nicht vorrätig. Die Felge allein kannst du bestellen.` |

### 3.3 `App\Domain\Fitment\Tyres\TyreEligibility`

```php
final readonly class TyreEligibility
{
    public function __construct(
        private TyreCatalogue $catalogue,
        private SpeedSymbolDeriver $speedSymbol,
    ) {}

    /** Every tyre this verdict permits on this wheel, cheapest first. */
    public function offerFor(FitmentVerdict $verdict, bool $inStockOnly = true): KomplettradOffer;

    /** Null when the tyre may be sold on this verdict; otherwise why not. */
    public function permits(FitmentVerdict $verdict, TyreRecord $tyre, int $quantity = 1): ?KomplettradRefusal;

    /** `Mindestens Tragfähigkeitsindex 95 und Geschwindigkeitsindex Y.` — never a bare number pair. */
    public function minimumSentenceDe(FitmentVerdict $verdict): ?string;
}
```

`KomplettradOffer` is `final readonly class { /** @var list<TyreRecord> */ public array $tyres; public ?KomplettradRefusal $refusal; public ?string $minimumSentenceDe; public MinSource $minSource; }`.

**Only a live verdict may be answered.** `permits()` and `offerFor()` decide on fields that do not
survive the `FitmentVerdict::toArray()`/`fromArray()` round trip that `order_line_fitments.verdict`
relies on — `Condition::fromArray()` rebuilds every condition with `affectsTyreChoice: false`
(Condition.php:68-77) and `TyreSize::fromArray()` rebuilds both document minima as `null`
(TyreSize.php:53-57). A restored verdict would therefore answer **more permissively** than the live
one: no document restricts the tyre choice, no document states its own minimum. That is the exact
failure R-06 and CLAUDE.md §2 exist to prevent, so it is closed twice over:

- `FitmentVerdict` gains `public bool $restored = false` as its **last constructor parameter**
  (the class is readonly, so this is a promoted property with a default, not an assignment).
  `fromArray()` is the only caller that passes `true`; every other construction site is unchanged.
  It is **not** emitted by `toArray()` — it describes how this object was built, not what the
  document said, and writing it into a compliance record would be noise.
- `permits()` and `offerFor()` refuse outright on `$verdict->restored` with
  `KomplettradRefusal::VerdictRestored` — before rule 1, before anything else.
- §3.4 additionally makes the snapshot **able** to carry the decision, so the frozen record can
  reproduce it eleven months later. The guard stands even once it can: a snapshot is evidence of
  what was decided, never the input to a fresh decision.

No path in this specification feeds a restored verdict to `permits()` today. The guard exists
because nothing in the type signature stops one, and §4.11 already pre-specifies the admin order
screen that would be the obvious next reader of that snapshot.

**The rules, in this order.** Each one fails closed; none of them may be re-implemented in a
controller, a service or a component (R-13).

1. `$verdict->wheel === null` or the verdict is not sellable (`PERMITTED`/`CONDITIONAL` only, R-07).
   **Select on `$verdict->status`, never on a single "not sellable" branch:**
   `VerdictStatus::NotPermitted` → `VerdictNotPermitted`; `VerdictStatus::Unknown` →
   `VerdictUnknown`; a null wheel → `VerdictUnknown` (we hold nothing, we do not claim a refusal).
   `UNKNOWN` is **not** `NOT_PERMITTED` and must never be told it is — neither sells, but only one
   of them means "we checked and your car may not have this".
2. Any condition on the verdict with `affectsTyreChoice === true` → `TyreChoiceRestricted`. The
   document restricts which tyres may be fitted and we hold no structured data about which; offering
   any tyre would be a confident wrong answer. (`ReferenceDataSeeder:128-131` seeds exactly such a
   code, `TYRE_BRAND_LIMIT`.)
3. **Two independent staggered guards, both → `StaggeredLayout`** (§11 D-035):
   - **3a.** `$verdict->tyreLayout() === 'MIXED'` — the two axles permit different size sets.
   - **3b.** Any `TyreSize` in `$verdict->front->sizes` or `$verdict->rear->sizes` whose own
     `axle` is not `'ALL'` — the document scoped that size to one axle, whatever the sets look like.

   **3a alone does not hold, and 3b is not redundant.** `tyreLayout()` compares the two axles' size
   *sets*. The normal shape of a staggered Teilegutachten line is **one** `fitments` row with
   `axle = ALL` carrying two `fitment_tyre_sizes` rows — 245/40 R19 `FRONT` and 275/35 R19 `REAR`.
   Before §3.3a, both sizes land on both axles, `tyreLayout()` returns `SAME`, 3a never fires,
   rule 7 passes for both sizes on both axles, and RIMIFY offers a 275/35 as a legal four-wheel set
   on a car whose Gutachten permits it on the rear only. §3.3a is what makes 3a truthful on that
   shape; 3b is what holds when the sets happen to be *equal* and the document is still axle-scoped
   — a document listing the same size explicitly as a `FRONT` row and a `REAR` row says something
   about axles that a set comparison cannot see. The client's real Gutachten are not loaded yet, so
   both of these land the first time real staggered approval data is imported.
4. Either axle `! hasPermittedSizes()` → `NoPermittedSizes`.
5. Either axle `! hasUsableMinimum()` → `NoUsableMinimum`. **A null minimum is not "no minimum"** —
   it is the engine saying it could not derive one (R-03, `TyreRecord::satisfies()` already refuses
   on null).
6. Per tyre: `abs($tyre->diameterIn - $verdict->wheel->diameterIn) > 0.01` → `DiameterMismatch`.
7. Per tyre, **per axle** (front and rear, both): the tyre's size must appear in
   `$axle->sizes`, matched by `TyreSize::matches()` → else `SizeNotPermitted`.
8. Per tyre, per axle, **R-06 — the stricter governs**:
   ```php
   $listed        = the matching TyreSize on this axle;
   $minLoadIndex  = max($axle->minLoadIndex, $listed->documentMinLoadIndex ?? 0);
   $axleRank      = $this->speedSymbol->rankOf($axle->minSpeedSymbol);      // null → refuse
   $documentRank  = $listed->documentMinSpeedSymbol === null
                        ? null
                        : $this->speedSymbol->rankOf($listed->documentMinSpeedSymbol); // null → IGNORED (D-027)
   $minRank       = max($axleRank, $documentRank ?? 0);
   $tyreRank      = $this->speedSymbol->rankOf($tyre->speedSymbol);          // null → refuse
   ```
   `$tyre->loadIndex < $minLoadIndex || $tyreRank < $minRank` → `BelowMinimum`.
   Symbols are **never** compared as letters (H sits between U and V).
   The governing source is recorded per half from the axle (§3.4 `minLoadSource` /
   `minSpeedSource`), raised to `Document` where the listed size's own minimum won here.

   **This is a refinement of `$axle->min*`, not a second implementation of R-06.** Every
   expression above is a `max()` against the axle's already-governed value, so rule 8 can only ever
   *raise* the minimum and never relax it — which is what makes a disagreement with
   `FitmentResolver::axleRequirement()` safe in the one direction that matters. The refinement
   earns its place because the axle's merge is lossy for speed: `axleRequirement()` accumulates the
   document speed symbol with a plain assignment across the row's sizes
   (`$documentSpeedSymbol = $size->documentMinSpeedSymbol;`, FitmentResolver.php:308-310), so the
   *last* size's symbol wins rather than the strictest. Comparing the listed size's own symbol here
   closes that hole from the safe side. A builder who finds this asymmetry is right to dislike it;
   the fix is to make `axleRequirement()` take the stricter across sizes, at which point rule 8
   becomes a no-op and may be simplified. That is a separate change to the engine and is **not** in
   this feature's scope.
9. `$tyre->stockQty < $quantity` → `OutOfStock`.
10. `offerFor()` returning an empty list after the per-tyre filter → `NoTyreAvailable`.

### 3.3a The per-size axle has to reach the domain first

Rules 3b, 7 and 8 all read a tyre size's own axle, and today that value is discarded before the
resolver ever sees it. Three places drop it, and all three are fixed in commit 6:

| Where | Today | Required |
|---|---|---|
| `EloquentFitmentRepository::toRow()` (:153-162) | builds `TyreSize` from width/aspect/diameter/min_load_index/min_speed_symbol only | also pass `axle: $size->axle->value` |
| `FitmentRow::tyreSizesForAxle()` (:75-81) | `fn (TyreSize $size): bool => $this->coversAxle($axle)` — the closure ignores `$size` entirely | `$size->axle === 'ALL' \|\| $size->axle === $axle`, **and** the row still has to cover the axle |
| `FitmentResolver::axleRequirement()` (:295-298) | `static fn (TyreSize $size): bool => true` — a literal no-op filter | the same size-level predicate |

`App\Domain\Fitment\Data\TyreSize` therefore gains `public readonly string $axle = 'ALL'` as its
last constructor parameter (additive; every existing call site keeps working). The database has
carried this all along and the code says so — `fitment_tyre_sizes.axle` exists with a CHECK over
`Axle::values()` and sits inside `uq_fitment_tyre_size`
(`database/migrations/fitment/2026_09_20_100500_create_fitments_table.php:81-101`),
`App\Models\FitmentTyreSize` casts it and its docblock reads *"A tyre size a document permits on a
fitment, per axle — front and rear can differ"*, and `App\Enums\Axle` says *"Mixed fitment is
modelled now and exposed later"*. "Later" is the moment the first real Gutachten is imported, and
the guard must be in place before then, not after.

Commit 6 also ships a schema test asserting that **no `fitment_tyre_sizes` row carries a non-`ALL`
axle while the resolver does not consume it** — so if the axle filter is ever reverted, the
staggered data that arrives afterwards fails the build instead of the customer.

**`CommerceSeeder::komplettradTyre()` (CommerceSeeder.php:299-350) is deleted** and its callers
switched to `TyreEligibility`. It is the current implementation of the same rule in the wrong
place; `tests/Feature/Storefront/BestellungDemoTest.php:90-140`, which covers it, is rewritten
against the new class in the same commit.

Registered in `FitmentServiceProvider` as a singleton; added to `provides()`.
`composer verify:fitment` enforces **100 % coverage of `app/Domain/Fitment`** — every branch above
needs a unit test (§9.1).

### 3.4 The verdict payload grows

`FelgenController::verdictFor()` ships `tyreSizes` = front sizes only, no minima. It gains, without
removing anything:

```php
'tyreSizesFront' => list<string>,    // '245/45 R18'
'tyreSizesRear'  => list<string>,
'tyreLayout'     => 'SAME'|'MIXED',
'minLoadIndex'   => int|null,
'minSpeedSymbol' => string|null,
'minSource'      => 'DOCUMENT'|'DERIVED',
'minLoadSource'  => 'DOCUMENT'|'DERIVED',
'minSpeedSource' => 'DOCUMENT'|'DERIVED',
'minSentence'    => string|null,     // TyreEligibility::minimumSentenceDe()
```

`resources/js/types/pages.ts` → `ConfigVerdict` gains the same fields as optional properties.

#### The snapshot shape grows, additively

**No key of `FitmentVerdict::toArray()` is removed or renamed.** That is the compliance guarantee
R-12 needs, and it is narrower than "`FitmentVerdict` is not changed", which this feature cannot
honour: three fields the verdict already carries are silently lost on the round trip, and losing
them fails **open**.

| Class | Lost today | Added |
|---|---|---|
| `Condition` (:57-77) | `affectsTyreChoice`, `affectsPurchase`, `requiresAcknowledgement` — `toArray()` emits four keys, `fromArray()` rebuilds all three flags as the constructor default `false` | all three keys in `toArray()`, read in `fromArray()` with `?? false` |
| `TyreSize` (:43-57) | `documentMinLoadIndex`, `documentMinSpeedSymbol` — `toArray()` emits width/aspect/diameter only | both keys, read with `?? null`; plus `axle` with `?? 'ALL'` (§3.3a) |
| `AxleRequirement` (:47-74) | — | `minLoadSource`, `minSpeedSource`, read with `?? minSource` |

Every addition is additive and defaulted, so **old rows keep deserialising, no existing row is
rewritten, and R-12 is untouched** — nothing updates `order_line_fitments`, the trigger still
raises `SQLSTATE 45000` on any attempt, and `VerdictSnapshot.engineVersion` already records which
writer produced a row.

The gain is that the frozen record can reproduce the decision it evidences. Today a snapshot
restored eleven months on cannot show that the Gutachten did *not* restrict which tyre brands were
allowed — it shows `affectsTyreChoice: false` for every condition, including the
`TYRE_BRAND_LIMIT` row `ReferenceDataSeeder:128-131` seeds with `affects_tyre_choice = true` and
`tests/Feature/Schema/Fitment/ReferenceDataTest.php:109` asserts.

A Pest case asserts `FitmentVerdict::fromArray($v->toArray())` preserves
`conditions[0]->affectsTyreChoice`, `front->sizes[0]->documentMinSpeedSymbol` and
`front->sizes[0]->axle`, **and** that the restored verdict reports `restored === true`.

#### Why `minSource` alone is not enough

`FitmentResolver::axleRequirement()` sets one combined flag — `Document` when **either** half came
from the document (FitmentResolver.php:332-335) — while `stricterLoadIndex()` and
`stricterSpeedSymbol()` (:339-376) each decide separately. A Gutachten that states only a minimum
speed symbol and is silent on load index therefore produces `minSource = DOCUMENT` for an axle
whose load index was derived from `axle_load_front_kg`. The §8.1 DOCUMENT sentence then tells the
customer that load index 95 *„steht so im Gutachten"* when it did not. R-06 requires the verdict to
record which source governed; a single flag misreports half the pair, so `AxleRequirement` carries
both — additively, with `toArray()`/`fromArray()` defaulting each to the combined `minSource` so
old snapshots still read. The combined `minSource` stays for the callers that only need one bit.

---

## 4 · The Komplettrad line

### 4.1 Where the customer builds one

**On the product page (PDP), after a size is chosen.** Reasons: the verdict is per
`wheel_config`, and the tyre is only legal in the context of that verdict; `docs/spec/pages.md:561`
already places *„Angebote für 4 Kompletträder"* there; and `Basket::refusalFor()` can then check
the tyre before the line ever enters the session.

The **Wuchtgewichte colour** is chosen **in the basket**, per Komplettrad line
(`docs/spec/pages.md:742-753` puts the `Gewichte` tiles there). Adding from the PDP assigns the
admin's default colour; if no active colour exists, the Komplettrad cannot be added at all.

The **RDKS question** is asked **at the checkout** — the client asked for exactly that.

A Komplettrad **requires a chosen vehicle**. Without one there is no verdict, so there is no
permitted-size list and no legal tyre choice (§2 fail closed). A Felge alone stays buyable without a
vehicle, exactly as today.

### 4.2 Session shape

`Basket::SESSION_KEY = 'cart'` keeps its current shape and gains two fields. **No price is ever
stored in the session** — the existing docblock rule is unchanged.

```php
// Felgen-only — the key and payload are byte-identical to today, so existing sessions survive.
'wheel:12' => [
    'kind' => 'WHEEL', 'wheelConfigId' => 12, 'tyreVariantId' => null,
    'weightColourId' => null, 'quantity' => 4,
],
// Komplettrad
'wheel:12:tyre:7' => [
    'kind' => 'WHEEL', 'wheelConfigId' => 12, 'tyreVariantId' => 7,
    'weightColourId' => 3, 'quantity' => 4,
],
```

- `Basket::key(int $wheelConfigId, ?int $tyreVariantId = null): string` — `'wheel:'.$id`, plus
  `':tyre:'.$tyreId` when a tyre is carried. A Felge and a Komplettrad of the same rim are two
  lines; the same rim with two different tyres are two lines; adding the same combination twice
  merges into one line of eight, as today.
- **`Basket::add()` grows the same arguments**, because today's implementation rewrites the whole
  line array (Basket.php:137-153) and would otherwise wipe the colour on every re-add:
  ```php
  public function add(
      Request $request,
      int $wheelConfigId,
      int $quantity,
      ?int $tyreVariantId = null,
      ?int $weightColourId = null,
  ): void
  ```
  It writes `tyreVariantId` and `weightColourId` into the line beside `quantity`. Merging an
  existing line keeps its stored `weightColourId` unless a new one is passed.
- **`kind` stays `'WHEEL'` for both.** A Komplettrad *is* a wheel line that carries its tyre — the
  wording already in `Basket.php:22-23`. This keeps `Chrome::cartCount()` (counts `WHEEL` only,
  Chrome.php:298-319) and `Basket::render()`'s non-`WHEEL` drop (Basket.php:308) correct with no
  change, and keeps D6 (never a standalone tyre) mechanically true.
- The weight colour is an **attribute**, not part of the identity: changing it edits the line in
  place, like the quantity.
- RDKS is **basket-level**, not per line: `Basket::SESSION_TPMS = 'cart_tpms'`. One car, one
  answer — and the answer is **bound to the car it was given for**:

  ```php
  'cart_tpms' => [
      'choice'          => 'ja'|'nein',
      'makeKey'         => 'volkswagen',   // MakeName::key() of the vehicle at answer time
      'unitPriceCents'  => 4900,           // the QUOTE the customer was shown — never rendered
      'priceId'         => 17,             // tpms_sensor_prices.id the quote came from
  ]
  ```

  **Why the make travels with the answer.** The vehicle lives in a cookie that is independent of
  the cart and can be changed on any page. Without the binding, a customer who answers `Ja` at
  `4 × 49,00 €` for a Volkswagen and then re-uses the tab for a Porsche keeps `choice = 'ja'` while
  §4.8 silently re-prices it against `make_key = porsche` — billing a sensor price for a make they
  were never quoted and never answered the question for. Where the second car's `available` is
  false instead, `TPMS_UNAVAILABLE_REFUSAL` blocks the checkout over an answer about a different
  car, with no sentence explaining why. §4.8 therefore treats `choice` as `null` whenever the
  stored `makeKey` differs from the current vehicle's key: the §5.1 card re-renders unanswered at
  the new make's price and `TPMS_UNANSWERED_REFUSAL` holds the order until the customer answers
  again. The stale entry is overwritten, never trusted.

  **`unitPriceCents` and `priceId` are a quote, not a basket price.** The docblock rule at
  `Basket.php:15-24` — *the session never stores a price* — is about the figure that gets charged,
  and this is not that figure: it is never rendered, never summed and never billed. The page keeps
  printing the server-rendered string from §5.4, and every total is recomputed from
  `tpms_sensor_prices` on every render. The quote exists for exactly one purpose: so that §5.3's
  "a price that changed between render and submit" has something to compare against. Without it
  that requirement cannot be built, and a re-price at store time would freeze whatever the live
  table says — which is how a customer ends up billed `4 × 189,00 €` after confirming
  `4 × 49,00 €`.

### 4.3 Adding — `BasketLineRequest`

```php
'kind'            => ['required', Rule::in(['WHEEL'])],
'wheelConfigId'   => ['required', 'integer', 'min:1'],
'tyreVariantId'   => ['nullable', 'integer', 'min:1'],   // was ['prohibited']
'weightColourId'  => ['nullable', 'integer', 'min:1'],
'quantity'        => ['required', 'integer', 'min:1', 'max:99'],
```

Messages: every existing message is kept **except** `tyreVariantId.prohibited`, which is deleted.
`kind.in` keeps its exact sentence — `Reifen gibt es bei uns nur zusammen mit einer Felge als
Komplettrad.` — because D6 still holds: a `TYRE` line is still a 422.
New accessors `tyreVariantId(): ?int` and `weightColourId(): ?int`.

### 4.4 `Basket::refusalFor()` — the server-side gate (R-11)

```php
public function refusalFor(
    Request $request,
    int $wheelConfigId,
    ?int $tyreVariantId = null,
    ?int $weightColourId = null,
    int $quantity = 1,
): ?string
```

**`$quantity` is a parameter, not something the method can recover.** Steps 3 and 7 both need it;
the live method takes only the config id (Basket.php:166) and `WarenkorbController::store()` passes
the quantity separately to `add()` on the next line
(`app/Http/Controllers/Storefront/WarenkorbController.php:38-42`). `store()` therefore passes
`$request->quantity()` through, which `BasketLineRequest` already exposes. Without it a builder
implements the only thing the signature allows — an implicit quantity of 1 — and four Kompletträder
against one tyre in stock pass the add-time gate: the customer gets a success toast and a basket
that cannot be ordered, instead of an honest refusal at the point of the click, and
`KomplettradRefusal::OutOfStock` is untestable through this path.

In order, each returning a full German sentence:

1. `WheelConfig` missing → `Diese Felge gibt es nicht mehr.` *(unchanged)*
2. Vehicle chosen and verdict not sellable → **select on the status, as rule 1 of §3.3 does.**
   `NOT_PERMITTED` → `Diese Felge ist für dein Fahrzeug nicht freigegeben.` (the existing sentence);
   `UNKNOWN` → `Zu dieser Felge liegt uns für dein Fahrzeug kein Gutachten vor. Schreib uns, dann
   prüfen wir das für dich.` This is a **change**, not a carry-over: the live code answers both
   states with the NOT_PERMITTED sentence (Basket.php:176-178), which tells a customer whose car
   simply has no Gutachten on file that their car is not approved — a false statement about a legal
   fact, made with certainty (R-07, CLAUDE.md §2). It is the same defect as §3.2's and is fixed in
   the same commit rather than copied into new copy. No existing test asserts the old sentence.
3. Wheel `stock_qty < $quantity` → `Diese Größe ist derzeit ausverkauft.` **Changed**: the live
   check is `stock_qty <= 0` (Basket.php:180), which passes an add of four against a stock of one.
4. **`$tyreVariantId === null` → return null. Everything below is Komplettrad-only.**
5. No vehicle → `KomplettradRefusal::NoVehicle->sentenceDe()`.
6. `TyreVariant` missing or soft-deleted → `Diesen Reifen gibt es nicht mehr.`
7. `TyreEligibility::permits($verdict, $tyreRecord, $quantity)` → its `sentenceDe()`.
8. Weight colour: the posted id must be an **active** colour; `null` resolves to
   `BalanceWeightColour::default()`. No active colour at all →
   `Kompletträder können wir gerade nicht zusammenstellen. Die Felge allein kannst du bestellen.`
   A posted id that is not active → `Diese Farbe für die Wuchtgewichte gibt es nicht mehr.`

`WarenkorbController::store()` passes the four new values through — `tyreVariantId`,
`weightColourId` and `quantity` to `refusalFor()`, and the first two on to `add()`. Toast on success stays
`Zum Warenkorb hinzugefügt.`; for a Komplettrad it is
`Komplettrad zum Warenkorb hinzugefügt.`

### 4.5 Re-verification on **every** render

`Basket::render()` keeps its current contract — re-read from the catalogue, never from the session —
and extends it. **Mark, never drop** (Basket.php:293-305): a line that has become unsellable stays
visible with its reason.

Per line, on every render:

1. Reload `WheelConfig` (with model+brand+finish). Gone → drop (it no longer exists at all).
2. Reload `TyreVariant` when `tyreVariantId` is set. Gone → **keep the line, mark it**
   `Diesen Reifen gibt es nicht mehr. Nimm bitte einen anderen oder bestell die Felge allein.`
3. Re-resolve the verdict from the **current cookie vehicle** (`VehicleContext`), as today.
4. Komplettrad with no vehicle →
   `Für dieses Komplettrad brauchen wir dein Fahrzeug. Wähl es bitte wieder aus, dann prüfen wir die Reifengröße erneut.`
5. Komplettrad → `TyreEligibility::permits()` again, with the current quantity. A refusal marks the
   line; the sentence is the enum's.
6. Reload the colour; inactive or deleted → `Die gewählte Farbe der Wuchtgewichte gibt es nicht mehr. Bitte wähl eine neue Farbe.`
7. Re-price everything from the catalogue and the configuration (§4.6).
8. `inStock = wheelStock >= quantity && (tyre === null || tyreStock >= quantity)`.
9. `demo = wheelModel.is_demo || (tyre !== null && tyre.is_demo)`.

### 4.6 What a Komplettrad costs

One helper, used by the basket **and** by the order writer, so the two can never disagree:
`app/Services/Commerce/KomplettradPricer.php`.

```php
final readonly class KomplettradPricer
{
    public function perWheel(WheelConfig $config, ?TyreVariant $tyre, ?BalanceWeightColour $colour): KomplettradPrice;
}

final readonly class KomplettradPrice
{
    public int  $wheelCents;
    public int  $tyreCents;        // 0 for a Felgen-only line
    public ?int $mountingCents;    // null while config('rimify.komplettrad.mounting_per_wheel_cents') is null
    public int  $weightsCents;     // the colour's surcharge, 0 by default
    public bool $isSet;

    /** Sum of the KNOWN components. An unconfigured mounting fee is left out, never guessed. */
    public function knownPerWheelCents(): int;
    /** False while a component of a Komplettrad has no price yet. */
    public function complete(): bool;
}
```

- All arithmetic is integer cents; currency travels with every figure and is `EUR` throughout.
- `wheel_configs.price_cents` is the price of **one** rim. The PDP renders `× 4` for display
  (`für 4 Felgen`) and the basket multiplies by the line quantity — that existing convention is
  **not** changed here; the Komplettrad follows it exactly (one wheel, one tyre, one mounting fee,
  one set of weights per wheel).
- **Mounting unconfigured** behaves exactly like unconfigured shipping: the component row reads
  `wird noch festgelegt`, is left out of the line total and the basket total, and a new refusal
  blocks the order. Nothing is guessed and nothing is silently zero.

### 4.7 Line payload (what the basket ships to Inertia)

Added to the existing per-line array:

```ts
isSet: boolean
setLabel: 'Felge' | 'Komplettrad'
tyre: null | {
    id: number; brandName: string; name: string
    season: 'sommer'|'winter'|'ganzjahres'; seasonLabel: string   // 'Sommerreifen'
    sizeLabel: string                                             // '245/45 R18 100Y'
    unitPriceCents: number; unitPrice: string; inStock: boolean
    label: null | { fuel: string|null; wetGrip: string|null; noiseDb: number|null; noiseClass: string|null; eprelId: string }
}
weights: null | { colourId: number; name: string; swatchHex: string|null; surchargeCents: number; surcharge: string }
weightOptions: { id: number; name: string; swatchHex: string|null; surchargeCents: number; surcharge: string; isDefault: boolean }[]
mounting: null | { configured: boolean; unitPriceCents: number|null; unitPrice: string }  // 'wird noch festgelegt'
components: { key: string; label: string; quantity: number; unitPrice: string; lineTotal: string|null; open: boolean }[]
priceOpen: boolean          // a component has no price yet
blockReasons: string[]      // full German sentences; empty when nothing is wrong
```

`unitPriceCents` / `lineTotalCents` are the **known** sums (R-10 formatted alongside). The EU tyre
label is shipped **only** when the tyre has a verified `eprel_id` (ACCURACY D7, the rule
`StartseiteController::featuredTyre():455-466` already applies).

### 4.8 Totals

Added to `Basket::summary()['totals']`:

```ts
mountingConfigured: boolean
tpms: {
    applicable: boolean         // at least one Komplettrad line
    quantity: number            // total quantity of Komplettrad wheels
    available: boolean          // an active price exists for the current vehicle's make
    makeLabel: string | null    // 'Volkswagen'
    unitPriceCents: number | null
    unitPrice: string | null    // '49,00 €'
    line: string | null         // '4 × 49,00 €'
    choice: 'ja' | 'nein' | null
    totalCents: number          // 0 unless choice === 'ja'
    total: string
    notice: string | null       // the fail-closed sentence when available === false
}
```

`available`, `makeLabel` and `unitPriceCents` are recomputed from the **current** vehicle's make on
every render. `choice` is read from `session('cart_tpms')` and is **`null` whenever the stored
`makeKey` does not equal the current vehicle's key** (§4.2) — a stale answer never survives a
vehicle change, in either direction.

`subtotalCents` includes `tpms.totalCents`. VAT stays **extracted** from the gross total with the
existing `VAT_RATE` (Basket.php:40,70) — unchanged. Shipping stays unchanged.

### 4.9 Refusal order — `Basket::refusalOf()`

New constants on `Basket`, inserted into the existing chain:

```php
public const MOUNTING_REFUSAL = 'Der Preis für Montage und Auswuchten steht noch nicht fest. '
    .'Solange kannst du Kompletträder noch nicht bestellen – dein Warenkorb bleibt gespeichert.';

public const TPMS_UNANSWERED_REFUSAL = 'Bitte sag uns noch, ob du RDKS-Sensoren brauchst.';

public const TPMS_UNAVAILABLE_REFUSAL = 'Für dein Fahrzeug können wir RDKS-Sensoren gerade nicht '
    .'berechnen. Bestell ohne Sensoren oder schreib uns – wir melden uns mit dem Preis.';
```

Order (each replaces nothing above it):

1. `EMPTY_REFUSAL`
2. `DEMO_REFUSAL` — now also true for a demo **tyre**
3. `BLOCKED_REFUSAL` — stock, unsellable verdict, **and any line with `blockReasons`**
4. `MOUNTING_REFUSAL` — a Komplettrad line while the mounting fee is unconfigured
5. `TPMS_UNANSWERED_REFUSAL` — `tpms.applicable && tpms.choice === null`
6. `TPMS_UNAVAILABLE_REFUSAL` — `tpms.choice === 'ja' && ! tpms.available`
7. `SHIPPING_REFUSAL`
8. `KasseController::PREVIEW_REFUSAL` — until payment exists, everything is still refused

`KasseOrderRefusalTest`'s invariant is untouched: **no row is written by any of these paths.**

### 4.10 Changing a line

| Action | Route | Behaviour |
|---|---|---|
| Quantity | `PATCH /warenkorb/{line}` *(exists)* | Moves the whole set together — rim, tyre, mounting, weights and (via the total) sensors. 0 removes. Cap 99. |
| Weight colour | `PATCH /warenkorb/{line}/gewichte` → `warenkorb.gewichte` | `BasketWeightColourRequest`: `colourId` required, integer, `exists:balance_weight_colours,id`, and re-checked server-side for `active` (R-11). Redirects `back()`. |
| Remove the tyre | `DELETE /warenkorb/{line}/reifen` → `warenkorb.reifen.destroy` | Converts the Komplettrad to a Felgen-only line: removes the old key, merges into `wheel:{id}` (capped at 99). Toast: `Der Reifen wurde entfernt – du bestellst jetzt nur die Felgen.` Implements `docs/spec/pages.md:779-781`. |
| Remove the line | `DELETE /warenkorb/{line}` *(exists)* | Unchanged. |

There is **no** route to add a tyre to an existing basket line: that choice belongs where the
verdict and the tyre offer are rendered (the PDP). The basket line links back to the product page.

### 4.11 How a set appears

**Product page** — a new section beneath the fitment panel, `Komplettrad`:
heading, the minimum sentence (§3.3), and a card per offered tyre with brand, name, season, size,
the EU label where one is verified, the per-wheel and ×4 price, and
`Als Komplettrad in den Warenkorb`. When `offer.refusal` is set, the section shows that one
sentence plus a route forward (`Fahrzeug wählen` / the e-mail from `contact.email` /
`Nur die Felgen bestellen`) — never an empty panel and never a dead end (R-09 in spirit).

**Warenkorb** — one block per line. A Komplettrad prints the product row (rim) plus a component
list: `Felge`, `Reifen`, `Montage und Auswuchten`, `Wuchtgewichte (Silber)`, each with
`Anzahl × Einzelpreis` and a line total; an unpriced component shows `wird noch festgelegt` in
ink-3. Beneath the components sit the **Wuchtgewichte tiles** (whole-tile selection, a visually
hidden radio, 2px `--blue` border + `--wash` + a corner check when selected —
`docs/spec/pages.md:744-749`). `blockReasons` render as a `--danger-w` strip on the row with
`Entfernen` and `Anderes Fahrzeug wählen`, exactly as the existing not-permitted state does.

**Kasse** — the summary repeats the components per line and adds the RDKS row (§5).

**Bestellbestätigung** — lines are grouped by `package_group`; a group renders under the heading
`Komplettrad` with its sub-lines indented, each showing its frozen label, quantity, unit price and
line total, and the frozen verdict attached to the group's wheel line.
`BestellungController::show()` adds `packageGroup` to each line payload.

**Admin order view** — not built by this feature (there is no `admin.bestellungen.*` screen yet).
The grouping contract above is fixed now so that screen and the confirmation page cannot later
disagree: group by `package_group`, the snapshot hangs off the `WHEEL` line, the `ACCESSORY`
sensor line shows the make it was priced for.

---

## 5 · The checkout question — „Brauchst du RDKS-Sensoren?"

### 5.1 Where

Inside the existing three-step checkout, as its own form card at the **top of step 2**. The step's
label changes from `Versand` to **`Optionen & Versand`**, which reads correctly whether or not the
basket holds a Komplettrad. The stepper stays at three steps: a fourth step would break
`§312j`-tested flow assumptions in `resources/js/Pages/Kasse/Index.test.ts` for no gain.

**Renaming the step means renaming it everywhere it is spelled.** `resources/js/Pages/Kasse/Index.vue`
names the step five times, and changing only the stepper label leaves one page calling the step two
different things. All five are listed in §8.3 so the copy editor sees the whole set: the stepper
label (:45), the step heading (:586), the button that walks into it (:557), the summary `<dt>` (:318
and :576) and the visually-hidden `Ändern` suffix (:579). The **shipping-method** strings inside the
step — `Versandart`, `Standardversand`, `Versandkosten werden noch festgelegt`, `inkl. … MwSt. und
Versand` — are about shipping itself and are **not** renamed.

The card is rendered **only when `totals.tpms.applicable === true`** — a Felgen-only basket is never
asked (§11 D-034).

### 5.2 Exact behaviour

| State | What the customer sees |
|---|---|
| Price configured for the make | Card `Reifendruck-Sensoren (RDKS)`. Two option tiles, same control as `Gewichte`. **Ja:** `Ja, bitte mit RDKS-Sensoren` · `4 × 49,00 €` · `Wir setzen die Sensoren gleich mit ein.` **Nein:** `Nein, ich brauche keine` · `0,00 €`. Neither is preselected. |
| No price for this make | The **Ja tile is not rendered at all** (never rendered-and-disabled). The card shows: `Für Volkswagen haben wir den Preis für RDKS-Sensoren noch nicht hinterlegt. Schreib uns kurz – wir melden uns mit dem Preis. Ohne Sensoren kannst du sofort bestellen.` plus the mailto rendered from `contact.email`, and the `Nein` tile. |
| No vehicle | Cannot happen with a Komplettrad in the basket: the line is already marked and `BLOCKED_REFUSAL` stands before step 2 is reachable. |
| Nothing chosen | `Weiter` is refused client-side with `Bitte sag uns noch, ob du RDKS-Sensoren brauchst.`, and the server refuses the order with the same sentence. |

Explanatory line, always under the question:
`Viele Autos zeigen den Reifendruck im Display an. Dafür sitzt in jedem Rad ein Sensor. Ob dein Auto das hat, steht in der Betriebsanleitung – oder du siehst es daran, ob dein Display dir den Reifendruck anzeigt.`

### 5.3 Wire-up

- `PATCH /kasse/rdks` → `kasse.rdks`, `TpmsChoiceRequest` (`choice` required, `Rule::in(['ja','nein'])`),
  throttled `throttle:30,1`. It writes the **whole** `session('cart_tpms')` array of §4.2 — the
  choice, the current vehicle's `makeKey`, and the `unitPriceCents`/`priceId` the customer was just
  quoted — and returns `back()`, so the **server** re-renders the totals with the sensor line. The
  page never computes a price. On `nein` the quote fields are written as `null`: there is nothing
  to charge and therefore nothing to compare.
- `PlaceOrderRequest` gains
  `'rdks' => ['exclude_if:...', 'required_if_basket_has_set', Rule::in(['ja','nein'])]` — expressed
  concretely as: `'rdks' => ['nullable', Rule::in(['ja','nein'])]` in `rules()`, plus a
  `withValidator()` closure that adds the error
  `Bitte sag uns noch, ob du RDKS-Sensoren brauchst.` when the basket contains a Komplettrad and
  `rdks` is absent. The submitted value overwrites the session value, so there is one source of
  truth at submit time.
- The server **re-prices the sensors at store time** from `tpms_sensor_prices` for the current
  vehicle's make, and **compares the fresh row's `price_cents` and `id` against the quote stored in
  `session('cart_tpms')`** (§4.2). Any difference — a changed price, a different row, a row that
  has gone — means the order is not written and the customer is returned to the basket with
  `Ein Preis in deinem Warenkorb hat sich geändert. Bitte sieh dir die Summe noch einmal an.`

  The comparison **needs a stored reference and has none today**: `PlaceOrderRequest` posts
  addresses and `billingSame` and no monetary field at all
  (`app/Http/Requests/Storefront/PlaceOrderRequest.php:38-54`), and `KasseController::store()`
  re-derives everything from the live catalogue (KasseController.php:55-60). Without the quote the
  re-price reads the new figure, finds nothing to disagree with, and freezes the order at it —
  the customer is billed a number they never confirmed, which is the exact opposite of §6.6's *"a
  price change never touches an existing order"*. The quote is the cheapest reference consistent
  with §4.2's rule that no **basket price** lives in the session; a posted price field is the
  alternative and is rejected here because it puts the reference under the client's control.

### 5.4 Display and totals

- Summary row label: `RDKS-Sensoren (4 × 49,00 €)`, value `196,00 €`, right-aligned, tabular.
- Choice `nein` → the row is not rendered at all and `tpms.totalCents` is `0`.
- Money is formatted **once**, server-side, by `GermanFormat::money()`. The page prints the string it
  is given; it never multiplies cents in JavaScript. (This also side-steps the known
  `GermanFormat` U+00A0 vs `format.ts` U+202F mismatch.)

---

## 6 · Admin

> **Prerequisite.** `AdminLoginController` renders the sign-in screen and nothing else — there is no
> `POST /admin/anmelden`, no logout and no TOTP (`AdminLoginController.php:19-29`). These screens are
> therefore reachable in tests (`actingAs($admin,'admin')`) but not yet in a browser. The login flow
> is a separate piece of work and is **not** in this feature's scope; this feature must not ship as
> "done for the client" until it is. Say so in the handover.

### 6.1 Authorisation — built here, because R-11 demands it

There is currently **no** server-side authorisation anywhere in the admin: no `app/Policies`, no
gate reading `role_permissions`, no `authorize()` in any admin controller. The first admin mutation
in this codebase is the first one that must not ship without it.

> **`$this->authorize()` does not exist yet.** `App\Http\Controllers\Controller`
> (`app/Http/Controllers/Controller.php:7-10`) is an empty `abstract class Controller {}` — it does
> **not** use `Illuminate\Foundation\Auth\Access\AuthorizesRequests`, so every `$this->authorize(…)`
> in §6.3 is a fatal *Call to undefined method*. No existing controller authorises anything, so
> this has never been exercised. **Commit 7 adds the trait to that base class**; that one-line file
> is part of commit 7's file list. (`Gate::authorize(…)` is the alternative and needs no base-class
> change; this specification picks the trait so the admin controllers read like Laravel's own.)

New files:

- `app/Services/Admin/PermissionMatrix.php`
  ```php
  final class PermissionMatrix
  {
      /** True when any role this admin holds allows this action on this module. */
      public function allows(AdminUser $user, PermissionModule $module, PermissionAction $action): bool;
  }
  ```
  One query per request over `role_permissions` joined to `model_has_roles` for the user's role ids,
  memoised per instance. **No cross-request cache** in v1: a permission that was revoked a second ago
  must not still be honoured, and the query is a single indexed read.

  **No `forget()`.** With no cross-request cache there is nothing to forget, and there is no Rollen
  save to call it from: `RollenController` has `index()` only and `routes/web.php:124` registers
  just `admin.rollen.index`. `composer verify:php` runs Pest with `--min=85` over all of `app`
  (phpunit.xml includes `app` wholesale), so an unreachable public method costs coverage for
  nothing. It is added by whichever change first introduces a Rollen write, together with its
  caller.
- `app/Models/AdminUser.php` gains
  `public function may(PermissionModule $m, PermissionAction $a): bool` delegating to the matrix.
- `app/Policies/BalanceWeightColourPolicy.php` and `app/Policies/TpmsSensorPricePolicy.php` —
  five abilities, mapped explicitly, because **there is no `PermissionAction::Update`**
  (`app/Enums/PermissionAction.php:12-19` defines `View`, `Create`, `Edit`, `Delete`, `Publish`,
  `Export`, and `AccessSeeder::ALL` likewise uses `'edit'`):

  | Policy ability | `PermissionAction` |
  |---|---|
  | `viewAny` | `View` |
  | `view` | `View` |
  | `create` | `Create` |
  | `update` | **`Edit`** |
  | `delete` | `Delete` |

  Each returns `$user->may(PermissionModule::Catalogue, $action)`.

  **Both policies ship after their models exist.** They reference `App\Models\BalanceWeightColour`
  and `App\Models\TpmsSensorPrice`, which commit 3 creates; Larastan level 6 fails on an unknown
  class, so a commit 7 carrying them could never be green on its own. The colour policy is part of
  commit 8 and the price policy part of commit 9 (§10).
- `app/Providers/AuthServiceProvider.php` (new, registered in `bootstrap/providers.php`) —
  registers both policies and:
  ```php
  // Every denial is evidence. docs/BUILD.md:119-120 requires a denied URL attempt to be logged.
  Gate::after(function (mixed $user, string $ability, ?bool $result, array $arguments): void {
      if ($result === false && $user instanceof AdminUser) {
          activity('admin')->causedBy($user)
              ->withProperties(['ability' => $ability, 'route' => request()->route()?->getName()])
              ->log('permission.denied');
      }
  });
  ```
  `Gate::after` returning `void`/`null` leaves the decision unchanged.

**No new `PermissionModule` case.** Both screens live under the existing `catalogue` module, which
means **no migration is needed** to rebuild `chk_role_permissions_module` and **no `AccessSeeder`
change** — `AccessSeeder` is deliberately never run by `rimify:release-seed`
(`ReleaseSeed.php:25`), so a new module case would never reach an existing database. Resulting
access, from the seeded matrix (`AccessSeeder.php:49-124`), with no edits:

| Role | Wuchtgewichte-Farben | RDKS-Preise |
|---|---|---|
| Super Admin | full | full |
| Katalog-Manager (`catalogue` = ALL) | full | full |
| Compliance Editor (`catalogue` = view) | read-only | read-only |
| Bestell-Manager (`catalogue` = view) | read-only | read-only |
| Support Agent (`catalogue` = view) | read-only | read-only |
| Content Editor (no `catalogue`) | **403, item not rendered** | **403, item not rendered** |
| Buchhaltung (no `catalogue`) | **403, item not rendered** | **403, item not rendered** |

### 6.2 Routes — inside the existing `auth:admin` group in `routes/web.php:121-126`

```php
Route::get('/wuchtgewichte', [WuchtgewichteController::class, 'index'])->name('wuchtgewichte.index');
Route::post('/wuchtgewichte', [WuchtgewichteController::class, 'store'])->name('wuchtgewichte.store');
Route::patch('/wuchtgewichte/{colour}', [WuchtgewichteController::class, 'update'])->name('wuchtgewichte.update');
Route::delete('/wuchtgewichte/{colour}', [WuchtgewichteController::class, 'destroy'])->name('wuchtgewichte.destroy');

Route::get('/rdks-preise', [RdksPreiseController::class, 'index'])->name('rdks.index');
Route::post('/rdks-preise', [RdksPreiseController::class, 'store'])->name('rdks.store');
Route::patch('/rdks-preise/{price}', [RdksPreiseController::class, 'update'])->name('rdks.update');
Route::delete('/rdks-preise/{price}', [RdksPreiseController::class, 'destroy'])->name('rdks.destroy');
```

Paths are German; **route names are the stable identifier** (`routes/web.php:31-35`). The
`Route::fallback` at :114 stays the catch-all.

### 6.3 Controllers

`app/Http/Controllers/Admin/WuchtgewichteController.php`,
`app/Http/Controllers/Admin/RdksPreiseController.php` — `declare(strict_types=1)`, extend
`App\Http\Controllers\Controller`, `Inertia::render('Admin/Wuchtgewichte/Index', …)`.

- `index()` calls `$this->authorize('viewAny', BalanceWeightColour::class)` and ships camelCase props
  with prices pre-formatted by `GermanFormat::money()` **and** the raw cents beside them (the form
  edits the formatted string, the table prints the formatted string).
- `store()`/`update()`/`destroy()` authorise through the Form Request, write inside
  `DB::transaction`, write an `activity()` entry, and `back()->with('toast', …)`.
- `WuchtgewichteController::store()` resolves the derived slug `withTrashed()` first: an existing
  trashed row with that slug is **restored and updated** rather than inserted, which is why §6.4's
  unique rules exclude trashed rows. Only when nothing is found does it `create()`.
  `RdksPreiseController::store()` does the same on `make_key`.
- `destroy()` on the **default** colour is refused while another active colour exists without a
  default — concretely: deleting the default promotes the next active colour by `sort_order` to
  default inside the same transaction; deleting the **last** active colour is allowed and the
  storefront then correctly refuses Kompletträder.

### 6.4 Form Requests — `app/Http/Requests/Admin/` (a new namespace)

`BalanceWeightColourRequest`:

```php
public function authorize(): bool
{
    $user = $this->user('admin');

    return $user !== null && $user->can(
        $this->route('colour') === null ? 'create' : 'update',
        $this->route('colour') ?? BalanceWeightColour::class,
    );
}

protected function prepareForValidation(): void
{
    $nameDe = trim((string) $this->input('nameDe'));

    $this->merge([
        'nameDe'     => $nameDe,
        // The column is NOT NULL with no default and MySQL runs in strict mode: a create() with
        // no slug is a 500, not a validation error. It is derived here and never posted.
        'slug'       => Str::slug($nameDe),
        'swatchHex'  => $this->hex(),                                   // '' → null, else strtoupper, '#' prefixed
        'surchargeCents' => Money::fromGerman((string) $this->input('surcharge', '0')),
    ]);
}

public function rules(): array
{
    return [
        'nameDe'         => ['required','string','max:64',
                             Rule::unique('balance_weight_colours','name_de')
                                 ->whereNull('deleted_at')
                                 ->ignore($this->route('colour'))],
        'slug'           => ['required','string','max:64','regex:/^[a-z0-9][a-z0-9-]*$/',
                             Rule::unique('balance_weight_colours','slug')
                                 ->whereNull('deleted_at')
                                 ->ignore($this->route('colour'))],
        'swatchHex'      => ['nullable','string','regex:/^#[0-9A-F]{6}$/'],
        'surchargeCents' => ['required','integer','min:0','max:9999999'],   // ≤ 99.999,99 €
        'isDefault'      => ['required','boolean'],
        'active'         => ['required','boolean'],
        'sortOrder'      => ['required','integer','min:0','max:9999'],
    ];
}
```

`Str::slug()` transliterates the same way the rest of the app does — `Silber` → `silber`,
`Schwarz matt` → `schwarz-matt`. A name that slugs to `''` (punctuation only) fails
`slug.required`, which is the honest outcome.

**`->whereNull('deleted_at')` is not optional on either unique rule.** `Rule::unique` queries the
table directly and does **not** apply the model's soft-delete scope, so a trashed row collides and
validation fails before §6.3's `withTrashed()` restore can ever run — and the admin reads a
message written for a live row about one that is deleted. With the clause, only live rows collide
and the restore path is reachable.

German `du`-form messages, including:
`'surchargeCents.required' => 'Bitte schreib den Aufpreis deutsch, zum Beispiel 0,00 oder 2,50.'`
(`Money::fromGerman()` returning `null` surfaces as `required`, which is the sentence that names the
fix), and
`'nameDe.unique' => 'Diese Bezeichnung gibt es schon – bearbeite die vorhandene Farbe.'`,
`'slug.unique' => 'Diese Bezeichnung gibt es schon – bearbeite die vorhandene Farbe.'`

`TpmsSensorPriceRequest`:

```php
protected function prepareForValidation(): void
{
    $make = trim((string) $this->input('make'));

    $this->merge([
        'makeKey'     => MakeName::key($make),
        'makeLabelDe' => MakeName::normalise($make),
        'priceCents'  => Money::fromGerman((string) $this->input('price', '')),
    ]);
}

public function rules(): array
{
    return [
        'makeKey'     => ['required','string','max:64','regex:/^[a-z0-9][a-z0-9-]*$/',
                          Rule::unique('tpms_sensor_prices','make_key')
                              ->whereNull('deleted_at')
                              ->ignore($this->route('price'))],
        'makeLabelDe' => ['required','string','max:64'],
        'priceCents'  => ['required','integer','min:1','max:9999999'],
        'active'      => ['required','boolean'],
    ];
}
```

Messages:
`'makeKey.required' => 'Bitte gib die Automarke an.'`,
`'makeKey.unique' => 'Für diese Marke ist schon ein Preis hinterlegt – bearbeite ihn dort.'`,
`'priceCents.required' => 'Bitte schreib den Preis deutsch, zum Beispiel 49,00.'`,
`'priceCents.min' => 'Ein Preis von 0,00 € würde behaupten, die Sensoren wären kostenlos. Lass die Marke lieber ganz weg.'`

The brand list is **free text with a datalist** of the makes actually present in `vehicles`
(`VehicleTree::makes()`), because the client's brand range is not decided and an admin must be able
to add a make RIMIFY does not yet sell.

### 6.5 Pages

`resources/js/Pages/Admin/Wuchtgewichte/Index.vue`, `resources/js/Pages/Admin/Rdks/Index.vue` —
`defineOptions({ layout: AdminLayout, inheritAttrs: false })`, typed by new
`AdminWuchtgewichteProps` / `AdminRdksProps` in `resources/js/types/pages.ts`.

Each: a table (`design-system.md §5.8`), an inline "new row" form, edit in place, a destructive
confirm dialog, the flash toast from `HandleInertiaRequests` (`flash.toast`), and an **empty state**
that says what the consequence is (§8).

`resources/js/Layouts/AdminLayout.vue` gains two rail items (icons `box` and `settings`, both in
`ICON_NAMES`). Because the rail is still hard-coded and unfiltered, this commit also ships the
server-side filtering it was always meant to have: `HandleInertiaRequests` shares
`admin.can = { catalogue: bool, … }` **only for `admin.*` routes**, and the rail renders an item
only when its module is allowed. `RoutesRenderTest.php:57-66` asserts no admin path leaks into
storefront HTML — the share must be gated on the route name, not added unconditionally.

### 6.6 Audit

Every mutation writes an `activity()` entry on the `AuditLog` model (append-only, R-12-adjacent
triggers already exist):

| Event | `log()` | properties |
|---|---|---|
| Colour created | `weight_colour.created` | id, name_de, surcharge_cents |
| Colour changed | `weight_colour.updated` | id, `old`/`attributes` diff |
| Colour deleted | `weight_colour.deleted` | id, name_de |
| Price created | `tpms_price.created` | make_key, price_cents |
| Price changed | `tpms_price.updated` | make_key, old/new price_cents |
| Price deleted | `tpms_price.deleted` | make_key |
| Denied attempt | `permission.denied` | ability, route |

A **price change never touches an existing order**: `order_lines.unit_price_cents` and `label` are
frozen at purchase, and nothing re-reads a live price for a placed order.

---

## 7 · Order-time freezing

Placing an order is still refused (ACCURACY D4) — `KasseController::store()` writes nothing and this
feature does not change that. What this feature **does** fix is the shape an order must have, so
that the seeder, the confirmation page and the future order writer agree.

### 7.1 The lines one Komplettrad produces

All share one `package_group` (per set, 1-based within the order):

| # | `kind` | `label` (frozen) | `quantity` | `unit_price_cents` | ids set |
|---|---|---|---|---|---|
| 1 | `WHEEL` | `MOTEC MCR4 Ultimate · Light Grey D5 · 8,5J × 19 · ET 45 · 5 × 112 · 66,6 mm` | 4 | `wheel_configs.price_cents` | `wheel_config_id` |
| 2 | `TYRE` | `Bridgestone Potenza Sport · Sommer · 245/45 R18 100Y` | 4 | `tyre_variants.price_cents` | `tyre_variant_id` |
| 3 | `SERVICE` | `Montage und Auswuchten` | 4 | `config('rimify.komplettrad.mounting_per_wheel_cents')` | — |
| 4 | `ACCESSORY` | `Wuchtgewichte · Silber` | 4 | colour surcharge (may be `0`) | `balance_weight_colour_id` |
| 5 | `ACCESSORY` | `RDKS-Sensoren · Volkswagen` | 4 | the per-sensor price | `tpms_sensor_price_id` |

- Line 4 is written **even at 0 cents**: the order must say which colour was chosen.
- Line 5 exists **only** when the customer answered `ja`.
- **No new `OrderLineKind` case.** The `kind` CHECK is generated from `OrderLineKind::values()` at
  migration time (`create_commerce_tables.php:134`); adding a case without a constraint-rebuilding
  migration makes every insert fail. `ACCESSORY` and `SERVICE` cover this feature exactly.
- The `WHEEL` line — not a `PACKAGE` line — carries the frozen verdict, because
  `order_line_fitments.wheel_config_id` is `NOT NULL` and `BestellungController::isDemo()` joins on
  `order_lines.wheel_config_id`. `OrderLineKind::PACKAGE` stays unused (§11 D-036).
- `orders.vehicle_make` is written from the live vehicle at purchase.

### 7.2 R-12

`order_line_fitments` is written **once**, inside the same transaction as its `WHEEL` line, exactly
as `CommerceSeeder::freezeVerdict()` does (CommerceSeeder.php:359-384). It is never updated, never
deleted, and never written for `TYRE`, `SERVICE` or `ACCESSORY` lines. The order writer asserts
`$kind->requiresFitmentSnapshot() === $snapshotWritten` per line — the first caller
`OrderLineKind::requiresFitmentSnapshot()` has ever had.

The tyre chosen is **not** in the snapshot's verdict JSON (that JSON is `FitmentVerdict::toArray()`
and its shape is frozen). The tyre is evidenced by line 2's `tyre_variant_id` and frozen label, and
the snapshot proves which sizes were permitted on the day. That is deliberate: extending the verdict
JSON would change a compliance record's shape.

### 7.3 `CommerceSeeder`

Rewritten to produce the five-line shape above for its every-third-order Komplettrad, using
`TyreEligibility` instead of its own `komplettradTyre()`, and using `KomplettradPricer` for the
figures. It still runs only in `local`/`testing` and still never rewrites an existing snapshot.
While `mounting_per_wheel_cents` is null the seeder uses its existing, clearly-commented
demonstration figure of `1_900` cents **for seeded demo orders only** and marks them as it already
does; production seeding is unaffected because `CommerceSeeder` never runs outside local/testing.

---

## 8 · German copy — every new string

`du`-form, `de-DE`, full sentences (R-15). **Flagged for the German copy editor**: every row below
is new copy and needs a pass. Forbidden by existing guards: `Stripe`, `DHL`, `Werktage`,
`Kartendaten` (`resources/js/claims.test.ts:22`, `Kasse/Index.test.ts:131`), and `Ventile` /
`Anbauset` in the Komplettrad FAQ answer (`ContentSeederTest.php:143-152`, audit finding #20). No
contact detail is ever written into a component — it renders from `config('rimify.contact')`.

### 8.1 Product page

| Key | Text |
|---|---|
| Section heading | `Komplettrad – Felge mit Reifen, montiert und gewuchtet` |
| Lead | `Wir ziehen den Reifen auf die Felge, wuchten das Rad aus und liefern es fertig montiert. Die Farbe der Wuchtgewichte wählst du im Warenkorb.` |
| Minimum line (both DERIVED) | `Für dein Fahrzeug brauchen die Reifen mindestens Tragfähigkeitsindex 95 und Geschwindigkeitsindex Y. Diese Mindestwerte ergeben sich aus Achslast und Höchstgeschwindigkeit deines Fahrzeugs.` |
| Minimum line (both DOCUMENT) | `Für dein Fahrzeug brauchen die Reifen mindestens Tragfähigkeitsindex 95 und Geschwindigkeitsindex Y. Diese Mindestwerte stehen so im Gutachten.` |
| Minimum line (**mixed**) | `Für dein Fahrzeug brauchen die Reifen mindestens Tragfähigkeitsindex 95 und Geschwindigkeitsindex Y. Der Tragfähigkeitsindex ergibt sich aus den Daten deines Fahrzeugs, der Geschwindigkeitsindex steht so im Gutachten.` — and the mirror image where the load index is the documented half. |
| Buy button | `Als Komplettrad in den Warenkorb` |
| Fallback link | `Nur die Felgen bestellen` |
| Price note | `Preis je Rad, inklusive Reifen, Montage und Wuchtgewichten.` |
| Price open | `Der Preis für Montage und Auswuchten steht noch nicht fest.` |
| Refusals | the thirteen sentences in §3.2 |
| Contact route | `Schreib uns` (the `mailto:` is built from `contact.email`) |

`minimumSentenceDe()` picks its variant from `minLoadSource` and `minSpeedSource` **separately**
(§3.4), never from the combined `minSource`. A Gutachten that states only a speed symbol sets the
combined flag to `DOCUMENT` for an axle whose load index was derived from `axle_load_front_kg`, and
the DOCUMENT sentence would then claim that load index 95 *„steht so im Gutachten"* when nothing in
any document says so. R-06 requires the verdict to record which source governed; the sentence has
to say the same thing the verdict recorded, per value.

### 8.2 Warenkorb

| Key | Text |
|---|---|
| Component labels | `Felge` · `Reifen` · `Montage und Auswuchten` · `Wuchtgewichte` |
| Weights heading | `Wuchtgewichte` |
| Weights hint | `Die Gewichte sitzen innen an der Felge. Such dir die Farbe aus, die dir besser gefällt.` |
| Free option (visually hidden) | `ohne Aufpreis` |
| Open price | `wird noch festgelegt` |
| Tyre gone | `Diesen Reifen gibt es nicht mehr. Nimm bitte einen anderen oder bestell die Felge allein.` |
| Vehicle cleared | `Für dieses Komplettrad brauchen wir dein Fahrzeug. Wähl es bitte wieder aus, dann prüfen wir die Reifengröße erneut.` |
| Colour gone | `Die gewählte Farbe der Wuchtgewichte gibt es nicht mehr. Bitte wähl eine neue Farbe.` |
| Remove tyre | `Reifen entfernen` |
| Remove-tyre toast | `Der Reifen wurde entfernt – du bestellst jetzt nur die Felgen.` |
| Mounting refusal | see `Basket::MOUNTING_REFUSAL` (§4.9) |

### 8.3 Kasse

| Key | Text |
|---|---|
| Step 2 label (stepper, `Index.vue:45`) | `Optionen & Versand` |
| Step 2 heading (`Index.vue:586`) | `Optionen & Versand` |
| Button into step 2 (`Index.vue:557`) | `Weiter zu Optionen & Versand` |
| Summary `<dt>` (`Index.vue:318`, `:576`) | `Optionen & Versand` |
| Summary `Ändern` suffix, visually hidden (`Index.vue:579`) | `Ändern (Optionen & Versand)` |
| Card heading | `Reifendruck-Sensoren (RDKS)` |
| Question | `Brauchst du RDKS-Sensoren?` |
| Explanation | `Viele Autos zeigen den Reifendruck im Display an. Dafür sitzt in jedem Rad ein Sensor. Ob dein Auto das hat, steht in der Betriebsanleitung – oder du siehst es daran, ob dein Display dir den Reifendruck anzeigt.` |
| Option ja | `Ja, bitte mit RDKS-Sensoren` |
| Option ja, sub | `Wir setzen die Sensoren gleich mit ein.` |
| Option nein | `Nein, ich brauche keine` |
| Unanswered | `Bitte sag uns noch, ob du RDKS-Sensoren brauchst.` |
| No price (`%s` = make label) | `Für %s haben wir den Preis für RDKS-Sensoren noch nicht hinterlegt. Schreib uns kurz – wir melden uns mit dem Preis. Ohne Sensoren kannst du sofort bestellen.` |
| Refusal on ja | see `Basket::TPMS_UNAVAILABLE_REFUSAL` (§4.9) |
| Summary row | `RDKS-Sensoren (4 × 49,00 €)` |
| Price changed | `Ein Preis in deinem Warenkorb hat sich geändert. Bitte sieh dir die Summe noch einmal an.` |

### 8.4 Bestellbestätigung

| Key | Text |
|---|---|
| Group heading | `Komplettrad` (from `OrderLineKind::Package->labelDe()`) |
| Frozen labels | `Montage und Auswuchten` · `Wuchtgewichte · Silber` · `RDKS-Sensoren · Volkswagen` |

### 8.5 FAQ — `database/seeders/ContentSeeder.php`

The existing answer to *„Was ist ein Komplettrad und was ist enthalten?"* (ContentSeeder.php:479-480)
is replaced by:

`Ein Komplettrad ist eine Felge mit aufgezogenem und gewuchtetem Reifen – inklusive Wuchtgewichte in der Farbe, die du dir aussuchst. RDKS-Sensoren (die Sensoren für die Reifendruckanzeige) fragen wir an der Kasse ab, weil nicht jedes Auto sie braucht. Welches Gutachten dazugehört und ob eine Eintragung nötig ist, steht bei jeder Felge.`

It mentions neither `Ventile` nor `Anbauset`, so `ContentSeederTest.php:143-152` keeps passing
unchanged.

### 8.6 Admin

| Key | Text |
|---|---|
| Page titles | `Wuchtgewichte-Farben` · `RDKS-Sensorpreise je Marke` |
| Colour fields | `Bezeichnung` · `Farbwert (Hex)` · `Aufpreis je Rad` · `Standardfarbe` · `Aktiv` · `Reihenfolge` |
| Price fields | `Automarke` · `Preis je Sensor` · `Aktiv` |
| Money hint | `Preis in Euro, deutsch geschrieben – zum Beispiel 49,00.` |
| Colours empty | `Noch keine Farbe angelegt. Solange können Kundinnen und Kunden kein Komplettrad bestellen.` |
| Prices empty | `Noch kein Preis hinterlegt. Wir fragen RDKS-Sensoren an der Kasse zwar ab, können sie aber für keine Marke berechnen.` |
| Delete confirm (colour) | `Farbe wirklich löschen? Bestellungen behalten die Farbe, die sie hatten.` |
| Delete confirm (price) | `Preis wirklich löschen? An der Kasse können wir für diese Marke dann keine Sensoren mehr berechnen.` |
| Saved toast | `Gespeichert.` |
| Key note | `Wir merken uns die Marke als %s – so finden wir sie auch bei anderer Schreibweise wieder.` |

---

## 9 · Tests

`composer verify` is the definition of done (CLAUDE.md §7). Pest runs on **real MySQL**; Larastan is
level 6; `tests/Unit/ArchitectureTest.php` requires `declare(strict_types=1)` everywhere and bans
`dd`/`dump`.

### 9.1 Pest — unit

> **`tests/Unit` has no framework and no database.** `tests/Pest.php:17` is
> `pest()->extend(TestCase::class)->in('Feature');` and its docblock says so in as many words: the
> pure part of `app/Domain/Fitment` must be testable with nothing booted (R-13). A unit test that
> touches Eloquent, `config()`, a `Request` or a session fatals on a missing container. The
> existing precedent is exactly this split — `tests/Unit/Fitment/*` run against
> `tests/Support/Fitment/InMemoryFitmentRepository.php`, while the DB-backed engine tests live in
> `tests/Feature/Fitment/`. Three tests that an earlier draft of this specification placed in
> `tests/Unit` are therefore **feature tests**, listed in §9.2.

| File | Covers |
|---|---|
| `tests/Unit/Support/MoneyTest.php` | every vector of §2.6, including both non-breaking spaces, every rejection, and both directions of the grouping rule (`12.500,50` → 1250050; `1.42,00`, `1.2345,00`, `1.4.25,00` → null) |
| `tests/Unit/Support/MakeNameTest.php` *(extend)* | `key()`: `VW`/`vw`/`Volkswagen` → `volkswagen`; `Mercedes` → `mercedes-benz`; `Škoda`/`Skoda` → `skoda`; `''` → `''`; `normalise()` unchanged |
| `tests/Unit/Fitment/TyreEligibilityTest.php` | **every branch of §3.3**, fed by an in-memory `TyreCatalogue` fake alongside `tests/Support/Fitment/`. Explicitly: an `UNKNOWN` verdict refuses with `VerdictUnknown` and **shows that sentence, not the `NOT_PERMITTED` one**; a `NOT_PERMITTED` verdict refuses with `VerdictNotPermitted`; a restored verdict (`FitmentVerdict::fromArray(...)`) refuses with `VerdictRestored` rather than being answered; a null `minLoadIndex` refuses (never "no minimum"); a document minimum **above** the derived one governs and the sentence names the documented half only; a document minimum **below** it does not relax anything; an unrecognised document symbol is ignored (D-027) while an unrecognised **tyre** symbol refuses; a size listed on the front axle only refuses; a `MIXED` layout refuses; **an `axle = ALL` fitment row carrying a `FRONT` and a `REAR` tyre size refuses with `StaggeredLayout` — asserted twice: once through rule 3a after the §3.3a filter fix, and once with the axle filter bypassed so that rule 3b is the arm that fires**; `affectsTyreChoice` refuses; out-of-stock refuses at the requested quantity |
| `tests/Unit/Fitment/KomplettradRefusalTest.php` | a data provider over `KomplettradRefusal::cases()` asserting **all thirteen** `sentenceDe()` values are non-empty full German sentences naming no contact detail and no bare code. Required because `composer verify:fitment` is `pest tests/Unit/Fitment tests/Feature/Fitment --coverage --min=100 --coverage-filter=app/Domain/Fitment` (composer.json:94-97) and `KomplettradRefusal` lives in `app/Domain/Fitment/Tyres`: arms the storefront raises — `NoVehicle` comes only from `Basket::refusalFor()`, whose tests are in `tests/Feature/Storefront/` — are otherwise uncovered inside the fitment slice and the 100 % gate this specification invokes cannot pass |
| `tests/Unit/Fitment/VerdictRoundTripTest.php` | `FitmentVerdict::fromArray($v->toArray())` preserves `conditions[0]->affectsTyreChoice`, `front->sizes[0]->documentMinSpeedSymbol`, `front->sizes[0]->axle` and both `min*Source` values; a payload written before §3.4 (missing all of them) still deserialises to the documented defaults; the restored verdict reports `restored === true` |
| `tests/Unit/ArchitectureTest.php` *(extend)* | `'App\Domain\Fitment\Tyres'` is added to the "pure engine never touches Eloquent models or the database" expectation (:22-36), which today lists Data, Derivation, Verdict, Resolver, Conflict and Contracts. Without it nothing stops a later edit putting a query straight into `TyreEligibility` — the exact drift R-13 exists to prevent. The rule also bans `App\Enums`, so `TyreSeason` stays out of that namespace |

### 9.2 Pest — feature

| File | Covers |
|---|---|
| `tests/Feature/Fitment/TyreCatalogueTest.php` *(moved out of `tests/Unit`)* | `inSizes()` binds every value, returns `[]` for `[]`, respects `$inStockOnly`, excludes soft-deleted rows, orders cheapest-first. Feature, not unit: it queries `tyre_variants`. Placed under `tests/Feature/Fitment` so `composer verify:fitment` reaches it |
| `tests/Feature/Commerce/KomplettradPricerTest.php` *(moved out of `tests/Unit`)* | component sums in integer cents; `complete() === false` and `mountingCents === null` while unconfigured; a 0-cent colour surcharge is included as 0, never omitted. Feature: it takes Eloquent models and reads `config('rimify.komplettrad.…')` |
| `tests/Feature/Storefront/BasketTotalsTest.php` *(moved out of `tests/Unit`)* | `tpms` block in every state (applicable/not, available/not, ja/nein/null); subtotal includes sensors only on `ja`; VAT still extracted. Feature: it needs a `Request`, a session, `WheelConfig` rows and `FitmentResolver` |
| `tests/Feature/Storefront/KomplettradBasketTest.php` | add a permitted Komplettrad (200, one line, key `wheel:{c}:tyre:{t}`); add a tyre the verdict does not permit → refusal sentence, **nothing in the session**; add with no vehicle → `NoVehicle` sentence; a car with no Gutachten for this wheel → the `VerdictUnknown` sentence, **never** the `VerdictNotPermitted` one; the default colour is assigned; the same combination twice merges and keeps its colour; a Felge and a Komplettrad of the same rim are two lines; **tyre `stock_qty = 1`, POST quantity 4 → the `OutOfStock` sentence and `session('cart')` untouched** (the add-time quantity gate of §4.4) |
| `tests/Feature/Storefront/BasketWheelsOnlyTest.php` *(deliberate rewrite)* | a standalone `TYRE` kind is **still** a 422 with the same sentence (D6 holds); the `tyreVariantId.prohibited` case is replaced by the permitted/refused pair; the "older session with a tyre line" case is kept |
| `tests/Feature/Storefront/KomplettradReverifyTest.php` | clearing the vehicle marks the set and blocks checkout without dropping it; a tyre going out of stock marks it; deactivating the colour marks it; superseding the document marks it — in each case the basket still contains the line |
| `tests/Feature/Storefront/KasseRdksTest.php` | the question renders only with a Komplettrad; `PATCH /kasse/rdks` stores the answer and the **server** re-renders totals with `4 × 49,00 €`; posting `rdks` absent → the unanswered sentence; posting `ja` with no configured price → `TPMS_UNAVAILABLE_REFUSAL` and **zero rows** in `orders`/`order_lines`; a Felgen-only basket rejects an `rdks` value; **answer `ja`, then mutate `tpms_sensor_prices.price_cents`, then submit → the §8.3 `Ein Preis in deinem Warenkorb hat sich geändert.` sentence and zero rows in `orders`/`order_lines`** (§5.3); **answer `ja` for make A, swap the vehicle cookie to make B → the card re-renders unanswered at B's price and the order is refused with `TPMS_UNANSWERED_REFUSAL`** (§4.2/§4.8) |
| `tests/Feature/Storefront/KasseOrderRefusalTest.php` *(extend)* | the four new refusals, each asserting zero rows in `orders`, `order_lines`, `order_line_fitments`, `customers`, `addresses`; **plus: clear `wheel_models.is_demo` (as this file already does at :88) while leaving the tyre `is_demo = true` and assert `DEMO_REFUSAL` still stands with zero rows** — the demo-tyre half of §2.2 |
| `tests/Feature/Admin/WuchtgewichteTest.php` | guest → redirect to `/admin/anmelden`; `super-admin` and `catalogue-manager` may create/edit/delete; `content-editor` and `accountant` get **403 on every mutation and on the index**; `support-agent` may view and gets 403 on store; `1.425,00 €` parses to `142500`; `49.00` and `1.42,00` are refused with the German sentence; exactly one default survives a second `isDefault` save; a `permission.denied` row lands in `audit_logs`; **`Silber` derives the slug `silber`**; **deleting `Silber` and creating it again restores the trashed row instead of failing the unique rule** (§2.1/§6.3) |
| `tests/Feature/Admin/RdksPreiseTest.php` | the same authorisation matrix; `VW` and `Volkswagen` collide on `make_key` with the German unique message; a **soft-deleted** make does not collide and is restored instead; `0,00` is refused; a price change does **not** alter any existing `order_lines.unit_price_cents`; audit rows for create/update/delete |
| `tests/Feature/Storefront/BestellungKomplettradTest.php` | a seeded Komplettrad order renders five grouped lines with frozen labels and one snapshot on the `WHEEL` line; changing the live colour/price afterwards does not change the rendered order; **an order whose only demo row is its `TYRE` line still renders the Demodaten treatment** (`BestellungController::isDemo()`, §2.2) |
| `tests/Feature/Schema/Commerce/KomplettradOptionsTest.php` *(commit 3)* | both tables, every CHECK, the soft-delete + unique interaction, and that `KomplettradOptionsSeeder` leaves exactly two active colours with one default |
| `tests/Feature/Schema/Commerce/KomplettradColumnsTest.php` *(commit 4)* | the three new columns; **every `tyre_variants` row is `is_demo = true` after migrate + seed** (§2.2) |
| `tests/Feature/Schema/Fitment/TyreSizeAxleTest.php` *(commit 6)* | no `fitment_tyre_sizes` row carries a non-`ALL` axle while the resolver does not consume it (§3.3a) |
| `tests/Feature/Schema/Commerce/AppendOnlyTest.php` *(extend)* | writing a snapshot for a Komplettrad's `WHEEL` line, then failing to update it (SQLSTATE 45000) |
| `tests/Feature/Content/ContentSeederTest.php` *(extend)* | the new FAQ answer names Wuchtgewichte and RDKS and still names neither `Ventile` nor `Anbauset` |

### 9.3 Vitest

| File | Covers |
|---|---|
| `resources/js/Pages/Produkt/Index.test.ts` *(extend)* | the Komplettrad section renders offers, the minimum sentence, and the refusal sentence with a route forward instead of an empty panel |
| `resources/js/Pages/Warenkorb/Index.test.ts` *(extend)* | components print per line; the weight tiles are whole-tile radios with a visually hidden input; `wird noch festgelegt` for an open mounting price; `blockReasons` render with `Entfernen` |
| `resources/js/Pages/Kasse/Index.test.ts` *(extend)* | the RDKS card appears only when applicable; `Ja` is absent when no price exists; `Weiter` refuses without an answer; the summary prints the string the server sent and never multiplies cents; `Zahlungspflichtig bestellen` and the banned-word list still pass |
| `resources/js/Pages/Admin/Wuchtgewichte/Index.test.ts`, `…/Rdks/Index.test.ts` | table, inline form, empty state, delete confirmation |
| `resources/js/claims.test.ts` | unchanged and still green — the new copy names no carrier, no delivery time, no payment provider |

### 9.4 Playwright — `e2e/komplettrad.spec.ts`

1. Choose a vehicle → open a permitted wheel → the Komplettrad section lists tyres → add as a
   Komplettrad → the badge counts 4.
2. In the basket: the components are listed, the weight colour switches and the total changes by the
   surcharge, `Reifen entfernen` converts the line and the total drops.
3. At the checkout: the RDKS question appears, `Ja` shows `4 × 49,00 €`, the total rises by exactly
   that, `Nein` removes the row; the final button stays disabled with the preview refusal.
4. **Fail-closed journey:** with no `tpms_sensor_prices` row, the `Ja` tile does not exist and the
   fail-closed sentence is on screen.
5. **Fail-closed journey:** clear the vehicle with a Komplettrad in the basket — the line is still
   there, marked, and `Zur Kasse` is unavailable.

QA gates (overflow, console, axe, style inventory) run on `/warenkorb` and `/kasse` as they already
do.

---

## 10 · Build plan

Conventional commits, in dependency order. Every commit ships its own tests; nothing is "done"
before `composer verify:php` is green for the slice it touches.

| # | Commit | Files |
|---|---|---|
| 1 | `feat(support): parse German money input into integer cents` | `app/Support/Money.php`, `tests/Unit/Support/MoneyTest.php` |
| 2 | `feat(support): add a canonical make key for per-make pricing` | `app/Support/MakeName.php`, `tests/Unit/Support/MakeNameTest.php` |
| 3 | `feat(db): add balance weight colours and RDKS sensor prices` | migration A, `app/Models/BalanceWeightColour.php`, `app/Models/TpmsSensorPrice.php`, both factories, **`database/seeders/KomplettradOptionsSeeder.php`**, **`database/seeders/DatabaseSeeder.php`**, `tests/Feature/Schema/Commerce/KomplettradOptionsTest.php` |
| 4 | `feat(db): freeze Komplettrad options on order lines` | migration B (**including the `tyre_variants` backfill**), `app/Models/{Order,OrderLine,TyreVariant}.php`, `app/Enums/TyreSeason.php`, **`database/seeders/CatalogueSeeder.php`** (`'is_demo' => true` in `seedTyres()`), `tests/Feature/Schema/Commerce/KomplettradColumnsTest.php` |
| 5 | `feat(fitment): implement the tyre catalogue over tyre_variants` | `app/Domain/Fitment/Infrastructure/EloquentTyreCatalogue.php`, `app/Providers/FitmentServiceProvider.php`, `tests/Feature/Fitment/TyreCatalogueTest.php` |
| 6 | `feat(fitment): decide which tyres a verdict permits` | `app/Domain/Fitment/Tyres/{TyreEligibility,KomplettradOffer,KomplettradRefusal}.php`, `app/Domain/Fitment/Data/{TyreSize,FitmentRow}.php`, `app/Domain/Fitment/Verdict/{Condition,AxleRequirement,FitmentVerdict}.php`, `app/Domain/Fitment/Resolver/FitmentResolver.php`, `app/Domain/Fitment/Infrastructure/EloquentFitmentRepository.php`, provider, **`database/seeders/CommerceSeeder.php`** (delete `komplettradTyre()`), `tests/Unit/Fitment/{TyreEligibilityTest,KomplettradRefusalTest,VerdictRoundTripTest}.php`, `tests/Unit/ArchitectureTest.php`, `tests/Feature/Schema/Fitment/TyreSizeAxleTest.php`, **`tests/Feature/Storefront/BestellungDemoTest.php`** |
| 7 | `feat(admin): enforce role permissions server-side on every mutation` | `app/Services/Admin/PermissionMatrix.php`, `app/Models/AdminUser.php`, **`app/Http/Controllers/Controller.php`** (the `AuthorizesRequests` trait), `app/Providers/AuthServiceProvider.php`, `bootstrap/providers.php`, `tests/Feature/Admin/PermissionEnforcementTest.php`. **No policy files** — see the note below |
| 8 | `feat(admin): manage the Wuchtgewichte colours` | `routes/web.php`, `app/Http/Controllers/Admin/WuchtgewichteController.php`, `app/Http/Requests/Admin/BalanceWeightColourRequest.php`, **`app/Policies/BalanceWeightColourPolicy.php`**, `app/Providers/AuthServiceProvider.php` (register it), **`app/Http/Middleware/HandleInertiaRequests.php`** (the `admin.can` share of §6.5), `resources/js/Pages/Admin/Wuchtgewichte/Index.vue`, `resources/js/Layouts/AdminLayout.vue`, `resources/js/types/pages.ts`, tests |
| 9 | `feat(admin): manage the RDKS sensor price per car make` | `routes/web.php`, `RdksPreiseController`, `TpmsSensorPriceRequest`, **`app/Policies/TpmsSensorPricePolicy.php`**, `AuthServiceProvider` (register it), `resources/js/Pages/Admin/Rdks/Index.vue`, `AdminLayout.vue`, `types/pages.ts`, tests |
| 10 | `feat(commerce): price a Komplettrad from its components` | `config/rimify.php`, `app/Services/Commerce/{KomplettradPricer,KomplettradPrice}.php`, `tests/Feature/Commerce/KomplettradPricerTest.php` |
| 11 | `feat(storefront): offer Kompletträder on the product page` | `app/Http/Controllers/Storefront/FelgenController.php`, `resources/js/Pages/Produkt/Index.vue`, `resources/js/Components/Product/KomplettradOffer.vue`, `resources/js/types/pages.ts`, Vitest |
| 12 | `feat(storefront): take a Komplettrad into the basket` | `app/Http/Requests/Storefront/BasketLineRequest.php`, `app/Services/Storefront/Basket.php`, `app/Http/Controllers/Storefront/WarenkorbController.php`, `resources/js/types/rimify.ts`, `tests/Feature/Storefront/{KomplettradBasketTest,BasketWheelsOnlyTest,KomplettradReverifyTest}.php` |
| 13 | `feat(storefront): choose the Wuchtgewichte colour in the basket` | `routes/web.php`, `app/Http/Requests/Storefront/BasketWeightColourRequest.php`, `WarenkorbController`, `resources/js/Pages/Warenkorb/Index.vue`, `resources/js/composables/useBasket.ts`, Vitest |
| 14 | `feat(storefront): ask for RDKS sensors at the checkout` | `routes/web.php`, `app/Http/Requests/Storefront/{TpmsChoiceRequest,PlaceOrderRequest}.php`, `KasseController`, `Basket`, `resources/js/Pages/Kasse/Index.vue`, Pest + Vitest |
| 15 | `feat(commerce): write Komplettrad order lines with frozen prices` | `database/seeders/CommerceSeeder.php`, `app/Http/Controllers/Storefront/BestellungController.php` (**the demo-tyre half of `isDemo()`**), `resources/js/Pages/Bestellung/Index.vue`, `tests/Feature/Storefront/{BestellungKomplettradTest,BestellungDemoTest}.php` |
| 16 | `docs(content): name the Wuchtgewichte and the RDKS question in the FAQ` | `database/seeders/ContentSeeder.php`, `tests/Feature/Content/ContentSeederTest.php` |
| 17 | `test(e2e): walk the Komplettrad journey, including both fail-closed paths` | `e2e/komplettrad.spec.ts` |
| 18 | `docs: record the Komplettrad decisions` | `docs/decisions.md` (D-030 … D-039), `docs/client-questions.md` |

**Parallel work.** Four builders at most, each owning its files (the wave rule in
`ACCURACY.md §2`):

- **Lane A** (support + domain): 1, 2 → 5, 6. Touches `app/Support`, `app/Domain/Fitment`, the
  provider.
- **Lane B** (schema): 3, 4 → 10. Touches migrations, models, seeders, `config/rimify.php`.
- **Lane C** (admin): 7 → 8 → 9. Touches `app/Policies`, `app/Http/{Controllers,Requests}/Admin`,
  `resources/js/Pages/Admin`.
- **Lane D** (storefront): waits for A and B, then 11 → 12 → 13 → 14 → 15 → 16 → 17.

**Shared files — serialise or use `Edit`, never `Write`:** `routes/web.php` (8, 9, 13, 14),
`resources/js/Layouts/AdminLayout.vue` (8, 9), `resources/js/types/pages.ts` (8, 9, 11),
`app/Providers/FitmentServiceProvider.php` (5, 6), `app/Providers/AuthServiceProvider.php` (7, 8, 9),
`database/seeders/CommerceSeeder.php` (6, 15).

**Cross-lane ordering — the lanes are not fully independent:**

- **Commits 8 and 9 wait on Lane B's commit 3.** `BalanceWeightColourPolicy` and
  `TpmsSensorPricePolicy` reference models commit 3 creates, and Larastan level 6 (run by
  `composer verify:php`) fails on an unknown class. That is why commit 7 ships no policy at all: it
  is `PermissionMatrix`, `AdminUser::may()`, the `AuthorizesRequests` trait, `AuthServiceProvider`
  with `Gate::after`, and a `PermissionEnforcementTest` written against a Gate-only ability, so it
  can be green on its own. Commit 7 itself has no cross-lane dependency.
- **Lane A must merge before Lane D touches `CommerceSeeder`.** Commit 6 deletes
  `CommerceSeeder::komplettradTyre()` and rewrites `BestellungDemoTest`; commit 15 rewrites the
  same seeder for the five-line shape. Lane A is therefore **not** disjoint from Lane D's files,
  and the shared-file list above already says so.

Lanes A, B and C can otherwise run at the same time; lane D cannot start before 6 and 10 are merged.

---

## 11 · Decisions made on the client's behalf

Every row is a choice this specification makes because the client did not state one. **Confirm each
with the client before or during the build.** The default is the cautious one in every case.

| # | Question | Default chosen | Why | Cost of changing later |
|---|---|---|---|---|
| **D-030** | Is the RDKS price **per sensor** or **per set**? | **Per sensor.** `tpms_sensor_prices.price_cents` is one sensor; the checkout multiplies by the number of Komplettrad wheels and shows `4 × 49,00 €`. | The client's own phrasing was "the price of the tyre air pressure sensor for each brand"; a customer may order one replacement wheel, and a per-set price cannot express that. It is also how the price is displayed. | Low — a per-set price is the same column divided by four in the admin's head. |
| **D-031** | Do coloured Wuchtgewichte cost extra? | **No — `surcharge_cents` defaults to 0**, but the column exists and the tile prints `0,00 €`. | The client named colours, not a price. Modelling the column now means a later surcharge is a data change, not a migration. Printing `0,00 €` is honest because the admin configured it. | None — the admin edits a number. |
| **D-032** | What does mounting and balancing cost? | **Unknown → `config('rimify.komplettrad.mounting_per_wheel_cents')` is `null`.** The component reads `wird noch festgelegt`, stays out of the total, and the order is refused — exactly as unconfigured shipping behaves today. | The client has not given a figure and `CommerceSeeder` hard-codes `1.900` cents as demonstration data only. Guessing would put a wrong number on a bill. | None — one environment variable. **Blocking for launch: the client must name this figure.** |
| **D-033** | May a Komplettrad be bought without a chosen vehicle? | **No.** Without a vehicle there is no verdict, so there is no permitted-size list. Felgen alone stay buyable without a vehicle, as today. | A tyre sold against no document is the confident wrong answer this product exists to avoid. | Low, but it would mean selling a tyre with no legal basis — not recommended. |
| **D-034** | Are RDKS sensors offered on a **Felgen-only** order? | **No.** The question appears only when the basket holds at least one Komplettrad. | A sensor is fitted while the tyre is mounted; RIMIFY does not mount tyres on a rims-only order. Asking anyway would promise a service that is not performed. | Medium — it would need a sensor line without a Komplettrad and a service to attach it to. |
| **D-035** | Staggered sets (different front and rear sizes, "2+2")? | **Not in this version.** A staggered approval refuses the Komplettrad with a sentence and a personal contact route; the Felgen purchase is unaffected. **The guard is the per-size `fitment_tyre_sizes.axle` (§3.3 rule 3b), not `tyreLayout()`.** | One `tyre_variant_id` cannot describe a front/rear pair, and selling a "set" that is silently four identical tyres on a staggered car would be wrong. `tyreLayout()` alone is **not** enough: it compares the two axles' size sets, and the normal shape of a staggered line is one `fitments` row with `axle = ALL` carrying a `FRONT` and a `REAR` tyre size — on which `tyreLayout()` returns `SAME`. The column exists, is constrained and is in `uq_fitment_tyre_size`; it was simply never read (`EloquentFitmentRepository.php:153-162`), so §3.3a makes it reach the domain and rule 3b refuses on it. No seeded fitment is staggered today (`ApprovalSeeder.php:536` writes `Axle::All` throughout), which is precisely why this lands the first time real approval data is imported rather than in local testing. | High — it needs a second tyre per line, per-axle quantities and an axle-aware repository. Plan it as its own feature. |
| **D-036** | Which order line carries the frozen verdict? | **The `WHEEL` line**, with `package_group` marking the set. `OrderLineKind::PACKAGE` stays unused. | `order_line_fitments.wheel_config_id` is `NOT NULL` and `BestellungController::isDemo()` joins on `order_lines.wheel_config_id`; a `PACKAGE` carrier would break both. | Low, but it would rewrite an R-12 table's contract — avoid. |
| **D-037** | What is seeded? | **No RDKS price at all, in any environment. Two Wuchtgewichte colours — `Silber` (default) and `Schwarz`, surcharge `0` — in `local` and `testing` only**, via a guarded `KomplettradOptionsSeeder` that never runs in production. | Inventing a sensor price would be inventing a market price, which this project forbids; the empty table demonstrates the fail-closed path, which is the behaviour the client most needs to see. Colours are not a price claim, and without at least one the local Komplettrad flow cannot be walked. Production starts empty and the admin fills it. | None. |
| **D-038** | Who may edit these two screens? | **The existing `catalogue` module** — Super Admin and Katalog-Manager write; Compliance Editor, Bestell-Manager and Support Agent read; Content Editor and Buchhaltung have no access at all. | It needs **no** new `PermissionModule` case, so no CHECK-constraint migration and no `AccessSeeder` change — and `AccessSeeder` is deliberately never run by `rimify:release-seed`, so a new case would never reach a live database. | Medium — a dedicated `pricing` module would need a migration rebuilding `chk_role_permissions_module` plus a data step for existing databases. |
| **D-039** | Where is the colour chosen, and where is the RDKS question asked? | **Colour in the basket** (per Komplettrad line), **RDKS at the checkout** (per order). | The client asked for the question at the checkout explicitly. The colour tiles are on the basket page in `docs/spec/pages.md:742-753`; putting them per line rather than once per page is a deliberate deviation, because a basket may hold two sets. | Low. |
| **D-040** | The step-2 label changes from `Versand` to `Optionen & Versand`. | As stated, in **all five** places `Kasse/Index.vue` spells the step (§8.3). | A fourth step would break the walked-flow assumptions in the existing checkout tests for no benefit, and `Versand` alone would be a lie about what the step contains. Renaming only the stepper would leave one page calling the step two different things. | None. |
| **D-041** | Are `Ventile` a configurable option, as `docs/spec/pages.md:742-753` and the PDP's `Zubehör (inkl.)` rows at pages.md:556-559 show? | **No — not in this version.** Only the `Gewichte` tiles are built. Valves are modelled nowhere: no table, no line kind, no price. | This is a deliberate deviation from `pages.md`, named here as the preamble requires. On a car with RDKS **the sensor *is* the valve**, so a separate valve choice would either contradict the RDKS answer or charge twice for the same part. Until the client says what they charge for valves and whether they fit customer-supplied sensors, modelling a valve option would be inventing a product. Where no sensor is fitted, a standard valve is part of mounting and is covered by the mounting fee (D-032). | Low — a second `balance_weight_colours`-shaped table and a second tile group, reusing the whole pattern this feature builds. The FAQ copy in §8.5 already names neither `Ventile` nor `Anbauset`, so nothing has to be unsaid. |

### Open questions to put to the client

1. **What does mounting and balancing cost per wheel?** (D-032 — blocking for selling Kompletträder.)
2. **Which Wuchtgewichte colours do you offer, and do any of them cost extra?** (D-031/D-037.)
3. **What does an RDKS sensor cost for each make you expect to sell to?** The shop will refuse to
   price sensors for any make you have not entered — that is deliberate.
4. **Do you fit sensors the customer sends in?** (Not modelled; today it is "yes with a price" or
   "not at all".)
5. **Do you charge separately for Ventile?** The Figma shows a `Ventile` tile pair beside the
   `Gewichte` one; this version builds only the Gewichte tiles (D-041), because on a car with RDKS
   the sensor replaces the valve. If valves are a priced choice in their own right, say so and it
   becomes a second colour-style table.
6. **Winter tyres:** German practice allows a speed symbol below the car's top speed on M+S tyres
   with a speed-limit sticker in the car. The engine refuses such a tyre outright. Do you want to
   sell winter Kompletträder that way? It is a product decision the current minima do not model.
7. **Staggered sets** (different front/rear sizes) — the shop will point those customers at your
   e-mail address. Is that acceptable for now? (D-035.)
8. **Shipping cost and free-shipping threshold** — still unset, still blocking every order.

---

## 12 · Rejected review points

Two design reviews were run against this specification before the build started. Every finding was
checked against the code; all of them were accurate about what the code does, and all but one were
applied in full. The one partial rejection is recorded here so it is not re-raised, re-litigated
or silently "fixed" by a later builder.

### R-1 · *"Rule 8 should compare only against `$axle->min*` and drop the per-size document minima"*

**Rejected in part. Accepted in part.**

The finding is right that `FitmentResolver::axleRequirement()` (FitmentResolver.php:280-337, via
`stricterLoadIndex`/`stricterSpeedSymbol`) already merges R-06 once, and that a second merge in
§3.3 rule 8 can disagree with it. It is also right — and this half **is** applied — that
`TyreEligibility` must accept only a live resolver verdict and never one restored from
`order_line_fitments.verdict`; that is the `VerdictRestored` guard in §3.3, with its unit test.

What is rejected is deleting the per-size comparison. Two reasons:

1. **It can only tighten.** Every expression in rule 8 is a `max()` against the axle's governed
   value (`max($axle->minLoadIndex, $listed->documentMinLoadIndex ?? 0)`;
   `max($axleRank, $documentRank ?? 0)`). A disagreement with `axleRequirement()` can therefore
   only ever refuse a tyre the axle would have allowed — never the reverse. CLAUDE.md §2 asks that
   ties be broken towards the missed sale, and this tie is already broken that way.
2. **The axle's speed merge is lossy, and rule 8 covers the loss.** `axleRequirement()` accumulates
   the document speed symbol by plain assignment across a row's sizes
   (`$documentSpeedSymbol = $size->documentMinSpeedSymbol;`, FitmentResolver.php:308-310), so the
   *last* size's symbol wins rather than the strictest. Dropping the per-size comparison would make
   the offer **more permissive** than the document in exactly the case a multi-size Gutachten
   creates.

The finding's real defect — that `$listed->documentMinLoadIndex` and `documentMinSpeedSymbol` do
not survive `TyreSize::toArray()`/`fromArray()`, so a restored verdict answers permissively — is
fixed at its root in §3.4 rather than by removing the comparison: the snapshot now carries both
fields, and `permits()` refuses a restored verdict outright regardless.

The honest resolution is to make `axleRequirement()` take the stricter across sizes, at which point
rule 8 collapses into a no-op and can be deleted. That is a change to the shared engine with its own
blast radius and its own tests, it is **not** in this feature's scope, and §3.3 says so in place.

---

## 13 · The client answered — what §11 no longer decides (2026-09-23)

§11 chose cautious defaults **because the client had not answered**. They answered, in their own
group chat, and the answers below are decisions. Where a row here and a row in §11 disagree, this
section wins; the full wording is in `docs/client-questions.md` under "Kompletträder — answered".

Nothing here changes §1–§10's mechanics: the tyre still has to be permitted by the document, prices
are still frozen at order time, and a value nobody has set still stops the order rather than being
guessed. What changes is **who sets the values** and **which cases are in scope**.

| Was | Is now | What it touches |
|---|---|---|
| **D-030** RDKS priced only for makes the admin entered; an unknown make refused the sensor | A **default price per sensor** answers for every make, with per-make exceptions on top (their example: `1500` cents default, `5000` cents Porsche) | `tpms_sensor_prices` gains a default row or a setting beside it; §5.2's "no price for this make" branch becomes "no default set either", which stays fail-closed |
| **D-032** Montage und Wuchten from `config('rimify.komplettrad.mounting_per_wheel_cents')`, unset, blocking every set | **One fixed price, set in the admin** | moves from config to a stored setting with an admin field; the refusal stays, but a human can now clear it without a deploy |
| Shipping from `RIMIFY_SHIPPING_COST_CENTS` / `_FREE_FROM_CENTS` | **Shipping methods the admin creates**, each `{ name, price, description }` (Standard `1000`, Premium `3000` in their example), chosen in the checkout | new table + admin screen + the checkout's shipping step; `Basket::shippingFor()` reads the chosen method; the free-from threshold is only kept if the client asks for it |
| **D-035** staggered sets refused with a sentence and a contact route | **A staggered set must be orderable online.** Per-axle sizes through offer, basket and order, each axle checked against its own `fitment_tyre_sizes.axle` rows | its own step after the simple set: `KomplettradOffer` gains a rear half, the basket line carries two tyre variants, the order writes both, and §3.3 rule 3b stops being a refusal and becomes a branch |
| **D-034** sensors only on a set, **D-041** no valve product, **D-031/D-037** two colours, no surcharge | unchanged — the client confirmed each | — |
| **D-039** colour in the basket, RDKS at the checkout | unchanged — the client asked for the checkout question explicitly | — |

Two things they have **not** decided, and the build must keep asking rather than assuming:

1. **Winter tyres.** German practice allows a speed symbol below the car's top speed on M+S tyres
   when the speed sticker is in the car. `TyreEligibility` refuses such a tyre today (R-06 with no
   exception). Selling winter sets that way is a product decision with legal weight; it stays
   refused until they say otherwise in writing.
2. **What "Premium" shipping promises.** The description is the client's own free text, so the shop
   prints it and claims nothing of its own about delivery time.

**Order of work from here:** finish the simple set (§10 commits 11–18) → the admin-priced money
above → staggered. Splitting it that way keeps each step reviewable on its own, which is the pace
the client asked for.
