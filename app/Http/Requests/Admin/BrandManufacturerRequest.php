<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\Brand;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * A brand's Herstellerangaben for GPSR (Katalog › Marken): the manufacturer's name, postal address and electronic
 * contact, the responsible person in the EU where the manufacturer is outside it, and the safety information. All
 * three manufacturer fields together or none; a responsible person with an address and a contact, or none. What is
 * left empty is stored as nothing — the shop never fills it in.
 */
class BrandManufacturerRequest extends FormRequest
{
    public const INCOMPLETE = 'Name, Anschrift und Kontakt des Herstellers gehören zusammen – trag alle drei ein oder keins.';

    public const RESPONSIBLE_INCOMPLETE = 'Zur verantwortlichen Person in der EU gehören Anschrift und Kontakt.';

    public function authorize(): bool
    {
        $user = $this->user('admin');
        $brand = $this->route('brand');

        return $user instanceof AdminUser && $brand instanceof Brand && $user->can('update', $brand);
    }

    protected function prepareForValidation(): void
    {
        $clean = [];

        foreach (['manufacturerName', 'manufacturerAddress', 'manufacturerContact', 'euResponsibleName', 'euResponsibleAddress', 'euResponsibleContact', 'safetyNote'] as $field) {
            $value = $this->input($field);
            $clean[$field] = is_string($value) && trim($value) !== '' ? trim($value) : null;
        }

        $this->merge($clean);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'manufacturerName' => ['nullable', 'string', 'max:190'],
            'manufacturerAddress' => ['nullable', 'string', 'max:500'],
            'manufacturerContact' => ['nullable', 'string', 'max:190', 'regex:/^(\S+@\S+\.\S+|https?:\/\/\S+)$/'],
            'euResponsibleName' => ['nullable', 'string', 'max:190'],
            'euResponsibleAddress' => ['nullable', 'string', 'max:500'],
            'euResponsibleContact' => ['nullable', 'string', 'max:190', 'regex:/^(\S+@\S+\.\S+|https?:\/\/\S+)$/'],
            'safetyNote' => ['nullable', 'string', 'max:4000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $given = array_filter([$this->input('manufacturerName'), $this->input('manufacturerAddress'), $this->input('manufacturerContact')]);

            if ($given !== [] && count($given) < 3) {
                $validator->errors()->add('manufacturerName', self::INCOMPLETE);
            }

            if ($this->input('euResponsibleName') !== null && ($this->input('euResponsibleAddress') === null || $this->input('euResponsibleContact') === null)) {
                $validator->errors()->add('euResponsibleName', self::RESPONSIBLE_INCOMPLETE);
            }
        });
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            '*.regex' => 'Als Kontakt eine E-Mail-Adresse oder eine Webadresse mit https://.',
            '*.max' => 'Diese Angabe ist zu lang.',
        ];
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser ? $user : abort(403);
    }

    /** @return array<string, string|null> */
    public function attributesForBrand(): array
    {
        return [
            'manufacturer_name' => $this->validated('manufacturerName'),
            'manufacturer_address' => $this->validated('manufacturerAddress'),
            'manufacturer_contact' => $this->validated('manufacturerContact'),
            'eu_responsible_name' => $this->validated('euResponsibleName'),
            'eu_responsible_address' => $this->validated('euResponsibleAddress'),
            'eu_responsible_contact' => $this->validated('euResponsibleContact'),
            'safety_note' => $this->validated('safetyNote'),
        ];
    }
}
