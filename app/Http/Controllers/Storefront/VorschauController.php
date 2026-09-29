<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Middleware\DetectDevice;
use App\Http\Middleware\SecurityHeaders;
use App\Models\Page;
use App\Services\Content\PageContent;
use App\Services\Content\PagePublisher;
use App\Services\Content\PageSchema;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * A page's draft in the real storefront, behind a temporary signed link (BRIEF-2 §1: "preview by
 * signed link, shareable, expires"). No login: the signature is the permission, so the link can go
 * to a colleague or the Kanzlei. Everything around the words — wheels, counts, menus — is the live
 * shop, rendered by the page's own controller.
 *
 * The device is the link's (`geraet`), not the viewer's: the admin's Handy frame asks for the phone
 * document from a desktop browser. It is set for this response only and never pinned in a cookie.
 * The response may be framed by our own origin, which is how the editor shows it, and is never
 * indexed.
 */
final class VorschauController extends Controller
{
    public function __invoke(Request $request, Page $page, PageContent $content): Response
    {
        $schema = PageSchema::for($page) ?? abort(404);
        $live = PageContent::live($page);
        $draft = is_array($page->draft) ? PageSchema::normalise($schema, $page->draft, $live) : $live;

        $content->preview($page, PagePublisher::withPlaceholders($draft, $live));

        $mobile = $request->query('geraet') === 'handy';
        $request->attributes->set(DetectDevice::ATTRIBUTE, $mobile);
        Inertia::share('isMobile', $mobile);

        /*
         * The cookie sheet belongs to the shop, not to the page: in the editor's frame it would sit
         * over the very words being checked. With no choice made, the preview renders as if only the
         * necessary cookies were allowed — the strictest answer, so nothing optional runs — and
         * stores nothing. A choice the viewer has made stays theirs.
         */
        if (Inertia::getShared('consent') === null) {
            Inertia::share('consent', ['necessary' => true, 'statistics' => false, 'decidedAt' => now()->toIso8601String()]);
        }

        try {
            $inertia = match ($page->kind) {
                Page::KIND_GUIDE => app(RatgeberController::class)($request, $page->slug),
                Page::KIND_LEGAL => app(RechtlichesController::class)($request, $page->slug),
                default => app(StartseiteController::class)->index($request),
            };

            // Rendered here, while the draft stands in: the props resolve inside toResponse().
            $response = $inertia->toResponse($request);
        } finally {
            // Never beyond this response, whatever the runtime keeps alive between requests.
            $content->endPreview();
        }

        $response->headers->set('X-Robots-Tag', 'noindex, nofollow');
        $request->attributes->set(SecurityHeaders::FRAME_SAME_ORIGIN, true);

        return $response;
    }
}
