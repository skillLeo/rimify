<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ContactMessageReadRequest;
use App\Models\AdminUser;
use App\Models\ContactMessage;
use App\Services\Admin\Lists\ListPaging;
use App\Support\GermanFormat;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Verkauf › Nachrichten (the client's #12, D-123): what came through the contact form, newest first — who wrote, about
 * what, which car the page knew and where they were. The answer goes by e-mail („Antworten“ opens the team's mail
 * program addressed to the sender); here a message is only marked as read, so the rail's count says who still waits.
 */
class NachrichtenController extends Controller
{
    /** The filter: the unread ones first, as the queue the count names, or every message. */
    public const FILTERS = ['ungelesen' => 'Ungelesen', 'alle' => 'Alle'];

    public function index(Request $request): Response
    {
        $filter = is_string($request->query('status')) && array_key_exists((string) $request->query('status'), self::FILTERS)
            ? (string) $request->query('status')
            : 'ungelesen';

        $query = ContactMessage::query()->orderByDesc('id');

        if ($filter === 'ungelesen') {
            $query->whereNull('read_at');
        }

        // By who wrote, their address, the subject or a word of the message (umlauts as typed).
        $search = is_string($request->query('q')) ? mb_substr(trim((string) $request->query('q')), 0, 100) : '';

        if ($search !== '') {
            $like = '%'.addcslashes($search, '%_\\').'%';
            $query->where(static fn ($where) => $where->where('name', 'like', $like)->orWhere('email', 'like', $like)
                ->orWhere('subject', 'like', $like)->orWhere('message', 'like', $like));
        }

        // Every message reachable, page by page — the list once stopped at the newest 200 (the admin audit's F-26).
        $page = $query->paginate(ListPaging::PER_PAGE, ['*'], 'seite', ListPaging::requested($request->query('seite')));
        $admin = $request->user('admin');

        return Inertia::render('Admin/Nachrichten/Index', [
            'items' => collect($page->items())->map(static fn (ContactMessage $message): array => self::row($message))->all(),
            'search' => $search,
            'pagination' => ListPaging::props($page, '/admin/nachrichten', ['status' => $filter === 'ungelesen' ? null : $filter, 'q' => $search]),
            // The filter's and the search's own count, over every page.
            'count' => $page->total(),
            'total' => ContactMessage::query()->count(),
            'filter' => $filter,
            'filters' => collect(self::FILTERS)->map(static fn (string $label, string $value): array => ['value' => $value, 'label' => $label])->values()->all(),
            'canMarkRead' => $admin instanceof AdminUser && $admin->canQuietly('markRead', new ContactMessage),
            'keepMonths' => ContactMessage::KEEP_MONTHS,
        ]);
    }

    public function markRead(ContactMessageReadRequest $request, ContactMessage $message): RedirectResponse
    {
        if ($message->read_at === null) {
            $message->forceFill(['read_at' => now(), 'read_by' => $request->admin()->id])->save();
        }

        return back()->with('toast', 'Als gelesen markiert.');
    }

    /** @return array<string, mixed> */
    private static function row(ContactMessage $message): array
    {
        return [
            'id' => $message->id,
            'name' => $message->name,
            'email' => $message->email,
            'subject' => $message->subject,
            'message' => $message->message,
            'vehicle' => $message->vehicle_label,
            'from' => $message->from_path,
            'at' => GermanFormat::dateTime($message->created_at),
            'read' => $message->read_at !== null,
            'readAt' => GermanFormat::date($message->read_at),
            // „Antworten“: the team's own mail program, addressed and titled; the answer never passes through the shop.
            'replyHref' => 'mailto:'.str_replace('%40', '@', rawurlencode($message->email)).'?subject='.rawurlencode('Re: '.$message->subject),
        ];
    }
}
