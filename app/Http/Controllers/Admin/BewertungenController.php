<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReviewModerationRequest;
use App\Models\AdminUser;
use App\Models\Review;
use App\Services\Admin\Reviews\ReviewModeration;
use App\Support\GermanFormat;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Verkauf › Bewertungen (the client's #19, D-103): every buyer's review, newest first — the stars, the text, the wheel,
 * the order it came from. The team hides one with a reason, shows it again, or answers it under its text. Nothing here
 * writes a review: a page's stars are only ever its buyers' (§ 5 UWG).
 */
class BewertungenController extends Controller
{
    /** The filter: every review, the ones the shop shows, or the hidden ones. */
    public const FILTERS = ['alle' => 'Alle', 'sichtbar' => 'Im Shop sichtbar', 'ausgeblendet' => 'Ausgeblendet'];

    public function index(Request $request): Response
    {
        $filter = is_string($request->query('status')) && array_key_exists((string) $request->query('status'), self::FILTERS)
            ? (string) $request->query('status')
            : 'alle';

        $query = Review::query()->with(['order', 'wheelModel.brand'])->orderByDesc('id');

        if ($filter === 'sichtbar') {
            $query->whereNull('hidden_at');
        } elseif ($filter === 'ausgeblendet') {
            $query->whereNotNull('hidden_at');
        }

        $admin = $request->user('admin');

        return Inertia::render('Admin/Bewertungen/Index', [
            'items' => $query->limit(200)->get()->map(static fn (Review $review): array => self::row($review))->all(),
            'total' => Review::query()->count(),
            'filter' => $filter,
            'filters' => collect(self::FILTERS)->map(static fn (string $label, string $value): array => ['value' => $value, 'label' => $label])->values()->all(),
            'canModerate' => $admin instanceof AdminUser && $admin->canQuietly('moderate', new Review),
        ]);
    }

    public function hide(ReviewModerationRequest $request, Review $review, ReviewModeration $moderation): RedirectResponse
    {
        $moderation->hide($review, $request->reason(), $request->admin());

        return back()->with('toast', 'Bewertung ausgeblendet. Sie zählt nicht mehr zur Bewertung der Felge.');
    }

    public function show(ReviewModerationRequest $request, Review $review, ReviewModeration $moderation): RedirectResponse
    {
        $moderation->show($review, $request->admin());

        return back()->with('toast', 'Bewertung wieder eingeblendet.');
    }

    public function reply(ReviewModerationRequest $request, Review $review, ReviewModeration $moderation): RedirectResponse
    {
        $reply = $request->reply();
        $moderation->reply($review, $reply, $request->admin());

        return back()->with('toast', $reply === null || trim($reply) === '' ? 'Antwort entfernt.' : 'Antwort gespeichert. Sie steht im Shop unter der Bewertung.');
    }

    /** @return array<string, mixed> */
    private static function row(Review $review): array
    {
        $model = $review->wheelModel;

        return [
            'id' => $review->id,
            'rating' => $review->rating,
            'body' => $review->body,
            'wheel' => $model === null ? '–' : trim($model->brand->name.' '.$model->name),
            'wheelHref' => $model === null ? null : '/admin/felgen/'.$model->id,
            'order' => $review->order?->order_number,
            'orderHref' => $review->order === null ? null : '/admin/bestellungen/'.$review->order->id,
            'at' => GermanFormat::date($review->created_at),
            'hidden' => $review->isHidden(),
            'hiddenReason' => $review->hidden_reason,
            'hiddenAt' => GermanFormat::date($review->hidden_at),
            'reply' => $review->reply,
            'repliedAt' => GermanFormat::date($review->replied_at),
        ];
    }
}
