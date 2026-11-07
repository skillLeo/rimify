<?php

declare(strict_types=1);

namespace App\Services\Storage;

use Illuminate\Support\Facades\Storage;

/**
 * An uploaded photograph as `Picture` reads it: one file as uploaded, no other formats to offer before it.
 */
final class PhotoManifest
{
    /**
     * @param  array{disk: string, path: string, width: int, height: int}  $stored  what ImageUpload::store answers
     * @param  string  $fill  the flat colour shown until the file has loaded
     * @return array<string, mixed>
     */
    public static function of(array $stored, string $fill = '#E4E6E8'): array
    {
        $url = Storage::disk($stored['disk'])->url($stored['path']);
        $app = rtrim((string) config('app.url'), '/');

        // On the site's own disk the address is kept root-relative: the page loads it from whichever
        // name it was opened under (www or not, a staging alias), and the CSP's 'self' covers it.
        if ($app !== '' && str_starts_with($url, $app.'/')) {
            $url = substr($url, strlen($app));
        }

        $ext = pathinfo($stored['path'], PATHINFO_EXTENSION);
        $suffix = '-'.$stored['width'].'.'.$ext;

        return [
            'name' => basename($stored['path'], $suffix),
            'base' => str_ends_with($url, $suffix) ? substr($url, 0, -strlen($suffix)) : $url,
            'width' => $stored['width'],
            'height' => $stored['height'],
            'widths' => [$stored['width']],
            'fallback' => $ext,
            // One file as uploaded: no other formats to offer before it.
            'formats' => [],
            'placeholder' => 'data:image/svg+xml,'.rawurlencode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="'.$fill.'"/></svg>'),
            'kind' => 'photo',
            'disk' => $stored['disk'],
            'path' => $stored['path'],
        ];
    }
}
