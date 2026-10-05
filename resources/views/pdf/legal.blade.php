{{--
    A legal text as a PDF attached to the order confirmation (§ 312f Abs. 2 BGB: the contract's terms and the
    Widerrufsbelehrung on a durable medium; App\Services\Content\LegalPdf). The page's live words as LegalTexts reads
    them — so the PDF never says anything the page does not — with the seller and the date they were sent on.
--}}
<!doctype html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        @page { margin: 22mm 18mm 24mm 22mm; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 9.5pt; line-height: 1.5; color: #14171c; }
        h1 { font-size: 15pt; margin: 0 0 4pt; }
        h2 { font-size: 11pt; margin: 16pt 0 4pt; }
        .meta { color: #4a525e; margin-bottom: 14pt; }
        .text { white-space: pre-wrap; }
        footer { position: fixed; bottom: -14mm; left: 0; right: 0; font-size: 7.5pt; color: #4a525e; border-top: 0.5pt solid #c9ced6; padding-top: 4pt; }
    </style>
</head>
<body>
    <h1>{{ $title }}</h1>
    <div class="meta">Erstellt am {{ $date }}@if ($order !== null) · zu deiner Bestellung {{ $order }}@endif</div>
    <div class="text">{{ $text }}</div>
    @if ($form !== null)
        <h2>{{ \App\Support\WithdrawalForm::TITLE }}</h2>
        <div class="text">{{ $form }}</div>
    @endif
    <footer>{{ $seller !== '' ? $seller : 'RIMIFY' }}</footer>
</body>
</html>
