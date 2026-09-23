<?php

declare(strict_types=1);

// The three guides the homepage links to (H10). Data only; ContentSeeder writes it into `pages`.
//
// Formatting: "\u{202F}" is the narrow no-break space between a number and its unit (`35 mm`),
// `–` is the en dash with spaces, „…“ are the German quotes. Paragraphs are separated by "\n\n".
//
// Every sentence that touches law or approval procedure is listed in docs/client-questions.md
// under "Ratgeber – Aussagen zum Recht, bitte prüfen" and must be confirmed before launch.
//
// `status` is the result of docs/reviews/accuracy-research-guides-tyres.md (Task A):
// - hsn-und-tsn-finden: published, with corrections H10 and H12 applied;
// - einpresstiefe-et-erklaert: published, with correction E11 (and the optional E4) applied;
// - abe-teilegutachten-ece: DRAFT. It predates the Teiletypgenehmigung and says the Eintragung is
//   what makes the wheel legal (A13, wrong). It stays a draft until it is rewritten and the
//   client's lawyer has signed it off; the seeder does not publish it, and neither may anyone else.
return [
    [
        'slug' => 'hsn-und-tsn-finden',
        'status' => 'published',
        'title' => 'HSN und TSN finden',
        'teaser' => 'Mit zwei kurzen Nummern aus der Zulassungsbescheinigung Teil I findest du dein Fahrzeug bei uns. Wo sie stehen und was sie bedeuten.',
        'minutes' => 3,
        'meta_description' => 'HSN und TSN stehen in der Zulassungsbescheinigung Teil I, Felder 2.1 und 2.2. Wo du sie findest, was sie bedeuten und was du bei mehreren Treffern tust.',
        'blocks' => [
            [
                'heading' => 'Zwei Nummern, ein Fahrzeugtyp',
                'text' => "Die HSN ist die Herstellerschlüsselnummer. Sie hat vier Zeichen und steht für den Hersteller deines Fahrzeugs. Die TSN ist die Typschlüsselnummer. Sie hat drei Zeichen und steht für den Fahrzeugtyp.\n\nZusammen beschreiben die beiden Nummern dein Fahrzeug genauer als Marke und Modellname. Ein „Golf“ kann viele Motoren, Karosserien und Baujahre meinen. HSN und TSN grenzen das ein. Deshalb fragen wir zuerst nach diesen beiden Nummern und nicht nach dem Modell.",
            ],
            [
                'heading' => 'Wo sie in der Zulassungsbescheinigung Teil I stehen',
                'text' => "Die Zulassungsbescheinigung Teil I ist das Dokument, das früher Fahrzeugschein hieß. Ihre Felder sind nummeriert; du suchst die Felder 2.1 und 2.2.\n\nFeld 2.1 enthält die HSN, also vier Zeichen. Feld 2.2 enthält die TSN und dahinter weitere Zeichen. Für die Fahrzeugauswahl zählen nur die ersten drei Zeichen aus Feld 2.2. Der Rest ist eine Ergänzung, die du bei uns nicht brauchst.\n\nEin Beispiel: Steht in Feld 2.1 „0005“ und beginnt Feld 2.2 mit „582“, dann ist die HSN 0005 und die TSN 582. Die führende Null gehört zur HSN dazu.",
            ],
            [
                'heading' => 'Im alten Fahrzeugschein',
                'text' => "Hast du noch den alten Fahrzeugschein, gibt es dort keine Felder 2.1 und 2.2. Die Nummern stehen unter „zu 2“ und „zu 3“: die HSN bei „zu 2“, die TSN bei „zu 3“. Die Bedeutung ist dieselbe, nur die Beschriftung ist eine andere.\n\nAuch hier gilt: Die HSN hat vier Zeichen, die TSN drei. Stehen hinter der TSN noch weitere Zeichen, lass sie weg.",
            ],
            [
                'heading' => 'So gibst du die Nummern bei uns ein',
                'text' => "In der Fahrzeugauswahl gibt es ein Feld für die HSN und eines für die TSN. Tipp die Zeichen so ein, wie sie im Dokument stehen, mit allen führenden Nullen. Ob du Groß- oder Kleinbuchstaben nimmst, spielt keine Rolle.\n\nDanach zeigen wir dir, welches Fahrzeug zu den Nummern gehört. Prüf kurz, ob das dein Auto ist. Erst dann geht es weiter zu den Felgen, und ab da siehst du nur noch Felgen, für die ein Gutachten genau dieses Fahrzeug nennt.",
            ],
            [
                'heading' => 'Wenn mehrere Fahrzeuge angezeigt werden',
                'text' => "Das kommt vor und ist kein Fehler. Eine Kombination aus HSN und TSN kann mehrere Varianten umfassen, die sich zum Beispiel im Bauzeitraum, in der Höchstgeschwindigkeit oder in der zulässigen Achslast unterscheiden.\n\nFür Felgen und Reifen sind genau diese Unterschiede wichtig. Achslast und Höchstgeschwindigkeit entscheiden mit darüber, welche Tragfähigkeit und welches Geschwindigkeitssymbol die Reifen brauchen und was das Gutachten für dein Fahrzeug freigibt. Deshalb fragen wir in diesem Fall nach, statt zu raten. Wähl die Variante, die zu deinen Papieren passt. Hilfreich sind dabei das Datum der Erstzulassung, die Höchstgeschwindigkeit und die zulässigen Achslasten; alles steht ebenfalls in der Zulassungsbescheinigung.",
            ],
            [
                'heading' => 'Wenn wir dein Fahrzeug nicht finden',
                'text' => "Oft ist es nur ein Tippfehler oder eine verwechselte Zeile. Prüf zuerst, ob du wirklich Feld 2.1 und die ersten drei Zeichen aus Feld 2.2 genommen hast, ob eine führende Null fehlt und ob du den Buchstaben O und die Ziffer 0 auseinandergehalten hast.\n\nFindest du das Fahrzeug trotzdem nicht, kannst du es über Marke und Modell auswählen. Oder du schreibst uns eine E-Mail, am besten mit HSN, TSN und Modell. Die Adresse findest du auf der Kontaktseite. Wir sagen dir dann, was wir zu deinem Fahrzeug haben. Und wenn wir nichts haben, sagen wir dir auch das – lieber eine ehrliche Auskunft als eine Felge, die nicht freigegeben ist.",
            ],
        ],
    ],
    [
        'slug' => 'abe-teilegutachten-ece',
        // Draft: outdated since the Teiletypgenehmigung, and A13 is wrong (see the note above).
        'status' => 'draft',
        'title' => 'ABE, Teilegutachten, ECE – der Unterschied',
        'teaser' => 'Ob eine Felge an dein Auto darf, steht in einem Dokument. Wie sich ABE, Teilegutachten und ECE-Genehmigung unterscheiden.',
        'minutes' => 3,
        'meta_description' => 'ABE, Teilegutachten und ECE-Genehmigung: Was die drei Dokumente für Felgen unterscheidet, was Auflagen und Eintragung bedeuten und was beim Kauf zählt.',
        'blocks' => [
            [
                'heading' => 'Warum es überhaupt ein Dokument braucht',
                'text' => "Eine Felge ist nicht deshalb für dein Auto freigegeben, weil sie sich anschrauben lässt. Lochkreis und Mittenlochbohrung können stimmen, und trotzdem fehlt die Freigabe. Freigegeben ist eine Kombination aus Felge und Fahrzeug dann, wenn ein Dokument sie nennt: mit der Felgenbreite, der Einpresstiefe, den erlaubten Reifengrößen und, falls nötig, mit Auflagen.\n\nFür Felgen gibt es dafür drei Arten von Dokumenten: die ABE, das Teilegutachten und die ECE-Genehmigung. Alle drei beantworten dieselbe Frage. Sie unterscheiden sich darin, wer sie ausstellt und was du nach dem Anschrauben noch tun musst.",
            ],
            [
                'heading' => 'Die ABE – Allgemeine Betriebserlaubnis',
                'text' => "ABE steht für Allgemeine Betriebserlaubnis. Für Felgen wird sie vom Kraftfahrt-Bundesamt erteilt. Sie gilt für eine bestimmte Felge in einer bestimmten Größe und listet die Fahrzeuge auf, für die diese Felge freigegeben ist – jeweils mit den erlaubten Reifengrößen und den Auflagen, die dabei gelten.\n\nIn vielen Fällen reicht es, die ABE im Fahrzeug mitzuführen und die Auflagen einzuhalten. Ob das bei deinem Fahrzeug so ist, steht in der ABE selbst: Sie nennt für jedes Fahrzeug, ob eine Abnahme durch eine Prüfstelle und eine Eintragung in die Fahrzeugpapiere nötig sind. Lies deshalb den Abschnitt zu deinem Fahrzeug, nicht nur das Deckblatt.",
            ],
            [
                'heading' => 'Das Teilegutachten',
                'text' => "Ein Teilegutachten stellt ein Prüflabor oder ein technischer Dienst aus. Es beschreibt, an welchen Fahrzeugen die Felge in welcher Größe verwendet werden kann und unter welchen Auflagen. Anders als die ABE ist es allein noch keine Erlaubnis.\n\nMit einem Teilegutachten muss die Änderung an deinem Fahrzeug von einer Prüfstelle abgenommen werden. Der Prüfer schaut, ob die Kombination dem Gutachten entspricht und die Auflagen erfüllt sind. Danach wird die Änderung in die Fahrzeugpapiere eingetragen. Erst dann ist die Felge an deinem Fahrzeug freigegeben. Vor der Abnahme solltest du mit der Felge nicht auf öffentlichen Straßen unterwegs sein.",
            ],
            [
                'heading' => 'Die ECE-Genehmigung',
                'text' => "Die ECE-Genehmigung ist eine internationale Genehmigung nach den Regelungen der Wirtschaftskommission der Vereinten Nationen für Europa. Eine Felge mit ECE-Genehmigung trägt ein eingeprägtes Prüfzeichen. Auch hier gehört ein Dokument dazu, das die Fahrzeuge und Größen nennt, für die die Genehmigung gilt.\n\nFür dich ist wichtig: Die ECE-Genehmigung wird in Deutschland anerkannt, sie gilt aber nur für die Fahrzeuge und Größen, die im zugehörigen Dokument stehen. Ob eine Eintragung nötig ist, hängt wie bei der ABE von den Angaben und den Auflagen im Dokument ab. Was dort steht, gilt.",
            ],
            [
                'heading' => 'Auflagen und Eintragung',
                'text' => "Auflagen sind Bedingungen, die das Dokument an die Freigabe knüpft. Im Gutachten stehen sie oft als Kürzel; wir zeigen sie dir immer als ganzen Satz. Typische Auflagen betreffen die Reifengröße, den Abstand zur Karosserie oder Bauteile, die angepasst werden müssen. Manche Auflagen sind mit wenig Aufwand erfüllt, andere bedeuten Arbeit in der Werkstatt.\n\nEintragung heißt: Die Änderung wird in die Zulassungsbescheinigung Teil I aufgenommen. Dafür nimmt eine Prüfstelle die Änderung ab und stellt eine Bescheinigung aus, mit der du zur Zulassungsstelle gehst. Ob das bei einer Felge nötig ist, sagt dir das Dokument. Wir weisen dich darauf hin, bevor du die Felge in den Warenkorb legst.",
            ],
            [
                'heading' => 'Was das beim Kauf für dich heißt',
                'text' => "Bei RIMIFY wählst du zuerst dein Fahrzeug. Danach zeigen wir dir nur Felgen, für die ein Dokument die Freigabe für genau dieses Fahrzeug nennt. Welches Dokument das ist, siehst du bei der Felge, ebenso die Auflagen und ob eine Eintragung nötig ist.\n\nUnd wenn wir es nicht sicher wissen, sagen wir dir das. Eine Felge, für die uns kein Dokument zu deinem Fahrzeug vorliegt, zeigen wir dir für dieses Fahrzeug nicht an. Lieber ein Kauf weniger als eine falsche Auskunft.",
            ],
        ],
    ],
    [
        'slug' => 'einpresstiefe-et-erklaert',
        'status' => 'published',
        'title' => 'Einpresstiefe (ET) verständlich erklärt',
        'teaser' => 'Die Einpresstiefe legt fest, wie weit die Felge im Radhaus sitzt. Was der Wert bedeutet, wie du ihn liest und was das Gutachten dazu sagt.',
        'minutes' => 3,
        'meta_description' => 'Einpresstiefe (ET) erklärt: Was der Wert in Millimetern bedeutet, was eine kleinere oder größere ET bewirkt und warum das Gutachten entscheidet.',
        'blocks' => [
            [
                'heading' => 'Was die Einpresstiefe ist',
                'text' => "Die Einpresstiefe, kurz ET, ist ein Maß in Millimetern. Sie beschreibt den Abstand zwischen der Mittelebene der Felge und ihrer Anlagefläche, also der Fläche, mit der die Felge an der Radnabe anliegt.\n\nLiegt die Anlagefläche weiter außen als die Felgenmitte, also näher an der Fahrzeugaußenseite, ist die ET positiv. Bei Pkw ist das der Normalfall. Eine ET von 35 heißt also: Die Anlagefläche liegt 35\u{202F}mm außerhalb der Felgenmitte. Bei ET 0 liegen beide genau übereinander. Eine negative ET, bei der die Anlagefläche innen liegt, kommt bei Pkw selten vor.",
            ],
            [
                'heading' => 'Wo du den Wert findest',
                'text' => "Die ET ist auf der Felge selbst angegeben, meist eingegossen oder eingeprägt auf der Rückseite oder innen an den Speichen. Die Schreibweise ist „ET 35“ oder kurz „ET35“.\n\nIn der vollständigen Größenangabe steht die ET hinter Breite und Durchmesser, zum Beispiel 8,5J × 18 · ET 35. Das bedeutet: 8,5\u{202F}Zoll Maulweite (die Breite zwischen den Felgenhörnern), 18\u{202F}Zoll Durchmesser, Einpresstiefe 35\u{202F}mm. Bei uns steht diese Angabe bei jeder Felge, und im Gutachten steht sie bei jeder freigegebenen Kombination.",
            ],
            [
                'heading' => 'Was eine kleinere oder größere ET bewirkt',
                'text' => "Je kleiner die ET, desto weiter rückt die Felge nach außen. Je größer die ET, desto weiter sitzt sie innen im Radhaus. Ein Beispiel: Tauschst du eine Felge mit ET 45 gegen eine gleich breite Felge mit ET 35, wandert das Rad um 10\u{202F}mm nach außen. Auf beiden Seiten zusammen wird die Spur damit um 20\u{202F}mm breiter.\n\nNach außen wird der Abstand zum Kotflügel kleiner. Beim Einfedern oder beim Lenken kann die Reifenflanke streifen. Nach innen wird der Platz zu Bremse, Federbein und Querlenker knapper. Beides sind keine Kleinigkeiten, und beides hängt am konkreten Fahrzeug. Genau deshalb steht in jedem Gutachten, welche ET für welches Fahrzeug freigegeben ist.",
            ],
            [
                'heading' => 'Breite und ET gehören zusammen',
                'text' => "Die ET allein sagt noch nicht, wo die Felge endet. Eine breitere Felge mit gleicher ET wächst nach beiden Seiten. Ein Zoll mehr Breite entspricht 25,4\u{202F}mm. Bei gleicher ET rückt die Außenkante dann um 12,7\u{202F}mm nach außen und die Innenkante um 12,7\u{202F}mm nach innen.\n\nWer also von 8J auf 9J geht und die ET gleich lässt, hat außen und innen je 12,7\u{202F}mm weniger Platz. Wer die ET dabei um 10\u{202F}mm senkt, hat außen 22,7\u{202F}mm weniger Platz und innen immer noch 2,7\u{202F}mm weniger. Deshalb nennt das Gutachten Breite, ET und Reifengröße immer zusammen – die Werte gehören zueinander und lassen sich nicht einzeln tauschen.",
            ],
            [
                'heading' => 'Was das Gutachten dazu sagt',
                'text' => "Mit Gutachten meinen wir hier jedes dieser Dokumente: ABE, Teiletypgenehmigung, Teilegutachten oder ECE-Genehmigung.\n\nEin Gutachten nennt für jedes Fahrzeug, welche Felgenbreite mit welcher ET und welcher Reifengröße freigegeben ist, manchmal mit Auflagen. Eine ET, die dort nicht steht, ist für dieses Fahrzeug nicht freigegeben, auch wenn sie nur wenige Millimeter abweicht. Einen Toleranzbereich, den du selbst festlegen könntest, gibt es nicht.\n\nDas gilt auch für Distanzscheiben. Sie verändern die wirksame ET, und ob sie zusammen mit einer bestimmten Felge verwendet werden dürfen, muss ebenfalls in einem Dokument stehen. Was das Dokument sagt, gilt – nicht die Erfahrung mit einem ähnlichen Fahrzeug.",
            ],
            [
                'heading' => 'Wie wir die ET bei RIMIFY prüfen',
                'text' => 'Du musst die ET nicht selbst ausrechnen. Sobald du dein Fahrzeug gewählt hast, vergleichen wir jede Felge mit dem Gutachten: Felgenbreite, ET, zulässige Reifengrößen und Auflagen. Was dir angezeigt wird, steht mit genau diesen Werten im Dokument. Willst du eine bestimmte Kombination prüfen, kannst du das jederzeit über den RIMIFY-Check tun.',
            ],
        ],
    ],
];
