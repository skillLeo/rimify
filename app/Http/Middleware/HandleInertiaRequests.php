<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Services\Storefront\Chrome;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
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
     * Who is signed in and which modules they may see, for the rail — and only on `admin.*` routes,
     * so no admin module name and no colleague's name ever reaches a storefront page
     * (RoutesRenderTest). Presentation only: an item the rail leaves out is a route the server
     * refuses regardless (R-11).
     *
     * `account` is null on the sign-in screen, which is an `admin.*` route with nobody signed in
     * yet — the rail is not drawn there at all, and a name would be a lie.
     *
     * @return array{admin?: array{can: array<string, bool>, account: array{name: string, email: string, role: string|null}|null}}
     */
    private function admin(Request $request): array
    {
        $routeName = Route::currentRouteName();

        if (! is_string($routeName) || ! str_starts_with($routeName, 'admin.')) {
            return [];
        }

        $user = $request->user('admin');
        $can = [];

        foreach (PermissionModule::cases() as $module) {
            $can[$module->value] = $user instanceof AdminUser && $user->may($module, PermissionAction::View);
        }

        return ['admin' => [
            'can' => $can,
            'account' => $user instanceof AdminUser ? [
                'name' => $user->name,
                'email' => $user->email,
                // The role as a human reads it, so the rail can say which hat this person is wearing.
                'role' => self::roleLabel($user),
            ] : null,
        ]];
    }

    /** The German label of the first role this admin holds, or its bare name, or null for neither. */
    private static function roleLabel(AdminUser $user): ?string
    {
        $name = $user->getRoleNames()->first();

        if (! is_string($name)) {
            return null;
        }

        $label = DB::table('roles')->where('name', $name)->where('guard_name', 'admin')->value('label_de');

        return is_string($label) && $label !== '' ? $label : $name;
    }
}
