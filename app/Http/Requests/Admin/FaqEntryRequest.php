<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\FaqEntry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Creating or changing one FAQ entry.
 *
 * Authorised twice over when a visitor would see the change (FaqEntryPolicy): the right to create
 * or edit, and — when the entry is visible before or after — the right to publish.
 */
class FaqEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            return false;
        }

        $entry = $this->entry();
        $may = $entry === null ? $user->can('create', FaqEntry::class) : $user->can('update', $entry);
        $visible = $this->boolean('published') || ($entry !== null && $entry->published);

        return $may && (! $visible || $user->can('publish', FaqEntry::class));
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'question' => self::text($this->input('question')),
            'answer' => self::text($this->input('answer')),
        ]);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'group' => ['required', 'string', Rule::in(FaqEntry::GROUPS)],
            'question' => ['required', 'string', 'max:'.FaqEntry::QUESTION_MAX],
            'answer' => ['required', 'string', 'max:'.FaqEntry::ANSWER_MAX],
            'published' => ['required', 'boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'group.required' => 'Bitte wähl die Gruppe, unter der die Frage steht.',
            'group.in' => 'Bitte wähl die Gruppe, unter der die Frage steht.',
            'question.required' => 'Bitte schreib die Frage.',
            'question.max' => 'Die Frage darf höchstens '.FaqEntry::QUESTION_MAX.' Zeichen lang sein.',
            'answer.required' => 'Bitte schreib die Antwort.',
            'answer.max' => 'Die Antwort darf höchstens '.FaqEntry::ANSWER_MAX.' Zeichen lang sein.',
            'published.required' => 'Bitte sag uns, ob die Frage im Shop zu sehen sein soll.',
            'published.boolean' => 'Bitte sag uns, ob die Frage im Shop zu sehen sein soll.',
        ];
    }

    /** @return array{group_key: string, question_de: string, answer_de: string, published: bool} */
    public function entryAttributes(): array
    {
        return [
            'group_key' => (string) $this->validated('group'),
            'question_de' => (string) $this->validated('question'),
            'answer_de' => (string) $this->validated('answer'),
            'published' => (bool) $this->validated('published'),
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

    private function entry(): ?FaqEntry
    {
        $entry = $this->route('entry');

        return $entry instanceof FaqEntry ? $entry : null;
    }

    private static function text(mixed $value): string
    {
        return is_scalar($value) ? trim(str_replace(["\r\n", "\r"], "\n", (string) $value)) : '';
    }
}
