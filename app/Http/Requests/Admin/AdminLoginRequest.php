<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * The admin sign-in attempt.
 *
 * Two German sentences and a throttle, which is the whole of it. The screen is designed for four
 * states and two of them are decided here: the wrong password, and the lock that follows too many
 * of them (docs/design — Anmelden).
 *
 * The failure sentence never says which half was wrong. "Diese E-Mail kennen wir nicht" tells
 * whoever is guessing that the address is worth keeping, and turns a password guess into an
 * account-enumeration tool.
 */
class AdminLoginRequest extends FormRequest
{
    /** Attempts from one address-and-IP pair before the lock, and how long it holds. */
    private const ATTEMPTS = 5;

    private const DECAY_SECONDS = 60;

    /** Anyone may try to sign in; what they may do afterwards is the Policies' business (R-11). */
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
            'remember' => ['boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'email.required' => 'Bitte gib deine E-Mail-Adresse ein.',
            'email.email' => 'Das sieht nicht nach einer E-Mail-Adresse aus.',
            'password.required' => 'Bitte gib dein Passwort ein.',
        ];
    }

    /**
     * Signs the admin in, or throws the sentence the screen shows.
     *
     * The throttle is counted per address AND per IP, so one person guessing at one account cannot
     * lock every other admin out of the panel by using their address.
     */
    public function authenticateOrFail(): void
    {
        $this->ensureIsNotRateLimited();

        $ok = Auth::guard('admin')->attempt(
            ['email' => $this->string('email')->toString(), 'password' => $this->string('password')->toString()],
            $this->boolean('remember'),
        );

        if (! $ok) {
            RateLimiter::hit($this->throttleKey(), self::DECAY_SECONDS);

            throw ValidationException::withMessages([
                // One sentence for both halves: see the note at the top of this class.
                'email' => 'E-Mail-Adresse oder Passwort stimmt nicht.',
            ]);
        }

        RateLimiter::clear($this->throttleKey());
        $this->session()->regenerate();
    }

    /** How long the lock still holds, in whole seconds, or null while there is no lock. */
    public function lockoutSeconds(): ?int
    {
        return RateLimiter::tooManyAttempts($this->throttleKey(), self::ATTEMPTS)
            ? RateLimiter::availableIn($this->throttleKey())
            : null;
    }

    private function ensureIsNotRateLimited(): void
    {
        $seconds = $this->lockoutSeconds();

        if ($seconds === null) {
            return;
        }

        // The framework's own event, so anything listening for a lock — an alert, an audit row —
        // hears this one too.
        Event::dispatch(new Lockout($this));

        throw ValidationException::withMessages([
            'email' => sprintf(
                'Zu viele Versuche. Bitte warte %d Sekunden und versuch es dann noch einmal.',
                $seconds,
            ),
        ]);
    }

    private function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')->toString()).'|'.$this->ip());
    }
}
