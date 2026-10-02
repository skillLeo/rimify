<x-mail::message>
# {{ $subject }}

**Von:** {{ $name }} ({{ $email }})
@if ($vehicle)

**Fahrzeug:** {{ $vehicle }}
@endif
@if ($from)

**Geschrieben auf:** {{ $from }}
@endif

<x-mail::panel>
{{ $body }}
</x-mail::panel>

Mit „Antworten“ schreibst du direkt an {{ $email }}. Die Nachricht steht auch im Admin unter Verkauf › Nachrichten.
</x-mail::message>
