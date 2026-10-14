<?php

declare(strict_types=1);

namespace App\Listeners;

use Illuminate\Mail\Events\MessageSending;
use Illuminate\Support\Facades\Log;

/**
 * Before any mail leaves: nothing in it may make the reader's mail program fetch something from a host that is not the
 * shop's own (finding 102, D-218). A fetched image tells its host who opened which mail, when and from where; in a mail
 * the shop sends, only the shop may learn that — and at present no mail of ours carries an image at all.
 *
 * The mails' templates hold none, and what a person typed is printed literally (App\Support\MailText). This is the rule
 * for whatever is written next: an image, a stylesheet, a frame or a CSS `url()` that points elsewhere is taken out,
 * the mail goes without it, and the log says which mail it was, so the template gets fixed.
 *
 * Links stay: a link is followed by a person, not fetched by a program. The message always goes on.
 */
final class StripRemoteMailContent
{
    /** Elements a mail program loads by itself. */
    private const FETCHED = 'img|picture|source|video|audio|track|iframe|frame|object|embed|link|script|input|bgsound';

    public function handle(MessageSending $event): void
    {
        $html = $event->message->getHtmlBody();

        if (! is_string($html) || $html === '') {
            return;
        }

        $clean = self::clean($html, self::ownHosts());

        if ($clean !== $html) {
            $event->message->html($clean);

            Log::warning('A mail carried something a mail program would have fetched from another host; it was taken out before sending', [
                'subject' => $event->message->getSubject(),
            ]);
        }
    }

    /**
     * The HTML without anything fetched from a host that is not one of `$own`.
     *
     * @param  list<string>  $own
     */
    public static function clean(string $html, array $own): string
    {
        $remote = static fn (string $address): bool => self::isRemote($address, $own);

        // An element that loads by itself: gone when any address in it points elsewhere. An image leaves its alt text.
        $html = (string) preg_replace_callback('/<('.self::FETCHED.')\b[^>]*>/iu', static function (array $m) use ($remote): string {
            preg_match_all('/\b(?:src|srcset|href|data|poster|background)\s*=\s*(?:"([^"]*)"|\'([^\']*)\'|([^\s>]+))/iu', $m[0], $found, PREG_SET_ORDER);

            foreach ($found as $attribute) {
                $value = $attribute[1] !== '' ? $attribute[1] : ($attribute[2] ?? '');
                $value = $value !== '' ? $value : ($attribute[3] ?? '');

                // `srcset` holds several addresses, each followed by a width.
                foreach (preg_split('/\s*,\s*/u', $value) ?: [] as $candidate) {
                    if ($remote((string) strtok(trim($candidate), " \t"))) {
                        return preg_match('/\balt\s*=\s*"([^"]*)"/iu', $m[0], $alt) === 1 ? $alt[1] : '';
                    }
                }
            }

            return $m[0];
        }, $html);

        // `background="…"` on a table or a cell.
        $html = (string) preg_replace_callback('/\sbackground\s*=\s*(?:"([^"]*)"|\'([^\']*)\')/iu', static fn (array $m): string => $remote($m[1] !== '' ? $m[1] : ($m[2] ?? '')) ? '' : $m[0], $html);

        // CSS — in a style element or a style attribute, never in the words of the mail: `@import` and `url(…)`.
        $css = static function (string $rules) use ($remote): string {
            $rules = (string) preg_replace_callback('/@import\s+(?:url\(\s*)?["\']?([^"\');\s]+)[^;]*;?/iu', static fn (array $m): string => $remote($m[1]) ? '' : $m[0], $rules);

            return (string) preg_replace_callback('/url\(\s*["\']?([^"\')]+)["\']?\s*\)/iu', static fn (array $m): string => $remote($m[1]) ? 'none' : $m[0], $rules);
        };

        $html = (string) preg_replace_callback('#(<style\b[^>]*>)(.*?)(</style>)#isu', static fn (array $m): string => $m[1].$css($m[2]).$m[3], $html);

        return (string) preg_replace_callback('/(\sstyle\s*=\s*")([^"]*)(")/iu', static fn (array $m): string => $m[1].$css($m[2]).$m[3], $html);
    }

    /**
     * Does this address make a program ask another host? An attached image (`cid:`), an inline one (`data:`) and a
     * path of our own do not; `//host/…` and any scheme with a host do, unless the host is ours.
     *
     * @param  list<string>  $own
     */
    public static function isRemote(string $address, array $own): bool
    {
        $address = trim(html_entity_decode($address, ENT_QUOTES | ENT_HTML5, 'UTF-8'));

        if ($address === '' || preg_match('/^(cid|data):/i', $address) === 1) {
            return false;
        }

        if (preg_match('#^(?:[a-z][a-z0-9+.-]*:)?//([^/?\#]*)#i', $address, $m) !== 1) {
            // No host: a path of ours — or a scheme a mail program does not fetch (`mailto:`, `tel:`).
            return false;
        }

        $host = mb_strtolower((string) preg_replace('/^.*@|:\d+$/', '', $m[1]));

        return ! in_array($host, $own, true);
    }

    /** @return list<string> */
    private static function ownHosts(): array
    {
        $host = parse_url((string) config('app.url'), PHP_URL_HOST);

        return is_string($host) && $host !== '' ? [mb_strtolower($host)] : [];
    }
}
