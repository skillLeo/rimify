<x-mail::message>
@if ($opened)
# Dein Konto ist fast fertig

Du hast nach deiner Bestellung ein Konto angelegt. Leg jetzt nur noch dein Passwort fest – danach siehst du unter „Mein Konto“ jederzeit deine Bestellungen{{ config('rimify.own_invoices') ? ', ihre Freigaben und Rechnungen' : ' und ihre Freigaben' }}.
@else
# Ein neues Passwort

Mit diesem Link legst du ein neues Passwort für dein Konto fest.
@endif

<x-mail::button :url="$url">
Passwort festlegen
</x-mail::button>

Der Link gilt {{ $hours }} Stunden und nur einmal. Warst du das nicht, kannst du diese Mail einfach löschen – ohne Passwort kommt niemand in das Konto.

RIMIFY
</x-mail::message>
