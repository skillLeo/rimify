<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Domain\Fitment\Verdict\HintColour;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\DocumentCondition;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * The colour a code gives the shop's hint (#23), on a released paper too. Whoever may set its level may set this
 * (ApprovalDocumentPolicy::setLevels), for a code of that document.
 */
class ConditionColourRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $document = $this->route('document');
        $condition = $this->route('condition');

        return $user instanceof AdminUser
            && $document instanceof ApprovalDocument
            && $condition instanceof DocumentCondition
            && $condition->approval_document_id === $document->id
            && $user->can('setLevels', $document);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return ['shop_colour' => ['required', Rule::enum(HintColour::class)]];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['shop_colour.*' => 'Wähl bitte Grün oder Gelb.'];
    }

    public function colour(): HintColour
    {
        return HintColour::from((string) $this->validated('shop_colour'));
    }

    public function admin(): AdminUser
    {
        /** @var AdminUser $user */
        $user = $this->user('admin');

        return $user;
    }
}
