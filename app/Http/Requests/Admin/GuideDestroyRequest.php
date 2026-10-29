<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\Page;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Deleting a Ratgeber article (his admin item 12, D-351), against the version the list or the editor showed: one changed
 * meanwhile is refused, as every other write on a page is (PageChangedMeanwhile).
 */
class GuideDestroyRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $page = $this->route('page');

        return $user instanceof AdminUser && $page instanceof Page && $user->can('delete', $page);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return ['baseVersion' => ['required', 'integer', 'min:0']];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['baseVersion' => 'Die Seite ist nicht vollständig angekommen. Bitte lade sie neu und versuch es noch einmal.'];
    }

    public function baseVersion(): int
    {
        return (int) $this->validated('baseVersion');
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }
}
