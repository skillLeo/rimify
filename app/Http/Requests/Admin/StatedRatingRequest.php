<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\WheelModel;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Stars typed for one rim (#19, D-344, D-345): the rating from 1,0 to 5,0 with one decimal at most, typed the German way,
 * and the number of reviews behind it — both, or nothing is saved. Its policy check is WheelModelPolicy::rate: the stars
 * go straight into the shop. Taking them off asks the same.
 */
class StatedRatingRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $model = $this->route('model');

        return $user instanceof AdminUser && $model instanceof WheelModel && $user->can('rate', $model);
    }

    protected function prepareForValidation(): void
    {
        if ($this->isMethod('delete')) {
            return;
        }

        $rating = $this->input('rating');
        $count = $this->input('count');

        $this->merge([
            // „4,9“ the German way, „4.9“ as well.
            'rating' => is_string($rating) ? str_replace(',', '.', trim($rating)) : $rating,
            // „1.234“ with a thousands point or a space.
            'count' => is_string($count) ? (string) preg_replace('/[\s\x{00A0}\x{202F}.]/u', '', $count) : $count,
        ]);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        if ($this->isMethod('delete')) {
            return [];
        }

        return [
            'rating' => ['required', 'regex:/^[1-5](\.\d)?$/', 'numeric', 'between:1,5'],
            'count' => ['required', 'regex:/^\d{1,7}$/', 'integer', 'min:1'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'rating.required' => 'Trag die Sterne ein, etwa 4,8.',
            'rating.*' => 'Die Sterne gehen von 1,0 bis 5,0, mit höchstens einer Stelle nach dem Komma – etwa 4,8.',
            'count.required' => 'Trag ein, auf wie vielen Bewertungen die Sterne beruhen.',
            'count.*' => 'Die Zahl der Bewertungen ist eine ganze Zahl ab 1.',
        ];
    }

    public function rating(): float
    {
        return round((float) $this->validated('rating'), 1);
    }

    public function count(): int
    {
        return (int) $this->validated('count');
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser ? $user : abort(403);
    }
}
