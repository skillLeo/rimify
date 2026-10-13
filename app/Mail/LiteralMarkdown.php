<?php

declare(strict_types=1);

namespace App\Mail;

use App\Support\MailText;
use Illuminate\Mail\Markdown;
use Illuminate\Support\EncodedHtmlString;
use Illuminate\Support\HtmlString;
use TijsVerkoyen\CssToInlineStyles\CssToInlineStyles;

/**
 * The mail renderer, with one rule added: whatever a template prints with `{{ }}` is printed literally (MailText).
 *
 * The rule sits here and not in the templates, so there is no mail and no variable it can be forgotten for: a template
 * writes its own Markdown, and every value it is given — a visitor's message, a Gutachten's sentence, a name, a number —
 * is text. What a template prints as markup on purpose it prints with an HtmlString, as before.
 */
final class LiteralMarkdown extends Markdown
{
    /**
     * @param  string  $view
     * @param  array<string, mixed>  $data
     * @param  CssToInlineStyles|null  $inliner
     * @return HtmlString
     */
    public function render($view, array $data = [], $inliner = null)
    {
        EncodedHtmlString::encodeUsing(static fn (mixed $value): string => MailText::literal((string) $value));

        try {
            return parent::render($view, $data, $inliner);
        } finally {
            EncodedHtmlString::flushState();
        }
    }
}
