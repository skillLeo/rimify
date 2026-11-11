<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\ShippingMethod;
use App\Support\Money;
use App\Support\Shipping;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * One shipping method of Einstellungen › Versand, saved (his round of 08.11, §7B; D-449): its name, its price including VAT,
 * its delivery time in working days from–to, an optional free-shipping threshold, its countries, an optional description and
 * optionally the products it ships. Prices are typed the German way (Money::fromGerman, which refuses anything ambiguous).
 * Asked of ShippingMethodPolicy (R-11).
 */
class ShippingMethodRequest extends FormRequest
{
    public function authorize(): bool
    {
        $method = $this->route('method');

        return $method instanceof ShippingMethod
            ? $this->admin()->can('update', $method)
            : $this->admin()->can('create', ShippingMethod::class);
    }

    protected function prepareForValidation(): void
    {
        $trim = static fn (mixed $v): mixed => is_string($v) ? trim((string) preg_replace('/\s+/u', ' ', $v)) : $v;

        $this->merge([
            'name' => $trim($this->input('name')),
            'description' => $trim($this->input('description')),
            'price' => $trim($this->input('price')),
            'free_from' => $trim($this->input('free_from')),
        ]);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:300'],
            'price' => ['required', 'string', 'max:32'],
            'free_from' => ['nullable', 'string', 'max:32'],
            'min_days' => ['required', 'integer', 'min:1', 'max:60'],
            'max_days' => ['required', 'integer', 'min:1', 'max:60', 'gte:min_days'],
            'countries' => ['required', 'array', 'min:1'],
            'countries.*' => ['string', Rule::in(array_keys(Shipping::COUNTRIES))],
            'product_types' => ['present', 'array'],
            'product_types.*' => ['string', Rule::in(array_keys(Shipping::PRODUCT_TYPES))],
            'active' => ['required', 'boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.required' => 'Gib der Versandart einen Namen, zum Beispiel „Standard“ oder „Express“.',
            'name.max' => 'Der Name darf höchstens 80 Zeichen lang sein.',
            'description.max' => 'Die Beschreibung darf höchstens 300 Zeichen lang sein.',
            'price.required' => 'Gib den Preis an, mit Mehrwertsteuer, zum Beispiel 4,90. Kostenlos ist 0,00.',
            'price.max' => 'Schreib den Preis mit Komma, zum Beispiel 4,90.',
            'free_from.max' => 'Schreib den Betrag mit Komma, zum Beispiel 500,00 – oder lass das Feld leer.',
            'min_days.required' => 'Die Lieferzeit braucht beide Werte: von und bis.',
            'max_days.required' => 'Die Lieferzeit braucht beide Werte: von und bis.',
            'min_days.*' => 'Die Lieferzeit bitte in ganzen Werktagen, zwischen 1 und 60.',
            'max_days.gte' => '„Bis“ darf nicht kleiner sein als „Von“.',
            'max_days.*' => 'Die Lieferzeit bitte in ganzen Werktagen, zwischen 1 und 60.',
            'countries.*' => 'Wähl mindestens ein Land, in das diese Versandart liefert.',
            'product_types.*' => 'Wähl, wofür die Versandart gilt.',
            'active.*' => 'Wähl, ob die Versandart im Shop angeboten wird.',
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            foreach (['price' => 'Schreib den Preis mit Komma, zum Beispiel 4,90.', 'free_from' => 'Schreib den Betrag mit Komma, zum Beispiel 500,00 – oder lass das Feld leer.'] as $field => $sentence) {
                $typed = (string) $this->input($field);

                if ($typed !== '' && Money::fromGerman($typed) === null && ! $validator->errors()->has($field)) {
                    $validator->errors()->add($field, $sentence);
                }
            }
        }];
    }

    /**
     * The method's columns, as stored.
     *
     * @return array<string, mixed>
     */
    public function columns(): array
    {
        $free = (string) $this->validated('free_from');
        $description = $this->validated('description');
        /** @var list<string> $types */
        $types = array_values(array_unique((array) $this->validated('product_types')));
        sort($types);

        return [
            'name' => (string) $this->validated('name'),
            'description_de' => is_string($description) && $description !== '' ? $description : null,
            'price_cents' => (int) Money::fromGerman((string) $this->validated('price')),
            'free_from_cents' => $free === '' ? null : Money::fromGerman($free),
            'delivery_min_days' => (int) $this->validated('min_days'),
            'delivery_max_days' => (int) $this->validated('max_days'),
            'countries' => array_values(array_unique((array) $this->validated('countries'))),
            // Both named is every product: stored as none named, so a new kind of product is not left out silently.
            'product_types' => $types === [] || count($types) === count(Shipping::PRODUCT_TYPES) ? null : $types,
            'active' => (bool) $this->validated('active'),
        ];
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');
        abort_unless($user instanceof AdminUser, 403);

        return $user;
    }
}
