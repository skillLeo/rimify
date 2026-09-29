<x-mail::message>
# Wir haben dir {{ $amount }} erstattet

Zu deiner Bestellung **{{ $number }}** geht {{ $full ? 'der ganze Betrag' : 'ein Teil des Betrags' }} zurück: **{{ $amount }}**, auf demselben Weg, auf dem du bezahlt hast. Je nach Bank und Zahlungsart ist das Geld in ein paar Werktagen bei dir.

Die Gutschrift **{{ $creditNote }}** hängt an dieser Mail. Du kannst sie auch [hier herunterladen]({{ $creditNoteUrl }}) (der Link gilt sieben Tage).

Fragen dazu? Antworte einfach auf diese Mail.

RIMIFY
</x-mail::message>
