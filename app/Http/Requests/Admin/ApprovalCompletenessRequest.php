<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\DocumentStatus;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * „Sind alle Anlagen und alle Fahrzeuge erfasst?“ answered for a document already released (D-227) — the same right as
 * the release (`approvals` × publish, R-11), on a released document only: a draft is answered when it is released.
 *
 * Route: POST /admin/gutachten/{document}/vollstaendigkeit.
 */
class ApprovalCompletenessRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $document = $this->route('document');

        return $user instanceof AdminUser && $document instanceof ApprovalDocument
            && $document->status === DocumentStatus::Published
            && $user->can('publish', $document);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'completeness' => ['required', Rule::in(ApprovalDocument::COMPLETENESS)],
            'missing' => ['nullable', 'string', 'max:255', 'required_if:completeness,'.ApprovalDocument::PARTIAL],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'completeness.*' => 'Sag, ob alle Anlagen und alle Fahrzeuge dieses Gutachtens erfasst sind.',
            'missing.required_if' => 'Nenn die Anlagen oder Bereiche, die noch fehlen.',
            'missing.max' => 'Das sind mehr als 255 Zeichen. Nenn die fehlenden Anlagen oder Bereiche kürzer.',
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
}
