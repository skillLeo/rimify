<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\FitmentSubscription;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * The first of the two mails of the double opt-in: one link to confirm, nothing else — no
 * offer, no wheel, no tracking. Until this link is clicked the address is never written to again.
 */
class SubscriptionConfirmationMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(public FitmentSubscription $subscription) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Bitte bestätige deine Benachrichtigung bei RIMIFY');
    }

    public function content(): Content
    {
        $vehicle = $this->subscription->vehicle;

        return new Content(
            markdown: 'mail.subscription.confirm',
            with: [
                'vehicleLabel' => trim($vehicle->make.' '.$vehicle->variant),
                'confirmUrl' => $this->subscription->confirmUrl(),
            ],
        );
    }
}
