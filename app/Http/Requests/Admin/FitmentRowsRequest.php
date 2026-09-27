<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Domain\Fitment\Verdict\Condition;
use App\Enums\Axle;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Services\Admin\Approvals\FitmentRows;
use App\Support\GermanNumber;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
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
    /** The most rows one „Zeilen anlegen“ writes: vehicles × sizes. */
    public const MAX_ROWS = 2000;

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

                // A pair typed the wrong way round is said under its upper bound, never left to the
                // table's check constraint (which would answer with a server fault).
                $width = [GermanNumber::parse((string) $this->input('width_min', ''), 2), GermanNumber::parse((string) $this->input('width_max', ''), 2)];

                if ($width[0] !== null && $width[1] !== null && (float) $width[0] > (float) $width[1] && ! $validator->errors()->hasAny(['width_min', 'width_max'])) {
                    $validator->errors()->add('width_max', 'Die Breite bis ist kleiner als die Breite von.');
                }

                $et = [GermanNumber::integer((string) $this->input('et_min', ''), true), GermanNumber::integer((string) $this->input('et_max', ''), true)];

                if ($et[0] !== null && $et[1] !== null && $et[0] > $et[1] && ! $validator->errors()->hasAny(['et_min', 'et_max'])) {
                    $validator->errors()->add('et_max', 'ET bis ist kleiner als ET von.');
                }

                // Every vehicle × every size is one row: a batch stays small enough to check and to write.
                $pairs = count((array) $this->input('vehicle_ids', [])) * count((array) $this->input('config_ids', []));

                if ($this->adding() && $pairs > self::MAX_ROWS && ! $validator->errors()->hasAny(['vehicle_ids', 'config_ids'])) {
                    $validator->errors()->add('config_ids', 'Das wären '.number_format($pairs, 0, ',', '.').' Zeilen auf einmal – höchstens '
                        .number_format(self::MAX_ROWS, 0, ',', '.').'. Wähl bitte weniger Fahrzeuge oder Größen.');
                }

                // The Eintragung box and an Auflage about the Eintragung must say the same thing: a row that
                // says both is refused, never stored for the shop to choose between (R-02).
                $codes = DB::table('condition_codes')
                    ->whereIn('id', array_values(array_filter(array_map(static fn (mixed $c): mixed => is_array($c) ? ($c['id'] ?? null) : null, (array) $this->input('conditions', [])), 'is_numeric')))
                    ->pluck('code')->all();
                $entry = filter_var($this->input('requires_entry'), FILTER_VALIDATE_BOOL);

                if (! $entry && in_array(Condition::ENTRY_REQUIRED, $codes, true) && ! $validator->errors()->has('requires_entry')) {
                    $validator->errors()->add('requires_entry', 'Die gewählte Auflage verlangt eine Eintragung. Setz bitte auch das Häkchen „Eintragung in die Fahrzeugpapiere erforderlich“.');
                }

                if ($entry && in_array(Condition::NO_ENTRY_REQUIRED, $codes, true) && ! $validator->errors()->has('requires_entry')) {
                    $validator->errors()->add('requires_entry', 'Die gewählte Auflage sagt „Keine Eintragung erforderlich“ – das widerspricht dem Häkchen. Bitte entscheide dich für eins.');
                }

                // A changed row may not become the twin of another: one row per vehicle, size and axle.
                $row = $this->route('fitment');

                if ($row instanceof Fitment && is_string($this->input('axle')) && ! $validator->errors()->has('axle')
                    && Fitment::query()->where('approval_document_id', $row->approval_document_id)->where('vehicle_id', $row->vehicle_id)
                        ->where('wheel_config_id', $row->wheel_config_id)->where('axle', $this->input('axle'))->whereKeyNot($row->id)->exists()) {
                    $validator->errors()->add('axle', 'Für dieses Fahrzeug und diese Größe gibt es schon eine Zeile mit dieser Achse.');
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

                    // Read as the table will store it, so „+225“ and „225“ are one size.
                    $key = implode('|', [
                        is_numeric($size['width_mm'] ?? null) ? (int) $size['width_mm'] : '',
                        is_numeric($size['aspect'] ?? null) ? (int) $size['aspect'] : '',
                        is_numeric($size['diameter'] ?? null) ? number_format((float) $size['diameter'], 1, '.', '') : '',
                        is_string($size['axle'] ?? null) ? $size['axle'] : '',
                    ]);

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
