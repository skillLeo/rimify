<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Erfassung;

use App\Models\ApprovalDocument;
use App\Models\DocumentCarEntry;
use App\Models\DocumentTyreLine;
use App\Services\Admin\Approvals\DocumentConditions;
use App\Support\GermanNumber;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Step 4: one car's lines — vorne, hinten, codes, a power band behind the „…“ — its general codes, its page, and what its row
 * says beside them. A size is sent as typed and read on the server: what does not read is kept and said, never refused, so a
 * half-typed line loses nothing (the Gutachten rework §7).
 *
 * @phpstan-import-type LineInput from \App\Services\Admin\Approvals\Entry\EntryEditor
 * @phpstan-import-type CodeInput from \App\Services\Admin\Approvals\Entry\EntryEditor
 */
class EntryLinesRequest extends EntryRequest
{
    /** Each code as the code it is: one plain space between its words, a printed closing bracket dropped. */
    protected function prepareForValidation(): void
    {
        $words = static fn (mixed $code): mixed => DocumentConditions::normaliseCode($code);
        $lines = $this->input('lines');
        $codes = $this->input('codes');

        if (is_array($lines)) {
            $this->merge(['lines' => array_map(static fn (mixed $line): mixed => is_array($line) && is_array($line['codes'] ?? null) ? [...$line, 'codes' => array_map($words, $line['codes'])] : $line, $lines)]);
        }

        if (is_array($codes)) {
            $this->merge(['codes' => array_map(static fn (mixed $code): mixed => is_array($code) && array_key_exists('code', $code) ? [...$code, 'code' => $words($code['code'])] : $code, $codes)]);
        }
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'lines' => ['present', 'array', 'max:150'],
            'lines.*.id' => ['nullable', 'integer'],
            'lines.*.front' => ['nullable', 'string', 'max:64'],
            'lines.*.rear' => ['nullable', 'string', 'max:64'],
            'lines.*.kw' => ['nullable', 'string', 'max:20'],
            'lines.*.front_on_rim' => ['sometimes', 'boolean'],
            'lines.*.rear_on_rim' => ['sometimes', 'boolean'],
            'lines.*.codes' => ['nullable', 'array', 'max:30'],
            'lines.*.codes.*' => ['string', 'regex:'.DocumentConditions::CODE],
            'codes' => ['present', 'array', 'max:40'],
            'codes.*.code' => ['required', 'string', 'distinct', 'regex:'.DocumentConditions::CODE],
            'codes.*.note' => ['nullable', 'string', 'max:300'],
            'source_page' => ['nullable', 'integer', 'min:1', 'max:2000'],
            'entry_note' => ['sometimes', 'nullable', 'string', 'max:500'],
            'entry_override' => ['sometimes', 'nullable', Rule::in(['required', 'not_required'])],
            'entry_override_reason' => ['nullable', 'required_with:entry_override', 'string', 'min:10', 'max:500'],
            'build_from' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'build_to' => ['sometimes', 'nullable', 'date_format:Y-m-d', 'after_or_equal:build_from'],
            'width_min' => ['sometimes', 'nullable', 'string', 'max:8'],
            'width_max' => ['sometimes', 'nullable', 'string', 'max:8'],
            'et_min' => ['sometimes', 'nullable', 'string', 'max:6'],
            'et_max' => ['sometimes', 'nullable', 'string', 'max:6'],
            'centre_bore' => ['sometimes', 'nullable', 'string', 'max:8'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'lines.max' => 'Höchstens 150 Zeilen je Fahrzeug.',
            'lines.*.codes.max' => 'Höchstens 30 Codes je Zeile.',
            'lines.*.codes.*' => DocumentConditions::CODE_MESSAGE,
            'codes.max' => 'Höchstens 40 allgemeine Codes je Fahrzeug.',
            'codes.*.code.distinct' => 'Dieser Code steht zweimal bei den allgemeinen Codes.',
            'codes.*.code.*' => DocumentConditions::CODE_MESSAGE,
            'codes.*.note.max' => 'Der Zusatz zur Auflage darf höchstens 300 Zeichen lang sein.',
            'source_page.*' => 'Die Seite bitte als ganze Zahl ab 1.',
            'entry_override.*' => 'Bitte wähl, ob die Eintragung laut Prüfer erforderlich ist oder nicht.',
            'entry_override_reason.required_with' => 'Schreib dazu, warum du die abgeleitete Eintragung änderst – etwa die Aussage des Prüfers.',
            'entry_override_reason.min' => 'Der Grund ist zu kurz. Schreib ihn so, dass ihn jemand ohne dich versteht.',
            'entry_override_reason.max' => 'Der Grund darf höchstens 500 Zeichen lang sein.',
            'entry_note.max' => 'Der Hinweis zur Eintragung darf höchstens 500 Zeichen lang sein.',
            'build_from.*' => 'Den Anfang des Bauzeitraums können wir nicht lesen. Schreib ihn bitte so: 01.03.2019.',
            'build_to.after_or_equal' => 'Das Ende des Bauzeitraums liegt vor seinem Anfang.',
            'build_to.*' => 'Das Ende des Bauzeitraums können wir nicht lesen. Schreib es bitte so: 31.12.2023.',
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $document = $this->route('document');
                $page = $this->input('source_page');

                if ($document instanceof ApprovalDocument && $document->page_count !== null && is_numeric($page) && (int) $page > $document->page_count && ! $validator->errors()->has('source_page')) {
                    $validator->errors()->add('source_page', $document->page_count === 1 ? 'Das Gutachten hat nur 1 Seite.' : "Das Gutachten hat nur {$document->page_count} Seiten.");
                }

                foreach ((array) $this->input('lines') as $i => $line) {
                    $kw = is_array($line) && is_string($line['kw'] ?? null) ? trim($line['kw']) : '';

                    if ($kw !== '' && self::band($kw) === null) {
                        $validator->errors()->add("lines.{$i}.kw", 'Den kW-Bereich bitte so, wie das Gutachten ihn druckt: zwei ganze Zahlen, die kleinere zuerst, etwa 85-195.');
                    }
                }

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

                $width = [GermanNumber::parse((string) $this->input('width_min', ''), 2), GermanNumber::parse((string) $this->input('width_max', ''), 2)];

                if ($width[0] !== null && $width[1] !== null && (float) $width[0] > (float) $width[1] && ! $validator->errors()->hasAny(['width_min', 'width_max'])) {
                    $validator->errors()->add('width_max', '„Breite bis“ ist kleiner als „Breite von“.');
                }

                $et = [GermanNumber::integer((string) $this->input('et_min', ''), true), GermanNumber::integer((string) $this->input('et_max', ''), true)];

                if ($et[0] !== null && $et[1] !== null && $et[0] > $et[1] && ! $validator->errors()->hasAny(['et_min', 'et_max'])) {
                    $validator->errors()->add('et_max', '„ET bis“ ist kleiner als „ET von“.');
                }
            },
        ];
    }

    /**
     * The lines as sent, each side as typed. An empty side takes the other's: every line is vorne + hinten, and the same size on
     * both axles is the common case — except on a line that came with one side, which stays as it is. An empty line goes.
     *
     * @return list<LineInput>
     */
    public function lines(): array
    {
        /** @var DocumentCarEntry $entry */
        $entry = $this->route('entry');
        $oneSided = $entry->lines()->get()
            ->filter(static fn (DocumentTyreLine $line): bool => ($line->front() === null && $line->front_unread === null) || ($line->rear() === null && $line->rear_unread === null))
            ->keyBy('id');
        $out = [];

        foreach ((array) $this->validated('lines') as $line) {
            $front = trim((string) ($line['front'] ?? ''));
            $rear = trim((string) ($line['rear'] ?? ''));

            if ($front === '' && $rear === '') {
                continue;
            }

            $id = isset($line['id']) ? (int) $line['id'] : null;

            if ($id === null || ! $oneSided->has($id)) {
                $front = $front === '' ? $rear : $front;
                $rear = $rear === '' ? $front : $rear;
            }

            $band = self::band(trim((string) ($line['kw'] ?? '')));

            $out[] = [
                'id' => $id,
                'front' => $front,
                'rear' => $rear,
                'kw_min' => $band[0] ?? null,
                'kw_max' => $band[1] ?? null,
                'front_on_rim' => (bool) ($line['front_on_rim'] ?? false),
                'rear_on_rim' => (bool) ($line['rear_on_rim'] ?? false),
                // As printed: `K1c` is not `K1C`.
                'codes' => array_values(array_map(static fn (mixed $c): string => trim((string) $c), (array) ($line['codes'] ?? []))),
            ];
        }

        return $out;
    }

    /** @return list<array{code: string, note: string|null}> */
    public function codes(): array
    {
        return array_values(array_map(static function (array $code): array {
            $note = isset($code['note']) ? trim((string) $code['note']) : '';

            return ['code' => trim((string) $code['code']), 'note' => $note === '' ? null : $note];
        }, (array) $this->validated('codes')));
    }

    /**
     * The columns of the row this form sent: only those, so a save of the lines alone leaves the rest as it is.
     *
     * @return array<string, mixed>
     */
    public function columns(): array
    {
        $validated = $this->validated();
        $text = static fn (mixed $value): ?string => is_string($value) && trim($value) !== '' ? trim($value) : null;
        $out = ['source_page' => isset($validated['source_page']) ? (int) $validated['source_page'] : null];

        if (array_key_exists('entry_note', $validated)) {
            $out['entry_note_de'] = $text($validated['entry_note']);
        }

        if (array_key_exists('entry_override', $validated)) {
            $out['entry_override'] = is_string($validated['entry_override']) ? $validated['entry_override'] : null;
            $out['entry_override_reason'] = $out['entry_override'] === null ? null : $text($validated['entry_override_reason'] ?? null);
        }

        foreach (['build_from', 'build_to'] as $key) {
            if (array_key_exists($key, $validated)) {
                $out[$key] = $text($validated[$key]);
            }
        }

        foreach (['width_min' => 'permitted_width_min', 'width_max' => 'permitted_width_max', 'centre_bore' => 'centre_bore_mm'] as $key => $column) {
            if (array_key_exists($key, $validated)) {
                $raw = $text($validated[$key]);
                $out[$column] = $raw === null ? null : GermanNumber::parse($raw, 2);
            }
        }

        foreach (['et_min' => 'permitted_et_min', 'et_max' => 'permitted_et_max'] as $key => $column) {
            if (array_key_exists($key, $validated)) {
                $raw = $text($validated[$key]);
                $out[$column] = $raw === null ? null : GermanNumber::integer($raw, true);
            }
        }

        return $out;
    }

    /**
     * A band as a Gutachten prints it: `85-195`, `85 – 195 kW`; a single value is the band of that power alone.
     *
     * @return array{0: int, 1: int}|null
     */
    private static function band(string $text): ?array
    {
        if ($text === '') {
            return null;
        }

        if (preg_match('/^(\d{1,4})(?:\s*[-–]\s*(\d{1,4}))?(?:\s*kW)?$/iu', $text, $m) !== 1) {
            return null;
        }

        $min = (int) $m[1];
        $max = (int) ($m[2] ?? $m[1]);

        return $min >= 1 && $max <= 1000 && $min <= $max ? [$min, $max] : null;
    }
}
