<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Erfassung;

use App\Support\PrintedWheel;

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
            'printed.*.et' => ['nullable', 'max:16'],
            'printed.*.bolts' => ['nullable', 'string', 'max:16'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'printed.max' => 'Trag höchstens 8 Zeilen aus dem Gutachten ein.',
            'printed.*.type.max' => 'Der Radtyp darf höchstens 64 Zeichen lang sein.',
        ];
    }

    /**
     * The rows as read; a row with nothing in it goes. What does not read is kept as typed: this data only ever warns, and a step is
     * never held back for it (the operator's notes of 06.11.2026 and 07.11.2026).
     *
     * @return list<array{type: string|null, width: float|null, diameter: float|null, et: int|null, holes: int|null, circle: float|null, unread: array<string, string>}>
     */
    public function printed(): array
    {
        $out = [];

        foreach ((array) $this->validated('printed') as $row) {
            $size = self::text($row['size'] ?? null);
            $bolts = self::text($row['bolts'] ?? null);
            $readSize = $size === null ? null : PrintedWheel::size($size);
            $readBolts = $bolts === null ? null : PrintedWheel::bolts($bolts);
            $et = self::text(is_scalar($row['et'] ?? null) ? (string) $row['et'] : null);
            $readEt = $et === null ? null : self::et($et);
            $unread = array_filter([
                'size' => $readSize === null ? $size : null,
                'et' => $readEt === null ? $et : null,
                'bolts' => $readBolts === null ? $bolts : null,
            ], static fn (?string $text): bool => $text !== null);
            $read = [
                'type' => self::text($row['type'] ?? null),
                'width' => $readSize['width'] ?? null,
                'diameter' => $readSize['diameter'] ?? null,
                'et' => $readEt,
                'holes' => $readBolts['holes'] ?? null,
                'circle' => $readBolts['circle'] ?? null,
            ];

            if ($unread !== [] || array_filter($read, static fn (mixed $value): bool => $value !== null) !== []) {
                $out[] = [...$read, 'unread' => $unread];
            }
        }

        return $out;
    }

    /** A whole number of millimetres within what an ET can be, or null. */
    private static function et(string $text): ?int
    {
        $plain = str_replace('−', '-', $text);

        return preg_match('/^-?\d{1,2}$/', $plain) === 1 ? (int) $plain : null;
    }

    private static function text(mixed $value): ?string
    {
        return is_string($value) && trim($value) !== '' ? trim($value) : null;
    }
}
