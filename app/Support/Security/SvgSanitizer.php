<?php

declare(strict_types=1);

namespace App\Support\Security;

use DOMAttr;
use DOMDocument;
use DOMElement;
use DOMNode;

/**
 * An uploaded SVG, reduced to drawing. A logo is served from this shop's own origin, and an SVG is a
 * document that can carry scripts, event handlers, external references and entity tricks — opened
 * directly, it would run on our domain. So nothing is kept that is not on the list below: shapes,
 * gradients, clipping, text, and references inside the file (`#id`). No `<script>`, no `<style>`, no
 * `style` attribute, no `on…` handler, no `<foreignObject>`, no DOCTYPE or entity, no link out.
 *
 * A file that is not a well-formed SVG, or that has nothing left to draw, is refused (null) rather
 * than repaired into something else.
 */
final class SvgSanitizer
{
    /** Larger than any logo; a file past this is not what the brand wall draws. */
    public const MAX_BYTES = 512_000;

    private const ELEMENTS = [
        'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'defs', 'symbol', 'use',
        'lineargradient', 'radialgradient', 'stop', 'clippath', 'mask', 'title', 'desc', 'text', 'tspan',
    ];

    private const ATTRIBUTES = [
        'id', 'd', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'fx', 'fy', 'width', 'height',
        'viewbox', 'points', 'transform', 'preserveaspectratio', 'version', 'xmlns', 'xml:space',
        'fill', 'fill-rule', 'fill-opacity', 'opacity', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
        'stroke-miterlimit', 'stroke-opacity', 'stroke-dasharray', 'stroke-dashoffset', 'clip-rule', 'clip-path',
        'mask', 'offset', 'stop-color', 'stop-opacity', 'gradientunits', 'gradienttransform', 'spreadmethod',
        'clippathunits', 'maskunits', 'maskcontentunits', 'font-family', 'font-size', 'font-weight', 'font-style',
        'text-anchor', 'letter-spacing', 'dominant-baseline', 'href', 'xlink:href',
    ];

    public static function clean(string $svg): ?string
    {
        if ($svg === '' || strlen($svg) > self::MAX_BYTES) {
            return null;
        }

        // No entity and no internal DTD subset: the whole class of XML expansion and external-entity
        // attacks is shut before the parser sees the file. A plain DOCTYPE line (as drawing programs
        // write it) says nothing a drawing needs and is dropped.
        if (preg_match('/<!ENTITY|<!DOCTYPE[^>]*\[/i', $svg) === 1) {
            return null;
        }

        $svg = (string) preg_replace('/<!DOCTYPE[^>]*>/i', '', $svg);

        $document = new DOMDocument;
        $previous = libxml_use_internal_errors(true);
        $loaded = $document->loadXML($svg, LIBXML_NONET | LIBXML_NOBLANKS | LIBXML_COMPACT);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $root = $document->documentElement;

        if (! $loaded || ! $root instanceof DOMElement || mb_strtolower($root->localName ?? '') !== 'svg') {
            return null;
        }

        self::walk($root);

        if (! self::draws($root)) {
            return null;
        }

        $clean = $document->saveXML($root);

        return is_string($clean) && $clean !== '' ? '<?xml version="1.0" encoding="UTF-8"?>'."\n".$clean : null;
    }

    private static function walk(DOMElement $element): void
    {
        foreach (iterator_to_array($element->attributes ?? []) as $attribute) {
            if (! self::keeps($attribute)) {
                $element->removeAttributeNode($attribute);
            }
        }

        foreach (iterator_to_array($element->childNodes) as $child) {
            if ($child instanceof DOMElement) {
                if (in_array(mb_strtolower($child->localName ?? ''), self::ELEMENTS, true)) {
                    self::walk($child);
                } else {
                    $element->removeChild($child);
                }
            } elseif ($child->nodeType !== XML_TEXT_NODE) {
                // Comments, processing instructions, CDATA: nothing a drawing needs.
                $element->removeChild($child);
            }
        }
    }

    private static function keeps(DOMAttr $attribute): bool
    {
        $name = mb_strtolower($attribute->nodeName);
        $value = trim($attribute->value);

        if (! in_array($name, self::ATTRIBUTES, true)) {
            return false;
        }

        // A reference may only point inside this file.
        if (($name === 'href' || $name === 'xlink:href') && ! str_starts_with($value, '#')) {
            return false;
        }

        // Paint and clip may use url(#id) — the file's own gradient or clip — and nothing further.
        if (str_contains(mb_strtolower($value), 'url(') && preg_match('/^url\(\s*#[A-Za-z0-9_.:-]+\s*\)$/', $value) !== 1) {
            return false;
        }

        return preg_match('/javascript:|data:|expression\(/i', $value) !== 1;
    }

    /** Whether anything visible is left: a shape or text somewhere under the root. */
    private static function draws(DOMNode $node): bool
    {
        foreach ($node->childNodes as $child) {
            if ($child instanceof DOMElement) {
                $name = mb_strtolower($child->localName ?? '');

                if (in_array($name, ['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'text', 'use'], true) || self::draws($child)) {
                    return true;
                }
            }
        }

        return false;
    }
}
