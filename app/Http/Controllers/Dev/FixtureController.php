<?php

declare(strict_types=1);

namespace App\Http\Controllers\Dev;

use App\Domain\Fitment\Resolver\VehicleResolver;
use App\Domain\Storefront\VehicleContext;
use App\Http\Controllers\Controller;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use JsonException;
use RuntimeException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * The local-only fixture route behind the visual fidelity suite (tests/visual/README.md §4).
 *
 * The visual suite compares one prototype page against one of ours. For that comparison to mean
 * anything, our page has to be in the same state the prototype page was captured in — the header
 * alone has three mutually exclusive forms depending on whether a vehicle is chosen and whether a
 * listing has been seen. Driving the application through a vehicle selection before every
 * screenshot would make each case depend on the selector still working, so the state is set
 * directly here and the case then measures only the screen under test.
 *
 * Registered ONLY when `APP_ENV` is `local` or `testing` (see routes/web.php). It sets session
 * state from an unauthenticated request, which is exactly what a fixture is for and exactly what
 * must never exist in production.
 *
 * Everything here fails closed. An unmapped case 404s naming the missing key rather than falling
 * back to a plausible route: a fixture that renders the wrong page would turn a green gate into a
 * lie, which is the failure the suite exists to prevent (CONTRIBUTING.md §2).
 */
class FixtureController extends Controller
{
    /** Repo-relative, so the table sits beside the cases and the capture script that share it. */
    private const MAP = 'tests/visual/case-routes.json';

    /**
     * Set by the fixture, read by app.blade.php: serve the design's demonstration catalogue rather
     * than ours, so a measured page shows what the captured baseline shows.
     */
    public const DEMO_DATA_COOKIE = 'rmf_demo_data';

    public function __construct(private readonly VehicleResolver $resolver) {}

    public function __invoke(string $case): RedirectResponse
    {
        $map = $this->map();

        // `startseite@vehicle` → slug `startseite`, state `vehicle`.
        [$slug, $state] = str_contains($case, '@')
            ? explode('@', $case, 2)
            : [$case, 'default'];

        $routes = $map['routes'] ?? [];

        if (! isset($routes[$slug])) {
            throw new NotFoundHttpException(
                "No route mapped for prototype page '{$slug}'. Add it to ".self::MAP.
                ' under "routes". Do not guess a fallback — a fixture that renders the wrong '.
                'screen produces a green gate against the wrong page.'
            );
        }

        $target = $routes[$slug];

        /*
         * Some screens live behind a guard. The admin panel's own sign-in flow is V3 work and does
         * not exist yet, so without this the four admin screens simply redirect to the login page
         * and the visual suite measures that page four times over while reporting the names of
         * four others — green on something never compared.
         */
        if (($target['auth'] ?? null) === 'admin') {
            $this->authenticateAdmin();
        }

        /*
         * `path` rather than `route` for the one screen that has no route of its own: the 404 is
         * whatever an unmatched path renders. It still needs to come through the fixture so it
         * gets the demonstration-data cookie below — measured against a baseline captured from
         * the prototype, its grid of wheels has to be the prototype's wheels.
         */
        $redirect = isset($target['path'])
            ? redirect((string) $target['path'])
            : redirect()->route($target['route'], $target['params'] ?? []);

        /*
         * Tell the page it lands on to serve the design's demonstration catalogue instead of ours.
         *
         * The fixture redirects, so by the time the destination renders, the request is an
         * ordinary one and `request()->is('__fixture/*')` is false — which is how the first
         * attempt at this leaked live data into every measured page. A cookie survives the
         * redirect and the whole browsing context, which is exactly the scope wanted: every page
         * the visual suite opens in that context shows what the prototype showed.
         *
         * It has to be this way round. The baselines were captured from the prototype, and the
         * prototype ships twelve demonstration wheels; measuring our pages against them while
         * they show the real catalogue would compare BORBET Havanna to whatever our catalogue
         * happens to hold and fail for a reason that has nothing to do with fidelity.
         */
        $redirect = $redirect->withCookie(
            Cookie::make(self::DEMO_DATA_COOKIE, '1', 60, httpOnly: false)
        );

        return $state === 'default'
            ? $redirect
            : $this->applyState($redirect, $state, $map);
    }

    /**
     * @param  array<string, mixed>  $map
     */
    private function applyState(RedirectResponse $redirect, string $state, array $map): RedirectResponse
    {
        $config = $map['states'][$state] ?? null;

        if (! is_array($config)) {
            throw new NotFoundHttpException(
                "No state '{$state}' defined in ".self::MAP.' under "states".'
            );
        }

        return match ($state) {
            'vehicle' => $this->withVehicle($redirect, $config),
            default => throw new NotFoundHttpException(
                "State '{$state}' is declared but this controller does not know how to apply it."
            ),
        };
    }

    /**
     * Put a real vehicle in the cookie, in the same form a completed selection leaves behind.
     *
     * `enteredBooking` is our equivalent of the prototype's `rmf_seenPLP`: it is what moves the
     * header from the white box to the blue bar, so a case captured with the bar showing must be
     * reproduced with the flag set or the two headers can never match.
     *
     * @param  array<string, mixed>  $config
     */
    private function withVehicle(RedirectResponse $redirect, array $config): RedirectResponse
    {
        $hsn = $config['hsn'] ?? null;
        $tsn = $config['tsn'] ?? null;

        if (! is_string($hsn) || ! is_string($tsn)) {
            throw new RuntimeException(
                'The "vehicle" fixture state has no HSN/TSN in '.self::MAP.'. They are filled in '.
                "during §4 from the prototype's own shared/data.js, so that our seeded vehicle is ".
                'the one the prototype displays rather than one of ours that resembles it.'
            );
        }

        // R-01: this returns a Collection and more than one result is a real, meaningful state.
        // A fixture that silently took the first of several would pin the baseline to whichever
        // car happened to sort first — and those cars differ in exactly the axle load and top
        // speed the legal tyre requirement is derived from.
        $candidates = $this->resolver->byKeyNumbers($hsn, $tsn);

        if ($candidates->count() !== 1) {
            throw new RuntimeException(sprintf(
                'HSN %s / TSN %s resolves to %d vehicles; the fixture needs exactly one so that '.
                'every capture shows the same car. Choose an unambiguous pair in %s.',
                $hsn,
                $tsn,
                $candidates->count(),
                self::MAP,
            ));
        }

        $context = new VehicleContext(
            $candidates->first()->id,
            ($config['enteredBooking'] ?? false) === true,
        );

        return $redirect->withCookie(Cookie::make(
            VehicleContext::COOKIE,
            $context->encode(),
            VehicleContext::LIFETIME_MINUTES,
        ));
    }

    /**
     * Sign in as the first seeded administrator.
     *
     * The model comes from the guard's own provider config rather than being named here, so this
     * keeps working if the admin user model moves, and fails loudly if the guard is misconfigured
     * instead of silently leaving the request a guest.
     */
    private function authenticateAdmin(): void
    {
        $configured = config('auth.providers.admin_users.model');

        // It must be an Eloquent model to be queried and an Authenticatable to be signed in as.
        // Checking both is what makes `$model::query()` below a fact rather than an assumption.
        if (! is_string($configured)
            || ! is_subclass_of($configured, Model::class)
            || ! is_subclass_of($configured, Authenticatable::class)) {
            throw new RuntimeException(
                'The `admin` guard has no usable provider model, so the fixture cannot sign in. '.
                'Check config/auth.php: it must name an Eloquent model that is Authenticatable.'
            );
        }

        // No @var needed: the two is_subclass_of checks above have already narrowed $configured
        // to a class string that is both an Eloquent model and Authenticatable.
        $id = $configured::query()->orderBy('id')->value('id');

        if ($id === null) {
            throw new RuntimeException(
                'No administrator exists to sign in as. Run the AccessSeeder before measuring the '.
                'admin screens — measuring them as a guest would compare the login page to four '.
                'different screens and call it a pass.'
            );
        }

        Auth::guard('admin')->loginUsingId($id);
    }

    /**
     * @return array<string, mixed>
     */
    private function map(): array
    {
        $path = base_path(self::MAP);

        if (! is_file($path)) {
            throw new RuntimeException(self::MAP.' is missing; the fixture route cannot map anything.');
        }

        // A BOM — which every Windows editor adds on save, and this is a Windows machine — makes
        // json_decode fail with a message that names neither the file nor the reason.
        $raw = ltrim((string) file_get_contents($path), "\u{FEFF}");

        try {
            $decoded = json_decode($raw, true, 8, JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
            throw new RuntimeException(self::MAP.' is not valid JSON: '.$e->getMessage(), previous: $e);
        }

        return is_array($decoded) ? $decoded : [];
    }
}
