<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ContactMessageReadRequest;
use App\Models\AdminUser;
use App\Models\ContactMessage;
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

        $admin = $request->user('admin');

        return Inertia::render('Admin/Nachrichten/Index', [
            'items' => $query->limit(200)->get()->map(static fn (ContactMessage $message): array => self::row($message))->all(),
            'total' => ContactMessage::query()->count(),
            'filter' => $filter,
            'filters' => collect(self::FILTERS)->map(static fn (string $label, string $value): array => ['value' => $value, 'label' => $label])->values()->all(),
            'canMarkRead' => $admin instanceof AdminUser && $admin->can('markRead', new ContactMessage),
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
