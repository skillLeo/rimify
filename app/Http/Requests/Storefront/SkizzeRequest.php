<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Where a shop sketch of the Gutachten rework opens (the operator's brief of 01.11.2026, Phase 1): the version chosen and
 * the step of the Komplettrad — read from the address, so a click path can be sent as a
 * link and the server renders the same state the browser shows. A value that does not read opens the sketch at its start.
 */
final class SkizzeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Nothing is refused: a value that does not read — too long, a list, a step that does not exist — opens the sketch at
     * its start (the accessors below), never a redirect away from it.
     *
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [];
    }

    public function version(): ?string
    {
        $version = $this->query('ausfuehrung');

        return is_string($version) && preg_match('/^[a-z0-9-]{1,40}$/', $version) === 1 ? $version : null;
    }

    /** The Komplettrad step from 1 to 4, or null. */
    public function step(): ?int
    {
        $step = $this->query('schritt');

        return is_string($step) && preg_match('/^[1-4]$/', $step) === 1 ? (int) $step : null;
    }
}
