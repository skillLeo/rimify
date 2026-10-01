<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use Illuminate\Http\Response;

/**
 * robots.txt, decided per copy of the shop: the live shop lets every crawler in, as the static file did; any other
 * copy — the test environment above all — turns every crawler away, beside the `X-Robots-Tag` on each response
 * (D-088). There is no sitemap to announce.
 */
class RobotsController extends Controller
{
    public function __invoke(): Response
    {
        $rules = app()->environment('production') ? 'Disallow:' : 'Disallow: /';

        return response("User-agent: *\n{$rules}\n", 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }
}
