<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Services\Demo\DemoTables;
use Illuminate\Foundation\Http\FormRequest;

/**
 * „Demodaten entfernen“ from the rail's strip: only for who may (DemoDataPolicy, R-11). It takes no
 * input — what goes is exactly the rows born demo, counted again on the server (DemoPurge).
 */
class DemoPurgeRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('purge', DemoTables::class);
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
