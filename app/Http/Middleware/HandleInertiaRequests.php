<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\Fitment\Resolver\VehicleResolver;
use App\Domain\Storefront\VehicleContext;
use App\Domain\Storefront\VehicleKey;
use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\ReviewFeedback;
use App\Payments\Payments;
use App\Policies\DemoDataPolicy;
use App\Policies\TestResetPolicy;
use App\Services\Admin\AdminAlerts;
use App\Services\Admin\AdminNavigation;
use App\Services\Admin\QuickActions;
use App\Services\Admin\SystemHealth;
use App\Services\Demo\DemoTables;
use App\Services\Storefront\Chrome;
use App\Support\KeyNumberSearch;
use App\Support\PreviewRibbon;
use App\Support\ReleaseStamp;
use App\Support\Seller;
use Carbon\CarbonImmutable;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Middleware;
use Throwable;

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
     * The address the browser shows (the client's #8, D-116). On a page that answers for one car, the car it was
     * rendered for stands in it — `?fahrzeug=0005-Z90-00001`, its key numbers (VehicleKey) — so the page can be saved
     * and shared, and opening that address renders the same answer (VehicleFromUrl). Without a car no stale key stays
     * behind; every other page keeps the address it was asked for.
     */
    public function urlResolver(): Closure
    {
        return static fn (Request $request): string => self::address($request);
    }

    /** The page's address as urlResolver() writes it: a path of this shop with its query. */
    public static function address(Request $request): string
    {
        $url = Str::start(Str::after($request->fullUrl(), $request->getSchemeAndHttpHost()), '/');

        if (! in_array($request->route()?->getName(), VehicleFromUrl::ROUTES, true)) {
            return $url;
        }

        $raw = $request->cookie(VehicleContext::COOKIE);
        $vehicleId = VehicleContext::decode(is_string($raw) ? $raw : null)?->vehicleId;
        $vehicle = $vehicleId === null ? null : app(VehicleResolver::class)->find($vehicleId);
        $pairs = array_values(array_filter(
            explode('&', (string) $request->getQueryString()),
            static fn (string $pair): bool => $pair !== '' && ! str_starts_with($pair, VehicleFromUrl::PARAM.'='),
        ));

        if ($vehicle !== null && ! $vehicle->isDeleted) {
            $pairs[] = VehicleFromUrl::PARAM.'='.VehicleKey::of($vehicle);
        }

        return Str::before($url, '?').($pairs === [] ? '' : '?'.implode('&', $pairs));
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
            // The shop's frame — its header, menus, basket, garage — only where the shop is drawn: an admin page never shows
            // it, and carried 3,4 KB of it and three queries on every admin request (D-283).
            ...(self::isAdmin($request) ? [] : $this->chrome->share($request)),
            'isMobile' => (bool) $request->attributes->get(DetectDevice::ATTRIBUTE, false),
            'locale' => 'de',
            // The page's one address (the client's #8): the shop's own host and the address the browser shows — with the
            // car as its key numbers — written into the first frame as <link rel="canonical"> (StorefrontLayout).
            'canonical' => $request->is('admin', 'admin/*') ? null : rtrim((string) config('app.url'), '/').self::address($request),
            /*
             * Whether photography is layered over the drawn art (config/rimify.php). Shared
             * rather than compiled in, so one env change turns it off without a build.
             */
            'photography' => config('rimify.photography.enabled') === true,
            // The Kleinunternehmer switch (§ 19 UStG, App\Support\Seller): every price note reads it (usePriceTerms), so
            // the site, the order summaries and the invoice change together.
            'smallBusiness' => Seller::current()->smallBusiness,
            // The test environment says what it is in one slim line, until put away (PreviewRibbon.vue): on staging only,
            // decided here so the first frame already has it — or has not (R-08).
            'previewRibbon' => PreviewRibbon::shown($request),
            // Which build this test environment serves, at the foot of every page (ReleaseStamp); null in the live shop.
            'release' => ReleaseStamp::label(),
            'flash' => [
                'toast' => $request->session()->get('toast'),
                // What was just put in the basket, for the panel after an add (#16): the line, the count and the total.
                'added' => $request->session()->get('added'),
            ],
            /*
             * The key-number lookup's outcome. Shared rather than returned as page props because
             * it survives a redirect back to whichever page asked — the selector, the check page
             * or the hero card — and all three render the same chooser.
             *
             * Null on every ordinary request, so it costs nothing to carry.
             */
            'lookup' => $request->session()->get('lookup'),
            // The key-number path's one sentence while no vehicle dataset is loaded, null while it is open (KeyNumberSearch).
            'keyNumbersClosed' => fn (): ?string => KeyNumberSearch::closedSentence(),
            ...$this->admin($request),
            ...$this->reviewer($request),
        ];
    }

    /**
     * The review's feedback button on the shop's own pages (D-142): for a signed-in admin who may send a point
     * (ReviewFeedbackPolicy — only where the review is on) and whose session still counts — the same rules the admin
     * area applies (EnsureAdminSessionValid), so a suspended account or a revoked session sees no button here either.
     * Absent for everyone else: a visitor's page carries no trace of it, and no admin module name or colleague's
     * name reaches the shop (RoutesRenderTest) — only this person's own role, for the dialog's line.
     *
     * @return array{reviewer?: array{role: string|null}}
     */
    private function reviewer(Request $request): array
    {
        // Not inside the admin's page preview (Inhalte › Seiten, a framed signed link): it shows the page, not the shop.
        if ($request->is('admin', 'admin/*', 'vorschau/*') || ! (bool) config('rimify.review.enabled', false) || ! $request->hasSession()) {
            return [];
        }

        $user = $request->user('admin');

        if (! $user instanceof AdminUser
            || ! $user->canSignIn()
            || EnsureAdminSessionValid::revoked($user, $request->session()->get(EnsureAdminSessionValid::SESSION_KEY))
            // Whether to draw the button: asked on every shop page, and a „no“ refuses nobody (ADMIN-GEFUNDEN 509).
            || ! $user->canQuietly('create', ReviewFeedback::class)) {
            return [];
        }

        return ['reviewer' => ['role' => $user->roleLabel()]];
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
     * The shell is resolved with the response, not here: a partial reload — the Übersicht's charts, a Gutachten's
     * preview — asks for its own props and never carries this one, and no longer computes the rail, its counts and the
     * account for nothing (D-281).
     *
     * @return array{admin?: Closure(): array<string, mixed>}
     */
    private function admin(Request $request): array
    {
        if (! self::isAdmin($request)) {
            return [];
        }

        // Admin pages carry customer addresses and colleagues' rights. Their copies in the browser's
        // history are encrypted, and signing out rotates the key (AdminLoginController::destroy), so
        // Back after Abmelden asks the server again instead of showing the last page it had.
        Inertia::encryptHistory();

        return ['admin' => fn (): array => $this->shell($request)];
    }

    /**
     * An admin route — or any address under /admin, so a page that does not exist is still answered inside the admin's
     * frame for somebody signed into it (AdminErrorPage).
     */
    private static function isAdmin(Request $request): bool
    {
        $routeName = Route::currentRouteName();

        return (is_string($routeName) && str_starts_with($routeName, 'admin.')) || $request->is('admin', 'admin/*');
    }

    /** @return array<string, mixed> */
    private function shell(Request $request): array
    {
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

        return [
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
            // The rail as this person left it — collapsed or not, and how wide — so the first frame is
            // already right and nothing jumps at hydration.
            // `railRev` is the revision of the last save: the page takes a newer one from a visit, never
            // an older one (AdminLayout).
            'preferences' => [
                'railCollapsed' => $signedIn && $user->railCollapsed(),
                'railWidth' => $signedIn ? $user->railWidth() : AdminUser::RAIL_WIDTH_DEFAULT,
                'railRev' => $signedIn ? $user->railRev() : 0,
            ],
            // For the one save that cannot send headers: the rail's last width, sent with
            // navigator.sendBeacon as the tab closes. Fresh on every response, unlike the <meta> of the
            // first load; the page history holding it is encrypted.
            'csrfToken' => $signedIn ? csrf_token() : null,
            // Resolved after the controller has run, so a page showing one record can name it.
            'breadcrumbs' => fn (): array => $navigation->breadcrumbs(
                $nav,
                '/'.ltrim($request->path(), '/'),
                is_string($request->attributes->get(AdminNavigation::RECORD)) ? $request->attributes->get(AdminNavigation::RECORD) : null,
            ),
            // The bell's number, in the first frame like the rail's counts. Null when it could not be
            // read: the bell then shows no number rather than a zero that may be false. `offered`
            // is whether this role can receive any alert at all — a bell that can never ring is
            // decoration, so it is not drawn unless something already sits in it.
            'notifications' => fn (): array => [
                'unread' => $user instanceof AdminUser ? self::unread($user) : null,
                'offered' => $user instanceof AdminUser && app(AdminAlerts::class)->kindsFor($user) !== [],
            ],
            // Not rendered when unset: the help menu never offers an address nobody reads.
            'supportEmail' => is_string(config('rimify.admin.support_email')) ? config('rimify.admin.support_email') : null,
            // The rail's foot: one sentence about the shop's health in the first frame (the rail
            // polls it after that), and whether this role may open System › Zustand behind it.
            'health' => fn (): ?array => $user instanceof AdminUser ? self::health($user) : null,
            // „Neu“: what this role may create where the creating page exists (QuickActions).
            'quickActions' => fn (): array => $user instanceof AdminUser ? app(QuickActions::class)->for($user) : [],
            // The demo set, while there is one: the rail tells everyone, and offers „entfernen“ to who
            // may (asked of the policy directly — a strip not offered is no denied attempt to log).
            'demo' => fn (): ?array => $user instanceof AdminUser ? self::demo($user) : null,
            // The review kit's feedback button: only where the review is on (local and staging).
            'review' => $signedIn && (bool) config('rimify.review.enabled', false),
            // Stripe in Testmodus: a strip on every admin page says that no money moves (Block G).
            'paymentsTestMode' => fn (): bool => $signedIn && Payments::stripeTestMode(),
        ];
    }

    /**
     * The rail's demo strip. A count that cannot be read (a locked table) costs the strip, never the
     * page: the strip only informs — `demo:assert-clean` is what guards a production database. Who may
     * take the set away is told before asking when it cannot go now (`blocked`), and — on a test
     * environment, as the Super-Admin — where the whole shop can be reset instead (`resetHref`).
     *
     * @return array{rows: int, canPurge: bool, blocked: string|null, resetHref: string|null}|null
     */
    private static function demo(AdminUser $user): ?array
    {
        try {
            $rows = DemoTables::cachedTotal();
            $canPurge = (new DemoDataPolicy)->purge($user);
            $blocked = $rows > 0 && $canPurge ? DemoTables::cachedBlocker() : null;
        } catch (Throwable $e) {
            report($e);

            return null;
        }

        return $rows > 0 ? [
            'rows' => $rows,
            'canPurge' => $canPurge,
            'blocked' => $blocked,
            // Asked of the policy directly, as the purge right: a way not offered is no denied attempt to log.
            'resetHref' => (new TestResetPolicy)->view($user) ? '/admin/system/zuruecksetzen' : null,
        ] : null;
    }

    /**
     * The health line, from a report at most 30 seconds old: every admin page asks for it, and five
     * checks per page view would be the dashboard's own load problem.
     *
     * The rail shows its short form (`label`, `count`), the tooltip and the Übersicht the sentence.
     * `banner` is the urgent problem — maintenance mode, a queue dead or a scheduler silent for an hour — unless this person
     * asked to be reminded later (8 hours, AdminPreferencesController): decided here, so a snoozed
     * banner never flashes up in the first frame.
     *
     * @return array{state: string, sentence: string, label: string, count: string|null, href: string|null, banner: array{key: string, sentence: string}|null}
     */
    private static function health(AdminUser $user): array
    {
        try {
            /** @var array{state: string, sentence: string, label: string, count: string|null, urgent: array{key: string, sentence: string}|null} $report */
            $report = Cache::remember('admin.health', 30, static fn (): array => app(SystemHealth::class)->report());
        } catch (Throwable) {
            $report = ['state' => 'warn', 'sentence' => 'Zustand unbekannt', 'label' => 'Zustand unbekannt', 'count' => null, 'urgent' => null];
        }

        $urgent = $report['urgent'];
        $snooze = is_array($user->preferences) && is_array($user->preferences['healthSnooze'] ?? null) ? $user->preferences['healthSnooze'] : null;
        $snoozed = $urgent !== null && $snooze !== null
            && ($snooze['key'] ?? null) === $urgent['key']
            && is_string($snooze['until'] ?? null)
            && CarbonImmutable::parse($snooze['until'])->isFuture();

        return [
            'state' => $report['state'],
            'sentence' => $report['sentence'],
            'label' => $report['label'],
            'count' => $report['count'],
            'href' => $user->may(PermissionModule::Settings, PermissionAction::View) ? '/admin/system' : null,
            'banner' => $snoozed ? null : $urgent,
        ];
    }

    private static function unread(AdminUser $user): ?int
    {
        try {
            return $user->unreadNotifications()->count();
        } catch (Throwable) {
            return null;
        }
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
