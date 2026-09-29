<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\Axle;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Services\Admin\Approvals\DocumentConditions;
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
 * Freigabe would be refused anyway. Auflagen are the codes the document prints (`A01`, `K1c`), on the row
 * and on each tyre size, each with an optional note for the row; their sentences are the document's own
 * Auflagenverzeichnis. A code the list does not hold yet may be typed — it is said on the row and stops
 * the Freigabe until it is defined (the corrections memo §1).
 *
 * The Eintragung is not typed: it follows from an Abnahme among the codes. A person may override it
 * only with a written reason (§2).
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

    /** A code of several words keeps one plain space between them, whatever space a PDF's copied text carried. */
    protected function prepareForValidation(): void
    {
        $words = static fn (mixed $code): mixed => is_string($code) ? trim((string) preg_replace('/\s+/u', ' ', $code)) : $code;
        $sizes = $this->input('tyre_sizes');
        $conditions = $this->input('conditions');

        if (is_array($sizes)) {
            $this->merge(['tyre_sizes' => array_map(static fn (mixed $size): mixed => is_array($size) && is_array($size['codes'] ?? null) ? [...$size, 'codes' => array_map($words, $size['codes'])] : $size, $sizes)]);
        }

        if (is_array($conditions)) {
            $this->merge(['conditions' => array_map(static fn (mixed $c): mixed => is_array($c) && array_key_exists('code', $c) ? [...$c, 'code' => $words($c['code'])] : $c, $conditions)]);
        }
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
            'entry_override' => ['nullable', Rule::in(['required', 'not_required'])],
            'entry_override_reason' => ['nullable', 'required_with:entry_override', 'string', 'min:10', 'max:500'],
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
            // The kW band the document prints beside the size (Block D): both ends, or none.
            'tyre_sizes.*.kw_min' => ['nullable', 'integer', 'min:1', 'max:1000', 'required_with:tyre_sizes.*.kw_max'],
            'tyre_sizes.*.kw_max' => ['nullable', 'integer', 'min:1', 'max:1000', 'required_with:tyre_sizes.*.kw_min'],
            'tyre_sizes.*.codes' => ['nullable', 'array', 'max:20'],
            // Not `distinct`: over `tyre_sizes.*.codes.*` it compares every size's codes with every other's, and
            // a document prints one code beside many sizes (ABE 55255: K2b, T88). Twice beside one size is
            // refused in after().
            'tyre_sizes.*.codes.*' => ['string', 'regex:'.self::CODE],
            'conditions' => ['present', 'array', 'max:30'],
            'conditions.*.code' => ['required', 'string', 'distinct', 'regex:'.self::CODE],
            'conditions.*.note' => ['nullable', 'string', 'max:300'],
        ];
    }

    /** A code as a document prints it (`A01`, `K1c`, `T88`, `140`, `Nicht 330D`): DocumentConditions::CODE. */
    public const CODE = DocumentConditions::CODE;

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
            'entry_override.*' => 'Bitte wähl, ob die Eintragung laut Prüfer erforderlich ist oder nicht.',
            'entry_override_reason.required_with' => 'Wer die abgeleitete Eintragung ändert, schreibt dazu, warum – etwa die Aussage des Prüfers.',
            'entry_override_reason.min' => 'Der Grund ist zu kurz. Schreib ihn so, dass ihn jemand ohne dich versteht.',
            'entry_override_reason.max' => 'Der Grund darf höchstens 500 Zeichen lang sein.',
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
            'tyre_sizes.*.kw_min.*' => 'Den kW-Bereich bitte so, wie das Gutachten ihn druckt: zwei ganze Zahlen, etwa 85-195.',
            'tyre_sizes.*.kw_max.*' => 'Den kW-Bereich bitte so, wie das Gutachten ihn druckt: zwei ganze Zahlen, etwa 85-195.',
            'tyre_sizes.*.codes.max' => 'Höchstens 20 Codes je Reifengröße.',
            'tyre_sizes.*.codes.*.distinct' => 'Dieser Code steht bei der Reifengröße zweimal.',
            'tyre_sizes.*.codes.*' => DocumentConditions::CODE_MESSAGE,
            'conditions.max' => 'Höchstens 30 Codes je Zeile.',
            'conditions.*.code.distinct' => 'Dieser Code steht zweimal in der Zeile.',
            'conditions.*.code.*' => DocumentConditions::CODE_MESSAGE,
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

                    // Read as the table will store it, so „+225“ and „225“ are one size. A size may stand more
                    // than once — the documents print one at two kW bands, or as 88W and 92 — but not twice
                    // with the same band and indexes (the table's entry_key).
                    $number = static fn (mixed $v): string => is_numeric($v) ? (string) (int) $v : '';
                    $key = implode('|', [
                        $number($size['width_mm'] ?? null),
                        $number($size['aspect'] ?? null),
                        is_numeric($size['diameter'] ?? null) ? number_format((float) $size['diameter'], 1, '.', '') : '',
                        is_string($size['axle'] ?? null) ? $size['axle'] : '',
                        $number($size['kw_min'] ?? null),
                        $number($size['kw_max'] ?? null),
                        $number($size['min_load_index'] ?? null),
                        is_string($size['min_speed_symbol'] ?? null) ? strtoupper(trim($size['min_speed_symbol'])) : '',
                    ]);

                    if (isset($seen[$key]) && ! $validator->errors()->has("tyre_sizes.{$i}.width_mm")) {
                        $validator->errors()->add("tyre_sizes.{$i}.width_mm", 'Diese Reifengröße steht mit diesem kW-Bereich und diesen Indizes schon in der Liste.');
                    }

                    // A code twice beside one size is typed twice; beside two sizes it is what documents print.
                    $codes = [];

                    foreach ((array) ($size['codes'] ?? []) as $j => $code) {
                        if (is_string($code) && isset($codes[$code]) && ! $validator->errors()->has("tyre_sizes.{$i}.codes.{$j}")) {
                            $validator->errors()->add("tyre_sizes.{$i}.codes.{$j}", 'Dieser Code steht bei der Reifengröße zweimal.');
                        }

                        $codes[is_string($code) ? $code : ''] = true;
                    }

                    // A band typed the wrong way round is said here, never left to the table's check constraint.
                    if (is_numeric($size['kw_min'] ?? null) && is_numeric($size['kw_max'] ?? null) && (int) $size['kw_min'] > (int) $size['kw_max']
                        && ! $validator->errors()->hasAny(["tyre_sizes.{$i}.kw_min", "tyre_sizes.{$i}.kw_max"])) {
                        $validator->errors()->add("tyre_sizes.{$i}.kw_max", 'Das Ende des kW-Bereichs ist kleiner als sein Anfang.');
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
                'kw_min' => isset($size['kw_min']) && $size['kw_min'] !== '' ? (int) $size['kw_min'] : null,
                'kw_max' => isset($size['kw_max']) && $size['kw_max'] !== '' ? (int) $size['kw_max'] : null,
                // As printed: `K1c` is not `K1C`.
                'codes' => array_values(array_map(static fn (mixed $c): string => trim((string) $c), (array) ($size['codes'] ?? []))),
            ];
        }

        $conditions = [];

        foreach ((array) $this->validated('conditions') as $condition) {
            $text = isset($condition['note']) ? trim((string) $condition['note']) : '';
            $conditions[] = ['code' => trim((string) $condition['code']), 'note' => $text === '' ? null : $text];
        }

        $override = $this->validated('entry_override');
        $reason = $this->validated('entry_override_reason');

        return [
            'axle' => (string) $this->validated('axle'),
            'entry_override' => is_string($override) ? $override : null,
            'entry_override_reason' => is_string($override) && is_string($reason) ? trim($reason) : null,
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
