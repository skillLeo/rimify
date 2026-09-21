<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Domain\Fitment\Infrastructure\ListingQuery;
use App\Events\ApprovalDocumentPublished;
use App\Mail\FitmentAvailableMail;
use App\Models\FitmentSubscription;
use App\Services\Storefront\FitmentCount;
use App\Services\Storefront\HomeStats;
use App\Services\Storefront\MegaMenu;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

/**
 * On every publish: forget the caches the document changes, then mail every confirmed subscriber
 * whose vehicle the document names — once per document, and only when the listing for that car
 * really shows something (a document row whose wheel is unpublished is not news).
 */
final class NotifyFitmentSubscribers implements ShouldQueue
{
    public function __construct(private readonly ListingQuery $listing) {}

    public function handle(ApprovalDocumentPublished $event): void
    {
        $document = $event->document;

        HomeStats::forget();
        MegaMenu::forget();

        $vehicleIds = $document->fitments()->distinct()->pluck('vehicle_id')->map(static fn ($id): int => (int) $id)->all();

        if ($vehicleIds === []) {
            return;
        }

        foreach ($vehicleIds as $vehicleId) {
            FitmentCount::forget($vehicleId);
        }

        $subscriptions = FitmentSubscription::query()
            ->active()
            ->whereIn('vehicle_id', $vehicleIds)
            ->where(function ($query) use ($document): void {
                $query->whereNull('notified_document_id')->orWhere('notified_document_id', '!=', $document->id);
            })
            ->with('vehicle')
            ->get();

        $counts = [];

        foreach ($subscriptions as $subscription) {
            $counts[$subscription->vehicle_id] ??= $this->listing->total($subscription->vehicle_id);

            if ($counts[$subscription->vehicle_id] === 0) {
                continue;
            }

            Mail::to($subscription->email)->send(new FitmentAvailableMail($subscription, $document, $counts[$subscription->vehicle_id]));

            $subscription->forceFill(['notified_at' => now(), 'notified_document_id' => $document->id])->save();
        }
    }
}
