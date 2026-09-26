<?php

declare(strict_types=1);

namespace App\Models;

use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Support\GermanFormat;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Verdicts shown to customers, counted per Berlin day, surface and state — what the Übersicht's
 * „Verdikte der Prüfungen“ draws. Nothing about the customer, the car or the wheel is kept.
 *
 * @property string $day
 * @property string $surface
 * @property string $status
 * @property int $n
 */
class VerdictTally extends Model
{
    public $timestamps = false;

    protected $fillable = ['day', 'surface', 'status', 'n'];

    /**
     * Count the verdicts one page showed. Counting must never break the page that counts: this is
     * analytics about a customer who already has an answer on screen.
     *
     * @param  iterable<VerdictStatus>  $statuses
     */
    public static function record(string $surface, iterable $statuses): void
    {
        $counts = [];

        foreach ($statuses as $status) {
            $counts[$status->value] = ($counts[$status->value] ?? 0) + 1;
        }

        if ($counts === []) {
            return;
        }

        $day = CarbonImmutable::now(GermanFormat::TIMEZONE)->format('Y-m-d');
        $rows = [];

        foreach ($counts as $status => $n) {
            $rows[] = ['day' => $day, 'surface' => $surface, 'status' => $status, 'n' => $n];
        }

        try {
            DB::table('verdict_tallies')->upsert($rows, ['day', 'surface', 'status'], ['n' => DB::raw('n + VALUES(n)')]);
        } catch (Throwable $e) {
            report($e);
        }
    }
}
