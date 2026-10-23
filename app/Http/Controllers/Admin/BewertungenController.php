<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReviewModerationRequest;
use App\Models\AdminUser;
use App\Models\Review;
use App\Services\Admin\Lists\ListPaging;
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

        // By the order number, the Felge and its brand, or a word of the review (umlauts as typed).
        $search = is_string($request->query('q')) ? mb_substr(trim((string) $request->query('q')), 0, 100) : '';

        if ($search !== '') {
            $like = '%'.addcslashes($search, '%_\\').'%';
            $query->where(static fn ($where) => $where->where('body', 'like', $like)
                ->orWhereHas('order', static fn ($order) => $order->where('order_number', 'like', $like))
                ->orWhereHas('wheelModel', static fn ($model) => $model->where('name', 'like', $like)
                    ->orWhereHas('brand', static fn ($brand) => $brand->where('name', 'like', $like))));
        }

        // Every review reachable, page by page — the list once stopped at the newest 200 (the admin audit's F-26).
        $page = $query->paginate(ListPaging::PER_PAGE, ['*'], 'seite', ListPaging::requested($request->query('seite')));
        $admin = $request->user('admin');

        return Inertia::render('Admin/Bewertungen/Index', [
            'items' => collect($page->items())->map(static fn (Review $review): array => self::row($review))->all(),
            'found' => $page->total(),
            'search' => $search,
            'pagination' => ListPaging::props($page, '/admin/bewertungen', ['status' => $filter === 'alle' ? null : $filter, 'q' => $search]),
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

        // Nothing to remove and nothing typed: said so, and nothing written (the admin audit's F-28).
        if (($reply === null || trim($reply) === '') && ($review->reply === null || trim((string) $review->reply) === '')) {
            return back()->with('toast', 'Die Antwort ist leer – gespeichert wurde nichts.');
        }

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
