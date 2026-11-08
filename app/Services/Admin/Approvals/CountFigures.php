<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals;

use App\Support\GermanFormat;

/**
 * What a Gutachten's Verwendungsbereich printed for the vehicles to be entered, as it was counted off the PDF until the client's round
 * of 08.11.2026, §3 (ADMIN-GEFUNDEN 511; D-440, D-441): how many Auflagen codes, how many tyre sizes, the axle-load limit, and whether
 * it asks for an Abnahme. Nothing counts any more; this reads the Protokoll entries that hold such a count, so they still say what
 * was counted.
 */
final readonly class CountFigures
{
    public function __construct(
        public int $codes,
        public int $codesPage,
        public int $sizes,
        public int $sizesPage,
        public ?int $axleLimitKg,
        public ?int $axleLimitPage,
        public string $abnahme,
        public ?int $abnahmePage,
    ) {}

    /**
     * A count as a Protokoll entry holds it (`toArray`), or null where the entry holds none or a broken one.
     *
     * @param  array<array-key, mixed>|null  $data
     */
    public static function fromArray(?array $data): ?self
    {
        $int = static fn (string $key): ?int => is_int($data[$key] ?? null) ? $data[$key] : (is_numeric($data[$key] ?? null) ? (int) $data[$key] : null);

        if ($data === null || $int('codes') === null || $int('codesPage') === null || $int('sizes') === null || $int('sizesPage') === null
            || ! in_array($data['abnahme'] ?? null, ReleaseDeclaration::ABNAHME, true)) {
            return null;
        }

        return new self($int('codes'), $int('codesPage'), $int('sizes'), $int('sizesPage'), $int('axleLimitKg'), $int('axleLimitPage'), (string) $data['abnahme'], $int('abnahmePage'));
    }

    /** @return array{codes: int, codesPage: int, sizes: int, sizesPage: int, axleLimitKg: int|null, axleLimitPage: int|null, abnahme: string, abnahmePage: int|null} */
    public function toArray(): array
    {
        return [
            'codes' => $this->codes,
            'codesPage' => $this->codesPage,
            'sizes' => $this->sizes,
            'sizesPage' => $this->sizesPage,
            'axleLimitKg' => $this->axleLimitKg,
            'axleLimitPage' => $this->axleLimitKg === null ? null : $this->axleLimitPage,
            'abnahme' => $this->abnahme,
            'abnahmePage' => $this->abnahme === ReleaseDeclaration::ABNAHME_NONE ? null : $this->abnahmePage,
        ];
    }

    /**
     * The count in the words the page shows it in: „6 Auflagen-Codes (Seite 3) · 3 Reifengrößen (Seite 3) · Achslast
     * höchstens 1.160 kg (Seite 3) · Abnahme bei jeder Kombination (Seite 4)“.
     *
     * @return list<string>
     */
    public function linesDe(): array
    {
        $page = static fn (?int $p): string => $p === null ? '' : " (Seite {$p})";

        return [
            ($this->codes === 1 ? '1 Auflagen-Code' : "{$this->codes} Auflagen-Codes").$page($this->codesPage),
            ($this->sizes === 1 ? '1 Reifengröße' : "{$this->sizes} Reifengrößen").$page($this->sizesPage),
            $this->axleLimitKg === null ? 'keine Achslastgrenze' : 'Achslast höchstens '.GermanFormat::kilograms($this->axleLimitKg).$page($this->axleLimitPage),
            match ($this->abnahme) {
                ReleaseDeclaration::ABNAHME_ALL => 'Abnahme bei jeder Kombination'.$page($this->abnahmePage),
                ReleaseDeclaration::ABNAHME_SOME => 'Abnahme bei einigen Kombinationen'.$page($this->abnahmePage),
                default => 'keine Abnahme',
            },
        ];
    }
}
