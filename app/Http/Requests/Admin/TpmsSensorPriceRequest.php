<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\TpmsSensorPrice;
use App\Support\MakeName;
use App\Support\Money;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Creating or changing the RDKS sensor price of one car make (docs/specs/komplettrad.md §6.4).
 *
 * The make is free text. What is stored is its join key — MakeName::key(), so `VW`, `vw` and
 * `Volkswagen` are one make — beside the label a human reads. The price is typed the German way and
 * parsed by Money::fromGerman(); a price of 0,00 € is refused because it would claim the sensors
 * are free, and absence is how "unknown" is stored (§2.1). The unique rule excludes trashed rows:
 * a deleted make is restored by the controller rather than reported as a live collision.
 */
class TpmsSensorPriceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $price = $this->price();

        return $user instanceof AdminUser && $user->can(
            $price === null ? 'create' : 'update',
            $price ?? TpmsSensorPrice::class,
        );
    }

    protected function prepareForValidation(): void
    {
        $make = trim($this->text('make'));

        $this->merge([
            'makeKey' => MakeName::key($make),
            'makeLabelDe' => MakeName::normalise($make),
            'priceCents' => Money::fromGerman($this->text('price')),
        ]);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'makeKey' => [
                'required', 'string', 'max:64', 'regex:/^[a-z0-9][a-z0-9-]*$/',
                Rule::unique('tpms_sensor_prices', 'make_key')->whereNull('deleted_at')->ignore($this->price()),
            ],
            'makeLabelDe' => ['required', 'string', 'max:64'],
            'priceCents' => ['required', 'integer', 'min:1', 'max:9999999'],
            'active' => ['required', 'boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        $noMake = 'Bitte gib die Automarke an.';
        $unreadable = 'Bitte schreib den Preis deutsch, zum Beispiel 49,00.';

        return [
            'makeKey.required' => $noMake,
            'makeKey.regex' => $noMake,
            'makeKey.max' => 'Die Automarke darf höchstens 64 Zeichen lang sein.',
            'makeKey.unique' => 'Für diese Marke ist schon ein Preis hinterlegt – bearbeite ihn dort.',
            'makeLabelDe.required' => $noMake,
            'makeLabelDe.max' => 'Die Automarke darf höchstens 64 Zeichen lang sein.',
            // Money::fromGerman() returning null surfaces as `required`: the sentence names the fix.
            'priceCents.required' => $unreadable,
            'priceCents.integer' => $unreadable,
            'priceCents.min' => 'Ein Preis von 0,00 € würde behaupten, die Sensoren wären kostenlos. Lass die Marke lieber ganz weg.',
            'priceCents.max' => 'Ein Preis über 99.999,99 € je Sensor ist sicher ein Tippfehler.',
            'active.required' => 'Bitte sag uns, ob der Preis aktiv sein soll.',
            'active.boolean' => 'Bitte sag uns, ob der Preis aktiv sein soll.',
        ];
    }

    /**
     * A rename onto the key of a DELETED make cannot be saved: the unique key spans trashed rows,
     * and restoring belongs to "new price" (§6.3), where the controller does it.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $price = $this->price();
            $key = $this->input('makeKey');

            if ($price === null || ! is_string($key) || $key === '') {
                return;
            }

            $trashed = TpmsSensorPrice::onlyTrashed()
                ->where('make_key', $key)
                ->whereKeyNot($price->getKey())
                ->exists();

            if ($trashed) {
                $validator->errors()->add(
                    'makeKey',
                    'Für diese Marke gab es schon einmal einen Preis. Leg ihn als neuen Preis an – dann stellen wir den gelöschten wieder her.',
                );
            }
        });
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

    /**
     * The validated input as the model's own columns.
     *
     * @return array{make_key: string, make_label_de: string, price_cents: int, currency: string, active: bool}
     */
    public function priceAttributes(): array
    {
        return [
            'make_key' => (string) $this->validated('makeKey'),
            'make_label_de' => (string) $this->validated('makeLabelDe'),
            'price_cents' => (int) $this->validated('priceCents'),
            'currency' => 'EUR',
            'active' => (bool) $this->validated('active'),
        ];
    }

    private function price(): ?TpmsSensorPrice
    {
        $price = $this->route('price');

        return $price instanceof TpmsSensorPrice ? $price : null;
    }

    /** A posted scalar as a string; anything that is not a scalar reads as the default. */
    private function text(string $key, string $default = ''): string
    {
        $value = $this->input($key, $default);

        return is_scalar($value) ? (string) $value : $default;
    }
}
