<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\TpmsSensorPrice;
use App\Support\Money;
use Illuminate\Foundation\Http\FormRequest;

/**
 * The default RDKS price per sensor — what every car make WITHOUT its own row is charged
 * (docs/specs/komplettrad.md §13, D-030).
 *
 * The figure is typed the German way and parsed by Money::fromGerman(), which refuses anything
 * ambiguous rather than guessing (CLAUDE.md §2). An EMPTY field is a legitimate answer and means
 * "kein Standardpreis": the checkout then offers sensors only for the makes that have their own
 * row, and says so for the rest. A price of 0,00 € is refused for the same reason it is refused per
 * make — it would claim the sensors are free.
 */
class TpmsDefaultPriceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('updateDefaultPrice', TpmsSensorPrice::class);
    }

    protected function prepareForValidation(): void
    {
        // An absent field is left absent, so `present` can still catch a form that forgot it.
        if (! $this->has('price')) {
            return;
        }

        $typed = trim($this->text('price'));

        $this->merge([
            'price' => $typed,
            'priceCents' => $typed === '' ? null : Money::fromGerman($typed),
        ]);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        $typed = $this->text('price') !== '';

        return [
            // The field has to be posted: leaving it out would clear a real price by accident.
            'price' => ['present', 'string', 'max:32'],
            // ≤ 99.999,99 € per sensor.
            'priceCents' => [$typed ? 'required' : 'nullable', 'integer', 'min:1', 'max:9999999'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        $unreadable = 'Bitte schreib den Preis deutsch, zum Beispiel 15,00 – oder lass das Feld leer.';

        return [
            'price.present' => $unreadable,
            'price.max' => $unreadable,
            // Money::fromGerman() returning null surfaces as `required`: the sentence names the fix.
            'priceCents.required' => $unreadable,
            'priceCents.integer' => $unreadable,
            'priceCents.min' => 'Ein Preis von 0,00 € würde behaupten, die Sensoren wären kostenlos. Lass das Feld lieber leer.',
            'priceCents.max' => 'Ein Preis über 99.999,99 € je Sensor ist sicher ein Tippfehler.',
        ];
    }

    /** The signed-in admin; authorize() has already refused anyone else. */
    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }

    /** The default price in integer cents, or null for "kein Standardpreis". */
    public function priceCents(): ?int
    {
        $cents = $this->validated('priceCents');

        return is_int($cents) ? $cents : null;
    }

    /** A posted scalar as a string; anything that is not a scalar reads as the default. */
    private function text(string $key, string $default = ''): string
    {
        $value = $this->input($key, $default);

        return is_scalar($value) ? (string) $value : $default;
    }
}
