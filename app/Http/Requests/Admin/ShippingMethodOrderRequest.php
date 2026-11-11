<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\ShippingMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * The order of Einstellungen › Versand (D-449): every method's id once, in the order the checkout offers them. Asked of
 * ShippingMethodPolicy (R-11).
 */
class ShippingMethodOrderRequest extends FormRequest
{
    public const INCOMPLETE = 'Die Reihenfolge passt nicht mehr zu den Versandarten. Lad die Seite neu und sortier noch einmal.';

    public function authorize(): bool
    {
        return $this->admin()->can('create', ShippingMethod::class);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['ids.required' => self::INCOMPLETE, 'ids.array' => self::INCOMPLETE, 'ids.min' => self::INCOMPLETE, 'ids.*' => self::INCOMPLETE];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $all = ShippingMethod::query()->pluck('id')->map(static fn (mixed $id): int => (int) $id)->sort()->values()->all();
            $sent = $this->ids();
            sort($sent);

            // Every method once: a list from an older page would put one of them nowhere.
            if ($sent !== $all) {
                $validator->errors()->add('ids', self::INCOMPLETE);
            }
        }];
    }

    /** @return list<int> */
    public function ids(): array
    {
        return array_values(array_map(static fn (mixed $id): int => (int) $id, (array) $this->input('ids')));
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');
        abort_unless($user instanceof AdminUser, 403);

        return $user;
    }
}
