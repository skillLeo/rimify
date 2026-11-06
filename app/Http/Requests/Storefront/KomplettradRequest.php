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

    /** The step from 1 to 4, or null. */
    public function step(): ?int
    {
        $step = $this->query('schritt');

        return is_string($step) && preg_match('/^[1-4]$/', $step) === 1 ? (int) $step : null;
    }
}
