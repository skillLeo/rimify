<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\Page;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;

/**
 * A picture for a Ratgeber article's building block (his admin item 11, D-306): uploaded into our own storage, so the
 * article never loads anything from another site. Only an article takes pictures, and only who may edit the page may
 * upload one (PagePolicy). The file itself is checked by ImageUpload — its type read from its bytes, its size, sides and
 * pixel count, the virus hook — and stored anew, without its EXIF fields. The alt text is the block's own field, asked
 * for there and checked at publishing.
 */
class PageImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('update', $this->page());
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            // The 10 MB ceiling is ImageUpload's; this one only keeps a huge body from being parsed.
            'image' => ['required', 'file', 'max:'.(12 * 1024)],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'image.required' => 'Bitte wähl ein Bild aus.',
            'image.file' => 'Die Datei ist nicht vollständig angekommen. Lad sie bitte noch einmal hoch.',
            'image.max' => 'Das Bild ist größer als 10 MB. Verkleinere es bitte und lad es noch einmal hoch.',
        ];
    }

    /** The article: a page of another kind takes no pictures — absent, not forbidden. */
    public function page(): Page
    {
        $page = $this->route('page');

        if (! $page instanceof Page || $page->kind !== Page::KIND_GUIDE) {
            abort(404);
        }

        return $page;
    }

    /** Not `image()`: that name is Laravel's own on every request. */
    public function picture(): UploadedFile
    {
        $file = $this->file('image');

        return $file instanceof UploadedFile ? $file : abort(422);
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
