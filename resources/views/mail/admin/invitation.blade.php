<x-mail::message>
# Deine Einladung zum RIMIFY-Admin

@if ($recipientName)
Hallo {{ $recipientName }},
@else
Hallo,
@endif

{{ $inviterName }} lädt dich in den RIMIFY-Admin ein. Deine Rolle dort: **{{ $roleLabel }}**.

Über den Link legst du dein Passwort fest und bist danach direkt angemeldet:

<x-mail::button :url="$url">
Einladung annehmen
</x-mail::button>

Der Link gilt bis {{ $expiresAt }} und funktioniert nur einmal. Ist er abgelaufen, bitte {{ $inviterName }} um einen neuen.

Wenn du mit dieser Einladung nichts anfangen kannst, musst du nichts tun – ohne dich entsteht kein Konto.

RIMIFY
</x-mail::message>
