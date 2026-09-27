<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\SavedView;
use App\Services\Admin\Lists\AdminLists;
use App\Services\Admin\Lists\ListViews;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * „Als Ansicht speichern“: the filters and sort on screen under a name, for the person alone or
 * shared with a role that may open the list (SavedViewPolicy, R-11).
 *
 * The query is the page's own canonical query (the list's Form Request wrote it); here it is only
 * checked to hold nothing but that list's keys and short plain values, so a stored view can never
 * carry anything the list's URL could not.
 */
class SavedViewStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $list = $this->input('list');

        return $user instanceof AdminUser && is_string($list) && $user->can('create', [SavedView::class, $list]);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'list' => ['required', 'string', Rule::in(AdminLists::keys())],
            'name' => ['required', 'string', 'max:60'],
            'query' => ['present', 'array', 'max:20'],
            'query.*' => ['nullable', 'string', 'max:120'],
            'role_id' => ['nullable', 'integer'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'list.*' => 'In dieser Liste lassen sich keine Ansichten speichern. Lad die Seite bitte neu.',
            'name.required' => 'Gib der Ansicht bitte einen Namen.',
            'name.max' => 'Der Name ist zu lang. Kürz ihn bitte auf höchstens 60 Zeichen.',
            'query.*' => 'Diese Filter lassen sich nicht speichern. Lad die Seite bitte neu.',
            'role_id.*' => 'Diese Rolle gibt es nicht. Wähl bitte eine aus der Liste.',
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                SavedViewRules::check($validator, $this->admin(), $this->list(), $this->name(), $this->viewQuery(), $this->roleId(), null);
            },
        ];
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');
        abort_unless($user instanceof AdminUser, 403);

        return $user;
    }

    public function list(): string
    {
        return (string) $this->validated('list');
    }

    public function name(): string
    {
        return trim((string) $this->input('name'));
    }

    /** @return array<string, string> */
    public function viewQuery(): array
    {
        $query = $this->input('query');

        return ListViews::normalise(is_array($query) ? $query : []);
    }

    public function roleId(): ?int
    {
        return $this->filled('role_id') ? (int) $this->input('role_id') : null;
    }
}
