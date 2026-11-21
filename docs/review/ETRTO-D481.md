# D-481: tyres rest on the Gutachten alone

The client's message of 19.11.2026 asked to remove every validation of load index and speed symbol that the
shop works out itself („we will manually ensure that the combinations are valid“). The operator authorised the
amendment of R-03 and R-06 in `CLAUDE.md`. This page lists what was removed, what was kept, and what the verdict
census showed. The reasons are in `docs/decisions.md`, D-479 and D-481.

## Removed

| Where | What it did |
|---|---|
| `FitmentResolver::tyreCheck` | Derived a minimum load index from the car's axle load (`LoadIndexDeriver::forAxleAt`, ETRTO's load table, D-459) and a minimum speed symbol from its top speed, including ETRTO's raise for „–“ symbols. |
| `FitmentResolver::tyreCheck` | Read load-index Auflagen against the car's axle load and dropped sizes from an axle (D-105, D-434). |
| `FitmentResolver::tyreCheck` | Used the index from the customer's own papers (field 8.1/8.2/T, D-242), and waited for those fields before the tyre half could be positive (D-286). |
| `FitmentResolver::tyreCheck` | Summed the binding axle and printed „Wir prüfen jede Achse mit ihrer eigenen Achslast …“ (struck by the client in the tyre step, 19.11.2026). |
| `FitmentResolver` | `sellsAlone` (D-289): the rim sold alone while the tyre half waited for the papers. With no wait there is nothing to sell around. |
| `TyreEligibility` | Rule 5 (no usable minimum, no Komplettrad) and the minimum sentence under the tyre list (`minimumSentenceDe`). |
| `MixedPair`, `WheelSet` | The per-axle minimum sentence of a mixed set. |
| `Komplettrad/Index.vue` | The two lines that printed those sentences in step 2. |
| `TyreVariantRequest` (Reifen › Katalog) | The ranges of width, aspect ratio, rim, load index (70–120) and the fixed list of symbols. Only the form of a size is checked now: width 100–999, aspect 10–99, rim `NN` or `NN,5`, load index 1–999, symbol one letter with an optional digit, optionally in brackets. A symbol the shop's table does not rank is stored with rank 0 (D-484). |
| Entry (D-479) | Plausibility checks of a size's figures in the five entry steps; a size like `305/70 R22.5 160F` is saved as written. |
| `DocumentRelease` (D-483) | The release question „Wie gibt das Gutachten Lastindex und Geschwindigkeitssymbol an?“ and its blocker, including „bei jeder Reifengröße“ held to both figures at every size. The question is gone from step 5 and from „Angaben“, with its suggestion and its route. |
| `LoadLimitCheck` (D-483) | A load-index Auflage (T88 „bis 1.125 kg“) held to twice the capacity of its index from ETRTO's table: the warning, the release blocker, the confirm form and its route. |
| `FitmentResolver::tyreCheck` (D-105) | A tyre-load Auflage settled from the car's axle loads. It is now said, and the answer is `CONDITIONAL`, never `PERMITTED`. |
| Fahrzeuge › Detail (D-483) | Field T asked for on account of a released Gutachten. No Gutachten needs the top speed for the tyres any more. |

## Kept

- The sizes a paper permits, matched exactly.
- The load index and speed symbol a paper prints beside a size. A tyre offered must meet or exceed them. Symbols are ranked, never compared as letters.
- A symbol the shop cannot rank (`F`, `A8`, `ZR`) is matched exactly and never guessed (fail-closed).
- A figure the paper does not print asks nothing.
- The paper's Auflagen about tyres are told to the customer and keep the answer `CONDITIONAL`.
- An Auflage code with no description still blocks the release.
- An unknown car, or one the paper does not list, stays fail-closed.
- The wheel's own approval where a document limits it by axle load and the car's load is unknown (D-289's wheel side).
- A combination listed for no type of the car (D-358).
- The wheel's tested load against a known axle load (C9 §4).
- A pure axle-load Auflage beside a size (5MK „bis 1.850 kg Achslast“, no load index named): at entry it still takes the size off an axle whose known load is above it. This is the paper's own rule, not a derived one.
- Answers already given to the removed question, and confirmations already written, stay in the database and the Protokoll.

## Verdict census

`php artisan rimify:erfassung-pruefen --nur-urteile` was run before and after on the same data, and the two dumps
were compared answer by answer. The comparison sorts each change into five groups: tyre half only (same status),
less strict, tyre-load Auflage said (`PERMITTED` → `CONDITIONAL` on the tyre half alone, with an Auflage of the kind
`reifen_tragfaehigkeit` present), stricter for any other reason, and wheel or codes changed. The last two groups stop the
release; the third is reported with its count.

| Database | Answers | Identical | Tyre half only | Less strict | Tyre-load Auflage said | Stricter | Wheel or codes |
|---|---:|---:|---:|---:|---:|---:|---:|
| Local demo shop (`rimify_wf_e2e`) | 2.039 | 876 | 1.163 | 0 | 0 | 0 | 0 |
| Local acceptance shop (`rimify_wf_abnahme_e2e`) | 16 | 0 | 16 | 0 | 0 | 0 | 0 |

The kind of change is the same in every case. The derived minimum on both axles is gone (`minLoadIndex` and
`minSpeedSymbol` from the car, now none, because these papers print no index beside their sizes). With it went
the sentences that explained the minimum (`tyreCheck.basis`, `lines`, `summary`, `fromVehicleData`). No status
changed, and no wheel half, Auflage code or Eintragung changed.

The preview's census is taken at the release that ships this change. Its result is added here with the release
number.
