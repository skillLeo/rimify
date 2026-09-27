<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\Order;
use Illuminate\Foundation\Http\FormRequest;

/** Opening one order (OrderPolicy::view): the orders right, asked on the server (R-11). */
class OrderViewRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $order = $this->route('order');

        return $user instanceof AdminUser && $order instanceof Order && $user->can('view', $order);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [];
    }
}
