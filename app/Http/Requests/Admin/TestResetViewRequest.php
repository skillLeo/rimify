<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Services\Reset\TestReset;
use Illuminate\Foundation\Http\FormRequest;

/** Opening Einstellungen › System › Testumgebung zurücksetzen: the Super-Admin alone (TestResetPolicy). */
class TestResetViewRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('view', TestReset::class);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [];
    }
}
