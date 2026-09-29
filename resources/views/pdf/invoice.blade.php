{{--
    A §14 UStG invoice or credit note (App\Services\Commerce\Invoices), rendered once by dompdf and stored as issued.
    Every figure is integer cents from the order's frozen lines, printed through GermanFormat. §14 Abs. 4 UStG, in the
    order it asks: seller and buyer with their addresses, the seller's tax number or USt-IdNr., the date, the number,
    quantity and kind of the goods, the time of delivery (the calendar month suffices, UStAE 14.5 Abs. 16), the net
    amount, the rate and the tax, the gross amount. A test invoice says on its face that it is none.
--}}
@php
    /** @var \App\Support\Seller $seller */
    $credit = $kind === \App\Models\Invoice::CREDIT_NOTE;
    $date = \App\Support\GermanFormat::date($issuedAt);
@endphp
<!doctype html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <title>{{ $credit ? 'Gutschrift' : 'Rechnung' }} {{ $number }}</title>
    <style>
        @page { margin: 22mm 18mm 26mm 22mm; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 9.5pt; line-height: 1.45; color: #14171c; }
        .test { border: 1.5pt solid #9a5b00; color: #6b3f00; padding: 6pt 8pt; margin-bottom: 14pt; font-weight: bold; }
        .sender { font-size: 7.5pt; color: #4a525e; border-bottom: 0.5pt solid #4a525e; padding-bottom: 2pt; margin-bottom: 6pt; width: 85mm; }
        .head { width: 100%; border-collapse: collapse; margin-bottom: 18pt; }
        .head td { vertical-align: top; padding: 0; }
        .facts { margin-left: auto; border-collapse: collapse; }
        .facts td { padding: 1pt 0 1pt 12pt; }
        .facts td:first-child { color: #4a525e; padding-left: 0; }
        h1 { font-size: 15pt; margin: 0 0 4pt; }
        .items { width: 100%; border-collapse: collapse; margin-top: 10pt; }
        .items th { text-align: left; font-size: 8pt; color: #4a525e; border-bottom: 1pt solid #14171c; padding: 4pt 4pt 4pt 0; }
        .items td { border-bottom: 0.5pt solid #c9ced6; padding: 5pt 4pt 5pt 0; vertical-align: top; }
        .num { text-align: right; white-space: nowrap; }
        .totals { width: 70mm; margin: 12pt 0 0 auto; border-collapse: collapse; }
        .totals td { padding: 2pt 0; }
        .totals .grand td { border-top: 1pt solid #14171c; font-weight: bold; font-size: 11pt; padding-top: 5pt; }
        .note { margin-top: 18pt; color: #4a525e; }
        footer { position: fixed; bottom: -16mm; left: 0; right: 0; font-size: 7.5pt; color: #4a525e; border-top: 0.5pt solid #c9ced6; padding-top: 4pt; }
    </style>
</head>
<body>
    @if ($test !== null)
        <div class="test">TESTRECHNUNG – keine Rechnung im Sinne des Umsatzsteuergesetzes. {{ $test }}</div>
    @endif

    <table class="head">
        <tr>
            <td>
                <div class="sender">{{ implode(' · ', $seller->addressLines()) ?: 'Verkäuferangaben folgen' }}</div>
                <div>{{ $buyer['name'] }}</div>
                <div>{{ $buyer['street'] }}</div>
                <div>{{ $buyer['zipCity'] }}</div>
                <div>{{ $buyer['country'] }}</div>
            </td>
            <td>
                <table class="facts">
                    <tr><td>{{ $credit ? 'Gutschrift' : 'Rechnung' }} Nr.</td><td>{{ $number }}</td></tr>
                    <tr><td>Datum</td><td>{{ $date }}</td></tr>
                    <tr><td>Bestellung</td><td>{{ $order->order_number }}</td></tr>
                    @if (! $credit)
                        <tr><td>Leistungszeitraum</td><td>{{ \App\Support\GermanFormat::monthYear($issuedAt) }}</td></tr>
                    @endif
                    @if ($corrects !== null)
                        <tr><td>Korrigiert</td><td>Rechnung {{ $corrects->number }} vom {{ \App\Support\GermanFormat::date($corrects->issued_at) }}</td></tr>
                    @endif
                </table>
            </td>
        </tr>
    </table>

    <h1>{{ $credit ? 'Gutschrift (Rechnungskorrektur)' : 'Rechnung' }}</h1>

    <table class="items">
        <thead>
            <tr>
                <th style="width: 12mm">Menge</th>
                <th>Bezeichnung</th>
                <th class="num" style="width: 28mm">Einzelpreis</th>
                <th class="num" style="width: 28mm">Gesamt</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($lines as $line)
                <tr>
                    <td>{{ $line['quantity'] }}</td>
                    <td>{{ $line['label'] }}</td>
                    <td class="num">{{ $money($line['unitGrossCents']) }}</td>
                    <td class="num">{{ $money($line['grossCents']) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr><td>Nettobetrag</td><td class="num">{{ $money($netCents) }}</td></tr>
        <tr><td>Umsatzsteuer 19 %</td><td class="num">{{ $money($taxCents) }}</td></tr>
        <tr class="grand"><td>{{ $credit ? 'Gutschriftbetrag' : 'Gesamtbetrag' }}</td><td class="num">{{ $money($grossCents) }}</td></tr>
    </table>

    <p class="note">
        @if ($credit)
            Der Betrag wird auf dem Weg erstattet, auf dem du bezahlt hast.
        @else
            Alle Preise enthalten 19 % Umsatzsteuer. Bezahlt{{ $order->paid_at ? ' am '.\App\Support\GermanFormat::date($order->paid_at) : '' }}.
        @endif
    </p>

    <footer>
        {{ implode(' · ', array_filter([...$seller->addressLines(), $seller->email])) }}
        @if ($seller->vatId !== null) · USt-IdNr. {{ $seller->vatId }} @endif
        @if ($seller->taxNumber !== null) · Steuernummer {{ $seller->taxNumber }} @endif
        @if ($seller->register !== null) · {{ $seller->register }} @endif
    </footer>
</body>
</html>
