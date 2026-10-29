<?php

declare(strict_types=1);

namespace App\Services\Content;

use DOMDocument;
use DOMElement;
use DOMNode;
use DOMText;

/**
 * The HTML a Ratgeber article's „HTML-Abschnitt“ may hold (his admin item 11, „We will go with your proposal“; D-352):
 * headings h2 to h4, paragraphs, line breaks, lists, tables (thead, tbody, tr, th, td), links, images, bold and italic.
 * Everything else goes — script, iframe, style, every `on…` attribute, every inline style, every address that is not
 * http, https, mailto or a page of this shop. Run when the draft is saved (PageSchema) and again when the article is
 * served (ArticleBlocks), so a row written past the editor is cleaned on its way out too.
 *
 * Nothing of the input is passed on as markup: the fragment is parsed, and the output is written anew from the elements
 * on this list, with their few attributes checked one by one and every text escaped. A link gets rel="noopener
 * noreferrer"; a picture is kept only from our own storage and with its description (D-183, as the figure block).
 */
final class ArticleHtml
{
    /** The elements kept, each with the attributes it may carry. */
    private const ALLOWED = [
        'h2' => [], 'h3' => [], 'h4' => [],
        'p' => [], 'br' => [],
        'ul' => [], 'ol' => [], 'li' => [],
        'table' => [], 'thead' => [], 'tbody' => [], 'tr' => [],
        'th' => ['scope', 'colspan', 'rowspan'], 'td' => ['colspan', 'rowspan'],
        'a' => ['href'],
        'img' => ['src', 'alt', 'width', 'height'],
        'strong' => [], 'b' => [], 'em' => [], 'i' => [],
    ];

    /** Elements that go with everything inside them: code, styles, frames, forms and foreign markup are never text. */
    private const DROPPED = [
        'script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet', 'noscript', 'noembed', 'noframes',
        'template', 'svg', 'math', 'form', 'input', 'button', 'select', 'option', 'textarea', 'link', 'meta', 'base', 'head',
        'title', 'xmp', 'plaintext', 'canvas', 'video', 'audio', 'source', 'track', 'picture', 'map', 'area', 'dialog',
    ];

    /** Elements without content. */
    private const VOID = ['br', 'img'];

    /** Deeper than this the rest is kept as its words only: a fragment nested past reason is no article. */
    private const MAX_DEPTH = 32;

    public static function clean(string $html): string
    {
        $html = trim($html);

        if ($html === '') {
            return '';
        }

        $document = new DOMDocument('1.0', 'UTF-8');
        $previous = libxml_use_internal_errors(true);
        // The prolog tells libxml the fragment is UTF-8; it stays outside the body and is never read.
        $document->loadHTML('<?xml encoding="UTF-8"?><html><body>'.$html.'</body></html>', LIBXML_NONET | LIBXML_HTML_NODEFDTD | LIBXML_COMPACT);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $body = $document->getElementsByTagName('body')->item(0);

        return $body === null ? '' : trim(self::children($body, 0));
    }

    private static function children(DOMNode $node, int $depth): string
    {
        $out = '';

        foreach ($node->childNodes as $child) {
            $out .= self::node($child, $depth);
        }

        return $out;
    }

    private static function node(DOMNode $node, int $depth): string
    {
        // Text and CDATA are words, escaped; a comment or a processing instruction is nothing.
        if ($node instanceof DOMText) {
            return self::escape($node->data);
        }

        if (! $node instanceof DOMElement) {
            return '';
        }

        $tag = strtolower($node->nodeName);

        if (in_array($tag, self::DROPPED, true)) {
            return '';
        }

        if ($depth >= self::MAX_DEPTH) {
            return self::escape($node->textContent);
        }

        // An element not on the list (a div, a span, a font) leaves its content behind, cleaned as everything else.
        if (! array_key_exists($tag, self::ALLOWED)) {
            return self::children($node, $depth + 1);
        }

        $attributes = self::attributes($tag, $node);

        // A link without a safe address keeps its words; a picture not from our storage, or without its description, goes.
        if ($attributes === null) {
            return $tag === 'a' ? self::children($node, $depth + 1) : '';
        }

        if (in_array($tag, self::VOID, true)) {
            return '<'.$tag.$attributes.'>';
        }

        return '<'.$tag.$attributes.'>'.self::children($node, $depth + 1).'</'.$tag.'>';
    }

    /** The attributes kept, written anew — or null where the element cannot stand without the one it lacks. */
    private static function attributes(string $tag, DOMElement $node): ?string
    {
        if ($tag === 'a') {
            $href = self::href($node->getAttribute('href'));

            return $href === null ? null : ' href="'.self::escape($href).'" rel="noopener noreferrer"';
        }

        if ($tag === 'img') {
            $src = trim($node->getAttribute('src'));
            $alt = trim(preg_replace('/\s+/u', ' ', $node->getAttribute('alt')) ?? '');

            if ($src === '' || $alt === '' || preg_match('/[\x00-\x20\x7F"\'<>`]/', $src) === 1 || ! PageSchema::ownImage($src)) {
                return null;
            }

            $out = ' src="'.self::escape($src).'" alt="'.self::escape($alt).'"';

            foreach (['width', 'height'] as $size) {
                $value = trim($node->getAttribute($size));

                if (preg_match('/^[1-9]\d{0,3}$/', $value) === 1) {
                    $out .= ' '.$size.'="'.$value.'"';
                }
            }

            return $out.' loading="lazy" decoding="async"';
        }

        $out = '';

        foreach (self::ALLOWED[$tag] as $name) {
            $value = strtolower(trim($node->getAttribute($name)));

            if (($name === 'colspan' || $name === 'rowspan') && preg_match('/^[1-9]\d?$/', $value) === 1) {
                $out .= ' '.$name.'="'.$value.'"';
            } elseif ($name === 'scope' && in_array($value, ['col', 'row', 'colgroup', 'rowgroup'], true)) {
                $out .= ' scope="'.$value.'"';
            }
        }

        return $out;
    }

    /**
     * A link's address, if it is http, https, mailto or a page of this shop (`/felgenrechner`). Browsers drop control
     * characters and white space inside a scheme — „java&#9;script:“ is javascript: — so the scheme is read without them.
     */
    private static function href(string $raw): ?string
    {
        $href = trim($raw);
        $probe = strtolower((string) preg_replace('/[\x00-\x20\x7F]+/', '', $href));

        if ($probe === '' || preg_match('/["\'<>`]/', $href) === 1) {
            return null;
        }

        $allowed = str_starts_with($probe, 'https://')
            || str_starts_with($probe, 'http://')
            || (str_starts_with($probe, 'mailto:') && strlen($probe) > 7)
            // A path of this shop — never „//host“ or „/\host“, which a browser reads as another site.
            || preg_match('#^/(?![/\\\\])#', $probe) === 1;

        return $allowed ? $href : null;
    }

    private static function escape(string $text): string
    {
        return htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5, 'UTF-8');
    }
}
