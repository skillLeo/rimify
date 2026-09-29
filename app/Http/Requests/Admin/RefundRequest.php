<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\Order;
use App\Support\Money;
use Illuminate\Foundation\Http\FormRequest;

/**
 * „Erstatten“ on an order (Verkauf › Bestellungen): who may change orders, after the password again (sudo, on the
 * route). The amount comes as the German figure the field shows („1.234,56“) and is read into cents here, once; the
 * reason is printed on the credit note the customer gets. Whether the amount is still refundable is the service's
 * question (RefundOrder), asked under the order as it is now.
 */
class RefundRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $order = $this->route('order');

        return $user instanceof AdminUser && $order instanceof Order && ! $order->isDemo()
            && $user->may(PermissionModule::Orders, PermissionAction::Edit);
    }

    protected function prepareForValidation(): void
    {
        $raw = $this->input('amount');
        $cents = is_string($raw) ? Money::fromGerman($raw) : (is_int($raw) ? $raw : null);

        $this->merge(['amountCents' => $cents, 'reason' => is_string($this->input('reason')) ? trim((string) $this->input('reason')) : null]);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'amountCents' => ['required', 'integer', 'min:1'],
            'reason' => ['required', 'string', 'min:3', 'max:300'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'amountCents.*' => 'Gib den Betrag in Euro an, zum Beispiel 399,00.',
            'reason.required' => 'Schreib dazu, wofür erstattet wird – es steht auf der Gutschrift.',
            'reason.min' => 'Schreib dazu, wofür erstattet wird – es steht auf der Gutschrift.',
            'reason.max' => 'Der Grund darf höchstens 300 Zeichen lang sein.',
        ];
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser ? $user : abort(403);
    }

    public function amountCents(): int
    {
        return (int) $this->validated('amountCents');
    }

    public function reason(): string
    {
        return (string) $this->validated('reason');
    }
}
