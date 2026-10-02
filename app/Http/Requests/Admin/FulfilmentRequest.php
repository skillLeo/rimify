<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\Order;
use App\Services\Admin\Orders\OrderFulfilment;
use Illuminate\Foundation\Http\FormRequest;

/**
 * „Versendet“ or „Zugestellt“ on an order (D-103), through OrderPolicy::update — and only where the step is one the
 * order can take now (the state machine's), never on a demonstration order. „Versendet“ may carry the parcel's
 * tracking number.
 */
class FulfilmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $order = $this->route('order');

        if (! $user instanceof AdminUser || ! $order instanceof Order || ! $user->can('update', $order)) {
            return false;
        }

        return $this->route()?->getName() === 'admin.bestellungen.zugestellt'
            ? OrderFulfilment::canDeliver($order)
            : OrderFulfilment::canShip($order);
    }

    protected function prepareForValidation(): void
    {
        $tracking = $this->input('tracking');

        $this->merge(['tracking' => is_string($tracking) ? trim($tracking) : null]);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return ['tracking' => ['nullable', 'string', 'max:64', 'regex:/^[A-Za-z0-9 -]*$/']];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'tracking.max' => 'Die Sendungsnummer darf höchstens 64 Zeichen lang sein.',
            'tracking.regex' => 'Die Sendungsnummer besteht aus Buchstaben, Ziffern, Leerzeichen und Bindestrichen.',
        ];
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser ? $user : abort(403);
    }

    public function tracking(): ?string
    {
        $tracking = $this->validated('tracking');

        return is_string($tracking) && $tracking !== '' ? $tracking : null;
    }
}
