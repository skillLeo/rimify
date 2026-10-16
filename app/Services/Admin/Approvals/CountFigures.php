<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals;

use App\Models\ApprovalDocument;
use App\Support\GermanFormat;

/**
 * What a Gutachten's Verwendungsbereich prints for the vehicles to be entered, read off the PDF before the rows are
 * entered — each figure with the page it stands on (ADMIN-GEFUNDEN 511, the operator's brief of 16.10.2026, Group A):
 * how many Auflagen codes, how many tyre sizes, the axle-load limit if it names one, and whether it asks for an Abnahme.
 *
 * The release compares the entry with these, in the sentences DocumentRelease::declarationBlockers has always used.
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

    /** The count a document carries, or null where it has not been counted. */
    public static function of(ApprovalDocument $document): ?self
    {
        if (! $document->isCounted()) {
            return null;
        }

        return new self(
            codes: (int) $document->counted_codes,
            codesPage: (int) $document->counted_codes_page,
            sizes: (int) $document->counted_sizes,
            sizesPage: (int) $document->counted_sizes_page,
            axleLimitKg: $document->counted_axle_limit_kg,
            axleLimitPage: $document->counted_axle_limit_page,
            abnahme: (string) $document->counted_abnahme,
            abnahmePage: $document->counted_abnahme_page,
        );
    }

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

    /** @return array<string, int|string|null> the document's columns */
    public function columns(): array
    {
        return [
            'counted_codes' => $this->codes,
            'counted_codes_page' => $this->codesPage,
            'counted_sizes' => $this->sizes,
            'counted_sizes_page' => $this->sizesPage,
            'counted_axle_limit_kg' => $this->axleLimitKg,
            'counted_axle_limit_page' => $this->axleLimitKg === null ? null : $this->axleLimitPage,
            'counted_abnahme' => $this->abnahme,
            'counted_abnahme_page' => $this->abnahme === ReleaseDeclaration::ABNAHME_NONE ? null : $this->abnahmePage,
        ];
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

    /** The declaration a release compares the entry with: this count and the completeness answer given at release. */
    public function declaration(string $completeness, ?string $missing): ReleaseDeclaration
    {
        return new ReleaseDeclaration($completeness, $missing, codes: $this->codes, sizes: $this->sizes, axleLimitKg: $this->axleLimitKg, abnahme: $this->abnahme);
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
