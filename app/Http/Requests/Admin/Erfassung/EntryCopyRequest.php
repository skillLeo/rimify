<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Erfassung;

use Illuminate\Validation\Rule;

/** „Kopieren nach …“: to which of this paper's cars, replacing their lines or added to them, or only how it would come out. */
class EntryCopyRequest extends EntryRequest
{
    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'ziele' => ['required', 'array', 'min:1', 'max:500'],
            'ziele.*' => ['integer', 'distinct'],
            'modus' => ['required', Rule::in(['ersetzen', 'hinzufuegen'])],
            'vorschau' => ['sometimes', 'boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'ziele.*' => 'Wähl bitte mindestens ein Fahrzeug.',
            'modus.*' => 'Wähl bitte, ob die Zeilen ersetzt oder ergänzt werden.',
        ];
    }

    /** @return list<int> */
    public function targets(): array
    {
        return array_map(static fn (mixed $id): int => (int) $id, (array) $this->validated('ziele'));
    }

    public function replacing(): bool
    {
        return $this->validated('modus') === 'ersetzen';
    }

    public function dryRun(): bool
    {
        return $this->boolean('vorschau');
    }
}
