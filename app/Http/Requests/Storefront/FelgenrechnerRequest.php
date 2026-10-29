<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use Illuminate\Foundation\Http\FormRequest;

/**
 * GET /felgenrechner. The one parameter, `rechner`, is a comparison written as `W x ET x DS _ W x ET x DS`
 * (`8.5x40x0_9.5x45x10`): rim width in inches, ET and spacer in millimetres, the current rim first — the calculator as
 * rebuilt after the client's example (his #11; the operator's brief of 29.10.2026, Batch 2).
 *
 * It has no validation rules on purpose: a link that does not parse, or names a figure the form does not offer — a link
 * from before the rebuild among them — shows the defaults: never an error page and never a redirect
 * (docs/design/sections/home-overhaul.md §3.3). `state()` is the only way in, and it applies the same ranges as
 * `resources/js/lib/etRechner.ts`, so the server never ships a comparison the form could not have produced itself.
 */
class FelgenrechnerRequest extends FormRequest
{
    public const PATTERN = '/^(\d{1,2}(?:\.\d)?)x(-?\d{1,2})x(\d{1,2})_(\d{1,2}(?:\.\d)?)x(-?\d{1,2})x(\d{1,2})$/';

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [];
    }

    /**
     * @return array{current: array{widthIn: float, etMm: int, spacerMm: int}, next: array{widthIn: float, etMm: int, spacerMm: int}}|null
     */
    public function state(): ?array
    {
        $raw = $this->query('rechner');

        if (! is_string($raw) || preg_match(self::PATTERN, $raw, $m) !== 1) {
            return null;
        }

        $current = self::setup((float) $m[1], (int) $m[2], (int) $m[3]);
        $next = self::setup((float) $m[4], (int) $m[5], (int) $m[6]);

        if ($current === null || $next === null) {
            return null;
        }

        return ['current' => $current, 'next' => $next];
    }

    /**
     * Only a figure the form offers: widths 4 … 13 in halves, ET −50 … 80, spacers 0 … 50 — whole millimetres.
     *
     * @return array{widthIn: float, etMm: int, spacerMm: int}|null
     */
    private static function setup(float $widthIn, int $etMm, int $spacerMm): ?array
    {
        $offered = $widthIn >= 4.0 && $widthIn <= 13.0 && fmod($widthIn * 2, 1.0) === 0.0
            && $etMm >= -50 && $etMm <= 80
            && $spacerMm >= 0 && $spacerMm <= 50;

        return $offered ? ['widthIn' => $widthIn, 'etMm' => $etMm, 'spacerMm' => $spacerMm] : null;
    }
}
