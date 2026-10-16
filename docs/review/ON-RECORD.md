# ON-RECORD — every sentence that denies something of a document, and what backs it

CLAUDE.md R-17 (14.10.2026): the shop may state what RIMIFY has recorded and what follows from it; it may never state
what an external document does or does not contain, unless that absence is itself a recorded and verified field.

This is the list the rule asked for: every sentence in the product — engine, shop pages, e-mails, PDFs, admin — that
names a Gutachten, an ABE, a Nachtrag, a manufacturer or a document **and denies or restricts something** in the same
breath. It is written from `tests/Support/on-record-ledger.php`; `tests/Unit/OnRecordTest.php` fails when a sentence of
this shape appears that is not on the list, and when an entry is no longer written anywhere.

**73 sentences: 10 open, 18 backed by a recorded field, 43 about the shop itself, 2 not sentences.**

What the scan cannot see: a claim worded with neither a word for the document nor a word of denial („So steht es im
Gutachten“, „Wörtlich aus dem Gutachten“). Those were read by eye; the two that matter are in finding 118.

## Open — says more than the record supports, or waits for a decision

| Sentence | Read by | Where | Finding |
|---|---|---|---|
| „Das Gutachten deckt diese Größe für dein Fahrzeug nicht ab.“ | customer / operator | `Pages/Check/Index.vue:416` | EIGENE-FUNDE 119: also said where the recorded rows simply do not name the car |
| „Das Gutachten lässt diese Kombination für das Fahrzeug nicht zu.“ | customer / operator | `Pages/CheckErgebnis/Index.vue:82` | EIGENE-FUNDE 119: also said where the recorded rows simply do not name the car |
| „Fotos und Gutachten enthalten keine Kundendaten.“ | customer / operator | `Services/Legal/ProcessingRecord.php:167` | EIGENE-FUNDE 121: a general statement in the processing record, backed by no field — the operator's legal text |
| „im Gutachten nicht definiert“ | admin | `Services/Admin/Approvals/ConflictDecisions.php:177`, `Services/Admin/Approvals/ConflictDetector.php:155` | ADMIN-GEFUNDEN 505: the code is missing from the recorded Auflagenverzeichnis, which is not the same |
| „Code … ist in diesem Gutachten nicht definiert“ | admin | `Services/Admin/Approvals/DocumentRelease.php:99` | ADMIN-GEFUNDEN 505: as above, as a reason a release is blocked |
| „Diese Gutachten drucken keine Tabelle zur Tragfähigkeit der Reifen bei hoher Geschwindigkeit.“ | admin | `Pages/Admin/Abdeckung/Index.vue:72` | ADMIN-GEFUNDEN 505: the sentence finding 104 corrected in the shop, still in the admin |
| „Noch kein Gutachten nennt dieses Fahrzeug.“ | admin | `Pages/Admin/Fahrzeuge/Show.vue:152` | ADMIN-GEFUNDEN 505: means „no recorded row“ |
| „Dieses Gutachten hat noch keine Tabelle.“ | admin | `Pages/Admin/Gutachten/DeratingTable.vue:98` | ADMIN-GEFUNDEN 505: means „none entered yet“ |
| „Für dieses Fahrzeug gibt es in diesem Gutachten keine Zeile.“ | admin | `Pages/Admin/Gutachten/Show.vue:500` | ADMIN-GEFUNDEN 505: means „no recorded row“ |
| „HSN und TSN stehen in keinem Gutachten und bleiben leer; Achslasten und Höchstgeschwindigkeit ebenso – das Fahrzeug kommt „zur Prüfung“.“ | admin | `Pages/Admin/Gutachten/VehicleFromDocument.vue:109` | ADMIN-GEFUNDEN 505: a statement about every Gutachten there is — true of each one read so far |

## Backed — follows from a recorded and verified field

| Sentence | Read by | Where | The field |
|---|---|---|---|
| „%s %s laut Gutachten nur für Fahrzeuge mit %s zugelassen.“ | customer / operator | `Domain/Fitment/Resolver/FitmentResolver.php:699` | the kW band recorded beside the tyre size (TyreSize::powerBandDe) |
| „!Bei %s km/h ist laut Tabelle des Gutachtens kein Reifen mit Geschwindigkeitsindex %s zulässig.“ | customer / operator | `Domain/Fitment/Resolver/FitmentResolver.php:832` | a recorded „–“ in the document's speed table (DeratingLookup::isNotPermitted) |
| „Bei %s km/h ist ein %s-Reifen laut Tabelle des Gutachtens nicht zulässig, erforderlich ist %s.“ | customer / operator | `Domain/Fitment/Resolver/FitmentResolver.php:883` | a recorded „–“ for the lower speed symbol in the document's speed table |
| „Beispieltabelle aus den Demodaten, nicht aus dem Gutachten“ | customer / operator | `Domain/Fitment/Resolver/FitmentResolver.php:1159` | the recorded origin of a demo table (seededFrom) |
| „Die Felge ist für dein Fahrzeug freigegeben, die Reifen, die das Gutachten dazu nennt, aber nicht.“ | customer / operator | `Domain/Fitment/Tyres/KomplettradRefusal.php:51`, `Services/Storefront/Basket.php:102` | the tyre half is NOT_PERMITTED on the recorded sizes and the recorded table |
| „Das Gutachten gilt nicht für den Bauzeitraum dieses Fahrzeugs.“ | customer / operator | `Domain/Fitment/Verdict/VerdictReason.php:93` | the build window recorded on a row that names the car (FitmentRow::windowCovers) |
| „Das Gutachten gilt nicht für die Karosserieform oder den Antrieb dieses Fahrzeugs.“ | customer / operator | `Domain/Fitment/Verdict/VerdictReason.php:98` | the body or drive restriction recorded on every row that names the car |
| „Das Gutachten gilt nur für bestimmte Karosserieformen oder Antriebe.“ | customer / operator | `Domain/Fitment/Verdict/VerdictReason.php:99` | the same recorded restriction; what is unknown is the car's own body or drive, and the sentence says so |
| „Für die Höchstgeschwindigkeit deines Fahrzeugs lässt das Gutachten keinen passenden Reifen zu.“ | customer / operator | `Domain/Fitment/Verdict/VerdictReason.php:102` | a recorded „–“ in the document's speed table for the car's top speed |
| „Mit Hinweisen aus dem Gutachten – nichts davon musst du tun.“ | customer / operator | `Components/Product/FitmentPanel.vue:299` | every recorded condition of the answer is a note (FitmentVerdict::notesOnly) |
| „Das Gutachten deckt die geprüfte Kombination ab und nennt dazu nur Hinweise – nichts, was du tun musst.“ | customer / operator | `Pages/CheckErgebnis/Index.vue:55` | every recorded condition of the answer is a note (FitmentVerdict::notesOnly) |
| „Zulässig unter den Auflagen des Gutachtens, etwa nur mit bestimmten Radschrauben.“ | customer / operator | `Pages/Check/Index.vue:412` | the legend of CONDITIONAL: the recorded conditions; the example is one |
| „Das Gutachten lässt die Kombination nur unter Bedingungen zu.“ | customer / operator | `Pages/CheckErgebnis/Index.vue:74` | a CONDITIONAL answer: the recorded conditions |
| „Das Gutachten hat nur … Seiten.“ | admin | `Http/Requests/Admin/DocumentConditionRequest.php:121`, `Http/Requests/Admin/DocumentDeratingRequest.php:69`, `Http/Requests/Admin/DocumentExtraRequest.php:154`, `Http/Requests/Admin/FitmentRowsRequest.php:232`, `Http/Requests/Admin/VehicleFromDocumentRequest.php:75` | approval_documents.page_count, read from the uploaded PDF |
| „Wähl eine Karosserie aus der Liste oder „Nennt das Gutachten nicht“.“ | admin | `Http/Requests/Admin/VehicleFromDocumentRequest.php:71`, `Http/Requests/Admin/VehicleFromDocumentRequest.php:72`, `Pages/Admin/Gutachten/VehicleFromDocument.vue:139`, `Pages/Admin/Gutachten/VehicleFromDocument.vue:147` | this choice is the recorded absence: the person entering the document says it names none |
| „Steht nicht im Dokument“ | admin | `Pages/Admin/Gutachten/RecordFields.vue:152` | this choice is the recorded absence |
| „Beispieltabelle aus den Demodaten ({{ derating.seededFrom }}) – nicht aus diesem Gutachten übertragen.“ | admin | `Pages/Admin/Gutachten/DeratingTable.vue:121` | the recorded origin of a demo table (seeded_from) |
| „Eine Felge, die davor gefertigt wurde, deckt das Dokument nicht – der Shop sagt das dazu.“ | admin | `Pages/Admin/Gutachten/RecordFields.vue:140` | the field being filled in: valid_from_production |

## About the shop — what it does, holds or requires, not what a document contains

| Sentence | Read by | Where | What it says |
|---|---|---|---|
| „Wir zeigen dir nur Felgen, deren Gutachten dein Fahrzeug ausdrücklich nennt – mit den zulässigen Reifengrößen und allen Auflagen.“ | customer / operator | `Components/Home/HomeHero.vue:48` | what the listing shows: wheels with a released row for the car |
| „RIMIFY zeigt dir nur Felgen, deren Gutachten dein Fahrzeug ausdrücklich nennt – mit den zulässigen Reifengrößen und allen Auflagen.“ | customer / operator | `Pages/Startseite/meta.ts:10` | the same promise, as the page description |
| „Nur Felgen, deren Gutachten dein Fahrzeug nennt – mit Reifengrößen und Auflagen.“ | customer / operator | `Pages/Startseite/Mobile.vue:50` | the same promise, on the phone |
| „Danach siehst du nur Felgen, deren Gutachten dein Auto nennt.“ | customer / operator | `Pages/FelgenSuchen/Index.vue:44` | the same promise, in the vehicle picker |
| „Nur die Kombinationen, die das Gutachten für dein Fahrzeug nennt: {{ offer.perAxle }} Kompletträder für die Vorderachse, {{ offer.perAxle }} für die Hinterachse – montiert und gewuchtet.“ | customer / operator | `Components/Product/MischbereifungOffer.vue:82` | what the offer contains: the recorded front and rear pairs, nothing else |
| „Aktuell ist vorbelegt mit der kleinsten Größe, die ein Gutachten für ${vehicleShort} nennt – nicht unbedingt mit deiner heutigen Bereifung.“ | customer / operator | `composables/useRechner.ts:123` | the denial is about the customer's present tyres, not about a document |
| „Rechenwerte ersetzen kein Gutachten.“ | customer / operator | `lib/rechner.ts:64` | a disclaimer on the calculator: its figures are not an approval |
| „Nachtrag“ meint hier den Stand der EG-Typgenehmigung deines Fahrzeugs, nicht den des Gutachtens.“ | customer / operator | `Components/Product/FitmentDetail.vue:150` | explains which of two things the word „Nachtrag“ names |
| „Ein Dokument kann sich nicht selbst ablösen.“ | customer / operator | `Models/ApprovalDocument.php:89` | a rule of the record |
| „Ohne das PDF wird kein Gutachten freigegeben, und auf diesem Rechner fehlt:“ | customer / operator | `Services/Demo/AcceptanceSeeder.php:214` | a rule of the release |
| „Entferne sie dort zuerst; ein echtes Gutachten verliert keine Zeile als Nebenwirkung.“ | customer / operator | `Services/Demo/DemoCatalogue.php:134`, `Services/Demo/DemoCatalogue.php:158` | R-05, said to whoever removes demo data |
| „Platzhalter – kein echtes Gutachten“ | customer / operator | `Services/Demo/PlaceholderTables.php:21` | the issuer name of a demo document: says what our row is |
| „Noch ist kein Gutachten freigegeben; bis dahin zeigt der Shop zu keinem Fahrzeug eine Felge.“ | customer / operator | `Services/GoLive/GoLiveChecks.php:339` | the state of the record, on the go-live check |
| „Diese Ausführungen kann der Shop keinem Auto zeigen: Kein freigegebenes Gutachten nennt sie.“ | customer / operator | `Services/Admin/Dashboard/RoleFigures.php:59`, `Services/GoLive/GoLiveChecks.php:361` | counts wheels and versions without a row in a released document |
| „Kein Entwicklungsfahrzeug in einem freigegebenen Gutachten“ | customer / operator | `Services/GoLive/GoLiveChecks.php:414` | the name of a go-live check on our rows |
| „Noch nennt kein freigegebenes Gutachten ein Fahrzeug.“ | customer / operator | `Services/GoLive/GoLiveChecks.php:459` | the state of the record, on the go-live check |
| „Keine der {$pairs} in freigegebenen Gutachten steht auf „Felge freigegeben · Reifengröße noch nicht bestätigt“.“ | customer / operator | `Services/GoLive/GoLiveChecks.php:460` | counted from the engine's answers on our rows (D-217) |
| „Kein Fahrzeug in einem freigegebenen Gutachten ist ein Entwicklungsfahrzeug.“ | customer / operator | `Services/GoLive/GoLiveChecks.php:415` | its result, counted on our rows |
| „Ablage der Felgenfotos, der Bilder der Inhaltsseiten, der Gutachten-PDFs, der Rechnungen und Gutschriften (privat, nur über signierte Links) und der Exporte.“ | customer / operator | `Services/Legal/ProcessingRecord.php:166` | how the shop stores its files |
| „Ein Gutachten wird nur im PDF-Format angenommen.“ | customer / operator | `Http/Requests/Admin/PdfLocalUploadRequest.php:37`, `Services/Storage/PdfUpload.php:120`, `composables/admin/usePresignedUpload.ts:33` | a rule of the upload |
| „Entschieden: Für diese Kombination gilt jetzt nur das gewählte Gutachten.“ | admin | `Http/Controllers/Admin/KonflikteController.php:59` | the decision just recorded |
| „Ein Nachtrag ergänzt ein Gutachten, keinen anderen Nachtrag.“ | admin | `Http/Requests/Admin/ApprovalDocumentRequest.php:118` | a rule of the record |
| „Ersetzt werden kann nur ein freigegebenes Dokument.“ | admin | `Http/Requests/Admin/ApprovalDocumentRequest.php:136` | a rule of the record |
| „Ein Dokument kann sich nicht selbst ersetzen.“ | admin | `Http/Requests/Admin/ApprovalDocumentRequest.php:151` | a rule of the record |
| „Ein Nachtrag kann sich nicht selbst ergänzen.“ | admin | `Http/Requests/Admin/ApprovalDocumentRequest.php:155` | a rule of the record |
| „Dieses Gutachten gehört nicht zu dem Konflikt.“ | admin | `Http/Requests/Admin/KonfliktDecisionRequest.php:71` | a relation between two of our records |
| „Einen Code bitte so, wie das Gutachten ihn druckt: Buchstaben und Ziffern, höchstens 32 Zeichen – zum Beispiel A01 oder „Nicht 330D“.“ | admin | `Services/Admin/Approvals/DocumentConditions.php:45` | an instruction for entering a code |
| „Im Shop wird die Felge bei keinem Fahrzeug als passend gezeigt, bis ein Gutachten für sie freigegeben ist.“ | admin | `Services/Admin/Catalogue/PublishCheck.php:55` | what the shop does until a release |
| „steht in einem Gutachten und kann nicht entfernt werden.“ | admin | `Services/Admin/Catalogue/WheelEditor.php:261` | R-05, said to whoever edits a wheel |
| „Diese Ausführungen kann der Shop keinem Auto zeigen: Kein freigegebenes Gutachten nennt sie.“ | admin | `Services/Admin/Dashboard/RoleFigures.php:59` | counts versions without a row in a released document |
| „Das Dokument ist nicht mehr auffindbar.“ | admin | `Services/Admin/Orders/OrderDetail.php:160` | a file of ours that is gone |
| „Entfernt nur die Beispieldaten, nicht deine eigenen Felgen, Gutachten und Bestellungen.“ | admin | `composables/admin/useDemoStrip.ts:21` | what the button removes |
| „Zeilen mit diesen Codes bleiben „Unbekannt“, bis der Code hier steht – und das Gutachten ist so lange nicht freigebbar.“ | admin | `Pages/Admin/Gutachten/Auflagenverzeichnis.vue:353` | a rule of the release |
| „Am Urteil des Gutachtens ändert das nichts.“ | admin | `Pages/Admin/Gutachten/Auflagenverzeichnis.vue:434` | what an edit of ours does not change |
| „Entwurf, noch nicht freigegeben“ | admin | `Pages/Admin/Gutachten/Neu.vue:149` | the state of a record |
| „Ein Nachtrag ohne eigene Angabe übernimmt es, sobald sein Grundgutachten freigegeben ist.“ | admin | `Pages/Admin/Gutachten/RecordFields.vue:157` | a rule of the record |
| „}: Buchstaben und Ziffern, höchstens 32 Zeichen, so wie im Gutachten.“ | admin | `Pages/Admin/Gutachten/RowFields.vue:144` | an instruction for entering codes |
| „Den kW-Bereich, den das Gutachten neben die Größe druckt, trägst du daneben ein – 85-195; nur für diese Leistung gilt die Größe.“ | admin | `Pages/Admin/Gutachten/RowFields.vue:326` | an instruction for entering a kW band |
| „Codes, die das Gutachten nur bei dieser Größe druckt, stehen dahinter.“ | admin | `Pages/Admin/Gutachten/RowFields.vue:326` | an instruction for entering codes |
| „Die Zeile bleibt „Unbekannt“ und das Gutachten nicht freigebbar, bis der Code dort steht.“ | admin | `Pages/Admin/Gutachten/RowFields.vue:357` | a rule of the release |
| „Angaben, Codes und Zeilen eines freigegebenen Gutachtens lassen sich nicht mehr ändern. …“ | admin | `Pages/Admin/Gutachten/Show.vue:335`, `Pages/Admin/Gutachten/Show.vue:336` | R-12's neighbour: a released record is not edited; a correction is a new revision (D-250) |
| „Eine neue Fassung entsteht nur aus einem freigegebenen Gutachten.“ | admin (a refusal the page never reaches) | `Services/Admin/Approvals/DocumentRevision.php:41` | a rule of the record: a revision is started from the released one (D-250) |
| „Für keine Lücke wurde bisher ein Gutachten angefordert.“ | admin | `Pages/Admin/Nachfrage/Index.vue:40` | the state of our requests |

## Not a sentence

| Sentence | Read by | Where | What it is |
|---|---|---|---|
| „/^\s*(nur bis\|ab) Nachtrag (\d+)\s*$/u“ | customer / operator | `Services/Storefront/FitmentDetail.php:261` | the pattern that reads a recorded limit |
| „Verkäufe, Suchen ohne Treffer, Fahrzeuge ohne Felgen, Gutachten-Lücken“ | admin | `Services/Admin/Review/ReviewBoard.php:84` | a list of report names |

## Reworded on 14.10.2026 — the answer is the same, the sentence now says what is on record

No verdict changed. Each sentence said what a document does not contain; each now says what is not on record with us.
The last two were the same bare refusal for two different causes (the rule's last sentence).

| Now | Before | Where it is read |
|---|---|---|
| „Zu diesem Gutachten ist keine Tragfähigkeitstabelle für hohe Geschwindigkeit hinterlegt.“ | „Das Gutachten druckt keine Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit.“ | the tyre check (finding 104, the operator's wording) |
| „Für %s km/h ist in der hinterlegten Tabelle für Geschwindigkeitsindex %s kein Wert eingetragen.“ | „Für %s km/h nennt die Tabelle des Gutachtens für Geschwindigkeitsindex %s keinen Wert.“ | the tyre check |
| „Zu den Auflagen dieses Gutachtens sind Tragfähigkeitsindizes nur bis %s Achslast hinterlegt; die %s trägt %s.“ | „Die Auflagen des Gutachtens nennen Tragfähigkeitsindizes nur bis %s Achslast; die %s trägt %s.“ | the tyre check |
| „Für dieses Fahrzeug ist zu diesem Gutachten bei uns keine Freigabe hinterlegt.“ | „Das Gutachten führt dieses Fahrzeug nicht auf.“ | the reason under „nicht zulässig“ (see finding 119) |
| „Welche Reifen dein Fahrzeug mit dieser Felge braucht, ist bei uns zu diesem Gutachten nicht hinterlegt. Die Reifen können wir deshalb nicht bestätigen.“ | „Welche Reifen dein Fahrzeug mit dieser Felge braucht, sagt das Gutachten nicht. Wir können die Freigabe deshalb nicht bestätigen.“ | the reason under an unconfirmed tyre size |
| „Für diese Kombination ist bei uns keine Reifengröße hinterlegt.“ | „Für diese Kombination nennt das Gutachten keine Reifengröße.“ | why no Komplettrad is offered |
| „Für die zulässige Achslast deines Fahrzeugs ist in dieser Reifengröße kein Tragfähigkeitsindex hinterlegt.“ | „Für die zulässige Achslast deines Fahrzeugs nennt das Gutachten in dieser Reifengröße keinen Tragfähigkeitsindex.“ | why no Komplettrad is offered |
| „Unterschiedliche Reifengrößen vorne und hinten sind für dein Fahrzeug mit dieser Felge nicht hinterlegt.“ | „Unterschiedliche Reifengrößen vorne und hinten nennt das Gutachten für dein Fahrzeug mit dieser Felge nicht.“ | why no mixed set is offered |
| „Diese Reifengrößen für vorne und hinten sind für dein Fahrzeug nicht als Kombination hinterlegt.“ | „Diese Reifengrößen für vorne und hinten nennt das Gutachten für dein Fahrzeug nicht als Kombination.“ | why this mixed set is not offered |
| „Dieses Fahrzeug führen wir nicht mehr in unseren Daten. Wähl dein Fahrzeug bitte neu aus – dann prüfen wir die Felge dafür.“ | „Für dieses Fahrzeug können wir die Freigabe nicht bestätigen.“ | a vehicle that was removed — the bare refusal, named |
| „Für die Prüfung der Reifen fehlen uns gerade die Tabellen der Tragfähigkeits- und Geschwindigkeitsindizes. Das liegt an uns, nicht an deinem Fahrzeug – bis sie hinterlegt sind, können wir die Freigabe nicht bestätigen.“ | „Für dieses Fahrzeug können wir die Freigabe nicht bestätigen.“ | a fault in our own reference data — the bare refusal, named |
