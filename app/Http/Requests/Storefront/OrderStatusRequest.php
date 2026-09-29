<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use App\Http\Controllers\Storefront\BestellungController;
use App\Models\CustomerAccount;
use App\Models\Order;
use Illuminate\Foundation\Http\FormRequest;

/**
 * The confirmation page's question „is it paid yet?“ (/bestellung/{order}/status). Answered for the browser that
 * placed the order, or through a signed link — the rule the page itself follows; anyone else gets the same 404 as an
 * order that does not exist.
 */
class OrderStatusRequest extends FormRequest
{
    private ?Order $order = null;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [];
    }

    public function order(): Order
    {
        if ($this->order !== null) {
            return $this->order;
        }

        $number = (string) $this->route('order');
        $order = Order::query()->where('order_number', $number)->first();
        $placed = $this->session()->get(BestellungController::SESSION_PLACED);

        $account = $this->user('customer');
        $owner = $account instanceof CustomerAccount && $order !== null && mb_strtolower((string) $order->customer?->email) === $account->email;

        abort_unless(
            $order !== null && ($order->isDemo() || $this->hasValidSignature() || (is_array($placed) && in_array($order->order_number, $placed, true)) || $owner),
            404,
        );

        return $this->order = $order;
    }
}
