<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Services\Admin\AuditDescriber;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * The Protokoll's filters, as they arrive in the query string: a person, an area, a day range.
 *
 * Reading the log is `audit_log` × `view`, asked here on the server (R-11). A filter value that does
 * not parse is refused with a German sentence and the page opens unfiltered, rather than silently
 * ignoring it and letting a person believe they are looking at one colleague's changes when they
 * are looking at everybody's.
 *
 * `person` is either an account id (the person who acted) or an e-mail address kept on the entry
 * itself — which is what still names somebody whose account was later renamed. Days are calendar
 * days in Europe/Berlin; the controller turns them into the UTC instants the table stores.
 */
class ProtokollFilterRequest extends FormRequest
{
    /** Refused filters land on the unfiltered page, never back on the URL that carried them. */
    protected $redirectRoute = 'admin.protokoll.index';

    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->may(PermissionModule::AuditLog, PermissionAction::View);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        $day = ['nullable', 'date_format:Y-m-d', 'after_or_equal:2000-01-01', 'before_or_equal:2099-12-31'];

        return [
            'person' => ['nullable', 'string', 'max:255', 'regex:/^(?:[1-9][0-9]{0,18}|[^\s@]+@[^\s@]+)$/u'],
            'bereich' => ['nullable', 'string', Rule::in(array_keys(AuditDescriber::AREAS))],
            'von' => $day,
            'bis' => $day,
            // The order (F-32): newest first is the plain log, `alt` reads it from the oldest entry on.
            'reihenfolge' => ['nullable', 'in:alt'],
            'seite' => ['nullable', 'integer', 'min:1', 'max:1000000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'person.*' => 'Diese Person gibt es im Protokoll nicht. Wähl bitte eine aus der Liste.',
            'bereich.*' => 'Diesen Bereich gibt es nicht. Wähl bitte einen aus der Liste.',
            'von.*' => 'Das Anfangsdatum ist kein gültiger Tag.',
            'bis.*' => 'Das Enddatum ist kein gültiger Tag.',
            'reihenfolge.*' => 'Diese Reihenfolge gibt es nicht. Das Protokoll zeigt die neuesten Einträge zuerst.',
            'seite.*' => 'Diese Seite gibt es im Protokoll nicht.',
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
     * The filters in force, each null where it is not set.
     *
     * @return array{person: string|null, bereich: string|null, von: string|null, bis: string|null}
     */
    public function filters(): array
    {
        return [
            'person' => $this->filled('person') ? (string) $this->validated('person') : null,
            'bereich' => $this->filled('bereich') ? (string) $this->validated('bereich') : null,
            'von' => $this->filled('von') ? (string) $this->validated('von') : null,
            'bis' => $this->filled('bis') ? (string) $this->validated('bis') : null,
        ];
    }

    /** The oldest entry first (F-32); the plain log is newest first. */
    public function oldestFirst(): bool
    {
        return $this->validated('reihenfolge') === 'alt';
    }

    public function page(): int
    {
        return $this->filled('seite') ? max(1, (int) $this->validated('seite')) : 1;
    }

    /** The signed-in admin; authorize() has already refused anyone else. */
    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }
}
