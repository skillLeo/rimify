<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Models\Vehicle;
use Illuminate\Foundation\Http\FormRequest;

/**
 * The Gutachten steps that carry no form of their own, each authorised on the server (R-11); the route
 * names the step:
 *
 *   - gutachten.create — the empty form (`approvals` × create);
 *   - gutachten.show — one document, with the preview for a chosen vehicle (`approvals` × view);
 *   - gutachten.freigeben — the release (`approvals` × publish, a draft only);
 *   - gutachten.zeile.entfernen — one row taken out (editing a draft; the row must be the document's);
 *   - gutachten.suche.fahrzeuge / .felgen — finding what the rows are about.
 */
class ApprovalStepRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            return false;
        }

        $document = $this->route('document');
        $row = $this->route('fitment');

        return match ($this->step()) {
            'create' => $user->can('create', ApprovalDocument::class),
            'freigeben' => $document instanceof ApprovalDocument && $user->can('publish', $document),
            'entfernen' => $document instanceof ApprovalDocument && $row instanceof Fitment && $row->approval_document_id === $document->id && $user->can('update', $document),
            'fahrzeuge' => $user->can('search', Vehicle::class),
            default => $user->can('viewAny', ApprovalDocument::class),
        };
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return match ($this->step()) {
            'fahrzeuge', 'felgen' => ['q' => ['nullable', 'string', 'max:80']],
            'show' => ['fahrzeug' => ['nullable', 'integer', 'min:1']],
            default => [],
        };
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'q.*' => 'Der Suchbegriff ist zu lang.',
            'fahrzeug.*' => 'Dieses Fahrzeug gibt es nicht.',
        ];
    }

    public function step(): string
    {
        $name = (string) $this->route()?->getName();

        return substr($name, (int) strrpos($name, '.') + 1);
    }

    public function term(): string
    {
        return trim((string) ($this->validated('q') ?? ''));
    }

    public function vehicleId(): ?int
    {
        return $this->validated('fahrzeug') === null ? null : (int) $this->validated('fahrzeug');
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }
}
