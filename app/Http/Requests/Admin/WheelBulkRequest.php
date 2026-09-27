<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\WheelModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * A step for several Felgen at once, from the list's selection. The right is asked for the step as a
 * whole here; each model is still asked on its own by the controller, so a demo model in the
 * selection is left out and named, never published (WheelModelPolicy).
 */
class WheelBulkRequest extends FormRequest
{
    public const ACTIONS = ['publish', 'unpublish', 'archive'];

    public function authorize(): bool
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            return false;
        }

        return match ($this->input('action')) {
            'archive' => $user->can('archive', WheelModel::class),
            default => $user->can('publish', WheelModel::class),
        };
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'action' => ['required', Rule::in(self::ACTIONS)],
            'ids' => ['required', 'array', 'min:1', 'max:200'],
            'ids.*' => ['integer', 'distinct', Rule::exists('wheel_models', 'id')->whereNull('deleted_at')],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'action.*' => 'Diesen Schritt gibt es nicht.',
            'ids.required' => 'Wähl bitte mindestens eine Felge aus.',
            'ids.min' => 'Wähl bitte mindestens eine Felge aus.',
            'ids.max' => 'Höchstens 200 Felgen auf einmal.',
            'ids.*' => 'Eine der gewählten Felgen gibt es nicht mehr. Lad die Liste bitte neu.',
        ];
    }

    public function action(): string
    {
        return (string) $this->validated('action');
    }

    /** @return list<int> */
    public function ids(): array
    {
        return array_values(array_map('intval', (array) $this->validated('ids')));
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
