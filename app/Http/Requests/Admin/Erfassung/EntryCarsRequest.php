<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Erfassung;

use Illuminate\Validation\Rule;

/**
 * Step 3: cars ticked one by one, or „Alle Treffer auswählen“ — every result of the search as it stands, a shortcut and
 * nothing more: nothing is stored as a group, and nothing joins by itself later (the client's change of 05.11.2026).
 */
class EntryCarsRequest extends EntryRequest
{
    /** The most cars one tick adds. */
    public const MAX = 500;

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'vehicle_ids' => ['required_without:treffer', 'array', 'max:'.self::MAX],
            'vehicle_ids.*' => ['integer', 'distinct', Rule::exists('vehicles', 'id')->whereNull('deleted_at')],
            'treffer' => ['required_without:vehicle_ids', 'nullable', 'string', 'min:2', 'max:80'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'vehicle_ids.required_without' => 'Wähl bitte mindestens ein Fahrzeug.',
            'vehicle_ids.max' => 'Höchstens 500 Fahrzeuge auf einmal.',
            'vehicle_ids.*' => 'Eines der gewählten Fahrzeuge gibt es nicht mehr.',
            'treffer.*' => 'Such erst nach den Fahrzeugen, die du auswählen willst.',
        ];
    }
}
