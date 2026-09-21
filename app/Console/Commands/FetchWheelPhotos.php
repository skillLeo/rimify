<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

/**
 * Fetches the demo wheels' source photographs from the free-licence sites named in
 * database/seeders/content/wheel-photos.php, so a build machine can regenerate the cut-outs
 * without the photographs living in the repository. Idempotent: a file that exists is kept.
 */
class FetchWheelPhotos extends Command
{
    protected $signature = 'wheels:fetch-photos {--force : Download again even when the file exists}';

    protected $description = 'Download the demo wheels\' source photographs into storage/app/public/placeholder';

    public function handle(): int
    {
        /** @var array<string, array{credit: array{source: string, url: string}}> $map */
        $map = require database_path('seeders/content/wheel-photos.php');
        $dir = storage_path('app/public/placeholder');

        if (! is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        $failed = 0;

        foreach ($map as $file => $photo) {
            $target = $dir.DIRECTORY_SEPARATOR.$file;

            if (is_file($target) && filesize($target) > 0 && ! $this->option('force')) {
                $this->line("kept    {$file}");

                continue;
            }

            $url = $this->downloadUrl($photo['credit']['source'], $photo['credit']['url']);

            if ($url === null) {
                $this->warn("no download URL for {$file} ({$photo['credit']['url']})");
                $failed++;

                continue;
            }

            $response = Http::timeout(120)->withOptions(['allow_redirects' => true])->get($url);

            if (! $response->successful() || ! str_starts_with((string) $response->header('Content-Type'), 'image/')) {
                $this->warn("failed  {$file}: HTTP {$response->status()} from {$url}");
                $failed++;

                continue;
            }

            file_put_contents($target, $response->body());
            $this->info("fetched {$file} (".round(strlen($response->body()) / 1024).' KB)');
        }

        return $failed === 0 ? self::SUCCESS : self::FAILURE;
    }

    /**
     * The file behind a photo page: Unsplash serves the original through its download endpoint,
     * Pexels through its image host by photo id. Anything else must be fetched by hand.
     */
    private function downloadUrl(string $source, string $pageUrl): ?string
    {
        if ($source === 'Unsplash' && preg_match('#unsplash\.com/photos/(?:[^/]+-)?([A-Za-z0-9_-]{11})#', $pageUrl, $m) === 1) {
            return 'https://unsplash.com/photos/'.$m[1].'/download?force=true';
        }

        if ($source === 'Pexels' && preg_match('#pexels\.com/(?:[a-z-]+/)?photo/(?:[^/]*-)?(\d+)/?#', $pageUrl, $m) === 1) {
            return 'https://images.pexels.com/photos/'.$m[1].'/pexels-photo-'.$m[1].'.jpeg';
        }

        return null;
    }
}
