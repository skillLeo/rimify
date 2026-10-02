<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use App\Models\ContactMessage;
use App\Support\ShopPath;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

/**
 * A message through the contact form (the client's #12, D-123). `rmf_leer` is the honeypot: a field no person sees, so a
 * filled one is a script — the controller then answers as for a sent message and keeps nothing. (Not a name like
 * „firma“ or „website“: a browser's autofill would fill those for a real person.) The car comes as the
 * id of the one the box showed, only where it stayed ticked; its name is always the server's, from the catalogue.
 */
class ContactRequest extends FormRequest
{
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
        ];
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
