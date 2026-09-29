<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\FaqEntry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * The FAQ's whole order at once, as the list shows it. The order is what visitors read — on /faq
 * and in the homepage's top five — so changing it takes the right to publish.
 *
 * Every entry, each once: a list that leaves one out or names one twice is a page that was out of
 * date, and it is refused rather than half applied.
 */
class FaqOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('publish', FaqEntry::class);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'distinct'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $posted = array_map('intval', (array) $this->input('ids', []));
            $known = FaqEntry::query()->pluck('id')->map(static fn (mixed $id): int => (int) $id)->all();

            sort($posted);
            sort($known);

            if ($posted !== $known) {
                $validator->errors()->add('ids', 'Die Liste war nicht mehr aktuell. Bitte lade die Seite neu und versuch es noch einmal.');
            }
        });
    }

    /** @return list<int> */
    public function ids(): array
    {
        return array_values(array_map('intval', (array) $this->validated('ids')));
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
