<?php

declare(strict_types=1);

namespace App\Services\Storage;

use RuntimeException;

/**
 * An upload refused, with the German sentence the person reads (the message) — why, and what to do.
 * `storageDown` marks the one case that is not about the file: the bucket did not answer.
 */
final class UploadRejected extends RuntimeException
{
    public const STORAGE_DOWN = 'Der Speicher ist gerade nicht erreichbar. Deine Datei ist nicht gespeichert – versuch es bitte in ein paar Minuten noch einmal.';

    public function __construct(string $sentence, public readonly bool $storageDown = false)
    {
        parent::__construct($sentence);
    }

    public static function storageDown(): self
    {
        return new self(self::STORAGE_DOWN, true);
    }
}
