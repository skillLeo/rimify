<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Domain\Fitment\Data\ConflictDecision;
use App\Models\AdminUser;
use App\Models\FitmentConflict;
use App\Services\Admin\Approvals\ConflictDecisions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * A person's decision on a Konflikt (the corrections memo §3): for one car and one wheel, „beide gelten
 * jeweils für sich“ or „nur Dokument X gilt“ — X one of the documents in the conflict — always with the
 * reason. Asked of FitmentConflictPolicy::decide (R-11).
 */
class KonfliktDecisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('decide', FitmentConflict::class);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'vehicle_id' => ['required', 'integer'],
            'wheel_config_id' => ['required', 'integer'],
            'mode' => ['required', Rule::in([ConflictDecision::EACH, ConflictDecision::ONLY])],
            'document_id' => ['nullable', 'required_if:mode,'.ConflictDecision::ONLY, 'integer'],
            'reason' => ['required', 'string', 'min:10', 'max:1000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'mode.*' => 'Bitte wähl, wie die beiden Gutachten gelten.',
            'document_id.*' => 'Bitte wähl das Gutachten, das gilt.',
            'reason.required' => 'Bitte schreib dazu, warum – zum Beispiel, was der Hersteller oder die Prüfstelle gesagt hat.',
            'reason.min' => 'Der Grund ist zu kurz. Schreib ihn so, dass ihn jemand ohne dich versteht.',
            'reason.max' => 'Der Grund darf höchstens 1.000 Zeichen lang sein.',
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->hasAny(['vehicle_id', 'wheel_config_id'])) {
                    return;
                }

                $documents = ConflictDecisions::documentsOf((int) $this->input('vehicle_id'), (int) $this->input('wheel_config_id'));

                if ($documents === []) {
                    $validator->errors()->add('mode', 'Zu diesem Fahrzeug und dieser Felge ist kein Konflikt mehr offen.');

                    return;
                }

                if ($this->input('mode') === ConflictDecision::ONLY && ! $validator->errors()->has('document_id') && ! in_array((int) $this->input('document_id'), $documents, true)) {
                    $validator->errors()->add('document_id', 'Dieses Gutachten gehört nicht zu dem Konflikt.');
                }
            },
        ];
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
