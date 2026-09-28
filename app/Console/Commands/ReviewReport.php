<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\ReviewFeedback;
use App\Support\GermanFormat;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

/**
 * `php artisan review:report` — the client's review as a document (the review release §3):
 * docs/review/OPEN-POINTS.md, every point with its number, screen, what he said, our answer, its
 * state and the day it was closed. Open points first, then the closed ones, newest first within each.
 */
class ReviewReport extends Command
{
    protected $signature = 'review:report {--path= : Where to write the file (default docs/review/OPEN-POINTS.md)}';

    protected $description = 'Write the review points and their answers to docs/review/OPEN-POINTS.md';

    public function handle(): int
    {
        $path = (string) ($this->option('path') ?: base_path('docs/review/OPEN-POINTS.md'));
        $points = ReviewFeedback::query()
            ->orderByRaw("FIELD(status, 'neu', 'angenommen', 'erledigt', 'abgelehnt')")
            ->orderByDesc('id')
            ->get();

        $open = $points->filter(static fn (ReviewFeedback $p): bool => $p->isOpen())->count();
        $lines = [
            '# RIMIFY — Offene Punkte aus der Review',
            '',
            'Erzeugt mit `php artisan review:report` am '.GermanFormat::dateTime(now()).'. '
                .($points->isEmpty() ? 'Noch keine Rückmeldung.' : "{$open} von {$points->count()} Punkten sind offen."),
            '',
            // Which database the points were read from: the review's are on the preview, not on a
            // developer's machine — a file written anywhere else says so.
            'Quelle: '.config('app.url').' ('.app()->environment().').',
            '',
            '| Nr. | Seite | Was er gesagt hat | Unsere Antwort | Stand | Erledigt am |',
            '|---|---|---|---|---|---|',
        ];

        foreach ($points as $point) {
            $lines[] = '| '.implode(' | ', [
                '#'.$point->id,
                self::cell($point->screen),
                self::cell((ReviewFeedback::TYPES[$point->type] ?? $point->type).': '.$point->sentence),
                self::cell($point->answer ?? '–'),
                ReviewFeedback::STATUSES[$point->status] ?? $point->status,
                GermanFormat::date($point->closed_at) ?? '–',
            ]).' |';
        }

        File::ensureDirectoryExists(dirname($path));
        File::put($path, implode("\n", $lines)."\n");

        $this->info("{$points->count()} Punkte geschrieben nach {$path}.");

        return self::SUCCESS;
    }

    /** One table cell: no line breaks, no pipe that would split the row. */
    private static function cell(string $text): string
    {
        return str_replace(['|', "\r\n", "\n", "\r"], ['\\|', ' ', ' ', ' '], trim($text));
    }
}
