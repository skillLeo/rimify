<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AlertPreferencesRequest;
use App\Models\AdminUser;
use App\Services\Admin\AdminAlerts;
use App\Support\EditStamp;
use App\Support\GermanFormat;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The team's own notifications: the bell in the top bar and this page behind it
 * (docs/admin/rest-build-plan.md, step 1).
 *
 * Everything here is the reader's own — their alerts, their choices — so there is no module to
 * hold: every signed-in account may open it, and the policy refuses any alert that is not theirs.
 * What reaches a person at all was decided when the alert was sent (AdminAlerts: the area's view
 * right, their own choice).
 */
class BenachrichtigungenController extends Controller
{
    public const ALL_READ = 'Alle als gelesen markiert.';

    public const SAVED = 'Gespeichert.';

    /** How many the bell shows; the rest are one click away on this page. */
    public const LATEST = 8;

    private const PER_PAGE = 30;

    public function index(Request $request, AdminAlerts $alerts): Response|RedirectResponse
    {
        $admin = self::admin($request);
        $unreadOnly = $request->query('filter') === 'ungelesen';
        $current = max(1, (int) $request->query('seite', '1'));

        $page = $admin->notifications()
            ->when($unreadOnly, static fn ($query) => $query->whereNull('read_at'))
            ->reorder()
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(self::PER_PAGE, ['*'], 'seite', $current);

        // A page past the end opens the last real one, never an empty list that reads as "nothing".
        if ($page->isEmpty() && $page->total() > 0) {
            return redirect()->to(self::url($unreadOnly, $page->lastPage()));
        }

        return Inertia::render('Admin/Benachrichtigungen/Index', [
            'filter' => $unreadOnly ? 'ungelesen' : 'alle',
            'items' => array_map(self::item(...), array_values($page->items())),
            'counts' => [
                'unread' => $admin->unreadNotifications()->count(),
                'all' => $admin->notifications()->count(),
            ],
            'pagination' => [
                'current' => $page->currentPage(),
                'last' => $page->lastPage(),
                'prev' => $page->currentPage() > 1 ? self::url($unreadOnly, $page->currentPage() - 1) : null,
                'next' => $page->hasMorePages() ? self::url($unreadOnly, $page->currentPage() + 1) : null,
            ],
            'kinds' => $alerts->kindsFor($admin),
            // The switches as loaded: a flip sends it back, and one from an older page is refused (F-25).
            'kindsStamp' => EditStamp::of(self::switches($alerts, $admin)),
        ]);
    }

    /** What the bell shows when it is opened: the newest few, read or not, and the unread count. */
    public function latest(Request $request): JsonResponse
    {
        $admin = self::admin($request);

        $items = $admin->notifications()
            ->reorder()
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(self::LATEST)
            ->get()
            ->map(self::item(...))
            ->values()
            ->all();

        return response()->json([
            'unread' => $admin->unreadNotifications()->count(),
            'items' => $items,
        ]);
    }

    /**
     * Marks one alert read and, where it has a page, goes there: clicking an alert is both acts,
     * in one request, so the count never lags behind what the reader has seen.
     */
    public function read(Request $request, DatabaseNotification $notification): RedirectResponse
    {
        $this->authorize('update', $notification);

        $notification->markAsRead();

        $href = AdminAlerts::href($notification->data['target'] ?? null);

        return $href === null || $request->boolean('bleiben') ? back() : redirect()->to($href);
    }

    public function readAll(Request $request): RedirectResponse
    {
        $admin = self::admin($request);

        $admin->unreadNotifications()->update(['read_at' => now()]);

        return back()->with('toast', self::ALL_READ);
    }

    public function preferences(AlertPreferencesRequest $request, AdminAlerts $alerts): RedirectResponse
    {
        // Every switch is sent with each flip: one from a page opened before the last flip elsewhere would switch
        // that one back, so it is refused (EditStamp, the admin audit's F-25).
        EditStamp::guard($request, self::switches($alerts, $request->admin()));
        $alerts->remember($request->admin(), $request->choices());

        return back()->with('toast', self::SAVED);
    }

    /**
     * The reader's switches, kind by kind — what a flip rewrites.
     *
     * @return array<string, array{0: bool, 1: bool}>
     */
    private static function switches(AdminAlerts $alerts, AdminUser $admin): array
    {
        $switches = [];

        foreach ($alerts->kindsFor($admin) as $kind) {
            $switches[$kind['kind']] = [$kind['inApp'], $kind['email']];
        }

        return $switches;
    }

    /**
     * One alert as the bell and the page show it.
     *
     * @return array{id: string, kind: string, kindLabel: string, title: string, detail: string|null, href: string|null, read: bool, day: string, dayLabel: string, time: string|null, at: string|null, iso: string|null}
     */
    private static function item(DatabaseNotification $notification): array
    {
        /** @var array<string, mixed> $data */
        $data = $notification->data;
        $kind = is_string($data['kind'] ?? null) ? $data['kind'] : '';
        $at = $notification->created_at === null ? null : CarbonImmutable::instance($notification->created_at);
        $date = GermanFormat::date($at);
        $today = GermanFormat::date(CarbonImmutable::now(GermanFormat::TIMEZONE));
        $yesterday = GermanFormat::date(CarbonImmutable::now(GermanFormat::TIMEZONE)->subDay());

        return [
            'id' => (string) $notification->id,
            'kind' => $kind,
            'kindLabel' => AdminAlerts::label($kind),
            'title' => is_string($data['title'] ?? null) ? $data['title'] : AdminAlerts::label($kind),
            'detail' => is_string($data['detail'] ?? null) && $data['detail'] !== '' ? $data['detail'] : null,
            'href' => AdminAlerts::href($data['target'] ?? null),
            'read' => $notification->read_at !== null,
            'day' => $date ?? '',
            'dayLabel' => match (true) {
                $date === null => 'Ohne Datum',
                $date === $today => 'Heute',
                $date === $yesterday => 'Gestern',
                default => $date,
            },
            'time' => GermanFormat::time($at),
            'at' => GermanFormat::dateTime($at),
            'iso' => $at?->toIso8601String(),
        ];
    }

    private static function url(bool $unreadOnly, int $page): string
    {
        $query = [];

        if ($unreadOnly) {
            $query['filter'] = 'ungelesen';
        }

        if ($page > 1) {
            $query['seite'] = $page;
        }

        return '/admin/benachrichtigungen'.($query === [] ? '' : '?'.http_build_query($query));
    }

    private static function admin(Request $request): AdminUser
    {
        $user = $request->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }
}
