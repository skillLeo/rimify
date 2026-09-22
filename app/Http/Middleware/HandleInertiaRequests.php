<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\Storefront\Chrome;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    public function __construct(private readonly Chrome $chrome) {}

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Everything the first frame depends on is decided here, on the server, so the SSR output is
     * already the frame the client hydrates to (R-08): the device split now, and the header mode,
     * vehicle context and basket count as the storefront lands (M4).
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            ...$this->chrome->share($request),
            'isMobile' => (bool) $request->attributes->get(DetectDevice::ATTRIBUTE, false),
            'locale' => 'de',
            /*
             * Whether photography is layered over the drawn art (config/rimify.php). Shared
             * rather than compiled in, so one env change turns it off without a build.
             */
            'photography' => config('rimify.photography.enabled') === true,
            'flash' => [
                'toast' => $request->session()->get('toast'),
            ],
            /*
             * The key-number lookup's outcome. Shared rather than returned as page props because
             * it survives a redirect back to whichever page asked — the selector, the check page
             * or the hero card — and all three render the same chooser.
             *
             * Null on every ordinary request, so it costs nothing to carry.
             */
            'lookup' => $request->session()->get('lookup'),
        ];
    }
}
