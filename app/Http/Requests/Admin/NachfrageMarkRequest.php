<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\DemandMark;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Marking a Nachfrage-Lücke — as watched, or as requested from a wheel brand — and taking the mark
 * back. Refused on the server for a role without the Gutachten edit right (DemandMarkPolicy, R-11).
 */
class NachfrageMarkRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('mark', DemandMark::class);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        $deleting = $this->isMethod('DELETE');

        return [
            'key' => ['required', 'string', 'max:32', 'regex:'.DemandMark::KEY_PATTERN],
            'state' => $deleting ? ['prohibited'] : ['required', Rule::in([DemandMark::WATCHED, DemandMark::REQUESTED])],
            'brand_id' => $deleting
                ? ['prohibited']
                : ['nullable', 'integer', 'prohibited_unless:state,'.DemandMark::REQUESTED, Rule::exists('brands', 'id')->whereNull('deleted_at')],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'key.*' => 'Diese Lücke gibt es nicht mehr. Lad die Seite bitte neu.',
            'state.*' => 'Diese Markierung gibt es nicht.',
            'brand_id.*' => 'Diese Marke gibt es nicht. Wähl bitte eine aus der Liste.',
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $key = $this->input('key');

                // A variant must still be in the catalogue: a mark for a car nobody can find is noise.
                if (is_string($key) && str_starts_with($key, 'v:') && ! $validator->errors()->has('key')
                    && ! DB::table('vehicles')->whereNull('deleted_at')->where('id', (int) substr($key, 2))->exists()) {
                    $validator->errors()->add('key', 'Dieses Fahrzeug ist nicht mehr im Katalog. Lad die Seite bitte neu.');
                }
            },
        ];
    }

    public function key(): string
    {
        return (string) $this->validated('key');
    }
}
