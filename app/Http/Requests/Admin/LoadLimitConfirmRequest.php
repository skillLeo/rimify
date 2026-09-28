<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\DocumentCondition;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Confirming a load-index limit that differs from twice its index's capacity, with a written reason: the
 * document stands as it is printed (the operator's second review of C9, §3). Only on a draft, by someone who
 * may change it (ApprovalDocumentPolicy::update, R-11), and only for an Auflage of that document.
 */
class LoadLimitConfirmRequest extends FormRequest
{
    /** @var string */
    protected $errorBag = 'auflagen';

    public function authorize(): bool
    {
        $user = $this->user('admin');
        $document = $this->route('document');
        $condition = $this->route('condition');

        return $user instanceof AdminUser
            && $document instanceof ApprovalDocument
            && $condition instanceof DocumentCondition
            && $condition->approval_document_id === $document->id
            && $user->can('update', $document);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return ['reason' => ['required', 'string', 'min:10', 'max:500']];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'reason.required' => 'Bitte schreib in einem Satz, warum die Zahl so im Gutachten steht.',
            'reason.min' => 'Bitte schreib einen ganzen Satz – etwa, auf welcher Seite die Zahl so gedruckt ist.',
            'reason.max' => 'Höchstens 500 Zeichen.',
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
