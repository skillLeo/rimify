<?php

declare(strict_types=1);

/*
 * R-17 — the ledger. Every sentence in the product that names a Gutachten, an ABE, a Nachtrag, a manufacturer or a
 * document and denies or restricts something in the same breath, with the verdict on it:
 *
 *   backed — it follows from a recorded and verified field, and the field is named;
 *   ours   — it says what the shop does, holds or requires, not what a document contains;
 *   code   — a pattern or a label, not a sentence anyone reads as a claim;
 *   open   — it says more than the record supports, or needs a decision; the finding is named.
 *
 * The key is a part of the sentence long enough to be that sentence alone. `tests/Unit/OnRecordTest.php` fails when a
 * sentence of this shape is written that is not listed here, and when an entry here is no longer written anywhere.
 * `docs/review/ON-RECORD.md` is this list in a table.
 *
 * Sentences that speak of our own record („hinterlegt“, „erfasst“, „liegt uns vor“, „bei uns“) need no entry.
 */

return [
    // ── What the customer reads: the engine ──────────────────────────────────────────────────────────────────────────
    'laut Gutachten nur für Fahrzeuge mit %s zugelassen' => ['backed', 'the kW band recorded beside the tyre size (TyreSize::powerBandDe)'],
    'ist laut Tabelle des Gutachtens kein Reifen mit Geschwindigkeitsindex' => ['backed', 'a recorded „–“ in the document\'s speed table (DeratingLookup::isNotPermitted)'],
    'laut Tabelle des Gutachtens nicht zulässig, erforderlich ist' => ['backed', 'a recorded „–“ for the lower speed symbol in the document\'s speed table'],
    'Beispieltabelle aus den Demodaten, nicht aus dem Gutachten' => ['backed', 'the recorded origin of a demo table (seededFrom)'],
    'die Reifen, die das Gutachten dazu nennt, aber nicht' => ['backed', 'the tyre half is NOT_PERMITTED on the recorded sizes and the recorded table'],
    'Das Gutachten gilt nicht für den Bauzeitraum dieses Fahrzeugs' => ['backed', 'the build window recorded on a row that names the car (FitmentRow::windowCovers)'],
    'Das Gutachten gilt nicht für die Karosserieform oder den Antrieb' => ['backed', 'the body or drive restriction recorded on every row that names the car'],
    'Das Gutachten gilt nur für bestimmte Karosserieformen oder Antriebe' => ['backed', 'the same recorded restriction; what is unknown is the car\'s own body or drive, and the sentence says so'],
    'lässt das Gutachten keinen passenden Reifen zu' => ['backed', 'a recorded „–“ in the document\'s speed table for the car\'s top speed'],

    // ── What the customer reads: the shop's pages ────────────────────────────────────────────────────────────────────
    'Wir zeigen dir nur Felgen, deren Gutachten dein Fahrzeug ausdrücklich nennt' => ['ours', 'what the listing shows: wheels with a released row for the car'],
    'RIMIFY zeigt dir nur Felgen, deren Gutachten dein Fahrzeug ausdrücklich nennt' => ['ours', 'the same promise, as the page description'],
    'Nur Felgen, deren Gutachten dein Fahrzeug nennt' => ['ours', 'the same promise, on the phone'],
    'Danach siehst du nur Felgen, deren Gutachten dein Auto nennt' => ['ours', 'the same promise, in the vehicle picker'],
    'Nur die Kombinationen, die das Gutachten für dein Fahrzeug nennt' => ['ours', 'what the offer contains: the recorded front and rear pairs, nothing else'],
    'die ein Gutachten für ${vehicleShort} nennt – nicht unbedingt mit deiner heutigen Bereifung' => ['ours', 'the denial is about the customer\'s present tyres, not about a document'],
    'Rechenwerte ersetzen kein Gutachten' => ['ours', 'a disclaimer on the calculator: its figures are not an approval'],
    'meint hier den Stand der EG-Typgenehmigung deines Fahrzeugs, nicht den des Gutachtens' => ['ours', 'explains which of two things the word „Nachtrag“ names'],
    'Mit Hinweisen aus dem Gutachten – nichts davon musst du tun' => ['backed', 'every recorded condition of the answer is a note (FitmentVerdict::notesOnly)'],
    'nennt dazu nur Hinweise – nichts, was du tun musst' => ['backed', 'every recorded condition of the answer is a note (FitmentVerdict::notesOnly)'],
    'Zulässig unter den Auflagen des Gutachtens, etwa nur mit bestimmten Radschrauben' => ['backed', 'the legend of CONDITIONAL: the recorded conditions; the example is one'],
    'Das Gutachten lässt die Kombination nur unter Bedingungen zu' => ['backed', 'a CONDITIONAL answer: the recorded conditions'],
    'Das Gutachten deckt diese Größe für dein Fahrzeug nicht ab' => ['open', 'EIGENE-FUNDE 119: also said where the recorded rows simply do not name the car'],
    'Das Gutachten lässt diese Kombination für das Fahrzeug nicht zu' => ['open', 'EIGENE-FUNDE 119: also said where the recorded rows simply do not name the car'],

    // ── Read by the operator, not by a customer ──────────────────────────────────────────────────────────────────────
    'Ein Dokument kann sich nicht selbst ablösen' => ['ours', 'a rule of the record'],
    'Ohne das PDF wird kein Gutachten freigegeben' => ['ours', 'a rule of the release'],
    'ein echtes Gutachten verliert keine Zeile als Nebenwirkung' => ['ours', 'R-05, said to whoever removes demo data'],
    'Platzhalter – kein echtes Gutachten' => ['ours', 'the issuer name of a demo document: says what our row is'],
    'Noch ist kein Gutachten freigegeben' => ['ours', 'the state of the record, on the go-live check'],
    'Kein freigegebenes Gutachten nennt ' => ['ours', 'counts wheels and versions without a row in a released document'],
    'Kein Entwicklungsfahrzeug in einem freigegebenen Gutachten' => ['ours', 'the name of a go-live check on our rows'],
    'Noch nennt kein freigegebenes Gutachten ein Fahrzeug' => ['ours', 'the state of the record, on the go-live check'],
    'in freigegebenen Gutachten steht auf „Felge freigegeben · Reifengröße noch nicht bestätigt“' => ['ours', 'counted from the engine\'s answers on our rows (D-217)'],
    'Kein Fahrzeug in einem freigegebenen Gutachten ist ein Entwicklungsfahrzeug' => ['ours', 'its result, counted on our rows'],
    'der Gutachten-PDFs, der Rechnungen und Gutschriften (privat, nur über signierte Links)' => ['ours', 'how the shop stores its files'],
    'Fotos und Gutachten enthalten keine Kundendaten' => ['open', 'EIGENE-FUNDE 121: a general statement in the processing record, backed by no field — the operator\'s legal text'],
    'Ein Gutachten wird nur im PDF-Format angenommen' => ['ours', 'a rule of the upload'],
    '(nur bis|ab) Nachtrag' => ['code', 'the pattern that reads a recorded limit'],

    // ── The admin — recorded this round, not changed (ADMIN-GEFUNDEN 505) ───────────────────────────────────────────
    'Für diese Kombination gilt jetzt nur das gewählte Gutachten' => ['ours', 'the decision just recorded'],
    'Ein Nachtrag ergänzt ein Gutachten, keinen anderen Nachtrag' => ['ours', 'a rule of the record'],
    'Ersetzt werden kann nur ein freigegebenes Dokument' => ['ours', 'a rule of the record'],
    'Ein Dokument kann sich nicht selbst ersetzen' => ['ours', 'a rule of the record'],
    'Ein Nachtrag kann sich nicht selbst ergänzen' => ['ours', 'a rule of the record'],
    'Das Gutachten hat nur ' => ['backed', 'approval_documents.page_count, read from the uploaded PDF'],
    'Dieses Gutachten gehört nicht zu dem Konflikt' => ['ours', 'a relation between two of our records'],
    'Nennt das Gutachten nicht' => ['backed', 'this choice is the recorded absence: the person entering the document says it names none'],
    'Steht nicht im Dokument' => ['backed', 'this choice is the recorded absence'],
    'im Gutachten nicht definiert' => ['open', 'ADMIN-GEFUNDEN 505: the code is missing from the recorded Auflagenverzeichnis, which is not the same'],
    'ist in diesem Gutachten nicht definiert' => ['open', 'ADMIN-GEFUNDEN 505: as above, as a reason a release is blocked'],
    'so, wie das Gutachten ihn druckt' => ['ours', 'an instruction for entering a code'],
    'bei keinem Fahrzeug als passend gezeigt, bis ein Gutachten für sie freigegeben ist' => ['ours', 'what the shop does until a release'],
    'steht in einem Gutachten und kann nicht entfernt werden' => ['ours', 'R-05, said to whoever edits a wheel'],
    'Kein freigegebenes Gutachten nennt sie' => ['ours', 'counts versions without a row in a released document'],
    'Das Dokument ist nicht mehr auffindbar' => ['ours', 'a file of ours that is gone'],
    'Fahrzeuge ohne Felgen, Gutachten-Lücken' => ['code', 'a list of report names'],
    'Entfernt nur die Beispieldaten, nicht deine eigenen Felgen, Gutachten und Bestellungen' => ['ours', 'what the button removes'],
    'Diese Gutachten drucken keine Tabelle zur Tragfähigkeit' => ['open', 'ADMIN-GEFUNDEN 505: the sentence finding 104 corrected in the shop, still in the admin'],
    'Noch kein Gutachten nennt dieses Fahrzeug' => ['open', 'ADMIN-GEFUNDEN 505: means „no recorded row“'],
    'und das Gutachten ist so lange nicht freigebbar' => ['ours', 'a rule of the release'],
    'Am Urteil des Gutachtens ändert das nichts' => ['ours', 'what an edit of ours does not change'],
    'Dieses Gutachten hat noch keine Tabelle' => ['open', 'ADMIN-GEFUNDEN 505: means „none entered yet“'],
    'nicht aus diesem Gutachten übertragen' => ['backed', 'the recorded origin of a demo table (seeded_from)'],
    'Entwurf, noch nicht freigegeben' => ['ours', 'the state of a record'],
    'Eine Felge, die davor gefertigt wurde, deckt das Dokument nicht' => ['backed', 'the field being filled in: valid_from_production'],
    'Ein Nachtrag ohne eigene Angabe übernimmt es' => ['ours', 'a rule of the record'],
    'so wie im Gutachten.' => ['ours', 'an instruction for entering codes'],
    'nur für diese Leistung gilt die Größe' => ['ours', 'an instruction for entering a kW band'],
    'Codes, die das Gutachten nur bei dieser Größe druckt' => ['ours', 'an instruction for entering codes'],
    'und das Gutachten nicht freigebbar, bis der Code dort steht' => ['ours', 'a rule of the release'],
    'Ein freigegebenes Gutachten ändert sich nicht mehr' => ['ours', 'R-12\'s neighbour: a released record is not edited'],
    'gibt es in diesem Gutachten keine Zeile' => ['open', 'ADMIN-GEFUNDEN 505: means „no recorded row“'],
    'HSN und TSN stehen in keinem Gutachten' => ['open', 'ADMIN-GEFUNDEN 505: a statement about every Gutachten there is — true of each one read so far'],
    'Für keine Lücke wurde bisher ein Gutachten angefordert' => ['ours', 'the state of our requests'],
];
