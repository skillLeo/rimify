<?php

declare(strict_types=1);

namespace App\Services\Commerce\Reviews;

use App\Enums\OrderLineKind;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\Review;
use App\Models\WheelConfig;
use Illuminate\Support\Facades\DB;

/**
 * The buyer's side of a review (D-103): the rims of one delivered order, each rated once, through the order's own
 * signed link. A rim's line is reviewable when the order was marked „Zugestellt“, is not a demonstration, and the line
 * names a wheel the catalogue still knows. Every review written is a verified purchase — there is no other kind.
 */
final class ReviewWriter
{
    public function __construct(private readonly ReviewSummary $summary) {}

    /** The review's stand-in for a payment provider (App\Payments\SandboxGateway). */
    private const SANDBOX = 'sandbox';

    /**
     * Whether this order's buyer may review now: delivered — completed, or partly refunded and so still invited
     * (InviteReviews) — and paid for real. Never a demonstration, never the review's sandbox, never an order with a
     * payment in Stripe's test mode: no money moved, so there is no purchase to verify (D-147's rule, as the bestseller
     * count reads it; the operator's brief of 29.10.2026). A purged order has no row, and so no page.
     */
    public static function open(Order $order): bool
    {
        return in_array($order->status, [OrderStatus::Completed, OrderStatus::PartiallyRefunded], true)
            && $order->delivered_at !== null
            && ! $order->isDemo()
            && $order->payment_method !== self::SANDBOX
            && ! DB::table('payment_events')->where('order_id', $order->id)->where('livemode', false)->exists();
    }

    /**
     * The order's rims, each with what was said about it so far.
     *
     * @return list<array{line: int, label: string, wheelModelId: int, quantity: int, review: array{rating: int, body: string|null}|null}>
     */
    public function lines(Order $order): array
    {
        $lines = [];

        foreach ($this->wheelLines($order) as [$line, $modelId]) {
            $review = Review::query()->where('order_line_id', $line->id)->first();

            $lines[] = [
                'line' => (int) $line->id,
                'label' => (string) $line->label,
                'wheelModelId' => $modelId,
                'quantity' => (int) $line->quantity,
                'review' => $review === null ? null : ['rating' => $review->rating, 'body' => $review->body],
            ];
        }

        return $lines;
    }

    /**
     * Writes the ratings given, for the order's own rim lines not yet reviewed; returns how many were written.
     *
     * @param  array<int|string, array{rating: int, body?: string|null}>  $given  keyed by order line id
     */
    public function write(Order $order, array $given): int
    {
        $written = 0;
        $models = [];

        DB::transaction(function () use ($order, $given, &$written, &$models): void {
            foreach ($this->wheelLines($order) as [$line, $modelId]) {
                $rating = $given[$line->id]['rating'] ?? null;

                if (! is_int($rating) || $rating < 1 || $rating > 5 || Review::query()->where('order_line_id', $line->id)->exists()) {
                    continue;
                }

                $body = $given[$line->id]['body'] ?? null;
                $body = is_string($body) && trim($body) !== '' ? trim($body) : null;

                Review::query()->create([
                    'order_id' => $order->id,
                    'order_line_id' => $line->id,
                    'wheel_model_id' => $modelId,
                    'rating' => $rating,
                    'body' => $body,
                ]);

                $models[$modelId] = true;
                $written++;
            }

            foreach (array_keys($models) as $modelId) {
                $this->summary->refresh($modelId);
            }
        });

        return $written;
    }

    /** @return list<array{0: OrderLine, 1: int}> each rim line with its wheel model */
    private function wheelLines(Order $order): array
    {
        $order->loadMissing('lines');
        $out = [];

        foreach ($order->lines as $line) {
            if ($line->kind !== OrderLineKind::Wheel || $line->wheel_config_id === null) {
                continue;
            }

            $modelId = WheelConfig::withTrashed()->whereKey($line->wheel_config_id)->value('wheel_model_id');

            if ($modelId !== null) {
                $out[] = [$line, (int) $modelId];
            }
        }

        return $out;
    }
}
