<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use App\Services\Storefront\Basket;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * The checkout form as it is submitted with "Zahlungspflichtig bestellen".
 *
 * Guest checkout: there is no account and nobody to authorise, so `authorize()` admits every
 * visitor, as the basket does. What decides whether an order may be placed is the basket itself,
 * checked on the server in KasseController::store (R-11). The rules mirror the checks the page
 * runs on the address step, with the same German sentences.
 *
 * The RDKS answer travels with the submission so there is one source of truth at submit time
 * (docs/specs/komplettrad.md §5.3): a basket with a Komplettrad must carry one, a Felgen-only
 * basket must not — sensors are fitted while the tyre is mounted, and RIMIFY mounts no tyre on
 * a rims-only order (D-034).
 */
class PlaceOrderRequest extends FormRequest
{
    /** An RDKS answer for a basket that holds no Komplettrad: there is nothing to fit it into. */
    public const RDKS_WITHOUT_SET = 'RDKS-Sensoren gibt es bei uns nur zusammen mit einem Komplettrad.';

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $trimmed = [];

        foreach (['email', 'phone', 'name', 'street', 'houseNumber', 'zip', 'city', 'billingName', 'billingStreet', 'billingHouseNumber', 'billingZip', 'billingCity'] as $field) {
            if (is_string($this->input($field))) {
                $trimmed[$field] = trim((string) $this->input($field));
            }
        }

        $this->merge($trimmed);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email', 'max:190'],
            'phone' => ['nullable', 'string', 'max:32'],
            'name' => ['required', 'string', 'max:190'],
            'street' => ['required', 'string', 'max:190'],
            'houseNumber' => ['required', 'string', 'max:32'],
            'zip' => ['required', 'string', 'regex:/^\d{5}$/'],
            'city' => ['required', 'string', 'max:190'],
            'billingSame' => ['required', 'boolean'],
            'billingName' => ['exclude_if:billingSame,true', 'required', 'string', 'max:190'],
            'billingStreet' => ['exclude_if:billingSame,true', 'required', 'string', 'max:190'],
            'billingHouseNumber' => ['exclude_if:billingSame,true', 'required', 'string', 'max:32'],
            'billingZip' => ['exclude_if:billingSame,true', 'required', 'string', 'regex:/^\d{5}$/'],
            'billingCity' => ['exclude_if:billingSame,true', 'required', 'string', 'max:190'],
            'rdks' => ['nullable', Rule::in(['ja', 'nein'])],
        ];
    }

    /**
     * Whether an RDKS answer is required is a property of the basket, not of the field: it is
     * asked only where a Komplettrad is in the basket, and refused where none is.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $hasSet = app(Basket::class)->containsSet($this);
            $rdks = $this->input('rdks');
            $answered = is_string($rdks) && $rdks !== '';

            if ($hasSet && ! $answered) {
                $validator->errors()->add('rdks', Basket::TPMS_UNANSWERED_REFUSAL);
            }

            if (! $hasSet && $answered) {
                $validator->errors()->add('rdks', self::RDKS_WITHOUT_SET);
            }
        });
    }

    /** The RDKS answer, `ja` or `nein`; null where none was posted. */
    public function rdks(): ?string
    {
        $value = $this->validated('rdks');

        return is_string($value) && $value !== '' ? $value : null;
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'rdks.in' => Basket::TPMS_UNANSWERED_REFUSAL,
            'email.required' => 'Bitte gib deine E-Mail-Adresse an.',
            'email.email' => 'Diese E-Mail-Adresse ist unvollständig – sie braucht ein @ und eine Domain.',
            'name.required' => 'Bitte gib deinen vollständigen Namen an.',
            'street.required' => 'Bitte gib die Straße an.',
            'houseNumber.required' => 'Bitte gib die Hausnummer an.',
            'zip.required' => 'Bitte gib die PLZ an.',
            'zip.regex' => 'Eine deutsche PLZ hat fünf Ziffern.',
            'city.required' => 'Bitte gib den Ort an.',
            'billingSame.required' => 'Bitte gib an, ob die Rechnungsadresse der Lieferadresse entspricht.',
            'billingName.required' => 'Bitte gib den Namen für die Rechnung an.',
            'billingStreet.required' => 'Bitte gib die Straße an.',
            'billingHouseNumber.required' => 'Bitte gib die Hausnummer an.',
            'billingZip.required' => 'Bitte gib die PLZ an.',
            'billingZip.regex' => 'Eine deutsche PLZ hat fünf Ziffern.',
            'billingCity.required' => 'Bitte gib den Ort an.',
            'max' => 'Diese Angabe ist zu lang.',
            'string' => 'Diese Angabe ist ungültig.',
            'boolean' => 'Diese Angabe ist ungültig.',
        ];
    }
}
