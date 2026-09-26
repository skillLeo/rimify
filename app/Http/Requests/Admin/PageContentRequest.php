<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\Page;
use App\Services\Content\PageContent;
use App\Services\Content\PageSchema;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * A page's words as the editor sends them — to keep as the draft, or to publish.
 *
 * The rules here only fix the envelope. What the page may hold is PageSchema's to say: content()
 * keeps what the schema knows and types every value, and the publish check runs in the controller
 * so its messages can name the section and the field („Abschnitt 3 · Text fehlt.").
 *
 * @phpstan-import-type Content from PageSchema
 * @phpstan-import-type Schema from PageSchema
 */
class PageContentRequest extends FormRequest
{
    /** A draft is a working copy, but not a place to park a book: about 400 000 characters. */
    private const MAX_BYTES = 800_000;

    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('update', $this->page());
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            // The page version the editor loaded: a write against an older one is refused
            // (PagePublisher::lock), never applied over a colleague's newer words.
            'baseVersion' => ['required', 'integer', 'min:0'],
            'title' => ['nullable', 'string'],
            'metaDescription' => ['nullable', 'string'],
            'blocks' => ['present', 'array', 'max:100'],
            'blocks.*' => ['array'],
            'blocks.*.type' => ['required', 'string', 'max:32'],
            'blocks.*.data' => ['array'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'baseVersion' => 'Die Seite ist nicht vollständig angekommen. Bitte lade sie neu und versuch es noch einmal.',
            'blocks.max' => 'So viele Abschnitte passen nicht auf eine Seite.',
            'blocks.*' => 'Die Seite ist nicht vollständig angekommen. Bitte lade sie neu und versuch es noch einmal.',
            'blocks.*.*' => 'Die Seite ist nicht vollständig angekommen. Bitte lade sie neu und versuch es noch einmal.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if (strlen((string) json_encode($this->input())) > self::MAX_BYTES) {
                $validator->errors()->add('blocks', 'Die Seite ist zu lang zum Speichern. Teil den Text auf mehrere Seiten auf.');
            }
        });
    }

    /** The page, or a 404 for one the panel does not edit (FAQ, Kontakt): absent, not forbidden. */
    public function page(): Page
    {
        $page = $this->route('page');

        if (! $page instanceof Page || ! $page->isEditable()) {
            abort(404);
        }

        return $page;
    }

    public function baseVersion(): int
    {
        return (int) $this->validated('baseVersion');
    }

    /** @return Schema */
    public function schema(): array
    {
        return PageSchema::for($this->page()) ?? abort(404);
    }

    /**
     * The posted words in the content shape, nothing the schema does not know.
     *
     * @return Content
     */
    public function content(): array
    {
        /** @var array<mixed> $input */
        $input = $this->validated();

        return PageSchema::normalise($this->schema(), $input, PageContent::live($this->page()));
    }

    /** The signed-in admin; authorize() has already refused anyone else. */
    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }
}
