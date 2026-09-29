<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\SavedView;
use App\Services\Admin\Lists\AdminLists;
use App\Services\Admin\Lists\ListViews;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * A view changed by its owner — renamed, shared or no longer shared, or saved over with the filters
 * now on screen („Änderungen speichern“). Whatever is sent is changed; the rest stays.
 */
class SavedViewUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $view = $this->route('view');

        return $user instanceof AdminUser && $view instanceof SavedView && $user->can('update', $view);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:60'],
            'query' => ['sometimes', 'present', 'array', 'max:20'],
            'query.*' => ['nullable', 'string', 'max:120'],
            'role_id' => ['sometimes', 'nullable', 'integer'],
            'stores_columns' => ['sometimes', 'boolean'],
            'columns' => ['sometimes', 'nullable', 'array', 'max:30'],
            'columns.*' => ['string', 'max:32'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
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
                $view = $this->view();

                // Deleted meanwhile (another tab): nothing to check — the controller says so.
                if ($validator->errors()->isNotEmpty() || $view->trashed()) {
                    return;
                }

                SavedViewRules::check(
                    $validator,
                    $this->admin(),
                    $view->list,
                    $this->has('name') ? $this->name() : null,
                    $this->has('query') ? $this->viewQuery() : null,
                    $this->has('role_id') ? $this->roleId() : null,
                    $view,
                );

                // Columns sent keep them (and a view that already keeps some takes the new set).
                if ($this->has('stores_columns') || $this->has('columns')) {
                    SavedViewRules::checkColumns($validator, $view->list, $this->storesColumns(), $this->rawColumns());
                }
            },
        ];
    }

    public function view(): SavedView
    {
        $view = $this->route('view');
        abort_unless($view instanceof SavedView, 404);

        return $view;
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');
        abort_unless($user instanceof AdminUser, 403);

        return $user;
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

    /** Whether the view keeps columns after this change: as sent, else as it was. */
    public function storesColumns(): bool
    {
        return $this->has('stores_columns') ? $this->boolean('stores_columns') : $this->view()->stores_columns;
    }

    /** @return array<array-key, mixed>|null */
    public function rawColumns(): ?array
    {
        $columns = $this->input('columns');

        return is_array($columns) ? $columns : null;
    }

    /**
     * The columns the view keeps after this change, in the list's order; null when none.
     *
     * @return list<string>|null
     */
    public function viewColumns(): ?array
    {
        if (! $this->storesColumns()) {
            return null;
        }

        return AdminLists::columns($this->view()->list, $this->rawColumns() ?? $this->view()->columns);
    }
}
