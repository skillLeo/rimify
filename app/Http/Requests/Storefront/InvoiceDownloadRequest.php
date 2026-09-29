<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use App\Models\Invoice;
use Illuminate\Foundation\Http\FormRequest;

/**
 * An invoice download. The signature on the link is the permission (the route's `signed` middleware); this names
 * the invoice, and one that does not exist is the same 404 as a link that was never issued.
 */
class InvoiceDownloadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->hasValidSignature();
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [];
    }

    public function invoice(): Invoice
    {
        return Invoice::query()->where('number', (string) $this->route('number'))->firstOrFail();
    }
}
