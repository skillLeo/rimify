<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * A draft Gutachten's own table of tyre load at speed (ABE 55255, p. 6), saved whole: rows of speeds, columns
 * of speed symbols, each cell a percentage, „–“ (not permitted at that speed) or empty (the table does not
 * say). Authorised by ApprovalDocumentPolicy::update (R-11). No rows at all takes the table away.
 */
class DocumentDeratingRequest extends FormRequest
{
    /** @var string */
    protected $errorBag = 'tabelle';

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
            'source_page' => ['nullable', 'integer', 'min:1', 'max:2000'],
            'symbols' => ['present', 'array', 'max:6'],
            'symbols.*' => ['string', 'distinct', 'regex:/^[A-Z()]{1,4}$/'],
            'rows' => ['present', 'array', 'max:30'],
            'rows.*.speed_kmh' => ['required', 'integer', 'min:100', 'max:400', 'distinct'],
            'rows.*.cells' => ['present', 'array'],
            'rows.*.cells.*' => ['nullable', 'string', 'max:6'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'source_page.*' => 'Die Seite bitte als ganze Zahl ab 1.',
            'symbols.max' => 'Höchstens sechs Spalten.',
            'symbols.*.distinct' => 'Diese Spalte steht zweimal in der Tabelle.',
            'symbols.*.regex' => 'Eine Spalte ist ein Geschwindigkeitsindex, zum Beispiel V, W oder Y.',
            'rows.max' => 'Höchstens 30 Zeilen.',
            'rows.*.speed_kmh.required' => 'Bitte die Geschwindigkeit der Zeile in km/h.',
            'rows.*.speed_kmh.distinct' => 'Diese Geschwindigkeit steht zweimal in der Tabelle.',
            'rows.*.speed_kmh.*' => 'Die Geschwindigkeit bitte in ganzen km/h, zwischen 100 und 400.',
            'rows.*.cells.*' => 'Bitte eine Zahl von 1 bis 100, „–“ oder nichts.',
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
                    $validator->errors()->add('source_page', "Das Gutachten hat nur {$document->page_count} Seiten.");
                }

                $symbols = array_map('strval', (array) $this->input('symbols', []));

                foreach ((array) $this->input('rows', []) as $i => $row) {
                    foreach ((array) (is_array($row) ? ($row['cells'] ?? []) : []) as $symbol => $raw) {
                        if (! in_array((string) $symbol, $symbols, true)) {
                            $validator->errors()->add("rows.{$i}.cells", "Die Spalte {$symbol} gibt es in der Tabelle nicht.");

                            continue;
                        }

                        if (self::cell($raw) === false) {
                            $validator->errors()->add("rows.{$i}.cells.{$symbol}", 'Bitte eine Zahl von 1 bis 100, „–“ oder nichts.');
                        }
                    }
                }
            },
        ];
    }

    /**
     * The cells to store: one per speed and symbol the table says something about — a percentage, or null
     * for „–“. An empty cell is not stored: the table does not say.
     *
     * @return list<array{speed_kmh: int, symbol: string, percent: int|null}>
     */
    public function cells(): array
    {
        $out = [];

        foreach ((array) $this->validated('rows') as $row) {
            foreach ((array) ($row['cells'] ?? []) as $symbol => $raw) {
                $value = self::cell($raw);

                if ($value === null || $value === false) {
                    continue;
                }

                $out[] = ['speed_kmh' => (int) $row['speed_kmh'], 'symbol' => (string) $symbol, 'percent' => $value === 'dash' ? null : $value];
            }
        }

        return $out;
    }

    public function sourcePage(): ?int
    {
        return $this->validated('source_page') === null ? null : (int) $this->validated('source_page');
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }

    /**
     * A cell as typed: empty → null (not said), „–“ or „-“ → 'dash', 1–100 with an optional „%“ → the
     * number, anything else → false.
     */
    private static function cell(mixed $raw): int|string|false|null
    {
        $text = trim(str_replace(['%', "\u{00A0}"], ['', ' '], (string) $raw));

        if ($text === '') {
            return null;
        }

        if (in_array($text, ['–', '-', '—'], true)) {
            return 'dash';
        }

        if (preg_match('/^\d{1,3}$/', $text) === 1 && (int) $text >= 1 && (int) $text <= 100) {
            return (int) $text;
        }

        return false;
    }
}
