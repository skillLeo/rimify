<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Domain\Fitment\Verdict\ConditionLevel;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\DocumentCondition;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * How loud one Auflage is in the shop (#23, D-104): Hinweis, Auflage or nicht zulässig — through
 * ApprovalDocumentPolicy::setLevels, for an Auflage of that document. An Abnahme or work on the body is never a mere
 * Hinweis, and the form is told why in one sentence (ConditionLevel::FLOOR_SENTENCE).
 */
class ConditionLevelRequest extends FormRequest
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
            && $user->can('setLevels', $document);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $condition = $this->route('condition');

        return [
            'level' => [
                'required',
                Rule::in(ConditionLevel::values()),
                static function (string $attribute, mixed $value, Closure $fail) use ($condition): void {
                    $level = is_string($value) ? ConditionLevel::tryFrom($value) : null;

                    if ($level !== null && $condition instanceof DocumentCondition && ! $level->allowedFor($condition->kind)) {
                        $fail(ConditionLevel::FLOOR_SENTENCE);
                    }
                },
            ],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'level.required' => 'Wähl, wie die Auflage im Shop erscheint.',
            'level.in' => 'Wähl, wie die Auflage im Shop erscheint.',
        ];
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser ? $user : abort(403);
    }

    public function level(): ConditionLevel
    {
        return ConditionLevel::from((string) $this->validated('level'));
    }
}
