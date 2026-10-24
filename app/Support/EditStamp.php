<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use JsonException;

/**
 * What a form was opened on, so a save made against an older state is refused rather than undoing a change made
 * meanwhile — in another tab or by someone else (the admin audit's F-25). The page editor has done this since
 * PageChangedMeanwhile; the other forms that rewrite several fields at once do it through this stamp.
 *
 * The page gets the stamp of the record's state with its props and sends it back in a header with each save. The
 * save compares it with the state as it is now: equal goes through, different is refused in a sentence and nothing
 * is written. A request without the header (a script, an older page) is not checked: the stamp protects the person
 * at the form, it is no access control.
 */
final class EditStamp
{
    public const HEADER = 'X-Rimify-Stand';

    public const MESSAGE = 'Das wurde inzwischen in einem anderen Tab oder von jemand anderem geändert, deshalb ist nichts gespeichert. Deine Eingaben sind noch da: Kopier sie, falls du sie brauchst, und lade die Seite dann neu.';

    /** The stamp of a state: the same state gives the same stamp, any change another. */
    public static function of(mixed $state): string
    {
        try {
            $json = json_encode($state, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION);
        } catch (JsonException) {
            $json = serialize($state);
        }

        return substr(hash('sha256', $json), 0, 24);
    }

    /** Refuses the save when the page was opened on another state than the one there is now. */
    public static function guard(Request $request, mixed $current): void
    {
        $sent = $request->header(self::HEADER);

        if (! is_string($sent) || $sent === '') {
            return;
        }

        if (! hash_equals(self::of($current), $sent)) {
            throw ValidationException::withMessages(['_stamp' => self::MESSAGE]);
        }
    }
}
