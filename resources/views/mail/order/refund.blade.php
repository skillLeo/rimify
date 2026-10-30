<x-mail::message>
# Wir haben dir {{ $amount }} erstattet

Zu deiner Bestellung **{{ $number }}** erstatten wir dir **{{ $amount }}**, auf demselben Weg, auf dem du bezahlt hast. Je nach Bank und Zahlungsart ist das Geld in ein paar Tagen bei dir.@if ($full) Damit ist deine Bestellung vollständig erstattet.@endif

@if ($creditNote !== null)

Die Gutschrift **{{ $creditNote }}** hängt an dieser Mail. Du kannst sie auch [hier herunterladen]({{ $creditNoteUrl }}) (der Link gilt sieben Tage).
@endif

Fragen dazu? Antworte einfach auf diese Mail.

RIMIFY
</x-mail::message>
