<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\BalanceWeightColour;
use App\Support\Money;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Creating or changing one Wuchtgewicht colour (docs/specs/komplettrad.md §6.4).
 *
 * The slug is derived from the name and never posted; the surcharge is typed the German way and
 * parsed by Money::fromGerman(), which refuses anything ambiguous rather than guessing (CLAUDE.md
 * §2). Both unique rules exclude trashed rows on purpose: a deleted colour with the same name is
 * restored by the controller, and a message written for a live collision would be wrong about it.
 */
class BalanceWeightColourRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $colour = $this->colour();

        return $user instanceof AdminUser && $user->can(
            $colour === null ? 'create' : 'update',
            $colour ?? BalanceWeightColour::class,
        );
    }

    protected function prepareForValidation(): void
    {
        $nameDe = trim($this->text('nameDe'));

        $this->merge([
            'nameDe' => $nameDe,
            // The column is NOT NULL with no default and MySQL runs in strict mode: a create() with
            // no slug is a 500, not a validation error. It is derived here and never posted.
            'slug' => Str::slug($nameDe),
            'swatchHex' => $this->hex(),
            'surchargeCents' => Money::fromGerman($this->text('surcharge', '0')),
        ]);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        $colour = $this->colour();

        return [
            'nameDe' => [
                'required', 'string', 'max:64',
                Rule::unique('balance_weight_colours', 'name_de')->whereNull('deleted_at')->ignore($colour),
            ],
            'slug' => [
                'required', 'string', 'max:64', 'regex:/^[a-z0-9][a-z0-9-]*$/',
                Rule::unique('balance_weight_colours', 'slug')->whereNull('deleted_at')->ignore($colour),
            ],
            'swatchHex' => ['nullable', 'string', 'regex:/^#[0-9A-F]{6}$/'],
            // ≤ 99.999,99 € per wheel.
            'surchargeCents' => ['required', 'integer', 'min:0', 'max:9999999'],
            'isDefault' => ['required', 'boolean'],
            'active' => ['required', 'boolean'],
            'sortOrder' => ['required', 'integer', 'min:0', 'max:9999'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        $duplicate = 'Diese Bezeichnung gibt es schon – bearbeite die vorhandene Farbe.';
        $tooLong = 'Die Bezeichnung darf höchstens 64 Zeichen lang sein.';
        $unusable = 'Die Bezeichnung braucht mindestens einen Buchstaben oder eine Ziffer.';

        return [
            'nameDe.required' => 'Bitte gib eine Bezeichnung an, zum Beispiel Silber.',
            'nameDe.max' => $tooLong,
            'nameDe.unique' => $duplicate,
            'slug.required' => $unusable,
            'slug.regex' => $unusable,
            'slug.max' => $tooLong,
            'slug.unique' => $duplicate,
            'swatchHex.regex' => 'Bitte schreib den Farbwert als Hex-Code mit sechs Stellen, zum Beispiel #C8CCD2.',
            // Money::fromGerman() returning null surfaces as `required`: the sentence names the fix.
            'surchargeCents.required' => 'Bitte schreib den Aufpreis deutsch, zum Beispiel 0,00 oder 2,50.',
            'surchargeCents.integer' => 'Bitte schreib den Aufpreis deutsch, zum Beispiel 0,00 oder 2,50.',
            'surchargeCents.max' => 'Ein Aufpreis über 99.999,99 € je Rad ist sicher ein Tippfehler.',
            'isDefault.required' => 'Bitte sag uns, ob das die Standardfarbe sein soll.',
            'isDefault.boolean' => 'Bitte sag uns, ob das die Standardfarbe sein soll.',
            'active.required' => 'Bitte sag uns, ob die Farbe aktiv sein soll.',
            'active.boolean' => 'Bitte sag uns, ob die Farbe aktiv sein soll.',
            'sortOrder.required' => 'Die Reihenfolge ist eine ganze Zahl von 0 bis 9999.',
            'sortOrder.integer' => 'Die Reihenfolge ist eine ganze Zahl von 0 bis 9999.',
            'sortOrder.min' => 'Die Reihenfolge ist eine ganze Zahl von 0 bis 9999.',
            'sortOrder.max' => 'Die Reihenfolge ist eine ganze Zahl von 0 bis 9999.',
        ];
    }

    /**
     * A rename onto the name of a DELETED colour cannot be saved: the unique key spans trashed
     * rows, and restoring belongs to "new colour" (§6.3), where the controller does it. Refused with
     * the route forward rather than left to fail as a database error.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $colour = $this->colour();
            $slug = $this->input('slug');

            if ($colour === null || ! is_string($slug) || $slug === '') {
                return;
            }

            $trashed = BalanceWeightColour::onlyTrashed()
                ->where('slug', $slug)
                ->whereKeyNot($colour->getKey())
                ->exists();

            if ($trashed) {
                $validator->errors()->add(
                    'nameDe',
                    'Diese Bezeichnung gehörte einer gelöschten Farbe. Leg sie als neue Farbe an – dann stellen wir die gelöschte wieder her.',
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
     * @return array{name_de: string, slug: string, swatch_hex: string|null, surcharge_cents: int, currency: string, is_default: bool, active: bool, sort_order: int}
     */
    public function colourAttributes(): array
    {
        $hex = $this->validated('swatchHex');

        return [
            'name_de' => (string) $this->validated('nameDe'),
            'slug' => (string) $this->validated('slug'),
            'swatch_hex' => is_string($hex) && $hex !== '' ? $hex : null,
            'surcharge_cents' => (int) $this->validated('surchargeCents'),
            'currency' => 'EUR',
            'is_default' => (bool) $this->validated('isDefault'),
            'active' => (bool) $this->validated('active'),
            'sort_order' => (int) $this->validated('sortOrder'),
        ];
    }

    private function colour(): ?BalanceWeightColour
    {
        $colour = $this->route('colour');

        return $colour instanceof BalanceWeightColour ? $colour : null;
    }

    /** `''` → null; otherwise upper-cased and `#`-prefixed, because chk_weight_colour_hex is case-sensitive. */
    private function hex(): ?string
    {
        $raw = strtoupper(trim($this->text('swatchHex')));

        if ($raw === '') {
            return null;
        }

        return str_starts_with($raw, '#') ? $raw : '#'.$raw;
    }

    /** A posted scalar as a string; anything that is not a scalar reads as the default. */
    private function text(string $key, string $default = ''): string
    {
        $value = $this->input($key, $default);

        return is_scalar($value) ? (string) $value : $default;
    }
}
