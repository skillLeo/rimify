<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use App\Domain\Storefront\Garage;
use App\Domain\Storefront\HeaderMode;
use App\Domain\Storefront\HeaderModeResolver;
use App\Domain\Storefront\VehicleContext;
use App\Enums\CatalogueStatus;
use App\Models\Vehicle;
use App\Models\WheelModel;
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

    /**
     * The cookie choice, written by the browser as plain JSON and read here so the first frame
     * already knows whether to show the consent sheet — no banner that appears a beat late.
     */
    public const CONSENT_COOKIE = 'rmf_consent';

    public function __construct(
        private HeaderModeResolver $headerMode,
        private MegaMenu $mega,
        private ServiceStatus $service,
    ) {}

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
            /*
             * Contact details reach the footer and every trust line from one place (D-023). Shared
             * rather than passed per controller, because the footer renders on every route and a
             * page that forgot to pass them would quietly show nothing.
             */
            'contact' => self::contact(),
            'mega' => $this->mega->share(),
            'consent' => $this->consent($request),
            // The last five vehicles, for the hero chips, the header chip and the palette (F7).
            'garage' => $this->garage($request),
            // Whether someone answers right now (F9); the client re-asks every minute.
            'serviceStatus' => $this->service->now(),
            // Whether the shop shows demonstration rows: the site-wide Demodaten badge (ACCURACY D4).
            // Its own key: pages pass a `demo` of their own (a demo product, a seeded order), and a
            // page prop would replace a shared one of the same name, hiding the badge on that page.
            'demoBadge' => self::demo(),
        ];
    }

    /**
     * True while any published wheel model is a demonstration row. Every page then carries the
     * Demodaten badge in its header, so no page can present seeded data as the shop's own stock.
     */
    public static function demo(): bool
    {
        return WheelModel::query()
            ->where('is_demo', true)
            ->where('status', CatalogueStatus::Published->value)
            ->exists();
    }

    /**
     * The contact details as every surface receives them — the shared prop and the pages that pass
     * their own (D-023).
     *
     * A detail the client has not given is null: never an empty string, never a placeholder. The
     * components hide what is null and offer the e-mail in its place, so a missing phone number
     * costs a phone call and never shows a number nobody answers.
     *
     * @return array{email: string, phone: string|null, phoneIntl: string|null, whatsapp: string|null, hours: string}
     */
    public static function contact(): array
    {
        return [
            'email' => (string) config('rimify.contact.email'),
            'phone' => self::given(config('rimify.contact.phone')),
            'phoneIntl' => self::given(config('rimify.contact.phone_intl')),
            'whatsapp' => self::given(config('rimify.contact.whatsapp')),
            'hours' => (string) config('rimify.contact.hours'),
        ];
    }

    /** A configured value, or null when it is absent, not a string, or only whitespace. */
    private static function given(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        return $value === '' ? null : $value;
    }

    /**
     * @return list<array{id: int, label: string, short: string}>
     */
    private function garage(Request $request): array
    {
        $raw = $request->cookie(Garage::COOKIE);
        $garage = Garage::decode(is_string($raw) ? $raw : null);

        if ($garage->isEmpty()) {
            return [];
        }

        // A soft-deleted vehicle silently leaves the garage; the ids keep the cookie's order.
        $rows = Vehicle::query()->whereIn('id', $garage->vehicleIds)->get()->keyBy('id');
        $out = [];

        foreach ($garage->vehicleIds as $id) {
            $vehicle = $rows->get($id);

            if ($vehicle === null) {
                continue;
            }

            $out[] = [
                'id' => (int) $vehicle->id,
                'label' => trim($vehicle->make.' '.$vehicle->variant),
                'short' => trim($vehicle->make.' '.$vehicle->model),
            ];
        }

        return $out;
    }

    /**
     * The visitor's cookie choice, or null while none has been made. Anything unparseable is no
     * choice: the sheet shows again rather than assuming a consent that was never given.
     *
     * @return array{necessary: true, statistics: bool, decidedAt: string}|null
     */
    private function consent(Request $request): ?array
    {
        $raw = $request->cookie(self::CONSENT_COOKIE);

        if (! is_string($raw) || $raw === '') {
            return null;
        }

        $decoded = json_decode($raw, true);

        if (! is_array($decoded) || ! isset($decoded['decidedAt']) || ! is_string($decoded['decidedAt'])) {
            return null;
        }

        return [
            'necessary' => true,
            'statistics' => ($decoded['statistics'] ?? false) === true,
            'decidedAt' => $decoded['decidedAt'],
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
            // How a Gutachten names the car; the story's marked row shows it.
            'typeDesignation' => $vehicle->type_designation,
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
                'footer_shop' => [],
                'footer_service' => [],
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
