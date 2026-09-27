<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use Illuminate\Foundation\Http\FormRequest;

/**
 * A photograph for one finish of a Felge, with the sentence a screen reader hears for it — required:
 * a product photograph without alt text is refused, not saved and fixed later.
 *
 * The file itself is checked by ImageUpload (type from its bytes, size, sides, pixel count, virus
 * hook); here only that it arrived and that the finish belongs to the model in the URL.
 */
class WheelImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $model = $this->route('model');
        $finish = $this->route('finish');

        return $user instanceof AdminUser
            && $model instanceof WheelModel
            && $finish instanceof WheelFinish
            && $finish->wheel_model_id === $model->id
            && $user->can('update', $model);
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
            // The 10 MB ceiling is ImageUpload's; this one only keeps a huge body from being parsed.
            'image' => ['required', 'file', 'max:'.(12 * 1024)],
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
            'alt.required' => 'Bitte beschreib, was das Foto zeigt – zum Beispiel „Nordfelge Fjord in Graphit matt, Ansicht von vorn“.',
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
