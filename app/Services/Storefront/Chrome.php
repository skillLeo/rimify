<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use App\Domain\Storefront\HeaderMode;
use App\Domain\Storefront\HeaderModeResolver;
use App\Domain\Storefront\VehicleContext;
use App\Models\Vehicle;
use App\Support\GermanFormat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route as RouteFacade;

/**
 * Everything the header, the footer and the bottom nav need, computed on the server.
 *
 * The header mode is decided here and shipped in the first Inertia response, so the white box and
 * the blue bar can never both appear and the header is never rendered plain and then swapped after
 * hydration (R-08). A header that corrects itself a frame late tells the customer the site is not
 * sure which car they chose, which is the one thing this product cannot afford to suggest.
 *
 * The menus come from `nav_items` rather than from a component, because marketing changes them
 * without a deployment. They are cached: four menus read on every page load would otherwise be
 * four queries the customer waits for.
 */
final readonly class Chrome
{
    private const MENU_CACHE_KEY = 'chrome.menus';

    private const MENU_CACHE_TTL = 300;

    public function __construct(private HeaderModeResolver $headerMode) {}

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $context = $this->context($request);
        $routeName = RouteFacade::currentRouteName();
        $vehicle = null;
        $hasEnteredBooking = false;

        if ($context !== null) {
            $vehicle = $this->vehicle($context->vehicleId);
            $hasEnteredBooking = $context->hasEnteredBooking;
        }

        // A cookie naming a vehicle that has since been soft-deleted is not an error page and not
        // a silent wrong answer: it is simply no vehicle, and the selector invites a new one.
        $mode = $this->headerMode->resolve($vehicle !== null, $routeName, $hasEnteredBooking);

        return [
            'headerMode' => $mode->value,
            'vehicle' => $vehicle,
            'menus' => $this->menus(),
            'cartCount' => $this->cartCount($request),
            'routeName' => $routeName,
        ];
    }

    private function context(Request $request): ?VehicleContext
    {
        $raw = $request->cookie(VehicleContext::COOKIE);

        return VehicleContext::decode(is_string($raw) ? $raw : null);
    }

    /**
     * The vehicle as the chrome needs it: a full label, a truncated one for the phone, and the key
     * numbers. `short` exists because the white box must never wrap to two lines and must never
     * push the cart off a 390px screen.
     *
     * @return array<string, mixed>|null
     */
    private function vehicle(int $id): ?array
    {
        $vehicle = Vehicle::query()->find($id);

        if ($vehicle === null) {
            return null;
        }

        return [
            'id' => $vehicle->id,
            'make' => $vehicle->make,
            'model' => $vehicle->model,
            'variant' => $vehicle->variant,
            'label' => trim($vehicle->make.' '.$vehicle->variant),
            'short' => trim($vehicle->make.' '.$vehicle->model),
            'hsn' => $vehicle->hsn,
            'tsn' => $vehicle->tsn,
            'keyNumbers' => GermanFormat::keyNumbers($vehicle->hsn, $vehicle->tsn),
            'buildWindow' => GermanFormat::buildPeriod($vehicle->build_from, $vehicle->build_to),
        ];
    }

    /**
     * The four menus, each already resolved to a URL.
     *
     * `vehicle_aware` is resolved in the client, not here: the destination depends on whether a
     * vehicle is set, and that is already in the props. Resolving it server-side would bake one
     * answer into a cached menu.
     *
     * @return array<string, list<array<string, mixed>>>
     */
    private function menus(): array
    {
        /** @var array<string, list<array<string, mixed>>> $menus */
        $menus = Cache::remember(self::MENU_CACHE_KEY, self::MENU_CACHE_TTL, function (): array {
            $grouped = [
                'header' => [],
                'footer_pages' => [],
                'footer_legal' => [],
                'mobile_bottom' => [],
            ];

            $rows = DB::table('nav_items')
                ->where('visible', true)
                ->orderBy('menu')
                ->orderBy('sort_order')
                ->get(['menu', 'label', 'href', 'route_name', 'behaviour', 'icon']);

            foreach ($rows as $row) {
                $menu = (string) $row->menu;

                if (! array_key_exists($menu, $grouped)) {
                    continue;
                }

                $grouped[$menu][] = [
                    'label' => (string) $row->label,
                    'href' => $this->href($row->route_name, $row->href),
                    'routeName' => $row->route_name,
                    'behaviour' => $row->behaviour,
                    'icon' => $row->icon,
                ];
            }

            return $grouped;
        });

        return $menus;
    }

    /** A nav row naming a route that does not exist yet must not take the whole page down. */
    private function href(mixed $routeName, mixed $href): string
    {
        if (is_string($routeName) && $routeName !== '' && RouteFacade::has($routeName)) {
            return route($routeName);
        }

        return is_string($href) && $href !== '' ? $href : '#';
    }

    private function cartCount(Request $request): int
    {
        $cart = $request->session()->get('cart', []);

        if (! is_array($cart)) {
            return 0;
        }

        $count = 0;

        foreach ($cart as $line) {
            $count += is_array($line) && isset($line['quantity']) ? (int) $line['quantity'] : 0;
        }

        return $count;
    }

    /** @return list<string> */
    public static function headerModes(): array
    {
        return array_column(HeaderMode::cases(), 'value');
    }
}
