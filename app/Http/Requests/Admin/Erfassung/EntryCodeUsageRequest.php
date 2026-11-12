<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Erfassung;

use App\Services\Admin\Approvals\DocumentConditions;

/**
 * Step 4: where a code of the paper stands, asked before „Überall löschen“ (the client's request of 12.11.2026, G; D-461). Who may
 * ask is who may delete: who may edit this draft (EntryRequest, R-11).
 */
class EntryCodeUsageRequest extends EntryRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge(['code' => DocumentConditions::normaliseCode($this->input('code'))]);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return ['code' => ['required', 'string', 'max:32', 'regex:'.DocumentConditions::CODE]];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['code.*' => DocumentConditions::CODE_MESSAGE];
    }

    public function code(): string
    {
        return (string) $this->validated('code');
    }
}
