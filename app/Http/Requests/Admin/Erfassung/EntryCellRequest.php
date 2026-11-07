<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Erfassung;

use App\Models\ApprovalDocument;
use App\Models\DocumentCarEntry;
use App\Models\DocumentWheelCombination;
use Illuminate\Validation\Validator;

/** Step 5: a car taken back into a wheel combination of this paper. It must be on the paper, and not in that combination yet. */
class EntryCellRequest extends EntryRequest
{
    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'vehicle_id' => ['required', 'integer'],
            'combination_id' => ['required', 'integer'],
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $document = $this->route('document');

                if ($validator->errors()->isNotEmpty() || ! $document instanceof ApprovalDocument) {
                    return;
                }

                if (DocumentWheelCombination::query()->where('approval_document_id', $document->id)->whereKey((int) $this->input('combination_id'))->doesntExist()) {
                    $validator->errors()->add('combination_id', 'Diese Felgenkombination steht nicht mehr in dieser Erfassung.');

                    return;
                }

                $cars = DocumentCarEntry::query()->where('approval_document_id', $document->id)->where('vehicle_id', (int) $this->input('vehicle_id'));

                if ((clone $cars)->doesntExist()) {
                    $validator->errors()->add('vehicle_id', 'Dieses Fahrzeug steht nicht mehr in dieser Erfassung.');
                } elseif ($cars->where('document_wheel_combination_id', (int) $this->input('combination_id'))->exists()) {
                    $validator->errors()->add('combination_id', 'Dieses Fahrzeug steht schon bei dieser Felgenkombination.');
                }
            },
        ];
    }

    public function combination(): DocumentWheelCombination
    {
        return DocumentWheelCombination::query()->findOrFail((int) $this->validated('combination_id'));
    }

    public function vehicle(): int
    {
        return (int) $this->validated('vehicle_id');
    }
}
