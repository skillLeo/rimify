<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals\Entry;

use App\Models\Vehicle;
use App\Support\EgNumber;
use Illuminate\Database\Eloquent\Builder;

/**
 * Step 3's one search field (the client's change of 05.11.2026: „search for vehicles using their details, such as HSN/TSN,
 * model, approval number“): HSN/TSN, make and model, type, field K, and kW. Results are single cars.
 *
 * - `0005 BGU`, `0005/BGU`, `0005`: key numbers.
 * - `e1*2001/116*0249`, `e1*2001/116*0249*..`: every car whose field K that number takes in (EgNumber), never more loosely
 *   than it is printed. `G191`, a national number, is matched as words.
 * - `150 kW`, `150kw`: that power exactly.
 * - Anything else: every word somewhere in the make, model, variant, type or field K.
 */
final class VehicleSearch
{
    /** @return Builder<Vehicle> */
    public function query(string $term): Builder
    {
        $term = trim($term);
        $query = Vehicle::query()->orderBy('make')->orderBy('model')->orderBy('variant')->orderBy('id');

        if ($term === '') {
            return $query;
        }

        if (preg_match('/^(\d{4})\s*[\/\s-]?\s*([A-Za-z0-9]{3})?$/', $term, $m) === 1) {
            $query->where('hsn', $m[1]);

            if (($m[2] ?? '') !== '') {
                $query->where('tsn', strtoupper($m[2]));
            }

            return $query;
        }

        $number = EgNumber::parse($term);

        if ($number !== null) {
            // A prefix narrows the search in the database; EgNumber decides, in ids(). Here the same approval number.
            return $query->where('eg_nummer_norm', 'like', addcslashes($number->base, '%_\\').'%');
        }

        foreach (preg_split('/\s+/', $term) ?: [] as $i => $word) {
            if (preg_match('/^(\d{2,4})\s*kw$/i', $word, $power) === 1) {
                $query->where('power_kw', (int) $power[1]);

                continue;
            }

            // „150 kW“ with a space: the number was read as a word before; the unit alone says nothing more.
            if (mb_strtolower($word) === 'kw') {
                continue;
            }

            $like = '%'.addcslashes($word, '%_\\').'%';
            $query->where(static function (Builder $any) use ($like, $word): void {
                $any->where('make', 'like', $like)
                    ->orWhere('model', 'like', $like)
                    ->orWhere('variant', 'like', $like)
                    ->orWhere('type_designation', 'like', $like)
                    ->orWhere('eg_nummer_raw', 'like', $like);

                if (ctype_digit($word)) {
                    $any->orWhere('power_kw', (int) $word);
                }
            });
        }

        return $query;
    }

    /**
     * The cars a search finds, by id, at most `$limit`: what „Alle Treffer auswählen“ ticks — the search as staff see it.
     *
     * @return list<int>
     */
    public function ids(string $term, int $limit): array
    {
        return array_map(static fn (Vehicle $v): int => (int) $v->id, $this->hits($term, $limit));
    }

    /**
     * The first cars of a search and how many it finds in all: „1.204 Treffer, die ersten 100 stehen hier“.
     *
     * @return array{cars: list<Vehicle>, total: int}
     */
    public function found(string $term, int $limit): array
    {
        $number = EgNumber::parse(trim($term));

        if ($number !== null) {
            $hits = $this->hits($term, 0);

            return ['cars' => array_slice($hits, 0, $limit), 'total' => count($hits)];
        }

        return ['cars' => array_values($this->query($term)->limit($limit)->get()->all()), 'total' => $this->query($term)->count()];
    }

    /**
     * An approval number is decided here, not in the database: its prefix can only narrow, whether a number takes another in is
     * EgNumber's (D-358, the same reading the engine uses).
     *
     * @return list<Vehicle>
     */
    public function hits(string $term, int $limit): array
    {
        $number = EgNumber::parse(trim($term));

        if ($number === null) {
            return array_values($this->query($term)->limit($limit)->get()->all());
        }

        $hits = [];

        foreach ($this->query($term)->cursor() as $vehicle) {
            $k = $vehicle->getAttribute('eg_nummer_norm');
            $own = EgNumber::parse(is_string($k) ? $k : null);

            if ($own !== null && $number->covers($own)) {
                $hits[] = $vehicle;
            }
        }

        return $limit > 0 ? array_slice($hits, 0, $limit) : $hits;
    }
}
