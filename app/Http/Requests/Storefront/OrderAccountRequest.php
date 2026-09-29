<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use App\Http\Controllers\Storefront\BestellungController;
use App\Models\Order;
use Illuminate\Foundation\Http\FormRequest;

/**
 * „Konto anlegen“ on the confirmation page: only the browser that placed the order, only once it is paid, never for
 * a seeded one. The address is the order's own — nothing is typed.
 */
class OrderAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        $order = $this->order();
        $placed = $this->session()->get(BestellungController::SESSION_PLACED);

        return $order !== null && ! $order->isDemo() && $order->status->isPaid()
            && is_array($placed) && in_array($order->order_number, $placed, true);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [];
    }

    public function order(): ?Order
    {
        return Order::query()->with('customer')->where('order_number', (string) $this->route('order'))->first();
    }
}
