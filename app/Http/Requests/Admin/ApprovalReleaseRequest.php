<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use Illuminate\Foundation\Http\FormRequest;

/**
 * „Freigeben“ (`approvals` × publish, R-11). Since D-485 (the client's round of 18.11.2026, item 2) the release asks
 * nothing: whether every vehicle is entered is an optional switch on the paper's page, off until someone turns it on, and
 * the Eintragung or Abnahme a combination needs comes from its codes alone. Every other protection stays in
 * DocumentRelease::check() — an undescribed code still blocks the release.
 *
 * Route: POST /admin/gutachten/{document}/freigeben.
 */
class ApprovalReleaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $document = $this->route('document');

        return $user instanceof AdminUser && $document instanceof ApprovalDocument && $user->can('publish', $document);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [];
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
