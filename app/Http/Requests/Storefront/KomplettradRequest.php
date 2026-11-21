<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Where the Komplettrad's steps open (the Gutachten rework §9): the version of the rim, and the step — read from the address, so the
 * server renders the state the browser shows. Open to anyone. Nothing is refused: a step that does not read opens the first one that
 * can be shown, a size that does not exist leads back to the rims (the controller).
 */
class KomplettradRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [];
    }

    public function size(): int
    {
        $size = $this->query('groesse');

        return is_string($size) && ctype_digit($size) ? (int) $size : 0;
    }

    /** The rear axle's version of a set of two (the client's fourth change); `groesse` is then the front's. 0 for none. */
    public function rearSize(): int
    {
        $size = $this->query('hinten');

        return is_string($size) && ctype_digit($size) ? (int) $size : 0;
    }

    /** The three steps since D-489, by name in the address: `?schritt=extras`. */
    public const STEPS = ['reifen' => 1, 'extras' => 2, 'warenkorb' => 3];

    /**
     * The step from 1 (Reifen) to 3 (Warenkorb), or null. Named since D-489 removed the first step, „Felge“ (the client's round
     * of 18.11.2026, item 5): a number from before keeps the step it named — 1 Felge and 2 Reifen open the tyres, 3 the Extras,
     * 4 the Warenkorb — so an old link or bookmark never lands one step further than it said.
     */
    public function step(): ?int
    {
        $step = $this->query('schritt');

        if (! is_string($step)) {
            return null;
        }

        return self::STEPS[$step] ?? match ($step) {
            '1', '2' => 1,
            '3' => 2,
            '4' => 3,
            default => null,
        };
    }
}
