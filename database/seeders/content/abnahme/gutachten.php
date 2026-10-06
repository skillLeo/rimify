<?php

declare(strict_types=1);

// GENERATED from the development database by a one-off export (07.10.2026); data only, read by AcceptanceSeeder.
// The two Gutachten as the team entered them from the client's PDFs — ABE 55255 (TÜV Rheinland, 19 Zoll) and the
// Nachtrag 366-0350-21-WIRD/N1 (TÜV AUSTRIA, 18 Zoll) — with every Auflage, and their rows for the three cars the
// acceptance set names (BMW 3er E46 346L, 3er E90 390L, X3 E83 X83) on the four sizes of the BORBET DB8GT2.

return array (
  'documents' => 
  array (
    'abe-55255' => 
    array (
      'row' => 
      array (
        'kind' => 'ABE',
        'kba_number' => '55255',
        'approval_mark' => NULL,
        'report_number' => NULL,
        'annex' => '19',
        'test_report_number' => '55051823',
        'copy_number' => '1',
        'designation_number' => 'KBA-P 00010-96',
        'test_site' => 'Lambsheim',
        'test_date' => '2023-11-29',
        'revision_date' => NULL,
        'valid_from_production' => '2023-02-01',
        'papers_correction_required' => NULL,
        'missing_annexes' => NULL,
        'issuer' => 'TÜV Rheinland Kraftfahrt GmbH',
        'issued_on' => '2023-11-29',
        'revision' => 1,
        'supplement_to_number' => NULL,
        'valid_from' => '2026-10-01',
        'valid_to' => NULL,
        'pdf_sha256' => '0a9010a95341f1630f7a6c74ed7adec978ec76d0c792ccd401dbe2aecae2d3fc',
        'page_count' => 13,
      ),
      'pdf' => 
      array (
        'source' => 'gutachten/01m3n7a83792dj1qxfv4pj4t3p.pdf',
        'sha256' => '0a9010a95341f1630f7a6c74ed7adec978ec76d0c792ccd401dbe2aecae2d3fc',
      ),
      'conditions' => 
      array (
        0 => 
        array (
          'code' => '140',
          'kind' => 'reifen_tragfaehigkeit',
          'level' => 'auflage',
          'text_de' => 'Das Sonderrad (gepr. Radlast) ist in Verbindung mit dieser Reifengröße nur zulässig bis zu einer zul. Achslast von 1400 kg. Eine erhöhte zulässige Achslast bei Anhängerbetrieb (siehe Ziff. 33 zu Ziff. 16 h bzw. Feld 22 zu Feld 7.1-8.3 in den Fahrzeugpapieren) ist zu beachten.',
          'source_page' => 7,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => 1400,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        1 => 
        array (
          'code' => 'A01',
          'kind' => 'abnahme',
          'level' => 'auflage',
          'text_de' => 'Nach Durchführung der Technischen Änderung ist das Fahrzeug unter Vorlage der vorliegenden ABE unverzüglich einem amtlich anerkannten Sachverständigen oder Prüfer für den Kraftfahrzeugverkehr oder einem Prüfingenieur einer Überwachungsorganisation nach Nummer 4 der Anlage VIIIb zur StVZO zur Durchführung und Bestätigung der in der ABE vorgeschriebenen Änderungsabnahme vorzuführen.',
          'source_page' => 7,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        2 => 
        array (
          'code' => 'A10',
          'kind' => 'verbot',
          'level' => 'hinweis',
          'text_de' => 'Es dürfen nur feingliedrige bzw. die lt. Betriebsanleitung/Handbuch vorgeschriebenen Schneeketten an der Hinterachse verwendet werden.',
          'source_page' => 7,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        3 => 
        array (
          'code' => 'A12',
          'kind' => 'verbot',
          'level' => 'hinweis',
          'text_de' => 'Die Verwendung von Schneeketten ist nicht zulässig.',
          'source_page' => 7,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        4 => 
        array (
          'code' => 'A14',
          'kind' => 'hinweis',
          'level' => 'hinweis',
          'text_de' => 'Zum Auswuchten der Räder dürfen an der Felgenaußenseite nur Klebegewichte unterhalb der Felgenschulter oder des Tiefbettes angebracht werden. Bei Anbringung der Klebegewichte im Felgenbett ist auf einen Mindestabstand von 2 mm zum Bremssattel zu achten.',
          'source_page' => 7,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        5 => 
        array (
          'code' => 'A18',
          'kind' => 'hinweis',
          'level' => 'hinweis',
          'text_de' => 'Es sind nur schlauchlose Reifen zulässig. Werden keine Ventile mit TPMS-Sensoren verwendet, sind ausschließlich Metallschraubventile mit Befestigung von außen, die den Normen DIN, E.T.R.T.O oder Tire and Rim entsprechen, zulässig. Werden Ventile mit TPMS-Sensoren verwendet, so sind die Hinweise und Vorgaben der Hersteller zu beachten. Die Ventile und Sensoren müssen für den vorgeschriebenen Luftdruck und die bauartbedingte Höchstgeschwindigkeit geeignet sein. Die Ventile dürfen nicht über den Felgenrand hinausragen.',
          'source_page' => 7,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        6 => 
        array (
          'code' => 'A32',
          'kind' => 'verbot',
          'level' => 'hinweis',
          'text_de' => 'Es dürfen nur feingliedrige Schneeketten, die nicht mehr als 12 mm einschließlich Kettenschloss auftragen, an der Hinterachse verwendet werden.',
          'source_page' => 7,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        7 => 
        array (
          'code' => 'A56',
          'kind' => 'antrieb',
          'level' => 'auflage',
          'text_de' => 'Die Rad-/Reifen-Kombination ist nur zulässig an Fahrzeugausführungen mit Allradantrieb (z.B. 4WD, Quattro, Syncro, 4-Matic, 4x4, o.ä.)',
          'source_page' => 7,
          'body_forms' => NULL,
          'drive' => '{"mode": "only", "drive": "Allrad"}',
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        8 => 
        array (
          'code' => 'A57',
          'kind' => 'hinweis',
          'level' => 'hinweis',
          'text_de' => 'Diese Rad-/Reifen-Kombination(en) ist (sind) zulässig an Fahrzeugausführungen mit Front bzw. Heck-Antrieb und Allradantrieb (z.B. 2WD, 4WD, Quattro, Syncro, 4-Matic, 4x4, o.ä.)',
          'source_page' => 7,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        9 => 
        array (
          'code' => 'A58',
          'kind' => 'antrieb',
          'level' => 'auflage',
          'text_de' => 'Rad-Reifen-Kombination(en) nicht zulässig an Fahrzeugen mit Allradantrieb.',
          'source_page' => 7,
          'body_forms' => NULL,
          'drive' => '{"mode": "not", "drive": "Allrad"}',
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        10 => 
        array (
          'code' => 'B90',
          'kind' => 'verbot',
          'level' => 'auflage',
          'text_de' => 'Räder nicht zulässig an Fahrzeugausführungen mit Bremsscheibendurchmesser 356 mm an Achse 1.',
          'source_page' => 7,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        11 => 
        array (
          'code' => 'Car',
          'kind' => 'karosserieform',
          'level' => 'auflage',
          'text_de' => 'Die Rad-/Reifen-Kombination ist zulässig für Fahrzeugausführungen der Karosserieform Kombilimousine (Avant, Break, Caravan, Grandtour, Kombi, Sportswagon, T-Modell, Touring, Tourer, Turnier, Variant, …).',
          'source_page' => 7,
          'body_forms' => '["Kombi"]',
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        12 => 
        array (
          'code' => 'Cbo',
          'kind' => 'karosserieform',
          'level' => 'auflage',
          'text_de' => 'Die Rad-/Reifen-Kombination ist zulässig für Fahrzeugausführungen der Karosserieform Cabrio-Limousine, Roadster.',
          'source_page' => 7,
          'body_forms' => '["Cabrio", "Roadster"]',
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        13 => 
        array (
          'code' => 'Cpe',
          'kind' => 'karosserieform',
          'level' => 'auflage',
          'text_de' => 'Die Rad-/Reifen-Kombination ist zulässig für Fahrzeugausführungen der Karosserieform Coupé.',
          'source_page' => 7,
          'body_forms' => '["Coupe"]',
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        14 => 
        array (
          'code' => 'F40',
          'kind' => 'verbot',
          'level' => 'auflage',
          'text_de' => 'Rad/Reifenkombination nur zulässig an Fahrzeugausführungen mit Luftfederung an Achse 2.',
          'source_page' => 7,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        15 => 
        array (
          'code' => 'Flh',
          'kind' => 'karosserieform',
          'level' => 'auflage',
          'text_de' => 'Die Rad-/Reifen-Kombination ist zulässig für Fahrzeugausführungen der Karosserieform Schräghecklimousine (Fließheck, 3-türig und 5-türig).',
          'source_page' => 7,
          'body_forms' => '["Schrägheck"]',
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        16 => 
        array (
          'code' => 'G01',
          'kind' => 'tacho',
          'level' => 'auflage',
          'text_de' => 'Es ist der Nachweis zu erbringen, dass die Anzeige des Geschwindigkeitsmessers und Wegstreckenzählers innerhalb der Toleranzen (75/443/EWG, ECE-R39, § 57 StVZO) liegt. Wird die Anzeige angeglichen, sind die in den Fahrzeugpapieren (u. a. Fahrzeugschein, Zulassungsbescheinigung I oder COC-Papier) eingetragenen Reifengrößen zu überprüfen.',
          'source_page' => 8,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        17 => 
        array (
          'code' => 'G73',
          'kind' => 'tacho',
          'level' => 'auflage',
          'text_de' => 'Ist 18 Zoll keine Serien-Bereifung (u. a. Fahrzeugschein, Zulassungsbescheinigung I, COC-Papier oder Bedienungsanleitung), so ist der Nachweis zu erbringen, dass die Anzeige des Geschwindigkeitsmessers und Wegstreckenzählers innerhalb der Toleranzen (75/443/EWG, ECE-R39, § 57 StVZO) liegt. Wird die Anzeige angeglichen, sind die in den Fahrzeugpapieren (u. a. Fahrzeugschein, Zulassungsbescheinigung I oder COC-Papier) eingetragenen Reifengrößen zu überprüfen.',
          'source_page' => 8,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        18 => 
        array (
          'code' => 'K14',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'An der Vorderachse ist durch Nacharbeit der Frontschürze am Übergang zum Kotflügel eine ausreichende Freigängigkeit der Rad-/ Reifenkombination herzustellen.',
          'source_page' => 8,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        19 => 
        array (
          'code' => 'K1a',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Die Radabdeckung an Achse 1 ist durch Ausstellen der Frontschürze und des Kotflügels oder durch Anbau von dauerhaft befestigten Karosserieteilen im Bereich 0° bis 30° vor Radmitte herzustellen. Die gesamte Breite der Rad-/Reifenkombination muss, unter Beachtung des maximal möglichen Betriebsmaßes des Reifens (1,04-fache der Nennbreite des Reifens), in dem oben genannten Bereich abgedeckt sein.',
          'source_page' => 8,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        20 => 
        array (
          'code' => 'K1b',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Die Radabdeckung an Achse 1 ist durch Ausstellen des Kotflügels oder durch Anbau von dauerhaft befestigten Karosserieteilen im Bereich 0° bis 50° hinter Radmitte herzustellen. Die gesamte Breite der Rad-/Reifenkombination muss, unter Beachtung des maximal möglichen Betriebsmaßes des Reifens (1,04-fache der Nennbreite des Reifens), in dem oben genannten Bereich abgedeckt sein.',
          'source_page' => 8,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        21 => 
        array (
          'code' => 'K1c',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Die Radabdeckung an Achse 1 ist durch Ausstellen der Frontschürze und des Kotflügels oder durch Anbau von dauerhaft befestigten Karosserieteilen im Bereich 30° vor bis 50° hinter Radmitte herzustellen. Die gesamte Breite der Rad-/Reifenkombination muss, unter Beachtung des maximal möglichen Betriebsmaßes des Reifens (1,04-fache der Nennbreite des Reifens), in dem oben genannten Bereich abgedeckt sein.',
          'source_page' => 8,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        22 => 
        array (
          'code' => 'K2a',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Die Radabdeckung an Achse 2 ist durch Ausstellen des Kotflügels oder durch Anbau von dauerhaft befestigten Karosserieteilen im Bereich 0° bis 30° vor Radmitte herzustellen. Die gesamte Breite der Rad-/Reifenkombination muss, unter Beachtung des maximal möglichen Betriebsmaßes des Reifens (1,04-fache der Nennbreite des Reifens), in dem oben genannten Bereich abgedeckt sein.',
          'source_page' => 8,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        23 => 
        array (
          'code' => 'K2b',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Die Radabdeckung an Achse 2 ist durch Ausstellen der Heckschürze und des Kotflügels oder durch Anbau von dauerhaft befestigten Karosserieteilen im Bereich 0° bis 50° hinter Radmitte herzustellen. Die gesamte Breite der Rad-/Reifenkombination muss, unter Beachtung des maximal möglichen Betriebsmaßes des Reifens (1,04-fache der Nennbreite des Reifens), in dem oben genannten Bereich abgedeckt sein.',
          'source_page' => 8,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        24 => 
        array (
          'code' => 'K2c',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Die Radabdeckung an Achse 2 ist durch Ausstellen der Heckschürze und des Kotflügels oder durch Anbau von dauerhaft befestigten Karosserieteilen im Bereich 30° vor bis 50° hinter Radmitte herzustellen. Die gesamte Breite der Rad-/Reifenkombination muss, unter Beachtung des maximal möglichen Betriebsmaßes des Reifens (1,04-fache der Nennbreite des Reifens), in dem oben genannten Bereich abgedeckt sein.',
          'source_page' => 8,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        25 => 
        array (
          'code' => 'K41',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'An Achse 1 ist durch Nacharbeiten der Radhausausschnittkanten eine ausreichende Freigängigkeit der Rad-Reifenkombination herzustellen.',
          'source_page' => 8,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        26 => 
        array (
          'code' => 'K42',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'An Achse 2 ist durch Nacharbeiten der Radhausausschnittkanten eine ausreichende Freigängigkeit der Rad-Reifenkombination herzustellen.',
          'source_page' => 8,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        27 => 
        array (
          'code' => 'K43',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'An Achse 1 ist durch Aufweiten der Kotflügel bzw. inneren Seitenteile eine ausreichende Freigängigkeit der Rad-Reifen-Kombination herzustellen.',
          'source_page' => 9,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        28 => 
        array (
          'code' => 'K44',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'An Achse 2 ist durch Aufweiten der Kotflügel bzw. inneren Seitenteile eine ausreichende Freigängigkeit der Rad-Reifenkombination herzustellen.',
          'source_page' => 9,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        29 => 
        array (
          'code' => 'K45',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'An Achse 1 ist durch Nacharbeiten der Radhausinnenkotflügel, Kunststoffeinsätze bzw. deren Befestigungsteile eine ausreichende Freigängigkeit der Rad-Reifenkombination herzustellen. Ein evtl. vorhandener Spritzschutz für den Ansaugweg des Luftfilters muss erhalten bleiben.',
          'source_page' => 9,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        30 => 
        array (
          'code' => 'K46',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'An Achse 2 ist durch Nacharbeiten der Radhausinnenkotflügel, Kunststoffeinsätze bzw. deren Befestigungsteile eine ausreichende Freigängigkeit der Rad-Reifenkombination herzustellen.',
          'source_page' => 9,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        31 => 
        array (
          'code' => 'K56',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Durch Nacharbeit der Heckschürze am Übergang zum Radhausausschnitt ist eine ausreichende Freigängigkeit der Rad-Reifenkombination herzustellen.',
          'source_page' => 9,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        32 => 
        array (
          'code' => 'K5d',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'An Achse 1 sind die Radhausausschnittkanten im Bereich 200 mm vor bis 200 mm hinter Radmitte vollständig umzulegen.',
          'source_page' => 9,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        33 => 
        array (
          'code' => 'K5i',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'An Achse 1 sind die in das Radhaus ragenden Kanten der Frontschürze auf einer Länge von 100 mm bis auf die Innenkontur des umgelegten Radlaufes folgend zu kürzen.',
          'source_page' => 9,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        34 => 
        array (
          'code' => 'K6a',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'An Achse 2 sind die Radhausausschnittkanten im Bereich 100 mm vor bis 100 mm hinter Radmitte vollständig umzulegen.',
          'source_page' => 9,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        35 => 
        array (
          'code' => 'K6g',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'An Achse 2 ist die Befestigungslasche der Heckschürze am Übergang zur Radhausausschnittkante um 5 mm zu kürzen oder um das gleiche Maß nach hinten/oben zu biegen.',
          'source_page' => 9,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        36 => 
        array (
          'code' => 'K6i',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'An Achse 2 sind die in das Radhaus ragenden Kanten der Heckschürze auf einer Länge von 100 mm bis auf die Innenkontur des umgelegten Radlaufes folgend zu kürzen.',
          'source_page' => 9,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        37 => 
        array (
          'code' => 'K6v',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'An Achse 2 sind die Kunststoff-Radhausausschnittkanten im Bereich 100 mm vor bis 100 mm hinter Radmitte um 5 mm auszuschneiden bzw. zu kürzen.',
          'source_page' => 9,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        38 => 
        array (
          'code' => 'K71',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'An der Vorderachse ist die Frontschürze am Übergang zum Radhausauschnitt nachzuarbeiten.',
          'source_page' => 9,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        39 => 
        array (
          'code' => 'K7a',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'An Achse 1 sind die Radhausausschnittkanten im Bereich 100 mm vor bis 100 mm hinter Radmitte um 5 mm aufzuweiten.',
          'source_page' => 9,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        40 => 
        array (
          'code' => 'K8e',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'An Achse 2 sind die Radhausausschnittkanten im Bereich 200 mm vor bis 200 mm hinter Radmitte um 5 mm aufzuweiten.',
          'source_page' => 9,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        41 => 
        array (
          'code' => 'K8m',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'An Achse 2 sind die Radhausausschnittkanten im Bereich 300 mm vor bis 200 mm hinter Radmitte um 10 mm aufzuweiten.',
          'source_page' => 9,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        42 => 
        array (
          'code' => 'KMV',
          'kind' => 'hinweis',
          'level' => 'hinweis',
          'text_de' => 'Betrifft nur Fahrzeugvarianten mit serienmäßigen Kunststoffverbreiterungen bzw. mit zusätzlichen Kotflügelverbreiterungen (Radlaufleisten).',
          'source_page' => 9,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        43 => 
        array (
          'code' => 'L02',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Durch Begrenzung des Lenkeinschlages ist eine ausreichende Freigängigkeit der Rad- / Reifenkombination herzustellen.',
          'source_page' => 9,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        44 => 
        array (
          'code' => 'L04',
          'kind' => 'verbot',
          'level' => 'auflage',
          'text_de' => 'Die Verwendung dieser Rad-/Reifen-Kombination(en) ist(sind) nur zulässig an Fahrzeugen mit Allradlenkung (4WS).',
          'source_page' => 9,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        45 => 
        array (
          'code' => 'L05',
          'kind' => 'verbot',
          'level' => 'auflage',
          'text_de' => 'Die Verwendung dieser Rad-/Reifen-Kombination(en) ist(sind) nicht zulässig an Fahrzeugen mit Allradlenkung (4WS).',
          'source_page' => 10,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        46 => 
        array (
          'code' => 'L06',
          'kind' => 'hinweis',
          'level' => 'hinweis',
          'text_de' => 'Diese Rad-/Reifen-Kombination(en) ist (sind) zulässig an Fahrzeugausführungen mit und ohne Allradlenkung (4WS).',
          'source_page' => 10,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        47 => 
        array (
          'code' => 'Lim',
          'kind' => 'karosserieform',
          'level' => 'auflage',
          'text_de' => 'Die Rad-/Reifen-Kombination ist zulässig für Fahrzeugausführungen der Karosserieform Limousine.',
          'source_page' => 10,
          'body_forms' => '["Limousine"]',
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        48 => 
        array (
          'code' => 'R02',
          'kind' => 'reifen_achse',
          'level' => 'auflage',
          'text_de' => 'Diese Reifengröße ist nur an Achse 1 zulässig.',
          'source_page' => 10,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => 'FRONT',
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        49 => 
        array (
          'code' => 'R03',
          'kind' => 'reifen_achse',
          'level' => 'auflage',
          'text_de' => 'Diese Reifengröße ist nur an Achse 2 zulässig.',
          'source_page' => 10,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => 'REAR',
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        50 => 
        array (
          'code' => 'R37',
          'kind' => 'reifen_kombination',
          'level' => 'hinweis',
          'text_de' => 'Diese Reifengröße ist nicht geprüft für Fahrzeuge, die serienmäßig ausschließlich mit größeren und/oder breiteren Reifengrößen (u. a. Fahrzeugschein, Zulassungsbescheinigung I, COC-Papier oder Bedienungsanleitung) ausgerüstet sind.',
          'source_page' => 10,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        51 => 
        array (
          'code' => 'R70',
          'kind' => 'reifen_kombination',
          'level' => 'hinweis',
          'text_de' => 'Für das Fahrzeug ist die Reifengröße auf der im Gutachten genannten Radgröße durch den Reifenhersteller zu bestätigen. Diese Bestätigung ist vom Führer des Fahrzeugs mitzuführen.',
          'source_page' => 10,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        52 => 
        array (
          'code' => 'S01',
          'kind' => 'befestigung',
          'level' => 'hinweis',
          'text_de' => 'Zur Befestigung der Räder dürfen nur die mitgelieferten Befestigungsmittel Nr. S01 (siehe Seite 1) verwendet werden.',
          'source_page' => 10,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        53 => 
        array (
          'code' => 'S02',
          'kind' => 'befestigung',
          'level' => 'hinweis',
          'text_de' => 'Zur Befestigung der Räder dürfen nur die mitgelieferten Befestigungsmittel Nr. S02 (siehe Seite 1) verwendet werden.',
          'source_page' => 10,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        54 => 
        array (
          'code' => 'S03',
          'kind' => 'befestigung',
          'level' => 'hinweis',
          'text_de' => 'Zur Befestigung der Räder dürfen nur die mitgelieferten Befestigungsmittel Nr. S03 (siehe Seite 1) verwendet werden.',
          'source_page' => 10,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        55 => 
        array (
          'code' => 'S04',
          'kind' => 'befestigung',
          'level' => 'hinweis',
          'text_de' => 'Zur Befestigung der Räder dürfen nur die mitgelieferten Befestigungsmittel Nr. S04 (siehe Seite 1) verwendet werden.',
          'source_page' => 10,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        56 => 
        array (
          'code' => 'S05',
          'kind' => 'befestigung',
          'level' => 'hinweis',
          'text_de' => 'Zur Befestigung der Räder dürfen nur die mitgelieferten Befestigungsmittel Nr. S05 (siehe Seite 1) verwendet werden.',
          'source_page' => 10,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        57 => 
        array (
          'code' => 'S06',
          'kind' => 'befestigung',
          'level' => 'hinweis',
          'text_de' => 'Zur Befestigung der Räder dürfen nur die mitgelieferten Befestigungsmittel Nr. S06 (siehe Seite 1) verwendet werden.',
          'source_page' => 10,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        58 => 
        array (
          'code' => 'T00',
          'kind' => 'reifen_tragfaehigkeit',
          'level' => 'auflage',
          'text_de' => 'Reifen (LI 100) nur zulässig für Fahrzeuge mit zul. Achslasten bis 1600 kg (Fzg.-Schein, Ziff. 16 bzw. Zulassungsbescheinigung Feld 8). Abschläge der Tragfähigkeit aufgrund der Bauartbedingten Höchstgeschwindigkeit (Fzg.-Schein, Ziff. 6 bzw. Zulassungsbescheinigung Feld T) sind zu berücksichtigen.',
          'source_page' => 10,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => 1600,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        59 => 
        array (
          'code' => 'T84',
          'kind' => 'reifen_tragfaehigkeit',
          'level' => 'auflage',
          'text_de' => 'Reifen (LI 84) nur zulässig für Fahrzeuge mit zul. Achslasten bis 1000 kg (Fzg.-Schein, Ziff. 16 bzw. Zulassungsbescheinigung Feld 8). Abschläge der Tragfähigkeit aufgrund der Bauartbedingten Höchstgeschwindigkeit (Fzg.-Schein, Ziff. 6 bzw. Zulassungsbescheinigung Feld T) sind zu berücksichtigen.',
          'source_page' => 10,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => 1000,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        60 => 
        array (
          'code' => 'T85',
          'kind' => 'reifen_tragfaehigkeit',
          'level' => 'auflage',
          'text_de' => 'Reifen (LI 85) nur zulässig für Fahrzeuge mit zul. Achslasten bis 1030 kg (Fzg.-Schein, Ziff. 16 bzw. Zulassungsbescheinigung Feld 8). Abschläge der Tragfähigkeit aufgrund der Bauartbedingten Höchstgeschwindigkeit (Fzg.-Schein, Ziff. 6 bzw. Zulassungsbescheinigung Feld T) sind zu berücksichtigen.',
          'source_page' => 10,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => 1030,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        61 => 
        array (
          'code' => 'T87',
          'kind' => 'reifen_tragfaehigkeit',
          'level' => 'auflage',
          'text_de' => 'Reifen (LI 87) nur zulässig für Fahrzeuge mit zul. Achslasten bis 1090 kg (Fzg.-Schein, Ziff. 16 bzw. Zulassungsbescheinigung Feld 8). Abschläge der Tragfähigkeit aufgrund der Bauartbedingten Höchstgeschwindigkeit (Fzg.-Schein, Ziff. 6 bzw. Zulassungsbescheinigung Feld T) sind zu berücksichtigen.',
          'source_page' => 11,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => 1090,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        62 => 
        array (
          'code' => 'T88',
          'kind' => 'reifen_tragfaehigkeit',
          'level' => 'auflage',
          'text_de' => 'Reifen (LI 88) nur zulässig für Fahrzeuge mit zul. Achslasten bis 1120 kg (Fzg.-Schein, Ziff. 16 bzw. Zulassungsbescheinigung Feld 8). Abschläge der Tragfähigkeit aufgrund der Bauartbedingten Höchstgeschwindigkeit (Fzg.-Schein, Ziff. 6 bzw. Zulassungsbescheinigung Feld T) sind zu berücksichtigen.',
          'source_page' => 11,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => 1120,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        63 => 
        array (
          'code' => 'T89',
          'kind' => 'reifen_tragfaehigkeit',
          'level' => 'auflage',
          'text_de' => 'Reifen (LI 89) nur zulässig für Fahrzeuge mit zul. Achslasten bis 1160 kg (Fzg.-Schein, Ziff. 16 bzw. Zulassungsbescheinigung Feld 8). Abschläge der Tragfähigkeit aufgrund der Bauartbedingten Höchstgeschwindigkeit (Fzg.-Schein, Ziff. 6 bzw. Zulassungsbescheinigung Feld T) sind zu berücksichtigen.',
          'source_page' => 11,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => 1160,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        64 => 
        array (
          'code' => 'T91',
          'kind' => 'reifen_tragfaehigkeit',
          'level' => 'auflage',
          'text_de' => 'Reifen (LI 91) nur zulässig für Fahrzeuge mit zul. Achslasten bis 1230 kg (Fzg.-Schein, Ziff. 16 bzw. Zulassungsbescheinigung Feld 8). Abschläge der Tragfähigkeit aufgrund der Bauartbedingten Höchstgeschwindigkeit (Fzg.-Schein, Ziff. 6 bzw. Zulassungsbescheinigung Feld T) sind zu berücksichtigen.',
          'source_page' => 11,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => 1230,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        65 => 
        array (
          'code' => 'T92',
          'kind' => 'reifen_tragfaehigkeit',
          'level' => 'auflage',
          'text_de' => 'Reifen (LI 92) nur zulässig für Fahrzeuge mit zul. Achslasten bis 1260 kg (Fzg.-Schein, Ziff. 16 bzw. Zulassungsbescheinigung Feld 8). Abschläge der Tragfähigkeit aufgrund der Bauartbedingten Höchstgeschwindigkeit (Fzg.-Schein, Ziff. 6 bzw. Zulassungsbescheinigung Feld T) sind zu berücksichtigen.',
          'source_page' => 11,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => 1260,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        66 => 
        array (
          'code' => 'T93',
          'kind' => 'reifen_tragfaehigkeit',
          'level' => 'auflage',
          'text_de' => 'Reifen (LI 93) nur zulässig für Fahrzeuge mit zul. Achslasten bis 1300 kg (Fzg.-Schein, Ziff. 16 bzw. Zulassungsbescheinigung Feld 8). Abschläge der Tragfähigkeit aufgrund der Bauartbedingten Höchstgeschwindigkeit (Fzg.-Schein, Ziff. 6 bzw. Zulassungsbescheinigung Feld T) sind zu berücksichtigen.',
          'source_page' => 11,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => 1300,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        67 => 
        array (
          'code' => 'T94',
          'kind' => 'reifen_tragfaehigkeit',
          'level' => 'auflage',
          'text_de' => 'Reifen (LI 94) nur zulässig für Fahrzeuge mit zul. Achslasten bis 1340 kg (Fzg.-Schein, Ziff. 16 bzw. Zulassungsbescheinigung Feld 8). Abschläge der Tragfähigkeit aufgrund der Bauartbedingten Höchstgeschwindigkeit (Fzg.-Schein, Ziff. 6 bzw. Zulassungsbescheinigung Feld T) sind zu berücksichtigen.',
          'source_page' => 11,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => 1340,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        68 => 
        array (
          'code' => 'T95',
          'kind' => 'reifen_tragfaehigkeit',
          'level' => 'auflage',
          'text_de' => 'Reifen (LI 95) nur zulässig für Fahrzeuge mit zul. Achslasten bis 1380 kg (Fzg.-Schein, Ziff. 16 bzw. Zulassungsbescheinigung Feld 8). Abschläge der Tragfähigkeit aufgrund der Bauartbedingten Höchstgeschwindigkeit (Fzg.-Schein, Ziff. 6 bzw. Zulassungsbescheinigung Feld T) sind zu berücksichtigen.',
          'source_page' => 11,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => 1380,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        69 => 
        array (
          'code' => 'T96',
          'kind' => 'reifen_tragfaehigkeit',
          'level' => 'auflage',
          'text_de' => 'Reifen (LI 96) nur zulässig für Fahrzeuge mit zul. Achslasten bis 1420 kg (Fzg.-Schein, Ziff. 16 bzw. Zulassungsbescheinigung Feld 8). Abschläge der Tragfähigkeit aufgrund der Bauartbedingten Höchstgeschwindigkeit (Fzg.-Schein, Ziff. 6 bzw. Zulassungsbescheinigung Feld T) sind zu berücksichtigen.',
          'source_page' => 11,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => 1420,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        70 => 
        array (
          'code' => 'T98',
          'kind' => 'reifen_tragfaehigkeit',
          'level' => 'auflage',
          'text_de' => 'Reifen (LI 98) nur zulässig für Fahrzeuge mit zul. Achslasten bis 1500 kg (Fzg.-Schein, Ziff. 16 bzw. Zulassungsbescheinigung Feld 8). Abschläge der Tragfähigkeit aufgrund der Bauartbedingten Höchstgeschwindigkeit (Fzg.-Schein, Ziff. 6 bzw. Zulassungsbescheinigung Feld T) sind zu berücksichtigen.',
          'source_page' => 11,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => 1500,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        71 => 
        array (
          'code' => 'T99',
          'kind' => 'reifen_tragfaehigkeit',
          'level' => 'auflage',
          'text_de' => 'Reifen (LI 99) nur zulässig für Fahrzeuge mit zul. Achslasten bis 1550 kg (Fzg.-Schein, Ziff. 16 bzw. Zulassungsbescheinigung Feld 8). Abschläge der Tragfähigkeit aufgrund der Bauartbedingten Höchstgeschwindigkeit (Fzg.-Schein, Ziff. 6 bzw. Zulassungsbescheinigung Feld T) sind zu berücksichtigen.',
          'source_page' => 11,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => 1550,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        72 => 
        array (
          'code' => 'V19',
          'kind' => 'reifen_kombination',
          'level' => 'hinweis',
          'text_de' => 'Bei Verwendung verschiedener Reifengrößen an Vorder- und Hinterachse sind folgende Reifenkombinationen, sofern die Reifengrößen in der Spalte "Reifen" aufgeführt sind, möglich: (Vorderachse – Hinterachse) Nr. 1: 215/35R19 – 245/30R19, 255/30R19; Nr. 2: 225/35R19 – 245/30R19, 255/30R19, 265/30R19, 305/25R19; Nr. 3: 225/40R19 – 245/35R19, 255/35R19; Nr. 4: 225/45R19 – 245/40R19, 255/40R19; Nr. 5: 225/55R19 – 275/45R19; Nr. 6: 235/35R19 – 255/30R19, 265/30R19, 275/30R19, 315/25R19; Nr. 7: 235/40R19 – 265/35R19, 275/35R19; Nr. 8: 235/45R19 – 255/40R19, 265/40R19; Nr. 9: 235/50R19 – 255/45R19, 265/45R19; Nr. 10: 235/55R19 – 255/50R19, 285/45R19, 295/45R19; Nr. 11: 245/30R19 – 305/25R19; Nr. 12: 245/35R19 – 255/35R19, 275/30R19, 285/30R19; Nr. 13: 245/40R19 – 275/35R19, 285/35R19; Nr. 14: 245/45R19 – 275/40R19; Nr. 15: 245/50R19 – 275/45R19; Nr. 16: 255/30R19 – 305/25R19, 315/25R19; Nr. 17: 255/35R19 – 285/30R19, 295/30R19, 305/30R19; Nr. 18: 255/40R19 – 285/35R19, 295/35R19; Nr. 19: 255/45R19 – 285/40R19; Nr. 20: 255/50R19 – 275/45R19, 285/45R19, 295/45R19; Nr. 21: 255/55R19 – 275/50R19; Nr. 22: 265/30R19 – 305/25R19, 315/25R19; Nr. 23: 265/35R19 – 295/30R19, 305/30R19; Nr. 24: 265/40R19 – 295/35R19; Nr. 25: 265/45R19 – 295/40R19; Nr. 26: 265/50R19 – 295/45R19; Nr. 27: 275/30R19 – 315/25R19. Es sind nur Reifen eines Herstellers und achsweise eines Profiltyps zulässig, für die der Reifen- oder Fahrzeughersteller die Eignung für das jeweilige Fahrzeug bestätigt. Diese Bestätigung ist vom Führer des Fahrzeugs mitzuführen.',
          'source_page' => 12,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        73 => 
        array (
          'code' => 'Y84',
          'kind' => 'karosserieform',
          'level' => 'auflage',
          'text_de' => 'Die Rad-/Reifen-Kombination ist zulässig für 3-türige Fahrzeugausführungen der Karosserieform Fließheck.',
          'source_page' => 12,
          'body_forms' => '["Schrägheck"]',
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        74 => 
        array (
          'code' => 'Y85',
          'kind' => 'karosserieform',
          'level' => 'auflage',
          'text_de' => 'Die Rad-/Reifen-Kombination ist zulässig für 5-türige Fahrzeugausführungen der Karosserieform Schräghecklimousine (Fließheck).',
          'source_page' => 12,
          'body_forms' => '["Schrägheck"]',
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        75 => 
        array (
          'code' => 'Z3N',
          'kind' => 'verbot',
          'level' => 'auflage',
          'text_de' => 'Diese Rad- / Reifenkombination ist nur zulässig für Fahrzeuge ab einschließlich EG-Typgenehmigungs-Nr. e1*93/81*0029*08 (Facelift 1999, mit breiter Karosserie an Achse 2).',
          'source_page' => 12,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
      ),
      'fasteners' => 
      array (
        0 => 
        array (
          'number' => 'S01',
          'thread' => 'Schraube M12x1,5',
          'seat' => 'Kegel 60°',
          'torque_nm' => 110,
          'shaft_length_mm' => 30,
          'article_number' => '5248',
          'vehicle_types' => NULL,
          'source_page' => 1,
        ),
        1 => 
        array (
          'number' => 'S02',
          'thread' => 'Schraube M14x1,25',
          'seat' => 'Kegel 60°',
          'torque_nm' => 130,
          'shaft_length_mm' => 30,
          'article_number' => '5276',
          'vehicle_types' => NULL,
          'source_page' => 1,
        ),
        2 => 
        array (
          'number' => 'S03',
          'thread' => 'Schraube M14x1,5',
          'seat' => 'Kegel 60°',
          'torque_nm' => 140,
          'shaft_length_mm' => 30,
          'article_number' => '5284',
          'vehicle_types' => NULL,
          'source_page' => 1,
        ),
        3 => 
        array (
          'number' => 'S04',
          'thread' => 'Schraube M14x1,25',
          'seat' => 'Kegel 60°',
          'torque_nm' => 140,
          'shaft_length_mm' => 30,
          'article_number' => '5276',
          'vehicle_types' => NULL,
          'source_page' => 1,
        ),
        4 => 
        array (
          'number' => 'S05',
          'thread' => 'Schraube M12x1,5',
          'seat' => 'Kegel 60°',
          'torque_nm' => 120,
          'shaft_length_mm' => 30,
          'article_number' => '5248',
          'vehicle_types' => NULL,
          'source_page' => 1,
        ),
        5 => 
        array (
          'number' => 'S06',
          'thread' => 'Schraube M14x1,25',
          'seat' => 'Kegel 60°',
          'torque_nm' => 130,
          'shaft_length_mm' => 35,
          'article_number' => '5275',
          'vehicle_types' => NULL,
          'source_page' => 1,
        ),
      ),
      'notices' => 
      array (
        0 => 
        array (
          'text_de' => 'Im Fahrzeug vorgeschriebene Fahrzeugsysteme, z. B. Reifendruckkontrollsysteme, müssen nach Anbau der Räder funktionsfähig bleiben.',
          'source_page' => 6,
          'sort_order' => 10,
        ),
        1 => 
        array (
          'text_de' => 'Wird eine in diesem Gutachten aufgeführte Reifengröße verwendet, die nicht bereits in den Fahrzeugpapieren (u. a. Fahrzeugschein, Zulassungsbescheinigung I oder COC-Papier) genannt ist, so sind die Angaben über die Reifengröße in den Fahrzeugpapieren (Fahrzeugschein bzw. -brief, Zulassungsbescheinigung I) durch die Zulassungsstelle berichtigen zu lassen. Diese Berichtigung ist dann nicht erforderlich, wenn die ABE des Sonderrades eine Freistellung von der Pflicht zur Berichtigung der Fahrzeugpapiere enthält.',
          'source_page' => 6,
          'sort_order' => 20,
        ),
        2 => 
        array (
          'text_de' => 'Die mindestens erforderlichen Geschwindigkeitsbereiche (mit Ausnahme der M+S-Profile) und Tragfähigkeiten der zu verwendenden Reifen sind den Fahrzeugpapieren (Fahrzeugbrief und -schein, Zulassungsbescheinigung I) zu entnehmen. Abschläge der Tragfähigkeit aufgrund der Fahrzeughöchstgeschwindigkeit sind zu berücksichtigen.',
          'source_page' => 6,
          'sort_order' => 30,
        ),
        3 => 
        array (
          'text_de' => 'Ferner sind nur Reifen einer Bauart und achsweise eines Reifentyps zulässig. Bei Verwendung unterschiedlicher Reifentypen auf Vorder- und Hinterachse sind die Hinweise des Fahrzeug- und / oder Reifenherstellers zu beachten.',
          'source_page' => 6,
          'sort_order' => 40,
        ),
        4 => 
        array (
          'text_de' => 'Das Fahrwerk und die Bremsaggregate müssen, mit Ausnahme der in der entsprechenden Auflage aufgeführten Umrüstmaßnahmen, dem Serienstand entsprechen. Die Zulässigkeit weiterer Veränderungen ist gesondert zu beurteilen.',
          'source_page' => 6,
          'sort_order' => 50,
        ),
        5 => 
        array (
          'text_de' => 'Wird das serienmäßige Ersatzrad verwendet, soll mit mäßiger Geschwindigkeit und nicht länger als erforderlich gefahren werden. Es müssen die serienmäßigen Befestigungsteile verwendet werden. Bei Fahrzeugen mit Allradantrieb darf nur ein Ersatzrad mit gleicher Reifengröße bzw. gleichem Abrollumfang verwendet werden.',
          'source_page' => 6,
          'sort_order' => 60,
        ),
        6 => 
        array (
          'text_de' => 'Die Bezieher der Räder sind darauf hinzuweisen, dass der vom Reifenhersteller vorgeschriebene Reifenfülldruck zu beachten ist.',
          'source_page' => 6,
          'sort_order' => 70,
        ),
      ),
      'speed_deratings' => 
      array (
        0 => 
        array (
          'speed_kmh' => 210,
          'symbol' => 'V',
          'percent' => 100,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        1 => 
        array (
          'speed_kmh' => 210,
          'symbol' => 'W',
          'percent' => 100,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        2 => 
        array (
          'speed_kmh' => 210,
          'symbol' => 'Y',
          'percent' => 100,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        3 => 
        array (
          'speed_kmh' => 220,
          'symbol' => 'V',
          'percent' => 97,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        4 => 
        array (
          'speed_kmh' => 220,
          'symbol' => 'W',
          'percent' => 100,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        5 => 
        array (
          'speed_kmh' => 220,
          'symbol' => 'Y',
          'percent' => 100,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        6 => 
        array (
          'speed_kmh' => 230,
          'symbol' => 'V',
          'percent' => 94,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        7 => 
        array (
          'speed_kmh' => 230,
          'symbol' => 'W',
          'percent' => 100,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        8 => 
        array (
          'speed_kmh' => 230,
          'symbol' => 'Y',
          'percent' => 100,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        9 => 
        array (
          'speed_kmh' => 240,
          'symbol' => 'V',
          'percent' => 91,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        10 => 
        array (
          'speed_kmh' => 240,
          'symbol' => 'W',
          'percent' => 100,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        11 => 
        array (
          'speed_kmh' => 240,
          'symbol' => 'Y',
          'percent' => 100,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        12 => 
        array (
          'speed_kmh' => 250,
          'symbol' => 'V',
          'percent' => NULL,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        13 => 
        array (
          'speed_kmh' => 250,
          'symbol' => 'W',
          'percent' => 95,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        14 => 
        array (
          'speed_kmh' => 250,
          'symbol' => 'Y',
          'percent' => 100,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        15 => 
        array (
          'speed_kmh' => 260,
          'symbol' => 'V',
          'percent' => NULL,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        16 => 
        array (
          'speed_kmh' => 260,
          'symbol' => 'W',
          'percent' => 90,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        17 => 
        array (
          'speed_kmh' => 260,
          'symbol' => 'Y',
          'percent' => 100,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        18 => 
        array (
          'speed_kmh' => 270,
          'symbol' => 'V',
          'percent' => NULL,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        19 => 
        array (
          'speed_kmh' => 270,
          'symbol' => 'W',
          'percent' => 85,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        20 => 
        array (
          'speed_kmh' => 270,
          'symbol' => 'Y',
          'percent' => 100,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        21 => 
        array (
          'speed_kmh' => 280,
          'symbol' => 'V',
          'percent' => NULL,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        22 => 
        array (
          'speed_kmh' => 280,
          'symbol' => 'W',
          'percent' => NULL,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        23 => 
        array (
          'speed_kmh' => 280,
          'symbol' => 'Y',
          'percent' => 95,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        24 => 
        array (
          'speed_kmh' => 290,
          'symbol' => 'V',
          'percent' => NULL,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        25 => 
        array (
          'speed_kmh' => 290,
          'symbol' => 'W',
          'percent' => NULL,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        26 => 
        array (
          'speed_kmh' => 290,
          'symbol' => 'Y',
          'percent' => 90,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        27 => 
        array (
          'speed_kmh' => 300,
          'symbol' => 'V',
          'percent' => NULL,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        28 => 
        array (
          'speed_kmh' => 300,
          'symbol' => 'W',
          'percent' => NULL,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
        29 => 
        array (
          'speed_kmh' => 300,
          'symbol' => 'Y',
          'percent' => 85,
          'source_page' => 6,
          'seeded_from' => NULL,
        ),
      ),
    ),
    'nachtrag-366-0350-21' => 
    array (
      'row' => 
      array (
        'kind' => 'NACHTRAG',
        'kba_number' => NULL,
        'approval_mark' => NULL,
        'report_number' => '366-0350-21-WIRD/N1',
        'annex' => '16',
        'test_report_number' => NULL,
        'copy_number' => NULL,
        'designation_number' => 'KBA-P 00126-00',
        'test_site' => NULL,
        'test_date' => NULL,
        'revision_date' => '2025-07-02',
        'valid_from_production' => '2021-02-01',
        'papers_correction_required' => NULL,
        'missing_annexes' => NULL,
        'issuer' => 'TÜV AUSTRIA GMBH',
        'issued_on' => NULL,
        'revision' => 1,
        'supplement_to_number' => 'ABE 53841',
        'valid_from' => '2026-10-01',
        'valid_to' => NULL,
        'pdf_sha256' => 'fd5dfae9aaddc1171d714f13f813135bd582c5f6c5ad6ecbb1ca90a52d003b9a',
        'page_count' => 24,
      ),
      'pdf' => 
      array (
        'source' => 'gutachten/01m3n7q4yq5pa6yjx4ws3jv66d.pdf',
        'sha256' => 'fd5dfae9aaddc1171d714f13f813135bd582c5f6c5ad6ecbb1ca90a52d003b9a',
      ),
      'conditions' => 
      array (
        0 => 
        array (
          'code' => '10B',
          'kind' => 'hinweis',
          'level' => 'hinweis',
          'text_de' => 'Die mindestens erforderlichen Geschwindigkeitsbereiche der zu verwendenden Reifen sind, mit Ausnahme der Winterreifen Profile, den Fahrzeugpapieren zu entnehmen. Die für gesetzeskonforme Winterreifen zulässige Höchstgeschwindigkeit ist im Blickfeld des Fahrzeugführer sinnfällig anzugeben und im Betrieb nicht zu überschreiten.Die zulässige Achslast des Fahrzeuges darf nicht größer sein als das Zweifache der auf Seite 1 dieser Anlage angegebenen Radlast unter Berücksichtigung des angegebenen Abrollumfanges. Der beim Reifen angeführte Lastindex beschreibt die mindesterforderliche Tragfähigkeit, es sind Reifen mit höherem Lastindex zulässig, die max. Achslast ist mit diesem Lastindex zu vergleichen wodurch eventuell vorhandene Achslastauflagen entfallen können.',
          'source_page' => 10,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        1 => 
        array (
          'code' => '10N',
          'kind' => 'reifen_kombination',
          'level' => 'hinweis',
          'text_de' => 'Gegebenenfalls aufgeführte Fabrikatsbindungen/-empfehlungen in den Fahrzeugpapieren bzw. der Betriebsanleitung sind zu beachten oder es dürfen nur die vom Fahrzeughersteller freigegebenen Reifenfabrikate verwendet werden.',
          'source_page' => 10,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        2 => 
        array (
          'code' => '11A',
          'kind' => 'abnahme',
          'level' => 'auflage',
          'text_de' => 'Der vorschriftsmäßige Zustand des Fahrzeuges ist durch einen amtlich anerkannten Sachverständigen oder Prüfer für den Kraftfahrzeugverkehr oder einen Prüfingenieur einer Überwachungsorganisation oder einen Angestellten nach Abschnitt 4 der Anlage VIIIb zur StVZO unter Angabe von FAHRZEUGHERSTELLER, FAHRZEUGTYP und FAHRZEUGIDENTIFIZIERUNGSNUMMER auf einem Nachweis entsprechend dem im Beispielkatalog zum §19 StVZO veröffentlichten Muster bescheinigen zu lassen.',
          'source_page' => 10,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        3 => 
        array (
          'code' => '11B',
          'kind' => 'hinweis',
          'level' => 'hinweis',
          'text_de' => 'Wird eine in diesem Gutachten aufgeführte Reifengröße verwendet, die nicht bereits in der Fahrzeuggenehmigung für diesen Fahrzeug-Typ/ -Variante/ -Version bzw. Fahrzeugausführung genannt ist, so sind die Angaben über die Reifengrößen in den Fahrzeugpapieren bei der nächsten Befassung mit den Fahrzeugpapieren durch die Zulassungsstelle berichtigen zu lassen. Diese Berichtigung ist dann nicht erforderlich, wenn die ABE/TTG des Sonderrades eine Freistellung von der Pflicht zur Berichtigung der Fahrzeugpapiere enthält.',
          'source_page' => 11,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        4 => 
        array (
          'code' => '11G',
          'kind' => 'hinweis',
          'level' => 'hinweis',
          'text_de' => 'Die Brems-, Lenkungsaggregate und das Fahrwerk mit Ausnahme von Sonder-Fahrwerksfedern müssen, sofern diese durch keine weiteren Auflagen berührt werden, dem Serienstand entsprechen. Für die Sonder-Fahrwerksfedern muß eine Allgemeine Betriebserlaubnis bzw. Teiletypgenehmigung oder ein Teilegutachten vorliegen; gegen die Verwendung der Rad/Reifenkombination dürfen keine technischen Bedenken bestehen. Wird gleichzeitig mit dem Anbau der Sonderräder eine Fahrwerksänderung vorgenommen und/oder optionale Brems- bzw. Lenkungsaggregate verbaut, so ist diese und ihre Auswirkung auf den Anbau der Sonderräder gesondert zu beurteilen.',
          'source_page' => 11,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        5 => 
        array (
          'code' => '11H',
          'kind' => 'hinweis',
          'level' => 'hinweis',
          'text_de' => 'Wird das serienmäßige Ersatzrad verwendet, soll mit mäßiger Geschwindigkeit und nicht länger als erforderlich gefahren werden. Hierbei müssen die serienmäßigen Befestigungsteile verwendet werden. Bei Fahrzeugausführungen mit Allradantrieb ist bei Verwendung des Ersatzrades darauf zu achten, daß nur Reifen mit gleich großem Abrollumfang zulässig sind.',
          'source_page' => 11,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        6 => 
        array (
          'code' => '12A',
          'kind' => 'verbot',
          'level' => 'hinweis',
          'text_de' => 'Die Verwendung von Schneeketten ist nicht möglich, es sei denn, dass für den hier aufgeführten Fahrzeugtyp eine weitere Umrüstmöglichkeit im Gutachten aufgeführt ist. Für diese Umrüstung mit der Einschränkung in Spalte Auflagen "Auflagen zu Reifen" sind die dort aufgeführten Auflagen und Hinweise zu beachten.',
          'source_page' => 11,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        7 => 
        array (
          'code' => '21B',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Durch Anlegen der vorderen Radhausausschnittkanten und Kunststoffinnenkotflügel über die gesamte Radhausausschnittkantenlänge ist die Freigängigkeit der Rad/Reifen-Kombination herzustellen.',
          'source_page' => 11,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        8 => 
        array (
          'code' => '21J',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Durch Aufweiten bzw. Bearbeiten der vorderen Radhäuser im Bereich der Radaußenseite über die gesamte Radhausausschnittkantenlänge ist die Freigängigkeit der Rad/Reifen-Kombination herzustellen.',
          'source_page' => 11,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        9 => 
        array (
          'code' => '21L',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Durch Nacharbeit der vorderen Radhäuser im Bereich über der Reifenlauffläche ist eine ausreichende Freigängigkeit der Rad/Reifen-Kombination herzustellen.',
          'source_page' => 11,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        10 => 
        array (
          'code' => '21N',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Durch Aufweiten bzw. Ausstellen der vorderen Radhäuser im Bereich der Radaußenseite über die gesamte Radhausausschnittkantenlänge ist die Freigängigkeit der Rad/Reifen-Kombination unter Berücksichtigung der maximal zulässigen Betriebsbreite nach ETRTO bzw. WdK (1,04 fache Nennbreite des Reifens) herzustellen.',
          'source_page' => 11,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        11 => 
        array (
          'code' => '21P',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Durch Anlegen bzw. Bearbeiten der vorderen Radhausausschnittkanten und Kunststoffinnenkotflügel über die gesamte Radhausausschnittkantenlänge ist die Freigängigkeit der Rad/Reifen-Kombination unter Berücksichtigung der maximal zulässigen Betriebsbreite nach ETRTO bzw. WdK (1,04 fache Nennbreite des Reifens) herzustellen.',
          'source_page' => 11,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        12 => 
        array (
          'code' => '22B',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Durch Anlegen bzw. Bearbeiten der hinteren Radhausausschnittkanten und Kunststoffinnenkotflügel über die gesamte Radhausausschnittkantenlänge ist die Freigängigkeit der Rad/Reifen-Kombination herzustellen.',
          'source_page' => 11,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        13 => 
        array (
          'code' => '22F',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Durch Aufweiten bzw. Ausstellen der hinteren Radhäuser im Bereich der Radaußenseite über die gesamte Radhausausschnittkantenlänge ist die Freigängigkeit der Rad/Reifen-Kombination herzustellen.',
          'source_page' => 11,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        14 => 
        array (
          'code' => '22H',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Durch Aufweiten bzw. Ausstellen der hinteren Radhäuser im Bereich der Radaußenseite über die gesamte Radhausausschnittkantenlänge ist die Freigängigkeit der Rad/Reifen-Kombination unter Berücksichtigung der maximal zulässigen Betriebsbreite nach ETRTO bzw. WdK (1,04 fache Nennbreite des Reifens) herzustellen.',
          'source_page' => 11,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        15 => 
        array (
          'code' => '22I',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Durch Anlegen bzw. Bearbeiten der hinteren Radhausausschnittkanten und Kunststoffinnenkotflügel über die gesamte Radhausausschnittkantenlänge ist die Freigängigkeit der Rad/Reifen-Kombination unter Berücksichtigung der maximal zulässigen Betriebsbreite nach ETRTO bzw. WdK (1,04 fache Nennbreite des Reifens) herzustellen.',
          'source_page' => 11,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        16 => 
        array (
          'code' => '22L',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Durch Kürzen bis zum Schraubenkopf und komplettes Umbiegen der Befestigungslasche der Heckschürzenbefestigung ist eine ausreichende Freigängigkeit der Rad/Reifen-Kombination herzustellen.',
          'source_page' => 12,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        17 => 
        array (
          'code' => '22M',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Durch Kürzen bis zum Schraubenkopf und komplettes Umbiegen der Befestigungslasche der Heckschürzenbefestigung ist eine ausreichende Freigängigkeit der Rad/Reifen-Kombination unter Berücksichtigung der maximal zulässigen Betriebsbreite nach ETRTO bzw. WdK (1,04 fache Nennbreite des Reifens) herzustellen.',
          'source_page' => 12,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        18 => 
        array (
          'code' => '22P',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Durch vollkommenes Anlegen der Kunststoffinnenkotflügel der Hinterachse auf der Radaußenseite an die Radhauswand über die gesamte Radhausausschnittkantenlänge ist die Freigängigkeit der Rad/Reifen-Kombination unter Berücksichtigung der maximal zulässigen Betriebsbreite nach ETRTO bzw. WdK (1,04 fache Nennbreite des Reifens) herzustellen.',
          'source_page' => 12,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        19 => 
        array (
          'code' => '241',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Die Radabdeckung an Achse 1 ist durch Ausstellen der Frontschürze und des Kotflügels oder durch Anbau von dauerhaft befestigten Karosserieteilen im Bereich 30 Grad vor der Radmitte herzustellen. Die gesamte Breite der Rad/Reifenkombination muss, unter Beachtung des maximal möglichen Betriebsmaßes des Reifens (1,04 fache der Nennbreite des Reifens), im oben genannten Bereich abgedeckt sein.',
          'source_page' => 12,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        20 => 
        array (
          'code' => '244',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Die Radabdeckung an Achse 2 ist durch Ausstellen der Heckschürze und des Kotflügels oder durch Anbau von dauerhaft befestigten Karosserieteilen im Bereich 50 Grad hinter der Radmitte herzustellen. Die gesamte Breite der Rad/Reifenkombination muss, unter Beachtung des maximal möglichen Betriebsmaßes des Reifens (1,04 fache der Nennbreite des Reifens), im oben genannten Bereich abgedeckt sein.',
          'source_page' => 12,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        21 => 
        array (
          'code' => '245',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Die Radabdeckung an Achse 1 ist durch Ausstellen der Frontschürze und des Kotflügels oder durch Anbau von dauerhaft befestigten Karosserieteilen im Bereich 30 Grad vor der Radmitte herzustellen. Je nach Rüstzustand des Fahrzeuges (z. B. Fahrzeugtieferlegung, Radabdeckungsverbreiterung, usw.) kann es möglich sein, dass die Radabdeckung ausreichend ist. Die gesamte Breite der Rad/Reifenkombination muss, unter Beachtung des maximal möglichen Betriebsmaßes des Reifens (1,04 fache der Nennbreite des Reifens), im oben genannten Bereich abgedeckt sein.',
          'source_page' => 12,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        22 => 
        array (
          'code' => '246',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Die Radabdeckung an Achse 1 ist durch Ausstellen des Kotflügels oder durch Anbau von dauerhaft befestigten Karosserieteilen im Bereich 50 Grad hinter der Radmitte herzustellen. Je nach Rüstzustand des Fahrzeuges (z. B. Fahrzeugtieferlegung, Radabdeckungsverbreiterung, usw.) kann es möglich sein, dass die Radabdeckung ausreichend ist. Die gesamte Breite der Rad/Reifenkombination muss, unter Beachtung des maximal möglichen Betriebsmaßes des Reifens (1,04 fache der Nennbreite des Reifens), im oben genannten Bereich abgedeckt sein.',
          'source_page' => 12,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        23 => 
        array (
          'code' => '247',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Die Radabdeckung an Achse 2 ist durch Ausstellen des Kotflügels oder durch Anbau von dauerhaft befestigten Karosserieteilen im Bereich 30 Grad vor der Radmitte herzustellen. Je nach Rüstzustand des Fahrzeuges (z. B. Fahrzeugtieferlegung, Radabdeckungsverbreiterung, usw.) kann es möglich sein, dass die Radabdeckung ausreichend ist. Die gesamte Breite der Rad/Reifenkombination muss, unter Beachtung des maximal möglichen Betriebsmaßes des Reifens (1,04 fache der Nennbreite des Reifens), im oben genannten Bereich abgedeckt sein.',
          'source_page' => 12,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        24 => 
        array (
          'code' => '248',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Die Radabdeckung an Achse 2 ist durch Ausstellen der Heckschürze und des Kotflügels oder durch Anbau von dauerhaft befestigten Karosserieteilen im Bereich 50 Grad hinter der Radmitte herzustellen. Je nach Rüstzustand des Fahrzeuges (z. B. Fahrzeugtieferlegung, Radabdeckungsverbreiterung, usw. ) kann es möglich sein, dass die Radabdeckung ausreichend ist. Die gesamte Breite der Rad/Reifenkombination muss, unter Beachtung des maximal möglichen Betriebsmaßes des Reifens (1,04 fache der Nennbreite des Reifens), im oben genannten Bereich abgedeckt sein.',
          'source_page' => 12,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        25 => 
        array (
          'code' => '24C',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Die Radabdeckung an Achse 1 ist durch Ausstellen der Frontschürze und des Kotflügels oder durch Anbau von dauerhaft befestigten Karosserieteilen im Bereich 30 Grad vor der Radmitte und 50 Grad hinter der Radmitte herzustellen. Die gesamte Breite der Rad/Reifenkombination muss, unter Beachtung des maximal möglichen Betriebsmaßes des Reifens (1,04 fache der Nennbreite des Reifens), im oben genannten Bereich abgedeckt sein.',
          'source_page' => 12,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        26 => 
        array (
          'code' => '24D',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Die Radabdeckung an Achse 2 ist durch Ausstellen der Heckschürze und des Kotflügels oder durch Anbau von dauerhaft befestigten Karosserieteilen im Bereich 30 Grad vor der Radmitte und 50 Grad hinter der Radmitte herzustellen. Die gesamte Breite der Rad/Reifenkombination muss, unter Beachtung des maximal möglichen Betriebsmaßes des Reifens (1,04 fache der Nennbreite des Reifens), im oben genannten Bereich abgedeckt sein.',
          'source_page' => 13,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        27 => 
        array (
          'code' => '24J',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Die Radabdeckung an Achse 1 ist durch Ausstellen der Frontschürze und des Kotflügels oder durch Anbau von dauerhaft befestigten Karosserieteilen im Bereich 30 Grad vor der Radmitte und 50 Grad hinter der Radmitte herzustellen. Je nach Rüstzustand des Fahrzeuges (z. B. Fahrzeugtieferlegung, Radabdeckungsverbreiterung, usw.) kann es möglich sein, dass die Radabdeckung ausreichend ist. Die gesamte Breite der Rad/Reifenkombination muss, unter Beachtung des maximal möglichen Betriebsmaßes des Reifens (1,04 fache der Nennbreite des Reifens), im oben genannten Bereich abgedeckt sein.',
          'source_page' => 13,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        28 => 
        array (
          'code' => '24M',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Die Radabdeckung an Achse 2 ist durch Ausstellen der Heckschürze und des Kotflügels oder durch Anbau von dauerhaft befestigten Karosserieteilen im Bereich 30 Grad vor der Radmitte und 50 Grad hinter der Radmitte herzustellen. Je nach Rüstzustand des Fahrzeuges (z. B. Fahrzeugtieferlegung, Radabdeckungsverbreiterung, usw.) kann es möglich sein, dass die Radabdeckung ausreichend ist. Die gesamte Breite der Rad/Reifenkombination muss, unter Beachtung des maximal möglichen Betriebsmaßes des Reifens (1,04 fache der Nennbreite des Reifens), im oben genannten Bereich abgedeckt sein.',
          'source_page' => 13,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        29 => 
        array (
          'code' => '26B',
          'kind' => 'nacharbeitsprofil',
          'level' => 'auflage',
          'text_de' => 'Durch Anlegen der vorderen Radhausausschnittkanten und Kunststoffinnenkotflügel ist die Freigängigkeit der Rad/Reifen-Kombination herzustellen. Die genauen Maße / Bereiche sind dem beigefügten Anhang / Hinweisblatt "Nacharbeitsprofile Fahrzeug" am Ende dieser Anlage zu entnehmen.',
          'source_page' => 13,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
            0 => 
            array (
              'vehicle_type' => '3C',
              'axle' => 'FRONT',
              'from_mm' => '225.0',
              'to_mm' => '320.0',
              'flare_mm' => NULL,
              'note_de' => 'Genehm.Nr. e1*2007/46*0316*.., BMW 4ER REIHE; Variante(n): ab e1*2007/46*0316*08, ab e1*2007/46*0316*09, ab e1*2007/46*0316*10, Allradantrieb, Cabrio, Coupe, Heckantrieb (Seite 19)',
            ),
            1 => 
            array (
              'vehicle_type' => '1C',
              'axle' => 'FRONT',
              'from_mm' => '250.0',
              'to_mm' => '250.0',
              'flare_mm' => NULL,
              'note_de' => 'Genehm.Nr. e1*2007/46*0277*.., BMW 2ER REIHE; Variante(n): Coupe, Heckantrieb (Seite 20)',
            ),
            2 => 
            array (
              'vehicle_type' => '3L',
              'axle' => 'FRONT',
              'from_mm' => '225.0',
              'to_mm' => '320.0',
              'flare_mm' => NULL,
              'note_de' => 'Genehm.Nr. e1*2007/46*0314*.., BMW 3ER REIHE; Variante(n): Ab e1*2007/46*0314*05, Heckantrieb, Limousine, Nur BMW 3er (F30) ab 2012, Stufenheck (Seite 21)',
            ),
            3 => 
            array (
              'vehicle_type' => '1K4',
              'axle' => 'FRONT',
              'from_mm' => '190.0',
              'to_mm' => '220.0',
              'flare_mm' => NULL,
              'note_de' => 'Genehm.Nr. e1*2007/46*0283*.., BMW 1ER REIHE; Variante(n): Heckantrieb, Limousine (Seite 22)',
            ),
            4 => 
            array (
              'vehicle_type' => '3K',
              'axle' => 'FRONT',
              'from_mm' => '225.0',
              'to_mm' => '320.0',
              'flare_mm' => NULL,
              'note_de' => 'Genehm.Nr. e1*2007/46*0315*.., BMW 3ER REIHE; Variante(n): keine genannt (Seite 23)',
            ),
          ),
        ),
        30 => 
        array (
          'code' => '26J',
          'kind' => 'nacharbeitsprofil',
          'level' => 'auflage',
          'text_de' => 'Durch Aufweiten bzw. Ausstellen der vorderen Radhäuser ist die Freigängigkeit der Rad/Reifen-Kombination herzustellen. Die genauen Maße / Bereiche sind dem beigefügten Anhang / Hinweisblatt "Nacharbeitsprofile Fahrzeug" am Ende dieser Anlage zu entnehmen.',
          'source_page' => 13,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
            0 => 
            array (
              'vehicle_type' => '3C',
              'axle' => 'FRONT',
              'from_mm' => '225.0',
              'to_mm' => '320.0',
              'flare_mm' => '12.0',
              'note_de' => 'Genehm.Nr. e1*2007/46*0316*.., BMW 4ER REIHE; Variante(n): ab e1*2007/46*0316*08, ab e1*2007/46*0316*09, ab e1*2007/46*0316*10, Allradantrieb, Cabrio, Coupe, Heckantrieb (Seite 19)',
            ),
            1 => 
            array (
              'vehicle_type' => '1C',
              'axle' => 'FRONT',
              'from_mm' => '250.0',
              'to_mm' => '250.0',
              'flare_mm' => '30.0',
              'note_de' => 'Genehm.Nr. e1*2007/46*0277*.., BMW 2ER REIHE; Variante(n): Coupe, Heckantrieb (Seite 20)',
            ),
            2 => 
            array (
              'vehicle_type' => '3L',
              'axle' => 'FRONT',
              'from_mm' => '225.0',
              'to_mm' => '320.0',
              'flare_mm' => '23.0',
              'note_de' => 'Genehm.Nr. e1*2007/46*0314*.., BMW 3ER REIHE; Variante(n): Ab e1*2007/46*0314*05, Heckantrieb, Limousine, Nur BMW 3er (F30) ab 2012, Stufenheck (Seite 21)',
            ),
            3 => 
            array (
              'vehicle_type' => '1K4',
              'axle' => 'FRONT',
              'from_mm' => '190.0',
              'to_mm' => '220.0',
              'flare_mm' => '25.0',
              'note_de' => 'Genehm.Nr. e1*2007/46*0283*.., BMW 1ER REIHE; Variante(n): Heckantrieb, Limousine (Seite 22)',
            ),
            4 => 
            array (
              'vehicle_type' => '3K',
              'axle' => 'FRONT',
              'from_mm' => '225.0',
              'to_mm' => '320.0',
              'flare_mm' => '25.0',
              'note_de' => 'Genehm.Nr. e1*2007/46*0315*.., BMW 3ER REIHE; Variante(n): keine genannt (Seite 23)',
            ),
          ),
        ),
        31 => 
        array (
          'code' => '26N',
          'kind' => 'nacharbeitsprofil',
          'level' => 'auflage',
          'text_de' => 'Durch Aufweiten bzw. Ausstellen der vorderen Radhäuser ist die Freigängigkeit der Rad/Reifen-Kombination unter Berücksichtigung der maximal zulässigen Betriebsbreite nach ETRTO bzw. WdK (1,04 fache Nennbreite des Reifens) herzustellen. Die genauen Maße / Bereiche sind dem beigefügten Anhang / Hinweisblatt "Nacharbeitsprofile Fahrzeug" am Ende dieser Anlage zu entnehmen.',
          'source_page' => 13,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
            0 => 
            array (
              'vehicle_type' => '3C',
              'axle' => 'FRONT',
              'from_mm' => '225.0',
              'to_mm' => '320.0',
              'flare_mm' => '8.0',
              'note_de' => 'Genehm.Nr. e1*2007/46*0316*.., BMW 4ER REIHE; Variante(n): ab e1*2007/46*0316*08, ab e1*2007/46*0316*09, ab e1*2007/46*0316*10, Allradantrieb, Cabrio, Coupe, Heckantrieb (Seite 19)',
            ),
            1 => 
            array (
              'vehicle_type' => '1C',
              'axle' => 'FRONT',
              'from_mm' => '250.0',
              'to_mm' => '250.0',
              'flare_mm' => '8.0',
              'note_de' => 'Genehm.Nr. e1*2007/46*0277*.., BMW 2ER REIHE; Variante(n): Coupe, Heckantrieb (Seite 20)',
            ),
            2 => 
            array (
              'vehicle_type' => '3L',
              'axle' => 'FRONT',
              'from_mm' => '225.0',
              'to_mm' => '320.0',
              'flare_mm' => '8.0',
              'note_de' => 'Genehm.Nr. e1*2007/46*0314*.., BMW 3ER REIHE; Variante(n): Ab e1*2007/46*0314*05, Heckantrieb, Limousine, Nur BMW 3er (F30) ab 2012, Stufenheck (Seite 21)',
            ),
            3 => 
            array (
              'vehicle_type' => '1K4',
              'axle' => 'FRONT',
              'from_mm' => '190.0',
              'to_mm' => '220.0',
              'flare_mm' => '8.0',
              'note_de' => 'Genehm.Nr. e1*2007/46*0283*.., BMW 1ER REIHE; Variante(n): Heckantrieb, Limousine (Seite 22)',
            ),
            4 => 
            array (
              'vehicle_type' => '3K',
              'axle' => 'FRONT',
              'from_mm' => '225.0',
              'to_mm' => '320.0',
              'flare_mm' => '8.0',
              'note_de' => 'Genehm.Nr. e1*2007/46*0315*.., BMW 3ER REIHE; Variante(n): keine genannt (Seite 23)',
            ),
          ),
        ),
        32 => 
        array (
          'code' => '26P',
          'kind' => 'nacharbeitsprofil',
          'level' => 'auflage',
          'text_de' => 'Durch Anlegen der vorderen Radhausausschnittkanten und Kunststoffinnenkotflügel ist die Freigängigkeit der Rad/Reifen-Kombination unter Berücksichtigung der maximal zulässigen Betriebsbreite nach ETRTO bzw. WdK (1,04 fache Nennbreite des Reifens) herzustellen. Die genauen Maße / Bereiche sind dem beigefügten Anhang / Hinweisblatt "Nacharbeitsprofile Fahrzeug" am Ende dieser Anlage zu entnehmen.',
          'source_page' => 13,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
            0 => 
            array (
              'vehicle_type' => '3C',
              'axle' => 'FRONT',
              'from_mm' => '175.0',
              'to_mm' => '270.0',
              'flare_mm' => NULL,
              'note_de' => 'Genehm.Nr. e1*2007/46*0316*.., BMW 4ER REIHE; Variante(n): ab e1*2007/46*0316*08, ab e1*2007/46*0316*09, ab e1*2007/46*0316*10, Allradantrieb, Cabrio, Coupe, Heckantrieb (Seite 19)',
            ),
            1 => 
            array (
              'vehicle_type' => '1C',
              'axle' => 'FRONT',
              'from_mm' => '200.0',
              'to_mm' => '200.0',
              'flare_mm' => NULL,
              'note_de' => 'Genehm.Nr. e1*2007/46*0277*.., BMW 2ER REIHE; Variante(n): Coupe, Heckantrieb (Seite 20)',
            ),
            2 => 
            array (
              'vehicle_type' => '3L',
              'axle' => 'FRONT',
              'from_mm' => '175.0',
              'to_mm' => '270.0',
              'flare_mm' => NULL,
              'note_de' => 'Genehm.Nr. e1*2007/46*0314*.., BMW 3ER REIHE; Variante(n): Ab e1*2007/46*0314*05, Heckantrieb, Limousine, Nur BMW 3er (F30) ab 2012, Stufenheck (Seite 21)',
            ),
            3 => 
            array (
              'vehicle_type' => '1K4',
              'axle' => 'FRONT',
              'from_mm' => '140.0',
              'to_mm' => '170.0',
              'flare_mm' => NULL,
              'note_de' => 'Genehm.Nr. e1*2007/46*0283*.., BMW 1ER REIHE; Variante(n): Heckantrieb, Limousine (Seite 22)',
            ),
            4 => 
            array (
              'vehicle_type' => '3K',
              'axle' => 'FRONT',
              'from_mm' => '175.0',
              'to_mm' => '270.0',
              'flare_mm' => NULL,
              'note_de' => 'Genehm.Nr. e1*2007/46*0315*.., BMW 3ER REIHE; Variante(n): keine genannt (Seite 23)',
            ),
          ),
        ),
        33 => 
        array (
          'code' => '270',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Durch Aufweiten bzw. Ausstellen der hinteren Radhäuser im Bereich der Radaußenseite über die gesamte Radhausausschnittkantenlänge um 8,0 mm ist eine ausreichende Freigängigkeit der Rad/Reifen-Kombination unter Berücksichtigung der maximal zulässigen Betriebsbreite nach ETRTO bzw. WdK (1,04 fache Nennbreite des Reifens) herzustellen.',
          'source_page' => 13,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        34 => 
        array (
          'code' => '272',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Durch Aufweiten bzw. Ausstellen der hinteren Radhäuser im Bereich der Radaußenseite über die gesamte Radhausausschnittkantenlänge um 18,0 mm ist eine ausreichende Freigängigkeit der Rad/Reifen-Kombination herzustellen.',
          'source_page' => 13,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        35 => 
        array (
          'code' => '273',
          'kind' => 'karosseriearbeit',
          'level' => 'auflage',
          'text_de' => 'Durch Aufweiten bzw. Ausstellen der hinteren Radhäuser im Bereich der Radaußenseite über die gesamte Radhausausschnittkantenlänge um 23,0 mm ist eine ausreichende Freigängigkeit der Rad/Reifen-Kombination herzustellen.',
          'source_page' => 13,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        36 => 
        array (
          'code' => '27F',
          'kind' => 'nacharbeitsprofil',
          'level' => 'auflage',
          'text_de' => 'Durch Aufweiten bzw. Ausstellen der hinteren Radhäuser ist die Freigängigkeit der Rad/Reifen-Kombination herzustellen. Die genauen Maße / Bereiche sind dem beigefügten Anhang / Hinweisblatt "Nacharbeitsprofile Fahrzeug" am Ende dieser Anlage zu entnehmen.',
          'source_page' => 13,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
            0 => 
            array (
              'vehicle_type' => '3C',
              'axle' => 'REAR',
              'from_mm' => '220.0',
              'to_mm' => '310.0',
              'flare_mm' => '33.0',
              'note_de' => 'Genehm.Nr. e1*2007/46*0316*.., BMW 4ER REIHE; Variante(n): ab e1*2007/46*0316*08, ab e1*2007/46*0316*09, ab e1*2007/46*0316*10, Allradantrieb, Cabrio, Coupe, Heckantrieb (Seite 19)',
            ),
            1 => 
            array (
              'vehicle_type' => '1C',
              'axle' => 'REAR',
              'from_mm' => '280.0',
              'to_mm' => '370.0',
              'flare_mm' => '30.0',
              'note_de' => 'Genehm.Nr. e1*2007/46*0277*.., BMW 2ER REIHE; Variante(n): Coupe, Heckantrieb (Seite 20)',
            ),
            2 => 
            array (
              'vehicle_type' => '3L',
              'axle' => 'REAR',
              'from_mm' => '220.0',
              'to_mm' => '310.0',
              'flare_mm' => '25.0',
              'note_de' => 'Genehm.Nr. e1*2007/46*0314*.., BMW 3ER REIHE; Variante(n): Ab e1*2007/46*0314*05, Heckantrieb, Limousine, Nur BMW 3er (F30) ab 2012, Stufenheck (Seite 21)',
            ),
            3 => 
            array (
              'vehicle_type' => '1K4',
              'axle' => 'REAR',
              'from_mm' => '220.0',
              'to_mm' => '270.0',
              'flare_mm' => '30.0',
              'note_de' => 'Genehm.Nr. e1*2007/46*0283*.., BMW 1ER REIHE; Variante(n): Heckantrieb, Limousine (Seite 22)',
            ),
            4 => 
            array (
              'vehicle_type' => '3K',
              'axle' => 'REAR',
              'from_mm' => '220.0',
              'to_mm' => '310.0',
              'flare_mm' => '25.0',
              'note_de' => 'Genehm.Nr. e1*2007/46*0315*.., BMW 3ER REIHE; Variante(n): keine genannt (Seite 23)',
            ),
          ),
        ),
        37 => 
        array (
          'code' => '27H',
          'kind' => 'nacharbeitsprofil',
          'level' => 'auflage',
          'text_de' => 'Durch Aufweiten bzw. Ausstellen der hinteren Radhäuser ist die Freigängigkeit der Rad/Reifen-Kombination unter Berücksichtigung der maximal zulässigen Betriebsbreite nach ETRTO bzw. WdK (1,04 fache Nennbreite des Reifens) herzustellen. Die genauen Maße / Bereiche sind dem beigefügten Anhang / Hinweisblatt "Nacharbeitsprofile Fahrzeug" am Ende dieser Anlage zu entnehmen.',
          'source_page' => 13,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
            0 => 
            array (
              'vehicle_type' => '3C',
              'axle' => 'REAR',
              'from_mm' => '220.0',
              'to_mm' => '310.0',
              'flare_mm' => '8.0',
              'note_de' => 'Genehm.Nr. e1*2007/46*0316*.., BMW 4ER REIHE; Variante(n): ab e1*2007/46*0316*08, ab e1*2007/46*0316*09, ab e1*2007/46*0316*10, Allradantrieb, Cabrio, Coupe, Heckantrieb (Seite 19)',
            ),
            1 => 
            array (
              'vehicle_type' => '1C',
              'axle' => 'REAR',
              'from_mm' => '280.0',
              'to_mm' => '370.0',
              'flare_mm' => '8.0',
              'note_de' => 'Genehm.Nr. e1*2007/46*0277*.., BMW 2ER REIHE; Variante(n): Coupe, Heckantrieb (Seite 20)',
            ),
            2 => 
            array (
              'vehicle_type' => '3L',
              'axle' => 'REAR',
              'from_mm' => '220.0',
              'to_mm' => '310.0',
              'flare_mm' => '8.0',
              'note_de' => 'Genehm.Nr. e1*2007/46*0314*.., BMW 3ER REIHE; Variante(n): Ab e1*2007/46*0314*05, Heckantrieb, Limousine, Nur BMW 3er (F30) ab 2012, Stufenheck (Seite 21)',
            ),
            3 => 
            array (
              'vehicle_type' => '1K4',
              'axle' => 'REAR',
              'from_mm' => '220.0',
              'to_mm' => '270.0',
              'flare_mm' => '8.0',
              'note_de' => 'Genehm.Nr. e1*2007/46*0283*.., BMW 1ER REIHE; Variante(n): Heckantrieb, Limousine (Seite 22)',
            ),
            4 => 
            array (
              'vehicle_type' => '3K',
              'axle' => 'REAR',
              'from_mm' => '220.0',
              'to_mm' => '310.0',
              'flare_mm' => '8.0',
              'note_de' => 'Genehm.Nr. e1*2007/46*0315*.., BMW 3ER REIHE; Variante(n): keine genannt (Seite 23)',
            ),
          ),
        ),
        38 => 
        array (
          'code' => '27I',
          'kind' => 'nacharbeitsprofil',
          'level' => 'auflage',
          'text_de' => 'Durch Anlegen der hinteren Radhausausschnittkanten und Kunststoffinnenkotflügel ist die Freigängigkeit der Rad/Reifen-Kombination unter Berücksichtigung der maximal zulässigen Betriebsbreite nach ETRTO bzw. WdK (1,04 fache Nennbreite des Reifens) herzustellen. Die genauen Maße / Bereiche sind dem beigefügten Anhang / Hinweisblatt "Nacharbeitsprofile Fahrzeug" am Ende dieser Anlage zu entnehmen.',
          'source_page' => 14,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
            0 => 
            array (
              'vehicle_type' => '3C',
              'axle' => 'REAR',
              'from_mm' => '170.0',
              'to_mm' => '260.0',
              'flare_mm' => NULL,
              'note_de' => 'Genehm.Nr. e1*2007/46*0316*.., BMW 4ER REIHE; Variante(n): ab e1*2007/46*0316*08, ab e1*2007/46*0316*09, ab e1*2007/46*0316*10, Allradantrieb, Cabrio, Coupe, Heckantrieb (Seite 19)',
            ),
            1 => 
            array (
              'vehicle_type' => '3L',
              'axle' => 'REAR',
              'from_mm' => '170.0',
              'to_mm' => '260.0',
              'flare_mm' => NULL,
              'note_de' => 'Genehm.Nr. e1*2007/46*0314*.., BMW 3ER REIHE; Variante(n): Ab e1*2007/46*0314*05, Heckantrieb, Limousine, Nur BMW 3er (F30) ab 2012, Stufenheck (Seite 21)',
            ),
            2 => 
            array (
              'vehicle_type' => '1K4',
              'axle' => 'REAR',
              'from_mm' => '170.0',
              'to_mm' => '240.0',
              'flare_mm' => NULL,
              'note_de' => 'Genehm.Nr. e1*2007/46*0283*.., BMW 1ER REIHE; Variante(n): Heckantrieb, Limousine (Seite 22)',
            ),
            3 => 
            array (
              'vehicle_type' => '3K',
              'axle' => 'REAR',
              'from_mm' => '170.0',
              'to_mm' => '260.0',
              'flare_mm' => NULL,
              'note_de' => 'Genehm.Nr. e1*2007/46*0315*.., BMW 3ER REIHE; Variante(n): keine genannt (Seite 23)',
            ),
          ),
        ),
        39 => 
        array (
          'code' => '512',
          'kind' => 'verbot',
          'level' => 'auflage',
          'text_de' => 'Die Verwendung dieser Reifengröße ist nicht zulässig an Fahrzeugausführungen, die serienmäßig nur mit 16-Zoll-Reifen ausgerüstet sind.',
          'source_page' => 14,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        40 => 
        array (
          'code' => '51A',
          'kind' => 'hinweis',
          'level' => 'hinweis',
          'text_de' => 'Der vom Fahrzeughersteller (siehe Betriebsanleitung oder Reifenfülldruckhinweis am Fahrzeug) bzw. Reifenhersteller vorgeschriebene Reifenfülldruck ist zu beachten. Die Verwendung von Reifen mit Notlaufeigenschaften ist laut Hersteller nur mit Reifenfülldrucküberwachungssystem zulässig.',
          'source_page' => 14,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        41 => 
        array (
          'code' => '51G',
          'kind' => 'reifen_kombination',
          'level' => 'hinweis',
          'text_de' => 'Die Verwendung dieser Rad/Reifen-Kombination ist nur zulässig, wenn diese Reifendimension in den Fahrzeugpapieren bereits serienmäßig eingetragen oder vom Fahrzeughersteller, s. Auszug aus der EG-Genehmigung des Fahrzeuges (EG-Übereinstimmungsbescheinigung), freigegeben ist. Der Loadindex, das Geschwindigkeitssymbol, das Reifenprofil, die Hinweise und die Empfehlungen des Fahrzeugherstellers sind bei Verwendung dieser Reifengröße zu beachten.',
          'source_page' => 14,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        42 => 
        array (
          'code' => '52J',
          'kind' => 'reifen_kombination',
          'level' => 'hinweis',
          'text_de' => 'Diese Reifengröße ist nur mit Profil für winterliche Wetterverhältnisse, mit dem Alpine Symbol nach ECE R-117, zulässig. Die Bereifung und Lauffläche sind dabei so konzipiert, dass sie vor allem bei winterlichen Straßenverhältnissen bessere Fahreigenschaften gewährleisten.',
          'source_page' => 14,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        43 => 
        array (
          'code' => '54A',
          'kind' => 'tacho',
          'level' => 'auflage',
          'text_de' => 'Es ist der Nachweis zu erbringen, daß die Anzeigen von Geschwindigkeitsmesser und Wegstreckenzähler innerhalb der zulässigen Toleranzen liegen. Sofern eine Angleichung durchgeführt wird, ist dies bei der Beurteilung weiterer Rad/Reifen-Kombinationen in den Fahrzeugpapieren zu berücksichtigen.',
          'source_page' => 14,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        44 => 
        array (
          'code' => '570',
          'kind' => 'reifen_kombination',
          'level' => 'hinweis',
          'text_de' => 'Folgende Rad/Reifen-Kombination ist zulässig: Reifengröße: Vorderachse: 215/40R18 Hinterachse: 245/35R18 Ist eine der beiden Reifengrößen im Gutachten nicht aufgeführt, so ist die nicht aufgeführte Reifengröße nur auf einer anderen Felgengröße zulässig. Die erforderlichen Auflagen und Hinweise sind achsweise zu beachten. Alle an ein und derselben Achse montierten Reifen müssen vom gleichen Reifentyp sein.',
          'source_page' => 14,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        45 => 
        array (
          'code' => '573',
          'kind' => 'reifen_kombination',
          'level' => 'hinweis',
          'text_de' => 'Die Verwendung unterschiedlicher Reifengrößen an Vorder- und Hinterachse ist an Fahrzeugen mit Allradantrieb nur zulässig, wenn deren Abrollumfänge gleich sind. Es ist eine Bestätigung des Reifenherstellers über die tatsächlichen Abrollumfänge erforderlich, es wird empfohlen den Nachweis der Eignung bei den Fahrzeugpapieren mitzuführen. Alle an ein und derselben Achse montierten Reifen müssen vom gleichen Reifentyp sein.',
          'source_page' => 14,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        46 => 
        array (
          'code' => '57E',
          'kind' => 'reifen_achse',
          'level' => 'auflage',
          'text_de' => 'Die Verwendung der angegebenen Reifengröße ist auf dieser Radgröße nur an der Vorderachse zulässig. Sie kann jedoch im Einzelfall auf einer anderen Radgröße an der Hinterachse kombiniert werden. Die erforderlichen Auflagen und Hinweise sind achsweise zu beachten. Alle an ein und derselben Achse montierten Reifen müssen vom gleichen Reifentyp sein.',
          'source_page' => 14,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => 'FRONT',
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        47 => 
        array (
          'code' => '57F',
          'kind' => 'reifen_achse',
          'level' => 'auflage',
          'text_de' => 'Die Verwendung der angegebenen Reifengröße ist auf dieser Radgröße nur an der Hinterachse zulässig. Sie kann jedoch im Einzelfall auf einer anderen Radgröße an der Vorderachse kombiniert werden. Die erforderlichen Auflagen und Hinweise sind achsweise zu beachten. Alle an ein und derselben Achse montierten Reifen müssen vom gleichen Reifentyp sein.',
          'source_page' => 14,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => 'REAR',
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        48 => 
        array (
          'code' => '5FE',
          'kind' => 'reifen_tragfaehigkeit',
          'level' => 'auflage',
          'text_de' => 'Die Verwendung dieser Reifengröße ist nur zulässig an Fahrzeugausführungen bis zu einer zulässigen Achslast von 1120kg.',
          'source_page' => 14,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => 1120,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        49 => 
        array (
          'code' => '5GA',
          'kind' => 'reifen_tragfaehigkeit',
          'level' => 'auflage',
          'text_de' => 'Die Verwendung dieser Reifengröße ist nur zulässig an Fahrzeugausführungen bis zu einer zulässigen Achslast von 1200kg.',
          'source_page' => 14,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => 1200,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        50 => 
        array (
          'code' => '5GG',
          'kind' => 'reifen_tragfaehigkeit',
          'level' => 'auflage',
          'text_de' => 'Die Verwendung dieser Reifengröße ist nur zulässig an Fahrzeugausführungen bis zu einer zulässigen Achslast von 1230kg.',
          'source_page' => 15,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => 1230,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        51 => 
        array (
          'code' => '631',
          'kind' => 'reifen_kombination',
          'level' => 'hinweis',
          'text_de' => 'Die Eignung von "ZR"-Reifen ist durch eine Bestätigung des Reifenherstellers über die ausreichende Tragfähigkeit der Reifengröße sicherzustellen. Es wird empfohlen den Nachweis der Eignung bei den Fahrzeugpapieren mitzuführen.',
          'source_page' => 15,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        52 => 
        array (
          'code' => '688',
          'kind' => 'reifen_kombination',
          'level' => 'hinweis',
          'text_de' => 'Folgende Rad/Reifen-Kombination ist zulässig: Reifengröße: Vorderachse: 245/40R18 Hinterachse: 275/35R18 Ist eine der beiden Reifengrößen im Gutachten nicht aufgeführt, so ist die nicht aufgeführte Reifengröße nur auf einer anderen Felgengröße zulässig. Die erforderlichen Auflagen und Hinweise sind achsweise zu beachten. An Fahrzeugausführungen mit automatischem Blockierverhinderer (ABV) bzw. Antriebsschlupfregelung (ASR) dürfen nur Reifen verwendet werden, deren Differenz im Abrollumfang kleiner als 1% ist. Es ist eine Bestätigung des Reifenherstellers über die tatsächlichen Abrollumfänge erforderlich; es wird empfohlen den Nachweis der Eignung bei den Fahrzeugpapieren mitzuführen. Alle an ein und derselben Achse montierten Reifen müssen vom gleichen Reifentyp sein.',
          'source_page' => 15,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        53 => 
        array (
          'code' => '689',
          'kind' => 'reifen_kombination',
          'level' => 'hinweis',
          'text_de' => 'Folgende Rad/Reifen-Kombination ist zulässig: Reifengröße: Vorderachse: 235/40R18 Hinterachse: 265/35R18 Ist eine der beiden Reifengrößen im Gutachten nicht aufgeführt, so ist die nicht aufgeführte Reifengröße nur auf einer anderen Felgengröße zulässig. Die erforderlichen Auflagen und Hinweise sind achsweise zu beachten. An Fahrzeugausführungen mit automatischem Blockierverhinderer (ABV) bzw. Antriebsschlupfregelung (ASR) dürfen nur Reifen verwendet werden, deren Differenz im Abrollumfang kleiner als 1% ist. Es ist eine Bestätigung des Reifenherstellers über die tatsächlichen Abrollumfänge erforderlich; es wird empfohlen den Nachweis der Eignung bei den Fahrzeugpapieren mitzuführen. Alle an ein und derselben Achse montierten Reifen müssen vom gleichen Reifentyp sein.',
          'source_page' => 15,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        54 => 
        array (
          'code' => '68B',
          'kind' => 'reifen_kombination',
          'level' => 'hinweis',
          'text_de' => 'Folgende Rad/Reifen-Kombination ist zulässig: Reifengröße: Vorderachse: 225/40R18 Hinterachse: 255/35R18 Ist eine der beiden Reifengrößen im Gutachten nicht aufgeführt, so ist die nicht aufgeführte Reifengröße nur auf einer anderen Felgengröße zulässig. Die erforderlichen Auflagen und Hinweise sind achsweise zu beachten. An Fahrzeugausführungen mit automatischem Blockierverhinderer (ABV) bzw. Antriebsschlupfregelung (ASR) dürfen nur Reifen verwendet werden, deren Differenz im Abrollumfang kleiner als 1% ist. Es ist eine Bestätigung des Reifenherstellers über die tatsächlichen Abrollumfänge erforderlich; es wird empfohlen den Nachweis der Eignung bei den Fahrzeugpapieren mitzuführen. Alle an ein und derselben Achse montierten Reifen müssen vom gleichen Reifentyp sein.',
          'source_page' => 15,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        55 => 
        array (
          'code' => '68L',
          'kind' => 'reifen_kombination',
          'level' => 'hinweis',
          'text_de' => 'Folgende Rad/Reifen-Kombination ist zulässig: Reifengröße: Vorderachse: 245/35R18 Hinterachse: 255/35R18 Ist eine der beiden Reifengrößen im Gutachten nicht aufgeführt, so ist die nicht aufgeführte Reifengröße nur auf einer anderen Felgengröße zulässig. Die erforderlichen Auflagen und Hinweise sind achsweise zu beachten. An Fahrzeugausführungen mit automatischem Blockierverhinderer (ABV) bzw. Antriebsschlupfregelung (ASR) dürfen nur Reifen verwendet werden, deren Differenz im Abrollumfang kleiner als 1% ist. Es ist eine Bestätigung des Reifenherstellers über die tatsächlichen Abrollumfänge erforderlich; es wird empfohlen den Nachweis der Eignung bei den Fahrzeugpapieren mitzuführen. Alle an ein und derselben Achse montierten Reifen müssen vom gleichen Reifentyp sein.',
          'source_page' => 15,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        56 => 
        array (
          'code' => '68T',
          'kind' => 'reifen_kombination',
          'level' => 'hinweis',
          'text_de' => 'Folgende Rad/Reifen-Kombination ist zulässig: Reifengröße: Vorderachse: 225/40R18 Hinterachse: 245/35R18 Ist eine der beiden Reifengrößen im Gutachten nicht aufgeführt, so ist die nicht aufgeführte Reifengröße nur auf einer anderen Felgengröße zulässig. Die erforderlichen Auflagen und Hinweise sind achsweise zu beachten. An Fahrzeugausführungen mit automatischem Blockierverhinderer (ABV) bzw. Antriebsschlupfregelung (ASR) dürfen nur Reifen verwendet werden, deren Differenz im Abrollumfang kleiner als 1% ist. Es ist eine Bestätigung des Reifenherstellers über die tatsächlichen Abrollumfänge erforderlich; es wird empfohlen den Nachweis der Eignung bei den Fahrzeugpapieren mitzuführen. Alle an ein und derselben Achse montierten Reifen müssen vom gleichen Reifentyp sein.',
          'source_page' => 16,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        57 => 
        array (
          'code' => '6A9',
          'kind' => 'reifen_kombination',
          'level' => 'hinweis',
          'text_de' => 'Folgende Rad/Reifen-Kombination ist zulässig: Reifengröße: Vorderachse: 225/45R18 Hinterachse: 245/40R18 Ist eine der beiden Reifengrößen im Gutachten nicht aufgeführt, so ist die nicht aufgeführte Reifengröße nur auf einer anderen Felgengröße zulässig. Die erforderlichen Auflagen und Hinweise sind achsweise zu beachten. Alle an ein und derselben Achse montierten Reifen müssen vom gleichen Reifentyp sein.',
          'source_page' => 16,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        58 => 
        array (
          'code' => '6AA',
          'kind' => 'reifen_kombination',
          'level' => 'hinweis',
          'text_de' => 'Die Verwendung unterschiedlicher Reifengrößen an Vorder- und Hinterachse ist nur zulässig, wenn deren Abrollumfänge gleich sind, oder diese der Serienkombination entsprechen. Es wird empfohlen eine Bestätigung des Reifenherstellers über die tatsächlichen Abrollumfänge einzuholen und den Nachweis der Eignung bei den Fahrzeugpapieren mitzuführen. Alle an ein und derselben Achse montierten Reifen müssen vom gleichen Reifentyp sein.',
          'source_page' => 16,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        59 => 
        array (
          'code' => '6AB',
          'kind' => 'reifen_kombination',
          'level' => 'hinweis',
          'text_de' => 'Folgende Rad/Reifen-Kombination ist zulässig: Reifengröße: Vorderachse: 235/40R18 Hinterachse: 255/35R18 Ist eine der beiden Reifengrößen im Gutachten nicht aufgeführt, so ist die nicht aufgeführte Reifengröße nur auf einer anderen Felgengröße zulässig. Die erforderlichen Auflagen und Hinweise sind achsweise zu beachten. Alle an ein und derselben Achse montierten Reifen müssen vom gleichen Reifentyp sein.',
          'source_page' => 16,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        60 => 
        array (
          'code' => '71C',
          'kind' => 'hinweis',
          'level' => 'hinweis',
          'text_de' => 'Zum Auswuchten der Sonderräder dürfen an der Felgeninnenseite nur Klebegewichte angebracht werden.',
          'source_page' => 16,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        61 => 
        array (
          'code' => '71K',
          'kind' => 'hinweis',
          'level' => 'hinweis',
          'text_de' => 'Zum Auswuchten dürfen nur Klebegewichte unterhalb des Tiefbetts an der Felgeninnenseite angebracht werden.',
          'source_page' => 16,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        62 => 
        array (
          'code' => '721',
          'kind' => 'hinweis',
          'level' => 'hinweis',
          'text_de' => 'Es ist nur die Verwendung von Gummiventilen oder Metallschraubventilen mit Überwurfmutter von außen, die weitgehend den Normen (DIN, E.T.R.T.O. bzw. Tire and Rim) entsprechen und die für einen Ventilloch-Nenndurchmesser von 11,3 mm geeignet sind, zulässig. Das Ventil darf nicht über den Felgenrand hinausragen. Es sind die Montagehinweise des Ventilherstellers zu beachten.',
          'source_page' => 16,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        63 => 
        array (
          'code' => '725',
          'kind' => 'hinweis',
          'level' => 'hinweis',
          'text_de' => 'Bei Fahrzeugen mit einer bauartbedingten Höchstgeschwindigkeit über 210 km/h sind nur Metallschraubventile zulässig. Es sind die Montagehinweise des Ventilherstellers zu beachten.',
          'source_page' => 16,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        64 => 
        array (
          'code' => '729',
          'kind' => 'hinweis',
          'level' => 'hinweis',
          'text_de' => 'Bei Fahrzeugen mit serienmäßigen Reifenfülldruckkontrollsystem mit Druckmesssensor am Rad kann das serienmäßige System verwendet werden, wenn beim Einbau in Sonderräder die Hinweise des Fahrzeugherstellers bzw. des Systemherstellers und bei nachgerüsteten Reifenfülldrucksensoren die Einbauanleitung des Teileherstellers beachtet werden.',
          'source_page' => 16,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        65 => 
        array (
          'code' => '73C',
          'kind' => 'hinweis',
          'level' => 'hinweis',
          'text_de' => 'Es ist nur die Verwendung von schlauchlosen Reifen zulässig.',
          'source_page' => 16,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        66 => 
        array (
          'code' => '744',
          'kind' => 'befestigung',
          'level' => 'hinweis',
          'text_de' => 'Das Anzugsmoment der Befestigungsteile der Räder ist der Betriebsanleitung des Fahrzeuges zu entnehmen.',
          'source_page' => 17,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        67 => 
        array (
          'code' => '74A',
          'kind' => 'befestigung',
          'level' => 'hinweis',
          'text_de' => 'Es dürfen nur die vom Radhersteller mitzuliefernden Radbefestigungsteile verwendet werden, dabei ist die Gewindegröße der serienmäßigen Befestigungsteile zu beachten. Bei Verwendung von Radschrauben, ist die, in der Anlage zum Gutachten, dem Fahrzeug zugeordnete Schaftlänge zu beachten.',
          'source_page' => 17,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        68 => 
        array (
          'code' => '75I',
          'kind' => 'hinweis',
          'level' => 'hinweis',
          'text_de' => 'Die zulässige Achslast des Fahrzeugs darf nicht größer sein als das Zweifache der auf Seite 1 dieser Anlage angegebenen Radlast unter Berücksichtigung des angegebenen Abrollumfanges, gegebenenfalls ist die erhöhte Achslast im Anhängerbetrieb anzupassen oder zu streichen.',
          'source_page' => 17,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        69 => 
        array (
          'code' => '76O',
          'kind' => 'verbot',
          'level' => 'auflage',
          'text_de' => 'Die Verwendung dieser Radgröße ist nicht zulässig an Fahrzeugausführungen, die serienmäßig laut COC-Papier (EG-Übereinstimmungserklärung) als kleinste Radgröße mit 19-Zoll-Rädern ausgerüstet sind.',
          'source_page' => 17,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        70 => 
        array (
          'code' => '76R',
          'kind' => 'verbot',
          'level' => 'auflage',
          'text_de' => 'Die Verwendung dieser Radgröße ist nur zulässig, wenn die Felgenbreite des Serienrades nicht unterschritten wird.',
          'source_page' => 17,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        71 => 
        array (
          'code' => '83H',
          'kind' => 'verbot',
          'level' => 'auflage',
          'text_de' => 'Die Verwendung der Räder ist an Fahrzeugausführungen, die mit M-Sportbremse ausgerüstet sind, nicht zulässig.',
          'source_page' => 17,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        72 => 
        array (
          'code' => '861',
          'kind' => 'verbot',
          'level' => 'auflage',
          'text_de' => 'Die Verwendung der Räder ist an Fahrzeugausführungen mit Bremsscheibendurchmesser 348mm an der Vorderachse nicht zulässig.',
          'source_page' => 17,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        73 => 
        array (
          'code' => '97K',
          'kind' => 'reifen_kombination',
          'level' => 'hinweis',
          'text_de' => 'Bei Verwendung von verschiedenen Reifengrößen auf Vorder- und Hinterachse muss die Maulweite des Sonderrades an der Hinterachse mindestens 1/2 Zoll größer sein als die des Sonderrades der Vorderachse.',
          'source_page' => 17,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        74 => 
        array (
          'code' => 'BDC',
          'kind' => 'verbot',
          'level' => 'auflage',
          'text_de' => 'Die Verwendung dieser Reifengröße ist nur in Verbindung mit M-TECHNIK-FAHRWERK oder mit einem für diese Reifengröße geprüften Sportfahrwerk zulässig, bei Fahrzeugen ab Modelljahr 1993 ist dies nicht mehr erforderlich.',
          'source_page' => 17,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        75 => 
        array (
          'code' => 'GA2',
          'kind' => 'reifen_kombination',
          'level' => 'hinweis',
          'text_de' => 'Es sind die serienmäßigen Reifen-Kombinationen zulässig. Reifengröße: Vorderachse: 225/40R18 Hinterachse: 245/35R18 Ist eine der beiden Reifengrößen im Gutachten nicht aufgeführt, so ist die nicht aufgeführte Reifengröße nur auf einer anderen Felgengröße zulässig. Die Hinweise und Empfehlungen des Fahrzeugherstellers sind bei Verwendung dieser Reifengröße zu beachten. Die erforderlichen Auflagen und Hinweise sind achsweise zu beachten.',
          'source_page' => 17,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        76 => 
        array (
          'code' => 'GA3',
          'kind' => 'reifen_kombination',
          'level' => 'hinweis',
          'text_de' => 'Es sind die serienmäßigen Reifen-Kombinationen zulässig. Reifengröße: Vorderachse: 225/45R18 Hinterachse: 255/40R18 Ist eine der beiden Reifengrößen im Gutachten nicht aufgeführt, so ist die nicht aufgeführte Reifengröße nur auf einer anderen Felgengröße zulässig. Die Hinweise und Empfehlungen des Fahrzeugherstellers sind bei Verwendung dieser Reifengröße zu beachten. Die erforderlichen Auflagen und Hinweise sind achsweise zu beachten.',
          'source_page' => 17,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        77 => 
        array (
          'code' => 'GB3',
          'kind' => 'reifen_kombination',
          'level' => 'hinweis',
          'text_de' => 'Es sind die serienmäßigen Reifen-Kombinationen zulässig. Reifengröße: Vorderachse: 215/40R18 Hinterachse: 245/35R18 Ist eine der beiden Reifengrößen im Gutachten nicht aufgeführt, so ist die nicht aufgeführte Reifengröße nur auf einer anderen Felgengröße zulässig. Die Hinweise und Empfehlungen des Fahrzeugherstellers sind bei Verwendung dieser Reifengröße zu beachten. Die erforderlichen Auflagen und Hinweise sind achsweise zu beachten.',
          'source_page' => 17,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        78 => 
        array (
          'code' => 'GB4',
          'kind' => 'reifen_kombination',
          'level' => 'hinweis',
          'text_de' => 'Es sind die serienmäßigen Reifen-Kombinationen zulässig. Reifengröße: Vorderachse: 205/45R18 Hinterachse: 225/40R18 Ist eine der beiden Reifengrößen im Gutachten nicht aufgeführt, so ist die nicht aufgeführte Reifengröße nur auf einer anderen Felgengröße zulässig. Die Hinweise und Empfehlungen des Fahrzeugherstellers sind bei Verwendung dieser Reifengröße zu beachten. Die erforderlichen Auflagen und Hinweise sind achsweise zu beachten.',
          'source_page' => 18,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        79 => 
        array (
          'code' => 'GB6',
          'kind' => 'reifen_kombination',
          'level' => 'hinweis',
          'text_de' => 'Es sind die serienmäßigen Reifen-Kombinationen zulässig. Reifengröße: Vorderachse: 225/40R18 Hinterachse: 255/35R18 Ist eine der beiden Reifengrößen im Gutachten nicht aufgeführt, so ist die nicht aufgeführte Reifengröße nur auf einer anderen Felgengröße zulässig. Die Hinweise und Empfehlungen des Fahrzeugherstellers sind bei Verwendung dieser Reifengröße zu beachten. Die erforderlichen Auflagen und Hinweise sind achsweise zu beachten.',
          'source_page' => 18,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        80 => 
        array (
          'code' => 'YDM',
          'kind' => 'reifen_kombination',
          'level' => 'hinweis',
          'text_de' => 'Folgende Rad/Reifen-Kombination ist zulässig: Reifengröße: Vorderachse: 225/40R18 Hinterachse: 225/40R18. Die erforderlichen Auflagen und Hinweise sind achsweise zu beachten. Alle an ein und derselben Achse montierten Reifen müssen vom gleichen Reifentyp sein.',
          'source_page' => 18,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        81 => 
        array (
          'code' => 'YDO',
          'kind' => 'reifen_kombination',
          'level' => 'hinweis',
          'text_de' => 'Folgende Rad/Reifen-Kombination ist zulässig: Reifengröße: Vorderachse: 235/40R18 Hinterachse: 235/40R18. Die erforderlichen Auflagen und Hinweise sind achsweise zu beachten. Alle an ein und derselben Achse montierten Reifen müssen vom gleichen Reifentyp sein.',
          'source_page' => 18,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        82 => 
        array (
          'code' => 'Cabrio',
          'kind' => 'karosserieform',
          'level' => 'auflage',
          'text_de' => 'Ohne Erläuterung in der Spalte „Auflagen“ gedruckt: „Cabrio“.',
          'source_page' => 2,
          'body_forms' => '["Cabrio", "Roadster"]',
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        83 => 
        array (
          'code' => 'Coupe',
          'kind' => 'karosserieform',
          'level' => 'auflage',
          'text_de' => 'Ohne Erläuterung in der Spalte „Auflagen“ gedruckt: „Coupe“.',
          'source_page' => 3,
          'body_forms' => '["Coupe"]',
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        84 => 
        array (
          'code' => 'Heckantrieb',
          'kind' => 'antrieb',
          'level' => 'auflage',
          'text_de' => 'Ohne Erläuterung in der Spalte „Auflagen“ gedruckt: „Heckantrieb“.',
          'source_page' => 3,
          'body_forms' => NULL,
          'drive' => '{"mode": "only", "drive": "Hinterachse"}',
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        85 => 
        array (
          'code' => 'Allradantrieb',
          'kind' => 'antrieb',
          'level' => 'auflage',
          'text_de' => 'Ohne Erläuterung in der Spalte „Auflagen“ gedruckt: „Allradantrieb“.',
          'source_page' => 3,
          'body_forms' => NULL,
          'drive' => '{"mode": "only", "drive": "Allrad"}',
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        86 => 
        array (
          'code' => 'Kombilimousine',
          'kind' => 'karosserieform',
          'level' => 'auflage',
          'text_de' => 'Ohne Erläuterung in der Spalte „Auflagen“ gedruckt: „Kombilimousine“.',
          'source_page' => 3,
          'body_forms' => '["Schrägheck"]',
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        87 => 
        array (
          'code' => 'Schrägheck 2-türig',
          'kind' => 'karosserieform',
          'level' => 'auflage',
          'text_de' => 'Ohne Erläuterung in der Spalte „Auflagen“ gedruckt: „Schrägheck 2-türig“.',
          'source_page' => 4,
          'body_forms' => '["Schrägheck"]',
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        88 => 
        array (
          'code' => 'Schrägheck 4-türig',
          'kind' => 'karosserieform',
          'level' => 'auflage',
          'text_de' => 'Ohne Erläuterung in der Spalte „Auflagen“ gedruckt: „Schrägheck 4-türig“.',
          'source_page' => 4,
          'body_forms' => '["Schrägheck"]',
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        89 => 
        array (
          'code' => '4-türig',
          'kind' => 'verbot',
          'level' => 'auflage',
          'text_de' => 'Gilt laut Gutachten nur für die 4-türige Ausführung (im Gutachten: „4-türig“).',
          'source_page' => 4,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        90 => 
        array (
          'code' => 'Pkw geschlossen',
          'kind' => 'karosserieform',
          'level' => 'auflage',
          'text_de' => 'Ohne Erläuterung in der Spalte „Auflagen“ gedruckt: „Pkw geschlossen“.',
          'source_page' => 5,
          'body_forms' => '["Limousine", "Kombi", "Coupe", "Schrägheck", "SUV", "Van"]',
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        91 => 
        array (
          'code' => 'Touring',
          'kind' => 'karosserieform',
          'level' => 'auflage',
          'text_de' => 'Ohne Erläuterung in der Spalte „Auflagen“ gedruckt: „Touring“.',
          'source_page' => 5,
          'body_forms' => '["Kombi"]',
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        92 => 
        array (
          'code' => 'Limousine',
          'kind' => 'karosserieform',
          'level' => 'auflage',
          'text_de' => 'Ohne Erläuterung in der Spalte „Auflagen“ gedruckt: „Limousine“.',
          'source_page' => 5,
          'body_forms' => '["Limousine"]',
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        93 => 
        array (
          'code' => 'Stufenheck',
          'kind' => 'karosserieform',
          'level' => 'auflage',
          'text_de' => 'Ohne Erläuterung in der Spalte „Auflagen“ gedruckt: „Stufenheck“.',
          'source_page' => 5,
          'body_forms' => '["Limousine"]',
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        94 => 
        array (
          'code' => 'Compact',
          'kind' => 'karosserieform',
          'level' => 'auflage',
          'text_de' => 'Ohne Erläuterung in der Spalte „Auflagen“ gedruckt: „Compact“.',
          'source_page' => 5,
          'body_forms' => '["Schrägheck"]',
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        95 => 
        array (
          'code' => 'Kompakt',
          'kind' => 'karosserieform',
          'level' => 'auflage',
          'text_de' => 'Ohne Erläuterung in der Spalte „Auflagen“ gedruckt: „Kompakt“.',
          'source_page' => 6,
          'body_forms' => '["Schrägheck"]',
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        96 => 
        array (
          'code' => 'Stufenheck 4-türig',
          'kind' => 'karosserieform',
          'level' => 'auflage',
          'text_de' => 'Ohne Erläuterung in der Spalte „Auflagen“ gedruckt: „Stufenheck 4-türig“.',
          'source_page' => 6,
          'body_forms' => '["Limousine"]',
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        97 => 
        array (
          'code' => 'Kombi',
          'kind' => 'karosserieform',
          'level' => 'auflage',
          'text_de' => 'Ohne Erläuterung in der Spalte „Auflagen“ gedruckt: „Kombi“.',
          'source_page' => 7,
          'body_forms' => '["Kombi"]',
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        98 => 
        array (
          'code' => 'Nicht 330D',
          'kind' => 'verbot',
          'level' => 'auflage',
          'text_de' => 'Diese Reifengröße ist nicht für den 330d zugelassen (im Gutachten: „Nicht 330D“).',
          'source_page' => 7,
          'body_forms' => NULL,
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        99 => 
        array (
          'code' => 'nur Limousine',
          'kind' => 'karosserieform',
          'level' => 'auflage',
          'text_de' => 'Ohne Erläuterung in der Spalte „Auflagen“ gedruckt: „nur Limousine“.',
          'source_page' => 9,
          'body_forms' => '["Limousine"]',
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
        100 => 
        array (
          'code' => 'nur Kombi',
          'kind' => 'karosserieform',
          'level' => 'auflage',
          'text_de' => 'Ohne Erläuterung in der Spalte „Auflagen“ gedruckt: „nur Kombi“.',
          'source_page' => 9,
          'body_forms' => '["Kombi"]',
          'drive' => NULL,
          'max_axle_load_kg' => NULL,
          'axle' => NULL,
          'limit_confirmed_reason' => NULL,
          'reworks' => 
          array (
          ),
        ),
      ),
      'fasteners' => 
      array (
        0 => 
        array (
          'number' => '5248 · 100 Nm',
          'thread' => 'Kegelbundschraube M12x1,5',
          'seat' => 'Kegel 60°',
          'torque_nm' => 100,
          'shaft_length_mm' => 30,
          'article_number' => 'Set Nr. 5248',
          'vehicle_types' => '346C; 346K; 346L; 346R; 346X',
          'source_page' => 2,
        ),
        1 => 
        array (
          'number' => '5284 · 140 Nm',
          'thread' => 'Kegelbundschraube M14x1,5',
          'seat' => 'Kegel 60°',
          'torque_nm' => 140,
          'shaft_length_mm' => 30,
          'article_number' => 'Set Nr. 5284',
          'vehicle_types' => 'X83',
          'source_page' => 2,
        ),
        2 => 
        array (
          'number' => '5248 · 110 Nm',
          'thread' => 'Kegelbundschraube M12x1,5',
          'seat' => 'Kegel 60°',
          'torque_nm' => 110,
          'shaft_length_mm' => 30,
          'article_number' => 'Set Nr. 5248',
          'vehicle_types' => 'M3B; R/C; 3 B; 3/B; 3/C; 3/CG',
          'source_page' => 2,
        ),
        3 => 
        array (
          'number' => '5248 · 120 Nm',
          'thread' => 'Kegelbundschraube M12x1,5',
          'seat' => 'Kegel 60°',
          'torque_nm' => 120,
          'shaft_length_mm' => 30,
          'article_number' => 'Set Nr. 5248',
          'vehicle_types' => 'ZR; Z85; Z89; 1C; 182; 187; 3C; 3K; 3K-N1; 3L; 390L; 390X; 392C; 560X; 1K2 (nur bis Nachtrag 03); 1K4 (nur bis Nachtrag 03)',
          'source_page' => 2,
        ),
        4 => 
        array (
          'number' => '5276 · 140 Nm',
          'thread' => 'Kegelbundschraube M14x1,25',
          'seat' => 'Kegel 60°',
          'torque_nm' => 140,
          'shaft_length_mm' => 30,
          'article_number' => 'Set Nr. 5276',
          'vehicle_types' => '3L (nur BMW 3er (F30) ab 2012); 3K (nur BMW 3er (F31) ab 2012); 3K-N1 (nur BMW 3er (F31) ab 2012); 1K2 (ab Nachtrag 04); 1K4 (ab Nachtrag 04); 1C; UKL-N1; UKL-C/X; UKL/X; 3C',
          'source_page' => 2,
        ),
      ),
      'notices' => 
      array (
        0 => 
        array (
          'text_de' => 'Im Fahrzeug vorgeschriebene Fahrzeugsysteme, z. B. Reifendruckkontrollsysteme, müssen nach Anbau der Sonderräder funktionsfähig bleiben.',
          'source_page' => 1,
          'sort_order' => 10,
        ),
        1 => 
        array (
          'text_de' => 'Der Fahrzeughalter muss auf die Kontrolle des Anzugsmoments der Befestigungsmittel nach einer Wegstrecke von 50km hingewiesen werden.',
          'source_page' => 1,
          'sort_order' => 20,
        ),
        2 => 
        array (
          'text_de' => 'Hinweis zum Verwendungsbereich: Ohne Genehmigung nach UN-Regelung Nr. 124 ist die Verwendung dieser Rad-/Reifen Kombinationen nur zulässig, wenn sie nicht serienmäßig vom Fahrzeughersteller freigegeben sind (z. B. EU-Übereinstimmungsbescheinigung (COC) oder Fahrzeugpapiere).',
          'source_page' => 1,
          'sort_order' => 30,
        ),
      ),
      'speed_deratings' => 
      array (
      ),
    ),
  ),
  'fitments' => 
  array (
    0 => 
    array (
      'vehicle' => 'e46',
      'document' => 'abe-55255',
      'config' => '19-schwarz-matt',
      'row' => 
      array (
        'axle' => 'ALL',
        'build_from' => NULL,
        'build_to' => NULL,
        'permitted_width_min' => NULL,
        'permitted_width_max' => NULL,
        'permitted_et_min' => NULL,
        'permitted_et_max' => NULL,
        'centre_bore_mm' => NULL,
        'requires_entry' => 1,
        'entry_note_de' => NULL,
        'entry_override' => NULL,
        'entry_override_reason' => NULL,
        'source_page' => 3,
      ),
      'conditions' => 
      array (
        0 => 
        array (
          'code' => 'A01',
          'note_de' => NULL,
        ),
        1 => 
        array (
          'code' => 'A12',
          'note_de' => NULL,
        ),
        2 => 
        array (
          'code' => 'A14',
          'note_de' => NULL,
        ),
        3 => 
        array (
          'code' => 'A18',
          'note_de' => NULL,
        ),
        4 => 
        array (
          'code' => 'Car',
          'note_de' => NULL,
        ),
        5 => 
        array (
          'code' => 'K1c',
          'note_de' => NULL,
        ),
        6 => 
        array (
          'code' => 'K42',
          'note_de' => NULL,
        ),
        7 => 
        array (
          'code' => 'Lim',
          'note_de' => NULL,
        ),
        8 => 
        array (
          'code' => 'S01',
          'note_de' => NULL,
        ),
        9 => 
        array (
          'code' => 'V19',
          'note_de' => NULL,
        ),
      ),
      'sizes' => 
      array (
        0 => 
        array (
          'width_mm' => 225,
          'aspect' => 35,
          'diameter_in' => '19.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'ALL',
          'kw_min' => 77,
          'kw_max' => 170,
          'entry_key' => '225|35|19.0|ALL|77|170||',
          'conditions' => 
          array (
            0 => 'K2b',
            1 => 'K41',
            2 => 'K44',
            3 => 'K56',
            4 => 'T84',
            5 => 'T88',
          ),
        ),
        1 => 
        array (
          'width_mm' => 235,
          'aspect' => 35,
          'diameter_in' => '19.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'ALL',
          'kw_min' => 77,
          'kw_max' => 170,
          'entry_key' => '235|35|19.0|ALL|77|170||',
          'conditions' => 
          array (
            0 => 'G01',
            1 => 'K2b',
            2 => 'K41',
            3 => 'K44',
            4 => 'K56',
            5 => 'T87',
            6 => 'T91',
          ),
        ),
        2 => 
        array (
          'width_mm' => 245,
          'aspect' => 30,
          'diameter_in' => '19.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'ALL',
          'kw_min' => 77,
          'kw_max' => 170,
          'entry_key' => '245|30|19.0|ALL|77|170||',
          'conditions' => 
          array (
            0 => 'K2c',
            1 => 'K41',
            2 => 'K44',
            3 => 'K56',
            4 => 'T89',
          ),
        ),
        3 => 
        array (
          'width_mm' => 255,
          'aspect' => 30,
          'diameter_in' => '19.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'REAR',
          'kw_min' => 77,
          'kw_max' => 170,
          'entry_key' => '255|30|19.0|REAR|77|170||',
          'conditions' => 
          array (
            0 => 'K2c',
            1 => 'K44',
            2 => 'K56',
            3 => 'R03',
            4 => 'T87',
            5 => 'T91',
          ),
        ),
      ),
    ),
    1 => 
    array (
      'vehicle' => 'e46',
      'document' => 'abe-55255',
      'config' => '19-bronze-matt',
      'row' => 
      array (
        'axle' => 'ALL',
        'build_from' => NULL,
        'build_to' => NULL,
        'permitted_width_min' => NULL,
        'permitted_width_max' => NULL,
        'permitted_et_min' => NULL,
        'permitted_et_max' => NULL,
        'centre_bore_mm' => NULL,
        'requires_entry' => 1,
        'entry_note_de' => NULL,
        'entry_override' => NULL,
        'entry_override_reason' => NULL,
        'source_page' => 3,
      ),
      'conditions' => 
      array (
        0 => 
        array (
          'code' => 'A01',
          'note_de' => NULL,
        ),
        1 => 
        array (
          'code' => 'A12',
          'note_de' => NULL,
        ),
        2 => 
        array (
          'code' => 'A14',
          'note_de' => NULL,
        ),
        3 => 
        array (
          'code' => 'A18',
          'note_de' => NULL,
        ),
        4 => 
        array (
          'code' => 'Car',
          'note_de' => NULL,
        ),
        5 => 
        array (
          'code' => 'K1c',
          'note_de' => NULL,
        ),
        6 => 
        array (
          'code' => 'K42',
          'note_de' => NULL,
        ),
        7 => 
        array (
          'code' => 'Lim',
          'note_de' => NULL,
        ),
        8 => 
        array (
          'code' => 'S01',
          'note_de' => NULL,
        ),
        9 => 
        array (
          'code' => 'V19',
          'note_de' => NULL,
        ),
      ),
      'sizes' => 
      array (
        0 => 
        array (
          'width_mm' => 225,
          'aspect' => 35,
          'diameter_in' => '19.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'ALL',
          'kw_min' => 77,
          'kw_max' => 170,
          'entry_key' => '225|35|19.0|ALL|77|170||',
          'conditions' => 
          array (
            0 => 'K2b',
            1 => 'K41',
            2 => 'K44',
            3 => 'K56',
            4 => 'T84',
            5 => 'T88',
          ),
        ),
        1 => 
        array (
          'width_mm' => 235,
          'aspect' => 35,
          'diameter_in' => '19.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'ALL',
          'kw_min' => 77,
          'kw_max' => 170,
          'entry_key' => '235|35|19.0|ALL|77|170||',
          'conditions' => 
          array (
            0 => 'G01',
            1 => 'K2b',
            2 => 'K41',
            3 => 'K44',
            4 => 'K56',
            5 => 'T87',
            6 => 'T91',
          ),
        ),
        2 => 
        array (
          'width_mm' => 245,
          'aspect' => 30,
          'diameter_in' => '19.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'ALL',
          'kw_min' => 77,
          'kw_max' => 170,
          'entry_key' => '245|30|19.0|ALL|77|170||',
          'conditions' => 
          array (
            0 => 'K2c',
            1 => 'K41',
            2 => 'K44',
            3 => 'K56',
            4 => 'T89',
          ),
        ),
        3 => 
        array (
          'width_mm' => 255,
          'aspect' => 30,
          'diameter_in' => '19.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'REAR',
          'kw_min' => 77,
          'kw_max' => 170,
          'entry_key' => '255|30|19.0|REAR|77|170||',
          'conditions' => 
          array (
            0 => 'K2c',
            1 => 'K44',
            2 => 'K56',
            3 => 'R03',
            4 => 'T87',
            5 => 'T91',
          ),
        ),
      ),
    ),
    2 => 
    array (
      'vehicle' => 'e46',
      'document' => 'nachtrag-366-0350-21',
      'config' => '18-schwarz-matt',
      'row' => 
      array (
        'axle' => 'ALL',
        'build_from' => NULL,
        'build_to' => NULL,
        'permitted_width_min' => NULL,
        'permitted_width_max' => NULL,
        'permitted_et_min' => NULL,
        'permitted_et_max' => NULL,
        'centre_bore_mm' => NULL,
        'requires_entry' => 1,
        'entry_note_de' => NULL,
        'entry_override' => NULL,
        'entry_override_reason' => NULL,
        'source_page' => 6,
      ),
      'conditions' => 
      array (
        0 => 
        array (
          'code' => '10B',
          'note_de' => NULL,
        ),
        1 => 
        array (
          'code' => '11B',
          'note_de' => NULL,
        ),
        2 => 
        array (
          'code' => '11G',
          'note_de' => NULL,
        ),
        3 => 
        array (
          'code' => '11H',
          'note_de' => NULL,
        ),
        4 => 
        array (
          'code' => '12A',
          'note_de' => NULL,
        ),
        5 => 
        array (
          'code' => '51A',
          'note_de' => NULL,
        ),
        6 => 
        array (
          'code' => '71C',
          'note_de' => NULL,
        ),
        7 => 
        array (
          'code' => '71K',
          'note_de' => NULL,
        ),
        8 => 
        array (
          'code' => '721',
          'note_de' => NULL,
        ),
        9 => 
        array (
          'code' => '725',
          'note_de' => NULL,
        ),
        10 => 
        array (
          'code' => '729',
          'note_de' => NULL,
        ),
        11 => 
        array (
          'code' => '73C',
          'note_de' => NULL,
        ),
        12 => 
        array (
          'code' => '744',
          'note_de' => NULL,
        ),
        13 => 
        array (
          'code' => '74A',
          'note_de' => NULL,
        ),
      ),
      'sizes' => 
      array (
        0 => 
        array (
          'width_mm' => 225,
          'aspect' => 40,
          'diameter_in' => '18.0',
          'min_load_index' => 88,
          'min_speed_symbol' => 'W',
          'axle' => 'ALL',
          'kw_min' => 77,
          'kw_max' => 135,
          'entry_key' => '225|40|18.0|ALL|77|135|88|W',
          'conditions' => 
          array (
            0 => '11A',
            1 => '21B',
            2 => '22B',
            3 => '22F',
            4 => '24J',
            5 => '24M',
            6 => '5FE',
            7 => 'Cabrio',
            8 => 'Coupe',
            9 => 'Kompakt',
            10 => 'Limousine',
            11 => 'Stufenheck 4-türig',
          ),
        ),
        1 => 
        array (
          'width_mm' => 245,
          'aspect' => 35,
          'diameter_in' => '18.0',
          'min_load_index' => 88,
          'min_speed_symbol' => 'W',
          'axle' => 'REAR',
          'kw_min' => 77,
          'kw_max' => 135,
          'entry_key' => '245|35|18.0|REAR|77|135|88|W',
          'conditions' => 
          array (
            0 => '11A',
            1 => '22B',
            2 => '22F',
            3 => '24D',
            4 => '57F',
            5 => '5FE',
            6 => '68T',
            7 => 'Cabrio',
            8 => 'Coupe',
            9 => 'Kompakt',
            10 => 'Limousine',
            11 => 'Stufenheck 4-türig',
          ),
        ),
        2 => 
        array (
          'width_mm' => 225,
          'aspect' => 40,
          'diameter_in' => '18.0',
          'min_load_index' => 88,
          'min_speed_symbol' => 'Y',
          'axle' => 'ALL',
          'kw_min' => 77,
          'kw_max' => 142,
          'entry_key' => '225|40|18.0|ALL|77|142|88|Y',
          'conditions' => 
          array (
            0 => '11A',
            1 => '21B',
            2 => '22B',
            3 => '22F',
            4 => '24J',
            5 => '24M',
            6 => '5FE',
            7 => 'Cabrio',
            8 => 'Coupe',
            9 => 'Kompakt',
            10 => 'Limousine',
            11 => 'Stufenheck 4-türig',
          ),
        ),
        3 => 
        array (
          'width_mm' => 225,
          'aspect' => 40,
          'diameter_in' => '18.0',
          'min_load_index' => 88,
          'min_speed_symbol' => 'W',
          'axle' => 'FRONT',
          'kw_min' => 77,
          'kw_max' => 170,
          'entry_key' => '225|40|18.0|FRONT|77|170|88|W',
          'conditions' => 
          array (
            0 => '11A',
            1 => '21B',
            2 => '24J',
            3 => '57E',
            4 => '68B',
            5 => 'Cabrio',
            6 => 'Coupe',
            7 => 'Kompakt',
            8 => 'Limousine',
            9 => 'Stufenheck 4-türig',
          ),
        ),
        4 => 
        array (
          'width_mm' => 245,
          'aspect' => 35,
          'diameter_in' => '18.0',
          'min_load_index' => 88,
          'min_speed_symbol' => 'Y',
          'axle' => 'REAR',
          'kw_min' => 77,
          'kw_max' => 170,
          'entry_key' => '245|35|18.0|REAR|77|170|88|Y',
          'conditions' => 
          array (
            0 => '11A',
            1 => '22B',
            2 => '22F',
            3 => '24D',
            4 => '57F',
            5 => '5FE',
            6 => '68T',
            7 => 'Cabrio',
            8 => 'Coupe',
            9 => 'Kompakt',
            10 => 'Limousine',
            11 => 'Stufenheck 4-türig',
          ),
        ),
        5 => 
        array (
          'width_mm' => 255,
          'aspect' => 35,
          'diameter_in' => '18.0',
          'min_load_index' => 90,
          'min_speed_symbol' => NULL,
          'axle' => 'REAR',
          'kw_min' => 77,
          'kw_max' => 170,
          'entry_key' => '255|35|18.0|REAR|77|170|90|',
          'conditions' => 
          array (
            0 => '11A',
            1 => '22B',
            2 => '22F',
            3 => '24D',
            4 => '57F',
            5 => '5GA',
            6 => '68B',
            7 => 'Cabrio',
            8 => 'Coupe',
            9 => 'Kompakt',
            10 => 'Limousine',
            11 => 'Stufenheck 4-türig',
          ),
        ),
        6 => 
        array (
          'width_mm' => 225,
          'aspect' => 40,
          'diameter_in' => '18.0',
          'min_load_index' => 88,
          'min_speed_symbol' => 'W',
          'axle' => 'ALL',
          'kw_min' => 85,
          'kw_max' => 105,
          'entry_key' => '225|40|18.0|ALL|85|105|88|W',
          'conditions' => 
          array (
            0 => '11A',
            1 => '21B',
            2 => '21J',
            3 => '22B',
            4 => '22L',
            5 => '24J',
            6 => '24M',
            7 => '5FE',
            8 => 'Touring',
          ),
        ),
        7 => 
        array (
          'width_mm' => 255,
          'aspect' => 35,
          'diameter_in' => '18.0',
          'min_load_index' => 90,
          'min_speed_symbol' => NULL,
          'axle' => 'REAR',
          'kw_min' => 85,
          'kw_max' => 110,
          'entry_key' => '255|35|18.0|REAR|85|110|90|',
          'conditions' => 
          array (
            0 => '11A',
            1 => '22B',
            2 => '22F',
            3 => '22L',
            4 => '24D',
            5 => '57F',
            6 => '5GA',
            7 => '68B',
            8 => 'Touring',
          ),
        ),
        8 => 
        array (
          'width_mm' => 225,
          'aspect' => 40,
          'diameter_in' => '18.0',
          'min_load_index' => 88,
          'min_speed_symbol' => 'W',
          'axle' => 'FRONT',
          'kw_min' => 85,
          'kw_max' => 170,
          'entry_key' => '225|40|18.0|FRONT|85|170|88|W',
          'conditions' => 
          array (
            0 => '11A',
            1 => '21B',
            2 => '21J',
            3 => '24J',
            4 => '57E',
            5 => '68B',
            6 => 'Touring',
          ),
        ),
        9 => 
        array (
          'width_mm' => 235,
          'aspect' => 40,
          'diameter_in' => '18.0',
          'min_load_index' => 91,
          'min_speed_symbol' => NULL,
          'axle' => 'ALL',
          'kw_min' => 85,
          'kw_max' => 170,
          'entry_key' => '235|40|18.0|ALL|85|170|91|',
          'conditions' => 
          array (
            0 => '11A',
            1 => '21B',
            2 => '21J',
            3 => '22B',
            4 => '22H',
            5 => '22L',
            6 => '24J',
            7 => '24M',
            8 => '54A',
            9 => 'Touring',
          ),
        ),
        10 => 
        array (
          'width_mm' => 255,
          'aspect' => 35,
          'diameter_in' => '18.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'REAR',
          'kw_min' => 85,
          'kw_max' => 170,
          'entry_key' => '255|35|18.0|REAR|85|170||',
          'conditions' => 
          array (
            0 => '10N',
            1 => '11A',
            2 => '22B',
            3 => '22F',
            4 => '22L',
            5 => '24D',
            6 => '51G',
            7 => '57F',
            8 => '68B',
            9 => 'Touring',
          ),
        ),
      ),
    ),
    3 => 
    array (
      'vehicle' => 'e46',
      'document' => 'nachtrag-366-0350-21',
      'config' => '18-bronze-matt',
      'row' => 
      array (
        'axle' => 'ALL',
        'build_from' => NULL,
        'build_to' => NULL,
        'permitted_width_min' => NULL,
        'permitted_width_max' => NULL,
        'permitted_et_min' => NULL,
        'permitted_et_max' => NULL,
        'centre_bore_mm' => NULL,
        'requires_entry' => 1,
        'entry_note_de' => NULL,
        'entry_override' => NULL,
        'entry_override_reason' => NULL,
        'source_page' => 6,
      ),
      'conditions' => 
      array (
        0 => 
        array (
          'code' => '10B',
          'note_de' => NULL,
        ),
        1 => 
        array (
          'code' => '11B',
          'note_de' => NULL,
        ),
        2 => 
        array (
          'code' => '11G',
          'note_de' => NULL,
        ),
        3 => 
        array (
          'code' => '11H',
          'note_de' => NULL,
        ),
        4 => 
        array (
          'code' => '12A',
          'note_de' => NULL,
        ),
        5 => 
        array (
          'code' => '51A',
          'note_de' => NULL,
        ),
        6 => 
        array (
          'code' => '71C',
          'note_de' => NULL,
        ),
        7 => 
        array (
          'code' => '71K',
          'note_de' => NULL,
        ),
        8 => 
        array (
          'code' => '721',
          'note_de' => NULL,
        ),
        9 => 
        array (
          'code' => '725',
          'note_de' => NULL,
        ),
        10 => 
        array (
          'code' => '729',
          'note_de' => NULL,
        ),
        11 => 
        array (
          'code' => '73C',
          'note_de' => NULL,
        ),
        12 => 
        array (
          'code' => '744',
          'note_de' => NULL,
        ),
        13 => 
        array (
          'code' => '74A',
          'note_de' => NULL,
        ),
      ),
      'sizes' => 
      array (
        0 => 
        array (
          'width_mm' => 225,
          'aspect' => 40,
          'diameter_in' => '18.0',
          'min_load_index' => 88,
          'min_speed_symbol' => 'W',
          'axle' => 'ALL',
          'kw_min' => 77,
          'kw_max' => 135,
          'entry_key' => '225|40|18.0|ALL|77|135|88|W',
          'conditions' => 
          array (
            0 => '11A',
            1 => '21B',
            2 => '22B',
            3 => '22F',
            4 => '24J',
            5 => '24M',
            6 => '5FE',
            7 => 'Cabrio',
            8 => 'Coupe',
            9 => 'Kompakt',
            10 => 'Limousine',
            11 => 'Stufenheck 4-türig',
          ),
        ),
        1 => 
        array (
          'width_mm' => 245,
          'aspect' => 35,
          'diameter_in' => '18.0',
          'min_load_index' => 88,
          'min_speed_symbol' => 'W',
          'axle' => 'REAR',
          'kw_min' => 77,
          'kw_max' => 135,
          'entry_key' => '245|35|18.0|REAR|77|135|88|W',
          'conditions' => 
          array (
            0 => '11A',
            1 => '22B',
            2 => '22F',
            3 => '24D',
            4 => '57F',
            5 => '5FE',
            6 => '68T',
            7 => 'Cabrio',
            8 => 'Coupe',
            9 => 'Kompakt',
            10 => 'Limousine',
            11 => 'Stufenheck 4-türig',
          ),
        ),
        2 => 
        array (
          'width_mm' => 225,
          'aspect' => 40,
          'diameter_in' => '18.0',
          'min_load_index' => 88,
          'min_speed_symbol' => 'Y',
          'axle' => 'ALL',
          'kw_min' => 77,
          'kw_max' => 142,
          'entry_key' => '225|40|18.0|ALL|77|142|88|Y',
          'conditions' => 
          array (
            0 => '11A',
            1 => '21B',
            2 => '22B',
            3 => '22F',
            4 => '24J',
            5 => '24M',
            6 => '5FE',
            7 => 'Cabrio',
            8 => 'Coupe',
            9 => 'Kompakt',
            10 => 'Limousine',
            11 => 'Stufenheck 4-türig',
          ),
        ),
        3 => 
        array (
          'width_mm' => 225,
          'aspect' => 40,
          'diameter_in' => '18.0',
          'min_load_index' => 88,
          'min_speed_symbol' => 'W',
          'axle' => 'FRONT',
          'kw_min' => 77,
          'kw_max' => 170,
          'entry_key' => '225|40|18.0|FRONT|77|170|88|W',
          'conditions' => 
          array (
            0 => '11A',
            1 => '21B',
            2 => '24J',
            3 => '57E',
            4 => '68B',
            5 => 'Cabrio',
            6 => 'Coupe',
            7 => 'Kompakt',
            8 => 'Limousine',
            9 => 'Stufenheck 4-türig',
          ),
        ),
        4 => 
        array (
          'width_mm' => 245,
          'aspect' => 35,
          'diameter_in' => '18.0',
          'min_load_index' => 88,
          'min_speed_symbol' => 'Y',
          'axle' => 'REAR',
          'kw_min' => 77,
          'kw_max' => 170,
          'entry_key' => '245|35|18.0|REAR|77|170|88|Y',
          'conditions' => 
          array (
            0 => '11A',
            1 => '22B',
            2 => '22F',
            3 => '24D',
            4 => '57F',
            5 => '5FE',
            6 => '68T',
            7 => 'Cabrio',
            8 => 'Coupe',
            9 => 'Kompakt',
            10 => 'Limousine',
            11 => 'Stufenheck 4-türig',
          ),
        ),
        5 => 
        array (
          'width_mm' => 255,
          'aspect' => 35,
          'diameter_in' => '18.0',
          'min_load_index' => 90,
          'min_speed_symbol' => NULL,
          'axle' => 'REAR',
          'kw_min' => 77,
          'kw_max' => 170,
          'entry_key' => '255|35|18.0|REAR|77|170|90|',
          'conditions' => 
          array (
            0 => '11A',
            1 => '22B',
            2 => '22F',
            3 => '24D',
            4 => '57F',
            5 => '5GA',
            6 => '68B',
            7 => 'Cabrio',
            8 => 'Coupe',
            9 => 'Kompakt',
            10 => 'Limousine',
            11 => 'Stufenheck 4-türig',
          ),
        ),
        6 => 
        array (
          'width_mm' => 225,
          'aspect' => 40,
          'diameter_in' => '18.0',
          'min_load_index' => 88,
          'min_speed_symbol' => 'W',
          'axle' => 'ALL',
          'kw_min' => 85,
          'kw_max' => 105,
          'entry_key' => '225|40|18.0|ALL|85|105|88|W',
          'conditions' => 
          array (
            0 => '11A',
            1 => '21B',
            2 => '21J',
            3 => '22B',
            4 => '22L',
            5 => '24J',
            6 => '24M',
            7 => '5FE',
            8 => 'Touring',
          ),
        ),
        7 => 
        array (
          'width_mm' => 255,
          'aspect' => 35,
          'diameter_in' => '18.0',
          'min_load_index' => 90,
          'min_speed_symbol' => NULL,
          'axle' => 'REAR',
          'kw_min' => 85,
          'kw_max' => 110,
          'entry_key' => '255|35|18.0|REAR|85|110|90|',
          'conditions' => 
          array (
            0 => '11A',
            1 => '22B',
            2 => '22F',
            3 => '22L',
            4 => '24D',
            5 => '57F',
            6 => '5GA',
            7 => '68B',
            8 => 'Touring',
          ),
        ),
        8 => 
        array (
          'width_mm' => 225,
          'aspect' => 40,
          'diameter_in' => '18.0',
          'min_load_index' => 88,
          'min_speed_symbol' => 'W',
          'axle' => 'FRONT',
          'kw_min' => 85,
          'kw_max' => 170,
          'entry_key' => '225|40|18.0|FRONT|85|170|88|W',
          'conditions' => 
          array (
            0 => '11A',
            1 => '21B',
            2 => '21J',
            3 => '24J',
            4 => '57E',
            5 => '68B',
            6 => 'Touring',
          ),
        ),
        9 => 
        array (
          'width_mm' => 235,
          'aspect' => 40,
          'diameter_in' => '18.0',
          'min_load_index' => 91,
          'min_speed_symbol' => NULL,
          'axle' => 'ALL',
          'kw_min' => 85,
          'kw_max' => 170,
          'entry_key' => '235|40|18.0|ALL|85|170|91|',
          'conditions' => 
          array (
            0 => '11A',
            1 => '21B',
            2 => '21J',
            3 => '22B',
            4 => '22H',
            5 => '22L',
            6 => '24J',
            7 => '24M',
            8 => '54A',
            9 => 'Touring',
          ),
        ),
        10 => 
        array (
          'width_mm' => 255,
          'aspect' => 35,
          'diameter_in' => '18.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'REAR',
          'kw_min' => 85,
          'kw_max' => 170,
          'entry_key' => '255|35|18.0|REAR|85|170||',
          'conditions' => 
          array (
            0 => '10N',
            1 => '11A',
            2 => '22B',
            3 => '22F',
            4 => '22L',
            5 => '24D',
            6 => '51G',
            7 => '57F',
            8 => '68B',
            9 => 'Touring',
          ),
        ),
      ),
    ),
    4 => 
    array (
      'vehicle' => 'e90',
      'document' => 'abe-55255',
      'config' => '19-schwarz-matt',
      'row' => 
      array (
        'axle' => 'ALL',
        'build_from' => NULL,
        'build_to' => NULL,
        'permitted_width_min' => NULL,
        'permitted_width_max' => NULL,
        'permitted_et_min' => NULL,
        'permitted_et_max' => NULL,
        'centre_bore_mm' => NULL,
        'requires_entry' => 1,
        'entry_note_de' => NULL,
        'entry_override' => NULL,
        'entry_override_reason' => NULL,
        'source_page' => 3,
      ),
      'conditions' => 
      array (
        0 => 
        array (
          'code' => 'A12',
          'note_de' => NULL,
        ),
        1 => 
        array (
          'code' => 'A14',
          'note_de' => NULL,
        ),
        2 => 
        array (
          'code' => 'A18',
          'note_de' => NULL,
        ),
        3 => 
        array (
          'code' => 'S01',
          'note_de' => NULL,
        ),
        4 => 
        array (
          'code' => 'V19',
          'note_de' => NULL,
        ),
      ),
      'sizes' => 
      array (
        0 => 
        array (
          'width_mm' => 225,
          'aspect' => 35,
          'diameter_in' => '19.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'FRONT',
          'kw_min' => 85,
          'kw_max' => 225,
          'entry_key' => '225|35|19.0|FRONT|85|225||',
          'conditions' => 
          array (
            0 => 'Car',
            1 => 'Lim',
            2 => 'R02',
            3 => 'T84',
            4 => 'T88',
          ),
        ),
        1 => 
        array (
          'width_mm' => 225,
          'aspect' => 35,
          'diameter_in' => '19.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'REAR',
          'kw_min' => 85,
          'kw_max' => 225,
          'entry_key' => '225|35|19.0|REAR|85|225||',
          'conditions' => 
          array (
            0 => 'Lim',
            1 => 'R03',
            2 => 'T88',
          ),
        ),
        2 => 
        array (
          'width_mm' => 235,
          'aspect' => 35,
          'diameter_in' => '19.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'ALL',
          'kw_min' => 85,
          'kw_max' => 225,
          'entry_key' => '235|35|19.0|ALL|85|225||',
          'conditions' => 
          array (
            0 => 'A01',
            1 => 'Car',
            2 => 'G01',
            3 => 'Lim',
            4 => 'T87',
            5 => 'T91',
          ),
        ),
        3 => 
        array (
          'width_mm' => 255,
          'aspect' => 30,
          'diameter_in' => '19.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'REAR',
          'kw_min' => 85,
          'kw_max' => 225,
          'entry_key' => '255|30|19.0|REAR|85|225||',
          'conditions' => 
          array (
            0 => 'Car',
            1 => 'Lim',
            2 => 'R03',
            3 => 'T91',
          ),
        ),
      ),
    ),
    5 => 
    array (
      'vehicle' => 'e90',
      'document' => 'abe-55255',
      'config' => '19-bronze-matt',
      'row' => 
      array (
        'axle' => 'ALL',
        'build_from' => NULL,
        'build_to' => NULL,
        'permitted_width_min' => NULL,
        'permitted_width_max' => NULL,
        'permitted_et_min' => NULL,
        'permitted_et_max' => NULL,
        'centre_bore_mm' => NULL,
        'requires_entry' => 1,
        'entry_note_de' => NULL,
        'entry_override' => NULL,
        'entry_override_reason' => NULL,
        'source_page' => 3,
      ),
      'conditions' => 
      array (
        0 => 
        array (
          'code' => 'A12',
          'note_de' => NULL,
        ),
        1 => 
        array (
          'code' => 'A14',
          'note_de' => NULL,
        ),
        2 => 
        array (
          'code' => 'A18',
          'note_de' => NULL,
        ),
        3 => 
        array (
          'code' => 'S01',
          'note_de' => NULL,
        ),
        4 => 
        array (
          'code' => 'V19',
          'note_de' => NULL,
        ),
      ),
      'sizes' => 
      array (
        0 => 
        array (
          'width_mm' => 225,
          'aspect' => 35,
          'diameter_in' => '19.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'FRONT',
          'kw_min' => 85,
          'kw_max' => 225,
          'entry_key' => '225|35|19.0|FRONT|85|225||',
          'conditions' => 
          array (
            0 => 'Car',
            1 => 'Lim',
            2 => 'R02',
            3 => 'T84',
            4 => 'T88',
          ),
        ),
        1 => 
        array (
          'width_mm' => 225,
          'aspect' => 35,
          'diameter_in' => '19.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'REAR',
          'kw_min' => 85,
          'kw_max' => 225,
          'entry_key' => '225|35|19.0|REAR|85|225||',
          'conditions' => 
          array (
            0 => 'Lim',
            1 => 'R03',
            2 => 'T88',
          ),
        ),
        2 => 
        array (
          'width_mm' => 235,
          'aspect' => 35,
          'diameter_in' => '19.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'ALL',
          'kw_min' => 85,
          'kw_max' => 225,
          'entry_key' => '235|35|19.0|ALL|85|225||',
          'conditions' => 
          array (
            0 => 'A01',
            1 => 'Car',
            2 => 'G01',
            3 => 'Lim',
            4 => 'T87',
            5 => 'T91',
          ),
        ),
        3 => 
        array (
          'width_mm' => 255,
          'aspect' => 30,
          'diameter_in' => '19.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'REAR',
          'kw_min' => 85,
          'kw_max' => 225,
          'entry_key' => '255|30|19.0|REAR|85|225||',
          'conditions' => 
          array (
            0 => 'Car',
            1 => 'Lim',
            2 => 'R03',
            3 => 'T91',
          ),
        ),
      ),
    ),
    6 => 
    array (
      'vehicle' => 'e90',
      'document' => 'nachtrag-366-0350-21',
      'config' => '18-schwarz-matt',
      'row' => 
      array (
        'axle' => 'ALL',
        'build_from' => NULL,
        'build_to' => NULL,
        'permitted_width_min' => NULL,
        'permitted_width_max' => NULL,
        'permitted_et_min' => NULL,
        'permitted_et_max' => NULL,
        'centre_bore_mm' => NULL,
        'requires_entry' => 0,
        'entry_note_de' => NULL,
        'entry_override' => NULL,
        'entry_override_reason' => NULL,
        'source_page' => 7,
      ),
      'conditions' => 
      array (
        0 => 
        array (
          'code' => '10B',
          'note_de' => NULL,
        ),
        1 => 
        array (
          'code' => '11B',
          'note_de' => NULL,
        ),
        2 => 
        array (
          'code' => '11G',
          'note_de' => NULL,
        ),
        3 => 
        array (
          'code' => '11H',
          'note_de' => NULL,
        ),
        4 => 
        array (
          'code' => '12A',
          'note_de' => NULL,
        ),
        5 => 
        array (
          'code' => '51A',
          'note_de' => NULL,
        ),
        6 => 
        array (
          'code' => '71C',
          'note_de' => NULL,
        ),
        7 => 
        array (
          'code' => '71K',
          'note_de' => NULL,
        ),
        8 => 
        array (
          'code' => '721',
          'note_de' => NULL,
        ),
        9 => 
        array (
          'code' => '725',
          'note_de' => NULL,
        ),
        10 => 
        array (
          'code' => '729',
          'note_de' => NULL,
        ),
        11 => 
        array (
          'code' => '73C',
          'note_de' => NULL,
        ),
        12 => 
        array (
          'code' => '74A',
          'note_de' => NULL,
        ),
        13 => 
        array (
          'code' => 'Heckantrieb',
          'note_de' => NULL,
        ),
      ),
      'sizes' => 
      array (
        0 => 
        array (
          'width_mm' => 225,
          'aspect' => 40,
          'diameter_in' => '18.0',
          'min_load_index' => 88,
          'min_speed_symbol' => 'W',
          'axle' => 'ALL',
          'kw_min' => 85,
          'kw_max' => 127,
          'entry_key' => '225|40|18.0|ALL|85|127|88|W',
          'conditions' => 
          array (
            0 => '5FE',
            1 => 'Limousine',
          ),
        ),
        1 => 
        array (
          'width_mm' => 245,
          'aspect' => 35,
          'diameter_in' => '18.0',
          'min_load_index' => 88,
          'min_speed_symbol' => 'W',
          'axle' => 'REAR',
          'kw_min' => 85,
          'kw_max' => 127,
          'entry_key' => '245|35|18.0|REAR|85|127|88|W',
          'conditions' => 
          array (
            0 => '57F',
            1 => '5FE',
            2 => '68T',
            3 => 'Limousine',
          ),
        ),
        2 => 
        array (
          'width_mm' => 225,
          'aspect' => 40,
          'diameter_in' => '18.0',
          'min_load_index' => 92,
          'min_speed_symbol' => NULL,
          'axle' => 'ALL',
          'kw_min' => 85,
          'kw_max' => 190,
          'entry_key' => '225|40|18.0|ALL|85|190|92|',
          'conditions' => 
          array (
            0 => 'Limousine',
            1 => 'Nicht 330D',
          ),
        ),
        3 => 
        array (
          'width_mm' => 245,
          'aspect' => 35,
          'diameter_in' => '18.0',
          'min_load_index' => 92,
          'min_speed_symbol' => NULL,
          'axle' => 'REAR',
          'kw_min' => 85,
          'kw_max' => 190,
          'entry_key' => '245|35|18.0|REAR|85|190|92|',
          'conditions' => 
          array (
            0 => '57F',
            1 => '68T',
            2 => 'Limousine',
            3 => 'Nicht 330D',
          ),
        ),
        4 => 
        array (
          'width_mm' => 225,
          'aspect' => 40,
          'diameter_in' => '18.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'FRONT',
          'kw_min' => 85,
          'kw_max' => 225,
          'entry_key' => '225|40|18.0|FRONT|85|225||',
          'conditions' => 
          array (
            0 => '51G',
            1 => '57E',
            2 => '68B',
            3 => '68T',
            4 => 'Limousine',
          ),
        ),
        5 => 
        array (
          'width_mm' => 235,
          'aspect' => 40,
          'diameter_in' => '18.0',
          'min_load_index' => 91,
          'min_speed_symbol' => NULL,
          'axle' => 'ALL',
          'kw_min' => 85,
          'kw_max' => 225,
          'entry_key' => '235|40|18.0|ALL|85|225|91|',
          'conditions' => 
          array (
            0 => 'Limousine',
          ),
        ),
        6 => 
        array (
          'width_mm' => 255,
          'aspect' => 35,
          'diameter_in' => '18.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'REAR',
          'kw_min' => 85,
          'kw_max' => 225,
          'entry_key' => '255|35|18.0|REAR|85|225||',
          'conditions' => 
          array (
            0 => '51G',
            1 => '57F',
            2 => '68B',
            3 => 'Limousine',
          ),
        ),
        7 => 
        array (
          'width_mm' => 225,
          'aspect' => 40,
          'diameter_in' => '18.0',
          'min_load_index' => 92,
          'min_speed_symbol' => 'Y',
          'axle' => 'ALL',
          'kw_min' => 89,
          'kw_max' => 190,
          'entry_key' => '225|40|18.0|ALL|89|190|92|Y',
          'conditions' => 
          array (
            0 => '75I',
            1 => 'Nicht 330D',
            2 => 'Touring',
          ),
        ),
        8 => 
        array (
          'width_mm' => 245,
          'aspect' => 35,
          'diameter_in' => '18.0',
          'min_load_index' => 92,
          'min_speed_symbol' => 'Y',
          'axle' => 'REAR',
          'kw_min' => 89,
          'kw_max' => 190,
          'entry_key' => '245|35|18.0|REAR|89|190|92|Y',
          'conditions' => 
          array (
            0 => '57F',
            1 => '68T',
            2 => '75I',
            3 => 'Nicht 330D',
            4 => 'Touring',
          ),
        ),
        9 => 
        array (
          'width_mm' => 225,
          'aspect' => 40,
          'diameter_in' => '18.0',
          'min_load_index' => 88,
          'min_speed_symbol' => 'Y',
          'axle' => 'FRONT',
          'kw_min' => 89,
          'kw_max' => 225,
          'entry_key' => '225|40|18.0|FRONT|89|225|88|Y',
          'conditions' => 
          array (
            0 => '57E',
            1 => '68B',
            2 => '68T',
            3 => '75I',
            4 => 'Touring',
          ),
        ),
        10 => 
        array (
          'width_mm' => 235,
          'aspect' => 40,
          'diameter_in' => '18.0',
          'min_load_index' => 91,
          'min_speed_symbol' => 'Y',
          'axle' => 'ALL',
          'kw_min' => 89,
          'kw_max' => 225,
          'entry_key' => '235|40|18.0|ALL|89|225|91|Y',
          'conditions' => 
          array (
            0 => '75I',
            1 => 'Touring',
          ),
        ),
        11 => 
        array (
          'width_mm' => 255,
          'aspect' => 35,
          'diameter_in' => '18.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'REAR',
          'kw_min' => 89,
          'kw_max' => 225,
          'entry_key' => '255|35|18.0|REAR|89|225||',
          'conditions' => 
          array (
            0 => '51G',
            1 => '57F',
            2 => '68B',
            3 => '75I',
            4 => 'Touring',
          ),
        ),
      ),
    ),
    7 => 
    array (
      'vehicle' => 'e90',
      'document' => 'nachtrag-366-0350-21',
      'config' => '18-bronze-matt',
      'row' => 
      array (
        'axle' => 'ALL',
        'build_from' => NULL,
        'build_to' => NULL,
        'permitted_width_min' => NULL,
        'permitted_width_max' => NULL,
        'permitted_et_min' => NULL,
        'permitted_et_max' => NULL,
        'centre_bore_mm' => NULL,
        'requires_entry' => 0,
        'entry_note_de' => NULL,
        'entry_override' => NULL,
        'entry_override_reason' => NULL,
        'source_page' => 7,
      ),
      'conditions' => 
      array (
        0 => 
        array (
          'code' => '10B',
          'note_de' => NULL,
        ),
        1 => 
        array (
          'code' => '11B',
          'note_de' => NULL,
        ),
        2 => 
        array (
          'code' => '11G',
          'note_de' => NULL,
        ),
        3 => 
        array (
          'code' => '11H',
          'note_de' => NULL,
        ),
        4 => 
        array (
          'code' => '12A',
          'note_de' => NULL,
        ),
        5 => 
        array (
          'code' => '51A',
          'note_de' => NULL,
        ),
        6 => 
        array (
          'code' => '71C',
          'note_de' => NULL,
        ),
        7 => 
        array (
          'code' => '71K',
          'note_de' => NULL,
        ),
        8 => 
        array (
          'code' => '721',
          'note_de' => NULL,
        ),
        9 => 
        array (
          'code' => '725',
          'note_de' => NULL,
        ),
        10 => 
        array (
          'code' => '729',
          'note_de' => NULL,
        ),
        11 => 
        array (
          'code' => '73C',
          'note_de' => NULL,
        ),
        12 => 
        array (
          'code' => '74A',
          'note_de' => NULL,
        ),
        13 => 
        array (
          'code' => 'Heckantrieb',
          'note_de' => NULL,
        ),
      ),
      'sizes' => 
      array (
        0 => 
        array (
          'width_mm' => 225,
          'aspect' => 40,
          'diameter_in' => '18.0',
          'min_load_index' => 88,
          'min_speed_symbol' => 'W',
          'axle' => 'ALL',
          'kw_min' => 85,
          'kw_max' => 127,
          'entry_key' => '225|40|18.0|ALL|85|127|88|W',
          'conditions' => 
          array (
            0 => '5FE',
            1 => 'Limousine',
          ),
        ),
        1 => 
        array (
          'width_mm' => 245,
          'aspect' => 35,
          'diameter_in' => '18.0',
          'min_load_index' => 88,
          'min_speed_symbol' => 'W',
          'axle' => 'REAR',
          'kw_min' => 85,
          'kw_max' => 127,
          'entry_key' => '245|35|18.0|REAR|85|127|88|W',
          'conditions' => 
          array (
            0 => '57F',
            1 => '5FE',
            2 => '68T',
            3 => 'Limousine',
          ),
        ),
        2 => 
        array (
          'width_mm' => 225,
          'aspect' => 40,
          'diameter_in' => '18.0',
          'min_load_index' => 92,
          'min_speed_symbol' => NULL,
          'axle' => 'ALL',
          'kw_min' => 85,
          'kw_max' => 190,
          'entry_key' => '225|40|18.0|ALL|85|190|92|',
          'conditions' => 
          array (
            0 => 'Limousine',
            1 => 'Nicht 330D',
          ),
        ),
        3 => 
        array (
          'width_mm' => 245,
          'aspect' => 35,
          'diameter_in' => '18.0',
          'min_load_index' => 92,
          'min_speed_symbol' => NULL,
          'axle' => 'REAR',
          'kw_min' => 85,
          'kw_max' => 190,
          'entry_key' => '245|35|18.0|REAR|85|190|92|',
          'conditions' => 
          array (
            0 => '57F',
            1 => '68T',
            2 => 'Limousine',
            3 => 'Nicht 330D',
          ),
        ),
        4 => 
        array (
          'width_mm' => 225,
          'aspect' => 40,
          'diameter_in' => '18.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'FRONT',
          'kw_min' => 85,
          'kw_max' => 225,
          'entry_key' => '225|40|18.0|FRONT|85|225||',
          'conditions' => 
          array (
            0 => '51G',
            1 => '57E',
            2 => '68B',
            3 => '68T',
            4 => 'Limousine',
          ),
        ),
        5 => 
        array (
          'width_mm' => 235,
          'aspect' => 40,
          'diameter_in' => '18.0',
          'min_load_index' => 91,
          'min_speed_symbol' => NULL,
          'axle' => 'ALL',
          'kw_min' => 85,
          'kw_max' => 225,
          'entry_key' => '235|40|18.0|ALL|85|225|91|',
          'conditions' => 
          array (
            0 => 'Limousine',
          ),
        ),
        6 => 
        array (
          'width_mm' => 255,
          'aspect' => 35,
          'diameter_in' => '18.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'REAR',
          'kw_min' => 85,
          'kw_max' => 225,
          'entry_key' => '255|35|18.0|REAR|85|225||',
          'conditions' => 
          array (
            0 => '51G',
            1 => '57F',
            2 => '68B',
            3 => 'Limousine',
          ),
        ),
        7 => 
        array (
          'width_mm' => 225,
          'aspect' => 40,
          'diameter_in' => '18.0',
          'min_load_index' => 92,
          'min_speed_symbol' => 'Y',
          'axle' => 'ALL',
          'kw_min' => 89,
          'kw_max' => 190,
          'entry_key' => '225|40|18.0|ALL|89|190|92|Y',
          'conditions' => 
          array (
            0 => '75I',
            1 => 'Nicht 330D',
            2 => 'Touring',
          ),
        ),
        8 => 
        array (
          'width_mm' => 245,
          'aspect' => 35,
          'diameter_in' => '18.0',
          'min_load_index' => 92,
          'min_speed_symbol' => 'Y',
          'axle' => 'REAR',
          'kw_min' => 89,
          'kw_max' => 190,
          'entry_key' => '245|35|18.0|REAR|89|190|92|Y',
          'conditions' => 
          array (
            0 => '57F',
            1 => '68T',
            2 => '75I',
            3 => 'Nicht 330D',
            4 => 'Touring',
          ),
        ),
        9 => 
        array (
          'width_mm' => 225,
          'aspect' => 40,
          'diameter_in' => '18.0',
          'min_load_index' => 88,
          'min_speed_symbol' => 'Y',
          'axle' => 'FRONT',
          'kw_min' => 89,
          'kw_max' => 225,
          'entry_key' => '225|40|18.0|FRONT|89|225|88|Y',
          'conditions' => 
          array (
            0 => '57E',
            1 => '68B',
            2 => '68T',
            3 => '75I',
            4 => 'Touring',
          ),
        ),
        10 => 
        array (
          'width_mm' => 235,
          'aspect' => 40,
          'diameter_in' => '18.0',
          'min_load_index' => 91,
          'min_speed_symbol' => 'Y',
          'axle' => 'ALL',
          'kw_min' => 89,
          'kw_max' => 225,
          'entry_key' => '235|40|18.0|ALL|89|225|91|Y',
          'conditions' => 
          array (
            0 => '75I',
            1 => 'Touring',
          ),
        ),
        11 => 
        array (
          'width_mm' => 255,
          'aspect' => 35,
          'diameter_in' => '18.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'REAR',
          'kw_min' => 89,
          'kw_max' => 225,
          'entry_key' => '255|35|18.0|REAR|89|225||',
          'conditions' => 
          array (
            0 => '51G',
            1 => '57F',
            2 => '68B',
            3 => '75I',
            4 => 'Touring',
          ),
        ),
      ),
    ),
    8 => 
    array (
      'vehicle' => 'x3',
      'document' => 'abe-55255',
      'config' => '19-schwarz-matt',
      'row' => 
      array (
        'axle' => 'ALL',
        'build_from' => NULL,
        'build_to' => NULL,
        'permitted_width_min' => NULL,
        'permitted_width_max' => NULL,
        'permitted_et_min' => NULL,
        'permitted_et_max' => NULL,
        'centre_bore_mm' => NULL,
        'requires_entry' => 1,
        'entry_note_de' => NULL,
        'entry_override' => NULL,
        'entry_override_reason' => NULL,
        'source_page' => 5,
      ),
      'conditions' => 
      array (
        0 => 
        array (
          'code' => 'A14',
          'note_de' => NULL,
        ),
        1 => 
        array (
          'code' => 'A18',
          'note_de' => NULL,
        ),
        2 => 
        array (
          'code' => 'S03',
          'note_de' => NULL,
        ),
        3 => 
        array (
          'code' => 'V19',
          'note_de' => NULL,
        ),
      ),
      'sizes' => 
      array (
        0 => 
        array (
          'width_mm' => 235,
          'aspect' => 45,
          'diameter_in' => '19.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'ALL',
          'kw_min' => 100,
          'kw_max' => 210,
          'entry_key' => '235|45|19.0|ALL|100|210||',
          'conditions' => 
          array (
            0 => 'A10',
            1 => 'T95',
            2 => 'T99',
          ),
        ),
        1 => 
        array (
          'width_mm' => 245,
          'aspect' => 40,
          'diameter_in' => '19.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'ALL',
          'kw_min' => 100,
          'kw_max' => 210,
          'entry_key' => '245|40|19.0|ALL|100|210||',
          'conditions' => 
          array (
            0 => 'A10',
            1 => 'T94',
            2 => 'T98',
          ),
        ),
        2 => 
        array (
          'width_mm' => 255,
          'aspect' => 40,
          'diameter_in' => '19.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'ALL',
          'kw_min' => 100,
          'kw_max' => 210,
          'entry_key' => '255|40|19.0|ALL|100|210||',
          'conditions' => 
          array (
            0 => 'A01',
            1 => 'A12',
            2 => 'K1b',
            3 => 'K2b',
          ),
        ),
      ),
    ),
    9 => 
    array (
      'vehicle' => 'x3',
      'document' => 'abe-55255',
      'config' => '19-bronze-matt',
      'row' => 
      array (
        'axle' => 'ALL',
        'build_from' => NULL,
        'build_to' => NULL,
        'permitted_width_min' => NULL,
        'permitted_width_max' => NULL,
        'permitted_et_min' => NULL,
        'permitted_et_max' => NULL,
        'centre_bore_mm' => NULL,
        'requires_entry' => 1,
        'entry_note_de' => NULL,
        'entry_override' => NULL,
        'entry_override_reason' => NULL,
        'source_page' => 5,
      ),
      'conditions' => 
      array (
        0 => 
        array (
          'code' => 'A14',
          'note_de' => NULL,
        ),
        1 => 
        array (
          'code' => 'A18',
          'note_de' => NULL,
        ),
        2 => 
        array (
          'code' => 'S03',
          'note_de' => NULL,
        ),
        3 => 
        array (
          'code' => 'V19',
          'note_de' => NULL,
        ),
      ),
      'sizes' => 
      array (
        0 => 
        array (
          'width_mm' => 235,
          'aspect' => 45,
          'diameter_in' => '19.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'ALL',
          'kw_min' => 100,
          'kw_max' => 210,
          'entry_key' => '235|45|19.0|ALL|100|210||',
          'conditions' => 
          array (
            0 => 'A10',
            1 => 'T95',
            2 => 'T99',
          ),
        ),
        1 => 
        array (
          'width_mm' => 245,
          'aspect' => 40,
          'diameter_in' => '19.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'ALL',
          'kw_min' => 100,
          'kw_max' => 210,
          'entry_key' => '245|40|19.0|ALL|100|210||',
          'conditions' => 
          array (
            0 => 'A10',
            1 => 'T94',
            2 => 'T98',
          ),
        ),
        2 => 
        array (
          'width_mm' => 255,
          'aspect' => 40,
          'diameter_in' => '19.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'ALL',
          'kw_min' => 100,
          'kw_max' => 210,
          'entry_key' => '255|40|19.0|ALL|100|210||',
          'conditions' => 
          array (
            0 => 'A01',
            1 => 'A12',
            2 => 'K1b',
            3 => 'K2b',
          ),
        ),
      ),
    ),
    10 => 
    array (
      'vehicle' => 'x3',
      'document' => 'nachtrag-366-0350-21',
      'config' => '18-schwarz-matt',
      'row' => 
      array (
        'axle' => 'ALL',
        'build_from' => NULL,
        'build_to' => NULL,
        'permitted_width_min' => NULL,
        'permitted_width_max' => NULL,
        'permitted_et_min' => NULL,
        'permitted_et_max' => NULL,
        'centre_bore_mm' => NULL,
        'requires_entry' => 1,
        'entry_note_de' => NULL,
        'entry_override' => NULL,
        'entry_override_reason' => NULL,
        'source_page' => 2,
      ),
      'conditions' => 
      array (
        0 => 
        array (
          'code' => '10B',
          'note_de' => NULL,
        ),
        1 => 
        array (
          'code' => '11B',
          'note_de' => NULL,
        ),
        2 => 
        array (
          'code' => '11G',
          'note_de' => NULL,
        ),
        3 => 
        array (
          'code' => '11H',
          'note_de' => NULL,
        ),
        4 => 
        array (
          'code' => '12A',
          'note_de' => NULL,
        ),
        5 => 
        array (
          'code' => '51A',
          'note_de' => NULL,
        ),
        6 => 
        array (
          'code' => '71C',
          'note_de' => NULL,
        ),
        7 => 
        array (
          'code' => '71K',
          'note_de' => NULL,
        ),
        8 => 
        array (
          'code' => '721',
          'note_de' => NULL,
        ),
        9 => 
        array (
          'code' => '725',
          'note_de' => NULL,
        ),
        10 => 
        array (
          'code' => '73C',
          'note_de' => NULL,
        ),
        11 => 
        array (
          'code' => '74A',
          'note_de' => NULL,
        ),
        12 => 
        array (
          'code' => '75I',
          'note_de' => NULL,
        ),
      ),
      'sizes' => 
      array (
        0 => 
        array (
          'width_mm' => 235,
          'aspect' => 50,
          'diameter_in' => '18.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'ALL',
          'kw_min' => 100,
          'kw_max' => 210,
          'entry_key' => '235|50|18.0|ALL|100|210||',
          'conditions' => 
          array (
            0 => '11A',
            1 => '24J',
            2 => '24M',
            3 => '51G',
          ),
        ),
        1 => 
        array (
          'width_mm' => 245,
          'aspect' => 45,
          'diameter_in' => '18.0',
          'min_load_index' => 100,
          'min_speed_symbol' => NULL,
          'axle' => 'ALL',
          'kw_min' => 100,
          'kw_max' => 210,
          'entry_key' => '245|45|18.0|ALL|100|210|100|',
          'conditions' => 
          array (
            0 => '11A',
            1 => '24J',
            2 => '24M',
          ),
        ),
        2 => 
        array (
          'width_mm' => 245,
          'aspect' => 45,
          'diameter_in' => '18.0',
          'min_load_index' => 96,
          'min_speed_symbol' => 'W',
          'axle' => 'ALL',
          'kw_min' => 100,
          'kw_max' => 210,
          'entry_key' => '245|45|18.0|ALL|100|210|96|W',
          'conditions' => 
          array (
            0 => '11A',
            1 => '24J',
            2 => '24M',
          ),
        ),
        3 => 
        array (
          'width_mm' => 255,
          'aspect' => 45,
          'diameter_in' => '18.0',
          'min_load_index' => 99,
          'min_speed_symbol' => NULL,
          'axle' => 'ALL',
          'kw_min' => 100,
          'kw_max' => 210,
          'entry_key' => '255|45|18.0|ALL|100|210|99|',
          'conditions' => 
          array (
            0 => '11A',
            1 => '24J',
            2 => '24M',
          ),
        ),
      ),
    ),
    11 => 
    array (
      'vehicle' => 'x3',
      'document' => 'nachtrag-366-0350-21',
      'config' => '18-bronze-matt',
      'row' => 
      array (
        'axle' => 'ALL',
        'build_from' => NULL,
        'build_to' => NULL,
        'permitted_width_min' => NULL,
        'permitted_width_max' => NULL,
        'permitted_et_min' => NULL,
        'permitted_et_max' => NULL,
        'centre_bore_mm' => NULL,
        'requires_entry' => 1,
        'entry_note_de' => NULL,
        'entry_override' => NULL,
        'entry_override_reason' => NULL,
        'source_page' => 2,
      ),
      'conditions' => 
      array (
        0 => 
        array (
          'code' => '10B',
          'note_de' => NULL,
        ),
        1 => 
        array (
          'code' => '11B',
          'note_de' => NULL,
        ),
        2 => 
        array (
          'code' => '11G',
          'note_de' => NULL,
        ),
        3 => 
        array (
          'code' => '11H',
          'note_de' => NULL,
        ),
        4 => 
        array (
          'code' => '12A',
          'note_de' => NULL,
        ),
        5 => 
        array (
          'code' => '51A',
          'note_de' => NULL,
        ),
        6 => 
        array (
          'code' => '71C',
          'note_de' => NULL,
        ),
        7 => 
        array (
          'code' => '71K',
          'note_de' => NULL,
        ),
        8 => 
        array (
          'code' => '721',
          'note_de' => NULL,
        ),
        9 => 
        array (
          'code' => '725',
          'note_de' => NULL,
        ),
        10 => 
        array (
          'code' => '73C',
          'note_de' => NULL,
        ),
        11 => 
        array (
          'code' => '74A',
          'note_de' => NULL,
        ),
        12 => 
        array (
          'code' => '75I',
          'note_de' => NULL,
        ),
      ),
      'sizes' => 
      array (
        0 => 
        array (
          'width_mm' => 235,
          'aspect' => 50,
          'diameter_in' => '18.0',
          'min_load_index' => NULL,
          'min_speed_symbol' => NULL,
          'axle' => 'ALL',
          'kw_min' => 100,
          'kw_max' => 210,
          'entry_key' => '235|50|18.0|ALL|100|210||',
          'conditions' => 
          array (
            0 => '11A',
            1 => '24J',
            2 => '24M',
            3 => '51G',
          ),
        ),
        1 => 
        array (
          'width_mm' => 245,
          'aspect' => 45,
          'diameter_in' => '18.0',
          'min_load_index' => 100,
          'min_speed_symbol' => NULL,
          'axle' => 'ALL',
          'kw_min' => 100,
          'kw_max' => 210,
          'entry_key' => '245|45|18.0|ALL|100|210|100|',
          'conditions' => 
          array (
            0 => '11A',
            1 => '24J',
            2 => '24M',
          ),
        ),
        2 => 
        array (
          'width_mm' => 245,
          'aspect' => 45,
          'diameter_in' => '18.0',
          'min_load_index' => 96,
          'min_speed_symbol' => 'W',
          'axle' => 'ALL',
          'kw_min' => 100,
          'kw_max' => 210,
          'entry_key' => '245|45|18.0|ALL|100|210|96|W',
          'conditions' => 
          array (
            0 => '11A',
            1 => '24J',
            2 => '24M',
          ),
        ),
        3 => 
        array (
          'width_mm' => 255,
          'aspect' => 45,
          'diameter_in' => '18.0',
          'min_load_index' => 99,
          'min_speed_symbol' => NULL,
          'axle' => 'ALL',
          'kw_min' => 100,
          'kw_max' => 210,
          'entry_key' => '255|45|18.0|ALL|100|210|99|',
          'conditions' => 
          array (
            0 => '11A',
            1 => '24J',
            2 => '24M',
          ),
        ),
      ),
    ),
  ),
  'templates' => 
  array (
    'e46' => 
    array (
      'type_designation' => '346L',
      'eg_nummer_raw' => 'e1*97/27*0097*..',
      'eg_nummer_norm' => 'e1*97/27*0097*..',
      'source_page' => 3,
    ),
    'e90' => 
    array (
      'type_designation' => '390L',
      'eg_nummer_raw' => 'e1*2001/116*0308*00-08',
      'eg_nummer_norm' => 'e1*2001/116*0308*00-08',
      'source_page' => 3,
    ),
    'x3' => 
    array (
      'type_designation' => 'X83',
      'eg_nummer_raw' => 'e1*2001/116*0249*..',
      'eg_nummer_norm' => 'e1*2001/116*0249*..',
      'source_page' => 5,
    ),
  ),
);
