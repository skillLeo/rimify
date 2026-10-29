<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\OrderLineKind;
use App\Enums\OrderStatus;
use App\Mail\ReviewInvitationMail;
use App\Models\Order;
use App\Services\Admin\AuditTrail;
use App\Services\Commerce\Reviews\ReviewWriter;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

/**
 * The review invitations (the client's #19, D-103), run daily: every order the team marked „Zugestellt“ at least
 * `rimify.reviews.invite_after_days` ago, not invited yet, with at least one rim on it, gets one mail with its signed
 * link — and is marked, so it never gets a second. A demonstration order gets none. A partly refunded order keeps
 * that status when it is delivered (OrderFulfilment), and is invited like any other.
 */
class InviteReviews extends Command
{
    protected $signature = 'rimify:bewertungen-einladen';

    protected $description = 'Lädt Käufer zugestellter Bestellungen einmal ein, ihre Felgen zu bewerten';

    public function handle(): int
    {
        $after = max(0, (int) config('rimify.reviews.invite_after_days', 7));
        $sent = 0;

        Order::query()
            ->with(['lines', 'customer'])
            ->whereIn('status', [OrderStatus::Completed->value, OrderStatus::PartiallyRefunded->value])
            ->whereNotNull('delivered_at')
            ->where('delivered_at', '<=', now()->subDays($after))
            ->whereNull('review_invited_at')
            ->orderBy('id')
            ->each(function (Order $order) use (&$sent): void {
                $email = $order->customer?->email;
                $wheels = $order->lines
                    ->filter(static fn ($line): bool => $line->kind === OrderLineKind::Wheel)
                    ->map(static fn ($line): string => (string) $line->label)
                    ->values()
                    ->all();

                // Only an order its buyer could then review: real, paid for real, delivered (ReviewWriter::open).
                if (! ReviewWriter::open($order) || $wheels === [] || ! is_string($email) || $email === '') {
                    return;
                }

                Mail::to($email)->send(new ReviewInvitationMail($order, $wheels));
                $order->forceFill(['review_invited_at' => now()])->save();
                $sent++;
            });

        if ($sent > 0) {
            AuditTrail::system('Zeitplan', 'reviews.invited', ['count' => $sent]);
        }

        $this->info($sent === 1 ? '1 Einladung verschickt.' : "{$sent} Einladungen verschickt.");

        return self::SUCCESS;
    }
}
