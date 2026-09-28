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

    /** Whether the file declares entities or an internal DTD subset — refused, and said so (K2-14). */
    public static function declaresEntities(string $svg): bool
    {
        return preg_match('/<!ENTITY|<!DOCTYPE[^>]*\[/i', $svg) === 1;
    }

    /**
     * Whether a cleaned SVG starts with a filled shape over its whole canvas — a white or coloured ground
     * under the logo. The brand wall draws every shape as ink, so such a ground is a solid block (K2-02).
     * The first shape drawn decides, with a fill that is not `none` and not fully transparent: a rectangle,
     * a polygon or a straight-edged path (its first outline) that reaches every edge of the viewBox —
     * wherever the viewBox starts, in plain numbers or `px`, or as 100 % (K2-36).
     */
    public static function hasBackdrop(string $svg): bool
    {
        $document = new DOMDocument;
        $previous = libxml_use_internal_errors(true);
        $loaded = $document->loadXML($svg, LIBXML_NONET);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);
        $root = $document->documentElement;

        if (! $loaded || ! $root instanceof DOMElement) {
            return false;
        }

        $canvas = self::canvas($root);
        $first = self::firstShape($root);

        if (! $first instanceof DOMElement) {
            return false;
        }

        $fill = mb_strtolower(trim($first->getAttribute('fill')));

        if (in_array($fill, ['none', 'transparent'], true) || self::number($first->getAttribute('fill-opacity')) === 0.0 || self::number($first->getAttribute('opacity')) === 0.0) {
            return false;
        }

        $box = match (mb_strtolower($first->localName ?? '')) {
            'rect' => self::rectBox($first, $canvas),
            'polygon' => self::pointsBox((string) preg_replace('/[\s,]+/', ' ', trim($first->getAttribute('points')))),
            'path' => self::pathBox($first->getAttribute('d')),
            default => null,
        };

        if ($box === null || $canvas[2] === null || $canvas[3] === null) {
            return false;
        }

        [$minX, $minY, $maxX, $maxY] = $box;

        return $minX <= $canvas[0] + 0.5 && $minY <= $canvas[1] + 0.5
            && $maxX >= $canvas[0] + $canvas[2] - 0.5 && $maxY >= $canvas[1] + $canvas[3] - 0.5;
    }

    /**
     * The viewBox's origin and size, else the root's width and height from 0.
     *
     * @return array{0: float, 1: float, 2: float|null, 3: float|null}
     */
    private static function canvas(DOMElement $root): array
    {
        $parts = preg_split('/[\s,]+/', trim($root->getAttribute('viewBox'))) ?: [];

        if (count($parts) === 4 && is_numeric($parts[0]) && is_numeric($parts[1]) && is_numeric($parts[2]) && is_numeric($parts[3])) {
            return [(float) $parts[0], (float) $parts[1], (float) $parts[2], (float) $parts[3]];
        }

        return [0.0, 0.0, self::number($root->getAttribute('width')), self::number($root->getAttribute('height'))];
    }

    /** A length in user units: `12`, `12.5`, `12px` — anything else (em, %, …) is not a number here. */
    private static function number(string $value): ?float
    {
        $value = trim($value);

        if (str_ends_with(mb_strtolower($value), 'px')) {
            $value = substr($value, 0, -2);
        }

        return is_numeric($value) ? (float) $value : null;
    }

    /**
     * @param  array{0: float, 1: float, 2: float|null, 3: float|null}  $canvas
     * @return array{0: float, 1: float, 2: float, 3: float}|null
     */
    private static function rectBox(DOMElement $rect, array $canvas): ?array
    {
        $x = $rect->getAttribute('x') === '' ? 0.0 : self::number($rect->getAttribute('x'));
        $y = $rect->getAttribute('y') === '' ? 0.0 : self::number($rect->getAttribute('y'));
        $width = trim($rect->getAttribute('width')) === '100%' ? $canvas[2] : self::number($rect->getAttribute('width'));
        $height = trim($rect->getAttribute('height')) === '100%' ? $canvas[3] : self::number($rect->getAttribute('height'));

        // A rectangle at 100 % from an unset x/y starts where the canvas does.
        if (trim($rect->getAttribute('width')) === '100%' && $rect->getAttribute('x') === '') {
            $x = $canvas[0];
        }

        if (trim($rect->getAttribute('height')) === '100%' && $rect->getAttribute('y') === '') {
            $y = $canvas[1];
        }

        return $x === null || $y === null || $width === null || $height === null ? null : [$x, $y, $x + $width, $y + $height];
    }

    /** @return array{0: float, 1: float, 2: float, 3: float}|null the box of a `points` list */
    private static function pointsBox(string $points): ?array
    {
        $numbers = $points === '' ? [] : explode(' ', $points);

        if (count($numbers) < 6 || count($numbers) % 2 !== 0 || count($numbers) > 10) {
            return null;
        }

        $xs = [];
        $ys = [];

        foreach (array_chunk($numbers, 2) as [$x, $y]) {
            if (! is_numeric($x) || ! is_numeric($y)) {
                return null;
            }

            $xs[] = (float) $x;
            $ys[] = (float) $y;
        }

        return [min($xs), min($ys), max($xs), max($ys)];
    }

    /**
     * The box of a path's first outline, when that outline is drawn with straight lines only (M, L, H, V,
     * Z, in either case) and has at most five corners — a rectangle written as a path. A curve, or a many-
     * cornered outline, is a drawing, not a ground: null.
     *
     * @return array{0: float, 1: float, 2: float, 3: float}|null
     */
    private static function pathBox(string $d): ?array
    {
        if (preg_match_all('/([MmLlHhVvZzCcSsQqTtAa])([^MmLlHhVvZzCcSsQqTtAa]*)/', $d, $commands, PREG_SET_ORDER) === 0) {
            return null;
        }

        [$x, $y] = [0.0, 0.0];
        $xs = [];
        $ys = [];

        foreach ($commands as $index => [, $command, $arguments]) {
            if (in_array($command, ['Z', 'z'], true) || ($index > 0 && in_array($command, ['M', 'm'], true))) {
                break;
            }

            if (! in_array(strtoupper($command), ['M', 'L', 'H', 'V'], true)) {
                return null;
            }

            preg_match_all('/-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/i', $arguments, $found);
            $numbers = array_map('floatval', $found[0]);
            $relative = ctype_lower($command);
            $upper = strtoupper($command);

            if ($upper === 'H' || $upper === 'V') {
                foreach ($numbers as $n) {
                    if ($upper === 'H') {
                        $x = $relative ? $x + $n : $n;
                    } else {
                        $y = $relative ? $y + $n : $n;
                    }

                    $xs[] = $x;
                    $ys[] = $y;
                }

                continue;
            }

            if ($numbers === [] || count($numbers) % 2 !== 0) {
                return null;
            }

            foreach (array_chunk($numbers, 2) as [$dx, $dy]) {
                $x = $relative ? $x + $dx : $dx;
                $y = $relative ? $y + $dy : $dy;
                $xs[] = $x;
                $ys[] = $y;
            }
        }

        return $xs === [] || count($xs) > 5 ? null : [min($xs), min($ys), max($xs), max($ys)];
    }

    /** The first shape in drawing order, outside `defs`, `clipPath`, `mask` and `symbol`. */
    private static function firstShape(DOMElement $element): ?DOMElement
    {
        foreach ($element->childNodes as $child) {
            if (! $child instanceof DOMElement) {
                continue;
            }

            $name = mb_strtolower($child->localName ?? '');

            if (in_array($name, ['defs', 'clippath', 'mask', 'symbol', 'title', 'desc', 'lineargradient', 'radialgradient'], true)) {
                continue;
            }

            if ($name === 'g') {
                $inner = self::firstShape($child);

                if ($inner !== null) {
                    return $inner;
                }

                continue;
            }

            return $child;
        }

        return null;
    }

    public static function clean(string $svg): ?string
    {
        if ($svg === '' || strlen($svg) > self::MAX_BYTES) {
            return null;
        }

        // No entity and no internal DTD subset: the whole class of XML expansion and external-entity
        // attacks is shut before the parser sees the file. A plain DOCTYPE line (as drawing programs
        // write it) says nothing a drawing needs and is dropped.
        if (str_starts_with($svg, "\xEF\xBB\xBF")) {
            $svg = substr($svg, 3);
        }

        if (self::declaresEntities($svg)) {
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
