@php
    /*
     * The last page standing.
     *
     * ErrorPage reaches for this one only when the Inertia page could not be rendered at all —
     * no built manifest after a half-finished deploy, or no database, which on this application
     * also means no session. Whatever is broken, this page does not touch it.
     *
     * On what it may claim: the failure really is written to storage/logs/laravel.log, so "steht
     * in unserem Protokoll" is true. Nothing notifies a human — there is no Sentry, no Flare, no
     * error mail and no Slack channel in this application — so the page does not say the error is
     * being looked at. It asks instead, which is the honest version of the same sentence.
     */
    $status = $status ?? 500;
@endphp

@include('errors._standalone', [
    'status' => $status,
    'title' => 'Da ist etwas schiefgelaufen.',
    'lead' => 'Nicht bei dir, sondern bei uns: Diese Seite konnte der Server nicht fertig ausliefern.',
    'detail' => 'Der Fehler steht in unserem Protokoll. Benachrichtigt wird davon aber niemand automatisch – wenn du nicht weiterkommst, schreib uns kurz, dann sehen wir nach.',
])
