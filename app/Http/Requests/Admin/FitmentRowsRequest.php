<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\Axle;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Services\Admin\Approvals\FitmentRows;
use App\Support\GermanNumber;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Rows of a Gutachten's Verwendungsbereich: added for every vehicle × size chosen (store), or one row
 * changed (update). Authorised by ApprovalDocumentPolicy — editing a draft; a row must belong to the
 * document in the URL.
 *
 * Every row carries at least one tyre size: without one the shop cannot name a tyre, and the
 * Freigabe would be refused anyway. An Auflage is chosen from the Auflagen-Katalog — its sentence is
 * written there once (R-15) — with an optional note for what this document adds.
 *
 * @phpstan-import-type RowSpec from FitmentRows
 */
class FitmentRowsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $document = $this->route('document');
        $row = $this->route('fitment');

        if (! $user instanceof AdminUser || ! $document instanceof ApprovalDocument) {
            return false;
        }

        if ($row !== null && (! $row instanceof Fitment || $row->approval_document_id !== $document->id)) {
            return false;
        }

        return $user->can('update', $document);
    }

    private function adding(): bool
    {
        return $this->route('fitment') === null;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        $axles = Axle::values();

        return [
            'vehicle_ids' => [$this->adding() ? 'required' : 'prohibited', 'array', 'min:1', 'max:200'],
            'vehicle_ids.*' => ['integer', 'distinct', Rule::exists('vehicles', 'id')->whereNull('deleted_at')],
            'config_ids' => [$this->adding() ? 'required' : 'prohibited', 'array', 'min:1', 'max:200'],
            'config_ids.*' => ['integer', 'distinct', Rule::exists('wheel_configs', 'id')->whereNull('deleted_at')],
            'axle' => ['required', Rule::in($axles)],
            'requires_entry' => ['required', 'boolean'],
            'entry_note' => ['nullable', 'string', 'max:500'],
            'source_page' => ['nullable', 'integer', 'min:1', 'max:2000'],
            'build_from' => ['nullable', 'date_format:Y-m-d'],
            'build_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:build_from'],
            'width_min' => ['nullable', 'string', 'max:8'],
            'width_max' => ['nullable', 'string', 'max:8'],
            'et_min' => ['nullable', 'string', 'max:6'],
            'et_max' => ['nullable', 'string', 'max:6'],
            'centre_bore' => ['nullable', 'string', 'max:8'],
            'tyre_sizes' => ['required', 'array', 'min:1', 'max:20'],
            'tyre_sizes.*.width_mm' => ['required', 'integer', 'min:125', 'max:355'],
            'tyre_sizes.*.aspect' => ['required', 'integer', 'min:25', 'max:85'],
            'tyre_sizes.*.diameter' => ['required', 'integer', 'min:12', 'max:26'],
            'tyre_sizes.*.min_load_index' => ['nullable', 'integer', Rule::exists('load_index_table', 'load_index')],
            'tyre_sizes.*.min_speed_symbol' => ['nullable', 'string', Rule::exists('speed_symbol_table', 'symbol')],
            'tyre_sizes.*.axle' => ['required', Rule::in($axles)],
            'conditions' => ['present', 'array', 'max:20'],
            'conditions.*.id' => ['required', 'integer', 'distinct', Rule::exists('condition_codes', 'id')],
            'conditions.*.note' => ['nullable', 'string', 'max:300'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'vehicle_ids.required' => 'Wähl bitte mindestens ein Fahrzeug.',
            'vehicle_ids.min' => 'Wähl bitte mindestens ein Fahrzeug.',
            'vehicle_ids.max' => 'Höchstens 200 Fahrzeuge auf einmal.',
            'vehicle_ids.*' => 'Eines der gewählten Fahrzeuge gibt es nicht mehr.',
            'config_ids.required' => 'Wähl bitte mindestens eine Felgengröße.',
            'config_ids.min' => 'Wähl bitte mindestens eine Felgengröße.',
            'config_ids.max' => 'Höchstens 200 Felgengrößen auf einmal.',
            'config_ids.*' => 'Eine der gewählten Felgengrößen gibt es nicht mehr.',
            'axle.*' => 'Bitte wähl die Achse.',
            'requires_entry.*' => 'Bitte sag, ob eine Eintragung nötig ist.',
            'entry_note.max' => 'Der Hinweis zur Eintragung darf höchstens 500 Zeichen lang sein.',
            'source_page.*' => 'Die Seite bitte als ganze Zahl ab 1.',
            'build_from.*' => 'Den Anfang des Bauzeitraums können wir nicht lesen. Schreib ihn bitte so: 01.03.2019.',
            'build_to.after_or_equal' => 'Das Ende des Bauzeitraums liegt vor seinem Anfang.',
            'build_to.*' => 'Das Ende des Bauzeitraums können wir nicht lesen. Schreib es bitte so: 31.12.2023.',
            'tyre_sizes.required' => 'Eine Zeile braucht mindestens eine Reifengröße.',
            'tyre_sizes.min' => 'Eine Zeile braucht mindestens eine Reifengröße.',
            'tyre_sizes.max' => 'Höchstens 20 Reifengrößen je Zeile.',
            'tyre_sizes.*.width_mm.*' => 'Die Reifenbreite bitte in Millimetern, zwischen 125 und 355.',
            'tyre_sizes.*.aspect.*' => 'Den Querschnitt bitte als Zahl zwischen 25 und 85.',
            'tyre_sizes.*.diameter.*' => 'Den Felgendurchmesser des Reifens bitte in Zoll, zwischen 12 und 26.',
            'tyre_sizes.*.min_load_index.*' => 'Diesen Tragfähigkeitsindex gibt es nicht.',
            'tyre_sizes.*.min_speed_symbol.*' => 'Dieses Geschwindigkeitssymbol gibt es nicht.',
            'tyre_sizes.*.axle.*' => 'Bitte wähl die Achse der Reifengröße.',
            'conditions.*.id.distinct' => 'Diese Auflage ist zweimal gewählt.',
            'conditions.*.id.*' => 'Diese Auflage gibt es nicht mehr im Auflagen-Katalog.',
            'conditions.*.note.max' => 'Der Zusatz zur Auflage darf höchstens 300 Zeichen lang sein.',
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                foreach (['width_min' => [4, 14, 2], 'width_max' => [4, 14, 2], 'centre_bore' => [50, 90, 2]] as $field => [$min, $max, $places]) {
                    $raw = $this->input($field);

                    if (is_string($raw) && trim($raw) !== '' && ! $validator->errors()->has($field)) {
                        $value = GermanNumber::parse($raw, $places);

                        if ($value === null || (float) $value < $min || (float) $value > $max) {
                            $validator->errors()->add($field, $field === 'centre_bore'
                                ? 'Die Mittenlochbohrung bitte in Millimetern, zwischen 50 und 90, zum Beispiel 66,6.'
                                : 'Die Breite bitte in Zoll, zwischen 4 und 14, zum Beispiel 8,5.');
                        }
                    }
                }

                foreach (['et_min', 'et_max'] as $field) {
                    $raw = $this->input($field);

                    if (is_string($raw) && trim($raw) !== '' && ! $validator->errors()->has($field)) {
                        $value = GermanNumber::integer($raw, true);

                        if ($value === null || $value < -99 || $value > 99) {
                            $validator->errors()->add($field, 'Die Einpresstiefe bitte in ganzen Millimetern, zwischen −99 und 99.');
                        }
                    }
                }

                $document = $this->route('document');
                $page = $this->input('source_page');

                if ($document instanceof ApprovalDocument && $document->page_count !== null && is_numeric($page) && (int) $page > $document->page_count && ! $validator->errors()->has('source_page')) {
                    $validator->errors()->add('source_page', "Das Gutachten hat nur {$document->page_count} Seiten.");
                }

                $seen = [];

                foreach ((array) $this->input('tyre_sizes') as $i => $size) {
                    if (! is_array($size)) {
                        continue;
                    }

                    $key = implode('|', [$size['width_mm'] ?? '', $size['aspect'] ?? '', $size['diameter'] ?? '', $size['axle'] ?? '']);

                    if (isset($seen[$key]) && ! $validator->errors()->has("tyre_sizes.{$i}.width_mm")) {
                        $validator->errors()->add("tyre_sizes.{$i}.width_mm", 'Diese Reifengröße steht schon in der Liste.');
                    }

                    $seen[$key] = true;
                }
            },
        ];
    }

    /** @return RowSpec */
    public function spec(): array
    {
        $decimal = fn (string $key, int $places): ?string => is_string($this->validated($key)) && trim((string) $this->validated($key)) !== '' ? GermanNumber::parse((string) $this->validated($key), $places) : null;
        $integer = fn (string $key): ?int => is_string($this->validated($key)) && trim((string) $this->validated($key)) !== '' ? GermanNumber::integer((string) $this->validated($key), true) : null;
        $note = $this->validated('entry_note');

        $sizes = [];

        foreach ((array) $this->validated('tyre_sizes') as $size) {
            $sizes[] = [
                'width_mm' => (int) $size['width_mm'],
                'aspect' => (int) $size['aspect'],
                'diameter_in' => number_format((float) $size['diameter'], 1, '.', ''),
                'min_load_index' => isset($size['min_load_index']) ? (int) $size['min_load_index'] : null,
                'min_speed_symbol' => isset($size['min_speed_symbol']) && $size['min_speed_symbol'] !== '' ? strtoupper((string) $size['min_speed_symbol']) : null,
                'axle' => (string) $size['axle'],
            ];
        }

        $conditions = [];

        foreach ((array) $this->validated('conditions') as $condition) {
            $text = isset($condition['note']) ? trim((string) $condition['note']) : '';
            $conditions[] = ['id' => (int) $condition['id'], 'note' => $text === '' ? null : $text];
        }

        return [
            'axle' => (string) $this->validated('axle'),
            'requires_entry' => (bool) $this->validated('requires_entry'),
            'entry_note_de' => is_string($note) && trim($note) !== '' ? trim($note) : null,
            'source_page' => $this->validated('source_page') === null ? null : (int) $this->validated('source_page'),
            'build_from' => is_string($this->validated('build_from')) ? (string) $this->validated('build_from') : null,
            'build_to' => is_string($this->validated('build_to')) ? (string) $this->validated('build_to') : null,
            'permitted_width_min' => $decimal('width_min', 2),
            'permitted_width_max' => $decimal('width_max', 2),
            'permitted_et_min' => $integer('et_min'),
            'permitted_et_max' => $integer('et_max'),
            'centre_bore_mm' => $decimal('centre_bore', 2),
            'tyre_sizes' => $sizes,
            'conditions' => $conditions,
        ];
    }

    /** @return list<int> */
    public function vehicleIds(): array
    {
        return array_values(array_map('intval', (array) $this->validated('vehicle_ids')));
    }

    /** @return list<int> */
    public function configIds(): array
    {
        return array_values(array_map('intval', (array) $this->validated('config_ids')));
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
