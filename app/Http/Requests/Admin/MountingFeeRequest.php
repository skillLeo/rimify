<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\BalanceWeightColour;
use App\Support\Money;
use Illuminate\Foundation\Http\FormRequest;

/**
 * "Montage und Wuchten je Rad" — the one fee every Komplettrad carries, set by the admin rather
 * than by a deploy (docs/specs/komplettrad.md §13, D-032).
 *
 * The figure is typed the German way and parsed by Money::fromGerman(), which refuses anything
 * ambiguous rather than guessing (CLAUDE.md §2). An EMPTY field is a legitimate answer and means
 * "noch nicht festgelegt": it is stored as null, the basket goes back to printing
 * `wird noch festgelegt`, and no Komplettrad can be ordered. A field that is not empty and cannot
 * be read is refused with the sentence that names the fix — it is never silently cleared.
 */
class MountingFeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('updateMountingFee', BalanceWeightColour::class);
    }

    protected function prepareForValidation(): void
    {
        // An absent field is left absent, so `present` can still catch a form that forgot it.
        if (! $this->has('mounting')) {
            return;
        }

        $typed = trim($this->text('mounting'));

        $this->merge([
            'mounting' => $typed,
            'mountingCents' => $typed === '' ? null : Money::fromGerman($typed),
        ]);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        $typed = $this->text('mounting') !== '';

        return [
            // The field has to be posted: leaving it out would clear a real price by accident.
            'mounting' => ['present', 'string', 'max:32'],
            // ≤ 99.999,99 € per wheel. A fee of 0,00 € is a price the shop may genuinely charge —
            // unlike a sensor price, mounting can be included in the rim price.
            'mountingCents' => [$typed ? 'required' : 'nullable', 'integer', 'min:0', 'max:9999999'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        $unreadable = 'Bitte schreib den Preis deutsch, zum Beispiel 19,90 – oder lass das Feld leer.';

        return [
            'mounting.present' => $unreadable,
            'mounting.max' => $unreadable,
            // Money::fromGerman() returning null surfaces as `required`: the sentence names the fix.
            'mountingCents.required' => $unreadable,
            'mountingCents.integer' => $unreadable,
            'mountingCents.min' => $unreadable,
            'mountingCents.max' => 'Ein Preis über 99.999,99 € je Rad ist sicher ein Tippfehler.',
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

    /** The fee in integer cents, or null for "noch nicht festgelegt". */
    public function mountingCents(): ?int
    {
        $cents = $this->validated('mountingCents');

        return is_int($cents) ? $cents : null;
    }

    /** A posted scalar as a string; anything that is not a scalar reads as the default. */
    private function text(string $key, string $default = ''): string
    {
        $value = $this->input($key, $default);

        return is_scalar($value) ? (string) $value : $default;
    }
}
