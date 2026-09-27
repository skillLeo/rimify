<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Services\Storage\PdfUpload;
use Illuminate\Foundation\Http\FormRequest;

/**
 * The upload form's target on a machine without a bucket: the file lands where the bucket would have
 * put it (invoices/pending/, private). The address is signed and expires like the bucket's form.
 */
class PdfLocalUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('create', PdfUpload::class);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimetypes:application/pdf', 'max:'.(PdfUpload::maxBytes() / 1024)],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'file.required' => 'Wähl bitte eine PDF-Datei aus.',
            'file.mimetypes' => 'Das ist keine PDF-Datei. Lad bitte das Gutachten als PDF hoch.',
            'file.max' => 'Die Datei ist größer als '.config('media.upload.pdf_max_mb').' MB.',
        ];
    }
}
