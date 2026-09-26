<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Showing or hiding one FAQ entry or menu entry — the visibility and nothing else. The quick
 * toggle used to post the whole row as the list last showed it, which could write a colleague's
 * newer words back to what they were; this request carries no words at all.
 *
 * Visibility is what visitors see, so it takes the right to edit and the right to publish (the
 * model's Policy: `update`, then `publish` or the policy's own publish rule).
 */
class VisibilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $record = $this->record();

        return $user instanceof AdminUser && $record !== null && $user->can('update', $record) && $user->can('publish', $record::class);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return ['visible' => ['required', 'boolean']];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'visible.required' => 'Bitte sag uns, ob der Eintrag zu sehen sein soll.',
            'visible.boolean' => 'Bitte sag uns, ob der Eintrag zu sehen sein soll.',
        ];
    }

    public function visible(): bool
    {
        return (bool) $this->validated('visible');
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }

    private function record(): ?Model
    {
        $record = $this->route('entry') ?? $this->route('item');

        return $record instanceof Model ? $record : null;
    }
}
