<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * A draft Gutachten's own „Bereifungskombinationen“ (D-256), saved whole: each with the number the document prints,
 * the size on the front axle and the size on the rear, typed as printed (`225/40 R18`), and one page for the list. A
 * number may stand beside several pairs, as a table prints one front size with two rear sizes under one number.
 * Authorised by ApprovalDocumentPolicy::update (R-11). No combination at all takes the list away.
 */
class DocumentCombinationsRequest extends FormRequest
{
    /** @var string */
    protected $errorBag = 'kombinationen';

    /** `225/40 R18`, `225/40R18`, `225/40 ZR18`, `225/40-18`: width, aspect, diameter — and nothing after. */
    private const SIZE = '/^(\d{3})\s*\/\s*(\d{2})\s*(?:Z?R|-)\s*(\d{2})$/u';

    private const SIZE_MESSAGE = 'Die Größe bitte in der Form 225/40 R18, ohne Lastindex und Geschwindigkeitssymbol.';

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
            'combinations' => ['present', 'array', 'max:60'],
            // Not distinct: one number may print several pairs (`Nr. 8: 235/45R19 – 255/40R19, 265/40R19`); a pair twice is
            // refused in after().
            'combinations.*.number' => ['required', 'integer', 'min:1', 'max:999'],
            'combinations.*.front' => ['required', 'string', 'max:20'],
            'combinations.*.rear' => ['required', 'string', 'max:20'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'source_page.*' => 'Die Seite bitte als ganze Zahl ab 1.',
            'combinations.max' => 'Höchstens 60 Kombinationen.',
            'combinations.*.number.required' => 'Bitte die Nummer der Kombination, wie das Gutachten sie druckt.',
            'combinations.*.number.*' => 'Die Nummer bitte als ganze Zahl ab 1.',
            'combinations.*.front.required' => 'Bitte die Größe für die Vorderachse.',
            'combinations.*.rear.required' => 'Bitte die Größe für die Hinterachse.',
            'combinations.*.front.*' => self::SIZE_MESSAGE,
            'combinations.*.rear.*' => self::SIZE_MESSAGE,
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

                $seen = [];

                foreach ((array) $this->input('combinations', []) as $i => $combination) {
                    if (! is_array($combination)) {
                        continue;
                    }

                    $sizes = [];

                    foreach (['front', 'rear'] as $axle) {
                        if ($validator->errors()->has("combinations.{$i}.{$axle}")) {
                            continue;
                        }

                        $size = self::size((string) ($combination[$axle] ?? ''));

                        if ($size === null) {
                            $validator->errors()->add("combinations.{$i}.{$axle}", self::SIZE_MESSAGE);
                        } else {
                            $sizes[$axle] = $size;
                        }
                    }

                    if (count($sizes) !== 2) {
                        continue;
                    }

                    // One pair, one entry: the same two sizes twice would be one combination under two numbers.
                    $key = implode('/', $sizes['front']).'|'.implode('/', $sizes['rear']);

                    if (isset($seen[$key])) {
                        $validator->errors()->add("combinations.{$i}.rear", "Diese Kombination steht schon als Nummer {$seen[$key]} in der Liste.");
                    } else {
                        $seen[$key] = (int) ($combination['number'] ?? 0);
                    }
                }
            },
        ];
    }

    /**
     * The combinations to store, in the document's order.
     *
     * @return list<array{number: int, front_width_mm: int, front_aspect: int, front_diameter_in: int, rear_width_mm: int, rear_aspect: int, rear_diameter_in: int}>
     */
    public function combinations(): array
    {
        $out = [];

        foreach ((array) $this->validated('combinations') as $combination) {
            $front = self::size((string) $combination['front']);
            $rear = self::size((string) $combination['rear']);

            if ($front === null || $rear === null) {
                continue;
            }

            $out[] = [
                'number' => (int) $combination['number'],
                'front_width_mm' => $front[0],
                'front_aspect' => $front[1],
                'front_diameter_in' => $front[2],
                'rear_width_mm' => $rear[0],
                'rear_aspect' => $rear[1],
                'rear_diameter_in' => $rear[2],
            ];
        }

        usort($out, static fn (array $a, array $b): int => $a['number'] <=> $b['number']);

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
     * A size as typed, within what a row takes (FitmentRowsRequest): width 125–355 mm, aspect 25–85, 12–26 inches.
     *
     * @return array{0: int, 1: int, 2: int}|null
     */
    private static function size(string $text): ?array
    {
        $text = mb_strtoupper(trim((string) preg_replace('/[\s\x{00A0}\x{202F}]+/u', ' ', $text)));

        if (preg_match(self::SIZE, $text, $m) !== 1) {
            return null;
        }

        [$width, $aspect, $diameter] = [(int) $m[1], (int) $m[2], (int) $m[3]];

        if ($width < 125 || $width > 355 || $aspect < 25 || $aspect > 85 || $diameter < 12 || $diameter > 26) {
            return null;
        }

        return [$width, $aspect, $diameter];
    }
}
