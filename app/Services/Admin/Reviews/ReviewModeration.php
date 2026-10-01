<?php

declare(strict_types=1);

namespace App\Services\Admin\Reviews;

use App\Models\AdminUser;
use App\Models\Review;
use App\Services\Admin\AuditTrail;
use App\Services\Commerce\Reviews\ReviewSummary;
use Illuminate\Support\Facades\DB;

/**
 * What the team may do with a buyer's review (Verkauf › Bewertungen, D-103): hide it — always with a reason, kept with
 * the review and in the Protokoll — show it again, or answer it under its text. There is deliberately no way to write
 * one: a review comes only from a delivered order's own signed link (ReviewWriter), so a page's stars are always its
 * buyers' (§ 5 UWG). Hiding and showing change the wheel's rating at once (ReviewSummary).
 */
final class ReviewModeration
{
    public function __construct(private readonly ReviewSummary $summary) {}

    public function hide(Review $review, string $reason, AdminUser $admin): void
    {
        DB::transaction(function () use ($review, $reason, $admin): void {
            $review->forceFill(['hidden_at' => now(), 'hidden_reason' => $reason, 'hidden_by' => $admin->id])->save();
            $this->summary->refresh($review->wheel_model_id);

            AuditTrail::record($admin, 'review.hidden', ['review' => $review->id, 'order' => $review->order?->order_number, 'reason' => $reason], $review);
        });
    }

    public function show(Review $review, AdminUser $admin): void
    {
        DB::transaction(function () use ($review, $admin): void {
            $review->forceFill(['hidden_at' => null, 'hidden_reason' => null, 'hidden_by' => null])->save();
            $this->summary->refresh($review->wheel_model_id);

            AuditTrail::record($admin, 'review.shown', ['review' => $review->id, 'order' => $review->order?->order_number], $review);
        });
    }

    /** An empty answer takes the answer away. */
    public function reply(Review $review, ?string $reply, AdminUser $admin): void
    {
        $text = $reply === null || trim($reply) === '' ? null : trim($reply);

        DB::transaction(function () use ($review, $text, $admin): void {
            $review->forceFill([
                'reply' => $text,
                'replied_at' => $text === null ? null : now(),
                'replied_by' => $text === null ? null : $admin->id,
            ])->save();

            AuditTrail::record($admin, $text === null ? 'review.reply_removed' : 'review.replied', ['review' => $review->id, 'order' => $review->order?->order_number], $review);
        });
    }
}
