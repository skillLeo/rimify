<?php

declare(strict_types=1);

namespace Tests\Support;

use RuntimeException;

/**
 * Just enough PNG to check that a processed logo really is a one-colour mask on nothing: the
 * header, the image data, and the alpha of every pixel.
 *
 * Written by hand rather than with GD, which this machine's PHP does not load, so the check runs
 * wherever the suite runs. Only what `scripts/brand-logo.mjs` writes is supported: 8 bits per
 * sample, no interlacing, grey+alpha or RGBA.
 */
final class PngPixels
{
    /**
     * What a mask has to prove: its size, that every visible pixel is the same one colour, and
     * how much of it — and of its outermost frame — is transparent.
     *
     * @return array{
     *     width: int,
     *     height: int,
     *     channels: int,
     *     colourType: int,
     *     oneColour: bool,
     *     opaque: int,
     *     transparentShare: float,
     *     frameTransparentShare: float
     * }
     */
    public static function inspect(string $file): array
    {
        [$header, $data] = self::chunks($file);

        if ($header['bitDepth'] !== 8 || $header['interlace'] !== 0) {
            throw new RuntimeException("{$file}: only 8-bit, non-interlaced PNGs are supported");
        }

        $channels = match ($header['colourType']) {
            4 => 2,
            6 => 4,
            default => throw new RuntimeException("{$file}: colour type {$header['colourType']} carries no alpha channel"),
        };

        $width = $header['width'];
        $height = $header['height'];
        $rows = self::unfilter($data, $width, $height, $channels);

        $oneColour = true;
        $opaque = 0;
        $transparent = 0;
        $frame = 0;
        $frameTransparent = 0;

        for ($y = 0; $y < $height; $y++) {
            $row = $rows[$y];

            for ($x = 0; $x < $width; $x++) {
                $at = $x * $channels;
                $alpha = $row[$at + $channels - 1];
                $edge = $x === 0 || $y === 0 || $x === $width - 1 || $y === $height - 1;

                if ($alpha >= 250) {
                    $opaque++;
                }

                // Anti-aliasing leaves a trace of alpha; 8 of 255 is invisible and counts as none.
                if ($alpha <= 8) {
                    $transparent++;

                    if ($edge) {
                        $frameTransparent++;
                    }
                } elseif ($oneColour) {
                    for ($c = 0; $c < $channels - 1; $c++) {
                        if ($row[$at + $c] !== 0) {
                            $oneColour = false;
                            break;
                        }
                    }
                }

                if ($edge) {
                    $frame++;
                }
            }
        }

        $pixels = max(1, $width * $height);

        return [
            'width' => $width,
            'height' => $height,
            'channels' => $channels,
            'colourType' => $header['colourType'],
            'oneColour' => $oneColour,
            'opaque' => $opaque,
            'transparentShare' => $transparent / $pixels,
            'frameTransparentShare' => $frameTransparent / max(1, $frame),
        ];
    }

    /**
     * @return array{0: array{width: int, height: int, bitDepth: int, colourType: int, interlace: int}, 1: string}
     */
    private static function chunks(string $file): array
    {
        $bytes = (string) file_get_contents($file);

        if (! str_starts_with($bytes, "\x89PNG\r\n\x1a\n")) {
            throw new RuntimeException("{$file}: not a PNG");
        }

        $length = strlen($bytes);
        $at = 8;
        $header = null;
        $data = '';

        while ($at + 8 <= $length) {
            $size = self::uint32($bytes, $at);
            $type = substr($bytes, $at + 4, 4);
            $body = substr($bytes, $at + 8, $size);

            if ($type === 'IHDR') {
                $header = [
                    'width' => self::uint32($body, 0),
                    'height' => self::uint32($body, 4),
                    'bitDepth' => ord($body[8]),
                    'colourType' => ord($body[9]),
                    'interlace' => ord($body[12]),
                ];
            } elseif ($type === 'IDAT') {
                $data .= $body;
            } elseif ($type === 'IEND') {
                break;
            }

            $at += 12 + $size;
        }

        if ($header === null || $data === '') {
            throw new RuntimeException("{$file}: no image data");
        }

        if (! function_exists('zlib_decode')) {
            throw new RuntimeException('zlib is not available, so a PNG mask cannot be checked');
        }

        $raw = zlib_decode($data);

        if ($raw === false) {
            throw new RuntimeException("{$file}: the image data could not be decompressed");
        }

        return [$header, $raw];
    }

    /**
     * @return list<list<int>> one row of samples per line
     */
    private static function unfilter(string $raw, int $width, int $height, int $channels): array
    {
        $stride = $width * $channels;
        $previous = array_fill(0, $stride, 0);
        $rows = [];
        $at = 0;

        for ($y = 0; $y < $height; $y++) {
            if ($at + 1 + $stride > strlen($raw)) {
                throw new RuntimeException('the image data is shorter than the header says');
            }

            $filter = ord($raw[$at]);
            /** @var list<int> $line */
            $line = array_values((array) unpack('C*', substr($raw, $at + 1, $stride)));
            $at += 1 + $stride;

            for ($i = 0; $i < $stride; $i++) {
                $left = $i >= $channels ? $line[$i - $channels] : 0;
                $above = $previous[$i];
                $corner = $i >= $channels ? $previous[$i - $channels] : 0;

                $line[$i] = match ($filter) {
                    0 => $line[$i],
                    1 => $line[$i] + $left,
                    2 => $line[$i] + $above,
                    3 => $line[$i] + intdiv($left + $above, 2),
                    4 => $line[$i] + self::paeth($left, $above, $corner),
                    default => throw new RuntimeException("unknown PNG filter {$filter}"),
                } & 0xFF;
            }

            $previous = $line;
            $rows[] = $line;
        }

        return $rows;
    }

    private static function paeth(int $left, int $above, int $corner): int
    {
        $estimate = $left + $above - $corner;
        $toLeft = abs($estimate - $left);
        $toAbove = abs($estimate - $above);
        $toCorner = abs($estimate - $corner);

        if ($toLeft <= $toAbove && $toLeft <= $toCorner) {
            return $left;
        }

        return $toAbove <= $toCorner ? $above : $corner;
    }

    private static function uint32(string $bytes, int $at): int
    {
        return (ord($bytes[$at]) << 24) | (ord($bytes[$at + 1]) << 16) | (ord($bytes[$at + 2]) << 8) | ord($bytes[$at + 3]);
    }
}
