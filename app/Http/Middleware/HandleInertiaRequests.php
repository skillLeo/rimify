<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\Storefront\VehicleContext;
use App\Services\Storefront\Chrome;
use App\Support\Design\PrototypePage;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

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
             * The prototype screen this route renders. It goes onto `<body data-page="...">`,
             * where `shared/app.js` reads it to choose the header state and the page builder —
             * so it is shared here rather than set per page, and cannot be forgotten on one.
             */
            'designPage' => PrototypePage::forRoute($request->route()?->getName()),
            /*
             * The chosen vehicle's id, for the live-data payload in app.blade.php. Null means no
             * vehicle — and that is the difference between a catalogue that makes fitment claims
             * and one that makes none at all, so it is read from the same cookie the rest of the
             * storefront reads rather than inferred anywhere else.
             */
            'vehicleId' => VehicleContext::decode(
                $request->cookie(VehicleContext::COOKIE)
            )?->vehicleId,
            /*
             * Whether remote photography is layered over the drawn art (config/rimify.php).
             * Shared rather than compiled in, so the flag that widens the CSP and the flag that
             * renders an <img> are the same flag and cannot drift apart.
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
            // The SSR process has no `window.Ziggy`; it reads the route list from here.
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
        ];
    }
}
