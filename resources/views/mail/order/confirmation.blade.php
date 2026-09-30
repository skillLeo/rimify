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

@foreach ($line['conditions'] as $condition)
- {{ $condition }}
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

Deine Rechnung **{{ $invoiceNumber }}** hängt an dieser Mail. Du kannst sie auch [hier herunterladen]({{ $invoiceUrl }}) (der Link gilt sieben Tage).

<x-mail::button :url="$orderUrl">
Bestellung ansehen
</x-mail::button>

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
