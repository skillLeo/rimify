<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domain\Storefront\VehicleContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\ContactRequest;
use App\Mail\ContactConfirmationMail;
use App\Mail\ContactMessageMail;
use App\Models\ContactMessage;
use App\Models\Vehicle;
use App\Services\Storefront\Chrome;
use App\Support\GermanFormat;
use App\Support\VehicleName;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/**
 * Kontakt.
 *
 * Every contact detail comes from `config('rimify.contact')` — the homepage, the FAQ card and this
 * page previously carried three different phone numbers because they were written at three
 * different times (D-023). A literal number in a component is a defect. A detail the client has
 * not given arrives as null, and the page leaves its row out.
 *
 * The contact form (the client's #12, D-123): every e-mail button in the shop leads here (#26), with a subject where
 * the page knows one (`?betreff=…`) and the page it came from (`?von=…`). A message is kept, mailed to the shop with
 * the sender as reply-to, and confirmed to the sender; the car goes with it only where the visitor left it ticked.
 */
class KontaktController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Kontakt/Index', [
            'contact' => Chrome::contact(),
            // What the page that sent the visitor here knows: a subject and where they were. Both editable, both plain.
            'prefill' => [
                'subject' => mb_substr(trim((string) $request->query('betreff', '')), 0, 150),
                'from' => ContactRequest::shopPath($request->query('von')),
            ],
            // When the form was handed out, sealed: a message back sooner than a person writes one is a script's (#12).
            'ticket' => ContactRequest::ticket(),
        ]);
    }

    public function store(ContactRequest $request): RedirectResponse
    {
        // A filled honeypot is a script: it gets the same answer as a person, and nothing is kept or sent.
        if ($request->isBot()) {
            return back();
        }

        $message = ContactMessage::query()->create([
            'name' => trim((string) $request->validated('name')),
            'email' => trim((string) $request->validated('email')),
            'subject' => trim((string) $request->validated('subject')),
            'message' => trim((string) $request->validated('message')),
            'vehicle_label' => $request->boolean('withVehicle') ? $this->vehicleLabel($request) : null,
            'from_path' => $request->fromPath(),
        ]);

        // The message is kept whatever the mail does: a failed send is logged, never lost and never shown as an error
        // to someone whose words have arrived.
        try {
            $to = (string) config('rimify.contact.email');

            if ($to !== '') {
                Mail::to($to)->send(new ContactMessageMail($message));
            }

            Mail::to($message->email)->send(new ContactConfirmationMail($message));
        } catch (Throwable $e) {
            Log::warning('Kontaktformular: E-Mail nicht gesendet, die Nachricht ist gespeichert.', ['contact_message_id' => $message->id, 'error' => $e->getMessage()]);
        }

        return back();
    }

    /**
     * The car the box showed, named as the shop names it (Chrome::vehicle): its name, then its key numbers, or Feld K for
     * a car known only from a Gutachten. The id is the form's — what was ticked is what is sent (KON-05); a page from
     * before the id travelled sends none, and then the visitor's own cookie names it.
     */
    private function vehicleLabel(ContactRequest $request): ?string
    {
        $id = $request->vehicleId();

        if ($id === null) {
            $raw = $request->cookie(VehicleContext::COOKIE);
            $id = VehicleContext::decode(is_string($raw) ? $raw : null)?->vehicleId;
        }

        $vehicle = $id === null ? null : Vehicle::query()->find($id);

        if ($vehicle === null) {
            return null;
        }

        $keys = $vehicle->hsn !== null
            ? GermanFormat::keyNumbers($vehicle->hsn, $vehicle->tsn)
            : GermanFormat::egRange($vehicle->eg_nummer_raw) ?? GermanFormat::KEY_NUMBERS_MISSING;

        return mb_substr(VehicleName::forShop($vehicle->make, $vehicle->model, $vehicle->variant, $vehicle->type_designation).' ('.$keys.')', 0, 255);
    }
}
