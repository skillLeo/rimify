<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Services\Storage\PdfUpload;
use Illuminate\Foundation\Http\FormRequest;

/** A form for one PDF upload straight into the bucket (PdfUpload::presign). */
class PdfPresignRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('create', PdfUpload::class);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [];
    }
}
