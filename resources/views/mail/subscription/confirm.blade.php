<x-mail::message>
# Bitte bestätige deine Benachrichtigung

Du möchtest Bescheid bekommen, sobald ein Gutachten dein Fahrzeug nennt:

**{{ $vehicleLabel }}**

Damit wir dir schreiben dürfen, bestätige bitte deine E-Mail-Adresse:

<x-mail::button :url="$confirmUrl">
Benachrichtigung bestätigen
</x-mail::button>

Wenn du das nicht warst, musst du nichts tun – ohne Bestätigung schreiben wir dir nicht noch einmal.

RIMIFY
</x-mail::message>
