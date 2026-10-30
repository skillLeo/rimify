<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\Page;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Publishing a Ratgeber article from the list (his admin item 12, D-351): the state it holds — its saved draft, or the
 * words it had — through the same publish check as the editor's, against the version the list showed.
 */
class GuideListPublishRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $page = $this->route('page');

        return $user instanceof AdminUser && $page instanceof Page && $page->kind === Page::KIND_GUIDE && $user->can('publish', $page);
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
