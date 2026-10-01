<x-mail::message>
# Wie zufrieden bist du mit deinen Felgen?

Deine Bestellung **{{ $number }}** ist bei dir angekommen. Wir würden gern wissen, wie dir die Felgen gefallen:

@foreach ($wheels as $wheel)
- {{ $wheel }}
@endforeach

Ein paar Sterne genügen, ein Satz dazu ist freiwillig. Deine Bewertung erscheint auf der Seite der Felge, ohne deinen
Namen, als Bewertung eines geprüften Kaufs.

<x-mail::button :url="$url">
Felgen bewerten
</x-mail::button>

Der Link gilt {{ $days }} Tage und nur für deine Bestellung. Möchtest du nicht bewerten, musst du nichts tun – wir
fragen kein zweites Mal.

RIMIFY
</x-mail::message>
