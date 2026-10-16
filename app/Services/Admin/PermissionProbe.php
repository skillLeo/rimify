<?php

declare(strict_types=1);

namespace App\Services\Admin;

/**
 * A screen asking what it may offer — draw „Bearbeiten“? „Freigeben“? — is a question, not an attempt.
 *
 * The Gate writes every refusal to the Protokoll (AuthServiceProvider): a request refused, an address refused. A page
 * asking the same Policy whether to draw a button is answered by the same rules, but its „no“ refused nobody — written
 * as `permission.denied`, it recorded events that never happened: two for every view of a released Gutachten, 22 in the
 * client's first evening (ADMIN-GEFUNDEN 509). Inside `quietly()` the Policy answers as always and a „no“ is not written.
 * Every attempt still passes its Form Request outside of it, and a refusal there is written.
 */
final class PermissionProbe
{
    private static int $depth = 0;

    /**
     * @template T
     *
     * @param  callable(): T  $ask
     * @return T
     */
    public static function quietly(callable $ask): mixed
    {
        self::$depth++;

        try {
            return $ask();
        } finally {
            self::$depth--;
        }
    }

    /** Whether the Gate is being asked by a screen rather than by an attempt. */
    public static function asking(): bool
    {
        return self::$depth > 0;
    }
}
