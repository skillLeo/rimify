<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Erfassung;

use App\Models\ApprovalDocument;
use App\Models\DocumentWheelCombination;
use App\Models\DocumentWheelSize;
use App\Models\WheelConfig;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Step 2: one wheel combination, a front and a rear version, each named by a row of the catalogue — colour plays no part. One
 * Gutachten is for one specific wheel (the client's answer): both are versions of the paper's one model. A combination stands once.
 */
class EntryCombinationRequest extends EntryRequest
{
    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'front_config_id' => ['required', 'integer', Rule::exists('wheel_configs', 'id')->whereNull('deleted_at')],
            'rear_config_id' => ['required', 'integer', Rule::exists('wheel_configs', 'id')->whereNull('deleted_at')],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'front_config_id.required' => 'Wähl bitte die Ausführung für vorne.',
            'rear_config_id.required' => 'Wähl bitte die Ausführung für hinten.',
            'front_config_id.*' => 'Diese Ausführung gibt es nicht mehr.',
            'rear_config_id.*' => 'Diese Ausführung gibt es nicht mehr.',
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $document = $this->route('document');
                $front = $this->front();
                $rear = $this->rear();

                if ((int) $front->wheel_model_id !== (int) $rear->wheel_model_id) {
                    $validator->errors()->add('rear_config_id', 'Vorne und hinten müssen Ausführungen derselben Felge sein.');

                    return;
                }

                if (! $document instanceof ApprovalDocument) {
                    return;
                }

                $paper = DocumentWheelSize::query()->where('approval_document_id', $document->id)->distinct()->pluck('wheel_model_id')->map(static fn (mixed $id): int => (int) $id)->all();

                if ($paper !== [] && ! in_array((int) $front->wheel_model_id, $paper, true)) {
                    $validator->errors()->add('front_config_id', 'Ein Gutachten gilt für genau eine Felge. Diese ist eine andere als die der Kombinationen, die schon eingetragen sind.');

                    return;
                }

                $same = DocumentWheelCombination::query()->with(['front', 'rear'])->where('approval_document_id', $document->id)->get()
                    ->first(function (DocumentWheelCombination $combination) use ($front, $rear): bool {
                        return $combination->isNot($this->route('combination'))
                            && self::names($combination->front, $front) && self::names($combination->rear, $rear);
                    });

                if ($same !== null) {
                    $validator->errors()->add('front_config_id', 'Diese Kombination steht schon im Gutachten.');
                }
            },
        ];
    }

    public function front(): WheelConfig
    {
        return WheelConfig::query()->findOrFail((int) $this->input('front_config_id'));
    }

    public function rear(): WheelConfig
    {
        return WheelConfig::query()->findOrFail((int) $this->input('rear_config_id'));
    }

    private static function names(?DocumentWheelSize $size, WheelConfig $config): bool
    {
        if ($size === null) {
            return false;
        }

        foreach (DocumentWheelSize::DIMENSION as $column) {
            if ((float) $size->getAttribute($column) !== (float) $config->getAttribute($column)) {
                return false;
            }
        }

        return true;
    }
}
