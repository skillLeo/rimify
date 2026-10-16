<x-mail::message>
# Dein neuer Link zur Bestellung {{ $number }}

Du hast einen neuen Link zu deiner Bestellung **{{ $number }}** angefordert. Hier ist er:

<x-mail::button :url="$url">
Bestellung ansehen
</x-mail::button>

Der Link gilt {{ $months }} Monate. Hast du keinen Link angefordert, musst du nichts tun – die Mail ging nur an diese Adresse.

RIMIFY
</x-mail::message>
