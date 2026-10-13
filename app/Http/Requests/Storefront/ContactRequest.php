<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use App\Models\ContactMessage;
use App\Support\ShopPath;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Validator;

/**
 * A message through the contact form (the client's #12, D-123). Three guards and no captcha from anyone else (the
 * operator's brief „THE 34“: a third party would fail the D-183 gate, and the GDPR with it):
 *
 * - `rmf_leer` is the honeypot: a field no person sees, so a filled one is a script — the controller then answers as for
 *   a sent message and keeps nothing. (Not a name like „firma“ or „website“: a browser's autofill would fill those for
 *   a real person.)
 * - `ticket` is the time the form was handed out, encrypted with the app's key: a message sent sooner than a person can
 *   write one — under MIN_SECONDS — or with no ticket of ours is not kept. Unlike the honeypot it is said, in a sentence
 *   under the button: a person who was that quick, or whose page is older than the ticket, sends again and loses nothing.
 * - the route allows five messages a minute per visitor (`throttle:shop-kontakt`).
 *
 * The car comes as the id of the one the box showed, only where it stayed ticked; its name is always the server's.
 */
class ContactRequest extends FormRequest
{
    /** Less than this between handing out the form and its message arriving is no person writing. */
    public const MIN_SECONDS = 3;

    public const TOO_FAST = 'Das ging zu schnell. Bitte schick deine Nachricht noch einmal ab.';

    public const NO_TICKET = 'Das Formular ist abgelaufen. Bitte lade die Seite neu und schick deine Nachricht noch einmal ab.';

    /**
     * The ticket a form is handed out with: when it was, sealed with the app's key — to the millisecond, so MIN_SECONDS
     * is what it says. In whole seconds a form handed out at x,9 s and sent at x+3,0 s counted as three seconds old
     * after 2,1. (A ticket of that older kind, on a page left open over a release, reads as long ago: it is.)
     */
    public static function ticket(?int $issuedAtMs = null): string
    {
        return Crypt::encryptString((string) ($issuedAtMs ?? now()->getTimestampMs()));
    }

    public function authorize(): bool
    {
        return Gate::allows('create', ContactMessage::class);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'string', 'email', 'max:190'],
            'subject' => ['required', 'string', 'max:150'],
            'message' => ['required', 'string', 'min:10', 'max:5000'],
            'withVehicle' => ['boolean'],
            'vehicleId' => ['nullable', 'integer', 'min:1'],
            'from' => ['nullable', 'string', 'max:255'],
            'rmf_leer' => ['nullable', 'string', 'max:255'],
            'ticket' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * The ticket, read after the fields: a script the honeypot caught is answered as a person (the controller), every
     * other message needs a ticket of ours at least MIN_SECONDS old.
     *
     * @return list<callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($this->isBot()) {
                    return;
                }

                $issuedAt = $this->issuedAt();

                if ($issuedAt === null) {
                    $validator->errors()->add('ticket', self::NO_TICKET);
                } elseif (now()->getTimestampMs() - $issuedAt < self::MIN_SECONDS * 1000) {
                    $validator->errors()->add('ticket', self::TOO_FAST);
                }
            },
        ];
    }

    /** When the form was handed out, in milliseconds, from its ticket; null for none, or for one this app did not seal. */
    private function issuedAt(): ?int
    {
        $ticket = $this->input('ticket');

        if (! is_string($ticket) || $ticket === '') {
            return null;
        }

        try {
            $issued = Crypt::decryptString($ticket);
        } catch (DecryptException) {
            return null;
        }

        return ctype_digit($issued) ? (int) $issued : null;
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.required' => 'Bitte sag uns deinen Namen.',
            'name.max' => 'Der Name ist zu lang – höchstens 120 Zeichen.',
            'email.required' => 'Bitte gib deine E-Mail-Adresse an, damit wir dir antworten können.',
            'email.email' => 'Diese E-Mail-Adresse sieht nicht vollständig aus. Bitte prüf sie noch einmal.',
            'email.max' => 'Die E-Mail-Adresse ist zu lang.',
            'subject.required' => 'Worum geht es? Ein paar Worte als Betreff reichen.',
            'subject.max' => 'Der Betreff ist zu lang – höchstens 150 Zeichen.',
            'message.required' => 'Bitte schreib uns deine Frage.',
            'message.min' => 'Ein, zwei Sätze mehr, damit wir dir gleich richtig antworten können.',
            'message.max' => 'Die Nachricht ist zu lang – höchstens 5.000 Zeichen.',
        ];
    }

    /** A filled honeypot: a script, not a person. */
    public function isBot(): bool
    {
        return trim((string) $this->input('rmf_leer', '')) !== '';
    }

    /** Where the form was opened from. */
    public function fromPath(): ?string
    {
        return self::shopPath($this->validated('from'));
    }

    /** The car the box showed, where it stayed ticked; null otherwise. */
    public function vehicleId(): ?int
    {
        $id = $this->validated('vehicleId');

        return $this->boolean('withVehicle') && $id !== null ? (int) $id : null;
    }

    /** A path of this shop and nothing else (ShopPath). */
    public static function shopPath(mixed $value): ?string
    {
        return ShopPath::of($value);
    }
}
