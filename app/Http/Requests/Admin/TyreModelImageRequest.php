<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\TyreModel;
use Illuminate\Foundation\Http\FormRequest;

/**
 * A photograph of a tyre model, with the sentence a screen reader hears for it: as a rim's (WheelImageRequest). The file itself is
 * checked by ImageUpload. Also the sentence alone, where `image` is not asked for (relabelling).
 */
class TyreModelImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $model = $this->route('model');

        return $user instanceof AdminUser && $model instanceof TyreModel && $user->can('update', $model);
    }

    protected function prepareForValidation(): void
    {
        $alt = $this->input('alt');
        $this->merge(['alt' => is_string($alt) ? trim($alt) : $alt]);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'image' => [$this->isMethod('post') ? 'required' : 'prohibited', 'file', 'max:'.(12 * 1024)],
            'alt' => ['required', 'string', 'min:8', 'max:200'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'image.required' => 'Bitte wähl ein Foto aus.',
            'image.file' => 'Die Datei ist nicht vollständig angekommen. Lad sie bitte noch einmal hoch.',
            'image.max' => 'Das Bild ist größer als 10 MB. Verkleinere es bitte und lad es noch einmal hoch.',
            'alt.required' => 'Bitte beschreib, was das Foto zeigt – zum Beispiel „Continental PremiumContact 7, Lauffläche“.',
            'alt.min' => 'Die Beschreibung ist zu kurz. Sag in einem Satz, was das Foto zeigt.',
            'alt.max' => 'Die Beschreibung darf höchstens 200 Zeichen lang sein.',
        ];
    }

    public function alt(): string
    {
        return (string) $this->validated('alt');
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
