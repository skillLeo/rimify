<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Services\Reset\TestEnvironment;
use Illuminate\Foundation\Http\FormRequest;

/** „Letztes Zurücksetzen rückgängig machen“: the Super-Admin alone (TestResetPolicy). It takes no input. */
class TestResetUndoRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('reset', TestEnvironment::class);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [];
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');
        abort_unless($user instanceof AdminUser, 403);

        return $user;
    }
}
