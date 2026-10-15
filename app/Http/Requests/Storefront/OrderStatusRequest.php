<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use App\Models\Order;
use App\Services\Commerce\OrderAccess;
use Illuminate\Foundation\Http\FormRequest;

/**
 * The confirmation page's question „is it paid yet?“ (/bestellung/{order}/status). Answered by the rule the page itself
 * follows (OrderAccess): anyone it does not admit gets the same 404 as an order that does not exist.
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

        abort_unless($order !== null && OrderAccess::allows($this, $order), 404);

        return $this->order = $order;
    }
}
