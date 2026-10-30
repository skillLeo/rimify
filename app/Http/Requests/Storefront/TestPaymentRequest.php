<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Payments\Payments;
use Illuminate\Foundation\Http\FormRequest;

/**
 * The sandbox's payment page (SandboxGateway): reached only by its signed link, only where the review
 * is on, and only while the order still waits for its payment — a test order is paid once.
 */
class TestPaymentRequest extends FormRequest
{
    public const OUTCOMES = ['bezahlt', 'abgelehnt', 'abgebrochen'];

    public function authorize(): bool
    {
        return Payments::sandbox() && $this->order() instanceof Order;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return $this->isMethod('post') ? ['outcome' => ['required', 'in:'.implode(',', self::OUTCOMES)]] : [];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['outcome.*' => 'Bitte wähle, wie die Testzahlung ausgehen soll.'];
    }

    public function outcome(): string
    {
        return (string) $this->validated('outcome');
    }

    /** The order the link names, while it waits for its payment. */
    public function order(): ?Order
    {
        $number = $this->route('order');

        return is_string($number)
            ? Order::query()->where('public_id', $number)->where('status', OrderStatus::PendingPayment->value)->first()
            : null;
    }
}
