<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\FitmentSubscription;
use Illuminate\Http\RedirectResponse;

/**
 * The two links a subscription mail carries. Both land on the homepage with one sentence, never
 * on a page of their own: there is nothing else to do there.
 */
class BenachrichtigungController extends Controller
{
    public function bestaetigen(string $token): RedirectResponse
    {
        $subscription = FitmentSubscription::query()->where('confirm_token', $token)->first();

        if ($subscription === null) {
            return redirect()->route('startseite')->with('toast', 'Dieser Bestätigungslink ist nicht mehr gültig.');
        }

        if ($subscription->confirmed_at === null) {
            $subscription->forceFill(['confirmed_at' => now(), 'unsubscribed_at' => null])->save();
        }

        return redirect()->route('startseite')->with('toast', 'Danke – wir sagen dir Bescheid, sobald ein Gutachten dein Fahrzeug nennt.');
    }

    public function abmelden(string $token): RedirectResponse
    {
        $subscription = FitmentSubscription::query()->where('unsubscribe_token', $token)->first();

        if ($subscription !== null && $subscription->unsubscribed_at === null) {
            $subscription->forceFill(['unsubscribed_at' => now()])->save();
        }

        return redirect()->route('startseite')->with('toast', 'Du bist abgemeldet. Wir schreiben dir dazu nicht mehr.');
    }
}
