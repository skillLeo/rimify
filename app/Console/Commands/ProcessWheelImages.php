<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Support\DemoWheels;
use Illuminate\Console\Command;
use Symfony\Component\Process\ExecutableFinder;
use Symfony\Component\Process\Process;

/**
 * The demo wheels' cut-outs, from the free-licence photographs to the files the catalogue serves.
 *
 * For every photograph in database/seeders/content/wheel-photos.php (or one named photograph) the
 * command produces a transparent cut-out, colour-corrects it, stands it on a contact shadow and
 * exports responsive AVIF, WebP, PNG and JPEG at two aspect ratios with a manifest the `Picture`
 * component reads — into `rimify.demo.wheels_dir`, one directory per slug.
 *
 * Two ways to the cut-out. When a `rembg` executable is on the PATH it separates the subject from
 * the background (`birefnet-general`, `-dc` colour decontamination, never `-ppm`) and its alpha is
 * intersected with the photograph's measured wheel circle. Without it — Python is absent on most
 * developer machines here — the circle alone does the work, which for a face-on wheel is exact:
 * a wheel's silhouette is a circle. Either way the rest of the pipeline is scripts/wheel-image.mjs,
 * invoked with an argument array and never a shell string (R-14 in spirit: no string-built input).
 *
 * Idempotent: a manifest carries a fingerprint of the source bytes, the parameters and the
 * pipeline version, and an unchanged photograph is skipped unless `--force`.
 */
final class ProcessWheelImages extends Command
{
    protected $signature = 'wheels:process-images
        {source? : One photograph — a file name in the sources directory or a path; every mapped photograph when omitted}
        {--slug= : Output name, overriding the map}
        {--circle= : The wheel as cx,cy,r in source pixels, overriding the map}
        {--hub= : The centre cap to paint over as cx,cy,r in source pixels, overriding the map}
        {--mask= : A grey alpha mask for an angled studio shot, used instead of the circle}
        {--force : Re-render even when the output is up to date}';

    protected $description = 'Cut the demo wheels out of their photographs and export the responsive images the catalogue serves';

    private const PIPELINE_VERSION = 4;

    public function handle(): int
    {
        $jobs = $this->jobs();

        if ($jobs === null) {
            return self::FAILURE;
        }

        if ($jobs === []) {
            $this->warn('Nothing to process: the photograph map is empty.');

            return self::SUCCESS;
        }

        $rembg = (new ExecutableFinder)->find('rembg');
        $node = (new ExecutableFinder)->find('node');

        if ($node === null) {
            $this->error('node is not on the PATH; scripts/wheel-image.mjs needs it.');

            return self::FAILURE;
        }

        $this->line($rembg === null
            ? 'rembg not found on the PATH — cutting with the sharp circular mask.'
            : sprintf('rembg found at %s — birefnet-general with colour decontamination, intersected with the circle.', $rembg));

        $failed = 0;

        foreach ($jobs as $job) {
            if (! $this->process($job, $node, $rembg)) {
                $failed++;
            }
        }

        $this->newLine();
        $this->line(sprintf('%d photograph(s), %d failed → %s', count($jobs), $failed, DemoWheels::dir()));

        return $failed === 0 ? self::SUCCESS : self::FAILURE;
    }

    /**
     * What to render: every mapped photograph, or the one named — from the map when it is there,
     * from the options otherwise.
     *
     * @return list<array{file: string, path: string, slug: string, circle: array{0: int, 1: int, 2: int}|null, mask: string|null, hub: array{0: int, 1: int, 2: int}|null, colour: string, credit: array<string, string>|null}>|null
     */
    private function jobs(): ?array
    {
        $map = DemoWheels::photos();
        $source = $this->argument('source');

        if (! is_string($source) || $source === '') {
            $jobs = [];

            foreach ($map as $file => $entry) {
                $job = $this->job((string) $file, $entry, fromOptions: false);

                if ($job === null) {
                    return null;
                }

                $jobs[] = $job;
            }

            return $jobs;
        }

        $file = basename($source);
        $job = $this->job($file, $map[$file] ?? [], fromOptions: true, path: is_file($source) ? $source : null);

        return $job === null ? null : [$job];
    }

    /**
     * @param  array<string, mixed>  $entry
     * @return array{file: string, path: string, slug: string, circle: array{0: int, 1: int, 2: int}|null, mask: string|null, hub: array{0: int, 1: int, 2: int}|null, colour: string, credit: array<string, string>|null}|null
     */
    private function job(string $file, array $entry, bool $fromOptions, ?string $path = null): ?array
    {
        $slugOption = $this->option('slug');
        $circleOption = $this->option('circle');
        $hubOption = $this->option('hub');
        $maskOption = $this->option('mask');

        $slug = $fromOptions && is_string($slugOption) && $slugOption !== '' ? $slugOption : ($entry['slug'] ?? null);
        $circle = $fromOptions && is_string($circleOption) && $circleOption !== '' ? $this->parseCircle($circleOption) : ($entry['circle'] ?? null);
        $hub = $fromOptions && is_string($hubOption) && $hubOption !== '' ? $this->parseCircle($hubOption) : ($entry['hub'] ?? null);

        // A client studio shot names its mask beside it in the repository; a one-off run may pass a path.
        $mask = match (true) {
            $fromOptions && is_string($maskOption) && $maskOption !== '' => $maskOption,
            isset($entry['mask']) && is_string($entry['mask']) => DemoWheels::clientPhotosDir().DIRECTORY_SEPARATOR.$entry['mask'],
            default => null,
        };

        if (! is_string($slug) || preg_match('/^[a-z0-9][a-z0-9-]*$/', $slug) !== 1) {
            $this->error(sprintf('%s: a slug is needed (--slug, lower-case letters, digits and hyphens).', $file));

            return null;
        }

        if ($mask !== null && ! is_file($mask)) {
            $this->error(sprintf('%s: the mask %s does not exist.', $file, $mask));

            return null;
        }

        if ($mask === null && (! is_array($circle) || count($circle) !== 3)) {
            $this->error(sprintf('%s: the wheel circle is needed (--circle cx,cy,r in source pixels), or a --mask.', $file));

            return null;
        }

        if ($hub !== null && (! is_array($hub) || count($hub) !== 3 || (int) $hub[2] <= 0)) {
            $this->error(sprintf('%s: the hub must be cx,cy,r in source pixels with r > 0.', $file));

            return null;
        }

        $path ??= DemoWheels::sourcesDir().DIRECTORY_SEPARATOR.$file;

        if (! is_file($path)) {
            $this->error(sprintf('%s: photograph not found at %s.', $file, $path));

            return null;
        }

        $credit = $entry['credit'] ?? null;

        return [
            'file' => $file,
            'path' => $path,
            'slug' => $slug,
            'circle' => is_array($circle) && count($circle) === 3 ? [(int) $circle[0], (int) $circle[1], (int) $circle[2]] : null,
            'mask' => $mask,
            // A hub is measured against the circle; a masked shot shows the product brand's own cap.
            'hub' => $hub === null || $mask !== null ? null : [(int) $hub[0], (int) $hub[1], (int) $hub[2]],
            'colour' => (string) ($entry['colour'] ?? 'cool'),
            'credit' => is_array($credit) ? array_map('strval', $credit) : null,
        ];
    }

    /** @return array{0: int, 1: int, 2: int}|null */
    private function parseCircle(string $value): ?array
    {
        if (preg_match('/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*$/', $value, $m) !== 1) {
            return null;
        }

        return [(int) $m[1], (int) $m[2], (int) $m[3]];
    }

    /**
     * @param  array{file: string, path: string, slug: string, circle: array{0: int, 1: int, 2: int}|null, mask: string|null, hub: array{0: int, 1: int, 2: int}|null, colour: string, credit: array<string, string>|null}  $job
     */
    private function process(array $job, string $node, ?string $rembg): bool
    {
        $outDir = DemoWheels::dir().DIRECTORY_SEPARATOR.$job['slug'];
        $fingerprint = $this->fingerprint($job, $rembg !== null);

        if (! $this->option('force')) {
            $existing = DemoWheels::manifest($job['slug']);

            if ($existing !== null && ($existing['fingerprint'] ?? null) === $fingerprint) {
                $this->line(sprintf('  %s → %s: unchanged, skipped', $job['file'], $job['slug']));

                return true;
            }
        }

        if (! is_dir($outDir) && ! mkdir($outDir, 0775, true) && ! is_dir($outDir)) {
            $this->error(sprintf('  %s: cannot create %s', $job['file'], $outDir));

            return false;
        }

        $cutout = null;

        // A masked shot is already cut; rembg only helps a circle separate the wheel from its car.
        if ($rembg !== null && $job['mask'] === null) {
            $cutout = $this->rembg($rembg, $job, $outDir);
        }

        $arguments = [
            $node,
            base_path('scripts/wheel-image.mjs'),
            '--source', $job['path'],
            '--out', $outDir,
            '--slug', $job['slug'],
            '--public-base', DemoWheels::publicBase(),
            '--colour', $job['colour'],
            '--fingerprint', $fingerprint,
        ];

        if ($job['mask'] !== null) {
            $arguments[] = '--mask';
            $arguments[] = $job['mask'];
        } elseif ($job['circle'] !== null) {
            $arguments[] = '--circle';
            $arguments[] = implode(',', $job['circle']);
        }

        if ($job['hub'] !== null) {
            $arguments[] = '--hub';
            $arguments[] = implode(',', $job['hub']);
        }

        if ($job['credit'] !== null) {
            $arguments[] = '--credit-json';
            $arguments[] = (string) json_encode($job['credit'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        }

        if ($cutout !== null) {
            $arguments[] = '--cutout';
            $arguments[] = $cutout;
        }

        $process = new Process($arguments, base_path(), timeout: 900);
        $process->run();

        if (! $process->isSuccessful()) {
            $this->error(sprintf('  %s → %s: wheel-image.mjs failed', $job['file'], $job['slug']));
            $this->line(trim($process->getErrorOutput()));

            return false;
        }

        if (DemoWheels::manifest($job['slug']) === null) {
            $this->error(sprintf('  %s → %s: no well-formed manifest was written', $job['file'], $job['slug']));

            return false;
        }

        $this->line('  '.trim($process->getOutput()));

        return true;
    }

    /**
     * rembg's cut-out of the whole photograph, as a PNG beside the output. A failure here is a
     * warning, not an error: the circle still produces a valid cut-out without it.
     *
     * @param  array{file: string, path: string, slug: string}  $job
     */
    private function rembg(string $rembg, array $job, string $outDir): ?string
    {
        $cutout = $outDir.DIRECTORY_SEPARATOR.'source-cutout.png';

        $process = new Process(
            [$rembg, 'i', '-m', 'birefnet-general', '-dc', $job['path'], $cutout],
            base_path(),
            timeout: 900,
        );
        $process->run();

        if (! $process->isSuccessful() || ! is_file($cutout)) {
            $this->warn(sprintf('  %s: rembg failed, falling back to the circular mask', $job['file']));
            $this->line(trim($process->getErrorOutput()));

            return null;
        }

        return $cutout;
    }

    /**
     * @param  array{path: string, slug: string, circle: array{0: int, 1: int, 2: int}|null, mask: string|null, hub: array{0: int, 1: int, 2: int}|null, colour: string, credit: array<string, string>|null}  $job
     */
    private function fingerprint(array $job, bool $withRembg): string
    {
        return sha1(implode('|', [
            (string) sha1_file($job['path']),
            $job['slug'],
            $job['circle'] === null ? 'no-circle' : implode(',', $job['circle']),
            $job['mask'] === null ? 'no-mask' : 'mask:'.sha1_file($job['mask']),
            $job['hub'] === null ? 'no-hub' : implode(',', $job['hub']),
            $job['colour'],
            (string) json_encode($job['credit']),
            DemoWheels::publicBase(),
            $withRembg ? 'rembg' : 'mask',
            'v'.self::PIPELINE_VERSION,
        ]));
    }
}
