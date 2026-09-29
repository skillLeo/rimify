<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\SavedView;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Deleting a view, and taking the deletion back („Rückgängig“): its owner's alone (SavedViewPolicy).
 * Nothing is sent but the view in the address.
 */
class SavedViewDestroyRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $view = $this->route('view');

        if (! $user instanceof AdminUser || ! $view instanceof SavedView) {
            return false;
        }

        return $user->can($this->isMethod('DELETE') ? 'delete' : 'restore', $view);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [];
    }

    public function view(): SavedView
    {
        $view = $this->route('view');
        abort_unless($view instanceof SavedView, 404);

        return $view;
    }
}
