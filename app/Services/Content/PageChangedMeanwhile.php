<?php

declare(strict_types=1);

namespace App\Services\Content;

use RuntimeException;

/**
 * A write to a page made against a version somebody else has since changed. Refused, so nobody's
 * draft or live words are undone by a page that was out of date (PagePublisher::lock).
 */
final class PageChangedMeanwhile extends RuntimeException
{
    public const MESSAGE = 'Die Seite wurde inzwischen von jemand anderem geändert, deshalb ist nichts gespeichert. Deine Eingaben sind noch da: Kopier sie, falls du sie brauchst, und lade die Seite dann neu.';

    public function __construct()
    {
        parent::__construct(self::MESSAGE);
    }
}
