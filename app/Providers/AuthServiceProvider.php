<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\BalanceWeightColour;
use App\Models\TpmsSensorPrice;
use App\Policies\BalanceWeightColourPolicy;
use App\Policies\TpmsSensorPricePolicy;
use App\Services\Admin\PermissionMatrix;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;

/**
 * Authorisation for the admin panel.
 *
 * Permissions are enforced server-side on every mutation via Policies; the UI only hides (R-11).
 * A Policy asks `AdminUser::may()`, which reads the module × action matrix — never a role name —
 * so what a role may do stays a data change the Super Admin makes from the panel.
 */
final class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * Each admin screen registers its model here in the commit that ships it, so the list is the
     * inventory of what the server authorises.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        BalanceWeightColour::class => BalanceWeightColourPolicy::class,
        TpmsSensorPrice::class => TpmsSensorPricePolicy::class,
    ];

    public function register(): void
    {
        parent::register();

        // One instance per request, none across requests: the policies and controllers of one
        // request share one read of the matrix, and a revoked permission is gone on the next.
        $this->app->scoped(PermissionMatrix::class);
    }

    public function boot(): void
    {
        /*
         * Every denial is evidence. docs/BUILD.md V3 requires a denied URL attempt to be logged.
         * The callback returns nothing, so the decision is left exactly as the Gate made it.
         *
         * `$result` is `mixed` rather than `?bool`: a Policy may answer with an Access\Response
         * (`Response::deny()`), and a denial in that shape is a denial all the same.
         */
        Gate::after(function (mixed $user, string $ability, mixed $result): void {
            if (! $user instanceof AdminUser || ! $this->denied($result)) {
                return;
            }

            activity('admin')
                ->causedBy($user)
                ->withProperties([
                    'ability' => $ability,
                    'route' => Route::currentRouteName(),
                ])
                // Kept on the row itself so the entry stays readable after the account is removed.
                ->tap(static function (AuditLog $entry) use ($user): void {
                    $entry->forceFill([
                        'actor_email' => $user->email,
                        'ip_address' => request()->ip(),
                    ]);
                })
                ->log('permission.denied');
        });
    }

    private function denied(mixed $result): bool
    {
        return $result === false || ($result instanceof Response && $result->denied());
    }
}
