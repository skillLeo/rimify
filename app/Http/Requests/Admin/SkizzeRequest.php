<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Where the tyre sketch opens (the operator's brief of 01.11.2026, Phase 1): its tyre model, read from the address, so a click
 * path can be sent as a link. Nothing else is taken. A value that does not read opens the sketch at its start rather than refusing it: the
 * page holds only example data. Who may open it is the route's (EnsureAdminMay).
 */
final class SkizzeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Nothing is refused: a value that does not read — too long, a list — opens the sketch at its start (the accessor below),
     * never a redirect away from it.
     *
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [];
    }

    /** A tyre model of the tyre sketch, by its slug; whether it exists is the page's to say. */
    public function model(): ?string
    {
        $model = $this->query('modell');

        return is_string($model) && preg_match('/^[a-z0-9-]{1,40}$/', $model) === 1 ? $model : null;
    }
}
