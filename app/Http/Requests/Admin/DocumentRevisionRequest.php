<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use Illuminate\Foundation\Http\FormRequest;

/**
 * „Neue Fassung anlegen“ (ADMIN-GEFUNDEN 510): a draft revision of a released Gutachten, holding all it holds
 * (ApprovalDocumentPolicy::revise, R-11). Nothing to type — the revision starts as a copy and is corrected there.
 *
 * Route: POST /admin/gutachten/{document}/neue-fassung.
 */
class DocumentRevisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $document = $this->route('document');

        return $user instanceof AdminUser && $document instanceof ApprovalDocument && $user->can('revise', $document);
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
