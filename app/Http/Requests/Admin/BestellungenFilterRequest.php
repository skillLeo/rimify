<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\OrderStatus;
use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Services\Admin\Orders\OrderList;
use App\Support\GermanFormat;
use App\Support\Money;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Verkauf › Bestellungen: the filters, search and sort as they arrive in the query string, so a view
 * is a link a colleague can open (BRIEF „Every list“).
 *
 * Reading orders is `orders` × `view`, asked here on the server (R-11); the export asks for `export`
 * on top (BestellungenExportRequest). A value that does not parse is refused with a German sentence
 * and the list opens unfiltered, rather than quietly ignoring it and letting somebody believe they
 * see the paid orders when they see all of them. Amounts are typed the German way (`1.425,00`) and
 * read by Money::fromGerman, which refuses what it cannot read unambiguously.
 *
 * @phpstan-import-type Filters from OrderList
 */
class BestellungenFilterRequest extends FormRequest
{
    /** The Zeitraum presets, counted back from today in Berlin: today, the last 7, the last 30 days. */
    public const PRESETS = ['heute', '7', '30'];

    protected $redirectRoute = 'admin.bestellungen.index';

    /**
     * A refused filter opens the list without it — and still in the Gespeicherte Ansicht it came from,
     * so a view whose filters the list no longer takes can be opened, saved over or deleted.
     */
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

        return $user instanceof AdminUser && $user->may(PermissionModule::Orders, PermissionAction::View);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        $day = ['nullable', 'date_format:Y-m-d', 'after_or_equal:2000-01-01', 'before_or_equal:2099-12-31'];
        $method = ['nullable', 'string', 'max:32', 'regex:/^[a-z0-9_]+$/'];

        return [
            'q' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', 'string', Rule::in([OrderList::OPEN, OrderList::PAID, ...OrderStatus::values()])],
            // A Zeitraum counted back from today: stays „die letzten 7 Tage“ in a view saved last month.
            'zeitraum' => ['nullable', Rule::in(self::PRESETS)],
            'von' => $day,
            'bis' => $day,
            'zahlart' => $method,
            'versandart' => $method,
            'min' => ['nullable', 'string', 'max:24'],
            'max' => ['nullable', 'string', 'max:24'],
            'auflagen' => ['nullable', 'in:1'],
            'sort' => ['nullable', Rule::in(OrderList::SORTS)],
            'richtung' => ['nullable', 'in:auf,ab'],
            'seite' => ['nullable', 'integer', 'min:1', 'max:1000000'],
            // The Gespeicherte Ansicht the filters came from (ListViews): only marks it on the page.
            'ansicht' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'q.*' => 'Der Suchbegriff ist zu lang. Such bitte nach Nummer, Name, E-Mail oder Fahrzeug.',
            'status.*' => 'Diesen Status gibt es nicht. Wähl bitte einen aus der Liste.',
            'zeitraum.*' => 'Diesen Zeitraum gibt es nicht. Wähl bitte einen aus der Liste.',
            'von.*' => 'Das Anfangsdatum ist kein gültiger Tag.',
            'bis.*' => 'Das Enddatum ist kein gültiger Tag.',
            'zahlart.*' => 'Diese Zahlart gibt es nicht. Wähl bitte eine aus der Liste.',
            'versandart.*' => 'Diese Versandart gibt es nicht. Wähl bitte eine aus der Liste.',
            'min.*' => 'Den Mindestbetrag können wir nicht lesen. Schreib ihn bitte so: 100 oder 1.425,50.',
            'max.*' => 'Den Höchstbetrag können wir nicht lesen. Schreib ihn bitte so: 100 oder 1.425,50.',
            'auflagen.*' => 'Diesen Filter gibt es nicht.',
            'sort.*' => 'Nach diesem Feld lässt sich nicht sortieren.',
            'richtung.*' => 'Nach diesem Feld lässt sich nicht sortieren.',
            'seite.*' => 'Diese Seite gibt es nicht.',
            'ansicht.*' => 'Diese Ansicht gibt es nicht.',
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                foreach (['min' => 'Mindestbetrag', 'max' => 'Höchstbetrag'] as $field => $name) {
                    $raw = $this->input($field);

                    if (is_string($raw) && trim($raw) !== '' && ! $validator->errors()->has($field) && Money::fromGerman($raw) === null) {
                        $validator->errors()->add($field, "Den {$name} können wir nicht lesen. Schreib ihn bitte so: 100 oder 1.425,50.");
                    }
                }

                $from = $this->input('von');
                $to = $this->input('bis');

                if (is_string($from) && is_string($to) && $from !== '' && $to !== '' && $to < $from && ! $validator->errors()->hasAny(['von', 'bis'])) {
                    $validator->errors()->add('bis', 'Das Enddatum liegt vor dem Anfangsdatum.');
                }

                $min = is_string($this->input('min')) ? Money::fromGerman((string) $this->input('min')) : null;
                $max = is_string($this->input('max')) ? Money::fromGerman((string) $this->input('max')) : null;

                if ($min !== null && $max !== null && $max < $min && ! $validator->errors()->hasAny(['min', 'max'])) {
                    $validator->errors()->add('max', 'Der Höchstbetrag liegt unter dem Mindestbetrag.');
                }
            },
        ];
    }

    /**
     * The filters in force, each null where it is not set.
     *
     * @return Filters
     */
    public function filters(): array
    {
        $text = fn (string $key): ?string => $this->filled($key) ? trim((string) $this->validated($key)) : null;
        $money = fn (string $key): ?int => $this->filled($key) ? Money::fromGerman((string) $this->validated($key)) : null;

        $q = $text('q');
        $range = $this->presetRange();

        return [
            'q' => $q === '' ? null : $q,
            'status' => $text('status'),
            'von' => $range['von'] ?? $text('von'),
            'bis' => $range['bis'] ?? $text('bis'),
            'zahlart' => $text('zahlart'),
            'versandart' => $text('versandart'),
            'min' => $money('min'),
            'max' => $money('max'),
            'auflagen' => $this->filled('auflagen'),
            'sort' => $text('sort') ?? 'datum',
            'richtung' => $text('richtung') ?? 'ab',
        ];
    }

    /**
     * The query string exactly as it should read for these filters: what the page links to, what
     * the export carries, what a saved view keeps. Defaults are left out, so the plain list is the
     * bare URL.
     *
     * @return array<string, string>
     */
    public function canonical(): array
    {
        $query = [];
        // A preset stands for its days: the link keeps the preset, never the dates it meant today.
        $keys = $this->filled('zeitraum')
            ? ['q', 'status', 'zeitraum', 'zahlart', 'versandart', 'min', 'max']
            : ['q', 'status', 'von', 'bis', 'zahlart', 'versandart', 'min', 'max'];

        foreach ($keys as $key) {
            if ($this->filled($key)) {
                $query[$key] = trim((string) $this->validated($key));
            }
        }

        if ($this->filled('auflagen')) {
            $query['auflagen'] = '1';
        }

        $filters = $this->filters();

        if ($filters['sort'] !== 'datum' || $filters['richtung'] !== 'ab') {
            $query['sort'] = $filters['sort'];
            $query['richtung'] = $filters['richtung'];
        }

        return $query;
    }

    /** The Zeitraum preset in force, or null. */
    public function preset(): ?string
    {
        return $this->filled('zeitraum') ? (string) $this->validated('zeitraum') : null;
    }

    /**
     * The days a preset stands for today, in Berlin; null without one.
     *
     * @return array{von: string, bis: string}|null
     */
    private function presetRange(): ?array
    {
        $preset = $this->preset();

        if ($preset === null) {
            return null;
        }

        $today = CarbonImmutable::now(GermanFormat::TIMEZONE)->startOfDay();
        $back = $preset === 'heute' ? 0 : (int) $preset - 1;

        return ['von' => $today->subDays($back)->format('Y-m-d'), 'bis' => $today->format('Y-m-d')];
    }

    public function page(): int
    {
        return $this->filled('seite') ? max(1, (int) $this->validated('seite')) : 1;
    }

    /** The Gespeicherte Ansicht named in the URL, if one is. */
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
