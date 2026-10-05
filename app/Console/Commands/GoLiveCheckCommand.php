<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\GoLive\GoLiveCheck;
use App\Services\GoLive\GoLiveChecks;
use App\Services\GoLive\WasFehlt;
use Illuminate\Console\Command;

/**
 * `rimify:go-live-check`: what the live shop still needs, read from the state it is in (the operator's brief of
 * 05.10.2026, §7). The count line first — `21 von 30 erfüllt · 3 bei uns · 5 beim Kunden` — then every check with who
 * closes it, its state, one sentence and the place it is closed. Fails while anything that is ours is missing; what the
 * client or the host owes does not fail it, it is listed. `--json` for a machine, `--markdown=docs/review/WAS-FEHLT.md`
 * writes the page the client reads.
 */
final class GoLiveCheckCommand extends Command
{
    protected $signature = 'rimify:go-live-check
        {--json : Print the checks as JSON}
        {--markdown= : Write the report as Markdown to this path (relative to the project)}';

    protected $description = 'Was dem Live-Shop noch fehlt: jede Prüfung mit Zuständigkeit, Stand und Ort';

    public function handle(GoLiveChecks $checks): int
    {
        $all = $checks->all();
        $line = GoLiveChecks::countLine($all);
        $ours = array_values(array_filter($all, static fn (GoLiveCheck $c): bool => $c->missing() && $c->owner === GoLiveCheck::US));

        $markdown = $this->option('markdown');

        if (is_string($markdown) && $markdown !== '') {
            $path = str_starts_with($markdown, '/') || preg_match('/^[A-Za-z]:[\\\\\/]/', $markdown) === 1 ? $markdown : base_path($markdown);
            file_put_contents($path, WasFehlt::markdown($all, now('Europe/Berlin')));
        }

        if ($this->option('json')) {
            $this->line((string) json_encode([
                'summary' => $line,
                'checks' => array_map(static fn (GoLiveCheck $c): array => $c->toArray(), $all),
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

            return $ours === [] ? self::SUCCESS : self::FAILURE;
        }

        $this->line($line);

        foreach (GoLiveChecks::GROUPS as $group) {
            $this->newLine();
            $this->line("<options=bold>{$group}</>");
            $this->table(['Prüfung', 'Zuständig', 'Stand', 'Befund', 'Wo'], array_map(static fn (GoLiveCheck $c): array => [
                $c->title,
                $c->owner,
                $c->state,
                $c->sentence,
                $c->place,
            ], array_values(array_filter($all, static fn (GoLiveCheck $c): bool => $c->group === $group))));
        }

        if (is_string($markdown) && $markdown !== '') {
            $this->line("Geschrieben: {$markdown}");
        }

        return $ours === [] ? self::SUCCESS : self::FAILURE;
    }
}
