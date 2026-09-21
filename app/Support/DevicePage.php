<?php

declare(strict_types=1);

namespace App\Support;

use App\Http\Middleware\DetectDevice;
use Illuminate\Http\Request;

/**
 * Which page component a route renders: the phone document or the desktop one.
 *
 * The two are different documents served from one URL, decided on the server so the SSR output and
 * the hydrated client agree (R-08). A page that has no phone variant yet falls back to its desktop
 * component, so building the phone experience page by page never breaks a route.
 */
final class DevicePage
{
    public static function resolve(string $page, Request $request): string
    {
        $isMobile = (bool) $request->attributes->get(DetectDevice::ATTRIBUTE, false);

        if ($isMobile && self::exists($page, 'Mobile')) {
            return $page.'/Mobile';
        }

        return self::exists($page, 'Desktop') ? $page.'/Desktop' : $page.'/Index';
    }

    private static function exists(string $page, string $variant): bool
    {
        return is_file(resource_path('js/Pages/'.$page.'/'.$variant.'.vue'));
    }
}
