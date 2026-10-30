<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\Page;
use App\Services\Content\PagePublisher;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * A new Ratgeber article: its title, and the address derived from it (never typed, never posted).
 */
class GuideStoreRequest extends FormRequest
{
    public const DELETED_ADDRESS = 'Diese Adresse hatte ein Artikel, der gelöscht ist. Sie bleibt ihm, damit ein alter Link nicht auf einen anderen Text führt. Wähl einen anderen Titel.';

    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('create', Page::class);
    }

    protected function prepareForValidation(): void
    {
        $title = trim(is_scalar($this->input('title')) ? (string) $this->input('title') : '');

        $this->merge(['title' => $title, 'slug' => PagePublisher::slugFor($title)]);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:90'],
            'slug' => ['bail', 'required', 'string', 'max:120', 'regex:/^[a-z0-9][a-z0-9-]*$/', self::notADeletedArticles(...), Rule::unique('pages', 'slug')],
        ];
    }

    /**
     * A deleted article keeps its address (D-351): said as what it is, not as a page that still stands there. The unique
     * rule after it sees the deleted row too; this one, first, only words it.
     */
    private static function notADeletedArticles(string $attribute, mixed $value, Closure $fail): void
    {
        if (is_string($value) && Page::onlyTrashed()->where('slug', $value)->exists()) {
            $fail(self::DELETED_ADDRESS);
        }
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        $unusable = 'Der Titel braucht mindestens einen Buchstaben oder eine Ziffer.';

        return [
            'title.required' => 'Bitte gib dem Artikel einen Titel.',
            'title.max' => 'Der Titel darf höchstens 90 Zeichen lang sein.',
            'slug.required' => $unusable,
            'slug.regex' => $unusable,
            'slug.max' => 'Der Titel ist zu lang für eine Adresse. Kürz ihn bitte.',
            'slug.unique' => 'Unter dieser Adresse gibt es schon eine Seite. Wähl einen anderen Titel.',
        ];
    }

    public function title(): string
    {
        return (string) $this->validated('title');
    }

    public function slug(): string
    {
        return (string) $this->validated('slug');
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
