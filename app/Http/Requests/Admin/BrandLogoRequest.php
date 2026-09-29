<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\Brand;
use App\Services\Admin\Catalogue\BrandLogoStore;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;

/**
 * A Marke's logo (BrandLogoStore): one file, at most 1 MB. What kind of file it is decides the store,
 * from its bytes — the rules here only keep out what is plainly not a file or far too large.
 */
class BrandLogoRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $brand = $this->route('brand');

        return $user instanceof AdminUser && $brand instanceof Brand && $user->can('update', $brand);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return ['logo' => ['required', 'file', 'max:'.intdiv(BrandLogoStore::MAX_BYTES, 1024)]];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'logo.required' => 'Bitte wähl eine Logo-Datei aus.',
            'logo.file' => BrandLogoStore::NOT_A_LOGO,
            'logo.uploaded' => BrandLogoStore::TOO_LARGE,
            'logo.max' => BrandLogoStore::TOO_LARGE,
        ];
    }

    public function logo(): UploadedFile
    {
        $file = $this->file('logo');

        return $file instanceof UploadedFile ? $file : abort(422);
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser ? $user : abort(403);
    }
}
