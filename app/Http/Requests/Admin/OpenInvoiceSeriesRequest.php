<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\PaymentSetting;
use App\Services\Commerce\InvoiceSeries;
use Illuminate\Foundation\Http\FormRequest;

/**
 * „Rechnungsnummern eröffnen“ (Einstellungen › Zahlung): the Super-Admin alone, after the password (EnsureSudo, on the
 * route). The two first numbers come from the client's own accounting — typed in, never defaulted — and the operator
 * confirms that they were checked against it: the opening cannot be undone (InvoiceSeries).
 */
class OpenInvoiceSeriesRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('update', PaymentSetting::class);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'first_invoice' => ['required', 'integer', 'min:1', 'max:'.InvoiceSeries::MAX_START],
            'first_credit_note' => ['required', 'integer', 'min:1', 'max:'.InvoiceSeries::MAX_START],
            'confirmed' => ['accepted'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'first_invoice.*' => 'Gib die erste Rechnungsnummer als ganze Zahl ab 1 ein, ohne „RE-“ – zum Beispiel 1043.',
            'first_credit_note.*' => 'Gib die erste Gutschriftnummer als ganze Zahl ein, ohne „GS-“ – 1, wenn es noch keine Gutschrift gab.',
            'confirmed.accepted' => 'Bestätige, dass du die Nummern mit der Buchhaltung abgeglichen hast.',
        ];
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');
        abort_unless($user instanceof AdminUser, 403);

        return $user;
    }

    public function firstInvoice(): int
    {
        return (int) $this->validated('first_invoice');
    }

    public function firstCreditNote(): int
    {
        return (int) $this->validated('first_credit_note');
    }
}
