<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\CustomerEmailRequest;
use App\Http\Requests\Storefront\CustomerLoginRequest;
use App\Http\Requests\Storefront\CustomerPasswordRequest;
use App\Http\Requests\Storefront\OrderAccountRequest;
use App\Mail\CustomerAccountMail;
use App\Models\CustomerAccount;
use App\Models\Order;
use App\Support\GermanFormat;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Mein Konto (Block G §2): guest checkout stays the default; after a paid order the confirmation page offers an
 * account in one click. That click opens the account under the order's address and mails one link to set the
 * password — nothing is typed but the password. The account then lists every order placed under its address.
 *
 * „Passwort vergessen“ answers the same sentence whether an address has an account or not. Deleting the account
 * leaves the orders: a merchant keeps them for the tax office, and the confirmation mails hold them anyway.
 */
class KontoController extends Controller
{
    public const LINK_SENT = 'Wir haben dir einen Link an %s geschickt. Mit ihm legst du dein Passwort fest.';

    public const FORGOT_SENT = 'Wenn es zu dieser Adresse ein Konto gibt, ist ein Link zum neuen Passwort unterwegs.';

    public const WRONG = 'E-Mail-Adresse oder Passwort ist falsch. Prüf beides oder leg unter „Passwort vergessen“ ein neues fest.';

    /** „Konto anlegen“ after the order — one click, the order's own address. */
    public function offer(OrderAccountRequest $request): RedirectResponse
    {
        $email = mb_strtolower((string) $request->order()?->customer?->email);

        if ($email === '') {
            abort(404);
        }

        $account = CustomerAccount::query()->firstOrCreate(['email' => $email]);

        // An account that already has a password gets the reset link: the click is never a way to learn that it exists.
        Mail::to($email)->send(new CustomerAccountMail($account, $account->password === null ? 'opened' : 'reset'));

        return back()->with('toast', sprintf(self::LINK_SENT, $email));
    }

    public function create(): Response
    {
        return Inertia::render('Konto/Anmelden');
    }

    public function login(CustomerLoginRequest $request): RedirectResponse
    {
        $guard = Auth::guard('customer');

        if (! $guard->attempt(['email' => $request->string('email')->toString(), 'password' => $request->string('password')->toString()])) {
            return back()->withErrors(['email' => self::WRONG])->onlyInput('email');
        }

        $request->session()->regenerate();
        $account = $guard->user();

        if ($account instanceof CustomerAccount) {
            $account->forceFill(['last_login_at' => now()])->save();
        }

        return redirect()->intended('/konto');
    }

    public function show(Request $request): Response
    {
        $account = self::account($request);

        return Inertia::render('Konto/Index', [
            'email' => $account->email,
            'orders' => $account->orders()->get()->map(static fn (Order $order): array => [
                'number' => $order->order_number,
                'placedAt' => GermanFormat::date($order->placed_at),
                'status' => $order->status->labelDe(),
                'total' => GermanFormat::money($order->total_cents),
                'vehicle' => $order->vehicle_label,
            ])->all(),
        ]);
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('customer')->logout();
        $request->session()->regenerateToken();

        return redirect('/')->with('toast', 'Du bist abgemeldet.');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $account = self::account($request);
        Auth::guard('customer')->logout();
        $account->delete();
        $request->session()->regenerateToken();

        return redirect('/')->with('toast', 'Dein Konto ist gelöscht. Bestellungen und Rechnungen bewahren wir auf, solange wir gesetzlich dazu verpflichtet sind.');
    }

    public function forgot(): Response
    {
        return Inertia::render('Konto/Vergessen');
    }

    public function sendLink(CustomerEmailRequest $request): RedirectResponse
    {
        $account = CustomerAccount::query()->where('email', $request->string('email')->toString())->first();

        if ($account !== null) {
            Mail::to($account->email)->send(new CustomerAccountMail($account, 'reset'));
        }

        return back()->with('toast', self::FORGOT_SENT);
    }

    public function editPassword(Request $request): Response
    {
        $account = CustomerPasswordRequest::accountFor($request);

        return Inertia::render('Konto/Passwort', [
            'email' => $account?->email,
            'refusal' => $account === null ? CustomerPasswordRequest::USED : null,
            'action' => $request->fullUrl(),
        ]);
    }

    public function updatePassword(CustomerPasswordRequest $request): RedirectResponse
    {
        $account = $request->account();

        if ($account === null) {
            return back()->withErrors(['password' => CustomerPasswordRequest::USED]);
        }

        $account->forceFill(['password' => $request->string('password')->toString(), 'email_verified_at' => $account->email_verified_at ?? now()])->save();
        Auth::guard('customer')->login($account);
        $request->session()->regenerate();

        return redirect('/konto')->with('toast', 'Dein Passwort ist gesetzt. Willkommen in deinem Konto.');
    }

    private static function account(Request $request): CustomerAccount
    {
        $account = $request->user('customer');

        return $account instanceof CustomerAccount ? $account : abort(403);
    }
}
