<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReviewRequest;
use App\Models\AdminUser;
use App\Models\ReviewFeedback;
use App\Services\Admin\AdminNavigation;
use App\Services\Admin\Review\ReviewBoard;
use App\Support\EditStamp;
use App\Support\GermanFormat;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * The review kit (the review release §3): the board of every screen and its state, the point sent
 * from the feedback button with where it was made and what it looked like, and the list the team
 * answers from. Only where the review is on (ReviewFeedbackPolicy).
 */
class ReviewController extends Controller
{
    /** What the answer form writes — and so what its stamp covers (EditStamp, the admin audit's F-25). */
    private const ANSWER_FIELDS = ['status', 'answer', 'assignee_id'];

    public function board(ReviewRequest $request, ReviewBoard $board, AdminNavigation $navigation): Response
    {
        // Linked only where the reader's rail reaches: a screen this role may not open is listed, not linked.
        $allowed = array_merge([], ...array_map(
            static fn (array $group): array => array_column($group['pages'], 'href'),
            $navigation->for($request->admin()),
        ));

        return Inertia::render('Admin/Review/Board', [
            'areas' => $board->areas($allowed),
            'counts' => [
                'open' => ReviewFeedback::query()->whereIn('status', ['neu', 'angenommen'])->count(),
                'all' => ReviewFeedback::query()->count(),
            ],
        ]);
    }

    public function feedback(ReviewRequest $request): Response
    {
        $type = $request->validated('typ');
        $screen = $request->validated('seite');
        $status = (string) ($request->validated('status') ?? 'offen');

        $items = ReviewFeedback::query()
            ->with(['reporter:id,name', 'assignee:id,name'])
            ->when(is_string($type), static fn ($q) => $q->where('type', $type))
            ->when(is_string($screen) && $screen !== '', static fn ($q) => $q->where('screen', $screen))
            ->when($status === 'offen', static fn ($q) => $q->whereIn('status', ['neu', 'angenommen']))
            ->when(! in_array($status, ['offen', 'alle'], true), static fn ($q) => $q->where('status', $status))
            ->orderByRaw("FIELD(status, 'neu', 'angenommen', 'erledigt', 'abgelehnt')")
            ->orderByDesc('id')
            ->limit(500)
            ->get();

        return Inertia::render('Admin/Review/Feedback', [
            'items' => $items->map(static fn (ReviewFeedback $f): array => [
                'id' => (int) $f->id,
                'type' => $f->type,
                'typeLabel' => ReviewFeedback::TYPES[$f->type] ?? $f->type,
                'sentence' => $f->sentence,
                'url' => $f->url,
                'screen' => $f->screen,
                'viewport' => $f->viewport,
                'browser' => $f->browser,
                'role' => $f->role,
                'by' => $f->reporter?->name,
                'at' => GermanFormat::dateTime($f->created_at),
                'status' => $f->status,
                'statusLabel' => ReviewFeedback::STATUSES[$f->status] ?? $f->status,
                'answer' => $f->answer ?? '',
                'assigneeId' => $f->assignee_id,
                'assignee' => $f->assignee?->name,
                'closedAt' => GermanFormat::date($f->closed_at),
                'image' => $f->screenshot_path === null ? null : '/admin/review/rueckmeldungen/'.$f->id.'/bild',
                // The answer as loaded: its form sends it back, a save against an older state is refused (F-25).
                'stamp' => EditStamp::of($f->only(self::ANSWER_FIELDS)),
            ])->values()->all(),
            'filters' => ['typ' => $type ?? '', 'seite' => $screen ?? '', 'status' => $status],
            // Everything there is, before the filters: nothing matching is not the same as nothing sent.
            'total' => ReviewFeedback::query()->count(),
            'types' => array_map(static fn (string $value, string $label): array => ['value' => $value, 'label' => $label], array_keys(ReviewFeedback::TYPES), ReviewFeedback::TYPES),
            'statuses' => array_map(static fn (string $value, string $label): array => ['value' => $value, 'label' => $label], array_keys(ReviewFeedback::STATUSES), ReviewFeedback::STATUSES),
            'screens' => ReviewBoard::screens(),
            'team' => AdminUser::query()->orderBy('name')->get(['id', 'name'])->map(static fn (AdminUser $u): array => ['value' => (int) $u->id, 'label' => $u->name])->values()->all(),
            'can' => ['answer' => $request->admin()->canQuietly('update', ReviewFeedback::class)],
        ]);
    }

    public function store(ReviewRequest $request): RedirectResponse
    {
        $admin = $request->admin();
        $bytes = $request->screenshotBytes();
        $path = null;

        if ($bytes !== null) {
            $path = 'feedback/'.Str::lower((string) Str::ulid()).'.png';
            Storage::disk(ReviewFeedback::DISK)->put($path, $bytes);
        }

        $url = (string) $request->validated('url');

        ReviewFeedback::query()->create([
            'admin_user_id' => $admin->id,
            'type' => (string) $request->validated('type'),
            'sentence' => (string) $request->validated('sentence'),
            'url' => $url,
            'screen' => ReviewBoard::screenFor($url),
            'viewport' => (string) $request->validated('viewport'),
            'browser' => (string) $request->validated('browser'),
            'role' => DB::table('model_has_roles')->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                ->where('model_has_roles.model_id', $admin->id)->where('model_has_roles.model_type', $admin->getMorphClass())
                ->value('roles.label_de'),
            'screenshot_path' => $path,
            'status' => 'neu',
        ]);

        return back()->with('toast', 'Danke – deine Rückmeldung ist angekommen.');
    }

    public function update(ReviewRequest $request, ReviewFeedback $feedback): RedirectResponse
    {
        $status = (string) $request->validated('status');
        $answer = $request->validated('answer');

        DB::transaction(static function () use ($request, $feedback, $status, $answer): void {
            // The point as it is now, held: a save from a form opened on another state is refused (EditStamp, F-25).
            $feedback = ReviewFeedback::query()->lockForUpdate()->findOrFail($feedback->getKey());
            EditStamp::guard($request, $feedback->only(self::ANSWER_FIELDS));

            $feedback->forceFill([
                'status' => $status,
                'answer' => is_string($answer) && $answer !== '' ? $answer : null,
                'assignee_id' => $request->validated('assignee_id'),
                // Closed once, when it leaves the open states; reopened, it is open again.
                'closed_at' => in_array($status, ['erledigt', 'abgelehnt'], true) ? ($feedback->closed_at ?? now()) : null,
            ])->save();
        });

        return back()->with('toast', 'Gespeichert.');
    }

    /** The screenshot, to the panel only: it can show what only the team may see. */
    public function image(ReviewRequest $request, ReviewFeedback $feedback): StreamedResponse
    {
        abort_if($feedback->screenshot_path === null || ! Storage::disk(ReviewFeedback::DISK)->exists($feedback->screenshot_path), 404);

        return Storage::disk(ReviewFeedback::DISK)->response($feedback->screenshot_path, 'rueckmeldung-'.$feedback->id.'.png', [
            'Content-Type' => 'image/png',
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }
}
