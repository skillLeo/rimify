<x-mail::message>
# Danke, {{ $name }} – deine Nachricht ist angekommen

Wir lesen sie {{ $hours }} und antworten dir an diese Adresse.

**Betreff:** {{ $subject }}
@if ($vehicle)

**Fahrzeug:** {{ $vehicle }}
@endif

<x-mail::panel>
{{ $body }}
</x-mail::panel>

Möchtest du noch etwas ergänzen, antworte einfach auf diese E-Mail.

RIMIFY
</x-mail::message>
