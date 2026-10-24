<x-mail::message>
# Deine Bestellung ist unterwegs

Wir haben deine Bestellung **{{ $number }}** verschickt.@if ($tracking) Die Sendungsnummer lautet **{{ $tracking }}** – mit ihr kannst du die Sendung verfolgen.@endif


Was du bestellt hast und wie weit deine Bestellung ist, siehst du hier:

<x-mail::button :url="$url">
Bestellung ansehen
</x-mail::button>

Der Link gilt {{ $months }} Monate.

Fragen zur Bestellung? Antworte einfach auf diese Mail.

RIMIFY
</x-mail::message>
