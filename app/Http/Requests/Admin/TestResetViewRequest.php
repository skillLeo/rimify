<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Services\Reset\TestEnvironment;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Opening Einstellungen › System › Testumgebung zurücksetzen: the Super-Admin alone (TestResetPolicy) — anyone else
 * gets a 404, never a 403 (EnsureResetPermitted).
 */
class TestResetViewRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('view', TestEnvironment::class);
    }

    protected function failedAuthorization(): void
    {
        abort(404);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [];
    }
}
