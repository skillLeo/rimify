<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Where a sketch of the Gutachten rework opens (the operator's brief of 01.11.2026, Phase 1): the step and the car group
 * of the Gutachten sketch, the tyre model of the tyre sketch — read from the address, so a click path can be sent as a
 * link. Nothing else is taken. A value that does not read opens the sketch at its start rather than refusing it: the
 * page holds only example data. Who may open it is the route's (EnsureAdminMay).
 */
final class SkizzeRequest extends FormRequest
{
    /** The car groups of the Gutachten sketch's example, and the one created in the flow. */
    public const ROWS = ['m3', 'x3', 'z3', 'e46'];

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

    /** The step from 1 to 5, or null. */
    public function step(): ?int
    {
        $step = $this->query('schritt');

        return is_string($step) && preg_match('/^[1-5]$/', $step) === 1 ? (int) $step : null;
    }

    public function row(): ?string
    {
        $row = $this->query('zeile');

        return is_string($row) && in_array($row, self::ROWS, true) ? $row : null;
    }

    /** A tyre model of the tyre sketch, by its slug; whether it exists is the page's to say. */
    public function model(): ?string
    {
        $model = $this->query('modell');

        return is_string($model) && preg_match('/^[a-z0-9-]{1,40}$/', $model) === 1 ? $model : null;
    }
}
