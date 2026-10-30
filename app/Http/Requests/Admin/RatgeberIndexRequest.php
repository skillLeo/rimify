<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\Page;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Inhalte › Ratgeber's list (his admin item 12, D-351): a search over title and address, and a column to sort by in the
 * address — `sort` and `richtung`, as every sorted list in the panel (F-32). A value the list does not know is dropped,
 * never an error page: the list opens as it would without it.
 */
class RatgeberIndexRequest extends FormRequest
{
    /** The columns the list sorts by, each with the way it first sorts: the article last changed on top. */
    public const SORTS = ['geaendert' => 'ab', 'titel' => 'auf', 'veroeffentlicht' => 'ab'];

    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('viewAny', Page::class);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:90'],
            'sort' => ['nullable', 'string'],
            'richtung' => ['nullable', 'string'],
        ];
    }

    /** An address with an overlong search is the list without one, not a 422 on a GET. */
    protected function failedValidation(Validator $validator): void
    {
        $this->replace([]);
    }

    public function search(): string
    {
        $q = $this->query('q');

        return is_string($q) ? mb_substr(trim($q), 0, 90) : '';
    }

    /** @return 'geaendert'|'titel'|'veroeffentlicht' */
    public function sort(): string
    {
        $sort = $this->query('sort');

        return match ($sort) {
            'titel' => 'titel',
            'veroeffentlicht' => 'veroeffentlicht',
            default => 'geaendert',
        };
    }

    /** @return 'auf'|'ab' */
    public function direction(): string
    {
        $direction = $this->query('richtung');

        return $direction === 'auf' || $direction === 'ab' ? $direction : self::SORTS[$this->sort()];
    }
}
