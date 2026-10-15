<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use App\Models\CustomerAccount;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;

/**
 * Setting the password through the mailed link. The signature is the permission (the route's `signed`); this also
 * holds the link to the password it was sent for (CustomerAccount::fingerprint), so a used link is refused.
 */
class CustomerPasswordRequest extends FormRequest
{
    public const USED = 'Dieser Link ist schon benutzt oder abgelaufen. Unter „Passwort vergessen“ bekommst du einen neuen.';

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return ['password' => ['required', 'string', 'confirmed', Password::min(10), 'max:200']];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'password.required' => 'Bitte wähle ein Passwort.',
            'password.confirmed' => 'Die beiden Passwörter sind nicht gleich.',
            'password.min' => 'Dein Passwort braucht mindestens 10 Zeichen.',
        ];
    }

    /** The account the link names, while the link still fits its password; null otherwise. */
    public function account(): ?CustomerAccount
    {
        return self::accountFor($this);
    }

    /** The same answer for the page that shows the form (a GET is not validated). */
    public static function accountFor(Request $request): ?CustomerAccount
    {
        $account = CustomerAccount::query()->find($request->route('account'));

        return $account !== null && hash_equals($account->fingerprint(), (string) $request->query('v')) ? $account : null;
    }
}
