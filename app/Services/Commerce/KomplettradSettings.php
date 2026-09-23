<?php

declare(strict_types=1);

namespace App\Services\Commerce;

use App\Models\Setting;

/**
 * The two Komplettrad prices the client sets themselves rather than by a deploy
 * (docs/specs/komplettrad.md §13): *Montage und Auswuchten je Rad*, and the default RDKS sensor
 * price that answers for every car make without a row of its own.
 *
 * Both are integer cents in the `settings` table, and both may be **deliberately unset**. That is
 * the whole reason this class exists instead of a bare `Setting::get()`:
 *
 *   - **no row at all** — nobody has ever touched the field, so the deployment default in
 *     `config/rimify.php` answers. This is what a fresh install and the test suite see.
 *   - **a row holding `{"cents": null}`** — an admin cleared the field on purpose. That is an
 *     answer, and it wins over the config: clearing the price in the admin must actually clear it,
 *     not fall back to whatever an environment variable once said. The figure is wrapped in an
 *     object because `settings.value` is `NOT NULL` — and because a row that reads `{"cents": null}`
 *     says what it means to whoever opens the table next.
 *   - **a row holding `{"cents": 1990}`** — the admin's figure, which wins over everything.
 *
 * Unset is never 0. A missing mounting fee stops every Komplettrad order and a missing sensor
 * price stops every `ja`, both with a sentence that says so — because charging a figure nobody
 * confirmed is exactly the confidently wrong answer CLAUDE.md §2 forbids.
 *
 * Nothing here is memoised, on purpose. An instance of this class can outlive the request that
 * built it — the router keeps the controller it injected into, and Octane keeps the container —
 * so a remembered figure would go on being served after an admin had already changed it. A price
 * is read from the table every time it is asked for; it is a primary-key lookup on a table with a
 * handful of rows, and a stale price on a customer's bill is not worth saving it.
 */
class KomplettradSettings
{
    public const MOUNTING_KEY = 'komplettrad.mounting_per_wheel_cents';

    public const TPMS_DEFAULT_KEY = 'komplettrad.tpms_default_price_cents';

    /** *Montage und Auswuchten* per wheel, or null while nobody has named it (D-032). */
    public function mountingPerWheelCents(): ?int
    {
        return $this->cents(self::MOUNTING_KEY, config('rimify.komplettrad.mounting_per_wheel_cents'));
    }

    public function setMountingPerWheelCents(?int $cents): void
    {
        $this->store(self::MOUNTING_KEY, $cents);
    }

    /**
     * What one RDKS sensor costs for a make with no row of its own (D-030), or null while there is
     * no default — in which case the checkout offers sensors only for the makes that do have one.
     */
    public function tpmsDefaultCents(): ?int
    {
        return $this->cents(self::TPMS_DEFAULT_KEY, config('rimify.komplettrad.tpms_default_price_cents'));
    }

    public function setTpmsDefaultCents(?int $cents): void
    {
        $this->store(self::TPMS_DEFAULT_KEY, $cents);
    }

    /**
     * The stored figure, the configured one where no row was ever written, and null for anything
     * else. A stored value that is not a non-negative integer — hand-edited, or left over from an
     * older shape — reads as unset rather than as a price.
     */
    private function cents(string $key, mixed $fallback): ?int
    {
        $row = Setting::query()->find($key);
        $value = $row === null ? $fallback : $this->unwrap($row->value);

        return is_int($value) && $value >= 0 ? $value : null;
    }

    /** `{"cents": 1990}` as written below, and a bare integer from any row written before it. */
    private function unwrap(mixed $value): mixed
    {
        return is_array($value) ? ($value['cents'] ?? null) : $value;
    }

    private function store(string $key, ?int $cents): void
    {
        Setting::set($key, ['cents' => $cents]);
    }
}
