<?php

declare(strict_types=1);

namespace App\Support;

/**
 * A value as it is printed into a Markdown mail: literally.
 *
 * A mail's template is Markdown, and what a `{{ }}` prints into it is read as Markdown too — the framework escapes it
 * for HTML, not for Markdown. So a visitor's „[Hier klicken](https://…)“ became a link, and an image an image, in a mail
 * the shop sends to whatever address the visitor typed; „e1*2001/116*0314*10“ lost two stars to italics; and a
 * Gutachten's sentence that starts „1. …“ would have been numbered by us. What is printed is somebody's words — a
 * customer's, a document's — and a mail may not change them.
 *
 * Every character Markdown reads as syntax is written as a numeric character reference. CommonMark takes a reference
 * as the character itself and never as syntax (spec 6.2), the HTML part shows the character, and the plain-text part —
 * which decodes entities — shows it too. A backslash escape would have stood in the plain text as typed.
 */
final class MailText
{
    /** Syntax wherever it stands, and what HTML itself reads. */
    private const ALWAYS = [
        '&' => '&amp;', '<' => '&lt;', '>' => '&gt;', '"' => '&quot;', "'" => '&#39;',
        '\\' => '&#92;', '`' => '&#96;', '*' => '&#42;', '_' => '&#95;', '[' => '&#91;', ']' => '&#93;',
        '|' => '&#124;', '~' => '&#126;',
    ];

    /** Syntax only as the first thing on a line: a heading, a list, a rule, the line under a heading. */
    private const AT_LINE_START = ['#' => '&#35;', '-' => '&#45;', '+' => '&#43;', '=' => '&#61;'];

    public static function literal(string $value): string
    {
        $lines = preg_split('/\R/u', strtr($value, self::ALWAYS)) ?: [];

        foreach ($lines as $i => $line) {
            // Four spaces or a tab would open a code block: written as references, they are spaces and nothing else.
            $line = (string) preg_replace_callback('/^(?: {4,}|\t[ \t]*)/', static fn (array $m): string => str_repeat('&#32;', strlen($m[0])), $line);
            // „1. …“ and „1) …“ would be numbered by us.
            $line = (string) preg_replace_callback('/^( {0,3}\d{1,9})([.)])/', static fn (array $m): string => $m[1].($m[2] === '.' ? '&#46;' : '&#41;'), $line);
            $line = (string) preg_replace_callback('/^( {0,3})([#\-+=])/', static fn (array $m): string => $m[1].self::AT_LINE_START[$m[2]], $line);

            $lines[$i] = $line;
        }

        return implode("\n", $lines);
    }
}
