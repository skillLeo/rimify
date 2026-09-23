<x-mail::message>
# Es gibt jetzt Felgen mit Gutachten für dein Fahrzeug

Ein neues Gutachten nennt dein Fahrzeug:

**{{ $vehicleLabel }}**

Damit {{ $wheelCount === 1 ? 'ist eine Felge' : 'sind '.$wheelCount.' Felgen' }} mit Gutachten für dein Auto verfügbar. Welche Reifengrößen und Auflagen gelten, steht bei jeder Felge dabei.

<x-mail::button :url="$listingUrl">
Passende Felgen ansehen
</x-mail::button>

Du bekommst diese Mail, weil du dich auf rimify.de dafür eingetragen hast. [Abmelden]({{ $unsubscribeUrl }}) geht jederzeit mit einem Klick.

RIMIFY
</x-mail::message>
