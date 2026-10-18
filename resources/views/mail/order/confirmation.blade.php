<x-mail::message>
# Danke – deine Zahlung ist eingegangen

Deine Bestellung **{{ $number }}** ist bezahlt. Hier ist alles, was dazugehört – heb diese Mail bitte auf.

@if ($vehicle)
**Fahrzeug:** {{ $vehicle }}
@endif

@foreach ($lines as $line)
**{{ $line['quantity'] }} × {{ $line['label'] }}** – {{ $line['total'] }}
@if ($line['verdict'])
{{ $line['verdict'] }}@if ($line['entry']) {{ $line['entry'] }}@endif @if ($line['papers']) {{ $line['papers'] }}@endif

@if ($line['rimAlone'] ?? null)
{{ $line['rimAlone'] }}

@endif
@if ($line['chosen'])
Für {{ $line['chosen'] }}:
@elseif ($line['sizes'] && $line['conditions'])
Für jede zulässige Reifengröße:
@endif
@foreach ($line['conditions'] as $condition)
- {{ $condition }}
@endforeach
@foreach ($line['sizes'] as $size)

Nur bei {{ $size['size'] }} ({{ $size['axle'] }}):

@forelse ($size['conditions'] as $condition)
- {{ $condition }}
@empty
- Keine weiteren Auflagen.
@endforelse
@endforeach
@endif

@endforeach
<x-mail::table>
| | |
|:--|--:|
| Zwischensumme | {{ $subtotal }} |
| Versand | {{ $shipping }} |
| **Gesamt** | **{{ $total }}** |
@unless ($smallBusiness)
| enthaltene MwSt. {{ $rate }} | {{ $tax }} |
@endunless
</x-mail::table>

@if ($smallBusiness)
{{ \App\Support\Seller::SMALL_BUSINESS_SENTENCE }}
@endif

@if ($address !== [])
**Lieferadresse:** {{ implode(', ', $address) }}
@endif

**Lieferzeit:** {{ $deliveryTime ?? 'Wir melden uns mit dem Versanddatum.' }}

@if ($invoiceNumber !== null)
Deine Rechnung **{{ $invoiceNumber }}** hängt an dieser Mail. Du kannst sie auch [hier herunterladen]({{ $invoiceUrl }}) (der Link gilt sieben Tage).
@else
Dies ist ein Testkauf mit Beispieldaten: Er bekommt keine Rechnung und zählt in keiner echten Zahl des Shops.
@endif
@if ($legalAttached)

{{ $legalAttached }}
@endif

<x-mail::button :url="$orderUrl">
Bestellung ansehen
</x-mail::button>

Der Link gilt zwölf Monate. Danach schicken wir dir auf der Seite, die er dann öffnet, einen neuen an diese Adresse.

Fragen zur Bestellung? Antworte einfach auf diese Mail und nenn die Bestellnummer.

RIMIFY
@if ($sellerLine !== '')

<small>{{ $sellerLine }}</small>
@endif

---

## Allgemeine Geschäftsbedingungen

{{ $agb ?? 'Die AGB stehen auf rimify.de unter Rechtliches.' }}

## Widerrufsbelehrung

{{ $widerruf ?? 'Die Widerrufsbelehrung steht auf rimify.de unter Rechtliches.' }}

## {{ \App\Support\WithdrawalForm::TITLE }}

<pre style="white-space: pre-wrap; font-family: inherit;">{{ $form }}</pre>
</x-mail::message>
