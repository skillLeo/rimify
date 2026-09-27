<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Services\Admin\Dashboard\Period;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * The Übersicht's Zeitraum and comparison, from the query string — and remembered on the account,
 * so the next visit opens on the period this person last chose (BRIEF §4, „remembered“).
 *
 * Every signed-in admin may open the Übersicht; what it shows is decided by the role's rights, per
 * widget, in the controller. A Zeitraum that does not parse is refused with a sentence and the page
 * opens on the remembered one.
 */
class UebersichtRequest extends FormRequest
{
    protected $redirectRoute = 'admin.uebersicht';

    public function authorize(): bool
    {
        return $this->user('admin') instanceof AdminUser;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        $day = ['nullable', 'date_format:Y-m-d', 'after_or_equal:2000-01-01', 'before_or_equal:2099-12-31'];

        return [
            'zeitraum' => ['nullable', 'in:'.implode(',', [...Period::PRESETS, 'eigen'])],
            'von' => [...$day, 'required_if:zeitraum,eigen'],
            'bis' => [...$day, 'required_if:zeitraum,eigen'],
            'vergleich' => ['nullable', 'in:0,1'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'zeitraum.*' => 'Diesen Zeitraum gibt es nicht. Wähl bitte 7, 30 oder 90 Tage oder einen eigenen.',
            'von.*' => 'Für einen eigenen Zeitraum brauchen wir ein gültiges Anfangsdatum.',
            'bis.*' => 'Für einen eigenen Zeitraum brauchen wir ein gültiges Enddatum.',
            'vergleich.*' => 'Diesen Vergleich gibt es nicht.',
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $from = $this->input('von');
                $to = $this->input('bis');

                if (is_string($from) && is_string($to) && $from !== '' && $to !== '' && $to < $from && ! $validator->errors()->hasAny(['von', 'bis'])) {
                    $validator->errors()->add('bis', 'Das Enddatum liegt vor dem Anfangsdatum.');
                }
            },
        ];
    }

    /**
     * The period in force: the one asked for, else the one remembered, else the last 30 days. Asking
     * for one remembers it.
     *
     * @return array{period: Period, compare: bool}
     */
    public function choice(): array
    {
        $user = $this->admin();
        $preferences = is_array($user->preferences) ? $user->preferences : [];
        $stored = is_array($preferences['dashboard'] ?? null) ? $preferences['dashboard'] : [];

        $asked = $this->filled('zeitraum') || $this->filled('vergleich');

        $key = $this->filled('zeitraum') ? (string) $this->validated('zeitraum') : (is_string($stored['zeitraum'] ?? null) ? $stored['zeitraum'] : '30');
        $from = $this->filled('zeitraum') ? $this->validated('von') : ($stored['von'] ?? null);
        $to = $this->filled('zeitraum') ? $this->validated('bis') : ($stored['bis'] ?? null);
        $compare = $this->filled('vergleich') ? $this->validated('vergleich') === '1' : ($stored['vergleich'] ?? true) === true;

        $period = $key === 'eigen' && is_string($from) && is_string($to)
            ? Period::between($from, $to)
            : Period::preset($key === 'eigen' ? '30' : $key);

        if ($asked) {
            $user->rememberPreferences(['dashboard' => [
                'zeitraum' => $period->key,
                'von' => $period->key === 'eigen' ? $period->from->format('Y-m-d') : null,
                'bis' => $period->key === 'eigen' ? $period->to->format('Y-m-d') : null,
                'vergleich' => $compare,
            ]]);
        }

        return ['period' => $period, 'compare' => $compare];
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
