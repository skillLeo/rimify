# Vehicle data — the column mapping

What Fahrzeuge › Import (`VehicleImporter`, D-297) reads from a vehicle dataset, column by column. Written from the
code — `VehicleImporter::FIELDS` and `DatasetVehicle::fromRow()` — so that the check of his twenty-row sample has
something to compare against. Where this page and the code disagree, the code is right and this page is wrong.

## How a column is found

- The admin chooses the file's source (KBA-Typdaten, TecDoc, DAT). The mapping of that source's last import is used
  again for every column still in the file.
- Otherwise a column is found by its name, read as lower case, with ä, ö, ü, ß as ae, oe, ue, ss and everything
  but letters and digits removed: `Achslast vorn kg` reads as `achslastvornkg`, `fahrzeug_max_kmh` as
  `fahrzeugmaxkmh`. It is compared with the names in the table; the first that matches wins.
- Any column can be mapped by hand on the Probelauf's page. A required field without a column stops the Probelauf
  until one is mapped.

## The fields

| Field | Label in the admin | Required | Found under these names | Read as | When the value does not read |
|---|---|---|---|---|---|
| `hsn` | HSN (2.1) | yes | `hsn`, `herstellerschluesselnummer`, `herstellerschluessel`, `21`, `feld21` | 1 to 4 digits, leading zeros added (`5` → `0005`) | row refused — HSN and TSN both, or the row names no car |
| `tsn` | TSN (2.2) | yes | `tsn`, `typschluesselnummer`, `typschluessel`, `22`, `feld22` | 3 letters or digits, upper case | row refused |
| `hersteller` | Hersteller | yes | `hersteller`, `marke`, `make`, `manufacturer`, `d1` | text, at most 255 characters | empty: row refused; longer: row refused |
| `handelsname` | Modell (Handelsbezeichnung) | yes | `handelsname`, `handelsbezeichnung`, `modell`, `model`, `d3` | text, at most 255 characters | as above |
| `variante` | Variante | yes | `variante`, `variant`, `ausfuehrung`, `version`, `fahrzeugvariante` | text, at most 255 characters | empty: the model name stands in |
| `fahrzeugtyp` | Fahrzeugtyp (D.2) | no | `fahrzeugtyp`, `typ`, `type`, `d2` | text, at most 255 characters | longer: row refused |
| `eg_nummer` | EG-Typgenehmigungsnummer (K) | no | `egnummer`, `egtypgenehmigungsnummer`, `typgenehmigungsnummer`, `typgenehmigung`, `feldk`, `k` | an EG number with its extension, `e1*2007/46*0316*12` | stored empty, the row says so |
| `leistung_kw` | Leistung in kW (P.2) | no | `leistungkw`, `leistung`, `kw`, `p2` | a whole number, 10 to 1000 | stored empty, the row says so |
| `baubeginn` | Gebaut ab | yes | `baubeginn`, `bauvon`, `baujahrvon`, `gebautab`, `von`, `buildfrom` | `2015-03`, `2015-03-01`, `03.2015`, `03/2015`, `01.03.2015` | missing or unread: row refused — never an open window (R-02) |
| `bauende` | Gebaut bis | no | `bauende`, `baubis`, `baujahrbis`, `gebautbis`, `bis`, `buildto` | as Gebaut ab; a month ends on its last day; empty: still built | given and unread, or before the start: row refused |
| `karosserie` | Karosserie | no | `karosserie`, `karosserieform`, `aufbau`, `body` | one of Limousine, Kombi, Coupe, Cabrio, Schrägheck, SUV, Roadster, Van, in any case | stored empty, the row says so |
| `antrieb` | Antrieb | no | `antrieb`, `antriebsart`, `drive` | one of Allrad, Vorderachse, Hinterachse, in any case | stored empty, the row says so |
| `achslast_vorn_kg` | Achslast vorn in kg (8.1) | no | `achslastvornkg`, `achslastvorn`, `achslastvorne`, `81`, `feld81` | a whole number of kilograms, 300 to 4000; a German thousands dot is read (`1.050`) | stored empty, the row says so, the car waits under „Zur Prüfung“ (R-03) |
| `achslast_hinten_kg` | Achslast hinten in kg (8.2) | no | `achslasthintenkg`, `achslasthinten`, `82`, `feld82` | as 8.1 | as 8.1 |
| `hoechstgeschwindigkeit_kmh` | Höchstgeschwindigkeit in km/h (T) | no | `hoechstgeschwindigkeitkmh`, **`fahrzeugmaxkmh`**, `hoechstgeschwindigkeit`, `vmax`, `feldt`, `t` | a whole number of kilometres per hour, 60 to 420 | zero, blank or outside: stored empty — never as a number —, the row says so when a value was given, the car waits under „Zur Prüfung“ (R-03) |
| `fahrzeug_id` | Nummer des Fahrzeugs im Datensatz | no | `fahrzeugid`, `datensatzid`, `id` | a whole number, 1 to 4294967295 | the shop numbers the car itself; a number another car of this source carries, or twice in the file: row refused |

A car is written with `needs_review` until it has 8.1, 8.2 and T: it waits under Fahrzeuge › „Zur Prüfung“, and
tyres on it stay „Noch nicht bestätigt“ wherever the Gutachten needs those figures (R-03). A row whose key — HSN, TSN
and variant — another car already carries is planned against that car and never overwrites what a person entered or
what came from a Gutachten (D-297).

## His dataset, as far as he has named it

| His column | Field | On record |
|---|---|---|
| `fahrzeug_max_kmh` | T — top speed in km/h | His message of 19.10.2026: „the demo data includes the field `fahrzeug_max_kmh` … We can use it for allowed tires if the approval does not specify any speedindex.“ (D-287) |

Every other column of his file is still unknown: his twenty-row sample is the first look at it.

## The twenty-row check — what to compare

1. Each column of his sample against the table above: found by its name, or mapped by hand once.
2. **8.1 and 8.2 as two values in two columns.** One column holding both (`1050/1120`) reads as neither: both stored
   empty, every car under „Zur Prüfung“.
3. **T from `fahrzeug_max_kmh`**, kilometres per hour as a whole number.
4. HSN and TSN on every row; the variant; the build start as month and year.
5. The EG number with its extension — the join to the Gutachten.
6. Run it as a Probelauf on our own shop, which writes nothing — never a release for it. Under its counts it shows
   **what the file lacks**, over every row of the file whatever becomes of the row: rows without a usable T, without
   8.1 or 8.2, without HSN or TSN, without K — each as a count and as a share of the file (D-317). A value that is
   missing and one that does not read count alike. Those shares, with the counts of new, refused and unread rows and
   the reason of each refused one, are the report — before anyone buys the full set. If a third of the rows come
   without axle loads, that is the number he decides on.
7. Write the four shares into the record below, with the date and the file's name.

Two rules hold for these shares and for every share of a file the shop shows (D-318):

- **The denominator is every row of the file, refused rows included.** Without them a half-refused file would show
  flattering shares.
- **„Keine Spalte zugeordnet“ is not „fehlt im Datensatz“.** A field without a column was never read: its row says
  „Keine Spalte zugeordnet“ and carries no count and no share. We report what we mapped and what we read, never what
  his file does or does not contain (R-17).

## The sample and the full dataset, on record

Each run of his data is a Probelauf on our own shop. Its shares go here as the Probelauf shows them, with the date and
the file's name. When the full dataset has run, it is compared with the sample, and the comparison is written down
either way, a match included: a sample at 0 % missing axle loads beside a full file at 30 % was not representative
of what he bought, and he gets that in writing.

| Run | Date | File | Rows | No usable T | No 8.1 or 8.2 | No HSN or TSN | No K |
|---|---|---|---|---|---|---|---|
| The sample (twenty rows) | — | — | — | — | — | — | — |
| The full dataset | — | — | — | — | — | — | — |

**Comparison:** not yet — written when the full dataset has run, share by share against the sample, with whether the
sample was representative of what he bought.
