<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Services\Admin\AdminNavigation;
use App\Services\Storefront\Chrome;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
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
            ...$this->admin($request),
        ];
    }

    /**
     * Everything the admin shell needs, and only on `admin.*` routes, so no admin module name and
     * no colleague's name ever reaches a storefront page (RoutesRenderTest). Presentation only: an
     * item the rail leaves out is a route the server refuses regardless (R-11). The shapes are the
     * contract in docs/admin/shell-build-plan.md.
     *
     * On the sign-in screen — an `admin.*` route with nobody signed in yet — `account` is null and
     * `nav` empty: no rail is drawn there, and a name would be a lie.
     *
     * @return array{admin?: array<string, mixed>}
     */
    private function admin(Request $request): array
    {
        $routeName = Route::currentRouteName();

        // An admin route — or any address under /admin, so a page that does not exist is still
        // answered inside the admin's frame for somebody signed into it (AdminErrorPage).
        $isAdmin = (is_string($routeName) && str_starts_with($routeName, 'admin.')) || $request->is('admin', 'admin/*');

        if (! $isAdmin) {
            return [];
        }

        // Admin pages carry customer addresses and colleagues' rights. Their copies in the browser's
        // history are encrypted, and signing out rotates the key (AdminLoginController::destroy), so
        // Back after Abmelden asks the server again instead of showing the last page it had.
        Inertia::encryptHistory();

        $user = $request->user('admin');
        $signedIn = $user instanceof AdminUser;
        $can = [];

        foreach (PermissionModule::cases() as $module) {
            $can[$module->value] = $signedIn && $user->may($module, PermissionAction::View);
        }

        $navigation = app(AdminNavigation::class);
        // The tree is decided here and shipped in the first frame, so the navigation is never
        // briefly wrong or briefly absent.
        $nav = $signedIn ? $navigation->for($user) : [];

        return ['admin' => [
            'can' => $can,
            'account' => $signedIn ? [
                'name' => $user->name,
                'email' => $user->email,
                // The hat this person is wearing; null means "say the address instead".
                'role' => $user->roleLabel(),
            ] : null,
            'nav' => $nav,
            'environment' => self::environment(),
            // Read on the server and rendered into the first frame: a rail read after hydration
            // snaps from 260 to 64 px on every load (admin-shell.md §5.9).
            'preferences' => ['railCollapsed' => $signedIn && $user->railCollapsed()],
            // Resolved after the controller has run, so a page showing one record can name it.
            'breadcrumbs' => fn (): array => $navigation->breadcrumbs(
                $nav,
                '/'.ltrim($request->path(), '/'),
                is_string($request->attributes->get(AdminNavigation::RECORD)) ? $request->attributes->get(AdminNavigation::RECORD) : null,
            ),
            // Not rendered when unset: the help menu never offers an address nobody reads.
            'supportEmail' => is_string(config('rimify.admin.support_email')) ? config('rimify.admin.support_email') : null,
        ]];
    }

    /**
     * Which copy of the shop this is, said out loud only where the answer is unusual.
     *
     * `local` and `staging` get a badge; production gets nothing — the absence of a badge is the
     * least ambiguous way to mean "this is the real shop" (DIRECTION §8a). Every other environment
     * name, `testing` included, is a copy where work does not count, so it reads as local.
     *
     * @return 'local'|'staging'|null
     */
    private static function environment(): ?string
    {
        return match (true) {
            app()->environment('production') => null,
            app()->environment('staging') => 'staging',
            default => 'local',
        };
    }
}
