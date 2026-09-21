<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\ApprovalDocument;
use App\Models\FitmentSubscription;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * The second mail: a document now names the subscriber's vehicle. It links to the listing for
 * that car and carries the unsubscribe link; it names no wheel and no price, because what is
 * permitted is decided on the page by the engine, not in a mail written before the visit.
 */
class FitmentAvailableMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public FitmentSubscription $subscription,
        public ApprovalDocument $document,
        public int $wheelCount,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Es gibt jetzt Felgen mit Gutachten für dein Fahrzeug');
    }

    public function content(): Content
    {
        $vehicle = $this->subscription->vehicle;

        return new Content(
            markdown: 'mail.subscription.available',
            with: [
                'vehicleLabel' => trim($vehicle->make.' '.$vehicle->variant),
                'wheelCount' => $this->wheelCount,
                'listingUrl' => route('felgen.suchen', ['marke' => $vehicle->make, 'modell' => $vehicle->model]),
                'unsubscribeUrl' => $this->subscription->unsubscribeUrl(),
            ],
        );
    }
}
