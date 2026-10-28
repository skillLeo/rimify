<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Enums\TyreSeason;
use App\Models\AdminUser;
use App\Services\Admin\Catalogue\TyreList;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Katalog › Reifen: the search and filters as they arrive in the query string, so a view is a link. Reading the catalogue
 * is `catalogue` × `view`, asked here on the server (R-11). A value that does not parse is refused with a German sentence
 * and the list opens without it.
 *
 * @phpstan-import-type Filters from TyreList
 */
class TyreFilterRequest extends FormRequest
{
    protected $redirectRoute = 'admin.reifen.index';

    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->may(PermissionModule::Catalogue, PermissionAction::View);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:80'],
            'marke' => ['nullable', 'integer', 'min:1'],
            'saison' => ['nullable', Rule::in(TyreSeason::values())],
            'zoll' => ['nullable', 'integer', 'between:13,24'],
            'stand' => ['nullable', Rule::in(array_keys(TyreList::STANDS))],
            'sort' => ['nullable', Rule::in(TyreList::SORTS)],
            'richtung' => ['nullable', 'in:auf,ab'],
            'seite' => ['nullable', 'integer', 'min:1', 'max:1000000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'q.*' => 'Der Suchbegriff ist zu lang. Such bitte nach Marke, Profil, Größe oder EPREL-Nummer.',
            'marke.*' => 'Diese Marke gibt es nicht. Wähl bitte eine aus der Liste.',
            'saison.*' => 'Diese Saison gibt es nicht. Wähl bitte eine aus der Liste.',
            'zoll.*' => 'Diesen Durchmesser gibt es nicht. Wähl bitte einen aus der Liste.',
            'stand.*' => 'Diesen Filter gibt es nicht. Wähl bitte einen aus der Liste.',
            'sort.*' => 'Nach diesem Feld lässt sich nicht sortieren.',
            'richtung.*' => 'Nach diesem Feld lässt sich nicht sortieren.',
            'seite.*' => 'Diese Seite gibt es nicht.',
        ];
    }

    /** @return Filters */
    public function filters(): array
    {
        $text = fn (string $key): ?string => $this->filled($key) ? trim((string) $this->validated($key)) : null;
        $q = $text('q');

        return [
            'q' => $q === '' ? null : $q,
            'marke' => $this->filled('marke') ? (int) $this->validated('marke') : null,
            'saison' => $text('saison'),
            'zoll' => $this->filled('zoll') ? (int) $this->validated('zoll') : null,
            'stand' => $text('stand'),
            'sort' => $text('sort') ?? 'reifen',
            'richtung' => $text('richtung') ?? 'auf',
        ];
    }

    /**
     * The query string exactly as it should read for these filters; the plain list is the bare URL. The order is kept
     * only where it is not the plain list's (F-32), so a page link carries it.
     *
     * @return array<string, string>
     */
    public function canonical(): array
    {
        $query = [];

        foreach (['q', 'marke', 'saison', 'zoll', 'stand'] as $key) {
            if ($this->filled($key)) {
                $query[$key] = trim((string) $this->validated($key));
            }
        }

        $filters = $this->filters();

        if ($filters['sort'] !== 'reifen' || $filters['richtung'] !== 'auf') {
            $query['sort'] = $filters['sort'];
            $query['richtung'] = $filters['richtung'];
        }

        return $query;
    }

    public function page(): int
    {
        return $this->filled('seite') ? max(1, (int) $this->validated('seite')) : 1;
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
