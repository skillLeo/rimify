<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Services\Admin\Dashboard\Demand;

/**
 * Übersicht › Nachfrage: the Übersicht's own Zeitraum — the same one, remembered on the same account,
 * so the list and the Übersicht never disagree about which days they count — and which gaps to show
 * (`stand`). Reading it is the Gutachten right: the gaps are Gutachten to obtain.
 */
class NachfrageRequest extends UebersichtRequest
{
    protected $redirectRoute = 'admin.nachfrage.index';

    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->may(PermissionModule::Approvals, PermissionAction::View);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [...parent::rules(), 'stand' => ['nullable', 'in:'.implode(',', array_keys(Demand::STATES))], 'q' => ['nullable', 'string', 'max:100']];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [...parent::messages(), 'stand.*' => 'Diese Auswahl gibt es nicht. Gezeigt werden die offenen Lücken.', 'q.*' => 'Der Suchbegriff ist zu lang. Such bitte nach Fahrzeug, HSN oder TSN.'];
    }

    public function state(): string
    {
        return $this->filled('stand') ? (string) $this->validated('stand') : 'offen';
    }

    /** What the list is searched for — a car or key numbers (the admin audit's F-31); '' for none. */
    public function search(): string
    {
        return $this->filled('q') ? trim((string) $this->validated('q')) : '';
    }
}
