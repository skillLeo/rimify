<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\CatalogueStatus;
use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Services\Admin\Catalogue\WheelList;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Katalog › Felgen: the search, filters and sort as they arrive in the query string, so a view is a
 * link. Reading the catalogue is `catalogue` × `view`, asked here on the server (R-11). A value that
 * does not parse is refused with a German sentence and the list opens without it.
 *
 * @phpstan-import-type Filters from WheelList
 */
class FelgenFilterRequest extends FormRequest
{
    protected $redirectRoute = 'admin.felgen.index';

    protected function getRedirectUrl(): string
    {
        $view = $this->query('ansicht');

        return is_string($view) && ctype_digit($view)
            ? route($this->redirectRoute, ['ansicht' => $view])
            : route($this->redirectRoute);
    }

    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->may(PermissionModule::Catalogue, PermissionAction::View);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', Rule::in(CatalogueStatus::values())],
            'marke' => ['nullable', 'integer', 'min:1'],
            'freigaben' => ['nullable', Rule::in(WheelList::COVERAGE)],
            'demo' => ['nullable', 'in:ja,nein'],
            // The Felgen still without their Radtypenbezeichnung (D-298): the list to fill it in from.
            'radtyp' => ['nullable', 'in:fehlt'],
            'sort' => ['nullable', Rule::in(WheelList::SORTS)],
            'richtung' => ['nullable', 'in:auf,ab'],
            'seite' => ['nullable', 'integer', 'min:1', 'max:1000000'],
            'ansicht' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'q.*' => 'Der Suchbegriff ist zu lang. Such bitte nach Marke, Modell, SKU oder EAN.',
            'status.*' => 'Diesen Status gibt es nicht. Wähl bitte einen aus der Liste.',
            'marke.*' => 'Diese Marke gibt es nicht. Wähl bitte eine aus der Liste.',
            'freigaben.*' => 'Diesen Filter gibt es nicht. Wähl bitte einen aus der Liste.',
            'demo.*' => 'Diesen Filter gibt es nicht. Wähl bitte einen aus der Liste.',
            'radtyp.*' => 'Diesen Filter gibt es nicht. Wähl bitte einen aus der Liste.',
            'sort.*' => 'Nach diesem Feld lässt sich nicht sortieren.',
            'richtung.*' => 'Nach diesem Feld lässt sich nicht sortieren.',
            'seite.*' => 'Diese Seite gibt es nicht.',
            'ansicht.*' => 'Diese Ansicht gibt es nicht.',
        ];
    }

    /** @return Filters */
    public function filters(): array
    {
        $text = fn (string $key): ?string => $this->filled($key) ? trim((string) $this->validated($key)) : null;
        $q = $text('q');

        return [
            'q' => $q === '' ? null : $q,
            'status' => $text('status'),
            'marke' => $this->filled('marke') ? (int) $this->validated('marke') : null,
            'freigaben' => $text('freigaben'),
            'demo' => $text('demo'),
            'radtyp' => $text('radtyp'),
            'sort' => $text('sort') ?? 'name',
            'richtung' => $text('richtung') ?? 'auf',
        ];
    }

    /**
     * The query string exactly as it should read for these filters. Defaults are left out, so the
     * plain list is the bare URL.
     *
     * @return array<string, string>
     */
    public function canonical(): array
    {
        $query = [];

        foreach (['q', 'status', 'marke', 'freigaben', 'demo', 'radtyp'] as $key) {
            if ($this->filled($key)) {
                $query[$key] = trim((string) $this->validated($key));
            }
        }

        $filters = $this->filters();

        if ($filters['sort'] !== 'name' || $filters['richtung'] !== 'auf') {
            $query['sort'] = $filters['sort'];
            $query['richtung'] = $filters['richtung'];
        }

        return $query;
    }

    public function page(): int
    {
        return $this->filled('seite') ? max(1, (int) $this->validated('seite')) : 1;
    }

    public function view(): ?int
    {
        return $this->filled('ansicht') ? (int) $this->validated('ansicht') : null;
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
