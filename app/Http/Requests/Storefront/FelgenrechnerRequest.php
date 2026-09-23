<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use Illuminate\Foundation\Http\FormRequest;

/**
 * GET /felgenrechner. The one parameter, `rechner`, is a comparison written as
 * `W x D - ET - TW - A _ W x D - ET - TW - A` (`7.5x17-45-225-45_8.5x19-35-225-35`).
 *
 * It has no validation rules on purpose: a link that does not parse, or names a figure the form
 * does not offer, shows the defaults — never an error page and never a redirect
 * (docs/design/sections/home-overhaul.md §3.3). `state()` is the only way in, and it applies the
 * same ranges as `resources/js/lib/rechner.ts`, so the server never ships a comparison the form
 * could not have produced itself.
 */
class FelgenrechnerRequest extends FormRequest
{
    public const PATTERN = '/^(\d+(?:\.\d)?)x(\d{2})-(-?\d{1,2})-(\d{3})-(\d{2})_(\d+(?:\.\d)?)x(\d{2})-(-?\d{1,2})-(\d{3})-(\d{2})$/';

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
     * @return array{current: array{widthIn: float, diameterIn: float, etMm: int, tyreWidthMm: int, aspect: int}, next: array{widthIn: float, diameterIn: float, etMm: int, tyreWidthMm: int, aspect: int}}|null
     */
    public function state(): ?array
    {
        $raw = $this->query('rechner');

        if (! is_string($raw) || preg_match(self::PATTERN, $raw, $m) !== 1) {
            return null;
        }

        $current = self::setup((float) $m[1], (int) $m[2], (int) $m[3], (int) $m[4], (int) $m[5]);
        $next = self::setup((float) $m[6], (int) $m[7], (int) $m[8], (int) $m[9], (int) $m[10]);

        if ($current === null || $next === null) {
            return null;
        }

        return ['current' => $current, 'next' => $next];
    }

    /**
     * Only a figure the form offers: widths 5,5 … 12 in halves, diameters 13 … 24, ET −30 … 70,
     * tyre widths 135 … 355 in tens, aspect ratios 25 … 85 in fives.
     *
     * @return array{widthIn: float, diameterIn: float, etMm: int, tyreWidthMm: int, aspect: int}|null
     */
    private static function setup(float $widthIn, int $diameterIn, int $etMm, int $tyreWidthMm, int $aspect): ?array
    {
        $offered = $widthIn >= 5.5 && $widthIn <= 12.0 && fmod($widthIn * 2, 1.0) === 0.0
            && $diameterIn >= 13 && $diameterIn <= 24
            && $etMm >= -30 && $etMm <= 70
            && $tyreWidthMm >= 135 && $tyreWidthMm <= 355 && ($tyreWidthMm - 135) % 10 === 0
            && $aspect >= 25 && $aspect <= 85 && $aspect % 5 === 0;

        if (! $offered) {
            return null;
        }

        return [
            'widthIn' => $widthIn,
            'diameterIn' => (float) $diameterIn,
            'etMm' => $etMm,
            'tyreWidthMm' => $tyreWidthMm,
            'aspect' => $aspect,
        ];
    }
}
