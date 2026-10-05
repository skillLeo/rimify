<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Services\GoLive\GoLiveCheck;
use App\Services\GoLive\GoLiveChecks;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Opening System › Was fehlt: the settings right (GoLivePolicy). One optional choice, whose items to show — the
 * client's by default (the operator's brief of 05.10.2026, §7) — and nothing that changes anything.
 */
class WasFehltRequest extends FormRequest
{
    /** `?wer=` — whose items; `alle` for every check. */
    public const OWNERS = [GoLiveCheck::CLIENT, GoLiveCheck::US, GoLiveCheck::HOST, 'alle'];

    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('view', GoLiveChecks::class);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return ['wer' => ['sometimes', 'string', 'in:'.implode(',', self::OWNERS)]];
    }

    public function owner(): string
    {
        $owner = $this->validated('wer');

        return is_string($owner) ? $owner : GoLiveCheck::CLIENT;
    }
}
