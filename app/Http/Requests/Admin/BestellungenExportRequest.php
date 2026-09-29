<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Services\Admin\ListExport;

/**
 * The Bestellungen export: the list's own filters, plus the file format, and the right to take
 * customer data away — `orders` × `export`, on top of reading (R-11).
 */
class BestellungenExportRequest extends BestellungenFilterRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser
            && $user->may(PermissionModule::Orders, PermissionAction::View)
            && $user->may(PermissionModule::Orders, PermissionAction::Export);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [...parent::rules(), 'format' => ['required', 'in:'.implode(',', ListExport::FORMATS)]];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [...parent::messages(), 'format.*' => 'Dieses Dateiformat gibt es nicht. Wähl bitte CSV oder Excel.'];
    }

    /** `csv` or `xlsx` — not `format()`, which the framework's Request already means otherwise. */
    public function fileFormat(): string
    {
        return (string) $this->validated('format');
    }
}
