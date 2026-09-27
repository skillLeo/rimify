<?php

declare(strict_types=1);

namespace App\Services\Storage;

use Aws\Exception\AwsException;
use Illuminate\Support\Str;
use Throwable;

/**
 * „Verbindung testen“: a real round trip on the private prefix — write a small file, read it back,
 * compare, delete it — each step a line of its own, with the storage's own words where one fails
 * (the raw AWS error: „NoSuchBucket“ says what a hint never could). Tests a set that is not in force
 * yet, so a save can be checked before it replaces what works.
 *
 * @phpstan-type Step array{step: string, ok: bool, detail: string|null}
 * @phpstan-type Result array{ok: bool, steps: list<Step>, at: string}
 */
final class StorageTester
{
    public function __construct(private readonly MediaDisks $disks) {}

    /** @return Result */
    public function run(StorageConfig $set): array
    {
        $steps = [];
        $path = (string) config('media.healthcheck', '.healthcheck');
        $content = 'rimify-healthcheck '.Str::ulid();

        try {
            $disk = $this->disks->make($this->disks->config('docs_private', $set));
        } catch (Throwable $e) {
            return self::result([['step' => 'Verbindung aufbauen', 'ok' => false, 'detail' => self::reason($e)]]);
        }

        $write = self::attempt(fn () => $disk->put($path, $content));
        $steps[] = ['step' => 'Testdatei in invoices/ schreiben', 'ok' => $write === null, 'detail' => $write];

        if ($write === null) {
            $got = null;
            $readError = self::attempt(function () use ($disk, $path, &$got): void {
                $got = $disk->get($path);
            });
            $steps[] = ['step' => 'Testdatei wieder lesen', 'ok' => $readError === null, 'detail' => $readError];

            if ($readError === null) {
                $same = $got === $content;
                $steps[] = ['step' => 'Inhalt vergleichen', 'ok' => $same, 'detail' => $same ? null : 'Gelesen wurde etwas anderes, als geschrieben wurde.'];
            }

            $delete = self::attempt(fn () => $disk->delete($path));
            $steps[] = ['step' => 'Testdatei löschen', 'ok' => $delete === null, 'detail' => $delete];
        }

        return self::result($steps);
    }

    /**
     * @param  list<array{step: string, ok: bool, detail: string|null}>  $steps
     * @return Result
     */
    private static function result(array $steps): array
    {
        return [
            'ok' => $steps !== [] && array_reduce($steps, static fn (bool $all, array $s): bool => $all && $s['ok'], true),
            'steps' => $steps,
            'at' => now()->toIso8601String(),
        ];
    }

    /** Null when it worked; the storage's own reason when it did not. */
    private static function attempt(callable $step): ?string
    {
        try {
            $result = $step();

            return $result === false ? 'Der Speicher hat den Schritt abgelehnt, ohne einen Grund zu nennen.' : null;
        } catch (Throwable $e) {
            return self::reason($e);
        }
    }

    /** The innermost AWS error — code and message — or the exception's own message. */
    public static function reason(Throwable $e): string
    {
        for ($cause = $e; $cause !== null; $cause = $cause->getPrevious()) {
            if ($cause instanceof AwsException) {
                $code = $cause->getAwsErrorCode();
                $message = $cause->getAwsErrorMessage();

                return trim(($code ? "{$code}: " : '').($message ?: $cause->getMessage()));
            }
        }

        return $e->getMessage();
    }
}
