<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Erfassung;

use App\Support\PrintedWheel;
use Illuminate\Validation\Validator;

/**
 * Step 2: what the paper itself prints for its wheel, one row per size it names. Read only to warn staff when a version they chose
 * is not among them; nothing typed here chooses anything.
 */
class EntryWheelRequest extends EntryRequest
{
    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'printed' => ['present', 'array', 'max:8'],
            'printed.*.type' => ['nullable', 'string', 'max:64'],
            'printed.*.size' => ['nullable', 'string', 'max:32'],
            'printed.*.et' => ['nullable', 'integer', 'min:-99', 'max:99'],
            'printed.*.bolts' => ['nullable', 'string', 'max:16'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'printed.max' => 'Höchstens 8 Zeilen aus dem Gutachten.',
            'printed.*.type.max' => 'Der Radtyp darf höchstens 64 Zeichen lang sein.',
            'printed.*.et.*' => 'Die Einpresstiefe bitte als ganze Zahl, zwischen −99 und 99.',
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                foreach ((array) $this->input('printed') as $i => $row) {
                    $size = is_array($row) ? self::text($row['size'] ?? null) : null;
                    $bolts = is_array($row) ? self::text($row['bolts'] ?? null) : null;

                    if ($size !== null && PrintedWheel::size($size) === null) {
                        $validator->errors()->add("printed.{$i}.size", 'Die Radgröße können wir nicht lesen. Schreib sie etwa so: 8 1/2 J X 18 H2 oder 8,5 × 18.');
                    }

                    if ($bolts !== null && PrintedWheel::bolts($bolts) === null) {
                        $validator->errors()->add("printed.{$i}.bolts", 'Den Lochkreis können wir nicht lesen. Schreib ihn etwa so: 120/5 oder 5 × 120.');
                    }
                }
            },
        ];
    }

    /**
     * The rows as read; a row with nothing in it goes.
     *
     * @return list<array{type: string|null, width: float|null, diameter: float|null, et: int|null, holes: int|null, circle: float|null}>
     */
    public function printed(): array
    {
        $out = [];

        foreach ((array) $this->validated('printed') as $row) {
            $size = self::text($row['size'] ?? null);
            $bolts = self::text($row['bolts'] ?? null);
            $readSize = $size === null ? null : PrintedWheel::size($size);
            $readBolts = $bolts === null ? null : PrintedWheel::bolts($bolts);
            $et = $row['et'] ?? null;
            $read = [
                'type' => self::text($row['type'] ?? null),
                'width' => $readSize['width'] ?? null,
                'diameter' => $readSize['diameter'] ?? null,
                'et' => $et === null ? null : (int) $et,
                'holes' => $readBolts['holes'] ?? null,
                'circle' => $readBolts['circle'] ?? null,
            ];

            if (array_filter($read, static fn (mixed $value): bool => $value !== null) !== []) {
                $out[] = $read;
            }
        }

        return $out;
    }

    private static function text(mixed $value): ?string
    {
        return is_string($value) && trim($value) !== '' ? trim($value) : null;
    }
}
