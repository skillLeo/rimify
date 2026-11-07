<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Erfassung;

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\DocumentCarEntry;
use App\Models\DocumentWheelCombination;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Every write of the five steps: who may edit this draft (ApprovalDocumentPolicy::update, R-11), and a car entry named in the
 * address must be this document's.
 */
class EntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $document = $this->route('document');
        $entry = $this->route('entry');
        $combination = $this->route('combination');

        if (! $user instanceof AdminUser || ! $document instanceof ApprovalDocument) {
            return false;
        }

        if ($combination !== null && (! $combination instanceof DocumentWheelCombination || $combination->approval_document_id !== $document->id)) {
            return false;
        }

        if ($entry !== null && (! $entry instanceof DocumentCarEntry || $entry->approval_document_id !== $document->id)) {
            return false;
        }

        return $user->can('update', $document);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [];
    }

    public function admin(): AdminUser
    {
        /** @var AdminUser $user */
        $user = $this->user('admin');

        return $user;
    }
}
