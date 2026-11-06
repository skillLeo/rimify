<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Erfassung;

use App\Models\ApprovalDocument;
use App\Models\DocumentWheelSize;
use App\Models\WheelConfig;
use App\Support\PrintedWheel;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Step 2: the paper's one wheel size — a row of the catalogue names its dimension, colour plays no part — and what the paper
 * prints for the wheel, read only to warn staff when the two differ.
 */
class EntryWheelRequest extends EntryRequest
{
    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'wheel_config_id' => ['required', 'integer', Rule::exists('wheel_configs', 'id')->whereNull('deleted_at')],
            'printed_type' => ['nullable', 'string', 'max:64'],
            'printed_size' => ['nullable', 'string', 'max:32'],
            'printed_et' => ['nullable', 'integer', 'min:-99', 'max:99'],
            'printed_bolts' => ['nullable', 'string', 'max:16'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'wheel_config_id.required' => 'Wähl bitte die Felgengröße dieses Gutachtens.',
            'wheel_config_id.*' => 'Diese Felgengröße gibt es nicht mehr.',
            'printed_type.max' => 'Der Radtyp darf höchstens 64 Zeichen lang sein.',
            'printed_et.*' => 'Die Einpresstiefe bitte als ganze Zahl, zwischen −99 und 99.',
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $document = $this->route('document');

                // A paper entered before the five steps can name several sizes. It stays as it is: nothing here chooses for it.
                if ($document instanceof ApprovalDocument && DocumentWheelSize::query()->where('approval_document_id', $document->id)->count() > 1) {
                    $validator->errors()->add('wheel_config_id', 'Bei diesem Gutachten sind schon mehrere Felgengrößen hinterlegt. Eine neue Größe wählst du in einem eigenen Gutachten.');
                }

                $size = $this->text('printed_size');

                if ($size !== null && PrintedWheel::size($size) === null) {
                    $validator->errors()->add('printed_size', 'Die Radgröße können wir nicht lesen. Schreib sie etwa so: 8 1/2 J X 18 H2 oder 8,5 × 18.');
                }

                $bolts = $this->text('printed_bolts');

                if ($bolts !== null && PrintedWheel::bolts($bolts) === null) {
                    $validator->errors()->add('printed_bolts', 'Den Lochkreis können wir nicht lesen. Schreib ihn etwa so: 120/5 oder 5 × 120.');
                }
            },
        ];
    }

    public function config(): WheelConfig
    {
        return WheelConfig::query()->findOrFail((int) $this->validated('wheel_config_id'));
    }

    /** @return array{printed_type: string|null, printed_width_in: float|null, printed_diameter_in: float|null, printed_et_mm: int|null, printed_bolt_holes: int|null, printed_bolt_circle_mm: float|null} */
    public function printed(): array
    {
        $size = $this->text('printed_size');
        $bolts = $this->text('printed_bolts');
        $readSize = $size === null ? null : PrintedWheel::size($size);
        $readBolts = $bolts === null ? null : PrintedWheel::bolts($bolts);
        $et = $this->validated('printed_et');

        return [
            'printed_type' => $this->text('printed_type'),
            'printed_width_in' => $readSize['width'] ?? null,
            'printed_diameter_in' => $readSize['diameter'] ?? null,
            'printed_et_mm' => $et === null ? null : (int) $et,
            'printed_bolt_holes' => $readBolts['holes'] ?? null,
            'printed_bolt_circle_mm' => $readBolts['circle'] ?? null,
        ];
    }

    private function text(string $key): ?string
    {
        $value = $this->input($key);

        return is_string($value) && trim($value) !== '' ? trim($value) : null;
    }
}
