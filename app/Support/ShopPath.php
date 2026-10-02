<?php

declare(strict_types=1);

namespace App\Support;

/**
 * A path of this shop and nothing else — for every „where to go back to“ a request carries (the contact form's page,
 * the RIMIFY-Check a car was chosen from): one leading slash, plain characters, at most 250 of them; no `//` anywhere
 * and no `.` or `..` segment, so nothing a browser could resolve towards another host; `\z`, not `$`, so a trailing
 * line break is no path either.
 */
final class ShopPath
{
    public static function of(mixed $value): ?string
    {
        return is_string($value) && preg_match('#^(?!.*//)(?!.*/\.{1,2}(?:/|\?|\z))/[A-Za-z0-9/_\-.?=&%]{0,249}\z#', $value) === 1 ? $value : null;
    }
}
