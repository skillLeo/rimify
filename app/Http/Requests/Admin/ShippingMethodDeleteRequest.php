<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\ShippingMethod;
use Illuminate\Foundation\Http\FormRequest;

/**
 * A shipping method deleted from Einstellungen › Versand (the client's review of 11.11, F; D-454). Asked of ShippingMethodPolicy
 * (R-11); nothing to validate — the method is the route's.
 */
class ShippingMethodDeleteRequest extends FormRequest
{
    public function authorize(): bool
    {
        $method = $this->route('method');

        return $method instanceof ShippingMethod && $this->admin()->can('delete', $method);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [];
    }

    public function admin(): AdminUser
    {
        /** @var AdminUser */
        return $this->user('admin');
    }
}
