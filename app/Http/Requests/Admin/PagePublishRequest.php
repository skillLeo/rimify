<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Services\Content\PageContent;
use App\Services\Content\PageSchema;

/**
 * Publishing: the same words as a draft save, plus what the publisher confirms — a note for the
 * version list and, on a legal page, whether this wording is the one the lawyer checked.
 */
class PagePublishRequest extends PageContentRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('publish', $this->page());
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return parent::rules() + [
            'note' => ['nullable', 'string', 'max:200'],
            'lawyerReviewed' => ['required', 'boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return parent::messages() + [
            'note.max' => 'Die Notiz darf höchstens 200 Zeichen lang sein.',
            'lawyerReviewed.required' => 'Bitte sag uns, ob der Text vom Anwalt geprüft ist.',
            'lawyerReviewed.boolean' => 'Bitte sag uns, ob der Text vom Anwalt geprüft ist.',
        ];
    }

    /**
     * What goes live. Writing words is the edit cell's, so somebody who may publish but not edit
     * publishes what the team saved — the draft, or failing that the live words — and never words
     * of their own sent with the request (R-11: the read-only form is only the UI hiding it).
     *
     * @return array{title: string, metaDescription: string, blocks: list<array{type: string, data: array<string, mixed>}>}
     */
    public function content(): array
    {
        $user = $this->user('admin');

        if ($user instanceof AdminUser && $user->may(PermissionModule::Content, PermissionAction::Edit)) {
            return parent::content();
        }

        $page = $this->page();
        $live = PageContent::live($page);

        return PageSchema::normalise($this->schema(), is_array($page->draft) ? $page->draft : $live, $live);
    }

    public function note(): ?string
    {
        $note = trim((string) $this->validated('note'));

        return $note === '' ? null : $note;
    }

    public function lawyerReviewed(): bool
    {
        return (bool) $this->validated('lawyerReviewed');
    }
}
