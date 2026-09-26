<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use Illuminate\Foundation\Http\FormRequest;

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

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'rail' => ['required_without_all:snooze,width', 'nullable', 'string', 'in:open,collapsed'],
            // The width the rail was dragged to: whole pixels inside the range the handle allows.
            'width' => ['required_without_all:rail,snooze', 'nullable', 'integer', 'between:'.AdminUser::RAIL_WIDTH_MIN.','.AdminUser::RAIL_WIDTH_MAX],
            // Which urgent problem to be reminded of later: only the two a banner is ever shown for.
            'snooze' => ['required_without_all:rail,width', 'nullable', 'string', 'in:maintenance,queue'],
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

    public function rail(): ?string
    {
        return $this->filled('rail') ? (string) $this->validated('rail') : null;
    }

    public function width(): ?int
    {
        return $this->filled('width') ? (int) $this->validated('width') : null;
    }

    public function snooze(): ?string
    {
        return $this->filled('snooze') ? (string) $this->validated('snooze') : null;
    }
}
