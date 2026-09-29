<x-mail::message>
# {{ $title }}

@if ($detail)
{{ $detail }}
@endif

@if ($url)
<x-mail::button :url="$url">
Im Admin ansehen
</x-mail::button>
@endif

Du bekommst diese E-Mail, weil du sie unter „Benachrichtigungen“ eingeschaltet hast. Dort schaltest du sie auch wieder ab: {{ $settingsUrl }}

RIMIFY
</x-mail::message>
