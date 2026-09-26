<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use Illuminate\Foundation\Http\FormRequest;

/**
 * One person's choices about how the panel looks to them — today, whether the rail is collapsed.
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

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'rail' => ['required', 'string', 'in:open,collapsed'],
        ];
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }

    public function rail(): string
    {
        return (string) $this->validated('rail');
    }
}
