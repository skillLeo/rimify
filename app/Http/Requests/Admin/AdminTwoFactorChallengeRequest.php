<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Services\Admin\Auth\AdminSignIn;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

/**
 * The second step of the admin sign-in (D-514): the six digits from the app, or one recovery code.
 *
 * Only after the password: without a waiting sign-in (AdminSignIn::PENDING, five minutes) there is nothing to confirm.
 * Five wrong codes end the waiting sign-in and close the second step of that account for 15 minutes, from any address:
 * whoever guessed the password still has five tries in a quarter of an hour at a million codes.
 */
class AdminTwoFactorChallengeRequest extends FormRequest
{
    public const ATTEMPTS = 5;

    public const EXPIRED = 'Die Anmeldung ist abgelaufen. Melde dich bitte noch einmal an.';

    public const WRONG = 'Der Code stimmt nicht. Gib den aktuellen Code aus deiner App ein.';

    public const TOO_MANY = 'Zu viele falsche Codes. Bitte warte %d Minuten und melde dich dann noch einmal an.';

    private const LOCK_SECONDS = 900;

    /** Anyone who passed the password may answer; who that is, the session says (pending()). */
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return ['code' => ['required', 'string', 'max:64']];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['code.required' => 'Bitte gib den Code aus deiner App ein.'];
    }

    /** The account waiting for this code, or the sentence that sends the person back to the password. */
    public function pendingOrFail(): AdminUser
    {
        $user = AdminSignIn::pending($this);

        if ($user === null) {
            $this->session()->forget(AdminSignIn::PENDING);

            throw ValidationException::withMessages(['email' => self::EXPIRED])->redirectTo(route('admin.anmelden'));
        }

        if (! $user->canSignIn()) {
            $this->session()->forget(AdminSignIn::PENDING);

            throw ValidationException::withMessages(['email' => AdminLoginRequest::CANNOT_SIGN_IN])->redirectTo(route('admin.anmelden'));
        }

        if (RateLimiter::tooManyAttempts($this->throttleKey($user), self::ATTEMPTS)) {
            $this->tooMany($user);
        }

        return $user;
    }

    /** A wrong code: counted, and the fifth closes the second step for a quarter of an hour. */
    public function failed(AdminUser $user): never
    {
        RateLimiter::hit($this->throttleKey($user), self::LOCK_SECONDS);

        if (RateLimiter::tooManyAttempts($this->throttleKey($user), self::ATTEMPTS)) {
            $this->tooMany($user);
        }

        throw ValidationException::withMessages(['code' => self::WRONG])->redirectTo(route('admin.anmelden'));
    }

    private function tooMany(AdminUser $user): never
    {
        $this->session()->forget(AdminSignIn::PENDING);
        $minutes = max(1, (int) ceil(RateLimiter::availableIn($this->throttleKey($user)) / 60));

        throw ValidationException::withMessages(['email' => sprintf(self::TOO_MANY, $minutes)])->redirectTo(route('admin.anmelden'));
    }

    public function passed(AdminUser $user): void
    {
        RateLimiter::clear($this->throttleKey($user));
    }

    private function throttleKey(AdminUser $user): string
    {
        return 'admin-zwei-faktor|'.$user->getKey();
    }
}
