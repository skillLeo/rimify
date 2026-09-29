<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DisputeEvidenceRequest;
use App\Models\AdminUser;
use App\Models\Dispute;
use App\Models\Invoice;
use App\Payments\PaymentFailure;
use App\Payments\Payments;
use App\Services\Admin\AuditTrail;
use App\Services\Commerce\Invoices;
use App\Support\GermanFormat;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Verkauf › Rückbuchungen (Block G §5): every chargeback the webhook reported — open ones first, each with its reason
 * in German, the amount, the order, and the days left for the evidence; answered here with an explanation and files,
 * sent through the provider's API with the order's invoice as the receipt. The files are kept on the private disk,
 * the answer in the Protokoll. Not „Konflikte“: that page is the Gutachten's.
 */
class RueckbuchungenController extends Controller
{
    /** Stripe's reasons, in the words a shop owner uses. */
    public const REASONS = [
        'fraudulent' => 'Nicht autorisiert (Betrug gemeldet)',
        'product_not_received' => 'Ware nicht erhalten',
        'product_unacceptable' => 'Ware nicht wie beschrieben',
        'duplicate' => 'Doppelt abgebucht',
        'credit_not_processed' => 'Erstattung nicht erhalten',
        'subscription_canceled' => 'Abo gekündigt',
        'unrecognized' => 'Abbuchung nicht erkannt',
        'general' => 'Allgemein',
        'debit_not_authorized' => 'Lastschrift nicht genehmigt',
        'insufficient_funds' => 'Konto nicht gedeckt',
        'customer_initiated' => 'Vom Kunden veranlasst',
        'bank_cannot_process' => 'Bank kann nicht bearbeiten',
        'incorrect_account_details' => 'Falsche Kontodaten',
        'noncompliant' => 'Regelverstoß gemeldet',
    ];

    public const STATES = [
        'warning_needs_response' => 'Vorwarnung – Antwort nötig',
        'warning_under_review' => 'Vorwarnung – in Prüfung',
        'warning_closed' => 'Vorwarnung erledigt',
        'needs_response' => 'Antwort nötig',
        'under_review' => 'Bei der Bank in Prüfung',
        'won' => 'Gewonnen',
        'lost' => 'Verloren',
    ];

    public const SENT = 'Nachweise gesendet. Die Bank entscheidet; das Ergebnis kommt hierher, sobald Stripe es meldet.';

    public function index(Request $request): Response
    {
        $admin = $request->user('admin');
        $disputes = Dispute::query()->with('order')
            ->orderByRaw('closed_at IS NOT NULL')
            ->orderBy('evidence_due_by')
            ->orderByDesc('id')
            ->get();

        return Inertia::render('Admin/Rueckbuchungen/Index', [
            'disputes' => $disputes->map(static fn (Dispute $dispute): array => self::row($dispute))->all(),
            'canRespond' => $admin instanceof AdminUser && $admin->may(PermissionModule::Orders, PermissionAction::Edit),
        ]);
    }

    public function evidence(DisputeEvidenceRequest $request, Dispute $dispute, Invoices $invoices): RedirectResponse
    {
        $gateway = Payments::for($dispute->provider);

        if ($gateway === null) {
            return back()->withErrors(['evidence' => 'Der Zahlungsdienst dieser Rückbuchung ist gerade nicht eingerichtet. Es wurde nichts gesendet.']);
        }

        $disk = Storage::disk(Invoices::DISK);
        $kept = [];
        $files = [];

        foreach ($request->evidenceFiles() as $field => $upload) {
            $key = 'disputes/'.$dispute->id.'/'.Str::uuid()->toString().'.'.$upload->extension();
            $disk->put($key, (string) $upload->get());
            $kept[] = ['field' => $field, 'name' => $upload->getClientOriginalName(), 'key' => $key, 'sha256' => hash('sha256', (string) $upload->get())];
            $files[] = ['field' => $field, 'path' => $disk->path($key), 'name' => $upload->getClientOriginalName()];
        }

        // The order's invoice is the receipt: what was bought, for how much, to whom.
        $invoice = $dispute->order_id === null ? null : Invoice::query()->where('order_id', $dispute->order_id)->where('kind', Invoice::INVOICE)->first();

        if ($invoice !== null) {
            $files[] = ['field' => 'receipt', 'path' => $disk->path($invoice->pdf_key), 'name' => $invoice->number.'.pdf'];
        }

        try {
            $gateway->submitEvidence($dispute, $request->string('note')->toString(), $files);
        } catch (PaymentFailure $e) {
            return back()->withErrors(['evidence' => $e->customerMessage]);
        }

        $dispute->forceFill([
            'evidence' => ['note' => $request->string('note')->toString(), 'files' => $kept, 'receipt' => $invoice?->number, 'by' => $request->admin()->email],
            'evidence_submitted_at' => now(),
        ])->save();

        AuditTrail::record($request->admin(), 'dispute.evidence_submitted', [
            'dispute' => $dispute->provider_dispute_id,
            'order' => $dispute->order?->order_number,
            'files' => array_column($kept, 'name'),
            'receipt' => $invoice?->number,
        ], $dispute);

        return back()->with('toast', self::SENT);
    }

    /** @return array<string, mixed> */
    private static function row(Dispute $dispute): array
    {
        $due = $dispute->evidence_due_by;
        $open = $dispute->isOpen();

        return [
            'id' => $dispute->id,
            'reference' => $dispute->provider_dispute_id,
            'reason' => self::REASONS[$dispute->reason] ?? $dispute->reason,
            'status' => self::STATES[$dispute->status] ?? $dispute->status,
            'amount' => $dispute->amount_cents,
            'order' => $dispute->order === null ? null : ['id' => $dispute->order->id, 'number' => $dispute->order->order_number],
            'dueBy' => GermanFormat::dateTime($due),
            // Whole days left, counted to the deadline itself; negative once it has passed.
            'daysLeft' => $open && $due !== null ? (int) floor(now()->diffInSeconds($due, false) / 86400) : null,
            'overdue' => $open && $due !== null && $due->isPast(),
            'open' => $open,
            'answered' => $dispute->evidence_submitted_at !== null,
            'answeredAt' => GermanFormat::dateTime($dispute->evidence_submitted_at),
            'outcome' => match ($dispute->outcome) {
                'won' => 'Gewonnen – das Geld bleibt beim Shop.',
                'lost' => 'Verloren – der Betrag ist zurückgebucht.',
                'accepted' => 'Akzeptiert.',
                default => null,
            },
        ];
    }
}
