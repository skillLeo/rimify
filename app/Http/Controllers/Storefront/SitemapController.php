<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\WheelModel;
use Carbon\CarbonImmutable;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

/**
 * /sitemap.xml (D-230): the shop's public pages for search engines — the fixed pages, the Blog and every published
 * article, the legal pages, and every wheel on sale. Addresses on the shop's own host (APP_URL), as the canonical link
 * names them. robots.txt announces it on the live shop only; every other copy turns crawlers away anyway (D-088).
 */
class SitemapController extends Controller
{
    /** The fixed pages, by path. */
    private const FIXED = ['/', '/felgen', '/felgen-suchen', '/felgenrechner', '/rimify-check', '/blog', '/faq', '/kontakt'];

    public function __invoke(): Response
    {
        $base = rtrim((string) config('app.url'), '/');
        $urls = array_map(static fn (string $path): array => ['loc' => $base.($path === '/' ? '/' : $path), 'lastmod' => null], self::FIXED);

        $pages = DB::table('pages')
            ->whereIn('kind', [Page::KIND_GUIDE, Page::KIND_LEGAL])
            ->where('status', Page::STATUS_PUBLISHED)
            ->orderBy('kind')->orderBy('id')
            ->get(['kind', 'slug', 'updated_at']);

        foreach ($pages as $page) {
            $urls[] = [
                'loc' => $base.($page->kind === Page::KIND_GUIDE ? '/ratgeber/' : '/rechtliches/').$page->slug,
                'lastmod' => $page->updated_at === null ? null : CarbonImmutable::parse((string) $page->updated_at, 'UTC')->toDateString(),
            ];
        }

        foreach (WheelModel::query()->onSale()->orderBy('id')->get(['slug', 'updated_at']) as $model) {
            $urls[] = ['loc' => $base.'/felgen/'.$model->slug, 'lastmod' => $model->updated_at?->toDateString()];
        }

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n".'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";

        foreach ($urls as $url) {
            $xml .= '  <url><loc>'.htmlspecialchars($url['loc'], ENT_XML1).'</loc>'.($url['lastmod'] === null ? '' : '<lastmod>'.$url['lastmod'].'</lastmod>')."</url>\n";
        }

        return response($xml.'</urlset>'."\n", 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }
}
