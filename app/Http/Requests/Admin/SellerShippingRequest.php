<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Support\Money;
use App\Support\Seller;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Einstellungen › Verkäufer & Versand, saved: the seller as the law names it and what delivery costs and takes. The
 * Super-Admin alone (SellerSettingsPolicy). Every field is checked for its form; an empty field is a legitimate
 * answer and means „noch nicht angegeben“ — what a real order or invoice then still needs, the preflight says.
 *
 * Prices are typed the German way (Money::fromGerman, which refuses anything ambiguous); the delivery time is a range
 * of working days, both ends or neither.
 */
class SellerShippingRequest extends FormRequest
{
    /** The seller's text fields, as the form posts them. */
    public const SELLER = ['name', 'legal_form', 'street', 'zip', 'city', 'managing_director', 'register_court', 'register_number', 'vat_id', 'tax_number', 'email', 'phone'];

    /** A field declared „entfällt“ and filled in at once: which one is meant is not ours to guess (D-319). */
    public const BOTH = [
        'managing_director' => 'Geschäftsführung und „Entfällt“ schließen sich aus. Lösch den Eintrag oder nimm das Häkchen bei „Entfällt“ heraus.',
        'register' => 'Registereintrag und „Entfällt“ schließen sich aus. Lösch Registergericht und Registernummer oder nimm das Häkchen bei „Entfällt“ heraus.',
        'vat_id' => 'USt-IdNr. und „Entfällt“ schließen sich aus. Lösch die Nummer oder nimm das Häkchen bei „Entfällt“ heraus.',
        'phone' => 'Telefonnummer und „Entfällt“ schließen sich aus. Lösch die Nummer oder nimm das Häkchen bei „Entfällt“ heraus.',
    ];

    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('update', Seller::class);
    }

    protected function prepareForValidation(): void
    {
        $seller = is_array($this->input('seller')) ? $this->input('seller') : [];
        $shipping = is_array($this->input('shipping')) ? $this->input('shipping') : [];
        $clean = [];

        foreach (self::SELLER as $key) {
            $value = $seller[$key] ?? null;
            $clean[$key] = is_scalar($value) ? trim((string) $value) : '';
        }

        // The tax numbers are compared without the spaces people type into them: `DE 123 456 789`.
        $clean['vat_id'] = strtoupper((string) preg_replace('/\s+/', '', $clean['vat_id']));
        $clean['placeholder'] = filter_var($seller['placeholder'] ?? false, FILTER_VALIDATE_BOOL);
        // The Impressum's fields declared „entfällt“, each a box ticked or not; anything else is not a declaration.
        $declared = is_array($seller['not_applicable'] ?? null) ? $seller['not_applicable'] : [];
        $clean['not_applicable'] = array_values(array_filter(
            Seller::MAY_NOT_APPLY,
            static fn (string $field): bool => filter_var($declared[$field] ?? false, FILTER_VALIDATE_BOOL),
        ));

        $money = static fn (mixed $typed): string => is_scalar($typed) ? trim((string) $typed) : '';
        $days = static fn (mixed $typed): mixed => is_scalar($typed) && trim((string) $typed) !== '' ? trim((string) $typed) : null;

        $this->merge([
            'seller' => $clean,
            'shipping' => [
                'cost' => $money($shipping['cost'] ?? ''),
                'free_from' => $money($shipping['free_from'] ?? ''),
                'min_days' => $days($shipping['min_days'] ?? null),
                'max_days' => $days($shipping['max_days'] ?? null),
                'placeholder' => filter_var($shipping['placeholder'] ?? false, FILTER_VALIDATE_BOOL),
            ],
        ]);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'seller' => ['required', 'array'],
            'seller.name' => ['nullable', 'string', 'max:160'],
            'seller.legal_form' => ['nullable', 'string', 'max:80'],
            'seller.street' => ['nullable', 'string', 'max:160'],
            'seller.zip' => ['nullable', 'string', 'regex:/^\d{5}$/'],
            'seller.city' => ['nullable', 'string', 'max:120'],
            'seller.managing_director' => ['nullable', 'string', 'max:200'],
            'seller.register_court' => ['nullable', 'string', 'max:120'],
            'seller.register_number' => ['nullable', 'string', 'max:40', 'regex:/^[A-Za-zÄÖÜäöü. ]{2,8}\s?\d{1,7}(\s?[A-Z]{1,2})?$/u'],
            'seller.vat_id' => ['nullable', 'string', 'regex:/^DE\d{9}$/'],
            'seller.tax_number' => ['nullable', 'string', 'max:20', 'regex:/^\d[\d\/ ]{8,18}\d$/'],
            'seller.email' => ['nullable', 'string', 'email:rfc', 'max:190'],
            'seller.phone' => ['nullable', 'string', 'max:30', 'regex:/^\+?[\d ()\/-]{6,30}$/'],
            'seller.placeholder' => ['boolean'],
            'seller.not_applicable' => ['array'],
            'seller.not_applicable.*' => ['string', 'in:'.implode(',', Seller::MAY_NOT_APPLY)],
            'shipping' => ['required', 'array'],
            'shipping.cost' => ['nullable', 'string', 'max:32'],
            'shipping.free_from' => ['nullable', 'string', 'max:32'],
            'shipping.min_days' => ['nullable', 'integer', 'min:1', 'max:60', 'required_with:shipping.max_days'],
            'shipping.max_days' => ['nullable', 'integer', 'min:1', 'max:60', 'required_with:shipping.min_days', 'gte:shipping.min_days'],
            'shipping.placeholder' => ['boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'seller.name.max' => 'Der Name darf höchstens 160 Zeichen lang sein.',
            'seller.legal_form.max' => 'Die Rechtsform darf höchstens 80 Zeichen lang sein.',
            'seller.street.max' => 'Straße und Hausnummer dürfen höchstens 160 Zeichen lang sein.',
            'seller.zip.regex' => 'Die PLZ hat fünf Ziffern.',
            'seller.city.max' => 'Der Ort darf höchstens 120 Zeichen lang sein.',
            'seller.managing_director.max' => 'Die Geschäftsführung darf höchstens 200 Zeichen lang sein.',
            'seller.register_court.max' => 'Das Registergericht darf höchstens 120 Zeichen lang sein.',
            'seller.register_number.*' => 'Schreib die Registernummer so, wie sie im Handelsregister steht: die Abteilung und die Nummer, etwa HRB und die Ziffern.',
            'seller.vat_id.*' => 'Eine deutsche USt-IdNr. besteht aus DE und neun Ziffern.',
            'seller.tax_number.*' => 'Die Steuernummer bitte mit Ziffern und Schrägstrichen, so wie auf dem Bescheid des Finanzamts.',
            'seller.email.max' => 'Die E-Mail-Adresse ist zu lang.',
            'seller.email.*' => 'Diese E-Mail-Adresse ist unvollständig – sie braucht ein @ und eine Domain.',
            'seller.phone.*' => 'Die Telefonnummer bitte nur mit Ziffern, Leerzeichen und einem + am Anfang.',
            'shipping.cost.max' => 'Schreib den Preis mit Komma, zum Beispiel 4,90 – oder lass das Feld leer.',
            'shipping.free_from.max' => 'Schreib den Betrag mit Komma, zum Beispiel 500,00 – oder lass das Feld leer.',
            'shipping.min_days.required_with' => 'Die Lieferzeit braucht beide Werte: von und bis.',
            'shipping.max_days.required_with' => 'Die Lieferzeit braucht beide Werte: von und bis.',
            'shipping.min_days.*' => 'Die Lieferzeit bitte in ganzen Werktagen, zwischen 1 und 60.',
            'shipping.max_days.gte' => '„Bis“ darf nicht kleiner sein als „Von“.',
            'shipping.max_days.*' => 'Die Lieferzeit bitte in ganzen Werktagen, zwischen 1 und 60.',
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                foreach (['cost' => 'Schreib den Preis mit Komma, zum Beispiel 4,90 – oder lass das Feld leer.', 'free_from' => 'Schreib den Betrag mit Komma, zum Beispiel 500,00 – oder lass das Feld leer.'] as $field => $sentence) {
                    $typed = (string) $this->input("shipping.{$field}");

                    if ($typed !== '' && Money::fromGerman($typed) === null && ! $validator->errors()->has("shipping.{$field}")) {
                        $validator->errors()->add("shipping.{$field}", $sentence);
                    }
                }

                // „Entfällt“ beside a value: the error stands at the field the admin filled in.
                $declared = (array) $this->input('seller.not_applicable', []);

                foreach (self::BOTH as $field => $sentence) {
                    $filled = $field === 'register'
                        ? ['register_court' => (string) $this->input('seller.register_court'), 'register_number' => (string) $this->input('seller.register_number')]
                        : [$field => (string) $this->input("seller.{$field}")];
                    $filled = array_filter($filled, static fn (string $value): bool => $value !== '');

                    if (in_array($field, $declared, true) && $filled !== []) {
                        $validator->errors()->add('seller.'.array_key_first($filled), $sentence);
                    }
                }
            },
        ];
    }

    /**
     * The seller as it is stored: every text field (null where empty), the placeholder mark and the Impressum's fields
     * declared „entfällt“.
     *
     * @return array<string, string|bool|list<string>|null>
     */
    public function seller(): array
    {
        $out = [];

        foreach (self::SELLER as $key) {
            $value = $this->validated("seller.{$key}");
            $out[$key] = is_string($value) && $value !== '' ? $value : null;
        }

        $out['placeholder'] = $this->validated('seller.placeholder') === true;
        $declared = $this->validated('seller.not_applicable');
        $out['not_applicable'] = array_values(array_intersect(Seller::MAY_NOT_APPLY, is_array($declared) ? $declared : []));

        return $out;
    }

    /**
     * The shipping as it is stored: the price per delivery country in cents, the range of working days, the mark.
     *
     * @return array{zones: array{DE: array{cost_cents: int|null, free_from_cents: int|null}}, delivery_min_days: int|null, delivery_max_days: int|null, placeholder: bool}
     */
    public function shipping(): array
    {
        $cents = static fn (mixed $typed): ?int => is_string($typed) && $typed !== '' ? Money::fromGerman($typed) : null;
        $days = static fn (mixed $value): ?int => $value === null ? null : (int) $value;

        return [
            'zones' => ['DE' => ['cost_cents' => $cents($this->validated('shipping.cost')), 'free_from_cents' => $cents($this->validated('shipping.free_from'))]],
            'delivery_min_days' => $days($this->validated('shipping.min_days')),
            'delivery_max_days' => $days($this->validated('shipping.max_days')),
            'placeholder' => $this->validated('shipping.placeholder') === true,
        ];
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');
        abort_unless($user instanceof AdminUser, 403);

        return $user;
    }
}
