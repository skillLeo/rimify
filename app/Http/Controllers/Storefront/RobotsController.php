<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Http\Response;

/**
 * robots.txt, decided per copy of the shop: the live shop lets every crawler in, as the static file did, and names its
 * sitemap (D-230); any other copy — the test environment above all — turns every crawler away, beside the
 * `X-Robots-Tag` on each response (D-088), and announces nothing. So does the live shop while a legal text is a
 * placeholder or the Impressum lacks a field (D-319): one answer for both, SecurityHeaders::hidden().
 */
class RobotsController extends Controller
{
    public function __invoke(): Response
    {
        $body = SecurityHeaders::hidden()
            ? "User-agent: *\nDisallow: /\n"
            : "User-agent: *\nDisallow:\n\nSitemap: ".rtrim((string) config('app.url'), '/')."/sitemap.xml\n";

        return response($body, 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }
}
