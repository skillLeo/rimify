# The empty homepage, 06.10.2026

The operator's brief of 05.10.2026, §3: after the deploy, the hero on the empty catalogue at 1440 and 390 — the
photograph, the headline, the selector, the count reading 0, and the approved sentence. Layout shift was read before
every screenshot (Chromium, fonts loaded, 2,5 s at rest).

| File | Where | What it shows | CLS |
|---|---|---|---|
| `vorschau-1440.png` | preview, `ca823cae` | headline, selector, both hero photographs; under the fields „Hier ist noch kein Fahrzeug hinterlegt. Schreib uns, welches Auto du fährst.“ | 0,0001 |
| `vorschau-390.png` | preview | the phone's first screen: headline, subline, the panel with the same line under „Marke“ | 0,0000 |
| `vorschau-390-foto.png` | preview | the phone's hero photograph, below the first screen by design (D-166), scrolled to by finger | 0,0000 |
| `vorschau-sortiment-1440.png`, `-390.png` | preview | „Felgen aus dem Sortiment“: „Noch ist keine Felge im Sortiment.“ with the way to write | 0,0001 / 0,0000 |
| `lokal-fahrzeug-null-1440.png`, `-390.png` | local empty shop (E2eEmptyShopSeeder, same build) | a car chosen: „0 Felgen für dieses Fahrzeug“ on the button and the approved sentence „Noch ist keine Felge im Sortiment. Sobald die ersten mit Gutachten freigegeben sind, siehst du hier, welche an dein Auto dürfen.“ | 0,0066 / 0,0000 |

**Why the count is shown locally and not on the preview.** The reset to Shopdaten on 04.10 removed the cars along
with the catalogue (the level lists „Fahrzeuge“), so the preview's selector has no make to offer and no car can be
chosen there — the count and its sentence only appear once a car is chosen. The local empty shop holds the seed's
cars and no wheel, which is the state the brief describes. To see it on the preview, a car has to exist there:
imported vehicle data, or a car added to a Gutachten in the admin (Admin › Gutachten, its vehicles) — Admin ›
Fahrzeuge lists and corrects cars but does not create them.

The sentence under the fields on the preview is new (D-173): before, the key-number tab sent visitors to Marke &
Modell, which had nothing to offer.
