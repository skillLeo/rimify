<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Enums\AdminUserStatus;
use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Mail\AdminAlertMail;
use App\Models\AdminUser;
use App\Notifications\AdminAlert;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;
use Throwable;

/**
 * Who on the team hears about what (docs/admin/rest-build-plan.md, step 1).
 *
 * Every sender goes through send(): the recipients are the active accounts whose role may view the
 * area the alert is about — a person who cannot open Bestellungen is not told an order was paid —
 * and who have not switched that kind off. In the admin is on by default, e-mail off: a new colleague
 * is never mailed about something they did not ask for.
 *
 * An alert is a side effect. However it fails — no mail server, a broken row — the order still
 * turns Bezahlt and the conflict is still recorded; the failure is reported, never thrown.
 */
final class AdminAlerts
{
    /**
     * The kinds, in the order „Was du bekommst“ lists them. `module` is the area a recipient must
     * be allowed to view.
     *
     * @var array<string, array{module: PermissionModule, label: string, description: string}>
     */
    public const KINDS = [
        'order_paid' => [
            'module' => PermissionModule::Orders,
            'label' => 'Bestellung bezahlt',
            'description' => 'Eine Bestellung ist bezahlt und kann bearbeitet werden.',
        ],
        'conflict_opened' => [
            'module' => PermissionModule::Approvals,
            'label' => 'Neuer Konflikt',
            // The same sentence as the Übersicht's tile: one conflict, one way of saying it.
            'description' => 'Zwei Gutachten sagen über dieselbe Felge am selben Fahrzeug Verschiedenes.',
        ],
        'job_failed' => [
            'module' => PermissionModule::Settings,
            'label' => 'Hintergrundaufgabe fehlgeschlagen',
            'description' => 'Eine Aufgabe im Hintergrund, etwa ein E-Mail-Versand oder ein Import, ist abgebrochen.',
        ],
    ];

    /** The key in `admin_users.preferences` that holds the choices, beside the rail's. */
    private const PREFERENCE_KEY = 'alerts';

    /**
     * Tells everyone who should hear about it. Returns how many people were told in the admin.
     *
     * @param  array{route: string, params: array<string, int|string>}|null  $target
     */
    public function send(string $kind, string $title, ?string $detail = null, ?array $target = null): int
    {
        if (! isset(self::KINDS[$kind])) {
            return 0;
        }

        try {
            $told = 0;

            foreach ($this->recipients($kind) as $user) {
                $choice = $this->choice($user, $kind);

                if ($choice['inApp']) {
                    $user->notifyNow(new AdminAlert($kind, $title, $detail, $target));
                    $told++;
                }

                if ($choice['email']) {
                    $this->mail($user, $title, $detail, $target);
                }
            }

            return $told;
        } catch (Throwable $e) {
            report($e);

            return 0;
        }
    }

    /**
     * The kinds one person may receive, with their choices, for „Was du bekommst“.
     *
     * @return list<array{kind: string, label: string, description: string, inApp: bool, email: bool}>
     */
    public function kindsFor(AdminUser $user): array
    {
        $kinds = [];

        foreach (self::KINDS as $kind => $meta) {
            if (! $user->may($meta['module'], PermissionAction::View)) {
                continue;
            }

            $kinds[] = ['kind' => $kind, 'label' => $meta['label'], 'description' => $meta['description'], ...$this->choice($user, $kind)];
        }

        return $kinds;
    }

    /**
     * Stores one person's choices. Only kinds they may receive are kept; anything else in the
     * request was never offered to them.
     *
     * @param  array<string, array{inApp: bool, email: bool}>  $choices
     */
    public function remember(AdminUser $user, array $choices): void
    {
        $stored = [];

        foreach ($this->kindsFor($user) as $offered) {
            $kind = $offered['kind'];
            $stored[$kind] = isset($choices[$kind])
                ? ['in_app' => $choices[$kind]['inApp'], 'email' => $choices[$kind]['email']]
                : ['in_app' => $offered['inApp'], 'email' => $offered['email']];
        }

        $user->rememberPreferences([self::PREFERENCE_KEY => $stored]);
    }

    /**
     * The address an alert points to, or null while that page does not exist yet — never a link
     * to a 404.
     *
     * @param  mixed  $target  as stored in the notification's data
     */
    public static function href(mixed $target): ?string
    {
        if (! is_array($target) || ! is_string($target['route'] ?? null) || ! Route::has($target['route'])) {
            return null;
        }

        $params = is_array($target['params'] ?? null) ? $target['params'] : [];

        try {
            return route($target['route'], $params, false);
        } catch (Throwable) {
            return null;
        }
    }

    public static function label(string $kind): string
    {
        return self::KINDS[$kind]['label'] ?? 'Hinweis';
    }

    /** @return iterable<AdminUser> */
    private function recipients(string $kind): iterable
    {
        $module = self::KINDS[$kind]['module'];

        return AdminUser::query()
            ->where('status', AdminUserStatus::Active->value)
            ->orderBy('id')
            ->get()
            ->filter(static fn (AdminUser $user): bool => $user->may($module, PermissionAction::View));
    }

    /** @return array{inApp: bool, email: bool} */
    private function choice(AdminUser $user, string $kind): array
    {
        $all = is_array($user->preferences) ? ($user->preferences[self::PREFERENCE_KEY] ?? null) : null;
        $stored = is_array($all) ? ($all[$kind] ?? null) : null;

        return [
            'inApp' => is_array($stored) && is_bool($stored['in_app'] ?? null) ? $stored['in_app'] : true,
            'email' => is_array($stored) && is_bool($stored['email'] ?? null) ? $stored['email'] : false,
        ];
    }

    /** @param  array{route: string, params: array<string, int|string>}|null  $target */
    private function mail(AdminUser $user, string $title, ?string $detail, ?array $target): void
    {
        $path = self::href($target);

        try {
            Mail::to($user->email)->send(new AdminAlertMail(
                $title,
                $detail,
                $path === null ? null : url($path),
                url('/admin/benachrichtigungen'),
            ));
        } catch (Throwable $e) {
            // The alert is in the bell already; a mail server that is down must not undo that.
            report($e);
        }
    }
}
