<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use Illuminate\Http\Response;

/**
 * robots.txt, decided per copy of the shop: the live shop lets every crawler in, as the static file did, and names its
 * sitemap (D-230); any other copy — the test environment above all — turns every crawler away, beside the
 * `X-Robots-Tag` on each response (D-088), and announces nothing.
 */
class RobotsController extends Controller
{
    public function __invoke(): Response
    {
        $body = app()->environment('production')
            ? "User-agent: *\nDisallow:\n\nSitemap: ".rtrim((string) config('app.url'), '/')."/sitemap.xml\n"
            : "User-agent: *\nDisallow: /\n";

        return response($body, 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }
}
