<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use Illuminate\Foundation\Http\FormRequest;

/**
 * The switch „Alle Fahrzeuge dieses Gutachtens sind erfasst“ on the paper's page (D-485, replacing D-227's question at
 * release) — the same right as the release (`approvals` × publish, R-11), on a draft or the released revision
 * (ApprovalDocumentPolicy::answerCompleteness). Off by default; it never blocks a release.
 *
 * Route: POST /admin/gutachten/{document}/vollstaendigkeit.
 */
class ApprovalCompletenessRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $document = $this->route('document');

        return $user instanceof AdminUser && $document instanceof ApprovalDocument && $user->can('answerCompleteness', $document);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return ['complete' => ['required', 'boolean']];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['complete.*' => 'Sag, ob alle Fahrzeuge dieses Gutachtens erfasst sind: an oder aus.'];
    }

    /** „Alle Fahrzeuge dieses Gutachtens sind erfasst“, on or off. */
    public function complete(): bool
    {
        return $this->boolean('complete');
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
