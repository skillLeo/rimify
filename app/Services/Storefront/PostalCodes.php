<?php

declare(strict_types=1);

namespace App\Services\Storefront;

/**
 * The places under a German PLZ, for the checkout's Ort field: `resources/data/plz-de.json`, built from GeoNames'
 * German postal codes (CC BY 4.0, docs/data-credits.md) with the Großkunden — a company, a ministry, a bank — left
 * out, because they name an addressee, not a place.
 *
 * The page fills Ort only where exactly one place answers and the field is still empty; several are offered to
 * choose from; none leaves the field as the customer types it. A lookup never corrects what someone wrote.
 */
final class PostalCodes
{
    public const PATH = 'data/plz-de.json';

    /** @var array<string, list<string>>|null */
    private ?array $table = null;

    /** @return list<string> */
    public function places(string $plz): array
    {
        if (preg_match('/^\d{5}$/', $plz) !== 1) {
            return [];
        }

        return $this->table()[$plz] ?? [];
    }

    /** @return array<string, list<string>> */
    private function table(): array
    {
        if ($this->table !== null) {
            return $this->table;
        }

        $raw = @file_get_contents(resource_path(self::PATH));
        $decoded = is_string($raw) ? json_decode($raw, true) : null;

        return $this->table = is_array($decoded) ? $decoded : [];
    }
}
