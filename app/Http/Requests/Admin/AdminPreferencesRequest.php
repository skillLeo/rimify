<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Policies\SavedViewPolicy;
use App\Services\Admin\Lists\AdminLists;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * One person's choices about how the panel looks to them — whether the rail is collapsed, and „Später
 * erinnern“ on the banner about an urgent system problem (for 8 hours; never for good).
 *
 * Every signed-in admin may set their own, and only their own: the controller writes to the
 * account the session belongs to, never to an id from the request, so there is nothing here to
 * point at somebody else's row. No module permission is involved because none is being exercised —
 * this changes nothing anyone else sees.
 */
class AdminPreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user('admin') instanceof AdminUser;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'rail' => ['required_without_all:snooze,width,columns', 'nullable', 'string', 'in:open,collapsed'],
            // The width the rail was dragged to: whole pixels inside the range the handle allows.
            'width' => ['required_without_all:rail,snooze,columns', 'nullable', 'integer', 'between:'.AdminUser::RAIL_WIDTH_MIN.','.AdminUser::RAIL_WIDTH_MAX],
            // Which urgent problem to be reminded of later: only the two a banner is ever shown for.
            'snooze' => ['required_without_all:rail,width,columns', 'nullable', 'string', 'in:maintenance,queue'],
            // The save's revision (AdminUser::rememberRail, ::rememberColumns): an older one than the stored is dropped.
            'rev' => ['nullable', 'integer', 'min:1'],
            // The Spaltenwahl of one list (AdminLists): the columns this person wants to see there.
            'list' => ['required_with:columns', 'nullable', 'string', Rule::in(AdminLists::keys())],
            'columns' => ['required_without_all:rail,width,snooze', 'nullable', 'array', 'max:30'],
            'columns.*' => ['string', 'max:32'],
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $list = $this->input('list');
                $columns = $this->input('columns');
                $spec = is_string($list) ? AdminLists::get($list) : null;

                if ($spec === null || ! is_array($columns) || $validator->errors()->isNotEmpty()) {
                    return;
                }

                // Only that list's own columns, and never one a person may not open the list for.
                if (array_diff($columns, array_column($spec['columns'], 'key')) !== [] || ! SavedViewPolicy::mayOpen($this->admin(), $list)) {
                    $validator->errors()->add('columns', 'Diese Spalten gibt es in der Liste nicht.');
                }
            },
        ];
    }

    /** @return array{list: string, columns: list<string>}|null */
    public function columns(): ?array
    {
        $list = $this->input('list');
        $columns = $this->input('columns');

        return is_string($list) && is_array($columns) ? ['list' => $list, 'columns' => AdminLists::columns($list, $columns)] : null;
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }

    public function rail(): ?string
    {
        return $this->filled('rail') ? (string) $this->validated('rail') : null;
    }

    public function width(): ?int
    {
        return $this->filled('width') ? (int) $this->validated('width') : null;
    }

    public function rev(): ?int
    {
        return $this->filled('rev') ? (int) $this->validated('rev') : null;
    }

    public function snooze(): ?string
    {
        return $this->filled('snooze') ? (string) $this->validated('snooze') : null;
    }
}
