<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\DocumentTyreCombination;
use App\Models\Vehicle;
use App\Services\Admin\Approvals\CombinationEntries;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * „Auf mehrere EG-Nummern anwenden“ (his admin item 19, D-358): one combination of a draft Gutachten put on several
 * other entries of its Verwendungsbereich at once. The combination must be the document's own, every target one of its
 * entries and none of them the combination's own. Authorised by ApprovalDocumentPolicy::update (R-11).
 */
class DocumentCombinationsApplyRequest extends FormRequest
{
    /** A combination that is not (or no longer) this document's: the page was opened before someone else's save. */
    public const GONE = 'Diese Kombination ist bei uns zu diesem Gutachten nicht hinterlegt. Lade die Seite neu und versuch es noch einmal.';

    /** @var string */
    protected $errorBag = 'kombinationen';

    public function authorize(): bool
    {
        $user = $this->user('admin');
        $document = $this->route('document');

        return $user instanceof AdminUser && $document instanceof ApprovalDocument && $user->can('update', $document);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'combination' => ['required', 'integer'],
            'targets' => ['required', 'array', 'min:1', 'max:200'],
            'targets.*' => ['required', 'string', 'max:64', 'distinct'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'combination.*' => self::GONE,
            'targets.required' => 'Wähl mindestens eine EG-Nummer aus.',
            'targets.min' => 'Wähl mindestens eine EG-Nummer aus.',
            'targets.*' => 'Zu dieser EG-Typgenehmigungsnummer ist bei uns kein Fahrzeug dieses Gutachtens erfasst.',
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $document = $this->route('document');

                if (! $document instanceof ApprovalDocument || $validator->errors()->isNotEmpty()) {
                    return;
                }

                $source = $this->combinationOrNull();

                if ($source === null) {
                    $validator->errors()->add('combination', self::GONE);

                    return;
                }

                $entries = CombinationEntries::of($document->id);

                foreach ($this->targets() as $i => $target) {
                    if (! in_array($target, $entries, true) || $target === $source->eg_number_norm) {
                        $validator->errors()->add("targets.{$i}", 'Zu dieser EG-Typgenehmigungsnummer ist bei uns kein Fahrzeug dieses Gutachtens erfasst.');
                    }
                }
            },
        ];
    }

    private function combinationOrNull(): ?DocumentTyreCombination
    {
        $document = $this->route('document');

        return $document instanceof ApprovalDocument
            ? DocumentTyreCombination::query()->where('approval_document_id', $document->id)->whereKey((int) $this->input('combination'))->whereNotNull('eg_number_norm')->first()
            : null;
    }

    public function combination(): DocumentTyreCombination
    {
        return $this->combinationOrNull() ?? abort(404);
    }

    /** @return list<string> the target entries, read as every EG number is */
    public function targets(): array
    {
        return array_values(array_map(static fn (mixed $t): string => (string) Vehicle::normaliseEcNumber(is_string($t) ? $t : ''), (array) $this->input('targets', [])));
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
